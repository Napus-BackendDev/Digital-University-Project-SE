const nodemailer = require("nodemailer");

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '25', 10);
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (host && host !== 'smtp.gmail.com') {
        const config = {
            host: host,
            port: port,
            secure: port === 465,
            tls: {
                rejectUnauthorized: false
            }
        };
        if (user && pass) {
            config.auth = { user, pass };
        }
        return nodemailer.createTransport(config);
    }

    const gmailConfig = {
        service: "gmail"
    };
    if (user && pass) {
        gmailConfig.auth = { user, pass };
    }
    return nodemailer.createTransport(gmailConfig);
}

exports.sendMail = async function (to, subject, text, html) {
    const host = process.env.SMTP_HOST;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (!host && (!user || !pass)) {
        console.warn("Mail credentials not configured, skipping email to:", to);
        return { success: false, error: "Credentials not configured" };
    }

    // --- Inline Image Processing ---
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

    const senderEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || user || 'no-reply@mfu.ac.th';

    let mailOptions = {
        from: `"Digital University Form" <${senderEmail}>`,
        to,          // ผู้รับ
        subject,     // หัวข้อ
        text,        // ข้อความธรรมดา
        html: processedHtml, // ข้อความแบบ HTML (พร้อม CID)
        attachments: attachments // แนบไฟล์รูปภาพแบบ inline
    };

    try {
        const transporter = getTransporter();
        let info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
        console.error("Error sending mail:", error);
        return { success: false, error };
    }
}
