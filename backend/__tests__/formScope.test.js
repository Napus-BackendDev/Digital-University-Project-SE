const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongo = require('mongodb');

jest.mock('../server/Project/Form/controller/form', () => ({
    onQuerys: jest.fn(),
    onQuery: jest.fn(),
    onCreate: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    formPopulate: []
}));

jest.mock('../server/Project/User/controller/user', () => ({
    onQuery: jest.fn(),
    onCreate: jest.fn()
}));

jest.mock('../server/Project/Settings/service/message', () => ({
    sendResponse: (res, _num, code, data = null) => {
        const httpCode = Number(String(code).substring(0, 3));
        return res.status(httpCode).json({ code, httpcode: httpCode, data });
    },
    onMessage_Response: async (_num, code, data = null) => {
        const httpCode = Number(String(code).substring(0, 3));
        return { code, httpcode: httpCode, data };
    }
}));

jest.mock('../server/Project/Email/service/collaboration', () => ({
    maybeSendCollaborationInvites: jest.fn()
}));

jest.mock('../server/Project/Email/service/inviteOrganization', () => ({
    maybeSendOrganizationInvites: jest.fn()
}));

const FormController = require('../server/Project/Form/controller/form');
const UserController = require('../server/Project/User/controller/user');
const formRoutes = require('../server/Project/Form/form.routes');

