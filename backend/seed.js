'use strict';

require('dotenv').config({ path: '.env.dev' });
const mongoose = require('mongoose');
const Form = require('./server/Project/Form/models/form.model');
const Response = require('./server/Project/Response/models/response.model');
const Role = require('./server/Project/Role/models/role.model');
const User = require('./server/Project/User/models/user.model');
const { Questions, TextQuestion, RatingQuestion, CheckboxQuestion, ChoicesQuestion } = require('./server/Project/Questions/models/questions.model');

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
        await Role.deleteMany({});
        await User.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // ============================================
        // 0. CREATE ROLES
        // ============================================
        
        const roles = await Role.create([
            {
                name: 'ADMIN',
                description: 'Administrator with full system access',
                permissions: [
                    // User Management
                    'VIEW_USERS',
                    'DELETE_USER',
                    // Form Management
                    'VIEW_FORMS',
                    'CREATE_FORM',
                    'UPDATE_FORM',
                    'DELETE_FORM',
                    'DUPLICATE_FORM',
                    // Question Management
                    'VIEW_QUESTIONS',
                    'CREATE_QUESTION',
                    'UPDATE_QUESTION',
                    'DELETE_QUESTION',
                    // Response Management
                    'VIEW_RESPONSES',
                    'VIEW_OWN_RESPONSES',
                    'SUBMIT_RESPONSES',
                    'EDIT_RESPONSES',
                    'DELETE_RESPONSES',
                    'EXPORT_RESPONSES'
                ]
            },
            {
                name: 'STAFF',
                description: 'Staff member with form and response management',
                permissions: [
                    // Form Management
                    'VIEW_FORMS',
                    'CREATE_FORM',
                    'UPDATE_FORM',
                    'DELETE_FORM',
                    'DUPLICATE_FORM',
                    // Question Management
                    'VIEW_QUESTIONS',
                    'CREATE_QUESTION',
                    'UPDATE_QUESTION',
                    'DELETE_QUESTION',
                    // Response Management
                    'VIEW_RESPONSES',
                    'VIEW_OWN_RESPONSES',
                    'SUBMIT_RESPONSES',
                    'EXPORT_RESPONSES'
                ]
            },
            {
                name: 'USER',
                description: 'Regular user with basic access',
                permissions: [
                    // Form Viewing
                    'VIEW_FORMS',
                    // Response Submission
                    'SUBMIT_RESPONSES', 
                    'VIEW_OWN_RESPONSES',
                    
                ]
            }
        ]);

        console.log(`✅ Created ${roles.length} roles`);

        // ============================================
        // 0.1 CREATE USERS
        // ============================================
        
        // const users = await User.create([
        //     {
        //         email: 'admin@university.edu',
        //         password: 'admin123', // In production, this should be hashed
        //         name: 'Admin User',
        //         roles: [roles[0]._id] // ADMIN role
        //     },
        //     {
        //         email: 'staff@university.edu',
        //         password: 'staff123', // In production, this should be hashed
        //         name: 'Staff Member',
        //         roles: [roles[1]._id] // STAFF role
        //     },
        //     {
        //         email: 'john.doe@university.edu',
        //         password: 'user123', // In production, this should be hashed
        //         name: 'John Doe',
        //         roles: [roles[2]._id] // USER role
        //     },
        //     {
        //         email: 'jane.smith@university.edu',
        //         password: 'user123', // In production, this should be hashed
        //         name: 'Jane Smith',
        //         roles: [roles[2]._id] // USER role
        //     }
        // ]);

        // console.log(`✅ Created ${users.length} users`);

        // // ============================================
        // // 1. CREATE QUESTIONS
        // // ============================================
        
        // // Questions for Student Satisfaction Survey
        // const satisfactionQuestions = [
        //     await TextQuestion.create({
        //         order: 1,
        //         questionText: 'What do you think about our university?',
        //         required: true,
        //         subquestionText: 'Please provide detailed feedback'
        //     }),
        //     await RatingQuestion.create({
        //         order: 2,
        //         questionText: 'Rate your overall satisfaction',
        //         required: true,
        //         min: 1,
        //         max: 5,
        //         step: 1
        //     }),
        //     await CheckboxQuestion.create({
        //         order: 3,
        //         questionText: 'What aspects did you like the most? (Select all that apply)',
        //         required: false,
        //         checked: false
        //     }),
        //     await RatingQuestion.create({
        //         order: 4,
        //         questionText: 'Rate the course content',
        //         required: true,
        //         min: 1,
        //         max: 5,
        //         step: 1
        //     }),
        //     await RatingQuestion.create({
        //         order: 5,
        //         questionText: 'Rate the instructor',
        //         required: true,
        //         min: 1,
        //         max: 5,
        //         step: 1
        //     }),
        //     await TextQuestion.create({
        //         order: 6,
        //         questionText: 'Any suggestions for improvement?',
        //         required: false,
        //         subquestionText: 'Your feedback helps us improve'
        //     })
        // ];

        // // Questions for Course Feedback Form
        // const courseFeedbackQuestions = [
        //     await TextQuestion.create({
        //         order: 1,
        //         questionText: 'Course Name',
        //         required: true,
        //         subquestionText: 'Enter the full course name'
        //     }),
        //     await RatingQuestion.create({
        //         order: 2,
        //         questionText: 'Overall course rating',
        //         required: true,
        //         min: 1,
        //         max: 5,
        //         step: 1
        //     }),
        //     await TextQuestion.create({
        //         order: 3,
        //         questionText: 'What did you learn from this course?',
        //         required: false,
        //         subquestionText: 'Describe key takeaways'
        //     })
        // ];

        // // Questions for Event Registration
        // const eventQuestions = [
        //     await TextQuestion.create({
        //         order: 1,
        //         questionText: 'Full Name',
        //         required: true,
        //         subquestionText: 'First and Last Name'
        //     }),
        //     await TextQuestion.create({
        //         order: 2,
        //         questionText: 'Email Address',
        //         required: true,
        //         subquestionText: 'University email preferred'
        //     }),
        //     await CheckboxQuestion.create({
        //         order: 3,
        //         questionText: 'Select sessions to attend',
        //         required: false,
        //         checked: false
        //     })
        // ];

        // // Questions for Library Services
        // const libraryQuestions = [
        //     await RatingQuestion.create({
        //         order: 1,
        //         questionText: 'Rate library facilities',
        //         required: true,
        //         min: 1,
        //         max: 5,
        //         step: 1
        //     }),
        //     await CheckboxQuestion.create({
        //         order: 2,
        //         questionText: 'Which services do you use?',
        //         required: false,
        //         checked: false
        //     })
        // ];

        // // Questions for IT Support
        // const itSupportQuestions = [
        //     await TextQuestion.create({
        //         order: 1,
        //         questionText: 'Describe your issue',
        //         required: true,
        //         subquestionText: 'Provide as much detail as possible'
        //     }),
        //     await CheckboxQuestion.create({
        //         order: 2,
        //         questionText: 'Problem category',
        //         required: true,
        //         checked: false
        //     }),
        //     await RatingQuestion.create({
        //         order: 3,
        //         questionText: 'Urgency level (1=Low, 5=Critical)',
        //         required: true,
        //         min: 1,
        //         max: 5,
        //         step: 1
        //     })
        // ];

        // // Questions with Sub-questions for Advanced Survey
        // const subQuestion1 = await TextQuestion.create({
        //     order: 1,
        //     questionText: 'Please specify which programming languages',
        //     required: false,
        //     subquestionText: 'List programming languages you use'
        // });

        // const subQuestion2 = await RatingQuestion.create({
        //     order: 2,
        //     questionText: 'Rate your satisfaction with technical support',
        //     required: true,
        //     min: 1,
        //     max: 5,
        //     step: 1
        // });

        // const advancedSurveyQuestions = [
        //     await TextQuestion.create({
        //         order: 1,
        //         questionText: 'What is your role?',
        //         required: true,
        //         subquestionText: 'e.g., Student, Faculty, Staff'
        //     }),
        //     await ChoicesQuestion.create({
        //         order: 2,
        //         questionText: 'Do you use programming in your work/studies?',
        //         required: true,
        //         option: false,
        //         subQuestion: [subQuestion1._id]
        //     }),
        //     await ChoicesQuestion.create({
        //         order: 3,
        //         questionText: 'Have you contacted technical support?',
        //         required: true,
        //         option: false,
        //         subQuestion: [subQuestion2._id]
        //     }),
        //     await CheckboxQuestion.create({
        //         order: 4,
        //         questionText: 'Which facilities do you use regularly?',
        //         required: false,
        //         checked: false
        //     })
        // ];

        // console.log(`✅ Created ${satisfactionQuestions.length + courseFeedbackQuestions.length + eventQuestions.length + libraryQuestions.length + itSupportQuestions.length + advancedSurveyQuestions.length + 2} questions (including 2 sub-questions)`);

        // // ============================================
        // // 2. CREATE FORMS WITH QUESTION REFERENCES
        // // ============================================
        
        // const forms = await Form.insertMany([
        //     {
        //         title: [
        //             { key: 'en', value: 'Student Satisfaction Survey' },
        //             { key: 'th', value: 'แบบสำรวจความพึงพอใจของนักศึกษา' }
        //         ],
        //         can_duplicate: false,
        //         status: 'open',
        //         schedule: {
        //             mode: 'auto',
        //             startAt: new Date('2025-01-01'),
        //             endAt: new Date('2025-12-31')
        //         }
        //     },
        //     {
        //         title: [
        //             { key: 'en', value: 'Course Feedback Form' },
        //             { key: 'th', value: 'แบบฟอร์มข้อเสนอแนะรายวิชา' }
        //         ],
        //         can_duplicate: true,
        //         status: 'open',
        //         schedule: {
        //             mode: 'manual',
        //             startAt: null,
        //             endAt: null
        //         }
        //     },
        //     {
        //         title: [
        //             { key: 'en', value: 'Event Registration' },
        //             { key: 'th', value: 'ลงทะเบียนเข้าร่วมกิจกรรม' }
        //         ],
        //         can_duplicate: false,
        //         status: 'draft',
        //         schedule: {
        //             mode: 'manual',
        //             startAt: null,
        //             endAt: null
        //         }
        //     },
        //     {
        //         title: [
        //             { key: 'en', value: 'Library Services Evaluation' },
        //             { key: 'th', value: 'ประเมินบริการห้องสมุด' }
        //         ],
        //         can_duplicate: false,
        //         status: 'close',
        //         schedule: {
        //             mode: 'auto',
        //             startAt: new Date('2024-01-01'),
        //             endAt: new Date('2024-12-31')
        //         }
        //     },
        //     {
        //         title: [
        //             { key: 'en', value: 'IT Support Request' },
        //             { key: 'th', value: 'แจ้งปัญหาด้านเทคโนโลยีสารสนเทศ' }
        //         ],
        //         can_duplicate: true,
        //         status: 'open',
        //         schedule: {
        //             mode: 'manual',
        //             startAt: null,
        //             endAt: null
        //         }
        //     },
        //     {
        //         title: [
        //             { key: 'en', value: 'Advanced University Survey' },
        //             { key: 'th', value: 'แบบสำรวจขั้นสูงของมหาวิทยาลัย' }
        //         ],
        //         can_duplicate: false,
        //         status: 'open',
        //         schedule: {
        //             mode: 'auto',
        //             startAt: new Date('2025-01-01'),
        //             endAt: new Date('2025-06-30')
        //         }
        //     }
        // ]);

        // console.log(`✅ Created ${forms.length} forms`);

        // // ============================================
        // // 3. CREATE RESPONSES WITH QUESTION REFERENCES
        // // ============================================
        
        // const responses = await Response.insertMany([
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[0]._id,
        //         answers: [
        //             { 
        //                 question: satisfactionQuestions[0]._id,
        //                 response: 'Very satisfied with the course content and teaching methods. The professors are knowledgeable and helpful.' 
        //             },
        //             { 
        //                 question: satisfactionQuestions[1]._id,
        //                 response: 5 
        //             },
        //             { 
        //                 question: satisfactionQuestions[2]._id,
        //                 response: ['Teaching quality', 'Course materials', 'Campus environment'] 
        //             },
        //             {
        //                 question: satisfactionQuestions[3]._id,
        //                 response: 5
        //             },
        //             {
        //                 question: satisfactionQuestions[4]._id,
        //                 response: 5
        //             },
        //             {
        //                 question: satisfactionQuestions[5]._id,
        //                 response: 'More practical exercises would be great'
        //             }
        //         ],
        //         submittedAt: new Date('2025-02-15')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[3]._id,
        //         answers: [
        //             { 
        //                 question: libraryQuestions[0]._id,
        //                 response: 4 
        //             },
        //             { 
        //                 question: libraryQuestions[1]._id,
        //                 response: ['Study rooms', 'Computer labs'] 
        //             }
        //         ],
        //         submittedAt: new Date('2025-03-20')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[4]._id,
        //         answers: [
        //             { 
        //                 question: satisfactionQuestions[0]._id,
        //                 response: 'The curriculum is comprehensive but challenging' 
        //             },
        //             { 
        //                 question: satisfactionQuestions[1]._id,
        //                 response: 3 
        //             },
        //             { 
        //                 question: satisfactionQuestions[2]._id,
        //                 response: ['Course materials', 'Lab facilities'] 
        //             },
        //             {
        //                 question: satisfactionQuestions[3]._id,
        //                 response: 3
        //             },
        //             {
        //                 question: satisfactionQuestions[4]._id,
        //                 response: 4
        //             },
        //             {
        //                 question: satisfactionQuestions[5]._id,
        //                 response: 'Need better equipment in labs'
        //             }
        //         ],
        //         submittedAt: new Date('2025-03-20')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[1]._id,
        //         answers: [
        //             { 
        //                 question: courseFeedbackQuestions[0]._id,
        //                 response: 'Software Engineering SE301' 
        //             },
        //             { 
        //                 question: courseFeedbackQuestions[1]._id,
        //                 response: 5 
        //             },
        //             { 
        //                 question: courseFeedbackQuestions[2]._id,
        //                 response: 'Learned agile methodologies, design patterns, and best practices for software development' 
        //             }
        //         ],
        //         submittedAt: new Date('2025-02-20')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[3]._id,
        //         answers: [
        //             { 
        //                 question: courseFeedbackQuestions[0]._id,
        //                 response: 'Database Systems DB201' 
        //             },
        //             { 
        //                 question: courseFeedbackQuestions[1]._id,
        //                 response: 4 
        //             },
        //             { 
        //                 question: courseFeedbackQuestions[2]._id,
        //                 response: 'Understanding of SQL, database design, normalization, and query optimization' 
        //             }
        //         ],
        //         submittedAt: new Date('2025-03-05')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[4]._id,
        //         answers: [
        //             { 
        //                 question: itSupportQuestions[0]._id,
        //                 response: 'Cannot access university email account. Keep getting authentication errors.' 
        //             },
        //             { 
        //                 question: itSupportQuestions[1]._id,
        //                 response: ['Email'] 
        //             },
        //             { 
        //                 question: itSupportQuestions[2]._id,
        //                 response: 4 
        //             }
        //         ],
        //         submittedAt: new Date('2025-04-01')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[4]._id,
        //         answers: [
        //             { 
        //                 question: itSupportQuestions[0]._id,
        //                 response: 'Wi-Fi connection is very slow in the library area' 
        //             },
        //             { 
        //                 question: itSupportQuestions[1]._id,
        //                 response: ['Network'] 
        //             },
        //             { 
        //                 question: itSupportQuestions[2]._id,
        //                 response: 2 
        //             }
        //         ],
        //         submittedAt: new Date('2025-03-15')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[5]._id,
        //         answers: [
        //             { 
        //                 question: advancedSurveyQuestions[0]._id,
        //                 response: 'Graduate Student' 
        //             },
        //             { 
        //                 question: advancedSurveyQuestions[1]._id,
        //                 response: 'Yes'
        //             },
        //             { 
        //                 question: subQuestion1._id,
        //                 response: 'Python, JavaScript, Java, C++' 
        //             },
        //             { 
        //                 question: advancedSurveyQuestions[2]._id,
        //                 response: 'Yes'
        //             },
        //             { 
        //                 question: subQuestion2._id,
        //                 response: 4
        //             },
        //             { 
        //                 question: advancedSurveyQuestions[3]._id,
        //                 response: ['Library', 'Computer Lab', 'Study Rooms']
        //             }
        //         ],
        //         submittedAt: new Date('2025-03-15')
        //     },
        //     {
        //         responder_id: new mongoose.Types.ObjectId(),
        //         form: forms[5]._id,
        //         answers: [
        //             { 
        //                 question: advancedSurveyQuestions[0]._id,
        //                 response: 'Faculty Member' 
        //             },
        //             { 
        //                 question: advancedSurveyQuestions[1]._id,
        //                 response: 'No'
        //             },
        //             { 
        //                 question: advancedSurveyQuestions[2]._id,
        //                 response: 'No'
        //             },
        //             { 
        //                 question: advancedSurveyQuestions[3]._id,
        //                 response: ['Library', 'Meeting Rooms']
        //             }
        //         ],
        //         submittedAt: new Date('2025-03-16')
        //     }
        // ]);

        // console.log(`✅ Created ${responses.length} responses`);

        // // Display summary
        // console.log('\n📊 Seed Summary:');
        // console.log('================');
        // const totalQuestions = satisfactionQuestions.length + courseFeedbackQuestions.length + 
        //                       eventQuestions.length + libraryQuestions.length + itSupportQuestions.length;
        // console.log(`Questions created: ${totalQuestions}`);
        // console.log(`Forms created: ${forms.length}`);
        // console.log(`Responses created: ${responses.length}`);
        
        // console.log('\n📝 Form IDs for testing:');
        // forms.forEach((form, index) => {
        //     const title = form.title.find(t => t.key === 'en')?.value || 'Untitled';
        //     console.log(`${index + 1}. ${title}`);
        //     console.log(`   Form ID: ${form._id}`);
        //     console.log(`   Status: ${form.status}`);
        // });

        // console.log('\n🔍 Question IDs for testing:');
        // console.log('Student Satisfaction Survey Questions:');
        // satisfactionQuestions.forEach((q, i) => {
        //     console.log(`   Q${i + 1}: ${q._id} (${q.type})`);
        // });

        console.log('\n✨ Database seeded successfully!');
        
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
