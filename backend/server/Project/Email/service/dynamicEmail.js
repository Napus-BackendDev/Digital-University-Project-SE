'use strict';

const EmailTemplateModel = require('../../Settings/models/emailTemplate.model');
const mailer = require('../../../../helpers/google/Mail');
const processor = require('../../../../helpers/TemplateProcessor');

// Fallback Static Templates
const submissionStatic = require('../templates/submissionConfirmation');
const collaborationStatic = require('../templates/invitationCollaboration');
const organizationStatic = require('../templates/invitationOrganization');

/**
 * Sends an email using a dynamic template from the database.
 * 
 * @param {string} code - The unique code of the template (e.g., 'submissionConfirmation')
 * @param {object} variables - Key-value pairs for template replacement
 * @param {string} to - Recipient email address
 * @returns {Promise<object>} - Result of the mailer.sendMail call
 */
exports.sendDynamicEmail = async function (code, variables, to) {
    try {
        // 1. Fetch template from database
        const template = await EmailTemplateModel.findOne({ code: code }).lean();
        
        if (!template) {
            console.warn(`[Dynamic Email] Template not found for code: ${code}. Falling back to static template.`);
            
            let subject, htmlContent, textContent;

            if (code === 'submissionConfirmation') {
                subject = `Submission Confirmation: ${variables.FormName || 'Form'}`;
                htmlContent = submissionStatic.buildSubmissionConfirmationHtml({
                    name: variables.Responder,
                    formTitle: variables.FormName,
                    submittedAt: variables.SubmittedAt,
                    referenceNo: variables.ReferenceNo
                });
                textContent = submissionStatic.buildSubmissionConfirmationText({
                    name: variables.Responder,
                    formTitle: variables.FormName,
                    submittedAt: variables.SubmittedAt,
                    referenceNo: variables.ReferenceNo
                });
            } else if (code === 'invitationCollaboration') {
                subject = `Invitation: ${variables.FormTitle || 'Form'}`;
                htmlContent = collaborationStatic.buildInvitationCollaborationHtml({
                    inviterName: variables.InviterName,
                    collaboratorName: variables.CollaboratorName,
                    formTitle: variables.FormTitle,
                    permission: variables.Permission,
                    invitationLink: variables.InvitationLink
                });
                textContent = collaborationStatic.buildInvitationCollaborationText({
                    inviterName: variables.InviterName,
                    collaboratorName: variables.CollaboratorName,
                    formTitle: variables.FormTitle,
                    permission: variables.Permission,
                    invitationLink: variables.InvitationLink
                });
            } else if (code === 'invitationOrganization') {
                subject = `New Form Invitation: ${variables.FormTitle || 'Form'} (${variables.OrganizationName || 'Org'})`;
                htmlContent = organizationStatic.buildOrganizationInvitationHtml({
                    organizationName: variables.OrganizationName,
                    responderName: variables.ResponderName,
                    formTitle: variables.FormTitle,
                    invitationLink: variables.InvitationLink
                });
                textContent = organizationStatic.buildOrganizationInvitationText({
                    organizationName: variables.OrganizationName,
                    responderName: variables.ResponderName,
                    formTitle: variables.FormTitle,
                    invitationLink: variables.InvitationLink
                });
            } else {
                return { success: false, error: 'Template not found and no fallback available' };
            }

            return await mailer.sendMail(to, subject, textContent, htmlContent);
        }

        // 2. Process Subject and Content
        const subject = processor.processTemplate(template.subject, variables);
        const htmlContent = processor.processTemplate(template.content, variables);
        
        // Create a simple text version by stripping tags if needed, or just use variables
        // For now, we'll send the processed HTML
        const textContent = `Please view this email in an HTML-compatible client.`;

        // 3. Send via existing mailer
        return await mailer.sendMail(to, subject, textContent, htmlContent);

    } catch (error) {
        console.error(`[Dynamic Email] Failed to send email [${code}] to [${to}]:`, error);
        throw error;
    }
};
