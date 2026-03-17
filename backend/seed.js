'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.dev') });
const mongoose = require('mongoose');
const Form = require('./server/Project/Form/models/form.model');
const Response = require('./server/Project/Response/model/response.model');
// Role and User models may not exist as files; will resolve dynamically below
// const Role = require('./server/Project/User/models/role.model');
// const User = require('./server/Project/User/models/user.model');
const Questions = require('./server/Project/Questions/models/questions.model');
const Question_Types = require('./server/Project/Settings/models/question_type.model');

// MongoDB connection
const mongoURI = process.env.MONGODB;

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        await Form.deleteMany({});
        await Response.deleteMany({});
        await Questions.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // 0.1 CREATE USERS, ORGANIZATION, QUESTION TYPES, FORMS, QUESTIONS, RESPONSES
        // ============================================
        // Create Question Types
        const questionTypeNames = ['short_answer', 'paragraph', 'multiple_choice', 'checkbox', 'rating', 'file_upload', 'image', 'title_description'];
        await Question_Types.deleteMany({});
        const createdTypes = await Question_Types.insertMany(questionTypeNames.map(t => ({ type: t })));
        console.log(`✅ Created ${createdTypes.length} question types`);

        // Create a placeholder Organization model if not present in the repo
        let Organization;
        try {
            Organization = mongoose.model('Organizations');
        } catch (e) {
            const OrgSchema = new mongoose.Schema({ name: String }, { timestamps: true });
            Organization = mongoose.model('Organizations', OrgSchema, 'Organizations');
        }
        await Organization.deleteMany({});
        const org = await Organization.create({ name: 'Default Organization' });

        // Create Roles (Admin, Staff, User)
        let Role;
        try {
            Role = mongoose.model('Roles');
        } catch (e) {
            const RoleSchema = new mongoose.Schema({ name: String, description: String, permissions: [String] }, { timestamps: true });
            Role = mongoose.model('Roles', RoleSchema, 'Roles');
        }
        await Role.deleteMany({});
        const roles = await Role.insertMany([
            { name: 'ADMIN', description: 'Administrator with full access', permissions: ['*'] },
            { name: 'STAFF', description: 'Staff member with management privileges', permissions: ['VIEW_FORMS','CREATE_FORM','UPDATE_FORM','DELETE_FORM'] },
            { name: 'USER', description: 'Regular user', permissions: ['SUBMIT_RESPONSES','VIEW_OWN_RESPONSES'] }
        ]);
        console.log('✅ Created roles');

        // Create a single user
        let User;
        try {
            User = mongoose.model('Users');
        } catch (e) {
            User = require('./server/Project/User/models/user.model');
        }
        await User.deleteMany({});
        const user = await User.create({ name: 'Seed Admin', email: 'seed@local.test', password: 'seedpass', organization: org._id });
        console.log('✅ Created user and organization');

        // Clear existing Question, Form, Response collections
        await Questions.deleteMany({});
        await Form.deleteMany({});
        await Response.deleteMany({});

        // Create 10 Forms (with schedule dates)
        const forms = [];
        for (let i = 1; i <= 10; i++) {
            const f = await Form.create({
                title: [{ key: 'en', value: `Mock Form ${i}` }],
                description: [{ key: 'en', value: `This is mock form number ${i}` }],
                creator: user._id,
                status: null,
                // set schedule to now + i days for start, + (i+7) days for end
                schedule: {
                    startAt: new Date(Date.now() + (i - 1) * 24 * 60 * 60 * 1000),
                    endAt: new Date(Date.now() + (i + 6) * 24 * 60 * 60 * 1000)
                }
            });
            forms.push(f);
        }
        console.log('✅ Created 10 forms');

        // Helper: get type id by name
        const typeByName = (name) => (createdTypes.find(t => t.type === name) || {})._id || null;

        // Create 10 Questions (distributed across forms)
        const questions = [];
        for (let i = 1; i <= 10; i++) {
            const form = forms[(i - 1) % forms.length];
            const typeName = questionTypeNames[(i - 1) % questionTypeNames.length];
            const qTypeId = typeByName(typeName);
            const config = {};
            if (typeName === 'multiple_choice' || typeName === 'checkbox') {
                config.choices = [
                    { key: '0', lang: [{ key: 'en', value: 'Option A' }] },
                    { key: '1', lang: [{ key: 'en', value: 'Option B' }] }
                ];
                config.allowMultipleSelect = typeName === 'checkbox';
            }
            if (typeName === 'rating') config.maxRating = 5;
            if (typeName === 'file_upload') { config.maxFiles = 1; config.maxFileSize = 1; config.fileTypes = ['img', 'pdf']; }
            if (typeName === 'title_description') config.description = [{ key: 'en', value: 'Section description' }];
            if (typeName === 'image') config.image = '';

            const q = await Questions.create({
                form: form._id,
                order: i,
                title: [{ key: 'en', value: `Question ${i} (${typeName})` }],
                type: qTypeId,
                config,
                isRequired: i % 2 === 0
            });
            // ensure Form.questions contains this question id so Form doc has proper references
            try {
                await Form.findByIdAndUpdate(form._id, { $push: { questions: q._id } });
            } catch (pushErr) {
                console.warn('Warning: could not push question to form.questions', pushErr);
            }
            questions.push(q);
        }
        console.log('✅ Created 10 questions');

        // Create 10 Responses (attach to forms and questions)
        for (let i = 1; i <= 10; i++) {
            const targetForm = forms[(i - 1) % forms.length];
            // pick questions for this form
            const qs = questions.filter(q => q.form.toString() === targetForm._id.toString());
            const answers = qs.map((q, idx) => {
                const qType = createdTypes.find(t => t._id.toString() === q.type.toString());
                const tname = qType ? qType.type : 'short_answer';
                let respVal = null;
                switch (tname) {
                    case 'short_answer': respVal = `Answer ${i}-${idx}`; break;
                    case 'paragraph': respVal = `Long answer for ${i}-${idx}`; break;
                    case 'multiple_choice': respVal = q.config && Array.isArray(q.config.choices) && q.config.choices[0] ? q.config.choices[0].lang[0].value : 'Option A'; break;
                    case 'checkbox': respVal = q.config && Array.isArray(q.config.choices) ? q.config.choices.map(c => c.lang[0].value) : ['Option A']; break;
                    case 'rating': respVal = 4; break;
                    case 'file_upload': respVal = [{ name: 'file1.png', url: '/uploads/file1.png' }]; break;
                    case 'image': respVal = '/uploads/img.png'; break;
                    case 'title_description': respVal = 'Section read'; break;
                    default: respVal = `Answer ${i}-${idx}`;
                }
                return { question: q._id, response: respVal };
            });
            try {
                console.log(`Creating response ${i} for form ${targetForm._id} with ${answers.length} answers`);
                // Ensure answers are plain objects (strip any model prototypes)
                const payload = { responder: user._id, form: targetForm._id, answers: JSON.parse(JSON.stringify(answers)), submit: true };
                await Response.create(payload);
            } catch (respErr) {
                console.error(`Error creating response ${i}:`, respErr);
                console.error('Payload:', { responder: user._id, form: targetForm._id, answersLength: answers.length });
                throw respErr;
            }
        }
        console.log('✅ Created 10 responses');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seed function
seedDatabase();