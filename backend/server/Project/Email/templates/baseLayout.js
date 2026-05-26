'use strict';

const config = require('../../../../config/email.config');

/**
 * Internal helper to generate the email header.
 */
const renderHeader = (branding) => `
    <tr>
        <td align="center" style="padding: 32px 40px; background-color: ${branding.primaryColor}; background-image: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%);">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${branding.logoText}</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${branding.serviceName}</p>
        </td>
    </tr>
`;

/**
 * Internal helper to generate the email footer.
 */
const renderFooter = (branding) => `
    <tr>
        <td style="padding: 30px 40px; background-color: #fafbfc; border-top: 1px solid #f0f2f5; text-align: center;">
            <p style="margin: 0; color: ${branding.mutedTextColor}; font-size: 12px;">
                <strong>${branding.logoText} Form Service</strong><br>
                ${branding.footerText}
            </p>
            <div style="margin-top: 15px;">
                <a href="${branding.privacyUrl}" style="color: ${branding.mutedTextColor}; font-size: 11px; margin: 0 5px;">Privacy Policy</a> | 
                <a href="${branding.supportUrl}" style="color: ${branding.mutedTextColor}; font-size: 11px; margin: 0 5px;">Contact Support</a>
            </div>
        </td>
    </tr>
`;

/**
 * Wraps content in a professional, responsive, and robust HTML email layout.
 */
exports.wrapInLayout = function (content, options = {}) {
    const branding = { ...config.branding, ...options.branding };
    const title = options.title || `${branding.logoText} Notification`;
    const preheader = options.preheader || '';

    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <title>${title}</title>
    <!--[if mso]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style>
        body { margin: 0; padding: 0; width: 100%; background-color: ${branding.backgroundColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        table { border-collapse: collapse; border-spacing: 0; }
        img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
        
        @media only screen and (max-width: ${config.settings.maxContainerWidth}px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .content { padding: 25px !important; }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            .body { background-color: #1a202c !important; }
            .container { background-color: #2d3748 !important; border-color: #4a5568 !important; }
            .content { color: #e2e8f0 !important; }
            .footer-text { color: #a0aec0 !important; }
        }
    </style>
</head>
<body class="body" style="margin: 0; padding: 0; background-color: ${branding.backgroundColor};">
    <div role="article" aria-roledescription="email" aria-label="${title}" lang="en">
        <!-- Hidden Preheader -->
        <div style="display: none; max-height: 0; overflow: hidden;">
            ${preheader}
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        </div>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <!--[if mso]>
                    <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="${config.settings.maxContainerWidth}">
                    <tr>
                    <td>
                    <![endif]-->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${config.settings.maxContainerWidth}" class="container" style="background-color: ${branding.cardBackground}; border-radius: ${config.settings.borderRadius}px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                        ${renderHeader(branding)}

                        <!-- Content Area -->
                        <tr>
                            <td class="content" style="padding: 40px; color: ${branding.textColor}; line-height: 1.6; font-size: 16px;">
                                ${content}
                            </td>
                        </tr>

                        ${renderFooter(branding)}
                    </table>
                    <!--[if mso]>
                    </td>
                    </tr>
                    </table>
                    <![endif]-->
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
};
