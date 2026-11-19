const express = require('express');
const request = require('supertest');
const mongo = require('mongodb');

jest.mock('../server/Project/Response/models/response.model', () => ({
    find: jest.fn()
}));
jest.mock('../server/Project/Form/models/form.model', () => ({
    find: jest.fn(),
    findById: jest.fn()
}));
jest.mock('../server/Project/User/models/user.model', () => ({
    find: jest.fn(),
    findById: jest.fn()
}));
jest.mock('../server/Project/Organizations/models/organization.model', () => ({
    find: jest.fn()
}));
jest.mock('../server/Project/User/models/roles.model', () => ({
    find: jest.fn()
}));
jest.mock('../server/Project/Settings/service/message', () => ({
    sendResponse: jest.fn((res, _numbers, code, data = null) => {
        const httpCode = Number(String(code).substring(0, 3)) || 200;
        return res.status(httpCode).json({ code, httpcode: httpCode, data });
    }),
    onMessage_Response: jest.fn(async (_numbers, code) => ({ code }))
}));

const ResponseModel = require('../server/Project/Response/models/response.model');
const FormModel = require('../server/Project/Form/models/form.model');
const UserModel = require('../server/Project/User/models/user.model');
const OrganizationModel = require('../server/Project/Organizations/models/organization.model');
const RolesModel = require('../server/Project/User/models/roles.model');
const analyticsRoutes = require('../server/Project/Analytics/analytics.routes');
const responseRoutes = require('../server/Project/Response/response.routes');
const { GENERAL_ORG_ID } = require('../server/Project/Response/utils/analyticsExport');

function mockChain(result) {
    const chain = {
        populate: jest.fn(() => chain),
        select: jest.fn(() => chain),
        sort: jest.fn(() => chain),
        lean: jest.fn(() => Promise.resolve(result)),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    };
    return chain;
}

