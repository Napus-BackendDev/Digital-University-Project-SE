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

    let defaultOrg = await Organization.findOne({});
    if (!defaultOrg) {
      console.log('No Organization found in DB. Seeding default organizations...');
      const orgsToSeed = [
        { title: [{ key: 'en', value: 'School of IT' }, { key: 'th', value: 'สำนักวิชาเทคโนโลยีสารสนเทศ' }] },
        { title: [{ key: 'en', value: 'School of Science' }, { key: 'th', value: 'สำนักวิชาวิทยาศาสตร์' }] },
        { title: [{ key: 'en', value: 'General' }, { key: 'th', value: 'ทั่วไป' }] },
      ];
      const createdOrgs = await Organization.insertMany(orgsToSeed);
      defaultOrg = createdOrgs[0]; // Use School of IT as the default for generating mock forms
    }
    const ADMIN_ROLE_ID = new mongoose.Types.ObjectId('69aec1c73996270d703db3d7');
    const USER_ROLE_ID = new mongoose.Types.ObjectId('69e9e2226c400846810ef687');
    const editorSetting = await SettingControll.findOne({
      'title.value': 'Editor'
    }) || await SettingControll.findOne({});

    // All 8 expected question type names used in the project (short_answer + paragraph merged as free_text)
    const ALL_QUESTION_TYPES = [
      'free_text',
      'multiple_choice',
      'checkbox',
      'rating',
      'file_upload',
      'image',
      'title_description',
      'section',
    ];

    let questionTypes = await QuestionType.find({});
    if (questionTypes.length === 0) {
      console.log('No Question_Types found in DB. Seeding default question types...');
      const defaultTypes = ALL_QUESTION_TYPES.map(type => ({ type }));
      questionTypes = await QuestionType.insertMany(defaultTypes);
    }

    const typeMap = {};
    for (const qt of questionTypes) {
      typeMap[qt.type] = qt;
    }
    if (!typeMap.free_text && (typeMap.paragraph || typeMap.short_answer)) {
      typeMap.free_text = typeMap.paragraph || typeMap.short_answer;
    }

    // Validate all types exist
    for (const typeName of ALL_QUESTION_TYPES) {
      if (!typeMap[typeName]) {
        throw new Error(`Question type "${typeName}" not found in DB. Cannot seed without it.`);
      }
    }

    console.log(`Found ${questionTypes.length} question types.`);
    console.log(`Using org:        ${defaultOrg ? defaultOrg._id : 'none'}`);
    console.log(`Using adminRole:  ${ADMIN_ROLE_ID}`);
    console.log(`Using userRole:   ${USER_ROLE_ID}`);
    console.log(`Using collaborator setting: ${editorSetting ? editorSetting._id : 'none'}\n`);

    // ── Step 3: Seed 15 Users ─────────────────────────────────────────────────
    console.log('Seeding 15 Users...');

    const userList = [
      // ── Required users (by username/alias) ──
      { name: 'Plum Thidarat', email: 'plum@lamduan.mfu.ac.th' },
      { name: 'Mark Nattawut', email: 'mark@lamduan.mfu.ac.th' },
      { name: 'San Parinya', email: 'san@lamduan.mfu.ac.th' },
      // ── Project-specific users ──
      { name: 'Sai Shang Hlang', email: '6631503129@lamduan.mfu.ac.th' }, // Admin
      { name: 'Napus Samuanpho', email: '6631503016@lamduan.mfu.ac.th' },
      { name: 'Wantana Suwannapho', email: '6631503037@lamduan.mfu.ac.th' },
      { name: 'Wasan Nachai', email: '6631503038@lamduan.mfu.ac.th' },
    ];

    const ADMIN_EMAIL = '6631503129@lamduan.mfu.ac.th';

    const seededUsers = [];
    for (const userData of userList) {
      const isAdmin = userData.email === ADMIN_EMAIL;

      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: 'password123',
        role: isAdmin ? ADMIN_ROLE_ID : USER_ROLE_ID,
        organization: defaultOrg ? defaultOrg._id : undefined,
        createdAt: daysAgo(randomInt(1, 60)),
      });
      seededUsers.push(user);
      console.log(`  Created user: ${userData.name} <${userData.email}> [${isAdmin ? 'Admin' : 'User'}]`);
    }
    console.log(`\nSeeded ${seededUsers.length} users.\n`);

    // ── Step 4: Seed 5 Forms with all question types ──────────────────────────
    const formTemplates = [
      {
        en: 'Student Satisfaction Survey',
        th: 'แบบสำรวจความพึงพอใจของนักศึกษา',
        descEn: 'Please share your feedback about the university services and facilities.',
        descTh: 'กรุณาแบ่งปันความคิดเห็นของคุณเกี่ยวกับบริการและสิ่งอำนวยความสะดวกของมหาวิทยาลัย',
      },
      {
        en: 'Course Evaluation Form',
        th: 'แบบประเมินรายวิชา',
        descEn: 'Evaluate the quality of the course content, instructors, and learning materials.',
        descTh: 'ประเมินคุณภาพเนื้อหาวิชา อาจารย์ผู้สอน และสื่อการเรียนรู้',
      },
      {
        en: 'Campus Facilities Feedback',
        th: 'ข้อเสนอแนะเกี่ยวกับสิ่งอำนวยความสะดวกในวิทยาเขต',
        descEn: 'Help us improve our campus facilities by sharing your experience.',
        descTh: 'ช่วยเราปรับปรุงสิ่งอำนวยความสะดวกในวิทยาเขตโดยแบ่งปันประสบการณ์ของคุณ',
      },
      {
        en: 'Research Interest Registration',
        th: 'แบบลงทะเบียนความสนใจด้านการวิจัย',
        descEn: 'Register your research interests and preferred collaboration areas.',
        descTh: 'ลงทะเบียนความสนใจด้านการวิจัยและพื้นที่ความร่วมมือที่คุณต้องการ',
      },
      {
        en: 'Annual Alumni Contact Update',
        th: 'แบบอัปเดตข้อมูลติดต่อศิษย์เก่าประจำปี',
        descEn: 'Help us keep your contact information up to date for alumni communications.',
        descTh: 'ช่วยให้เราอัปเดตข้อมูลติดต่อของคุณสำหรับการสื่อสารกับศิษย์เก่า',
      },
    ];

    // Question configs per type (realistic question text per form index)
    const questionTemplates = [
      // Form 1 – Student Satisfaction Survey
      [
        { en: 'Describe your overall university experience.', th: 'อธิบายประสบการณ์โดยรวมของท่านที่มหาวิทยาลัย' },
        { en: 'Which school or department are you enrolled in?', th: 'ท่านสังกัดสำนักวิชาหรือหน่วยงานใด' },
        { en: 'Which services did you use? (Select all that apply)', th: 'ท่านใช้บริการใดบ้าง (เลือกได้มากกว่า 1 ข้อ)' },
        { en: 'Rate your overall satisfaction.', th: 'ประเมินระดับความพึงพอใจโดยรวมของท่าน' },
        { en: 'Upload your student card (optional).', th: 'แนบภาพถ่ายบัตรนักศึกษาของท่าน (ไม่บังคับ)' },
        { en: 'Campus Map', th: 'แผนที่วิทยาเขต' },
        { en: 'Student Satisfaction Survey 2025', th: 'แบบสำรวจความพึงพอใจของนักศึกษา ปี 2568' },
      ],
      // Form 2 – Course Evaluation
      [
        { en: 'Describe what you liked most about this course.', th: 'ระบุจุดเด่นหรือสิ่งที่ท่านประทับใจมากที่สุดเกี่ยวกับรายวิชานี้' },
        { en: 'How would you rate the instructor?', th: 'ท่านประเมินผลการสอนของอาจารย์ผู้สอนอยู่ในระดับใด' },
        { en: 'Which learning materials were most helpful?', th: 'สื่อการเรียนรู้ใดที่เป็นประโยชน์ต่อการเรียนรู้ของท่านมากที่สุด' },
        { en: 'Rate the course difficulty.', th: 'ประเมินระดับความยากง่ายของเนื้อหารายวิชา' },
        { en: 'Upload your assignment sample.', th: 'แนบไฟล์ตัวอย่างผลงานที่ได้รับมอบหมาย' },
        { en: 'Course Overview Image', th: 'ภาพประกอบภาพรวมรายวิชา' },
        { en: 'Course Evaluation – Semester 2/2568', th: 'แบบประเมินรายวิชา – ภาคการศึกษา 2/2568' },
      ],
      // Form 3 – Campus Facilities Feedback
      [
        { en: 'Describe the issue you encountered.', th: 'ระบุรายละเอียดของปัญหาหรือข้อขัดข้องที่ท่านพบ' },
        { en: 'Which facility area did you visit?', th: 'ท่านเข้าใช้งานอาคารหรือสิ่งอำนวยความสะดวกในบริเวณใด' },
        { en: 'Which amenities need improvement?', th: 'สิ่งอำนวยความสะดวกใดที่ควรได้รับการปรับปรุงเพิ่มเติม' },
        { en: 'Rate the cleanliness of the facility.', th: 'ประเมินระดับความสะอาดของสถานที่และสิ่งอำนวยความสะดวก' },
        { en: 'Upload a photo of the issue.', th: 'แนบภาพถ่ายประกอบการแจ้งปัญหา' },
        { en: 'Facility Layout Reference', th: 'แผนผังพื้นที่และสิ่งอำนวยความสะดวก' },
        { en: 'Campus Facilities Feedback Form', th: 'แบบสำรวจข้อเสนอแนะด้านอาคารสถานที่และสิ่งอำนวยความสะดวก' },
      ],
      // Form 4 – Research Interest Registration
      [
        { en: 'Briefly describe your research proposal.', th: 'อธิบายสรุปข้อเสนอโครงการวิจัยของท่านโดยสังเขป' },
        { en: 'Select your primary research area.', th: 'เลือกสาขาการวิจัยหลักของท่าน' },
        { en: 'Select all applicable collaboration types.', th: 'เลือกรูปแบบความร่วมมือทางวิชาการที่ท่านสนใจ (เลือกได้มากกว่า 1 ข้อ)' },
        { en: 'Rate your research experience level.', th: 'ประเมินระดับประสบการณ์ด้านการวิจัยของท่าน' },
        { en: 'Upload your CV or research portfolio.', th: 'แนบประวัติย่อ (CV) หรือแฟ้มผลงานวิจัยของท่าน' },
        { en: 'Research Focus Areas Diagram', th: 'แผนภาพกลุ่มวิจัยและหัวข้อวิจัยหลัก' },
        { en: 'Research Registration – 2025 Intake', th: 'แบบลงทะเบียนความสนใจด้านการวิจัย ประจำปี 2568' },
      ],
      // Form 5 – Alumni Contact Update
      [
        { en: 'Share any notable achievements since graduation.', th: 'แบ่งปันผลงานหรือความสำเร็จทางวิชาชีพนับตั้งแต่สำเร็จการศึกษา' },
        { en: 'What is your current employment status?', th: 'สถานภาพการทำงานในปัจจุบันของท่านคือข้อใด' },
        { en: 'Which industries are you working in?', th: 'ท่านปฏิบัติงานอยู่ในกลุ่มอุตสาหกรรมหรือสายงานใด' },
        { en: 'Rate how prepared you felt for the job market after graduation.', th: 'ประเมินความพร้อมในการเข้าสู่ตลาดแรงงานหลังสำเร็จการศึกษา' },
        { en: 'Upload an updated photo (optional).', th: 'แนบภาพถ่ายปัจจุบันของท่าน (ไม่บังคับ)' },
        { en: 'Alumni Network Overview', th: 'ภาพรวมเครือข่ายศิษย์เก่า' },
        { en: 'Alumni Contact Update Form 2025', th: 'แบบปรับปรุงข้อมูลติดต่อศิษย์เก่า ประจำปี 2568' },
      ],
    ];

    // Choices for multiple_choice and checkbox questions
    const multiChoiceOptions = [
      { key: 'opt_a', en: 'Option A', th: 'ตัวเลือก ก' },
      { key: 'opt_b', en: 'Option B', th: 'ตัวเลือก ข' },
      { key: 'opt_c', en: 'Option C', th: 'ตัวเลือก ค' },
      { key: 'opt_d', en: 'Option D', th: 'ตัวเลือก ง' },
    ];

    // Sample answer pools per type
    const sampleAnswers = {
      free_text: [
        'School of Information Technology – Academic Services',
        'CS204 Applied Software Engineering',
        'Central Library & Learning Commons',
        'Laboratory Building S7, Floor 3',
        'Academic Support and Student Advising Center',
        'The university experience has been wonderful overall. The faculty members are knowledgeable and supportive.',
        'I found the course content to be very relevant and well-structured. The practical sessions were especially helpful.',
        'The campus facilities are generally well-maintained, though the library could use more study spaces.',
        'My research proposal focuses on machine learning applications in healthcare, specifically for diagnostic imaging.',
        'Since graduating, I have been working at a technology enterprise and recently received a promotion to senior engineer.',
      ],
      multiple_choice: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
      checkbox: [
        ['opt_a', 'opt_b'],
        ['opt_b', 'opt_c'],
        ['opt_a', 'opt_c', 'opt_d'],
        ['opt_b', 'opt_d'],
        ['opt_a'],
        ['opt_c'],
      ],
      rating: [1, 2, 3, 4, 5],
    };

    function pickRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function buildAnswer(typeName) {
      switch (typeName) {
        case 'free_text':
        case 'short_answer':
        case 'paragraph':
          return pickRandom(sampleAnswers.free_text);
        case 'multiple_choice':
          return pickRandom(sampleAnswers.multiple_choice);
        case 'checkbox':
          return pickRandom(sampleAnswers.checkbox);
        case 'rating':
          return pickRandom(sampleAnswers.rating);
        // file_upload, image, title_description and section do not need answers in seed
        case 'file_upload':
        case 'image':
        case 'title_description':
        case 'section':
        default:
          return null;
      }
    }

    console.log('\nSeeding 5 Forms with all question types and responses...\n');

    for (let fi = 0; fi < 5; fi++) {
      const tmpl = formTemplates[fi];
      const qTmpls = questionTemplates[fi];
      const creator = seededUsers[fi % seededUsers.length];

      // ── Create the Form ──────────────────────────────────────────────────
      const form = await Form.create({
        title: [
          { key: 'en', value: tmpl.en },
          { key: 'th', value: tmpl.th },
        ],
        description: [
          { key: 'en', value: tmpl.descEn },
          { key: 'th', value: tmpl.descTh },
        ],
        creator: creator._id,
        organization: defaultOrg ? [defaultOrg._id] : [],
        collaborator: editorSetting
          ? [{ user: creator._id, type: editorSetting._id }]
          : [],
        settings: {
          collectEmail: false,
          limitResponse: false,
          emailNotifications: false,
          requireResponse: false,
          showAnotherResponseLink: true,
        },
      });

      console.log(`  [Form ${fi + 1}] Created: "${tmpl.en}"`);

      // ── Create all 8 Questions for this Form ─────────────────────────────
      const createdQuestions = [];

      for (let qi = 0; qi < ALL_QUESTION_TYPES.length; qi++) {
        const typeName = ALL_QUESTION_TYPES[qi];
        const typeDoc = typeMap[typeName];
        const qTmpl = qTmpls[qi];

        const qData = {
          form: form._id,
          order: qi + 1,
          type: typeDoc._id,
          title: [
            { key: 'en', value: qTmpl.en },
            { key: 'th', value: qTmpl.th },
          ],
          isRequired: qi < 3, // first 3 required
        };

        // Type-specific config
        if (typeName === 'multiple_choice') {
          qData.config = {
            choices: multiChoiceOptions.map(o => ({
              key: o.key,
              lang: [{ key: 'en', value: o.en }, { key: 'th', value: o.th }],
            })),
            allowMultipleSelect: false,
          };
        } else if (typeName === 'checkbox') {
          qData.config = {
            choices: multiChoiceOptions.map(o => ({
              key: o.key,
              lang: [{ key: 'en', value: o.en }, { key: 'th', value: o.th }],
            })),
            allowMultipleSelect: true,
          };
        } else if (typeName === 'rating') {
          qData.config = { maxRating: 5 };
        } else if (typeName === 'file_upload') {
          qData.config = {
            maxFiles: 3,
            maxFileSize: 10,
            fileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
          };
        } else if (typeName === 'image') {
          qData.config = {
            image: `https://placehold.co/600x300/1a1a2e/ffffff?text=Form+${fi + 1}+Image`,
          };
        } else if (typeName === 'title_description' || typeName === 'section') {
          qData.config = {
            description: [
              { key: 'en', value: `This section covers: ${tmpl.descEn}` },
              { key: 'th', value: `รายละเอียดของส่วนนี้: ${tmpl.descTh}` },
            ],
          };
        }

        // insertMany triggers post-save hooks via Questions.create
        const question = await Questions.create(qData);
        createdQuestions.push(question);
      }

      console.log(`           Questions created: ${createdQuestions.length}`);

      // ── Create 6–9 Responses per Form (all submitted: true) ──────────────
      const responseCount = randomInt(6, 9);
      for (let ri = 0; ri < responseCount; ri++) {
        const responder = seededUsers[randomInt(0, seededUsers.length - 1)];

        const answers = createdQuestions
          .map(q => {
            // Find the type name for this question
            const qt = questionTypes.find(t => String(t._id) === String(q.type));
            const typeName = qt ? qt.type : null;
            const value = buildAnswer(typeName);
            return { question: q._id, response: value };
          })
          .filter(a => a.response !== null); // exclude display-only types

        await Response.create({
          responder: responder._id,
          form: form._id,
          answers: answers,
          submit: true,
        });
      }

      console.log(`           Responses created: ${responseCount} (all submitted)\n`);
    }

    // ── Step 6: Seed Email Templates ──────────────────────────────────────────
    console.log('Seeding Email Templates...');
    const emailTemplatesData = [
      {
        name: [{ key: 'en', value: 'Collaborator Invitation' }, { key: 'th', value: 'คำเชิญร่วมจัดการแบบสอบถาม' }],
        code: 'invitationCollaboration',
        subject: 'Invitation to collaborate on: {{FormTitle}}',
        content: `
          <p>Dear <strong>{{CollaboratorName}}</strong>,</p>
          <p><strong>{{InviterName}}</strong> has invited you to collaborate on the questionnaire <strong>{{FormTitle}}</strong> with <strong>{{Permission}}</strong> access.</p>
          <p>Collaborating allows you to view responses and manage questionnaire settings together.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{InvitationLink}}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Open Form</a>
          </div>
        `,
        variables: ['InviterName', 'CollaboratorName', 'FormTitle', 'Permission', 'InvitationLink']
      },
      {
        name: [{ key: 'en', value: 'Organization Form Invitation' }, { key: 'th', value: 'เชิญตอบแบบสอบถามตามหน่วยงาน' }],
        code: 'invitationOrganization',
        subject: 'New Form Invitation: {{FormTitle}}',
        content: `
          <p>Dear <strong>{{ResponderName}}</strong>,</p>
          <p>An official questionnaire from <strong>{{OrganizationName}}</strong> has been shared with you.</p>
          <div style="padding: 18px 20px; background-color: #f8fafc; border-left: 4px solid #8c1515; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #8c1515; font-weight: bold; text-transform: uppercase;">New Questionnaire</p>
            <p style="margin: 6px 0 0; font-size: 17px; font-weight: bold; color: #0f172a;">{{FormTitle}}</p>
          </div>
          <p>Your participation is valuable and helps us improve our university services.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="{{InvitationLink}}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Open Questionnaire</a>
          </div>
        `,
        variables: ['OrganizationName', 'ResponderName', 'FormTitle', 'InvitationLink']
      },
      {
        name: [{ key: 'en', value: 'Submission Confirmation' }, { key: 'th', value: 'ยืนยันการส่งแบบสอบถาม' }],
        code: 'submissionConfirmation',
        subject: 'Submission Confirmation: {{FormName}}',
        content: `
          <p>Dear <strong>{{Responder}}</strong>,</p>
          <p>Your response has been successfully submitted to <strong>{{FormName}}</strong>. This email confirms that our system has received your data.</p>
          <div style="padding: 18px 20px; background-color: #f8fafc; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
             <p style="margin: 4px 0; font-size: 14px;"><strong>Reference No:</strong> {{ReferenceNo}}</p>
             <p style="margin: 4px 0; font-size: 14px;"><strong>Submitted At:</strong> {{SubmittedAt}}</p>
          </div>
          <p>Please keep this email for your records. Thank you for your participation.</p>
        `,
        variables: ['Responder', 'FormName', 'SubmittedAt', 'ReferenceNo']
      },
      {
        name: [{ key: 'en', value: 'Response Notification' }, { key: 'th', value: 'แจ้งเตือนเมื่อมีคำตอบใหม่' }],
        code: 'ResponseNotification',
        subject: 'New response received for: {{FormTitle}}',
        content: `
          <p>Dear <strong>{{UserName}}</strong>,</p>
          <p>A new response has been submitted for your questionnaire <strong>{{FormTitle}}</strong> by <strong>{{Responder}}</strong>.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="{{DashboardLink}}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">View in Dashboard</a>
          </div>
        `,
        variables: ['UserName', 'FormTitle', 'Responder', 'SubmittedAt', 'ReferenceNo', 'DashboardLink']
      }
    ];

    await EmailTemplate.insertMany(emailTemplatesData);
    console.log(`Seeded ${emailTemplatesData.length} email templates.\n`);

    console.log('════════════════════════════════════════════════════════');
    console.log(' Seeding completed successfully!');
    console.log(`  • ${seededUsers.length} users seeded`);
    console.log('  •  5 forms seeded (each with all 8 question types)');
    console.log('  •  6–9 submitted responses per form');
    console.log('  •  4 email templates seeded');
    console.log('  • Organizations, Roles, Settings, Question Types: untouched');
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
