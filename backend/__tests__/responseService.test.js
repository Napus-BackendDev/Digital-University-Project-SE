const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongo = require('mongodb');

jest.mock('../server/Project/Response/controller/response', () => ({
    onQuery: jest.fn(),
    onQuerys: jest.fn(),
    onCreate: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn()
}));

jest.mock('../server/Project/Response/models/response.model', () => ({
    findOne: jest.fn(),
    countDocuments: jest.fn()
}));

jest.mock('../server/Project/Form/models/form.model', () => ({
    findById: jest.fn(),
    find: jest.fn()
}));

jest.mock('../server/Project/User/models/user.model', () => ({
    findById: jest.fn()
}));

jest.mock('../server/Project/Settings/service/message', () => ({
    sendResponse: (res, _num, code, data = null) => {
        const httpCode = Number(String(code).substring(0, 3));
        return res.status(httpCode).json({ code, httpcode: httpCode, data });
    }
}));

jest.mock('../server/Project/Email/service/dynamicEmail', () => ({
    sendDynamicEmail: jest.fn(() => Promise.resolve({ success: true }))
}));

const ResponseController = require('../server/Project/Response/controller/response');
const ResponseModel = require('../server/Project/Response/models/response.model');
const FormModel = require('../server/Project/Form/models/form.model');
const UserModel = require('../server/Project/User/models/user.model');
const dynamicEmail = require('../server/Project/Email/service/dynamicEmail');
const responseRoutes = require('../server/Project/Response/response.routes');

function mockMongooseChain(resolvedValue) {
    const chain = {
        populate: jest.fn(() => chain),
        select: jest.fn(() => chain),
        lean: jest.fn(() => Promise.resolve(resolvedValue))
    };
    return chain;
}

