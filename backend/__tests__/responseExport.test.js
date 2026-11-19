const express = require('express');
const request = require('supertest');
const mongo = require('mongodb');

jest.mock('../server/Project/Response/controller/response', () => ({
    onQuery: jest.fn(),
    onQuerys: jest.fn(),
    onCreate: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn()
}));

jest.mock('../server/Project/Response/models/response.model', () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn()
}));

jest.mock('../server/Project/Form/models/form.model', () => ({
    findById: jest.fn(),
    find: jest.fn()
}));

jest.mock('../server/Project/User/models/user.model', () => ({
    find: jest.fn(),
    findById: jest.fn()
}));

jest.mock('../server/Project/Organizations/models/organization.model', () => ({
    find: jest.fn()
}));

jest.mock('../server/Project/Settings/service/message', () => ({
    sendResponse: (res, _num, code, data = null) => {
        const httpCode = Number(String(code).substring(0, 3));
        return res.status(httpCode).json({ code, httpcode: httpCode, message: [{ key: 'en', value: 'Success' }], data });
    }
}));

jest.mock('../server/Project/Email/service/dynamicEmail', () => ({
    sendDynamicEmail: jest.fn(() => Promise.resolve({ success: true }))
}));

const ResponseModel = require('../server/Project/Response/models/response.model');
const FormModel = require('../server/Project/Form/models/form.model');
const UserModel = require('../server/Project/User/models/user.model');
const OrganizationModel = require('../server/Project/Organizations/models/organization.model');
const responseRoutes = require('../server/Project/Response/response.routes');
const { GENERAL_ORG_ID } = require('../server/Project/Response/utils/exportPayload');

function mockChain(resolvedValue) {
    const chain = {
        populate: jest.fn(() => chain),
        select: jest.fn(() => chain),
        sort: jest.fn(() => chain),
        lean: jest.fn(() => Promise.resolve(resolvedValue))
    };
    return chain;
}

