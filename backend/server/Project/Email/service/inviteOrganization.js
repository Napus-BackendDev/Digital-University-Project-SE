'use strict';

const mongo = require('mongodb');
const FormModel = require('../../Form/models/form.model');
const UserModel = require('../../User/models/user.model');
const OrganizationModel = require('../../Organizations/models/organization.model');
const dynamicEmail = require('../service/dynamicEmail');

const {
  getLocalizedTitle,
  getFormTitle,
  toIdString,
  isValidEmail,
  buildFormLink,
  formatFormScheduleForEmail,
  generateQrCodeDataUri,
  buildQrCodeHtmlBlock,
  resolveFormContactInfo
} = require('./email.utils');
const {
  isSchedulePublished,
  isGeneralOrgEntry,
  resolveFormAccessMode,
  normalizeAllowedEmails
} = require('../../Response/utils/responsePolicy');

function isStatusActiveForInvites(statusDoc) {
  if (!statusDoc || !statusDoc.title) return true;
  const titles = (Array.isArray(statusDoc.title) ? statusDoc.title : [])
    .map(t => String(t && t.value ? t.value : '').toLowerCase());
  if (!titles.length) return true;
  if (titles.some(t => t.includes('closed') || t.includes('inactive') || t.includes('ปิด'))) {
    return false;
  }
  return titles.some(t => t.includes('open') || t.includes('active') || t.includes('public') || t.includes('เปิด'));
}

function isFormEligibleForRespondentInvites(formDoc) {
  if (!formDoc) return false;
  if (resolveFormAccessMode(formDoc) !== 'private') return false;
  if (!isSchedulePublished(formDoc.schedule)) return false;
  if (formDoc.status && typeof formDoc.status === 'object' && formDoc.status.title) {
    return isStatusActiveForInvites(formDoc.status);
  }
  return true;
}

/**
 * Resolves respondent recipients for a Private Published form as the deduplicated UNION of:
 * 1) Individual allow-list (settings.allowedUser + settings.allowedEmails) when configured
 * 2) Non-general Organization members filtered by optional settings.allowedRoles
 * Returns deduplicated list of { email, name, organizationName }.
 */
async function collectEligibleRecipientsForForm(formDoc) {
  if (!isFormEligibleForRespondentInvites(formDoc)) {
    return [];
  }

  const settings = formDoc.settings || {};
  const allowedUserIds = Array.isArray(settings.allowedUser)
    ? settings.allowedUser.map(toIdString).filter(id => mongo.ObjectId.isValid(id))
    : [];
  const allowedEmailList = normalizeAllowedEmails(settings.allowedEmails);
  const hasIndividualAccess = allowedUserIds.length > 0 || allowedEmailList.length > 0;

  const creatorOrgTitle = formDoc.creator && formDoc.creator.organization
    ? getLocalizedTitle(formDoc.creator.organization, 'Mae Fah Luang University')
    : 'Mae Fah Luang University';

  const recipientMap = new Map();
  const addRecipient = (email, name = '', orgName = '') => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(cleanEmail) || recipientMap.has(cleanEmail)) return;
    recipientMap.set(cleanEmail, {
      email: cleanEmail,
      name: String(name || cleanEmail.split('@')[0] || 'Member').trim(),
      organizationName: orgName || creatorOrgTitle
    });
  };

  if (hasIndividualAccess) {
    if (allowedUserIds.length > 0) {
      const userDocs = await UserModel.find({ _id: { $in: allowedUserIds.map(id => new mongo.ObjectId(id)) } })
        .select('name email organization')
        .populate('organization', 'title')
        .lean()
        .catch(() => []);

      userDocs.forEach((u) => {
        const orgTitle = u.organization ? getLocalizedTitle(u.organization, creatorOrgTitle) : creatorOrgTitle;
        addRecipient(u.email, u.name, orgTitle);
      });
    }

    if (allowedEmailList.length > 0) {
      const matchedUsers = await UserModel.find({
        email: { $in: allowedEmailList }
      })
        .select('name email organization')
        .populate('organization', 'title')
        .lean()
        .catch(() => []);

      const matchedByEmail = new Map();
      matchedUsers.forEach((u) => {
        if (u && u.email) matchedByEmail.set(String(u.email).trim().toLowerCase(), u);
      });

      allowedEmailList.forEach((email) => {
        const u = matchedByEmail.get(email);
        const orgTitle = u && u.organization ? getLocalizedTitle(u.organization, creatorOrgTitle) : creatorOrgTitle;
        addRecipient(email, (u && u.name) || '', orgTitle);
      });
    }
  }

  // Organization & Role targeting (excluding "General" sentinel org so we don't spam everyone)
  const rawOrgs = Array.isArray(formDoc.organization) ? formDoc.organization : [];
  const targetOrgIds = rawOrgs
    .filter(org => org && !isGeneralOrgEntry(org))
    .map(toIdString)
    .filter(id => mongo.ObjectId.isValid(id));

  if (targetOrgIds.length === 0) {
    return Array.from(recipientMap.values());
  }

  const targetRoleIds = Array.isArray(settings.allowedRoles)
    ? settings.allowedRoles.map(toIdString).filter(id => mongo.ObjectId.isValid(id))
    : [];

  const userQuery = {
    organization: { $in: targetOrgIds.map(id => new mongo.ObjectId(id)) }
  };
  if (targetRoleIds.length > 0) {
    userQuery.role = { $in: targetRoleIds.map(id => new mongo.ObjectId(id)) };
  }

  const [orgDocs, memberDocs] = await Promise.all([
    OrganizationModel.find({ _id: { $in: targetOrgIds.map(id => new mongo.ObjectId(id)) } })
      .select('title')
      .lean()
      .catch(() => []),
    UserModel.find(userQuery)
      .select('name email organization')
      .lean()
      .catch(() => [])
  ]);

  const orgTitleMap = new Map();
  (orgDocs || []).forEach((org) => {
    orgTitleMap.set(toIdString(org._id), getLocalizedTitle(org, 'Your Organization'));
  });

  (memberDocs || []).forEach((user) => {
    const orgName = orgTitleMap.get(toIdString(user.organization)) || creatorOrgTitle;
    addRecipient(user.email, user.name, orgName);
  });

  return Array.from(recipientMap.values());
}

