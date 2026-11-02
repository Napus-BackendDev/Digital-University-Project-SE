# ข้อกำหนดโมเดลกระบวนการทางธุรกิจ (Business Process Model Specification - BPMN 2.0)
## ระบบแบบสอบถามอิเล็กทรอนิกส์ มหาวิทยาลัยดิจิทัล (Digital University E-Questionnaires)

---

### 1. บทนำและวัตถุประสงค์ (Introduction & Purpose)

เอกสารฉบับนี้กำหนดรายละเอียด **Business Process Model (BPMN 2.0)** ของระบบแบบสอบถามอิเล็กทรอนิกส์ (Digital University E-Questionnaires) เพื่ออธิบายขั้นตอนการดำเนินงานทางธุรกิจ (End-to-End Business Processes) การปฏิสัมพันธ์ระหว่างผู้ใช้งานต่างบทบาท การทำงานอัตโนมัติของระบบหลังบ้าน (Backend Automation) และการแลกเปลี่ยนข้อความกับบริการภายนอก (External Cloud Services) โดยยึดหลัก **Codebase Grounding 100%** อ้างอิงตามสถาปัตยกรรมและซอร์สโค้ดจริงของโครงการ

---

### 2. มาตรฐานและสัญลักษณ์ที่ใช้ (BPMN 2.0 Notation & Conventions)

ผังกระบวนการทั้งหมดวาดขึ้นตามมาตรฐาน **BPMN 2.0 (Business Process Model and Notation)** ประกอบด้วย:

1. **Pools & Swimlanes:**
   - **Pool หลัก (Digital University Survey System):** แบ่งออกเป็น 4 Swimlanes ตามบทบาทผู้กระทำ
     - `Lane 1: System Admin` — ผู้ดูแลระบบสูงสุด ดูแลจัดการสิทธิ์ RBAC และสืบค้นฟอร์มทั่วระบบ
     - `Lane 2: Form Creator & Collaborator` — ครู อาจารย์ และเจ้าหน้าที่ผู้สร้าง/ร่วมพัฒนาแบบสอบถาม
     - `Lane 3: Respondent` — นักศึกษา บุคลากร หรือประชาชนทั่วไปผู้ตอบแบบสอบถาม
     - `Lane 4: Automated Backend & Ingestion Engine` — บริการอัตโนมัติของ Express API, Validation Guard, Multer Ingestion และ Mongoose Post-Save Hooks
   - **External Pool:** บริการคลาวด์ภายนอก ได้แก่ `Google Identity Services (OAuth 2.0)` และ `Google Workspace SMTP Relay`
2. **Events (เหตุการณ์):**
   - **Start Event (วงกลมเส้นเขียวบาง):** จุดเริ่มต้นของกระบวนการ
   - **End Event (วงกลมเส้นแดงหนา):** จุดสิ้นสุดของกระบวนการที่บรรลุผลสำเร็จ
   - **Terminate / Rejection End Event (วงกลมซ้อนจุดทึบสีแดง):** จุดสิ้นสุดเมื่อเกิดข้อผิดพลาดหรือถูกปฏิเสธสิทธิ์ (Access Denied / Expired)
3. **Activities & Tasks (กิจกรรม/ขั้นตอนการทำงาน):**
   - **User Task:** กิจกรรมที่มนุษย์ปฏิสัมพันธ์ผ่านหน้าจอเว็บ (Frontend UI)
   - **Service Task:** กิจกรรมที่ระบบประมวลผลอัตโนมัติหลังบ้าน (Backend API / Database)
   - **Receive / Send Task:** การรับหรือส่งข้อมูล/อีเมลแจ้งเตือน
4. **Gateways (จุดตัดสินใจแยกเส้นทาง ◇):**
   - **Exclusive Gateway (XOR ◇ มีเครื่องหมาย X):** ตัดสินใจเลือกเส้นทางใดเส้นทางหนึ่งตามเงื่อนไขทางตรรกะ
