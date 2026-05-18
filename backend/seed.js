'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

// ─── Import Models ────────────────────────────────────────────────────────────
const Form = require('./server/Project/Form/models/form.model');
const Response = require('./server/Project/Response/models/response.model');
const User = require('./server/Project/User/models/user.model');
const Role = require('./server/Project/User/models/roles.model');
const Questions = require('./server/Project/Questions/models/questions.model');
const QuestionType = require('./server/Project/Settings/models/question_type.model');
const Organization = require('./server/Project/Organizations/models/organization.model');
const SettingControll = require('./server/Project/Settings/models/controll.model');
const EmailTemplate = require('./server/Project/Settings/models/emailTemplate.model');

const mongoURI = process.env.MONGODB;

// ─── Helper ───────────────────────────────────────────────────────────────────
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Main Seed Function ───────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    mongoose.Promise = global.Promise;
    await mongoose.connect(mongoURI);
    console.log('Connected.\n');

    // ── Step 1: Clear ONLY seeded data (users, questions, forms, responses) ──
    console.log('Clearing existing Users, Questions, Forms, and Responses...');
    await Response.deleteMany({});
    await Questions.deleteMany({});
    await Form.deleteMany({});
    await User.deleteMany({});
    await EmailTemplate.deleteMany({});
    console.log('Cleared.\n');

    // ── Step 2: Fetch existing infrastructure data (read-only) ───────────────
    console.log('Fetching existing infrastructure (orgs, roles, question types, collaborator settings)...');

    const defaultOrg = await Organization.findOne({}) || null;
    const ADMIN_ROLE_ID = new mongoose.Types.ObjectId('69aec1c73996270d703db3d7');
    const USER_ROLE_ID = new mongoose.Types.ObjectId('69e9e2226c400846810ef687');
    const editorSetting = await SettingControll.findOne({
      'title.value': 'Editor'
    }) || await SettingControll.findOne({});

    const questionTypes = await QuestionType.find({});
    if (questionTypes.length === 0) {
      throw new Error('No Question_Types found in DB.');
    }

    const typeMap = {};
    for (const qt of questionTypes) {
      typeMap[qt.type] = qt;
    }

    const ALL_QUESTION_TYPES = ['short_answer', 'paragraph', 'multiple_choice', 'checkbox', 'rating', 'file_upload', 'image', 'title_description'];

    // ── Step 3: Seed 15 Users ─────────────────────────────────────────────────
    console.log('Seeding 15 Users...');
    const userList = [
      { name: 'Plum Thidarat', email: 'plum@lamduan.mfu.ac.th' },
      { name: 'Mark Nattawut', email: 'mark@lamduan.mfu.ac.th' },
      { name: 'San Parinya', email: 'san@lamduan.mfu.ac.th' },
      { name: 'Leng Napus', email: 'leng@lamduan.mfu.ac.th' },
      { name: 'Sai Shang Hlang', email: '6631503129@lamduan.mfu.ac.th' },
      { name: 'Napus Samuanpho', email: '6631503016@lamduan.mfu.ac.th' },
      { name: 'Wantana Suwannapho', email: '6631503037@lamduan.mfu.ac.th' },
      { name: 'Wasan Nachai', email: '6631503038@lamduan.mfu.ac.th' },
      { name: 'Alice Wongkhan', email: 'alice.wongkhan@mfu.ac.th' },
      { name: 'Bob Charoenwong', email: 'bob.charoenwong@mfu.ac.th' },
      { name: 'Carol Srisombat', email: 'carol.srisombat@mfu.ac.th' },
      { name: 'David Permpool', email: 'david.permpool@mfu.ac.th' },
      { name: 'Eva Kulchaiyawong', email: 'eva.kulchaiyawong@mfu.ac.th' },
    ];

    const seededUsers = [];
    for (const userData of userList) {
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: 'password123',
        role: userData.email.includes('6631503129') ? ADMIN_ROLE_ID : USER_ROLE_ID,
        organization: defaultOrg ? defaultOrg._id : undefined,
        createdAt: daysAgo(randomInt(1, 60)),
      });
      seededUsers.push(user);
    }
    console.log(`Seeded ${seededUsers.length} users.\n`);

    const formTemplates = [
      { en: 'Student Satisfaction Survey', th: 'แบบสำรวจความพึงพอใจของนักศึกษา', descEn: 'Feedback about university services.', descTh: 'ความคิดเห็นเกี่ยวกับบริการของมหาวิทยาลัย' },
      { en: 'Course Evaluation Form', th: 'แบบประเมินรายวิชา', descEn: 'Evaluate quality of course.', descTh: 'ประเมินคุณภาพรายวิชา' }
    ];

    for (let fi = 0; fi < formTemplates.length; fi++) {
      const tmpl = formTemplates[fi];
      const creator = seededUsers[fi % seededUsers.length];
      const form = await Form.create({
        title: [{ key: 'en', value: tmpl.en }, { key: 'th', value: tmpl.th }],
        description: [{ key: 'en', value: tmpl.descEn }, { key: 'th', value: tmpl.descTh }],
        creator: creator._id,
        organization: defaultOrg ? [defaultOrg._id] : [],
        settings: { collectEmail: false, limitResponse: false }
      });

      for (let qi = 0; qi < ALL_QUESTION_TYPES.length; qi++) {
        const typeName = ALL_QUESTION_TYPES[qi];
        const typeDoc = typeMap[typeName];
        if (typeDoc) {
          await Questions.create({
            form: form._id,
            order: qi + 1,
            type: typeDoc._id,
            title: [{ key: 'en', value: `Question ${qi + 1}` }, { key: 'th', value: `คำถามที่ ${qi + 1}` }],
            isRequired: qi < 2
          });
        }
      }
    }

    // ── Step 6: Seed Email Templates ──────────────────────────────────────────
    console.log('Seeding Email Templates...');
    const emailTemplatesData = [
      {
        name: [{ key: 'en', value: 'Invitation Collaboration' }, { key: 'th', value: 'คำเชิญทำงานร่วมกัน' }],
        code: 'invitationCollaboration',
        subject: 'Invitation to collaborate on: {{FormTitle}}',
        content: `
          <p>Hello <strong>{{CollaboratorName}}</strong>,</p>
          <p><strong>{{InviterName}}</strong> has invited you to collaborate on the form <strong>{{FormTitle}}</strong> with <strong>{{Permission}}</strong> access.</p>
          <p>Collaborating allows you to view responses and manage form settings together.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{InvitationLink}}" style="background-color: #ac1515; color: #ffffff; padding: 12px 25px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">Open Form</a>
          </div>
        `,
        variables: ['InviterName', 'CollaboratorName', 'FormTitle', 'Permission', 'InvitationLink']
      },
      {
        name: [{ key: 'en', value: 'Invitation Organization' }, { key: 'th', value: 'คำเชิญเข้าร่วมองค์กร' }],
        code: 'invitationOrganization',
        subject: 'New Form Invitation: {{FormTitle}}',
        content: `
          <p>Hello <strong>{{ResponderName}}</strong>,</p>
          <p>An official form from <strong>{{OrganizationName}}</strong> has been shared with you.</p>
          <div style="padding: 20px; background-color: #f7fafc; border-left: 4px solid #ac1515; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #ac1515; font-weight: bold; text-transform: uppercase;">New Form</p>
            <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold;">{{FormTitle}}</p>
          </div>
          <p>Your participation is valuable and helps us improve our university services.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{InvitationLink}}" style="background-color: #ac1515; color: #ffffff; padding: 12px 25px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">Start Response</a>
          </div>
        `,
        variables: ['OrganizationName', 'ResponderName', 'FormTitle', 'InvitationLink']
      },
      {
        name: [{ key: 'en', value: 'Submission Confirmation' }, { key: 'th', value: 'ยืนยันการส่งข้อมูล' }],
        code: 'submissionConfirmation',
        subject: 'Submission Confirmation: {{FormName}}',
        content: `
          <p>Dear <strong>{{Responder}}</strong>,</p>
          <p>Your response has been successfully submitted to <strong>{{FormName}}</strong>. This email confirms that our system has received your data.</p>
          <div style="padding: 20px; background-color: #f7fafc; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
             <p style="margin: 5px 0; font-size: 14px;"><strong>Reference No:</strong> {{ReferenceNo}}</p>
             <p style="margin: 5px 0; font-size: 14px;"><strong>Submitted At:</strong> {{SubmittedAt}}</p>
          </div>
          <p>Please keep this email for your records. Thank you for your participation!</p>
        `,
        variables: ['Responder', 'FormName', 'SubmittedAt', 'ReferenceNo']
      },
      {
        name: [{ key: 'en', value: 'Response Notification' }, { key: 'th', value: 'แจ้งเตือนการตอบกลับ' }],
        code: 'ResponseNotification',
        subject: 'New response received for: {{FormTitle}}',
        content: `
          <p>Hello,</p>
          <p>A new response has been submitted for your form <strong>{{FormTitle}}</strong>.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{DashboardLink}}" style="background-color: #ac1515; color: #ffffff; padding: 12px 25px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">View in Dashboard</a>
          </div>
        `,
        variables: ['FormTitle', 'DashboardLink']
      }
    ];

    await EmailTemplate.insertMany(emailTemplatesData);
    console.log(`Seeded ${emailTemplatesData.length} email templates.\n`);

    console.log('════════════════════════════════════════════════════════');
    console.log(' Seeding completed successfully!');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\nError during database seeding:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

seedDatabase();
