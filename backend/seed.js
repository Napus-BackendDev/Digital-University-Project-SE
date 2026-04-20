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
    // 1. Connect to MongoDB
    mongoose.Promise = global.Promise;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });


    // 2. Clear existing data
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
      _id: index === 0 ? new mongoose.Types.ObjectId('69baf8349050b9215c700b96') : new mongoose.Types.ObjectId(),
      title: [
        { key: 'en', value: org.en },
        { key: 'th', value: org.th }
      ]
    }));

    const createdOrgs = await Organization.insertMany(orgsData);


    // 4. Seed Roles
    const pages = ['Forms', 'Manage Forms', 'Analytics', 'Permissions'];
    const defaultAccess = [
      { key: 'create', value: true },
      { key: 'read', value: true },
      { key: 'update', value: true },
      { key: 'delete', value: true }
    ];

    const rolesData = [
      {
        _id: new mongoose.Types.ObjectId('69aec1c73996270d703db3d7'),
        title: [
          { key: 'en', value: 'Admin' },
          { key: 'th', value: 'ผู้ดูแลระบบ' }
        ],
        permission: pages.map((p) => ({ page: p, access: defaultAccess }))
      },
      {
        title: [
          { key: 'en', value: 'Staff' },
          { key: 'th', value: 'เจ้าหน้าที่' }
        ],
        permission: pages.map((p) => ({ page: p, access: defaultAccess }))
      },
      {
        title: [
          { key: 'en', value: 'User' },
          { key: 'th', value: 'ผู้ใช้งานทั่วไป' }
        ],
        permission: pages.map((p) => ({ page: p, access: defaultAccess }))
      }
    ];

    const createdRoles = await Role.insertMany(rolesData);


    // 5. Seed Question Types
    const typeNames = ['short_answer', 'paragraph', 'multiple_choice', 'checkbox', 'rating', 'file_upload', 'image', 'title_description'];
    const createdTypes = await QuestionType.insertMany(typeNames.map((t) => ({ type: t })));


    // 6. Seed Control Types
    const controllData = [
      { title: [{ key: 'en', value: 'Editor' }, { key: 'th', value: 'แก้ไขฟอร์ม' }] },
      { title: [{ key: 'en', value: 'Viewer' }, { key: 'th', value: 'ดูฟอร์ม' }] }
    ];
    const createdControlls = await SettingControll.insertMany(controllData);


    // 7. Seed Users
    const users = [];
    const firstNames = ['Somchai', 'Somsri', 'Wichai', 'Malee', 'Anan', 'Pitsanu', 'Kanya', 'Thana', 'Santi', 'Pornchai', 'Siriporn', 'Nicha', 'Somsak', 'Patcharee', 'Narong', 'Prasert', 'Wanna', 'Prayoon', 'Sunee', 'Ubon'];
    const lastNames = ['Srakaew', 'Sripai', 'Rakdee', 'Maneerat', 'Kerdphol', 'Choojai', 'Noppakun', 'Saengsom', 'Sukjai', 'Prathum', 'Kamsin', 'Wongkaew', 'Sinthan', 'Boonmee', 'Chaisri', 'Saethang', 'Promdee', 'Yindee', 'Saengdao'];

    const adminUser = await User.create({
      _id: new mongoose.Types.ObjectId('69aec1c73996270d703db3aa'),
      name: 'System Admin',
      email: '6631503129@lamduan.mfu.ac.th',
      password: 'password123',
      role: createdRoles[0]._id,
      organization: createdOrgs[1]._id
    });
    users.push(adminUser);

    for (let i = 1; i <= 30; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@demo.uni`;
      const roleIdx = (i % 2) + 1;

      const u = await User.create({
        name: fullName,
        email,
        password: 'password123',
        role: createdRoles[roleIdx]._id,
        organization: createdOrgs[Math.floor(Math.random() * createdOrgs.length)]._id
      });
      users.push(u);
    }



    // 8. Seed Forms with mixed creators (not only system admin)
    const forms = [];
    const nonAdminUsers = users.filter((u) => String(u._id) !== String(adminUser._id));
    const creatorPool = nonAdminUsers.length > 0 ? nonAdminUsers : users;

    const formTemplates = [
      { en: 'Student Satisfaction Survey 2024', th: 'แบบประเมินความพึงพอใจนักศึกษา 2567' },
      { en: 'Library Service Feedback', th: 'ความเห็นการใช้บริการห้องสมุด' },
      { en: 'Digital Literacy Assessment', th: 'แบบทดสอบทักษะดิจิทัล' },
      { en: 'Campus Facilities Evaluation', th: 'ประเมินสิ่งอำนวยความสะดวกในวิทยาเขต' },
      { en: 'Canteen Food Quality Survey', th: 'สำรวจคุณภาพอาหารในโรงอาหาร' }
    ];

    for (let i = 0; i < formTemplates.length; i++) {
      const creatorUser = creatorPool[i % creatorPool.length];
      const f = await Form.create({
        title: [
          { key: 'en', value: formTemplates[i].en },
          { key: 'th', value: formTemplates[i].th }
        ],
        description: [
          { key: 'en', value: `Official feedback form for ${formTemplates[i].en}` },
          { key: 'th', value: `แบบฟอร์มรับฟังความคิดเห็นอย่างเป็นทางการสำหรับ ${formTemplates[i].th}` }
        ],
        creator: creatorUser._id,
        organization: createdOrgs[Math.floor(Math.random() * createdOrgs.length)]._id,
        schedule: {
          startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        collaborator: [
          {
            user: creatorUser._id,
            type: createdControlls[0]._id
          }
        ]
      });
      forms.push(f);
    }



    // 9. Seed Questions and Responses per form
    const departments = ['IT Support', 'Human Resources', 'Accounting', 'Public Relations', 'Student Development', 'Academic Office'];
    const choicesList = ['0', '1', '2'];

    for (let formIdx = 0; formIdx < forms.length; formIdx++) {
      const currentForm = forms[formIdx];

      const questionsData = [
        {
          form: currentForm._id,
          order: 1,
          title: [{ key: 'en', value: 'Department' }, { key: 'th', value: 'หน่วยงานสังกัด' }],
          type: createdTypes.find((t) => t.type === 'short_answer')._id,
          isRequired: true
        },
        {
          form: currentForm._id,
          order: 2,
          title: [{ key: 'en', value: 'Service Satisfaction' }, { key: 'th', value: 'ความพึงพอใจต่อบริการ' }],
          type: createdTypes.find((t) => t.type === 'rating')._id,
          config: { maxRating: 5 },
          isRequired: true
        },
        {
          form: currentForm._id,
          order: 3,
          title: [{ key: 'en', value: 'Tools used most often?' }, { key: 'th', value: 'เครื่องมือที่ใช้บ่อยที่สุด' }],
          type: createdTypes.find((t) => t.type === 'checkbox')._id,
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
      await Form.findByIdAndUpdate(currentForm._id, { $push: { questions: { $each: createdQuestions.map((q) => q._id) } } });

      const responsesPerForm = 15 + (formIdx % 5);
      for (let r = 0; r < responsesPerForm; r++) {
        const responder = users[(formIdx * 3 + r) % users.length];

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

      const formName = currentForm.title.find((t) => t.key === 'en')?.value || String(currentForm._id);

    }


  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await mongoose.connection.close();

    process.exit(0);
  }
}

seedDatabase();
