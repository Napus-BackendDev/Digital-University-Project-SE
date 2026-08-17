'use strict';

const EmailTemplateModel = require('../../Settings/models/emailTemplate.model');
const mailer = require('../../../../helpers/google/Mail');
const processor = require('../../../../helpers/TemplateProcessor');
const baseLayout = require('../templates/baseLayout');

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
    submissionConfirmation: (vars) => ({
        subject: `Submission Confirmation: ${vars.FormName || 'Form'}`,
        html: fallbackTemplates.submissionConfirmation.buildSubmissionConfirmationHtml({
            name: vars.Responder,
            formTitle: vars.FormName,
            submittedAt: vars.SubmittedAt,
            referenceNo: vars.ReferenceNo,
            emailMessage: vars.EmailMessage
        }),
        text: fallbackTemplates.submissionConfirmation.buildSubmissionConfirmationText({
            name: vars.Responder,
            formTitle: vars.FormName,
            submittedAt: vars.SubmittedAt,
            referenceNo: vars.ReferenceNo,
            emailMessage: vars.EmailMessage
        })
    }),
    invitationCollaboration: (vars) => ({
        subject: `Invitation: ${vars.FormTitle || 'Form'}`,
        html: fallbackTemplates.invitationCollaboration.buildInvitationCollaborationHtml({
            inviterName: vars.InviterName,
            collaboratorName: vars.CollaboratorName,
            formTitle: vars.FormTitle,
            permission: vars.Permission,
            invitationLink: vars.InvitationLink
        }),
        text: fallbackTemplates.invitationCollaboration.buildInvitationCollaborationText({
            inviterName: vars.InviterName,
            collaboratorName: vars.CollaboratorName,
            formTitle: vars.FormTitle,
            permission: vars.Permission,
            invitationLink: vars.InvitationLink
        })
    }),
    invitationOrganization: (vars) => ({
        subject: `New Form Invitation: ${vars.FormTitle || 'Form'} (${vars.OrganizationName || 'Org'})`,
        html: fallbackTemplates.invitationOrganization.buildOrganizationInvitationHtml({
            organizationName: vars.OrganizationName,
            responderName: vars.ResponderName,
            formTitle: vars.FormTitle,
            invitationLink: vars.InvitationLink
        }),
        text: fallbackTemplates.invitationOrganization.buildOrganizationInvitationText({
            organizationName: vars.OrganizationName,
            responderName: vars.ResponderName,
            formTitle: vars.FormTitle,
            invitationLink: vars.InvitationLink
        })
    }),
    default: (vars) => ({
        subject: vars.Subject || 'Digital University Notification',
        html: fallbackTemplates.generic.buildGenericHtml(
            vars.Title || vars.Subject || 'Notification',
            vars.Message || 'You have a new notification from Digital University.',
            {
                buttonUrl: vars.ButtonUrl,
                buttonText: vars.ButtonText
            }
        ),
        text: fallbackTemplates.generic.buildGenericText(
            vars.Title || vars.Subject || 'Notification',
            vars.Message || 'You have a new notification from Digital University.'
        )
    })
};

/**
 * Sends an email using a dynamic template from the database or falls back to static templates.
 */
exports.sendDynamicEmail = async function (code, variables, to) {
    try {
        // 1. Fetch template from database
        const template = await EmailTemplateModel.findOne({ code: code }).lean();
        
        let subject, htmlContent, textContent;

        if (!template) {
            console.warn(`[Dynamic Email] Template not found for code: ${code}. Falling back to static template.`);
            
            const handler = fallbackHandlers[code] || fallbackHandlers.default;
            const fallback = handler(variables);
            
            subject = fallback.subject;
            htmlContent = fallback.html;
            textContent = fallback.text;
        } else {
            // Helper to get translated value or fallback
            const getLangVal = (arr, preferredLang) => {
                if (!Array.isArray(arr)) return arr || '';
                const found = arr.find(item => item.key === preferredLang);
                if (found) return found.value;
                const fallback = arr.find(item => item.key === 'en') || arr[0];
                return fallback ? fallback.value : '';
            };

            const lang = (variables && variables.lang) || 'en';
            const rawSubject = getLangVal(template.subject, lang);
            const rawContent = getLangVal(template.content, lang);

            // 2. Process Dynamic Template
            subject = processor.processTemplate(rawSubject, variables);
            htmlContent = processor.processWithLayout(rawContent, variables, baseLayout.wrapInLayout, {
                title: subject
            });
            
            textContent = processor.processTemplate(rawContent, variables)
                .replace(/<[^>]*>?/gm, '') // Strip HTML tags
                .replace(/&nbsp;/g, ' ')
                .trim();
        }

        // 3. Send via existing mailer
        return await mailer.sendMail(to, subject, textContent, htmlContent);

    } catch (error) {
        console.error(`[Dynamic Email] Failed to send email [${code}] to [${to}]:`, error);
        throw error;
    }
};
