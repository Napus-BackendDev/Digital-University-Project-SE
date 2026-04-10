const th = {
    campus: "ชื่อสถาบันอุดมศึกษา",
    faculty: "สำนักวิชา",
    department: "สาขาวิชา",
    academicYear: "ปีการศึกษา",
    semester: "ภาคการศึกษา",
    course: "เลือกรายวิชา",

    nav: {
        forms: "ฟอร์ม",
        manage: "จัดการฟอร์ม",
        analytics: "การวิเคราะห์",
        permissions: "สิทธิ์การเข้าถึง",
        logout: "ออกจากระบบ",
        selectUser: "เลือกผู้ใช้งาน",
        welcome: "ยินดีต้อนรับสู่ระบบแบบสอบถาม"
    },
    accessLabel: {
        public: "สาธารณะ",
        private: "ส่วนตัว",
        general: "ทั่วไป"
    },

    table: {
        title: "ฟอร์มทั้งหมด",
        access: "การเข้าถึง",
        noForms: "ยังไม่มีแบบสอบถาม เริ่มสร้างเพื่อใช้งาน!",
        emailRequired: "จำเป็นต้องระบุอีเมล",
        addAnswer: "เพิ่มคำตอบ",
        viewAnswer: "ดูคำตอบ",
        continueForm: "ทำแบบฟอร์มต่อ",
        startForm: "เริ่มทำแบบฟอร์ม",
        daysLeft: "วันคงเหลือ",
        closed: "ปิดรับแล้ว",
        completedResponse: "เสร็จสิ้น",
        ongoingResponse: "กำลังทำ",
        duplicate: "คัดลอก",
        questionnaire: "ชื่อแบบสอบถาม",
        status: "สถานะ",
        timeRange: "ช่วงเวลา",
        progress: "ความคืบหน้า",
        createdBy: "จัดทำโดย",
        action: "การดำเนินการ",
        header: "แนวโน้มการตอบกลับ",
        responses: "การตอบกลับ",
        lastUpdated: "แก้ไขล่าสุด",
        created: "แก้ไขล่าสุด",
        actions: "เครื่องมือ",
        view: "ดู",
        duplicate: "คัดลอก",
        edit: "แก้ไข",
        delete: "ลบ",
        search: "ค้นหา...",
        searchPlaceholder: "ค้นหาแบบฟอร์ม...",
        allStatus: "สถานะทั้งหมด",
        noItems: "ยังไม่มีแบบสอบถามในขณะนี้ เริ่มต้นสร้างได้เลย",
        daysLeft: "เหลืออีก {count} วัน",
        completed: "เสร็จสิ้น",
        ongoing: "กำลังดำเนินการ",
        viewSummary: "ดูสรุปผล",
        submitAgain: "ทำอีกครั้ง",
        continueForm: "ทำต่อจากที่ค้างไว้",
        startForm: "เริ่มทำแบบสอบถาม",
        visibility: "การเข้าถึง",
        dateFrom: "จาก",
        dateTo: "ถึง",
        rangeShortcuts: "ช่วงเวลาด่วน",
        quickDate: {
            all: "ทั้งหมด",
            today: "วันนี้",
            thisWeek: "อาทิตย์นี้",
            last7Days: "7 วันล่าสุด",
            last30Days: "30 วันก่อน"
        },
        submittedCount: "ทำไปแล้ว {count} ครั้ง"
    },

    modal: {
        deleteTitle: "ยืนยันการลบ",
        deleteMessage: "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? เมื่อลบแล้วจะไม่สามารถย้อนคืนได้",
        confirm: "ตกลง",
        cancel: "ยกเลิก"
    },

    common: {
        refresh: "รีเฟรช",
        error: "เกิดข้อผิดพลาด",
        success: "สำเร็จ",
        loading: "กำลังโหลด...",
        submitting: "กำลังส่งข้อมูล...",
        ok: "ตกลง",
        untitled: "ไม่มีชื่อฟอร์ม"
    },

    form: {
        yourAnswer: "คำตอบของคุณ",
        submit: "ส่งฟอร์ม",
        copyForm: "คัดลอกฟอร์ม",
        previewBanner: "โหมดตัวอย่าง - อ่านอย่างเดียว",
        duplicateBanner: "โหมดคัดลอก - คัดลอกฟอร์ม",
        successMessage: "ขอบคุณสำหรับการส่งข้อมูล!",
        duplicateSuccess: "คัดลอกฟอร์มเรียบร้อยแล้ว!",
        question: "คำถามที่",
        answered: "ตอบแล้ว",
        notAuthenticated: "ยังไม่ได้เข้าสู่ระบบ",
        loginRequired: "คุณต้องเข้าสู่ระบบเพื่อส่งฟอร์มนี้",
        alreadySubmitted: "คุณได้ส่งแบบสอบถามนี้ไปแล้ว",
        accessDenied: "คุณไม่มีสิทธิ์เข้าถึงฟอร์มนี้ เนื่องจากจำกัดเฉพาะบางองค์กรเท่านั้น",
        accessDeniedPersonal: "คุณไม่มีสิทธิ์เข้าถึงฟอร์มนี้ เนื่องจากจำกัดเฉพาะผู้ใช้งานบางท่านเท่านั้น",
        loginRequiredPersonal: "ฟอร์มนี้จำกัดเฉพาะผู้ใช้งานที่ระบุไว้เท่านั้น กรุณาเข้าสู่ระบบเพื่อตรวจสอบสิทธิ์ของคุณ",
        signInWithGoogle: "เข้าสู่ระบบด้วย Google",
        collectEmail: "รวบรวมอีเมล",
        limitResponse: "จำกัดการตอบเพียงครั้งเดียว",
        emailNotifications: "การแจ้งเตือนทางอีเมล",
        requireResponse: "บังคับตอบทุกข้อ"
    },

    chart: {
        formsByStatus: "ฟอร์มแบ่งตามสถานะ",
        distribution: "สัดส่วนของฟอร์มในปัจจุบัน"
    },

    button: {
        setting: "ตั้งค่า",
        create: "สร้าง",
        start: "เริ่ม",
        edit: "แก้ไข",
        save: "บันทึก",
        cancel: "ยกเลิก",
        back: "ย้อนกลับ",
        preview: "ตัวอย่าง"
    },

    status: {
        draft: "ร่าง",
        active: "เปิด",
        closed: "ปิด",
        pending: "รอดำเนินการ",
        inprogress: "กำลังดำเนินการ",
        completed: "เสร็จสิ้น",
        all: "ทุกสถานะ"
    },

    widget: {
        total: "ฟอร์มทั้งหมด",
        active: "เปิด",
        draft: "ฟอร์มร่าง",
        closed: "ปิด",
        pending: "รอดำเนินการ",
        completed: "เสร็จสิ้น",
        inprogress: "กำลังดำเนินการ",
        totalResponses: "การตอบกลับทั้งหมด",
        totalUsers: "ผู้ใช้งานทั้งหมด",
        avgResponses: "เฉลี่ยต่อฟอร์ม",
        manage: {
            total: "แบบฟอร์มทั้งหมด",
            active: "เปิดใช้งานอยู่",
            draft: "แบบฟอร์มร่าง",
            closed: "ปิดรับไปแล้ว"
        },
        activeUsers: "ผู้ใช้งานที่ใช้งานอยู่",
        completionRate: "อัตราการตอบกลับเฉลี่ย"
    },
    description: "รายละเอียด",
    editor: {
        header: {
            questionTitle: "คำถามของแบบฟอร์ม",
            questionDesc: "เพิ่มและจัดการคำถามเพื่อรวบรวมคำตอบ",
            responseTitle: "การตอบกลับของแบบฟอร์ม",
            responseDesc: "ดูและวิเคราะห์ข้อมูลการส่งแบบฟอร์มและประสิทธิภาพ",
            settingTitle: "การตั้งค่าแบบฟอร์ม",
            settingDesc: "กำหนดค่าการเข้าถึง กำหนดเวลา และการควบคุมองค์กร"
        },
        settings: {
            access: {
                title: "การควบคุมการเข้าถึง",
                collaborators: "ผู้ร่วมจัดการ",
                collaboratorsDesc: "เพิ่มผู้ที่สามารถช่วยคุณจัดการแบบฟอร์มนี้ได้",
                emailPlaceholder: "ที่อยู่อีเมล",
                add: "เพิ่ม",
                selectedCollaborators: "ผู้ร่วมจัดการที่เลือก",
                noCollaborators: "ยังไม่มีการเพิ่มผู้ร่วมจัดการ",
                remove: "ลบออก",
                editor: "ผู้แก้ไข",
                viewer: "ผู้ดู",
                editorDesc: "สามารถแก้ไขฟอร์มและดูการตอบกลับได้",
                viewerDesc: "สามารถดูฟอร์มและการตอบกลับได้เท่านั้น",
                role: "บทบาท",
                accessLevel: "ระดับการเข้าถึง",
                accessLevelDesc: "เลือกระดับการอนุญาตการเข้าถึงสำหรับฟอร์มนี้",
                selectLevel: "เลือกระดับ..."
            },
            status: {
                title: "สถานะแบบฟอร์ม",
                startAt: "วันเวลาเริ่มต้น",
                endAt: "วันเวลาสิ้นสุด",
                statusLabel: "สถานะ",
                draft: "แบบร่าง",
                open: "เปิดใช้งาน",
                scheduled: "ตั้งเวลาเปิด",
                closed: "ปิดรับแล้ว",
                draftDesc: "ยังไม่ได้กำหนดวันเริ่มต้นและวันสิ้นสุด แบบฟอร์มยังไม่เปิดรับการตอบกลับ",
                openDesc: "อยู่ในช่วงเวลาที่กำหนด แบบฟอร์มกำลังเปิดรับการตอบกลับ",
                scheduledDesc: "วันเริ่มต้นอยู่ในอนาคต แบบฟอร์มจะเปิดอัตโนมัติเมื่อถึงเวลาที่กำหนด",
                closedDesc: "ไม่อยู่ในช่วงเวลาที่กำหนด แบบฟอร์มปิดรับการตอบกลับแล้ว"
            },
            organization: {
                title: "การควบคุมองค์กร",
                selectedOrgs: "องค์กรที่เลือก",
                noOrgs: "ยังไม่มีการเลือกองค์กร แบบฟอร์มจะเป็นแบบส่วนตัว",
                canResponse: "องค์กรที่สามารถตอบได้",
                name: "ชื่อองค์กร",
                selectPlaceholder: "เลือกองค์กร",
                generalHint: "ถ้าคุณเลือก General ทุกหน่วยงานจะสามารถทำฟอร์มได้",
                allowedEmails: "อีเมลที่อนุญาต",
                noEmails: "ยังไม่มีการเพิ่มอีเมลเฉพาะเจาะจง",
                specifyUser: "ระบุผู้ใช้งานที่สามารถตอบได้",
                emailPlaceholder: "ใส่อีเมลของผู้ใช้งานเพื่ออนุญาตการเข้าถึง",
                userHint: "ถ้าคุณใส่ข้อมูล User โดยตรง User จะทำฟอร์มได้แค่คนเดียว คนอื่นจะไม่เห็น สามารถเลือก User นอกองค์กรได้"
            },
            response: {
                title: "การตั้งค่าการตอบกลับ",
                collectEmail: "รวบรวมที่อยู่อีเมล",
                collectEmailDesc: "บังคับให้ผู้ตอบระบุอีเมล",
                notifications: "การแจ้งเตือนทางอีเมล",
                notificationsDesc: "ส่งอีเมลแจ้งเตือนไปยังผู้ตอบหลังจากส่งข้อมูล",
                message: "ข้อความในอีเมล",
                messagePlaceholder: "เขียนข้อความที่จะส่งไปยังผู้ตอบ",
                messageTip: "คำแนะนำ: คุณสามารถใช้ {name} หรือ {email} เพื่อปรับแต่งข้อความได้",
                limitOne: "จำกัดการตอบเพียงครั้งเดียว",
                limitOneDesc: "อนุญาตให้ตอบได้เพียงครั้งเดียวต่อคน",
                requireAll: "บังคับตอบทุกข้อ",
                requireAllDesc: "บังคับให้ตอบทุกข้อก่อนที่จะส่งแบบฟอร์มได้"
            }
        }
    },
    toolbar: {
        mainNav: "เมนูหลัก",
        questions: "คำถาม",
        responses: "การตอบกลับ",
        settings: "การตั้งค่า",
        sharing: "การแชร์แบบฟอร์ม",
        copyLink: "คัดลอกลิงก์",
        copied: "คัดลอกแล้ว!",
        sendEmail: "ส่งอีเมล",
        questionTypes: "ประเภทคำถาม",
        contentElements: "องค์ประกอบเนื้อหา",
        qr: {
            scan: "สแกน QR Code",
            share: "แชร์ QR Code",
            instruction: "สแกน QR Code นี้ด้วยกล้องโทรศัพท์ของคุณเพื่อเข้าถึงและกรอกแบบฟอร์มได้อย่างง่ายดาย",
            done: "เสร็จสิ้น"
        }
    },
    analytics: {
        title: "แดชบอร์ดผู้ดูแลระบบ",
        description: "ภาพรวมของแบบฟอร์มและการตอบกลับทั้งหมด",
        dailyResponsesTrend: "แนวโน้มการตอบกลับรายวัน",
        dailyResponsesDesc: "แสดงข้อมูลการตอบแบบสอบถามสำหรับช่วงที่เลือก",
        responsesOverTime: "เทรนด์การตอบกลับ",
        responsesOverTimeDesc: "การตอบกลับรายวันในตัวกรองที่เลือก",
        sevenDaysView: "ดูย้อนหลัง 7 วัน",
        timeRange: {
            "7d": "7 วัน",
            "30d": "30 วัน",
            "1y": "1 ปี"
        },
        mostRespondedForm: "แบบฟอร์มที่มีการตอบกลับสูงสุด",
        mostRespondedDesc: "แสดงแบบฟอร์มที่มีจำนวนการตอบกลับมากที่สุดในช่วงเวลาที่เลือก",
        widgets: {
            totalForms: "แบบฟอร์มทั้งหมด",
            totalResponses: "การตอบกลับทั้งหมด",
            totalUsers: "ผู้ใช้งานทั้งหมด",
            avgResponses: "การตอบกลับเฉลี่ยต่อฟอร์ม"
        },
        submissionTrend: "แนวโน้มกิจกรรมการส่งข้อมููล",
        popularForms: "5 อันดับแบบฟอร์มยอดนิยม",
        today: "วันนี้",
        oneWeek: "1 สัปดาห์",
        oneMonth: "1 เดือน",
        submissions: "การตอบกลับ",
        overviewBasedOn: "ภาพรวมของการตอบกลับตาม {range}"
    },
    types: {
        short_answer: "คำตอบสั้น",
        paragraph: "คำบรรยาย",
        multiple_choice: "หลายตัวเลือก",
        checkbox: "กล่องเลือก",
        rating: "ประเมินให้คะแนน",
        file_upload: "อัปโหลดไฟล์",
        title_description: "หัวข้อและคำอธิบาย",
        image: "รูปภาพ"
    },
    responses: {
        title: "สรุปผลการตอบกลับ",
        total: "การตอบกลับทั้งหมด",
        summary: "สรุปผล",
        individual: "รายบุคคล",
        noData: "ยังไม่มีข้อมูลในขณะนี้",
        noDataDesc: "รอผู้เข้าร่วมทำแบบสอบถามให้เสร็จสิ้น",
        export: "ส่งออกข้อมูล",
        excel: "ไฟล์ Excel (.xlsx)",
        json: "ดาวน์โหลดไฟล์ JSON",
        noExportData: "ไม่มีข้อมูลที่จะส่งออก"
    },
    builder: {
        addLanguage: "เพิ่มภาษา",
        shortAnswerPlaceholder: "คำตอบสั้นๆ",
        paragraphPlaceholder: "คำบรรยายยาวๆ",
        addOption: "เพิ่มตัวเลือก",
        noAction: "ไม่มีการดำเนินการ",
        fileType: "ประเภทไฟล์",
        maxFiles: "จำนวนไฟล์สูงสุด",
        maxFileSize: "ขนาดไฟล์สูงสุด",
        description: "คำอธิบาย",
        clickToChooseImage: "คลิกเพื่อเลือกรูปภาพ",
        type: "ประเภท",
        previewNotAvailable: "ไม่มีตัวอย่างสำหรับประเภทนี้",
        emptyQuestions: "คุณยังไม่ได้รับรายชื่อคำถาม ลองเพิ่มได้จากแถบด้านข้าง",
        requiredLabel: "จำเป็นต้องตอบ",
        modal: {
            chooseImage: "เลือกรูปภาพ",
            cancel: "ยกเลิก",
            ok: "ตกลง"
        },
        goTo: "ไปที่:",
        nextQuestion: "คำถามถัดไป",
        submitForm: "ส่งแบบสอบถาม",
        questionLabel: "ข้อที่"
    }
}
export default th
