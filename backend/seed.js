'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.dev') });
const mongoose = require('mongoose');

// Import Models
const Form = require('./server/Project/Form/models/form.model');
const Response = require('./server/Project/Response/model/response.model');
const User = require('./server/Project/User/models/user.model');
const Role = require('./server/Project/User/models/roles.model');
const Questions = require('./server/Project/Questions/models/questions.model');
const QuestionType = require('./server/Project/Settings/models/question_type.model');
const Organization = require('./server/Project/Organizations/models/organization.model');

const mongoURI = process.env.MONGODB;

async function seedDatabase() {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // 2. Clear existing data
        await Promise.all([
            Organization.deleteMany({}),
            Role.deleteMany({}),
            User.deleteMany({}),
            QuestionType.deleteMany({}),
            Questions.deleteMany({}),
            Form.deleteMany({}),
            Response.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing data');

        // 3. Seed Organizations
        const orgTemplates = [
            { en: 'General', th: 'ทั่วไป' },
            { en: 'Information Technology Center', th: 'ศูนย์เทคโนโลยีสารสนเทศ' },
            { en: 'Faculty of Engineering', th: 'คณะวิศวกรรมศาสตร์' },
            { en: 'Faculty of Science', th: 'คณะวิทยาศาสตร์' },
            { en: 'Faculty of Medicine', th: 'คณะแพทยศาสตร์' },
            { en: 'Graduate School', th: 'บัณฑิตวิทยาลัย' },
            { en: 'Office of the Registrar', th: 'สำนักทะเบียนและประมวลผล' },
            { en: 'Main Library', th: 'ห้องสมุดกลาง' },
            { en: 'Student Affairs Division', th: 'กองกิจการนักศึกษา' }
        ];

        const orgsData = orgTemplates.map((org, index) => ({
            // Keep the first one with a fixed ID if referenced elsewhere
            _id: index === 0 ? new mongoose.Types.ObjectId("69baf8349050b9215c700b96") : new mongoose.Types.ObjectId(),
            title: [
                { key: 'en', value: org.en },
                { key: 'th', value: org.th }
            ]
        }));

        const createdOrgs = await Organization.insertMany(orgsData);
        console.log(`✅ Seeded ${createdOrgs.length} diverse organizations`);

        // 4. Seed Roles (using title array as per roles.model.js)
        const rolesData = [
            {
                _id: new mongoose.Types.ObjectId("69aec1c73996270d703db3d7"), // Default role ID from user.model.js
                title: [
                    { key: 'en', value: 'Admin' },
                    { key: 'th', value: 'ผู้ดูแลระบบ' }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'Staff' },
                    { key: 'th', value: 'เจ้าหน้าที่' }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'User' },
                    { key: 'th', value: 'ผู้ใช้งานทั่วไป' }
                ]
            }
        ];
        const createdRoles = await Role.insertMany(rolesData);
        console.log(`✅ Seeded ${createdRoles.length} roles`);

        // 5. Seed Question Types
        const typeNames = ['short_answer', 'paragraph', 'multiple_choice', 'checkbox', 'rating', 'file_upload', 'image', 'title_description'];
        const createdTypes = await QuestionType.insertMany(typeNames.map(t => ({ type: t })));
        console.log(`✅ Seeded ${createdTypes.length} question types`);

        // 6. Seed Users
        const users = [];
        
        const firstNames = ['Somchai', 'Somsri', 'Wichai', 'Malee', 'Anan', 'Pitsanu', 'Kanya', 'Thana', 'Santi', 'Pornchai', 'Siriporn', 'Nicha', 'Somsak', 'Patcharee', 'Narong', 'Prasert', 'Wanna', 'Prayoon', 'Sunee', 'Ubon'];
        const lastNames = ['Srakaew', 'Sripai', 'Rakdee', 'Maneerat', 'Kongka', 'Kerdphol', 'Choojai', 'Noppakun', 'Saengsom', 'Sukjai', 'Prathum', 'Kamsin', 'Wongkaew', 'Sinthan', 'Boonmee', 'Chaisri', 'Saethang', 'Promdee', 'Yindee', 'Saengdao'];

        // Main Admin (Fixed ID)
        const adminUser = await User.create({
            _id: new mongoose.Types.ObjectId("69aec1c73996270d703db3aa"),
            name: 'System Admin',
            email: 'admin@digital.uni',
            password: 'password123',
            role: createdRoles[0]._id, // Admin
            organization: createdOrgs[1]._id // Digital University
        });
        users.push(adminUser);

        // 30 more users distributed across organizations
        for (let i = 1; i <= 30; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@demo.uni`;
            
            const roleIdx = (i % 2) + 1; // Cycle between Staff (1) and User (2)
            
            const u = await User.create({
                name: fullName,
                email: email,
                password: 'password123',
                role: createdRoles[roleIdx]._id,
                organization: createdOrgs[Math.floor(Math.random() * createdOrgs.length)]._id
            });
            users.push(u);
        }

        console.log(`✅ Seeded ${users.length} users with randomized names`);

        // 7. Seed Forms
        const forms = [];
        const formTemplates = [
            { en: 'Student Satisfaction Survey 2024', th: 'แบบประเมินความพึงพอใจนักศึกษา 2567' },
            { en: 'Library Service Feedback', th: 'ความเห็นการใช้บริการห้องสมุด' },
            { en: 'Digital Literacy Assessment', th: 'แบบทดสอบทักษะดิจิทัล' },
            { en: 'Campus Facilities Evaluation', th: 'ประเมินสิ่งอำนวยความสะดวกในวิทยาเขต' },
            { en: 'Canteen Food Quality Survey', th: 'สำรวจคุณภาพอาหารในโรงอาหาร' }
        ];

        for (let i = 0; i < formTemplates.length; i++) {
            const f = await Form.create({
                title: [
                    { key: 'en', value: formTemplates[i].en },
                    { key: 'th', value: formTemplates[i].th }
                ],
                description: [
                    { key: 'en', value: `Official feedback form for ${formTemplates[i].en}` },
                    { key: 'th', value: `แบบฟอร์มรับฟังความคิดเห็นอย่างเป็นทางการสำหรับ ${formTemplates[i].th}` }
                ],
                creator: adminUser._id,
                organization: createdOrgs[Math.floor(Math.random() * createdOrgs.length)]._id,
                schedule: {
                    startAt: new Date(Date.now() - 24 * 60 * 60 * 1000), 
                    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            forms.push(f);
        }
        console.log(`✅ Seeded ${forms.length} diverse forms`);

        // 8 & 9. Seed Questions and Responses for EACH form
        const departments = ['IT Support', 'Human Resources', 'Accounting', 'Public Relations', 'Student Development', 'Academic Office'];
        const choicesList = ['0', '1', '2'];

        for (let formIdx = 0; formIdx < forms.length; formIdx++) {
            const currentForm = forms[formIdx];
            
            const questionsData = [
                {
                    form: currentForm._id,
                    order: 1,
                    title: [{ key: 'en', value: 'Department' }, { key: 'th', value: 'หน่วยงานสังกัด' }],
                    type: createdTypes.find(t => t.type === 'short_answer')._id,
                    isRequired: true
                },
                {
                    form: currentForm._id,
                    order: 2,
                    title: [{ key: 'en', value: 'Service Satisfaction' }, { key: 'th', value: 'ความพึงพอใจต่อบริการ' }],
                    type: createdTypes.find(t => t.type === 'rating')._id,
                    config: { maxRating: 5 },
                    isRequired: true
                },
                {
                    form: currentForm._id,
                    order: 3,
                    title: [{ key: 'en', value: 'Tools used most often?' }, { key: 'th', value: 'เครื่องมือที่ใช้บ่อยที่สุด' }],
                    type: createdTypes.find(t => t.type === 'checkbox')._id,
                    config: {
                        choices: [
                            { key: '0', lang: [{ key: 'en', value: 'ERP' }, { key: 'th', value: 'ระบบ ERP' }] },
                            { key: '1', lang: [{ key: 'en', value: 'LMS' }, { key: 'th', value: 'ระบบ LMS' }] },
                            { key: '2', lang: [{ key: 'en', value: 'E-Office' }, { key: 'th', value: 'ระบบงานสารบรรณ' }] }
                        ],
                        allowMultipleSelect: true
                    }
                }
            ];
            const createdQuestions = await Questions.insertMany(questionsData);
            await Form.findByIdAndUpdate(currentForm._id, { $push: { questions: { $each: createdQuestions.map(q => q._id) } } });

            const responsesPerForm = 15 + (formIdx % 5);
            for (let r = 0; r < responsesPerForm; r++) {
                const responder = users[(formIdx * 3 + r) % users.length];
                
                // Randomize creation date within last 7 days
                const daysAgo = Math.floor(Math.random() * 7);
                const randomDate = new Date();
                randomDate.setDate(randomDate.getDate() - daysAgo);
                randomDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

                await Response.create({
                    responder: responder._id,
                    form: currentForm._id,
                    answers: [
                        { question: createdQuestions[0]._id, response: departments[(formIdx + r) % departments.length] },
                        { question: createdQuestions[1]._id, response: ((formIdx + r) % 5) + 1 },
                        { question: createdQuestions[2]._id, response: r % 2 === 0 ? [choicesList[r % 3]] : [choicesList[r % 3], choicesList[(r + 1) % 3]] }
                    ],
                    submit: true,
                    createdAt: randomDate
                });
            }
            console.log(`✅ Seeded ${createdQuestions.length} questions and ${responsesPerForm} responses for: ${currentForm.title.find(t => t.key === 'en').value}`);
        }

        console.log('\n🌟 Database seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error during database seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed\n');
        process.exit(0);
    }
}

seedDatabase();