5. **Connecting Objects (เส้นเชื่อมโยง):**
   - **Sequence Flow (เส้นทึบสีเทาเข้มพร้อมหัวลูกศร):** ลำดับขั้นตอนการทำงานภายใน Pool เดียวกัน
   - **Message Flow (เส้นประสีม่วงพร้อมหัวลูกศร):** การสื่อสารข้ามเลนหรือข้าม Pool (API Request/Response, SMTP Trigger, Email Delivery)
6. **Data Store (ถังเก็บข้อมูล):**
   - สัญลักษณ์คลังข้อมูล `MongoDB Atlas` สำหรับคอลเลกชัน `Forms`, `Questions`, `Responses`, `Users`

---

### 3. โครงสร้างกระบวนการธุรกิจแบบรวมเป็นหนึ่งเดียว (Unified End-to-End Business Process)

ผังกระบวนการทางธุรกิจถูกรวมเป็น **Single Master BPMN Pool** ผืนใหญ่เพียงหนึ่งเดียว ครอบคลุมการทำงานตั้งแต่ต้นน้ำถึงปลายน้ำ (End-to-End) ต่อเนื่องกัน 3 เฟส:

```
[START: Creator Login (Google OAuth 2.0)]
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: การสร้างฟอร์ม, ออกแบบข้อคำถาม, เชิญผู้ร่วมงาน และเผยแพร่         │
│  - เลือกสร้างใหม่ (Wizard 4 ขั้นตอน) หรือ คัดลอก (Duplicate Buffer)    │
│  - ออกแบบคำถาม 8 ชนิด + Auto-Save ลง MongoDB                          │
│  - ตั้งค่าเวลาเปิด-ปิด (Schedule) และหน่วยงาน                           │
│  - Gateway Diff: มีผู้ร่วมงานใหม่ -> ยิง Gmail SMTP ส่งอีเมลเชิญ        │
│  - เปิดสถานะฟอร์มเป็น Active & สร้าง QR Code / ลิงก์แชร์ฟอร์ม           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (ส่งต่อ QR Code & Link ไปยังผู้ตอบ)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: ผู้ตอบเข้าทำแบบสอบถาม, ตรวจสอบเงื่อนไข และประมวลผลคำตอบ         │
│  - ผู้ตอบสแกน QR / คลิกลิงก์ -> Backend checkAccess ตรวจเวลา/สิทธิ์      │
│  - Gateway ตรวจสอบเวลา/หน่วยงาน (หากไม่ผ่าน -> 403 Terminate Event)     │
│  - Gateway ตรวจสอบ limitResponse (หากเคยตอบแล้ว -> แจ้งเตือนตอบครบ)     │
│  - กรอกคำตอบตาม Skip Logic & อัปโหลดไฟล์แนบ                             │
│  - Gateway: บันทึกร่าง (Draft) หรือ ส่งคำตอบจริง (Submit)?              │
│    * บันทึกร่าง: บันทึก submit:false -> เสร็จสิ้นร่าง (ทำต่อได้)         │
│    * ส่งคำตอบจริง: บันทึก submit:true + ล้างไฟล์กำพร้า + Mongoose Hook  │
│      + ยิง Gmail SMTP ส่ง submissionConfirmation Email                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (ข้อมูลคำตอบส่งถึงแดชบอร์ดผู้สร้าง/Admin)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: การประมวลผลสถิติ, ตรวจสอบคำตอบ, ส่งออกรายงาน และการบริหารสิทธิ์ │
│  - Creator & Admin เปิดแดชบอร์ด -> Backend ประเมิน Scope สิทธิ์         │
│  - Admin: Global Scope -> เข้าจัดการตารางสิทธิ์ /permissions (RBAC)    │
│  - Creator: Local Scope -> รัน MongoDB Aggregation Pipeline คำนวณสถิติ │
│  - แสดงผลแผนภูมิแท่ง/วงกลมสด (Chart.js Dashboard)                     │
│  - Gateway: ตรวจคำตอบรายบุคคล (/response/:id) หรือ ส่งออก Excel/CSV?   │
│  - บรรลุเป้าหมายการประเมินและจัดเก็บหลักฐานเสร็จสมบูรณ์                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
                 [END: บรรลุเป้าหมายการประเมินและจัดเก็บหลักฐาน]
```

