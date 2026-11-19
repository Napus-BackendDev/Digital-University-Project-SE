'use strict';

const processor = require('../../../../helpers/TemplateProcessor');
const baseLayout = require('../../Email/templates/baseLayout');
const { generateQrCodeDataUri, buildQrCodeHtmlBlock } = require('../../Email/service/email.utils');

const SAMPLE_FORM_URL = 'http://localhost:8080/forms/670000000000000000000001?mode=public';
const SAMPLE_MANAGE_URL = 'http://localhost:8080/manage/670000000000000000000001';

const DEFAULT_EMAIL_TEMPLATES = {
    invitationCollaboration: {
        code: 'invitationCollaboration',
        name: [
            { key: 'en', value: 'Collaborator Invitation' },
            { key: 'th', value: 'คำเชิญร่วมจัดการแบบสอบถาม' }
        ],
        subject: 'Invitation to collaborate on: {{FormTitle}}',
        content: [
            '<p>Dear <strong>{{CollaboratorName}}</strong>,</p>',
            '<p><strong>{{InviterName}}</strong> has invited you to manage and collaborate on the questionnaire <strong>{{FormTitle}}</strong> with <strong>{{Permission}}</strong> access.</p>',
            '<p>You can review form questions, monitor submission progress, and manage settings together.</p>',
            '<div style="margin: 30px 0; text-align: center;">',
            '<a href="{{InvitationLink}}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Manage Form</a>',
            '</div>'
        ].join(''),
        variables: [
            'CollaboratorName',
            'InviterName',
            'FormTitle',
            'Permission',
            'ManageURL',
            'InvitationLink',
            'ContactOrganization',
            'ContactEmail'
        ]
    },
    invitationOrganization: {
        code: 'invitationOrganization',
        name: [
            { key: 'en', value: 'Organization Form Invitation' },
            { key: 'th', value: 'เชิญตอบแบบสอบถามตามหน่วยงาน' }
        ],
        subject: 'New Form Invitation: {{FormTitle}}',
        content: [
            '<p>Dear <strong>{{ResponderName}}</strong>,</p>',
            '<p>An official questionnaire from <strong>{{OrganizationName}}</strong> has been shared with you.</p>',
            '<div style="padding: 18px 20px; background-color: #f8fafc; border-left: 4px solid #8c1515; border-radius: 8px; margin: 20px 0;">',
            '<p style="margin: 0; font-size: 12px; color: #8c1515; font-weight: bold; text-transform: uppercase;">New Questionnaire</p>',
            '<p style="margin: 6px 0 0; font-size: 17px; font-weight: bold; color: #0f172a;">{{FormTitle}}</p>',
            '<p style="margin: 6px 0 0; font-size: 13px; color: #475569;">Schedule: {{SchedulePeriod}}</p>',
            '</div>',
            '<p>Your participation is valuable and helps us improve our university services.</p>',
            '<div style="margin: 28px 0; text-align: center;">',
            '<a href="{{InvitationLink}}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Open Questionnaire</a>',
            '</div>',
            '<div data-qr-section="true">{{QRCode}}</div>'
        ].join(''),
        variables: [
            'ResponderName',
            'OrganizationName',
            'FormTitle',
            'SchedulePeriod',
            'OpenDate',
            'CloseDate',
            'InvitationLink',
            'FormURL',
            'QRCode',
            'ContactOrganization',
            'ContactEmail'
        ]
    },
    submissionConfirmation: {
        code: 'submissionConfirmation',
        name: [
            { key: 'en', value: 'Submission Confirmation' },
            { key: 'th', value: 'ยืนยันการส่งแบบสอบถาม' }
        ],
        subject: 'Submission Confirmation: {{FormName}}',
        content: [
            '<p>Dear <strong>{{Responder}}</strong>,</p>',
            '<p>Your response has been successfully submitted to <strong>{{FormName}}</strong>. This email confirms that our system has received your data.</p>',
            '<div style="padding: 18px 20px; background-color: #f8fafc; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">',
            '<p style="margin: 4px 0; font-size: 14px;"><strong>Reference No:</strong> {{ReferenceNo}}</p>',
            '<p style="margin: 4px 0; font-size: 14px;"><strong>Submitted At:</strong> {{SubmittedAt}}</p>',
            '</div>',
            '<p>Please keep this email for your records. Thank you for your participation.</p>'
        ].join(''),
        variables: [
            'Responder',
            'FormName',
            'ReferenceNo',
            'SubmittedAt',
            'EmailMessage',
            'FormURL',
            'ContactOrganization',
            'ContactEmail'
        ]
    },
    ResponseNotification: {
        code: 'ResponseNotification',
        name: [
            { key: 'en', value: 'Response Notification' },
            { key: 'th', value: 'แจ้งเตือนเมื่อมีคำตอบใหม่' }
        ],
        subject: 'New response received for: {{FormTitle}}',
        content: [
            '<p>Dear <strong>{{UserName}}</strong>,</p>',
            '<p>A new response has been submitted for your questionnaire <strong>{{FormTitle}}</strong> by <strong>{{Responder}}</strong>.</p>',
            '<div style="margin: 28px 0; text-align: center;">',
            '<a href="{{DashboardLink}}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">View in Dashboard</a>',
            '</div>'
        ].join(''),
        variables: [
            'UserName',
            'FormTitle',
            'Responder',
            'SubmittedAt',
            'ReferenceNo',
            'DashboardLink',
            'ContactOrganization',
            'ContactEmail'
        ]
    }
};

