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
        logout: "ออกจากระบบ"
    },

    table: {
        title: "ฟอร์มทั้งหมด",
        access: "การเข้าถึง",
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
        dateFrom: "จากวันที่",
        dateTo: "ถึงวันที่",
        rangeShortcuts: "ช่วงเวลาด่วน",
        quickDate: {
            all: "ทั้งหมด",
            today: "วันนี้",
            thisWeek: "อาทิตย์นี้",
            last7Days: "7 วันที่ผ่านมา",
            last30Days: "30 วันก่อน"
        }
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
        notAuthenticated: "ยังไม่ได้เข้าสู่ระบบ",
        loginRequired: "คุณต้องเข้าสู่ระบบเพื่อส่งฟอร์มนี้",
        alreadySubmitted: "คุณได้ส่งแบบสอบถามนี้ไปแล้ว",
        accessDenied: "คุณไม่มีสิทธิ์เข้าถึงฟอร์มนี้ เนื่องจากจำกัดเฉพาะบางองค์กรเท่านั้น",
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
        pending: "ร่าง",
        inprogress: "กำลังดำเนินการ",
        completed: "เสร็จสิ้น",
        all: "ทุกสถานะ"
    },

    widget: {
        total: "ฟอร์มทั้งหมด",
        active: "เปิด",
        draft: "ฟอร์มร่าง",
        closed: "ปิด",
        pending: "ฟอร์มร่าง",
        completed: "เสร็จสิ้น",
        inprogress: "กำลังดำเนินการ",
        totalResponses: "การตอบกลับทั้งหมด",
        totalUsers: "ผู้ใช้งานทั้งหมด",
        avgResponses: "เฉลี่ยต่อฟอร์ม"
    },
    analytics: {
        responsesOverTime: "แนวโน้มการตอบกลับ",
        sevenDaysView: "ดูย้อนหลัง 7 วัน",
        dailyResponsesDesc: "การตอบกลับรายวันในช่วงสัปดาห์ที่ผ่านมา",
        mostResponded: "ฟอร์มที่มีการตอบกลับสูงสุด",
        mostRespondedDesc: "ฟอร์มที่ได้รับความสนใจสูงสุด",
        dailyResponsesTrend: "แนวโน้มการตอบกลับรายวันในสัปดาห์ล่าสุด"
    },
    description: "รายละเอียด"
}
export default th