describe('GET /api/v1/response/export (Single Unified Minimal Export API)', () => {
    let app;

    const orgItId = String(new mongo.ObjectId());
    const orgSciId = String(new mongo.ObjectId());
    const roleStudentId = String(new mongo.ObjectId());
    const roleStaffId = String(new mongo.ObjectId());

    const orgIt = { _id: orgItId, title: [{ key: 'en', value: 'School of IT' }] };
    const orgSci = { _id: orgSciId, title: [{ key: 'en', value: 'School of Science' }] };
    const orgPublic = { _id: GENERAL_ORG_ID, title: [{ key: 'en', value: 'General' }] };

    const roleStudent = { _id: roleStudentId, title: [{ key: 'en', value: 'Student' }] };
    const roleStaff = { _id: roleStaffId, title: [{ key: 'en', value: 'Staff' }] };

    const user1Id = String(new mongo.ObjectId());
    const user2Id = String(new mongo.ObjectId());
    const user3Id = String(new mongo.ObjectId());
    const user4Id = String(new mongo.ObjectId());
    const extraAdminId = String(new mongo.ObjectId());

    const allUsers = [
        { _id: user1Id, name: 'Alice IT', email: 'alice@mfu.ac.th', organization: orgIt, role: roleStudent },
        { _id: user2Id, name: 'Bob IT', email: 'bob@mfu.ac.th', organization: orgIt, role: roleStudent },
        { _id: user3Id, name: 'Carol Staff IT', email: 'carol@mfu.ac.th', organization: orgIt, role: roleStaff },
        { _id: user4Id, name: 'Dave Sci (AllowedUser)', email: 'dave@mfu.ac.th', organization: orgSci, role: roleStaff },
        { _id: extraAdminId, name: 'Extra Admin', email: 'admin@mfu.ac.th', organization: orgSci, role: roleStaff }
    ];

    const q1Id = String(new mongo.ObjectId());
    const q2Id = String(new mongo.ObjectId());
    const q3Id = String(new mongo.ObjectId());
    const qBlockId = String(new mongo.ObjectId());
    const formId = String(new mongo.ObjectId());

    const baseQuestions = [
        {
            _id: qBlockId,
            order: 0,
            title: [{ key: 'en', value: 'Section Header' }],
            type: { _id: String(new mongo.ObjectId()), type: 'Title & Description' }
        },
        {
            _id: q1Id,
            order: 1,
            title: [{ key: 'en', value: 'Teaching Satisfaction' }],
            type: { _id: String(new mongo.ObjectId()), type: 'Rating' },
            config: { maxRating: 5 }
        },
        {
            _id: q2Id,
            order: 2,
            title: [{ key: 'en', value: 'Preferred Format' }],
            type: { _id: String(new mongo.ObjectId()), type: 'Multiple Choice' },
            config: {
                choices: [
                    { key: 'online', lang: [{ key: 'en', value: 'Online' }] },
                    { key: 'onsite', lang: [{ key: 'en', value: 'On-site' }] }
                ]
            }
        },
        {
            _id: q3Id,
            order: 3,
            title: [{ key: 'en', value: 'Tools Used' }],
            type: { _id: String(new mongo.ObjectId()), type: 'Checkbox' },
            config: {
                choices: [
                    { key: 'c1', lang: [{ key: 'en', value: 'LMS' }] },
                    { key: 'c2', lang: [{ key: 'en', value: 'Slides' }] }
                ]
            }
        }
    ];

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/v1/response', responseRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        OrganizationModel.find.mockReturnValue(mockChain([orgIt, orgSci, orgPublic]));
        UserModel.find.mockReturnValue(mockChain(allUsers));
    });

    test('returns 400 for invalid or missing formId and 404 when form does not exist', async () => {
        const missingRes = await request(app).get('/api/v1/response/export');
        expect(missingRes.status).toBe(400);

        const invalidRes = await request(app).get('/api/v1/response/export/not-an-object-id');
        expect(invalidRes.status).toBe(400);

        FormModel.findById.mockReturnValue(mockChain(null));
        const notFoundRes = await request(app).get(`/api/v1/response/export/${formId}`);
        expect(notFoundRes.status).toBe(404);
    });

    test('returns one unified results list (submitted first with answers, not submitted with empty answers) plus full form metadata and ordered questions', async () => {
        const creatorId = String(new mongo.ObjectId());
        FormModel.findById.mockReturnValue(mockChain({
            _id: formId,
            title: [{ key: 'en', value: 'IT Course Survey' }, { key: 'th', value: 'แบบประเมิน IT' }],
            description: [{ key: 'en', value: 'End of semester evaluation' }, { key: 'th', value: 'ประเมินปลายภาค' }],
            schedule: { startAt: '2026-11-01T00:00:00Z', endAt: '2026-12-31T00:00:00Z' },
            organization: [orgIt],
            creator: { _id: creatorId, name: 'Dr. Creator', email: 'creator@mfu.ac.th' },
            collaborator: [
                {
                    user: { _id: user3Id, name: 'Carol Staff IT', email: 'carol@mfu.ac.th' },
                    type: { title: [{ key: 'en', value: 'Editor' }] }
                },
                {
                    user: { _id: user4Id, name: 'Dave Sci (AllowedUser)', email: 'dave@mfu.ac.th' },
                    type: { title: [{ key: 'en', value: 'Viewer' }] }
                }
            ],
            settings: {
                requireLogin: true,
                allowedRoles: [roleStudent],
                allowedUser: [{ _id: user4Id, name: 'Dave Sci (AllowedUser)', email: 'dave@mfu.ac.th', organization: orgSci, role: roleStaff }]
            },
            questions: baseQuestions
        }));

        ResponseModel.find.mockReturnValue(mockChain([
            {
                _id: String(new mongo.ObjectId()),
                form: formId,
                responder: allUsers[0], // Alice IT (latest submission)
                submit: true,
                createdAt: '2026-11-12T10:00:00Z',
                answers: [
                    { question: q1Id, response: 5 },
                    { question: q2Id, response: 'online' },
                    { question: q3Id, response: ['c1', 'c2'] }
                ]
            },
            {
                _id: String(new mongo.ObjectId()),
                form: formId,
                responder: allUsers[0], // Alice IT (older submission - should be deduplicated)
                submit: true,
                createdAt: '2026-11-11T08:00:00Z',
                answers: [{ question: q1Id, response: 2 }]
            },
            {
                _id: String(new mongo.ObjectId()),
                form: formId,
                responder: allUsers[1], // Bob IT draft only -> submitted: false
                submit: false,
                createdAt: '2026-11-12T09:00:00Z',
                answers: [{ question: q1Id, response: 4 }]
            },
            {
                _id: String(new mongo.ObjectId()),
                form: formId,
                responder: allUsers[4], // Extra Admin (non-target submitter)
                submit: true,
                createdAt: '2026-11-12T08:00:00Z',
                answers: [{ question: q1Id, response: 4 }]
            },
            {
                _id: String(new mongo.ObjectId()),
                form: formId,
                responder: null, // Anonymous guest
                submit: true,
                createdAt: '2026-11-12T07:00:00Z',
                answers: [{ question: q2Id, response: 'onsite' }]
            }
        ]));

        const res = await request(app).get(`/api/v1/response/export/${formId}`);
        expect(res.status).toBe(200);
        expect(res.body.code).toBe(20000);

        const data = res.body.data;
        expect(data.form).toMatchObject({
            _id: formId,
            title: { th: 'แบบประเมิน IT', en: 'IT Course Survey' },
            description: { th: 'ประเมินปลายภาค', en: 'End of semester evaluation' },
            schedule: {
                startAt: '2026-11-01T00:00:00.000Z',
                endAt: '2026-12-31T00:00:00.000Z',
                status: 'open'
            },
            organizations: ['School of IT'],
            creator: { _id: creatorId, name: 'Dr. Creator', email: 'creator@mfu.ac.th' },
            collaborators: [
                { _id: user3Id, name: 'Carol Staff IT', email: 'carol@mfu.ac.th', role: 'editor' },
                { _id: user4Id, name: 'Dave Sci (AllowedUser)', email: 'dave@mfu.ac.th', role: 'viewer' }
            ]
        });
        expect(data.form.titleLang).toBeUndefined();
        expect(data.form.descriptionLang).toBeUndefined();

        expect(data.questions).toEqual([
            expect.objectContaining({
                _id: q1Id,
                order: 1,
                title: { th: '', en: 'Teaching Satisfaction' },
                description: { th: '', en: '' },
                type: 'rating',
                maxRating: 5
            }),
            expect.objectContaining({
                _id: q2Id,
                order: 2,
                title: { th: '', en: 'Preferred Format' },
                type: 'multiple choice',
                choices: [
                    { key: 'online', label: { th: '', en: 'Online' } },
                    { key: 'onsite', label: { th: '', en: 'On-site' } }
                ]
            }),
            expect.objectContaining({
                _id: q3Id,
                order: 3,
                title: { th: '', en: 'Tools Used' },
                type: 'checkbox'
            })
        ]);
        expect(data.questions[0].titleLang).toBeUndefined();

        expect(data.evaluatorSummary).toBeUndefined();
        expect(data.evaluators).toBeUndefined();
        expect(data.organizationsBreakdown).toBeUndefined();
        expect(data.responses).toBeUndefined();

        // Target (Alice, Bob, Dave) + Extra Admin + Guest = 5 items total (Alice deduplicated to 1)
        expect(data.results).toHaveLength(5);

        // Submitted entries appear before not-submitted entries
        expect(data.results[0]).toMatchObject({
            _id: user1Id,
            name: 'Alice IT',
            email: 'alice@mfu.ac.th',
            organization: 'School of IT',
            role: 'Student',
            isTarget: true,
            submitted: true,
            submittedAt: '2026-11-12T10:00:00.000Z'
        });
        expect(data.results[0].answers).toEqual([
            { questionId: q1Id, order: 1, questionTitle: 'Teaching Satisfaction', type: 'rating', value: 5 },
            { questionId: q2Id, order: 2, questionTitle: 'Preferred Format', type: 'multiple choice', value: 'Online' },
            { questionId: q3Id, order: 3, questionTitle: 'Tools Used', type: 'checkbox', value: 'LMS, Slides' }
        ]);

        const extraAdmin = data.results.find((r) => r._id === extraAdminId);
        expect(extraAdmin).toMatchObject({ isTarget: false, submitted: true });

        const guest = data.results.find((r) => r._id === null);
        expect(guest).toMatchObject({ name: 'Anonymous', organization: null, role: null, isTarget: false, submitted: true });

        const pendingTargets = data.results.filter((r) => !r.submitted);
        expect(pendingTargets).toEqual([
            expect.objectContaining({ _id: user2Id, name: 'Bob IT', isTarget: true, submitted: false, submittedAt: null, answers: [] }),
            expect.objectContaining({ _id: user4Id, name: 'Dave Sci (AllowedUser)', isTarget: true, submitted: false, submittedAt: null, answers: [] })
        ]);
    });

    test('supports ?formId=... query param and returns all org target users even with 0 responses', async () => {
        const sciOnlyUsers = [
            { _id: user1Id, name: 'Alice IT', email: 'alice@mfu.ac.th', organization: orgIt, role: roleStudent },
            { _id: user4Id, name: 'Dave Sci', email: 'dave@mfu.ac.th', organization: orgSci, role: roleStudent }
        ];
        UserModel.find.mockReturnValue(mockChain(sciOnlyUsers));

        FormModel.findById.mockReturnValue(mockChain({
            _id: formId,
            title: [{ key: 'en', value: 'Science Survey' }],
            organization: [orgSci],
            settings: { requireLogin: true, allowedRoles: [], allowedUser: [] },
            questions: baseQuestions
        }));

        ResponseModel.find.mockReturnValue(mockChain([]));

        const res = await request(app).get(`/api/v1/response/export?formId=${formId}`);
        expect(res.status).toBe(200);
        expect(res.body.data.results).toEqual([
            {
                _id: user4Id,
                name: 'Dave Sci',
                email: 'dave@mfu.ac.th',
                organization: 'School of Science',
                role: 'Student',
                isTarget: true,
                submitted: false,
                submittedAt: null,
                answers: []
            }
        ]);
    });

    test('converts file_upload JSON-stringified/array upload paths to full localhost URLs using request host or BASE_SERVER_URL', async () => {
        const qFileId = String(new mongo.ObjectId());
        const uploadPath = '/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/thanakorn_spectroscopy_final_project.pdf';
        const multiUploadPath = '/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/second file.png';

        FormModel.findById.mockReturnValue(mockChain({
            _id: formId,
            title: [{ key: 'en', value: 'Lab Report Upload' }],
            organization: [orgIt],
            settings: { requireLogin: true, allowedRoles: [], allowedUser: [] },
            questions: [
                { _id: qFileId, order: 1, title: [{ key: 'en', value: 'Attachment' }], type: { type: 'file_upload' }, isRequired: true }
            ]
        }));
        UserModel.find.mockReturnValue(mockChain([
            { _id: user1Id, name: 'Alice IT', email: 'alice@mfu.ac.th', organization: orgIt, role: roleStudent }
        ]));
        ResponseModel.find.mockReturnValue(mockChain([
            {
                _id: String(new mongo.ObjectId()),
                form: formId,
                responder: { _id: user1Id, name: 'Alice IT', email: 'alice@mfu.ac.th', organization: orgIt, role: roleStudent },
                submit: true,
                createdAt: '2026-11-12T10:00:00Z',
                answers: [
                    { question: qFileId, response: JSON.stringify([uploadPath, multiUploadPath]) }
                ]
            }
        ]));

        const res = await request(app)
            .get(`/api/v1/response/export/${formId}`)
            .set('Host', 'localhost:8081');

        expect(res.status).toBe(200);
        expect(res.body.data.results[0].answers[0]).toEqual({
            questionId: qFileId,
            order: 1,
            questionTitle: 'Attachment',
            type: 'file_upload',
            value: `http://localhost:8081${uploadPath}, http://localhost:8081/uploads/forms/6af313a122f5de829c58bde7/responses/6af3344d1d27b332949e80ff/second%20file.png`
        });
    });
});