const SAMPLE_TEST_VARIABLES = {
    FormTitle: 'Course & Teaching Satisfaction Survey (1/2026)',
    FormName: 'Course & Teaching Satisfaction Survey (1/2026)',
    Responder: 'Somchai Jaidee',
    ResponderName: 'Somchai Jaidee',
    UserName: 'Napus Samuanpho',
    CollaboratorName: 'Dr. Suda Rakdee',
    InviterName: 'Napus Samuanpho',
    OrganizationName: 'School of Information Technology',
    Organization: 'School of Information Technology',
    ContactOrganization: 'School of Information Technology',
    ContactEmail: 'it-survey@mfu.ac.th',
    Permission: 'Editor',
    SchedulePeriod: '18 Nov 2026, 09:00 – 25 Nov 2026, 23:59',
    OpenDate: '18 Nov 2026, 09:00',
    CloseDate: '25 Nov 2026, 23:59',
    SubmittedAt: '14 Nov 2026, 09:30',
    ReferenceNo: 'REF-20261114-001',
    EmailMessage: 'Thank you for sharing your valuable feedback.',
    InvitationLink: SAMPLE_FORM_URL,
    DashboardLink: SAMPLE_MANAGE_URL,
    ManageURL: SAMPLE_MANAGE_URL,
    FormURL: SAMPLE_FORM_URL,
    QRCode: `<div data-qr-block="true" style="margin: 22px 0 8px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;"><p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #8c1515; text-transform: uppercase;">Scan QR Code via Mobile</p><p style="margin: 0; font-size: 12px; color: #475569;">QR Code pointing to ${SAMPLE_FORM_URL}</p></div>`
};

function isValidEmailAddress(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function buildTestVariablesForCode(code, overrides = {}) {
    const isCollab = code === 'invitationCollaboration';
    return {
        ...SAMPLE_TEST_VARIABLES,
        InvitationLink: isCollab ? SAMPLE_MANAGE_URL : SAMPLE_FORM_URL,
        ...overrides
    };
}

function ensureInvitationTemplateDetails(code, rawContent) {
    let content = String(rawContent || '');
    if (code !== 'invitationOrganization') {
        return content;
    }

    const hasScheduleVar = /\{\{\s*(?:SchedulePeriod|OpenDate|CloseDate)\s*\}\}/i.test(content);
    const hasScheduleHidden = content.includes('<!-- schedule-hidden -->');
    if (!hasScheduleVar && !hasScheduleHidden) {
        content += '<p style="margin: 14px 0 0; font-size: 13px; color: #475569;"><strong>Schedule:</strong> {{SchedulePeriod}}</p>';
    }

    const hasQrVar = /\{\{\s*QRCode\s*\}\}/i.test(content);
    const hasQrHidden = content.includes('<!-- qr-hidden -->');
    if (!hasQrVar && !hasQrHidden) {
        content += '<div data-qr-section="true">{{QRCode}}</div>';
    }

    return content;
}

function buildRenderedTestEmail({ code, subject, content, variables = {}, layoutOptions = {} } = {}) {
    const fallback = DEFAULT_EMAIL_TEMPLATES[code] || {};
    const rawSubject = subject !== undefined && subject !== null && String(subject).trim() !== ''
        ? String(subject)
        : (fallback.subject || 'MFU E-Questionnaires Notification');
    const rawContentBase = content !== undefined && content !== null && String(content).trim() !== ''
        ? String(content)
        : (fallback.content || '<p>Test email preview</p>');

    const effectiveContent = ensureInvitationTemplateDetails(code, rawContentBase);
    const mergedVars = buildTestVariablesForCode(code, variables);

    const renderedSubject = processor.processTemplate(rawSubject, mergedVars);
    const renderedHtml = processor.processWithLayout(effectiveContent, mergedVars, baseLayout.wrapInLayout, {
        title: renderedSubject,
        contactOrganization: mergedVars.ContactOrganization,
        contactEmail: mergedVars.ContactEmail,
        ...layoutOptions
    });
    const renderedText = processor.processTemplate(effectiveContent, mergedVars)
        .replace(/<div[^>]*data-qr-block="true"[\s\S]*?<\/div>/gi, ' [QR Code available in HTML email] ')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText
    };
}

async function buildRenderedTestEmailAsync({ code, subject, content, variables = {}, layoutOptions = {} } = {}) {
    const resolvedVars = { ...variables };
    if (code === 'invitationOrganization' && !resolvedVars.QRCode) {
        const targetUrl = resolvedVars.InvitationLink || SAMPLE_FORM_URL;
        const qrDataUri = await generateQrCodeDataUri(targetUrl);
        if (qrDataUri) {
            resolvedVars.QRCode = buildQrCodeHtmlBlock(qrDataUri, targetUrl);
        }
    }
    return buildRenderedTestEmail({ code, subject, content, variables: resolvedVars, layoutOptions });
}

module.exports = {
    DEFAULT_EMAIL_TEMPLATES,
    SAMPLE_TEST_VARIABLES,
    isValidEmailAddress,
    ensureInvitationTemplateDetails,
    buildRenderedTestEmail,
    buildRenderedTestEmailAsync
};