/**
 * Pure diff helper: calculates which recipients should be invited based on previous & next recipient lists.
 */
function diffNewInviteRecipients(prevRecipients = [], nextRecipients = []) {
  const prevEmails = new Set(
    (Array.isArray(prevRecipients) ? prevRecipients : [])
      .map(r => String(r && r.email ? r.email : r).trim().toLowerCase())
      .filter(Boolean)
  );
  return (Array.isArray(nextRecipients) ? nextRecipients : []).filter((r) => {
    const email = String(r && r.email ? r.email : '').trim().toLowerCase();
    return Boolean(email && !prevEmails.has(email));
  });
}

/**
 * Analyzes Private Published form changes and dispatches Email #3 invitations
 * with respondent form link (/forms/:id?mode=public), schedule open/expiry window,
 * mobile-ready CID QR code, and form contact info.
 */
exports.maybeSendOrganizationInvites = async ({
  previousDoc = null,
  currentDoc,
}) => {
  if (!currentDoc?._id) return;

  try {
    const populated = await FormModel.findById(currentDoc._id)
      .select('title status schedule settings creator organization')
      .populate('status')
      .populate({
        path: 'creator',
        select: 'name email organization',
        populate: { path: 'organization', select: 'title' }
      })
      .populate({ path: 'organization', select: 'title' })
      .lean();

    if (!populated) return;
    if (!isFormEligibleForRespondentInvites(populated)) {
      console.log(`[Org Email] Skipping respondent invites for Form "${populated._id}": requires Published + Private + Active status.`);
      return;
    }

    const nextRecipients = await collectEligibleRecipientsForForm(populated);
    if (nextRecipients.length === 0) return;

    let prevRecipients = [];
    if (previousDoc && isFormEligibleForRespondentInvites(previousDoc)) {
      prevRecipients = await collectEligibleRecipientsForForm(previousDoc);
    }

    const recipientsToInvite = diffNewInviteRecipients(prevRecipients, nextRecipients);
    if (recipientsToInvite.length === 0) return;

    const formId = populated._id;
    const formTitle = getFormTitle(populated);
    const ownerId = populated.creator ? toIdString(populated.creator) : null;
    const invitationLink = buildFormLink(formId, 'fill');
    const { openDate, closeDate, schedulePeriod } = formatFormScheduleForEmail(populated.schedule);
    const qrDataUri = await generateQrCodeDataUri(invitationLink);
    const qrCodeHtml = buildQrCodeHtmlBlock(qrDataUri, invitationLink);
    const { contactOrganization, contactEmail } = resolveFormContactInfo(populated);

    console.log(`[Org Email] Dispatching ${recipientsToInvite.length} respondent invitation(s) for Form "${formTitle}"`);

    const tasks = recipientsToInvite.map((recipient) => {
      const variables = {
        UserName: recipient.name,
        ResponderName: recipient.name,
        FormName: formTitle,
        FormTitle: formTitle,
        FormURL: invitationLink,
        InvitationLink: invitationLink,
        Organization: recipient.organizationName || contactOrganization,
        OrganizationName: recipient.organizationName || contactOrganization,
        SchedulePeriod: schedulePeriod,
        OpenDate: openDate,
        CloseDate: closeDate,
        QRCode: qrCodeHtml,
        ContactOrganization: contactOrganization,
        ContactEmail: contactEmail,
      };

      return dynamicEmail.sendDynamicEmail(
        'invitationOrganization',
        variables,
        recipient.email,
        {
          ...(ownerId ? { ownerId } : {}),
          ...(contactOrganization ? { contactOrganization } : {}),
          ...(contactEmail ? { contactEmail, replyTo: contactEmail } : {}),
        }
      );
    });

    await Promise.all(tasks);
  } catch (err) {
    console.error('[Org Email] Error during respondent invite dispatch:', err.message);
  }
};

exports._testables = {
  isStatusActiveForInvites,
  isFormEligibleForRespondentInvites,
  collectEligibleRecipientsForForm,
  diffNewInviteRecipients
};
