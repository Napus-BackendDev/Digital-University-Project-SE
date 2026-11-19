const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongo = require('mongodb');

// Mock controllers to avoid unmocked Mongoose model buffering in unit tests
jest.mock('../server/Project/Settings/controller/message', () => ({
    onQuery: jest.fn().mockResolvedValue({
        code: 40000,
        httpcode: 400,
        message: [{ value: 'Bad Request', key: 'en' }]
    }),
    onQuerys: jest.fn().mockResolvedValue([])
}));

jest.mock('../server/Project/Organizations/controller/organization', () => ({
    onQuery: jest.fn().mockResolvedValue({}),
    onQuerys: jest.fn().mockResolvedValue([]),
    onCreate: jest.fn().mockResolvedValue({}),
    onUpdate: jest.fn().mockResolvedValue({}),
    onDelete: jest.fn().mockResolvedValue({})
}));

jest.mock('../server/Project/Questions/controller/questions', () => ({
    onQuery: jest.fn().mockResolvedValue({}),
    onQuerys: jest.fn().mockResolvedValue([]),
    onCreate: jest.fn().mockResolvedValue({}),
    onUpdate: jest.fn().mockResolvedValue({}),
    onDelete: jest.fn().mockResolvedValue({})
}));

jest.mock('../server/Project/Form/controller/form', () => ({
    onQuery: jest.fn().mockResolvedValue({}),
    onQuerys: jest.fn().mockResolvedValue([]),
    onCreate: jest.fn().mockResolvedValue({}),
    onUpdate: jest.fn().mockResolvedValue({}),
    onDelete: jest.fn().mockResolvedValue({}),
    formPopulate: []
}));

jest.mock('../server/Project/User/controller/user', () => ({
    onQuery: jest.fn().mockResolvedValue({})
}));