describe('GET /api/v1/analytics/export & /api/v1/response/export-analytics', () => {
    let app;

    const orgItId = String(new mongo.ObjectId());
    const orgSciId = String(new mongo.ObjectId());
    const roleStudentId = String(new mongo.ObjectId());
    const roleStaffId = String(new mongo.ObjectId());
    const roleAdminId = String(new mongo.ObjectId());

    const orgIt = { _id: orgItId, title: [{ key: 'en', value: 'School of IT' }] };
    const orgSci = { _id: orgSciId, title: [{ key: 'en', value: 'School of Science' }] };
    const orgPublic = { _id: GENERAL_ORG_ID, title: [{ key: 'en', value: 'General' }] };

    const roleStudent = { _id: roleStudentId, title: [{ key: 'en', value: 'Student' }] };
    const roleStaff = { _id: roleStaffId, title: [{ key: 'en', value: 'Staff' }] };
    const roleAdmin = { _id: roleAdminId, title: [{ key: 'en', value: 'Admin' }] };

    const aliceId = String(new mongo.ObjectId());
    const bobId = String(new mongo.ObjectId());
    const carolId = String(new mongo.ObjectId());
    const creatorId = String(new mongo.ObjectId());
    const adminId = String(new mongo.ObjectId());

    const users = [
        { _id: aliceId, name: 'Alice IT', email: 'alice@mfu.ac.th', organization: orgIt, role: roleStudent },
        { _id: bobId, name: 'Bob IT', email: 'bob@mfu.ac.th', organization: orgIt, role: roleStudent },
        { _id: carolId, name: 'Carol Sci', email: 'carol@mfu.ac.th', organization: orgSci, role: roleStaff },
        { _id: creatorId, name: 'Creator User', email: 'creator@mfu.ac.th', organization: orgIt, role: roleStaff },
        { _id: adminId, name: 'Admin User', email: 'admin@mfu.ac.th', organization: orgSci, role: roleAdmin }
    ];

    const qRatingId = String(new mongo.ObjectId());
    const qChoiceId = String(new mongo.ObjectId());
    const qFileId = String(new mongo.ObjectId());
    const qSciRatingId = String(new mongo.ObjectId());

    const formItId = String(new mongo.ObjectId());
    const formSciId = String(new mongo.ObjectId());

    const nowMs = Date.now();
    const forms = [
        {
            _id: formItId,
            title: [{ key: 'th', value: 'แบบประเมินไอที' }, { key: 'en', value: 'IT Satisfaction Survey' }],
            description: [{ key: 'en', value: 'IT satisfaction' }],
            organization: [orgIt],
            creator: { _id: creatorId, name: 'Creator User', email: 'creator@mfu.ac.th' },
            collaborator: [],
            schedule: {
                startAt: new Date(nowMs - 86400000).toISOString(),
                endAt: new Date(nowMs + 3 * 86400000).toISOString()
            },
            settings: {
                collectEmail: true,
                allowedUser: [],
                allowedRoles: []
            },
            questions: [
                {
                    _id: qRatingId,
                    order: 1,
                    required: true,
                    title: [{ key: 'en', value: 'Overall Satisfaction' }],
                    type: { _id: String(new mongo.ObjectId()), type: 'Rating' },
                    config: { maxRating: 5 }
                },
                {
                    _id: qChoiceId,
                    order: 2,
                    required: true,
                    title: [{ key: 'en', value: 'Preferred Channel' }],
                    type: { _id: String(new mongo.ObjectId()), type: 'Multiple Choice' },
                    config: {
                        choices: [
                            { key: 'online', lang: [{ key: 'en', value: 'Online' }] },
                            { key: 'onsite', lang: [{ key: 'en', value: 'On-site' }] }
                        ]
                    }
                },
                {
                    _id: qFileId,
                    order: 3,
                    required: false,
                    title: [{ key: 'en', value: 'Attachment' }],
                    type: { _id: String(new mongo.ObjectId()), type: 'File Upload' },
                    config: {}
                }
            ]
        },
        {
            _id: formSciId,
            title: [{ key: 'en', value: 'Science Lab Survey' }],
            description: [{ key: 'en', value: 'Lab evaluation' }],
            organization: [orgSci],
            creator: { _id: adminId, name: 'Admin User', email: 'admin@mfu.ac.th' },
            collaborator: [],
            schedule: {
                startAt: new Date(nowMs - 10 * 86400000).toISOString(),
                endAt: new Date(nowMs - 86400000).toISOString()
            },
            settings: {
                collectEmail: true,
                allowedUser: [],
                allowedRoles: []
            },
            questions: [
                {
                    _id: qSciRatingId,
                    order: 1,
                    required: true,
                    title: [{ key: 'en', value: 'Lab Rating' }],
                    type: { _id: String(new mongo.ObjectId()), type: 'Rating' },
                    config: { maxRating: 5 }
                }
            ]
        }
    ];

    const responses = [
        {
            _id: String(new mongo.ObjectId()),
            form: formItId,
            responder: { _id: aliceId, name: 'Alice IT', email: 'alice@mfu.ac.th', organization: orgIt, role: roleStudent },
            submit: true,
            createdAt: new Date(nowMs - 3600000).toISOString(),
            updatedAt: new Date(nowMs - 3600000).toISOString(),
            answers: [
                { question: qRatingId, response: '5' },
                { question: qChoiceId, response: 'online' },
                {
                    question: qFileId,
                    response: JSON.stringify([`/uploads/forms/${formItId}/responses/r1/alice_report.pdf`])
                }
            ]
        },
        {
            _id: String(new mongo.ObjectId()),
            form: formItId,
            responder: { _id: bobId, name: 'Bob IT', email: 'bob@mfu.ac.th', organization: orgIt, role: roleStudent },
            submit: false,
            createdAt: new Date(nowMs - 1800000).toISOString(),
            updatedAt: new Date(nowMs - 900000).toISOString(),
            answers: [{ question: qRatingId, response: '4' }]
        },
        {
            _id: String(new mongo.ObjectId()),
            form: formItId,
            responder: null,
            responderEmail: 'guest@external.org',
            submit: true,
            createdAt: new Date(nowMs - 7200000).toISOString(),
            updatedAt: new Date(nowMs - 7200000).toISOString(),
            answers: [
                { question: qRatingId, response: '3' },
                { question: qChoiceId, response: 'online' }
            ]
        },
        {
            _id: String(new mongo.ObjectId()),
            form: formSciId,
            responder: { _id: carolId, name: 'Carol Sci', email: 'carol@mfu.ac.th', organization: orgSci, role: roleStaff },
            submit: true,
            createdAt: new Date(nowMs - 5 * 86400000).toISOString(),
            updatedAt: new Date(nowMs - 5 * 86400000).toISOString(),
            answers: [{ question: qSciRatingId, response: '4' }]
        }
    ];

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/v1/analytics', analyticsRoutes);
        app.use('/api/v1/response', responseRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        FormModel.find.mockReturnValue(mockChain(forms));
        ResponseModel.find.mockReturnValue(mockChain(responses));
        UserModel.find.mockReturnValue(mockChain(users));
        UserModel.findById.mockReturnValue(mockChain({ _id: adminId, role: roleAdmin }));
        OrganizationModel.find.mockReturnValue(mockChain([orgIt, orgSci, orgPublic]));
        RolesModel.find.mockReturnValue(mockChain([roleStudent, roleStaff, roleAdmin]));
    });

    test('returns unified overall KPIs, breakdown, trend, and per-form question stats & absolute file links', async () => {
        const res = await request(app)
            .get('/api/v1/analytics/export')
            .set('Host', 'localhost:8081');

        expect(res.status).toBe(200);
        const payload = res.body.data;
        expect(payload.exportedAt).toBeTruthy();

        expect(payload.overall.summary).toMatchObject({
            totalForms: 2,
            activeForms: 1,
            closedForms: 1,
            closingSoonForms: 1,
            totalCompleted: 3,
            totalOngoing: 1,
            signedInResponses: 2,
            guestResponses: 1,
            totalRatingCount: 3,
            avgRating: 4
        });
        expect(payload.overall.breakdown.byOrganization.length).toBeGreaterThan(0);
        expect(payload.overall.breakdown.byRole.length).toBeGreaterThan(0);
        expect(Array.isArray(payload.overall.trend.labels)).toBe(true);

        expect(payload.forms).toHaveLength(2);
        const itForm = payload.forms.find((f) => f.form._id === formItId);
        expect(itForm.form.status).toBe('Active');
        expect(itForm.summary).toMatchObject({
            targetCount: 3, // alice, bob, creator in School of IT
            completedCount: 2, // alice + guest
            ongoingCount: 1, // bob
            pendingCount: 2, // bob & creator have not submitted
            avgRating: 4,
            signedInCount: 1,
            guestCount: 1
        });

        const ratingQ = itForm.questions.find((q) => q._id === qRatingId);
        expect(ratingQ.stats).toMatchObject({
            answeredCount: 2,
            average: 4,
            min: 3,
            max: 5
        });

        const choiceQ = itForm.questions.find((q) => q._id === qChoiceId);
        expect(choiceQ.stats.answeredCount).toBe(2);
        expect(choiceQ.stats.topOption).toBe('Online');

        const aliceRow = itForm.results.find((r) => r._id === aliceId);
        expect(aliceRow.submissionStatus).toBe('submitted');
        expect(aliceRow.respondentType).toBe('signed_in');
        expect(aliceRow.startedAt).toBe(responses[0].createdAt);
        const aliceFileAns = aliceRow.answers.find((a) => a.questionId === qFileId);
        expect(aliceFileAns.value).toBe(`http://localhost:8081/uploads/forms/${formItId}/responses/r1/alice_report.pdf`);

        const bobRow = itForm.results.find((r) => r._id === bobId);
        expect(bobRow.submissionStatus).toBe('ongoing');
        expect(bobRow.submitted).toBe(false);
        expect(bobRow.startedAt).toBe(responses[1].createdAt);
        const bobRatingAns = bobRow.answers.find((a) => a.questionId === qRatingId);
        expect(bobRatingAns).toBeDefined();
        expect(bobRatingAns.value).toBe('4');

        const creatorRow = itForm.results.find((r) => r._id === creatorId);
        expect(creatorRow.submissionStatus).toBe('pending');
        expect(creatorRow.submitted).toBe(false);
        expect(creatorRow.startedAt).toBeNull();

        const guestRow = itForm.results.find((r) => r.respondentType === 'guest');
        expect(guestRow.submissionStatus).toBe('submitted');
        expect(guestRow.name).toBe('Anonymous');
        expect(guestRow.email).toBeNull();
    });

    test('supports filtering by status, orgId, searchQuery, formIds, and timeRange on /api/v1/response/export-analytics', async () => {
        const res = await request(app)
            .get('/api/v1/response/export-analytics')
            .query({
                orgId: orgSciId,
                status: 'Closed',
                searchQuery: 'Science Lab',
                formIds: `${formItId},${formSciId}`,
                timeRange: '7d'
            });

        expect(res.status).toBe(200);
        const payload = res.body.data;
        expect(payload.overall.filters).toMatchObject({
            timeRange: '7d',
            orgId: orgSciId,
            status: 'Closed',
            searchQuery: 'Science Lab'
        });
        expect(payload.forms).toHaveLength(1);
        expect(payload.forms[0].form._id).toBe(formSciId);
        expect(payload.forms[0].summary.completedCount).toBe(1);
    });

    test('scopes accessible forms when userId belongs to non-admin user', async () => {
        UserModel.findById.mockReturnValue(mockChain({ _id: creatorId, role: roleStaff }));

        const res = await request(app)
            .get('/api/v1/analytics/export')
            .query({ userId: creatorId });

        expect(res.status).toBe(200);
        const payload = res.body.data;
        expect(payload.forms).toHaveLength(1);
        expect(payload.forms[0].form._id).toBe(formItId);
    });

    test('ongoing respondents retain draft answers and are marked ongoing or ongoing_closed while completedCount counts only submitted', async () => {
        // Closed form with 1 submitted response and 1 ongoing draft response
        const closedFormId = String(new mongo.ObjectId());
        const qFeedbackId = String(new mongo.ObjectId());
        const userSubmittedId = String(new mongo.ObjectId());
        const userOngoingClosedId = String(new mongo.ObjectId());

        const testClosedForm = {
            _id: closedFormId,
            title: [{ key: 'en', value: 'Closed Evaluation Form' }],
            description: [{ key: 'en', value: 'Closed form description' }],
            organization: [orgSci],
            creator: { _id: adminId },
            collaborator: [],
            schedule: {
                startAt: new Date(nowMs - 10 * 86400000).toISOString(),
                endAt: new Date(nowMs - 86400000).toISOString() // Expired => Closed
            },
            settings: { collectEmail: true, allowedUser: [], allowedRoles: [] },
            questions: [
                {
                    _id: qFeedbackId,
                    order: 1,
                    title: [{ key: 'en', value: 'Draft Feedback' }],
                    type: { type: 'Rating' },
                    config: { maxRating: 5 }
                }
            ]
        };

        const testResponses = [
            // Submitted response on closed form
            {
                _id: String(new mongo.ObjectId()),
                form: closedFormId,
                responder: { _id: userSubmittedId, name: 'Submitted User', email: 'sub@mfu.ac.th', organization: orgSci, role: roleStaff },
                submit: true,
                createdAt: new Date(nowMs - 5 * 86400000).toISOString(),
                answers: [{ question: qFeedbackId, response: '5' }]
            },
            // Ongoing draft response on closed form (saved draft before/as it closed)
            {
                _id: String(new mongo.ObjectId()),
                form: closedFormId,
                responder: { _id: userOngoingClosedId, name: 'Closed Draft User', email: 'draft_closed@mfu.ac.th', organization: orgSci, role: roleStaff },
                submit: false,
                createdAt: new Date(nowMs - 2 * 86400000).toISOString(),
                updatedAt: new Date(nowMs - 2 * 86400000).toISOString(),
                answers: [{ question: qFeedbackId, response: '3' }]
            },
            // Ongoing draft response on active form (IT Satisfaction)
            {
                _id: String(new mongo.ObjectId()),
                form: formItId,
                responder: { _id: bobId, name: 'Bob IT', email: 'bob@mfu.ac.th', organization: orgIt, role: roleStudent },
                submit: false,
                createdAt: new Date(nowMs - 1800000).toISOString(),
                updatedAt: new Date(nowMs - 900000).toISOString(),
                answers: [{ question: qRatingId, response: '4' }]
            },
            // Submitted response on active form (Alice)
            {
                _id: String(new mongo.ObjectId()),
                form: formItId,
                responder: { _id: aliceId, name: 'Alice IT', email: 'alice@mfu.ac.th', organization: orgIt, role: roleStudent },
                submit: true,
                createdAt: new Date(nowMs - 3600000).toISOString(),
                answers: [{ question: qRatingId, response: '5' }, { question: qChoiceId, response: 'online' }]
            }
        ];

        FormModel.find.mockReturnValue(mockChain([testClosedForm, forms[0]]));
        ResponseModel.find.mockReturnValue(mockChain(testResponses));

        const res = await request(app).get('/api/v1/analytics/export');
        expect(res.status).toBe(200);

        const payload = res.body.data;
        const closedExport = payload.forms.find((f) => f.form._id === closedFormId);
        expect(closedExport.form.status).toBe('Closed');
        // completedCount must be 1 (only the submitted response), ongoingCount is 1
        expect(closedExport.summary.completedCount).toBe(1);
        expect(closedExport.summary.ongoingCount).toBe(1);

        // Find the respondent who saved draft on the closed form
        const closedDraftRow = closedExport.results.find((r) => r._id === userOngoingClosedId);
        expect(closedDraftRow).toBeDefined();
        expect(closedDraftRow.submissionStatus).toBe('ongoing_closed');
        expect(closedDraftRow.submitted).toBe(false);
        // Verify draft answers are present in the row
        const draftClosedAns = closedDraftRow.answers.find((a) => a.questionId === qFeedbackId);
        expect(draftClosedAns).toBeDefined();
        expect(draftClosedAns.value).toBe('3');

        // Check active form (IT form) ongoing respondent
        const itExport = payload.forms.find((f) => f.form._id === formItId);
        expect(itExport.form.status).toBe('Active');
        expect(itExport.summary.completedCount).toBe(1); // Alice only
        expect(itExport.summary.ongoingCount).toBe(1); // Bob
        const activeDraftRow = itExport.results.find((r) => r._id === bobId);
        expect(activeDraftRow).toBeDefined();
        expect(activeDraftRow.submissionStatus).toBe('ongoing');
        expect(activeDraftRow.submitted).toBe(false);
        const activeDraftAns = activeDraftRow.answers.find((a) => a.questionId === qRatingId);
        expect(activeDraftAns).toBeDefined();
        expect(activeDraftAns.value).toBe('4');
    });
});
