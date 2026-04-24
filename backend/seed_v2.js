'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

// Import Models
const Form = require('./server/Project/Form/models/form.model');
const Response = require('./server/Project/Response/models/response.model');
const User = require('./server/Project/User/models/user.model');
const Role = require('./server/Project/User/models/roles.model');
const Questions = require('./server/Project/Questions/models/questions.model');
const QuestionType = require('./server/Project/Settings/models/question_type.model');
const Organization = require('./server/Project/Organizations/models/organization.model');
const SettingControll = require('./server/Project/Settings/models/controll.model');

const mongoURI = process.env.MONGODB;

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    mongoose.Promise = global.Promise;
    await mongoose.connect(mongoURI);

    console.log('Clearing existing data...');
    await Promise.all([
      Organization.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      QuestionType.deleteMany({}),
      Questions.deleteMany({}),
      Form.deleteMany({}),
      Response.deleteMany({}),
      SettingControll.deleteMany({})
    ]);

    // 1. Seed Organizations
    console.log('Seeding Organizations...');
    const orgTemplates = [
      { en: 'General', th: 'ทั่วไป' },
      { en: 'Information Technology Center', th: 'ศูนย์เทคโนโลยีสารสนเทศ' },
      { en: 'Faculty of Engineering', th: 'คณะวิศวกรรมศาสตร์' }
    ];
    const orgsData = orgTemplates.map((org, index) => ({
      _id: index === 0 ? new mongoose.Types.ObjectId('69baf8349050b9215c700b96') : new mongoose.Types.ObjectId(),
      title: [
        { key: 'en', value: org.en },
        { key: 'th', value: org.th }
      ]
    }));
    const createdOrgs = await Organization.insertMany(orgsData);

    // 2. Seed Roles
    console.log('Seeding Roles...');
    const rolesData = [
      {
        _id: new mongoose.Types.ObjectId('69aec1c73996270d703db3d7'),
        title: [{ key: 'en', value: 'Admin' }, { key: 'th', value: 'ผู้ดูแลระบบ' }]
      },
      {
        title: [{ key: 'en', value: 'User' }, { key: 'th', value: 'ผู้ใช้งานทั่วไป' }]
      }
    ];
    const createdRoles = await Role.insertMany(rolesData);

    // 3. Seed Question Types
    console.log('Seeding Question Types...');
    const typeNames = ['short_answer', 'paragraph', 'multiple_choice', 'checkbox', 'rating', 'file_upload', 'image', 'title_description'];
    const createdTypes = await QuestionType.insertMany(typeNames.map((t) => ({ type: t })));

    // 4. Seed Control Types (Editor/Viewer)
    const createdControlls = await SettingControll.insertMany([
      { title: [{ key: 'en', value: 'Editor' }, { key: 'th', value: 'แก้ไขฟอร์ม' }] },
      { title: [{ key: 'en', value: 'Viewer' }, { key: 'th', value: 'ดูอย่างเดียว' }] }
    ]);

    // 5. Seed 10 Users
    console.log('Seeding 10 Users...');
    const userList = [
      { name: 'Sai Shang Hlang', email: '6631503129@lamduan.mfu.ac.th' }, // ONLY ADMIN
      { name: 'Napus Samuanpho', email: '6631503016@lamduan.mfu.ac.th' },
      { name: 'Wantana Suwannapho', email: '6631503037@lamduan.mfu.ac.th' },
      { name: 'wasan nachai', email: '6631503038@lamduan.mfu.ac.th' },
      { name: 'Sai Shang Hlang', email: 'saishanghlang@gmail.com' },
      { name: 'Sai Shang Hlang', email: 'saishanghlang20122002@gmail.com' },
      { name: 'John Doe', email: 'john.doe@demo.uni' },
      { name: 'Jane Smith', email: 'jane.smith@demo.uni' },
      { name: 'Alice Brown', email: 'alice.brown@demo.uni' },
      { name: 'Bob White', email: 'bob.white@demo.uni' }
    ];

    const seededUsers = [];
    for (let i = 0; i < userList.length; i++) {
      const userData = userList[i];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      // ONLY 6631503129@lamduan.mfu.ac.th is Admin
      const isAdmin = userData.email === '6631503129@lamduan.mfu.ac.th';
      const role = isAdmin ? createdRoles[0]._id : createdRoles[1]._id;
      
      // Distribute non-admins across other orgs
      const org = isAdmin ? createdOrgs[0]._id : createdOrgs[i % createdOrgs.length]._id;

      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: 'password123',
        role: role,
        organization: org,
        createdAt: createdAt
      });
      seededUsers.push(user);
    }

    // 6. Seed 10 Forms
    console.log('Seeding 10 Forms...');
    const forms = [];
    for (let i = 1; i <= 10; i++) {
      // Creators can be anyone, but let's rotate
      const creator = seededUsers[i % seededUsers.length];
      const form = await Form.create({
        title: [
          { key: 'en', value: `Form ${i}: Comprehensive Survey` },
          { key: 'th', value: `แบบฟอร์มที่ ${i}: การสำรวจแบบละเอียด` }
        ],
        description: [
          { key: 'en', value: `Testing all question types in form ${i}` },
          { key: 'th', value: `ทดสอบประเภทคำถามทั้งหมดในแบบฟอร์มที่ ${i}` }
        ],
        creator: creator._id,
        organization: [createdOrgs[i % createdOrgs.length]._id],
        status: null, // Default
        collaborator: [{ user: creator._id, type: createdControlls[0]._id }]
      });
      forms.push(form);

      // Add all question types to each form
      const questionsData = createdTypes.map((typeObj, index) => {
        const qData = {
          form: form._id,
          order: index + 1,
          type: typeObj._id,
          title: [
            { key: 'en', value: `Question ${index + 1} (${typeObj.type})` },
            { key: 'th', value: `คำถามที่ ${index + 1} (${typeObj.type})` }
          ],
          isRequired: index < 4 // Make first 4 required
        };

        // Add config based on type
        if (typeObj.type === 'multiple_choice' || typeObj.type === 'checkbox') {
          qData.config = {
            choices: [
              { key: 'opt1', lang: [{ key: 'en', value: 'Option 1' }, { key: 'th', value: 'ตัวเลือกที่ 1' }] },
              { key: 'opt2', lang: [{ key: 'en', value: 'Option 2' }, { key: 'th', value: 'ตัวเลือกที่ 2' }] }
            ],
            allowMultipleSelect: typeObj.type === 'checkbox'
          };
        } else if (typeObj.type === 'rating') {
          qData.config = { maxRating: 5 };
        } else if (typeObj.type === 'file_upload') {
          qData.config = { maxFiles: 1, maxFileSize: 10, fileTypes: ['image/jpeg', 'application/pdf'] };
        } else if (typeObj.type === 'image') {
          qData.config = { image: 'https://via.placeholder.com/300' };
        }

        return qData;
      });

      const createdQuestions = await Questions.insertMany(questionsData);
      await Form.findByIdAndUpdate(form._id, { questions: createdQuestions.map(q => q._id) });

      // 7. Random User Responses (3-5 responses per form)
      const respCount = 3 + Math.floor(Math.random() * 3);
      for (let r = 0; r < respCount; r++) {
        const responder = seededUsers[Math.floor(Math.random() * seededUsers.length)];
        const answers = createdQuestions.map(q => {
          const type = createdTypes.find(t => String(t._id) === String(q.type)).type;
          let responseValue = null;

          if (type === 'short_answer') responseValue = 'Sample Answer';
          else if (type === 'paragraph') responseValue = 'This is a long sample paragraph response for testing purposes.';
          else if (type === 'multiple_choice') responseValue = 'opt1';
          else if (type === 'checkbox') responseValue = ['opt1', 'opt2'];
          else if (type === 'rating') responseValue = 4;
          else if (type === 'file_upload') responseValue = 'https://example.com/file.pdf';
          
          return { question: q._id, response: responseValue };
        }).filter(a => a.response !== null);

        await Response.create({
          responder: responder._id,
          form: form._id,
          answers: answers,
          submit: true
        });
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedDatabase();
