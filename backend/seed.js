'use strict';

require('dotenv').config({ path: '.env.dev' });
const mongoose = require('mongoose');
const Form = require('./server/Project/Form/models/form.model');
const Response = require('./server/Project/Response/models/response.model');

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
        console.log('🗑️  Cleared existing data');

        // Create demo forms with questions
        const forms = await Form.insertMany([
            {
                title: [
                    { key: 'en', value: 'Student Satisfaction Survey' },
                    { key: 'th', value: 'แบบสำรวจความพึงพอใจของนักศึกษา' }
                ],
                can_duplicate: false,
                status: 'open',
                schedule: {
                    mode: 'auto',
                    startAt: new Date('2025-01-01'),
                    endAt: new Date('2025-12-31')
                },
                questions: [
                    {
                        id: 'q1',
                        type: 'text',
                        question: 'What do you think about our university?',
                        required: true
                    },
                    {
                        id: 'q2',
                        type: 'rating',
                        question: 'Rate your overall satisfaction (1-5)',
                        required: true,
                        min: 1,
                        max: 5
                    },
                    {
                        id: 'q3',
                        type: 'checkbox',
                        question: 'What aspects did you like the most?',
                        required: false,
                        options: ['Teaching quality', 'Course materials', 'Lab facilities', 'Campus environment', 'Support services']
                    },
                    {
                        id: 'q4',
                        type: 'section',
                        question: 'Course Experience',
                        subQuestions: [
                            {
                                id: 'q4a',
                                type: 'rating',
                                question: 'Rate the course content',
                                min: 1,
                                max: 5
                            },
                            {
                                id: 'q4b',
                                type: 'rating',
                                question: 'Rate the instructor',
                                min: 1,
                                max: 5
                            },
                            {
                                id: 'q4c',
                                type: 'text',
                                question: 'Any suggestions for improvement?'
                            }
                        ]
                    }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'Course Feedback Form' },
                    { key: 'th', value: 'แบบฟอร์มข้อเสนอแนะรายวิชา' }
                ],
                can_duplicate: true,
                status: 'open',
                schedule: {
                    mode: 'manual',
                    startAt: null,
                    endAt: null
                },
                questions: [
                    {
                        id: 'q1',
                        type: 'text',
                        question: 'Course Name',
                        required: true
                    },
                    {
                        id: 'q2',
                        type: 'rating',
                        question: 'Overall course rating',
                        required: true,
                        min: 1,
                        max: 5
                    },
                    {
                        id: 'q3',
                        type: 'text',
                        question: 'What did you learn from this course?',
                        required: false
                    }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'Event Registration' },
                    { key: 'th', value: 'ลงทะเบียนเข้าร่วมกิจกรรม' }
                ],
                can_duplicate: false,
                status: 'draft',
                schedule: {
                    mode: 'manual',
                    startAt: null,
                    endAt: null
                },
                questions: [
                    {
                        id: 'q1',
                        type: 'text',
                        question: 'Full Name',
                        required: true
                    },
                    {
                        id: 'q2',
                        type: 'text',
                        question: 'Email',
                        required: true
                    },
                    {
                        id: 'q3',
                        type: 'checkbox',
                        question: 'Select sessions to attend',
                        options: ['Morning Session', 'Afternoon Session', 'Evening Workshop']
                    }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'Library Services Evaluation' },
                    { key: 'th', value: 'ประเมินบริการห้องสมุด' }
                ],
                can_duplicate: false,
                status: 'close',
                schedule: {
                    mode: 'auto',
                    startAt: new Date('2024-01-01'),
                    endAt: new Date('2024-12-31')
                },
                questions: [
                    {
                        id: 'q1',
                        type: 'rating',
                        question: 'Rate library facilities',
                        min: 1,
                        max: 5
                    },
                    {
                        id: 'q2',
                        type: 'checkbox',
                        question: 'Which services do you use?',
                        options: ['Book borrowing', 'Study rooms', 'Online resources', 'Research assistance']
                    }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'IT Support Request' },
                    { key: 'th', value: 'แจ้งปัญหาด้านเทคโนโลยีสารสนเทศ' }
                ],
                can_duplicate: true,
                status: 'open',
                schedule: {
                    mode: 'manual',
                    startAt: null,
                    endAt: null
                },
                questions: [
                    {
                        id: 'q1',
                        type: 'text',
                        question: 'Describe your issue',
                        required: true
                    },
                    {
                        id: 'q2',
                        type: 'checkbox',
                        question: 'Problem category',
                        options: ['Email', 'Network', 'Software', 'Hardware', 'Other']
                    },
                    {
                        id: 'q3',
                        type: 'rating',
                        question: 'Urgency level (1=Low, 5=Critical)',
                        min: 1,
                        max: 5
                    }
                ]
            }
        ]);

        console.log(`✅ Created ${forms.length} forms`);

        // Create demo responses with detailed answers
        const responses = await Response.insertMany([
            {
                form: forms[0]._id,
                answers: [
                    { 
                        questionId: 'q1',
                        response: 'Very satisfied with the course content and teaching methods. The professors are knowledgeable and helpful.' 
                    },
                    { 
                        questionId: 'q2',
                        response: 5 
                    },
                    { 
                        questionId: 'q3',
                        response: ['Teaching quality', 'Course materials', 'Campus environment'] 
                    },
                    {
                        questionId: 'q4',
                        response: {
                            'q4a': 5,
                            'q4b': 5,
                            'q4c': 'More practical exercises would be great'
                        }
                    }
                ],
                submittedAt: new Date('2025-02-15')
            },
            {
                form: forms[0]._id,
                answers: [
                    { 
                        questionId: 'q1',
                        response: 'Good overall experience, but some facilities need improvement' 
                    },
                    { 
                        questionId: 'q2',
                        response: 4 
                    },
                    { 
                        questionId: 'q3',
                        response: ['Teaching quality', 'Support services'] 
                    },
                    {
                        questionId: 'q4',
                        response: {
                            'q4a': 4,
                            'q4b': 5,
                            'q4c': 'More lab sessions would help'
                        }
                    }
                ],
                submittedAt: new Date('2025-03-10')
            },
            {
                form: forms[0]._id,
                answers: [
                    { 
                        questionId: 'q1',
                        response: 'The curriculum is comprehensive but challenging' 
                    },
                    { 
                        questionId: 'q2',
                        response: 3 
                    },
                    { 
                        questionId: 'q3',
                        response: ['Course materials', 'Lab facilities'] 
                    },
                    {
                        questionId: 'q4',
                        response: {
                            'q4a': 3,
                            'q4b': 4,
                            'q4c': 'Need better equipment in labs'
                        }
                    }
                ],
                submittedAt: new Date('2025-03-20')
            },
            {
                form: forms[1]._id,
                answers: [
                    { 
                        questionId: 'q1',
                        response: 'Software Engineering SE301' 
                    },
                    { 
                        questionId: 'q2',
                        response: 5 
                    },
                    { 
                        questionId: 'q3',
                        response: 'Learned agile methodologies, design patterns, and best practices for software development' 
                    }
                ],
                submittedAt: new Date('2025-02-20')
            },
            {
                form: forms[1]._id,
                answers: [
                    { 
                        questionId: 'q1',
                        response: 'Database Systems DB201' 
                    },
                    { 
                        questionId: 'q2',
                        response: 4 
                    },
                    { 
                        questionId: 'q3',
                        response: 'Understanding of SQL, database design, normalization, and query optimization' 
                    }
                ],
                submittedAt: new Date('2025-03-05')
            },
            {
                form: forms[4]._id,
                answers: [
                    { 
                        questionId: 'q1',
                        response: 'Cannot access university email account. Keep getting authentication errors.' 
                    },
                    { 
                        questionId: 'q2',
                        response: ['Email'] 
                    },
                    { 
                        questionId: 'q3',
                        response: 4 
                    }
                ],
                submittedAt: new Date('2025-04-01')
            },
            {
                form: forms[4]._id,
                answers: [
                    { 
                        questionId: 'q1',
                        response: 'Wi-Fi connection is very slow in the library area' 
                    },
                    { 
                        questionId: 'q2',
                        response: ['Network'] 
                    },
                    { 
                        questionId: 'q3',
                        response: 2 
                    }
                ],
                submittedAt: new Date('2025-04-02')
            }
        ]);

        console.log(`✅ Created ${responses.length} responses`);

        // Display summary
        console.log('\n📊 Seed Summary:');
        console.log('================');
        console.log(`Forms created: ${forms.length}`);
        console.log(`Responses created: ${responses.length}`);
        console.log('\n📝 Form IDs for testing:');
        forms.forEach((form, index) => {
            const title = form.title.find(t => t.key === 'en')?.value || 'Untitled';
            console.log(`${index + 1}. ${title}`);
            console.log(`   ID: ${form._id}`);
            console.log(`   Status: ${form.status}`);
        });

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
