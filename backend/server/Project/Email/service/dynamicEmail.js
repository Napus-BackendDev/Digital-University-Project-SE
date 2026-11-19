'use strict';

const EmailTemplateModel = require('../../Settings/models/emailTemplate.model');
const mailer = require('../../../../helpers/google/Mail');
const processor = require('../../../../helpers/TemplateProcessor');
const baseLayout = require('../templates/baseLayout');
const { ensureInvitationTemplateDetails } = require('../../Settings/utils/emailTemplateDefaults');

// Fallback Static Templates
const fallbackTemplates = {
    submissionConfirmation: require('../templates/submissionConfirmation'),
    invitationCollaboration: require('../templates/invitationCollaboration'),
    invitationOrganization: require('../templates/invitationOrganization'),
    generic: require('../templates/generic')
};

/**
 * Handlers for generating fallback email content.
 */
const fallbackHandlers = {
    submissionConfirmation: (vars, meta = {}) => ({
        subject: `Submission Confirmation: ${vars.FormName || 'Form'}`,
        html: fallbackTemplates.submissionConfirmation.buildSubmissionConfirmationHtml({
            name: vars.Responder,
            formTitle: vars.FormName,
            submittedAt: vars.SubmittedAt,
            referenceNo: vars.ReferenceNo,
            emailMessage: vars.EmailMessage || '',
            contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
            contactEmail: vars.ContactEmail || meta.contactEmail || '',
            appName: meta.appName || ''
        }),
        text: fallbackTemplates.submissionConfirmation.buildSubmissionConfirmationText({
            name: vars.Responder,
            formTitle: vars.FormName,
            submittedAt: vars.SubmittedAt,
            referenceNo: vars.ReferenceNo,
            emailMessage: vars.EmailMessage || '',
            contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
            contactEmail: vars.ContactEmail || meta.contactEmail || ''
        })
    }),
    creatorNotification: (vars, meta = {}) => {
        const safeFormName = processor.escapeHtml(vars.FormName || 'Form');
        const safeResponder = processor.escapeHtml(vars.Responder || 'Anonymous (Guest)');
        const safeSubmittedAt = processor.escapeHtml(vars.SubmittedAt || '-');
        const safeRef = processor.escapeHtml(vars.ReferenceNo || '-');
        const htmlMsg = `
            <p>A new response has been submitted to your form <strong>${safeFormName}</strong>.</p>
            <div style="padding:16px; background:#f8fafc; border-left:4px solid #ac1515; border-radius:8px; margin:16px 0;">
                <p style="margin:6px 0;"><strong>Responder:</strong> ${safeResponder}</p>
                <p style="margin:6px 0;"><strong>Submitted:</strong> ${safeSubmittedAt}</p>
                <p style="margin:6px 0;"><strong>Reference No:</strong> ${safeRef}</p>
            </div>
        `;
        return {
            subject: `New Response Received: ${vars.FormName || 'Form'}`,
            html: baseLayout.wrapInLayout(
                `${htmlMsg}<div style="margin: 26px 0; text-align: center;"><a href="${processor.escapeHtml(vars.ManageURL || vars.FormURL || '')}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">View Responses</a></div>`,
                {
                    title: `New Response: ${vars.FormName || 'Form'}`,
                    appName: meta.appName || '',
                    contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
                    contactEmail: vars.ContactEmail || meta.contactEmail || ''
                }
            ),
            text: `New response received for "${vars.FormName || 'Form'}".\nResponder: ${vars.Responder || 'Anonymous (Guest)'}\nSubmitted: ${vars.SubmittedAt || '-'}\nReference No: ${vars.ReferenceNo || '-'}\nView: ${vars.ManageURL || vars.FormURL || ''}`
        };
    },
    invitationCollaboration: (vars, meta = {}) => ({
        subject: `Invitation: ${vars.FormTitle || 'Form'}`,
        html: fallbackTemplates.invitationCollaboration.buildInvitationCollaborationHtml({
            inviterName: vars.InviterName,
            collaboratorName: vars.CollaboratorName,
            formTitle: vars.FormTitle,
            permission: vars.Permission,
            invitationLink: vars.InvitationLink || vars.ManageURL,
            contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
            contactEmail: vars.ContactEmail || meta.contactEmail || '',
            appName: meta.appName || ''
        }),
        text: fallbackTemplates.invitationCollaboration.buildInvitationCollaborationText({
            inviterName: vars.InviterName,
            collaboratorName: vars.CollaboratorName,
            formTitle: vars.FormTitle,
            permission: vars.Permission,
            invitationLink: vars.InvitationLink || vars.ManageURL,
            contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
            contactEmail: vars.ContactEmail || meta.contactEmail || ''
        })
    }),
    invitationOrganization: (vars, meta = {}) => ({
        subject: `New Form Invitation: ${vars.FormTitle || 'Form'} (${vars.OrganizationName || 'Org'})`,
        html: fallbackTemplates.invitationOrganization.buildOrganizationInvitationHtml({
            organizationName: vars.OrganizationName,
            responderName: vars.ResponderName,
            formTitle: vars.FormTitle,
            invitationLink: vars.InvitationLink || vars.FormURL,
            schedulePeriod: vars.SchedulePeriod || '',
            openDate: vars.OpenDate || '',
            closeDate: vars.CloseDate || '',
            qrCodeHtml: vars.QRCode || '',
            contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
            contactEmail: vars.ContactEmail || meta.contactEmail || '',
            appName: meta.appName || ''
        }),
        text: fallbackTemplates.invitationOrganization.buildOrganizationInvitationText({
            organizationName: vars.OrganizationName,
            responderName: vars.ResponderName,
            formTitle: vars.FormTitle,
            invitationLink: vars.InvitationLink || vars.FormURL,
            schedulePeriod: vars.SchedulePeriod || '',
            contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
            contactEmail: vars.ContactEmail || meta.contactEmail || ''
        })
    }),
    default: (vars, meta = {}) => ({
        subject: vars.Subject || 'Digital University Notification',
        html: baseLayout.wrapInLayout(
            `<div>${vars.Message || 'You have a new notification from Digital University.'}</div>`,
            {
                title: vars.Title || vars.Subject || 'Notification',
                appName: meta.appName || '',
                contactOrganization: vars.ContactOrganization || meta.contactOrganization || '',
                contactEmail: vars.ContactEmail || meta.contactEmail || ''
            }
        ),
        text: fallbackTemplates.generic.buildGenericText(
            vars.Title || vars.Subject || 'Notification',
            vars.Message || 'You have a new notification from Digital University.'
        )
    })
};

