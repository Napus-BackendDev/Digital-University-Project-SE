'use strict';

const mongo = require('mongodb');
const formService = require('../server/Project/Form/service/form');
const Form = require('../server/Project/Form/controller/form');
const User = require('../server/Project/User/controller/user');
const ResMessage = require('../server/Project/Settings/service/message');
const { canManageForms } = require('../server/Project/Response/utils/responsePolicy');

describe('Form creation authorization (Requirement 5.1 / B6-3 & B6-4)', () => {
    let mockRes;
    let originalUserOnQuery;
    let originalFormOnCreate;
    let originalSendResponse;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        originalUserOnQuery = User.onQuery;
        originalFormOnCreate = Form.onCreate;
        originalSendResponse = ResMessage.sendResponse;

        jest.spyOn(ResMessage, 'sendResponse').mockImplementation((response, num, code, data) => {
            const httpCode = Number(String(code).substring(0, 3));
            return response.status(httpCode).json({ code, data });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        User.onQuery = originalUserOnQuery;
        Form.onCreate = originalFormOnCreate;
        ResMessage.sendResponse = originalSendResponse;
    });

    describe('canManageForms backend policy helper', () => {
        test('evaluates Admin to true', () => {
            expect(canManageForms({ role: { _id: '69aec1c73996270d703db3d7', title: 'Admin' } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }] } })).toBe(true);
            expect(canManageForms({ role: '69aec1c73996270d703db3d7' })).toBe(true);
        });

        test('evaluates Staff to true when matrix has no manage page entry', () => {
            expect(canManageForms({ role: { _id: '69e9e2226c400846810ef689', title: [{ key: 'en', value: 'Staff' }] } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'เจ้าหน้าที่' }] } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'บุคลากร' }] } })).toBe(true);
            expect(canManageForms({ role: '69e9e2226c400846810ef689' })).toBe(true);
        });

        test('evaluates Lecturer to true when matrix has no manage page entry', () => {
            expect(canManageForms({ role: { _id: '69e9e2226c400846810ef688', title: [{ key: 'en', value: 'Lecturer' }] } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'อาจารย์' }] } })).toBe(true);
            expect(canManageForms({ role: '69e9e2226c400846810ef688' })).toBe(true);
        });

        test('evaluates Student to false when matrix has no manage page entry', () => {
            expect(canManageForms({ role: { _id: '69e9e2226c400846810ef687', title: [{ key: 'en', value: 'Student' }] } })).toBe(false);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'นักศึกษา' }] } })).toBe(false);
            expect(canManageForms({ role: '69e9e2226c400846810ef687' })).toBe(false);
        });

        test('evaluates role-less and unknown roles to false', () => {
            expect(canManageForms(null)).toBe(false);
            expect(canManageForms({})).toBe(false);
            expect(canManageForms({ role: null })).toBe(false);
            expect(canManageForms({ role: { title: 'Guest' } })).toBe(false);
        });

        test('evaluates Student whose role matrix grants manage to true', () => {
            const studentWithManage = {
                role: {
                    _id: '69e9e2226c400846810ef687',
                    title: [{ key: 'en', value: 'Student' }],
                    permission: [{ page: 'manage', access: [{ key: 'create', value: true }] }]
                }
            };
            expect(canManageForms(studentWithManage)).toBe(true);

            const studentWithFormsManagement = {
                role: {
                    _id: '69e9e2226c400846810ef687',
                    title: [{ key: 'en', value: 'Student' }],
                    permission: [{ page: 'forms-management', access: [{ key: 'read', value: true }] }]
                }
            };
            expect(canManageForms(studentWithFormsManagement)).toBe(true);
        });
    });

    describe('exports.onCreate controller enforcement', () => {
        test('returns 40300 forbidden when caller has Student role', async () => {
            const studentId = '663150301600000000000001';
            const req = {
                user: { id: studentId },
                body: {
                    title: [{ key: 'en', value: 'Student Attempt' }],
                    creator: studentId
                }
            };

            jest.spyOn(User, 'onQuery').mockResolvedValue({
                _id: new mongo.ObjectId(studentId),
                role: {
                    _id: new mongo.ObjectId('69e9e2226c400846810ef687'),
                    title: [{ key: 'th', value: 'นักศึกษา (Student)' }, { key: 'en', value: 'Student' }],
                    permission: []
                }
            });
            const formCreateSpy = jest.spyOn(Form, 'onCreate');

            await formService.onCreate(req, mockRes);

            expect(ResMessage.sendResponse).toHaveBeenCalledWith(mockRes, 0, 40300);
            expect(formCreateSpy).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        test('succeeds and calls Form.onCreate returning 20000 for Staff role', async () => {
            const staffId = '663150301600000000000002';
            const req = {
                user: { id: staffId },
                body: {
                    title: [{ key: 'en', value: 'Staff Form' }],
                    creator: staffId
                }
            };

            jest.spyOn(User, 'onQuery').mockResolvedValue({
                _id: new mongo.ObjectId(staffId),
                role: {
                    _id: new mongo.ObjectId('69e9e2226c400846810ef689'),
                    title: [{ key: 'th', value: 'เจ้าหน้าที่' }, { key: 'en', value: 'Staff' }],
                    permission: []
                }
            });

            const createdFormDoc = { _id: 'form-staff-1', title: [{ key: 'en', value: 'Staff Form' }] };
            jest.spyOn(Form, 'onCreate').mockResolvedValue(createdFormDoc);

            await formService.onCreate(req, mockRes);

            expect(Form.onCreate).toHaveBeenCalled();
            expect(ResMessage.sendResponse).toHaveBeenCalledWith(mockRes, 0, 20000, createdFormDoc);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        test('succeeds and calls Form.onCreate returning 20000 for Admin role', async () => {
            const adminId = '663150301600000000000003';
            const req = {
                user: { id: adminId },
                body: {
                    title: [{ key: 'en', value: 'Admin Form' }],
                    creator: adminId
                }
            };

            jest.spyOn(User, 'onQuery').mockResolvedValue({
                _id: new mongo.ObjectId(adminId),
                role: {
                    _id: new mongo.ObjectId('69aec1c73996270d703db3d7'),
                    title: [{ key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }, { key: 'en', value: 'Admin' }],
                    permission: []
                }
            });

            const createdFormDoc = { _id: 'form-admin-1', title: [{ key: 'en', value: 'Admin Form' }] };
            jest.spyOn(Form, 'onCreate').mockResolvedValue(createdFormDoc);

            await formService.onCreate(req, mockRes);

            expect(Form.onCreate).toHaveBeenCalled();
            expect(ResMessage.sendResponse).toHaveBeenCalledWith(mockRes, 0, 20000, createdFormDoc);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        test('succeeds for Student whose role matrix grants manage', async () => {
            const studentId = '663150301600000000000004';
            const req = {
                user: { id: studentId },
                body: {
                    title: [{ key: 'en', value: 'Permitted Student Form' }],
                    creator: studentId
                }
            };

            jest.spyOn(User, 'onQuery').mockResolvedValue({
                _id: new mongo.ObjectId(studentId),
                role: {
                    _id: new mongo.ObjectId('69e9e2226c400846810ef687'),
                    title: [{ key: 'en', value: 'Student' }],
                    permission: [{ page: 'manage', access: [{ key: 'create', value: true }] }]
                }
            });

            const createdFormDoc = { _id: 'form-student-granted', title: [{ key: 'en', value: 'Permitted Student Form' }] };
            jest.spyOn(Form, 'onCreate').mockResolvedValue(createdFormDoc);

            await formService.onCreate(req, mockRes);

            expect(Form.onCreate).toHaveBeenCalled();
            expect(ResMessage.sendResponse).toHaveBeenCalledWith(mockRes, 0, 20000, createdFormDoc);
        });

        test('returns 40100 when caller identity cannot be resolved', async () => {
            const req = { body: {} };
            await formService.onCreate(req, mockRes);
            expect(ResMessage.sendResponse).toHaveBeenCalledWith(mockRes, 0, 40100);
        });
    });
});