describe('Response API routes integration (Supertest with mocked DB & Email)', () => {
    let app;
    const formId = String(new mongo.ObjectId());
    const userId = String(new mongo.ObjectId());
    const creatorId = String(new mongo.ObjectId());
    const openSchedule = { startAt: '2026-11-01T00:00:00Z', endAt: '2026-12-31T00:00:00Z' };
    const originalEnv = process.env;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api/v1/response', responseRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            APP_ENV: 'production',
            JWT_SECRET: 'super-test-secret'
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('POST /api/v1/response records guest response anonymously (responder=null) without sending emails', async () => {
        FormModel.findById.mockReturnValue(mockMongooseChain({
            _id: formId,
            title: [{ key: 'en', value: 'Public Feedback' }],
            creator: { _id: creatorId, name: 'Creator', email: 'creator@mfu.ac.th' },
            schedule: openSchedule,
            settings: {
                requireLogin: false,
                emailNotifications: false,
                notifyCreator: false
            }
        }));
        ResponseController.onCreate.mockImplementation(async (payload) => ({
            _id: 'resp-guest-1',
            ...payload,
            responder: null,
            createdAt: new Date('2026-11-11T10:00:00Z')
        }));

        const res = await request(app)
            .post('/api/v1/response')
            .send({
                form: formId,
                responder: null,
                guestSessionId: 'guest-browser-123',
                answers: [{ question: 'q1', response: 'Great course!' }],
                submit: true
            });

        expect(res.status).toBe(200);
        expect(ResponseController.onCreate).toHaveBeenCalledWith(expect.objectContaining({
            responder: null,
            guestSessionId: 'guest-browser-123',
            submit: true
        }));
        expect(dynamicEmail.sendDynamicEmail).not.toHaveBeenCalled();
    });

    test('POST /api/v1/response honors emailNotifications + interpolates emailMessage AND triggers notifyCreator', async () => {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET);
        FormModel.findById.mockReturnValue(mockMongooseChain({
            _id: formId,
            title: [{ key: 'en', value: 'Course Survey' }],
            creator: { _id: creatorId, name: 'Assoc. Prof. Somchai', email: 'somchai@mfu.ac.th' },
            schedule: openSchedule,
            settings: {
                requireLogin: true,
                emailNotifications: true,
                emailMessage: 'Thanks {name} ({email}) for submitting {form}!',
                notifyCreator: true
            }
        }));
        UserModel.findById.mockReturnValue(mockMongooseChain({
            _id: userId,
            name: 'Alice',
            email: 'alice@lamduan.mfu.ac.th',
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));
        ResponseController.onCreate.mockResolvedValue({
            _id: 'resp-auth-1',
            form: { _id: formId, title: [{ key: 'en', value: 'Course Survey' }] },
            responder: { _id: userId, name: 'Alice', email: 'alice@lamduan.mfu.ac.th' },
            submit: true,
            createdAt: new Date('2026-11-11T10:00:00Z')
        });

        const res = await request(app)
            .post('/api/v1/response')
            .set('Cookie', [`token=${token}`])
            .send({
                form: formId,
                answers: [{ question: 'q1', response: '5' }],
                submit: true
            });

        expect(res.status).toBe(200);
        expect(dynamicEmail.sendDynamicEmail).toHaveBeenCalledTimes(2);
        expect(dynamicEmail.sendDynamicEmail).toHaveBeenNthCalledWith(
            1,
            'submissionConfirmation',
            expect.objectContaining({
                UserName: 'Alice',
                FormName: 'Course Survey',
                FormURL: `http://localhost:8080/forms/${formId}?mode=public`,
                ContactEmail: 'somchai@mfu.ac.th',
                EmailMessage: 'Thanks Alice (alice@lamduan.mfu.ac.th) for submitting Course Survey!'
            }),
            'alice@lamduan.mfu.ac.th',
            expect.objectContaining({
                ownerId: creatorId,
                contactEmail: 'somchai@mfu.ac.th',
                replyTo: 'somchai@mfu.ac.th'
            })
        );
        expect(dynamicEmail.sendDynamicEmail).toHaveBeenNthCalledWith(
            2,
            'creatorNotification',
            expect.objectContaining({
                Responder: 'Alice',
                FormName: 'Course Survey',
                ManageURL: `http://localhost:8080/manage/${formId}`
            }),
            'somchai@mfu.ac.th',
            expect.objectContaining({
                ownerId: creatorId,
                contactEmail: 'somchai@mfu.ac.th',
                replyTo: 'somchai@mfu.ac.th'
            })
        );
    });

    test('POST /api/v1/response blocks submission when emailNotifications is false without emailing responder', async () => {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET);
        FormModel.findById.mockReturnValue(mockMongooseChain({
            _id: formId,
            title: [{ key: 'en', value: 'Silent Form' }],
            creator: { _id: creatorId, name: 'Creator', email: 'creator@mfu.ac.th' },
            schedule: openSchedule,
            settings: {
                requireLogin: true,
                emailNotifications: false,
                notifyCreator: false
            }
        }));
        UserModel.findById.mockReturnValue(mockMongooseChain({
            _id: userId,
            name: 'Alice',
            email: 'alice@lamduan.mfu.ac.th',
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));
        ResponseController.onCreate.mockResolvedValue({
            _id: 'resp-silent-1',
            form: { _id: formId },
            responder: { _id: userId, name: 'Alice', email: 'alice@lamduan.mfu.ac.th' },
            submit: true,
            createdAt: new Date()
        });

        const res = await request(app)
            .post('/api/v1/response')
            .set('Cookie', [`token=${token}`])
            .send({ form: formId, answers: [], submit: true });

        expect(res.status).toBe(200);
        expect(dynamicEmail.sendDynamicEmail).not.toHaveBeenCalled();
    });

    test('POST /api/v1/response rejects unauthenticated spoofed responder when requireLogin is true in production', async () => {
        FormModel.findById.mockReturnValue(mockMongooseChain({
            _id: formId,
            schedule: openSchedule,
            settings: { requireLogin: true }
        }));

        const res = await request(app)
            .post('/api/v1/response')
            .send({ form: formId, responder: userId, answers: [], submit: true });

        expect(res.status).toBe(401);
        expect(res.body.data.reason).toBe('LOGIN_REQUIRED');
        expect(ResponseController.onCreate).not.toHaveBeenCalled();
    });

    test('POST /api/v1/response enforces closed schedule and maxResponses quota', async () => {
        FormModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: formId,
            schedule: { startAt: '2026-10-01T00:00:00Z', endAt: '2026-10-15T00:00:00Z' },
            settings: { requireLogin: false }
        }));
        const closedRes = await request(app)
            .post('/api/v1/response')
            .send({ form: formId, guestSessionId: 'g1', submit: true });
        expect(closedRes.status).toBe(403);
        expect(closedRes.body.data.reason).toBe('FORM_CLOSED');

        FormModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: formId,
            schedule: openSchedule,
            settings: { requireLogin: false, maxResponses: 10 }
        }));
        ResponseModel.countDocuments.mockResolvedValueOnce(10);

        const quotaRes = await request(app)
            .post('/api/v1/response')
            .send({ form: formId, guestSessionId: 'g2', submit: true });
        expect(quotaRes.status).toBe(403);
        expect(quotaRes.body.data.reason).toBe('QUOTA_REACHED');
    });

    test('PUT /api/v1/response respects allowEditAfterSubmit flag and skips duplicate emails on edit', async () => {
        const respId = String(new mongo.ObjectId());
        const token = jwt.sign({ userId }, process.env.JWT_SECRET);

        ResponseController.onQuery.mockResolvedValue({
            _id: respId,
            form: { _id: formId },
            responder: { _id: userId, email: 'alice@lamduan.mfu.ac.th', name: 'Alice' },
            submit: true,
            answers: [{ question: 'q1', response: 'Old Answer' }]
        });
        UserModel.findById.mockReturnValue(mockMongooseChain({
            _id: userId,
            name: 'Alice',
            email: 'alice@lamduan.mfu.ac.th',
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));

        // Denied when allowEditAfterSubmit=false
        FormModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: formId,
            schedule: openSchedule,
            settings: { requireLogin: true, allowEditAfterSubmit: false }
        }));
        const deniedRes = await request(app)
            .put('/api/v1/response')
            .set('Cookie', [`token=${token}`])
            .send({ _id: respId, answers: [{ question: 'q1', response: 'New' }], submit: true });
        expect(deniedRes.status).toBe(403);
        expect(deniedRes.body.data.reason).toBe('EDIT_NOT_ALLOWED');

        // Allowed when allowEditAfterSubmit=true (even at maxResponses quota), does not resend emails
        FormModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: formId,
            title: [{ key: 'en', value: 'Survey' }],
            creator: { _id: creatorId, email: 'creator@mfu.ac.th' },
            schedule: openSchedule,
            settings: {
                requireLogin: true,
                limitResponse: true,
                allowEditAfterSubmit: true,
                maxResponses: 1,
                emailNotifications: true,
                notifyCreator: true
            }
        }));
        ResponseModel.countDocuments.mockResolvedValueOnce(1);
        ResponseModel.findOne.mockReturnValue(mockMongooseChain({ _id: respId, submit: true }));
        ResponseController.onUpdate.mockResolvedValue({
            _id: respId,
            form: { _id: formId },
            responder: { _id: userId, name: 'Alice', email: 'alice@lamduan.mfu.ac.th' },
            submit: true,
            answers: [{ question: 'q1', response: 'Updated Answer' }]
        });

        const okRes = await request(app)
            .put('/api/v1/response')
            .set('Cookie', [`token=${token}`])
            .send({ _id: respId, answers: [{ question: 'q1', response: 'Updated Answer' }], submit: true });
        expect(okRes.status).toBe(200);
        expect(dynamicEmail.sendDynamicEmail).not.toHaveBeenCalled();
    });

    test('GET /api/v1/response/exp parses query parameters accurately for guest and form lookups', async () => {
        ResponseController.onQuerys.mockResolvedValue([{ _id: 'r1', responder: null, guestSessionId: 'g-xyz' }]);

        const res = await request(app)
            .get('/api/v1/response/exp')
            .query({ form: formId, responder: 'null', guestSessionId: 'g-xyz', submit: 'true' });

        expect(res.status).toBe(200);
        expect(ResponseController.onQuerys).toHaveBeenCalledTimes(1);
        const queryArg = ResponseController.onQuerys.mock.calls[0][0];
        expect(String(queryArg.form)).toBe(formId);
        expect(queryArg.responder).toBeNull();
        expect(queryArg.guestSessionId).toBe('g-xyz');
        expect(queryArg.submit).toBe(true);
    });

    test('GET /api/v1/response/exp enforces role & ownership scope for Admin, Creator/Viewer, Student 0-forms, self-lookup, and unauthenticated', async () => {
        // 1. Unauthenticated pool fetch without guest self-lookup => 401
        const unauthRes = await request(app).get('/api/v1/response/exp');
        expect(unauthRes.status).toBe(401);
        expect(ResponseController.onQuerys).not.toHaveBeenCalled();

        // 2. Non-admin Student with 0 managed/collaborated forms => empty array [], does not expose other responses
        const studentId = String(new mongo.ObjectId());
        const studentToken = jwt.sign({ userId: studentId }, process.env.JWT_SECRET);
        UserModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: studentId,
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));
        FormModel.find.mockReturnValueOnce(mockMongooseChain([]));

        const studentRes = await request(app)
            .get('/api/v1/response/exp')
            .set('Cookie', [`token=${studentToken}`]);
        expect(studentRes.status).toBe(200);
        expect(studentRes.body.data).toEqual([]);
        expect(ResponseController.onQuerys).not.toHaveBeenCalled();

        // 3. Non-admin Collaborator Viewer sees only allowed form IDs via $in and gets 403 on unowned ?form=
        const viewerFormId = String(new mongo.ObjectId());
        const otherFormId = String(new mongo.ObjectId());
        UserModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: studentId,
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));
        FormModel.find.mockReturnValueOnce(mockMongooseChain([{ _id: new mongo.ObjectId(viewerFormId) }]));
        ResponseController.onQuerys.mockResolvedValueOnce([{ _id: 'r-shared', form: viewerFormId, submit: true }]);

        const viewerRes = await request(app)
            .get('/api/v1/response/exp')
            .set('Cookie', [`token=${studentToken}`]);
        expect(viewerRes.status).toBe(200);
        expect(ResponseController.onQuerys).toHaveBeenCalledTimes(1);
        const scopedFilter = ResponseController.onQuerys.mock.calls[0][0];
        expect(scopedFilter.form.$in.map(String)).toEqual([viewerFormId]);

        UserModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: studentId,
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));
        FormModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: otherFormId,
            creator: creatorId,
            collaborator: []
        }));
        const forbiddenRes = await request(app)
            .get('/api/v1/response/exp')
            .query({ form: otherFormId })
            .set('Cookie', [`token=${studentToken}`]);
        expect(forbiddenRes.status).toBe(403);

        // 4. Signed-in responder self-lookup on specific form => allowed (200)
        UserModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: studentId,
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));
        ResponseController.onQuerys.mockResolvedValueOnce([{ _id: 'r-self', form: otherFormId, responder: studentId }]);
        const selfRes = await request(app)
            .get('/api/v1/response/exp')
            .query({ form: otherFormId, responder: studentId })
            .set('Cookie', [`token=${studentToken}`]);
        expect(selfRes.status).toBe(200);

        // 5. Admin caller => unrestricted pool query (no $in cap)
        const adminId = String(new mongo.ObjectId());
        const adminToken = jwt.sign({ userId: adminId }, process.env.JWT_SECRET);
        UserModel.findById.mockReturnValueOnce(mockMongooseChain({
            _id: adminId,
            role: { title: [{ key: 'en', value: 'Admin' }] }
        }));
        ResponseController.onQuerys.mockResolvedValueOnce([{ _id: 'r-any' }]);
        const adminRes = await request(app)
            .get('/api/v1/response/exp')
            .set('Cookie', [`token=${adminToken}`]);
        expect(adminRes.status).toBe(200);
        expect(ResponseController.onQuerys.mock.calls[2][0]).toEqual({});
    });

    test('POST /api/v1/response serializes concurrent submissions so maxResponses quota cannot race over limit', async () => {
        const user2Id = String(new mongo.ObjectId());
        const token1 = jwt.sign({ userId }, process.env.JWT_SECRET);
        const token2 = jwt.sign({ userId: user2Id }, process.env.JWT_SECRET);

        let submittedInDb = 1;
        FormModel.findById.mockImplementation(() => mockMongooseChain({
            _id: formId,
            title: [{ key: 'en', value: 'Quota Form' }],
            creator: { _id: creatorId, name: 'Creator', email: 'creator@mfu.ac.th' },
            schedule: openSchedule,
            settings: { requireLogin: true, maxResponses: 2, emailNotifications: false, notifyCreator: false }
        }));
        UserModel.findById.mockImplementation((id) => mockMongooseChain({
            _id: String(id),
            name: 'Student',
            email: 'student@lamduan.mfu.ac.th',
            role: { title: [{ key: 'en', value: 'Student' }] }
        }));
        ResponseModel.countDocuments.mockImplementation(async () => submittedInDb);
        ResponseController.onCreate.mockImplementation(async (payload) => {
            await new Promise((r) => setTimeout(r, 20));
            submittedInDb += 1;
            return { _id: `resp-${submittedInDb}`, ...payload };
        });

        const [resA, resB] = await Promise.all([
            request(app).post('/api/v1/response').set('Cookie', [`token=${token1}`]).send({ form: formId, answers: [], submit: true }),
            request(app).post('/api/v1/response').set('Cookie', [`token=${token2}`]).send({ form: formId, answers: [], submit: true })
        ]);

        expect([resA.status, resB.status].sort()).toEqual([200, 403]);
        expect(submittedInDb).toBe(2);
        const rejected = resA.status === 403 ? resA : resB;
        expect(rejected.body.data.reason).toBe('QUOTA_REACHED');
    });
});
