/**
 * Request validation helpers using express-validator.
 * Apply these as middleware on individual routes.
 */
const { check, validationResult } = require('express-validator/check');

// ====================================
// Validation result handler middleware
// ====================================
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            code: 40000,
            httpcode: 400,
            message: [
                { key: 'th', value: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูล' },
                { key: 'en', value: 'Validation failed' }
            ],
            errors: errors.array()
        });
    }
    next();
};

// ====================================
// Form validations
// ====================================
const validateFormCreate = [
    check('title').isArray({ min: 1 }).withMessage('Title is required and must be an array'),
    handleValidation
];

const validateFormGetById = [
    check('_id').exists().withMessage('Form ID (_id) is required'),
    handleValidation
];

const validateFormUpdate = [
    check('_id').exists().withMessage('Form ID (_id) is required'),
    handleValidation
];

const validateFormDelete = [
    check('_id').exists().withMessage('Form ID (_id) is required'),
    handleValidation
];

// ====================================
// Question validations
// ====================================
const validateQuestionCreate = [
    check('form').optional(),
    check('type').optional(),
    handleValidation
];

const validateQuestionGetById = [
    check('_id').exists().withMessage('Question ID (_id) is required'),
    handleValidation
];

const validateQuestionUpdate = [
    check('_id').optional(),
    handleValidation
];

const validateQuestionDelete = [
    check('_id').exists().withMessage('Question ID (_id) is required'),
    handleValidation
];

// ====================================
// Response validations
// ====================================
const validateResponseCreate = [
    check('form').optional(),
    check('responder').optional(),
    handleValidation
];


const validateResponseUpdate = [
    check('_id').exists().withMessage('Response ID (_id) is required'),
    handleValidation
];

const validateResponseDelete = [
    check('_id').exists().withMessage('Response ID (_id) is required'),
    handleValidation
];

const validateResponseDeleteById = [
    check('id').exists().withMessage('Response ID (id) in path is required'),
    handleValidation
];

module.exports = {
    handleValidation,
    // Form
    validateFormCreate,
    validateFormGetById,
    validateFormUpdate,
    validateFormDelete,
    // Question
    validateQuestionCreate,
    validateQuestionGetById,
    validateQuestionUpdate,
    validateQuestionDelete,
    // Response
    validateResponseCreate,
    validateResponseUpdate,
    validateResponseDelete,
    validateResponseDeleteById
};
