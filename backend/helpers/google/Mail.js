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

    // --- Inline Image Processing ---
    // Automatically detect base64 images in HTML and convert them to CID attachments
    // This improves compatibility with many email clients (Outlook, Gmail mobile, etc.)
    let attachments = [];
    let processedHtml = html || '';

    if (processedHtml.includes('data:image/')) {
        const imageRegex = /<img[^>]+src="data:(image\/[^;]+);base64,([^"]+)"/g;
        let match;
        let count = 0;

        while ((match = imageRegex.exec(html)) !== null) {
            const mimeType = match[1];
            const base64Data = match[2];
            const cid = `image_${Date.now()}_${count++}`;
            const extension = mimeType.split('/')[1] || 'png';

            attachments.push({
                filename: `${cid}.${extension}`,
                content: Buffer.from(base64Data, 'base64'),
                cid: cid
            });

            // Replace the data URI with the CID reference
            processedHtml = processedHtml.replace(match[0], match[0].replace(`data:${mimeType};base64,${base64Data}`, `cid:${cid}`));
        }
    }

    let mailOptions = {
        from: `"Digital University Form" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
        to,          // ผู้รับ
        subject,     // หัวข้อ
        text,        // ข้อความธรรมดา
        html: processedHtml, // ข้อความแบบ HTML (พร้อม CID)
        attachments: attachments // แนบไฟล์รูปภาพแบบ inline
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending mail:", error);
        return { success: false, error };
    }
}
