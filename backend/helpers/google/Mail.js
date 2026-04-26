const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER, // อีเมลผู้ส่ง
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS, // รหัสผ่าน (หรือ App Password)
    },
});

exports.sendMail = async function (to, subject, text, html) {
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn("Mail credentials not configured, skipping email to:", to);
        return { success: false, error: "Credentials not configured" };
    }

    let mailOptions = {
        from: `"Digital University Form" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
        to,          // ผู้รับ
        subject,     // หัวข้อ
        text,        // ข้อความธรรมดา
        html,        // ข้อความแบบ HTML
    };

    try {
        let info = await transporter.sendMail(mailOptions);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending mail:", error);
        return { success: false, error };
    }
}