---

### 4. ตารางสอบย้อนกลับโค้ดจริง (Traceability Matrix: BPMN to Codebase)

| รหัสกระบวนการ | กิจกรรมใน BPMN 2.0 | ซอร์สโค้ดและไฟล์อ้างอิงหลัก | ฟังก์ชัน / Controller / API Endpoint |
| :--- | :--- | :--- | :--- |
| **BPM-01** | Google OAuth Login | `frontend/src/views/pages/Login.vue` | `tokenClient.requestAccessToken()` |
| **BPM-01** | Session JWT Generation | `backend/server/Project/Auth/auth.routes.js` | `POST /api/v1/auth/google`, `jwt.sign()` |
| **BPM-01** | Form Builder Wizard Flow | `frontend/.../Wizard/FormBuilderWizard.vue` | Step 1–4 Stepper & Coachmark Gate |
| **BPM-01** | Auto-Save Questions | `frontend/.../Tabs/TabQuestion.vue` | `PUT /api/v1/form`, `Questions/create` |
| **BPM-01** | Collaborator Diff Email | `backend/.../Email/service/collaboration.js` | `maybeSendCollaborationInvites()` |
| **BPM-01** | SMTP Dispatcher | `backend/.../Email/service/dynamicEmail.js` | Nodemailer `transporter.sendMail()` |
| **BPM-02** | Access & Schedule Guard | `backend/.../Form/service/form.js` | `exports.checkAccess()` |
| **BPM-02** | LimitResponse Check | `backend/.../Response/service/response.js` | `Responses.findOne({ form, responder })` |
| **BPM-02** | File Upload Handling | `backend/.../Response/service/utils/utils.js` | `attachFilesToAnswers()`, Multer DiskStorage |
| **BPM-02** | Orphaned File Cleanup | `backend/.../Response/service/utils/utils.js` | `cleanUpOrphanedFile(oldUrl)` |
| **BPM-02** | Mongoose Ingestion Hook | `backend/.../Response/models/response.model.js` | `objSchema.post('save')` `$push` arrays |
| **BPM-02** | Confirmation Email | `backend/.../Email/templates/submissionConfirmation.js` | `dynamicEmail.sendDynamicEmail()` |
| **BPM-03** | Admin Global Scope Filter | `backend/.../Form/service/form.js` | `exports.onQueryByUser` (`isAdmin ? {} : $or`) |
| **BPM-03** | RBAC Matrix Administration | `frontend/.../security/components/PermissionTable.vue` | `Setting/controll/update` |
| **BPM-03** | Real-time Aggregation | `frontend/src/projects/views/Analytics.vue` | Chart.js Data Ingestion Pipeline |
| **BPM-03** | Report Export Engine | `frontend/.../Tabs/TabResponses.vue` | Excel / CSV Data Formatter |

---

### 5. ตำแหน่งการจัดวางใน Excalidraw Live Canvas

- **ตำแหน่ง:** `Section 9` ต่อเนื่องด้านล่าง Section 1–8 และ Page 10
- **พิกัดเรขาคณิต (Coordinates):**
  - Section 9 Header: `X = 50, Y = 8800, W = 9400, H = 110`
  - BPM-01 Block: `X = 50, Y = 8940, W = 9400, H = 1280`
  - BPM-02 Block: `X = 50, Y = 10280, W = 9400, H = 1280`
  - BPM-03 Block: `X = 50, Y = 11620, W = 9400, H = 1280`
- **ไฟล์ข้อมูลที่จัดเก็บ:**
  - ผัง Master รวมทุกส่วน: [full_system_and_workflow_nunito.excalidraw](file:///C:/Users/asus/Documents/GitHub/Digital-University-Project-SE/docs/diagrams/full_system_and_workflow_nunito.excalidraw) (2,002 elements)
  - ผังเฉพาะ BPMN 2.0: [business_process_model_bpmn.excalidraw](file:///C:/Users/asus/Documents/GitHub/Digital-University-Project-SE/docs/diagrams/business_process_model_bpmn.excalidraw) (416 elements)
