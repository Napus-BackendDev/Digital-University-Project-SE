'use strict';

const FormModel = require("../../Form/models/form.model");
const UserModel = require("../../User/models/user.model");
const OrganizationModel = require("../../Organizations/models/organization.model");
const mailer = require("../../../../helpers/google/Mail");
const {
  buildOrganizationInvitationHtml,
  buildOrganizationInvitationText,
} = require("../templates/invitationOrganization");

// Helper to extract title from localized array
const getFormTitle = (form) => {
    if (!form || !form.title || !Array.isArray(form.title) || form.title.length === 0) return 'Untitled Form';
    const enTitle = form.title.find(t => t.key === 'en');
    const thTitle = form.title.find(t => t.key === 'th');
    return enTitle ? enTitle.value : (thTitle ? thTitle.value : form.title[0].value);
};

const getOrganizationName = (org) => {
    if (!org || !org.title || !Array.isArray(org.title) || org.title.length === 0) return 'Your Organization';
    const enTitle = org.title.find(t => t.key === 'en');
    const thTitle = org.title.find(t => t.key === 'th');
    return enTitle ? enTitle.value : (thTitle ? thTitle.value : org.title[0].value);
};

/**
 * Sends invitations to all users in a specific organization.
 */
const sendInvitationToOrganizationUsers = async ({
  orgId,
  formTitle,
  formId,
}) => {
  try {
    const org = await OrganizationModel.findById(orgId).lean();
    if (!org) return;

    const organizationName = getOrganizationName(org);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const invitationLink = `${baseUrl}/forms/${formId}`;

    const users = await UserModel.find({ organization: orgId }).select('name email').lean();
    if (users.length === 0) return;

    console.log(`[Org Email] Sending ${users.length} invitations for organization: ${organizationName}`);

    const invitationTasks = users.map(user => {
        if (!user.email) return Promise.resolve();

        const params = {
          organizationName,
          responderName: user.name || 'Member',
          formTitle,
          invitationLink,
        };

        const subject = `New Form Invitation: ${formTitle} (${organizationName})`;
        const textContent = buildOrganizationInvitationText(params);
        const htmlContent = buildOrganizationInvitationHtml(params);

        return mailer.sendMail(user.email, subject, textContent, htmlContent);
    });

    await Promise.all(invitationTasks);
  } catch (err) {
    console.error('[Org Email] Error while sending organization invites:', err.message);
  }
};

/**
 * Analyzes organization changes and sends invites to users in NEWLY added organizations.
 * RESTRICTION: Only sends if the form status is "Open/Active" and within schedule.
 */
exports.maybeSendOrganizationInvites = async ({
  previousDoc = null,
  currentDoc,
}) => {
  if (!currentDoc?._id) return;

  try {
    // 1. Fetch form details with status and schedule to verify if it's "Active"
    const populated = await FormModel.findById(currentDoc._id)
      .select('title status schedule')
      .populate('status')
      .lean();
    
    if (!populated) return;

    // 2. Check if form is Open/Active
    const now = new Date();
    let isStatusActive = true; 
    
    // If status is set, check if it contains "open" or "active"
    if (populated.status && populated.status.title) {
        const titles = (Array.isArray(populated.status.title) ? populated.status.title : [])
            .map(t => String(t.value || '').toLowerCase());
        isStatusActive = titles.some(t => t.includes('open') || t.includes('active') || t.includes('public') || t.includes('เปิด'));
    }

    // Check Schedule
    const isScheduleActive = !populated.schedule || (
        (!populated.schedule.startAt || now >= new Date(populated.schedule.startAt)) &&
        (!populated.schedule.endAt || now <= new Date(populated.schedule.endAt))
    );

    if (!isStatusActive || !isScheduleActive) {
        console.log(`[Org Email] Skipping invites for Form "${populated._id}": Form is not Open/Active.`);
        return;
    }

    // 3. Diffing Logic: Identify newly added organizations
    const nextOrgs = (currentDoc.organization || []).map(id => String(id));
    const prevOrgs = previousDoc ? (previousDoc.organization || []).map(id => String(id)) : [];
    const newOrgs = nextOrgs.filter(id => !prevOrgs.includes(id));

    if (newOrgs.length === 0) return;

    const formTitle = getFormTitle(populated);

    for (const orgId of newOrgs) {
      await sendInvitationToOrganizationUsers({
        orgId,
        formTitle,
        formId: currentDoc._id,
      });
    }

  } catch (err) {
    console.error('[Org Email] Error during org diffing:', err.message);
  }
};