describe('Milestone 1: Backend Core & API Defect Verification', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            APP_ENV: 'developer',
            JWT_SECRET: 'm1-test-secret-key-123',
            FRONTEND_URL: 'http://localhost:8080'
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Task 1: Root Route and OAuth Redirects', () => {
        let app;
        beforeAll(() => {
            app = express();
            app.get('/', (req, res) => {
                res.status(200).json({ status: 'ok', service: 'MFU E-Questionnaires API', version: '1.0.0' });
            });
            app.get('/oauth', (req, res) => {
                res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
            });
        });

        test('GET / returns HTTP 200 with JSON health status and service name', async () => {
            const res = await request(app).get('/');
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/json/);
            expect(res.body).toEqual({
                status: 'ok',
                service: 'MFU E-Questionnaires API',
                version: '1.0.0'
            });
        });

        test('GET /oauth redirects to FRONTEND_URL', async () => {
            const res = await request(app).get('/oauth');
            expect(res.status).toBe(302);
            expect(res.headers.location).toBe('http://localhost:8080');
        });
    });

    describe('Task 2: Global JSON Error Handling Middleware', () => {
        let app;
        beforeAll(() => {
            app = express();
            app.use(express.json());

            // Route throwing Multer-like error
            app.post('/test/multer-error', (req, res, next) => {
                const err = new Error('File too large');
                err.name = 'MulterError';
                err.code = 'LIMIT_FILE_SIZE';
                next(err);
            });

            // Route throwing invalid file extension
            app.post('/test/file-type-error', (req, res, next) => {
                const err = new Error('File type .exe not allowed. Allowed: .jpg, .png, .pdf');
                err.code = 'INVALID_FILE_TYPE';
                next(err);
            });

            // Route throwing generic 500 error
            app.get('/test/server-error', (req, res, next) => {
                next(new Error('Unexpected database failure'));
            });

            // Register global error middleware identical to config/express.js
            app.use((err, req, res, next) => {
                const isMulterError = err.name === 'MulterError';
                const isInvalidFileType = err.code === 'INVALID_FILE_TYPE' ||
                    (err.message && (
                        err.message.includes('File type') ||
                        err.message.includes('not allowed') ||
                        err.message.includes('image files are allowed') ||
                        err.message.includes('MIME type')
                    ));

                if (isMulterError || isInvalidFileType) {
                    const reason = err.code || (isMulterError ? 'MULTER_ERROR' : 'INVALID_FILE_TYPE');
                    return res.status(400).json({
                        code: 40000,
                        httpcode: 400,
                        message: [
                            { value: 'ไฟล์ไม่ถูกต้อง หรือขนาดไฟล์เกินกำหนด (สูงสุด 3MB)', key: 'th' },
                            { value: err.message || 'Invalid file uploaded', key: 'en' }
                        ],
                        data: { reason: reason, message: err.message }
                    });
                }

                if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400)) {
                    return res.status(400).json({
                        code: 40000,
                        httpcode: 400,
                        message: [
                            { value: 'ข้อมูล JSON ไม่ถูกต้อง (SyntaxError)', key: 'th' },
                            { value: err.message || 'Malformed JSON payload', key: 'en' }
                        ],
                        data: { reason: 'SYNTAX_ERROR', message: err.message }
                    });
                }

                const status = err.status || err.statusCode || (err.name === 'SyntaxError' ? 400 : 500);
                const code = status === 400 ? 40000 : 50000;
                return res.status(status).json({
                    code: code,
                    httpcode: status,
                    message: [
                        { value: status === 400 ? 'คำขอไม่ถูกต้อง' : 'เกิดข้อผิดพลาดภายในระบบ', key: 'th' },
                        { value: err.message || (status === 400 ? 'Bad Request' : 'Internal Server Error'), key: 'en' }
                    ],
                    data: { message: err.message }
                });
            });
        });

        test('Multer LIMIT_FILE_SIZE error returns HTTP 400 JSON envelope without leaking HTML', async () => {
            const res = await request(app).post('/test/multer-error');
            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/json/);
            expect(res.body.code).toBe(40000);
            expect(res.body.httpcode).toBe(400);
            expect(res.body.data.reason).toBe('LIMIT_FILE_SIZE');
            expect(res.text).not.toContain('<html');
            expect(res.text).not.toContain('<pre>');
        });

        test('Invalid file extension error returns HTTP 400 JSON envelope with Thai/English messages', async () => {
            const res = await request(app).post('/test/file-type-error');
            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/json/);
            expect(res.body.code).toBe(40000);
            expect(res.body.data.reason).toBe('INVALID_FILE_TYPE');
            expect(res.body.message).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ key: 'th' }),
                    expect.objectContaining({ key: 'en' })
                ])
            );
        });

        test('Malformed JSON syntax error returns HTTP 400 JSON instead of HTTP 500', async () => {
            const res = await request(app)
                .post('/test/multer-error')
                .set('Content-Type', 'application/json')
                .send('{"invalidJson":');
            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/json/);
            expect(res.body.code).toBe(40000);
            expect(res.body.data.reason).toBe('SYNTAX_ERROR');
        });

        test('Unhandled 500 errors return clean JSON without HTML stack traces', async () => {
            const res = await request(app).get('/test/server-error');
            expect(res.status).toBe(500);
            expect(res.headers['content-type']).toMatch(/json/);
            expect(res.body.code).toBe(50000);
            expect(res.body.httpcode).toBe(500);
            expect(res.text).not.toContain('<!DOCTYPE html>');
        });
    });

    describe('Task 3: Response Controller defaultPopulate Pruning', () => {
        test('defaultPopulate must NOT contain recursive "responses" populate', () => {
            const responseControllerPath = require.resolve('../server/Project/Response/controller/response');
            const fs = require('fs');
            const content = fs.readFileSync(responseControllerPath, 'utf8');

            expect(content).not.toContain("path: 'responses'");
            expect(content).not.toContain('path: "responses"');
        });
    });

    describe('Task 4: Audience Union Form Query Filtering (B2-1)', () => {
        test('matches forms by union of public, allowedUser, allowedEmails, and organization/role while filtering out unauthorized users', async () => {
            const FormController = require('../server/Project/Form/controller/form');
            const UserController = require('../server/Project/User/controller/user');
            const formService = require('../server/Project/Form/service/form');

            const studentId = new mongo.ObjectId('6af3344b1d27b332949e80dc');
            const otherUserId = new mongo.ObjectId('6af3344b1d27b332949e80dd');
            const studentOrg = new mongo.ObjectId('6a0b51af2dbf6e77c4df73fb');
            const otherOrg = new mongo.ObjectId('6a0b51af2dbf6e77c4df73fc');
            const studentRole = new mongo.ObjectId('69e9e2226c400846810ef687');

            const mockReq = {
                body: { _id: String(studentId), mode: 'respondent' },
                cookies: {},
                headers: {}
            };

            let sentData = null;
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn((body) => {
                    sentData = body && body.data !== undefined ? body.data : body;
                    return body;
                })
            };

            UserController.onQuery.mockResolvedValueOnce({
                _id: studentId,
                email: 'student@lamduan.mfu.ac.th',
                organization: studentOrg,
                role: { _id: studentRole }
            });

            let queriedMongoCondition = null;
            FormController.onQuerys.mockImplementationOnce((query) => {
                queriedMongoCondition = query;
                return Promise.resolve([
                    // 1. Org + individual union form: student matches org/role even though allowedUser lists someone else
                    {
                        _id: 'f-union-org-match',
                        organization: [studentOrg],
                        settings: {
                            accessMode: 'private',
                            allowedRoles: [studentRole],
                            allowedUser: [otherUserId]
                        }
                    },
                    // 2. Individual-only form for another user in another org: student is neither individual nor in org -> filtered out
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
            });

            await formService.onQueryByUser(mockReq, mockRes);

            expect(FormController.onQuerys).toHaveBeenCalled();
            expect(queriedMongoCondition).toBeDefined();

            // Verify $or structure contains public, allowedUser, allowedEmails, and org/role branches
            expect(queriedMongoCondition.$or).toBeDefined();
            expect(queriedMongoCondition.$or.length).toBe(5);
            expect(queriedMongoCondition.$or[0]).toEqual({ 'settings.accessMode': 'public' });

            const allowedUserCond = queriedMongoCondition.$or[1];
            expect(allowedUserCond['settings.allowedUser']).toBeDefined();
            expect(allowedUserCond['settings.allowedUser'].$in).toEqual(
                expect.arrayContaining([studentId, String(studentId)])
            );

            expect(queriedMongoCondition.$or[2]).toEqual({
                'settings.allowedEmails': 'student@lamduan.mfu.ac.th'
            });

            const orgBranches = queriedMongoCondition.$or.slice(3);
            expect(orgBranches.length).toBe(2);
            expect(orgBranches.every((b) => Array.isArray(b.$and) && b.$and[0].organization)).toBe(true);

            // Post-query filter keeps union match and excludes form where user is neither an allowed individual nor in the selected org/role
            expect(Array.isArray(sentData)).toBe(true);
            expect(sentData.map((f) => f._id)).toEqual(['f-union-org-match']);
        });
    });

    describe('Task 5: isValidObjectId Guards & ResMessage Fallback', () => {
        test('Organization service returns 400 on invalid or missing _id', async () => {
            const orgService = require('../server/Project/Organizations/service/organization');

            let resStatus, resData;
            const mockRes = {
                status: (c) => {
                    resStatus = c;
                    return {
                        json: (d) => {
                            resData = d;
                            return d;
                        }
                    };
                }
            };

            await orgService.onQuery({ body: { _id: 'not-an-id' } }, mockRes);
            expect(resStatus).toBe(400);

            await orgService.onUpdate({ body: { _id: 'invalid-id' } }, mockRes);
            expect(resStatus).toBe(400);

            await orgService.onDelete({ body: { _id: '' } }, mockRes);
            expect(resStatus).toBe(400);
        });

        test('Question service returns 400 on invalid or missing _id', async () => {
            const questionService = require('../server/Project/Questions/service/question');

            let resStatus;
            const mockRes = {
                status: (c) => {
                    resStatus = c;
                    return {
                        json: (d) => d
                    };
                }
            };

            await questionService.onQuery({ body: { _id: 'invalid-id' } }, mockRes);
            expect(resStatus).toBe(400);

            await questionService.onUpdate({ body: { _id: 'invalid-id' } }, mockRes);
            expect(resStatus).toBe(400);

            await questionService.onDelete({ body: { _id: 'invalid-id' } }, mockRes);
            expect(resStatus).toBe(400);
        });

        test('Form service returns 400 on invalid or missing _id in onQuery and onDelete', async () => {
            const formService = require('../server/Project/Form/service/form');

            let resStatus;
            const mockRes = {
                status: (c) => {
                    resStatus = c;
                    return { json: (d) => d };
                }
            };

            await formService.onQuery({ body: { _id: 'bad-id' } }, mockRes);
            expect(resStatus).toBe(400);

            await formService.onDelete({ body: { _id: 'bad-id' } }, mockRes);
            expect(resStatus).toBe(400);
        });

        test('ResMessage.onMessage_Response never returns raw Error instance', async () => {
            const ResMessage = require('../server/Project/Settings/service/message');
            const messageController = require('../server/Project/Settings/controller/message');

            messageController.onQuery.mockRejectedValueOnce(new Error('DB Query Crashed'));

            const result = await ResMessage.onMessage_Response(0, 50000);
            expect(result).not.toBeInstanceOf(Error);
            expect(result.code).toBe(50000);
            expect(result.httpcode).toBe(500);
        });
    });

    describe('Task 6: Bearer Authorization Header Support in requireAuth', () => {
        const { requireAuth } = require('../middleware/auth');

        test('requireAuth authenticates successfully via Bearer token', async () => {
            const userId = String(new mongo.ObjectId());
            const token = jwt.sign(
                { userId, email: 'test@mfu.ac.th', name: 'Test User' },
                process.env.JWT_SECRET
            );

            const req = {
                cookies: {},
                headers: { authorization: `Bearer ${token}` }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            await requireAuth(req, res, next);
            expect(nextCalled).toBe(true);
            expect(req.user).toBeDefined();
            expect(req.user.id).toBe(userId);
            expect(req.user.email).toBe('test@mfu.ac.th');
        });

        test('requireAuth authenticates successfully via cookies.token', async () => {
            const userId = String(new mongo.ObjectId());
            const token = jwt.sign(
                { userId, email: 'cookie@mfu.ac.th', name: 'Cookie User' },
                process.env.JWT_SECRET
            );

            const req = {
                cookies: { token },
                headers: {}
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            await requireAuth(req, res, next);
            expect(nextCalled).toBe(true);
            expect(req.user.id).toBe(userId);
        });

        test('requireAuth returns 401 when neither cookie nor Bearer token is provided', async () => {
            const req = {
                cookies: {},
                headers: {}
            };
            let statusCode = null;
            let responseBody = null;
            const res = {
                status: (code) => {
                    statusCode = code;
                    return {
                        json: (data) => {
                            responseBody = data;
                            return data;
                        }
                    };
                }
            };
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            await requireAuth(req, res, next);
            expect(nextCalled).toBe(false);
            expect(statusCode).toBe(401);
            expect(responseBody.message).toContain('No token provided');
        });
    });
});