describe('Form scope API integration (/api/v1/form/exp and /api/v1/form/user)', () => {
    let app;
    const originalEnv = process.env;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api/v1/form', formRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            APP_ENV: 'production',
            JWT_SECRET: 'form-scope-test-secret'
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('Production blocks unauthenticated GET /api/v1/form/exp and POST /api/v1/form/user with 401', async () => {
        const fakeAdminId = String(new mongo.ObjectId());
        const expRes = await request(app).get('/api/v1/form/exp').query({ userId: fakeAdminId });
        expect(expRes.status).toBe(401);

        const userRes = await request(app)
            .post('/api/v1/form/user')
            .send({ _id: fakeAdminId, mode: 'manage', isAdmin: true });
        expect(userRes.status).toBe(401);
        expect(FormController.onQuerys).not.toHaveBeenCalled();
    });

    test('Production ignores spoofed body._id and scopes manage forms strictly by verified JWT user', async () => {
        const studentId = String(new mongo.ObjectId());
        const adminId = String(new mongo.ObjectId());
        const studentToken = jwt.sign({ userId: studentId }, process.env.JWT_SECRET);

        UserController.onQuery.mockResolvedValue({
            _id: studentId,
            organization: String(new mongo.ObjectId()),
            role: { title: [{ key: 'en', value: 'Student' }] }
        });
        FormController.onQuerys.mockResolvedValue([]);

        const res = await request(app)
            .post('/api/v1/form/user')
            .set('Cookie', [`token=${studentToken}`])
            .send({ _id: adminId, mode: 'manage', isAdmin: true });

        expect(res.status).toBe(200);
        expect(UserController.onQuery).toHaveBeenCalledWith(
            { _id: expect.any(mongo.ObjectId) },
            [{ path: 'role' }],
            '_id organization role'
        );
        expect(String(UserController.onQuery.mock.calls[0][0]._id)).toBe(studentId);
        const mongoQuery = FormController.onQuerys.mock.calls[0][0];
        expect(mongoQuery.$or).toBeDefined();
        expect(String(mongoQuery.$or[0].creator)).toBe(studentId);
        expect(String(mongoQuery.$or[1].collaborator.$elemMatch.user)).toBe(studentId);
    });

    test('Respondent view (POST /api/v1/form/user) applies Audience Union rule and excludes unauthorized forms (B2-1)', async () => {
        const studentId = String(new mongo.ObjectId());
        const otherUserId = String(new mongo.ObjectId());
        const studentOrg = String(new mongo.ObjectId());
        const otherOrg = String(new mongo.ObjectId());
        const studentRoleId = String(new mongo.ObjectId());
        const studentToken = jwt.sign({ userId: studentId }, process.env.JWT_SECRET);

        UserController.onQuery.mockResolvedValue({
            _id: studentId,
            organization: studentOrg,
            role: { _id: studentRoleId, title: [{ key: 'en', value: 'Student' }] }
        });
        FormController.onQuerys.mockResolvedValue([
            {
                _id: 'f-union-org-member',
                organization: [studentOrg],
                settings: {
                    accessMode: 'private',
                    allowedRoles: [studentRoleId],
                    allowedUser: [otherUserId]
                }
            },
            {
                _id: 'f-individual-match',
                organization: [otherOrg],
                settings: {
                    accessMode: 'private',
                    allowedUser: [studentId]
                }
            },
            {
                _id: 'f-unauthorized',
                organization: [otherOrg],
                settings: {
                    accessMode: 'private',
                    allowedUser: [otherUserId],
                    allowedEmails: ['other@gmail.com']
                }
            }
        ]);

        const res = await request(app)
            .post('/api/v1/form/user')
            .set('Cookie', [`token=${studentToken}`])
            .send({ _id: studentId, mode: 'respondent' });

        expect(res.status).toBe(200);
        const mongoQuery = FormController.onQuerys.mock.calls[0][0];

        // Union query includes public branch, allowedUser branch, and org/role branches (no email on this user doc)
        expect(mongoQuery.$or).toBeDefined();
        expect(mongoQuery.$or.length).toBe(4);
        expect(mongoQuery.$or[0]).toEqual({ 'settings.accessMode': 'public' });
        expect(mongoQuery.$or[1]['settings.allowedUser']).toBeDefined();

        const orgRoleBranches = mongoQuery.$or.slice(2);
        expect(orgRoleBranches).toHaveLength(2);
        expect(orgRoleBranches.every((branch) => Array.isArray(branch.$and) && branch.$and[0].organization)).toBe(true);

        // Post-query filter keeps union matches (org/role member OR allowed individual) and excludes unauthorized forms
        expect(res.body.data.map((f) => f._id)).toEqual(['f-union-org-member', 'f-individual-match']);
    });

    test('Admin JWT queries all forms cleanly on both GET /api/v1/form/exp and POST /api/v1/form/user', async () => {
        const adminId = String(new mongo.ObjectId());
        const adminToken = jwt.sign({ userId: adminId }, process.env.JWT_SECRET);

        UserController.onQuery.mockResolvedValue({
            _id: adminId,
            role: { title: [{ key: 'en', value: 'Admin' }] }
        });
        FormController.onQuerys.mockResolvedValue([{ _id: 'f-1' }]);

        const expRes = await request(app)
            .get('/api/v1/form/exp')
            .set('Cookie', [`token=${adminToken}`]);
        expect(expRes.status).toBe(200);
        expect(FormController.onQuerys.mock.calls[0][0]).toEqual({});

        const manageRes = await request(app)
            .post('/api/v1/form/user')
            .set('Cookie', [`token=${adminToken}`])
            .send({ _id: adminId, mode: 'manage' });
        expect(manageRes.status).toBe(200);
        expect(FormController.onQuerys.mock.calls[1][0]).toEqual({});
    });

    test('Developer mode allows explicit userId fallback for ?switchUser QA inspection', async () => {
        process.env.APP_ENV = 'developer';
        const switchedStudentId = String(new mongo.ObjectId());
        const adminToken = jwt.sign({ userId: String(new mongo.ObjectId()) }, process.env.JWT_SECRET);

        UserController.onQuery.mockResolvedValue({
            _id: switchedStudentId,
            role: { title: [{ key: 'en', value: 'Student' }] }
        });
        FormController.onQuerys.mockResolvedValue([]);

        const res = await request(app)
            .get('/api/v1/form/exp')
            .query({ userId: switchedStudentId })
            .set('Cookie', [`token=${adminToken}`]);

        expect(res.status).toBe(200);
        expect(String(UserController.onQuery.mock.calls[0][0]._id)).toBe(switchedStudentId);
        const queryArg = FormController.onQuerys.mock.calls[0][0];
        expect(String(queryArg.$or[0].creator)).toBe(switchedStudentId);
    });

    test('PUT /api/v1/form enforces Creator/Editor/Admin write permission and blocks Collaborator Viewer or stranger with 403', async () => {
        const formId = String(new mongo.ObjectId());
        const creatorId = String(new mongo.ObjectId());
        const viewerId = String(new mongo.ObjectId());
        const editorId = String(new mongo.ObjectId());
        const strangerId = String(new mongo.ObjectId());

        const existingForm = {
            _id: formId,
            creator: { _id: creatorId },
            collaborator: [
                { user: { _id: viewerId }, type: { title: [{ key: 'en', value: 'Viewer' }] } },
                { user: { _id: editorId }, type: { title: [{ key: 'en', value: 'Editor' }] } }
            ]
        };

        // 1. Viewer blocked (403) even when passing valid JWT
        FormController.onQuery.mockResolvedValueOnce(existingForm);
        UserController.onQuery.mockResolvedValueOnce({
            _id: viewerId,
            role: { title: [{ key: 'en', value: 'Staff' }] }
        });
        const viewerToken = jwt.sign({ userId: viewerId }, process.env.JWT_SECRET);
        const viewerRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${viewerToken}`])
            .send({ _id: formId, title: [{ key: 'en', value: 'Tampered by Viewer' }] });
        expect(viewerRes.status).toBe(403);
        expect(FormController.onUpdate).not.toHaveBeenCalled();

        // 2. Stranger blocked (403)
        FormController.onQuery.mockResolvedValueOnce(existingForm);
        UserController.onQuery.mockResolvedValueOnce({
            _id: strangerId,
            role: { title: [{ key: 'en', value: 'Student' }] }
        });
        const strangerToken = jwt.sign({ userId: strangerId }, process.env.JWT_SECRET);
        const strangerRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${strangerToken}`])
            .send({ _id: formId, user: creatorId });
        expect(strangerRes.status).toBe(403);
        expect(FormController.onUpdate).not.toHaveBeenCalled();

        // 3. Editor allowed (200)
        FormController.onQuery.mockResolvedValueOnce(existingForm);
        UserController.onQuery.mockResolvedValueOnce({
            _id: editorId,
            role: { title: [{ key: 'en', value: 'Staff' }] }
        });
        FormController.onUpdate.mockResolvedValueOnce({ ...existingForm, title: [{ key: 'en', value: 'Edited' }] });
        const editorToken = jwt.sign({ userId: editorId }, process.env.JWT_SECRET);
        const editorRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${editorToken}`])
            .send({ _id: formId, title: [{ key: 'en', value: 'Edited' }] });
        expect(editorRes.status).toBe(200);
        expect(FormController.onUpdate).toHaveBeenCalledTimes(1);
    });

    test('POST /api/v1/form always initializes new forms as Draft and PUT rejects publishing past end dates', async () => {
        const creatorId = String(new mongo.ObjectId());
        const formId = String(new mongo.ObjectId());
        const token = jwt.sign({ userId: creatorId }, process.env.JWT_SECRET);

        // 1. Even if create payload tries to pass isPublished: true, server forces Draft (isPublished: false)
        UserController.onQuery.mockResolvedValue({ _id: creatorId, role: { title: [{ key: 'en', value: 'Staff' }] } });
        FormController.onCreate.mockImplementationOnce(async (payload) => ({ _id: formId, ...payload }));
        const createRes = await request(app)
            .post('/api/v1/form')
            .set('Cookie', [`token=${token}`])
            .send({
                title: [{ key: 'en', value: 'New Draft Form' }],
                schedule: { isPublished: true, mode: 'always' }
            });
        expect(createRes.status).toBe(200);
        expect(FormController.onCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                schedule: expect.objectContaining({ isPublished: false, mode: 'always' })
            })
        );

        // 2. PUT publishing with endAt in the past is rejected with 400 and reason END_IN_PAST
        const draftDoc = {
            _id: formId,
            creator: { _id: creatorId },
            schedule: { isPublished: false, mode: 'end_only', startAt: null, endAt: null }
        };
        FormController.onQuery.mockResolvedValueOnce(draftDoc);
        UserController.onQuery.mockResolvedValueOnce({ _id: creatorId, role: { title: [{ key: 'en', value: 'Staff' }] } });

        const pastPublishRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${token}`])
            .send({
                _id: formId,
                schedule: { isPublished: true, mode: 'end_only', endAt: '2020-01-01T00:00:00.000Z' }
            });
        expect(pastPublishRes.status).toBe(400);
        expect(pastPublishRes.body.data.reason).toBe('END_IN_PAST');
        expect(FormController.onUpdate).not.toHaveBeenCalled();

        // 3. PUT publishing valid end_only with future endAt succeeds and stamps startAt automatically
        FormController.onQuery.mockResolvedValueOnce(draftDoc);
        UserController.onQuery.mockResolvedValueOnce({ _id: creatorId, role: { title: [{ key: 'en', value: 'Staff' }] } });
        FormController.onUpdate.mockImplementationOnce(async (_q, payload) => ({ ...draftDoc, ...payload }));

        const validFutureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const validPublishRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${token}`])
            .send({
                _id: formId,
                schedule: { isPublished: true, mode: 'end_only', endAt: validFutureEnd }
            });
        expect(validPublishRes.status).toBe(200);
        const [, updatedPayload] = FormController.onUpdate.mock.calls[0];
        expect(updatedPayload.schedule.isPublished).toBe(true);
        expect(updatedPayload.schedule.mode).toBe('end_only');
        expect(updatedPayload.schedule.startAt).toBeTruthy();
        expect(updatedPayload.schedule.endAt).toBe(validFutureEnd);
    });

    test('PUT /api/v1/form sanitizes allowedEmails, decouples collectEmail from requireLogin, locks collectEmail in Private, and preserves Public overrides', async () => {
        const creatorId = String(new mongo.ObjectId());
        const externalUserId = String(new mongo.ObjectId());
        const orgSci = String(new mongo.ObjectId());
        const formId = String(new mongo.ObjectId());
        const creatorToken = jwt.sign({ userId: creatorId }, process.env.JWT_SECRET);

        const existingDoc = {
            _id: formId,
            creator: { _id: creatorId },
            schedule: { isPublished: true, mode: 'always' },
            settings: { collectEmail: false, requireLogin: false, allowedEmails: [] }
        };
        FormController.onQuery.mockResolvedValueOnce(existingDoc);
        UserController.onQuery.mockResolvedValueOnce({ _id: creatorId, role: { title: [{ key: 'en', value: 'Staff' }] } });
        FormController.onUpdate.mockImplementationOnce(async (_q, payload) => ({ ...existingDoc, ...payload }));

        const updateRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${creatorToken}`])
            .send({
                _id: formId,
                settings: {
                    accessMode: 'public',
                    requireLogin: true,
                    allowedEmails: [' Parent@Gmail.com ', 'invalid-email', 'parent@gmail.com', 'ALUMNI@gmail.com']
                }
            });

        expect(updateRes.status).toBe(200);
        const [, sanitizedPayload] = FormController.onUpdate.mock.calls[0];
        expect(sanitizedPayload.settings.accessMode).toBe('public');
        expect(sanitizedPayload.settings.requireLogin).toBe(true);
        // Consolidated Public mode syncs collectEmail with requireLogin
        expect(sanitizedPayload.settings.collectEmail).toBe(true);
        expect(sanitizedPayload.settings.allowedEmails).toEqual(['parent@gmail.com', 'alumni@gmail.com']);

        // Private mode forces collectEmail: true without touching requireLogin
        FormController.onQuery.mockResolvedValueOnce(existingDoc);
        UserController.onQuery.mockResolvedValueOnce({ _id: creatorId, role: { title: [{ key: 'en', value: 'Staff' }] } });
        FormController.onUpdate.mockImplementationOnce(async (_q, payload) => ({ ...existingDoc, ...payload }));

        const privateRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${creatorToken}`])
            .send({
                _id: formId,
                organization: [orgSci],
                settings: {
                    accessMode: 'private',
                    collectEmail: false,
                    requireLogin: false
                }
            });

        expect(privateRes.status).toBe(200);
        const [, privatePayload] = FormController.onUpdate.mock.calls[1];
        expect(privatePayload.settings.accessMode).toBe('private');
        expect(privatePayload.settings.collectEmail).toBe(true);
        expect(privatePayload.settings.requireLogin).toBe(false);

        const externalToken = jwt.sign({ userId: externalUserId }, process.env.JWT_SECRET);
        UserController.onQuery.mockResolvedValueOnce({
            _id: externalUserId,
            email: 'Parent@Gmail.com',
            organization: null,
            role: { _id: String(new mongo.ObjectId()), title: [{ key: 'en', value: 'Student' }] }
        });
        FormController.onQuerys.mockResolvedValueOnce([
            { _id: 'f-match', settings: { allowedEmails: ['parent@gmail.com'] } },
            { _id: 'f-public-with-preserved', organization: [orgSci], settings: { accessMode: 'public', allowedEmails: ['someoneelse@gmail.com'] } },
            { _id: 'f-other', settings: { allowedEmails: ['someoneelse@gmail.com'] } }
        ]);

        const listRes = await request(app)
            .post('/api/v1/form/user')
            .set('Cookie', [`token=${externalToken}`])
            .send({ _id: externalUserId, mode: 'respondent' });

        expect(listRes.status).toBe(200);
        const mongoQuery = FormController.onQuerys.mock.calls[0][0];
        expect(mongoQuery.$or).toEqual(
            expect.arrayContaining([{ 'settings.allowedEmails': 'parent@gmail.com' }])
        );
        expect(listRes.body.data.map((f) => f._id)).toEqual(['f-match', 'f-public-with-preserved']);
    });

    test('binds allowedRoles strictly under organization in query/update and clears orphan allowedRoles when organization is empty', async () => {
        const creatorId = String(new mongo.ObjectId());
        const studentId = String(new mongo.ObjectId());
        const orgSci = String(new mongo.ObjectId());
        const orgIt = String(new mongo.ObjectId());
        const roleStudent = String(new mongo.ObjectId());
        const formId = String(new mongo.ObjectId());

        const creatorToken = jwt.sign({ userId: creatorId }, process.env.JWT_SECRET);
        const existingDoc = {
            _id: formId,
            creator: { _id: creatorId },
            organization: [orgSci],
            schedule: { isPublished: true, mode: 'always' },
            settings: { allowedRoles: [roleStudent] }
        };

        FormController.onQuery.mockResolvedValueOnce(existingDoc);
        UserController.onQuery.mockResolvedValueOnce({ _id: creatorId, role: { title: [{ key: 'en', value: 'Staff' }] } });
        FormController.onUpdate.mockImplementationOnce(async (_q, payload) => ({ ...existingDoc, ...payload }));

        // Clearing organization in PUT clears orphaned allowedRoles
        const clearOrgRes = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${creatorToken}`])
            .send({
                _id: formId,
                organization: [],
                settings: { allowedRoles: [roleStudent] }
            });
        expect(clearOrgRes.status).toBe(200);
        const [, sanitizedPayload] = FormController.onUpdate.mock.calls[0];
        expect(sanitizedPayload.settings.allowedRoles).toEqual([]);

        // Respondent query combines organization AND role (Student in IT does NOT match Science + Student)
        const studentToken = jwt.sign({ userId: studentId }, process.env.JWT_SECRET);
        UserController.onQuery.mockResolvedValueOnce({
            _id: studentId,
            email: 'student.it@lamduan.mfu.ac.th',
            organization: orgIt,
            role: { _id: roleStudent, title: [{ key: 'en', value: 'Student' }] }
        });
        FormController.onQuerys.mockResolvedValueOnce([
            { _id: 'f-sci-student', organization: [orgSci], settings: { allowedRoles: [roleStudent] } },
            { _id: 'f-it-student', organization: [orgIt], settings: { allowedRoles: [roleStudent] } },
            { _id: 'f-orphan-role', organization: [], settings: { allowedRoles: [roleStudent] } }
        ]);

        const respondentRes = await request(app)
            .post('/api/v1/form/user')
            .set('Cookie', [`token=${studentToken}`])
            .send({ _id: studentId, mode: 'respondent' });

        expect(respondentRes.status).toBe(200);
        const mongoQuery = FormController.onQuerys.mock.calls[0][0];
        const roleBranches = mongoQuery.$or.filter((branch) => Array.isArray(branch.$and));
        // Every org/role branch in the flat $or query MUST require an organization match (no standalone role branch)
        expect(roleBranches.length).toBeGreaterThanOrEqual(2);
        expect(roleBranches.every((branch) => Boolean(branch.$and[0] && branch.$and[0].organization))).toBe(true);
        expect(mongoQuery.$or.some((branch) => Boolean(branch['settings.allowedRoles']))).toBe(false);
        expect(respondentRes.body.data.map((f) => f._id)).toEqual(['f-it-student']);
    });

    test('resolves manual email collaborators by finding existing user or provisioning placeholder user before saving', async () => {
        const creatorId = String(new mongo.ObjectId());
        const existingCollabId = String(new mongo.ObjectId());
        const foundStaffId = String(new mongo.ObjectId());
        const createdExternalId = String(new mongo.ObjectId());
        const roleEditor = String(new mongo.ObjectId());
        const roleViewer = String(new mongo.ObjectId());
        const formId = String(new mongo.ObjectId());

        const creatorToken = jwt.sign({ userId: creatorId }, process.env.JWT_SECRET);
        const existingDoc = {
            _id: formId,
            creator: { _id: creatorId },
            schedule: { isPublished: false, mode: 'always' },
            collaborator: []
        };

        FormController.onQuery.mockResolvedValueOnce(existingDoc);
        UserController.onQuery
            .mockResolvedValueOnce({ _id: creatorId, role: { title: [{ key: 'en', value: 'Admin' }] } })
            .mockResolvedValueOnce({ _id: foundStaffId, email: 'registered.staff@mfu.ac.th' })
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ _id: foundStaffId, email: 'registered.staff@mfu.ac.th' });
        UserController.onCreate.mockResolvedValueOnce({
            _id: createdExternalId,
            name: 'saranjit.kh',
            email: 'saranjit.kh@summitthai.com'
        });
        FormController.onUpdate.mockImplementationOnce(async (_q, payload) => ({ ...existingDoc, ...payload }));

        const res = await request(app)
            .put('/api/v1/form')
            .set('Cookie', [`token=${creatorToken}`])
            .send({
                _id: formId,
                collaborator: [
                    { user: existingCollabId, type: roleEditor },
                    { user: { email: 'registered.staff@mfu.ac.th' }, email: 'registered.staff@mfu.ac.th', type: roleEditor },
                    { user: { email: 'Saranjit.KH@SummitThai.com' }, email: 'Saranjit.KH@SummitThai.com', type: roleViewer },
                    { email: 'registered.staff@mfu.ac.th', type: roleViewer }
                ]
            });

        expect(res.status).toBe(200);
        expect(UserController.onCreate).toHaveBeenCalledTimes(1);
        expect(UserController.onCreate).toHaveBeenCalledWith(
            { name: 'saranjit.kh', email: 'saranjit.kh@summitthai.com' },
            []
        );

        const [, savedPayload] = FormController.onUpdate.mock.calls[0];
        expect(savedPayload.collaborator.map((c) => String(c.user))).toEqual([
            existingCollabId,
            foundStaffId,
            createdExternalId
        ]);
    });
});