/**
 * Sends an email using the owning account's personal template first,
 * falling back to system baseline (owner: null) or static templates.
 */
exports.sendDynamicEmail = async function (code, variables, to, options = {}) {
    try {
        const effectiveSmtp = typeof mailer.getEffectiveSmtpConfig === 'function'
            ? await mailer.getEffectiveSmtpConfig().catch(() => null)
            : null;
        const appName = (options && options.appName) || (effectiveSmtp && effectiveSmtp.appName) || '';
        const enrichedVars = {
            ...(variables || {}),
            ...(appName && !(variables && variables.ApplicationName) ? { ApplicationName: appName } : {}),
            ...(options && options.contactOrganization && !(variables && variables.ContactOrganization)
                ? { ContactOrganization: options.contactOrganization }
                : {}),
            ...(options && options.contactEmail && !(variables && variables.ContactEmail)
                ? { ContactEmail: options.contactEmail }
                : {})
        };

        const contactOrganization = enrichedVars.ContactOrganization || (options && options.contactOrganization) || '';
        const contactEmail = enrichedVars.ContactEmail || (options && options.contactEmail) || '';
        const replyTo = (options && options.replyTo) || contactEmail || '';

        const codeFilter = code === 'creatorNotification'
            ? { code: { $in: ['creatorNotification', 'ResponseNotification'] } }
            : { code: code };

        const ownerId = options && options.ownerId ? options.ownerId : null;
        let template = null;

        if (ownerId) {
            template = await EmailTemplateModel.findOne(Object.assign({ owner: ownerId }, codeFilter)).lean();
        }
        if (!template) {
            template = await EmailTemplateModel.findOne(
                Object.assign({ $or: [{ owner: null }, { owner: { $exists: false } }] }, codeFilter)
            ).lean();
        }

        let subject, htmlContent, textContent;
        const layoutMeta = { appName, contactOrganization, contactEmail };

        if (!template) {
            console.warn(`[Dynamic Email] Template not found for code: ${code}. Falling back to static template.`);

            const handler = fallbackHandlers[code] || fallbackHandlers.default;
            const fallback = handler(enrichedVars, layoutMeta);

            subject = fallback.subject;
            htmlContent = fallback.html;
            textContent = fallback.text;
        } else {
            const effectiveTemplateContent = ensureInvitationTemplateDetails(code, template.content);
            subject = processor.processTemplate(template.subject, enrichedVars);
            htmlContent = processor.processWithLayout(effectiveTemplateContent, enrichedVars, baseLayout.wrapInLayout, {
                title: subject,
                appName,
                contactOrganization,
                contactEmail
            });

            textContent = processor.processTemplate(effectiveTemplateContent, enrichedVars)
                .replace(/<div[^>]*data-qr-block="true"[\s\S]*?<\/div>/gi, enrichedVars.InvitationLink ? ` [QR Code / Link: ${enrichedVars.InvitationLink}] ` : ' ')
                .replace(/<[^>]*>?/gm, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
        }

        const mailOptions = {};
        if (replyTo) mailOptions.replyTo = replyTo;
        if (appName) mailOptions.fromName = appName;

        if (Object.keys(mailOptions).length > 0) {
            return await mailer.sendMail(to, subject, textContent, htmlContent, mailOptions);
        }
        return await mailer.sendMail(to, subject, textContent, htmlContent);

    } catch (error) {
        console.error(`[Dynamic Email] Failed to send email [${code}] to [${to}]:`, error);
        throw error;
    }
};
