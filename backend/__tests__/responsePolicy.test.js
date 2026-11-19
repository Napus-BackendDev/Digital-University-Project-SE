const jwt = require('jsonwebtoken');
const mongo = require('mongodb');
const {
    getScheduleStatus,
    isFormOpenForSubmission,
    isLoginRequiredByForm,
    normalizeAllowedEmails,
    isUserAllowedByIndividualAccess,
    normalizeMaxResponses,
    resolveRequestIdentity,
    validateResponseMutation
} = require('../server/Project/Response/utils/responsePolicy');

describe('responsePolicy pure unit logic', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('getScheduleStatus & isFormOpenForSubmission', () => {
        const now = new Date('2026-11-11T12:00:00Z');

        test('returns draft when neither startAt nor endAt is set', () => {
            expect(getScheduleStatus({}, now)).toBe('draft');
            expect(isFormOpenForSubmission({}, now)).toBe(false);
        });

        test('returns closed_forever when startAt is missing and endAt exists', () => {
            const sched = { startAt: null, endAt: '2026-12-01T00:00:00Z' };
            expect(getScheduleStatus(sched, now)).toBe('closed_forever');
            expect(isFormOpenForSubmission(sched, now)).toBe(false);
        });

        test('returns scheduled when now is before startAt', () => {
            const sched = { startAt: '2026-11-12T00:00:00Z', endAt: '2026-12-01T00:00:00Z' };
            expect(getScheduleStatus(sched, now)).toBe('scheduled');
            expect(isFormOpenForSubmission(sched, now)).toBe(false);
        });

        test('returns open_forever when startAt passed and endAt is empty', () => {
            const sched = { startAt: '2026-11-01T00:00:00Z', endAt: null };
            expect(getScheduleStatus(sched, now)).toBe('open_forever');
            expect(isFormOpenForSubmission(sched, now)).toBe(true);
        });

        test('returns open when now is inside [startAt, endAt]', () => {
            const sched = { startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-20T00:00:00Z' };
            expect(getScheduleStatus(sched, now)).toBe('open');
            expect(isFormOpenForSubmission(sched, now)).toBe(true);
        });

        test('returns closed when now is past endAt', () => {
            const sched = { startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-10T00:00:00Z' };
            expect(getScheduleStatus(sched, now)).toBe('closed');
            expect(isFormOpenForSubmission(sched, now)).toBe(false);
        });

        test('keeps schedule strictly draft whenever isPublished is false regardless of dates', () => {
            const draftWithActiveDates = {
                isPublished: false,
                mode: 'range',
                startAt: '2026-11-01T00:00:00Z',
                endAt: '2026-12-31T00:00:00Z'
            };
            expect(getScheduleStatus(draftWithActiveDates, now)).toBe('draft');
            expect(isFormOpenForSubmission(draftWithActiveDates, now)).toBe(false);
            expect(validateResponseMutation({
                form: { schedule: draftWithActiveDates, settings: {} },
                now
            }).reason).toBe('FORM_DRAFT');
        });

        test('validates 4 schedule modes and blocks past end dates before publishing', () => {
            const {
                validateScheduleForPublish,
                buildPublishedSchedule
            } = require('../server/Project/Response/utils/responsePolicy');

            // 1. Always open: auto-stamps startAt at publish time, no endAt
            const alwaysRes = buildPublishedSchedule({ isPublished: false, mode: 'always' }, now);
            expect(alwaysRes.valid).toBe(true);
            expect(alwaysRes.schedule).toEqual({
                isPublished: true,
                mode: 'always',
                startAt: now.toISOString(),
                endAt: null
            });

            // 3. End Date Only: auto-stamps startAt at publish time; rejects past endAt
            expect(validateScheduleForPublish({ mode: 'end_only', endAt: null }, now).reason).toBe('END_REQUIRED');
            expect(validateScheduleForPublish({ mode: 'end_only', endAt: '2026-11-01T00:00:00Z' }, now).reason).toBe('END_IN_PAST');
            const endOnlyRes = buildPublishedSchedule({ isPublished: false, mode: 'end_only', endAt: '2026-12-01T00:00:00Z' }, now);
            expect(endOnlyRes.valid).toBe(true);
            expect(endOnlyRes.schedule.startAt).toBe(now.toISOString());
            expect(endOnlyRes.schedule.endAt).toBe('2026-12-01T00:00:00.000Z');
            expect(getScheduleStatus(endOnlyRes.schedule, now)).toBe('open');

            // 2. Date range: requires both dates, rejects past endAt and reversed order
            expect(validateScheduleForPublish({ mode: 'range', startAt: '2026-11-12T00:00:00Z', endAt: null }, now).reason).toBe('RANGE_DATES_REQUIRED');
            expect(validateScheduleForPublish({ mode: 'range', startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-10T00:00:00Z' }, now).reason).toBe('END_IN_PAST');
            expect(validateScheduleForPublish({ mode: 'range', startAt: '2026-12-05T00:00:00Z', endAt: '2026-12-01T00:00:00Z' }, now).reason).toBe('END_BEFORE_START');

            // 4. Scheduled in advance: requires future startAt
            expect(validateScheduleForPublish({ mode: 'scheduled', startAt: '2026-11-10T00:00:00Z' }, now).reason).toBe('START_MUST_BE_FUTURE');
            const schedRes = buildPublishedSchedule({ isPublished: false, mode: 'scheduled', startAt: '2026-11-20T00:00:00Z' }, now);
            expect(schedRes.valid).toBe(true);
            expect(getScheduleStatus(schedRes.schedule, now)).toBe('scheduled');
        });
    });

    describe('isLoginRequiredByForm', () => {
        test('requires login for collectEmail, requireLogin, allowedUser, allowedEmails, or allowedRoles', () => {
            expect(isLoginRequiredByForm({ settings: { collectEmail: true, requireLogin: false } })).toBe(true);
            expect(isLoginRequiredByForm({ settings: { collectEmail: false, requireLogin: false } })).toBe(false);
            expect(isLoginRequiredByForm({ settings: { requireLogin: true } })).toBe(true);
            expect(isLoginRequiredByForm({ settings: { allowedUser: ['u1'] } })).toBe(true);
            expect(isLoginRequiredByForm({ settings: { allowedEmails: ['parent@gmail.com'] } })).toBe(true);
            expect(isLoginRequiredByForm({ settings: { allowedRoles: ['r1'] } })).toBe(true);
            expect(isLoginRequiredByForm({ settings: {} })).toBe(false);
        });

        test('normalizes allowedEmails and enforces case-insensitive email matching', () => {
            expect(normalizeAllowedEmails([' Parent@Gmail.com ', 'invalid', 'parent@gmail.com', 'ALUMNI@yahoo.com']))
                .toEqual(['parent@gmail.com', 'alumni@yahoo.com']);

            const settings = { allowedEmails: ['parent@gmail.com'] };
            expect(isUserAllowedByIndividualAccess(settings, 'u-external', 'Parent@Gmail.com')).toBe(true);
            expect(isUserAllowedByIndividualAccess(settings, 'u-other', 'stranger@gmail.com')).toBe(false);
        });
    });

    describe('normalizeMaxResponses', () => {
        test('returns positive integer or null for blank/zero/negative values', () => {
            expect(normalizeMaxResponses(null)).toBeNull();
            expect(normalizeMaxResponses('')).toBeNull();
            expect(normalizeMaxResponses(0)).toBeNull();
            expect(normalizeMaxResponses(-3)).toBeNull();
            expect(normalizeMaxResponses('abc')).toBeNull();
            expect(normalizeMaxResponses('15')).toBe(15);
            expect(normalizeMaxResponses(8.7)).toBe(8);
        });
    });

    describe('resolveRequestIdentity', () => {
        const uid = String(new mongo.ObjectId());

        test('production mode ignores spoofed body.responder without JWT', () => {
            process.env.APP_ENV = 'production';
            process.env.JWT_SECRET = 'test-secret-key';

            const identity = resolveRequestIdentity({
                request: { cookies: {}, headers: {} },
                body: { responder: uid, guestSessionId: 'guest-1' }
            });

            expect(identity).toEqual({
                userId: null,
                source: 'guest',
                guestSessionId: 'guest-1'
            });
        });

        test('production mode verifies JWT cookie cleanly', () => {
            process.env.APP_ENV = 'production';
            process.env.JWT_SECRET = 'test-secret-key';
            const token = jwt.sign({ userId: uid }, process.env.JWT_SECRET);

            const identity = resolveRequestIdentity({
                request: { cookies: { token }, headers: {} },
                body: { responder: 'null' }
            });

            expect(identity).toEqual({
                userId: uid,
                source: 'jwt',
                guestSessionId: null
            });
        });

        test('developer mode accepts valid ObjectId responder when no JWT cookie present', () => {
            process.env.APP_ENV = 'developer';
            const identity = resolveRequestIdentity({
                request: { cookies: {}, headers: {} },
                body: { responder: uid }
            });

            expect(identity.userId).toBe(uid);
            expect(identity.source).toBe('developer-body');
        });
    });

    describe('validateResponseMutation', () => {
        const now = new Date('2026-11-11T12:00:00Z');
        const userId = String(new mongo.ObjectId());
        const otherUserId = String(new mongo.ObjectId());
        const studentRoleId = String(new mongo.ObjectId());
        const openSchedule = { startAt: '2026-11-01T00:00:00Z', endAt: '2026-12-01T00:00:00Z' };

        test('rejects draft, scheduled, and closed forms', () => {
            expect(validateResponseMutation({ form: { schedule: {}, settings: {} }, now }).reason).toBe('FORM_DRAFT');
            expect(validateResponseMutation({
                form: { schedule: { startAt: '2026-11-12T00:00:00Z' }, settings: {} },
                now
            }).reason).toBe('FORM_SCHEDULED');
            expect(validateResponseMutation({
                form: { schedule: { startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-10T00:00:00Z' }, settings: {} },
                now
            }).reason).toBe('FORM_CLOSED');
        });

        test('enforces login, allowedUser, and allowedRoles with admin bypass', () => {
            const form = {
                schedule: openSchedule,
                settings: { requireLogin: true, allowedUser: [userId], allowedRoles: [studentRoleId] }
            };

            expect(validateResponseMutation({ form, identity: {}, userDoc: null, now }).reason).toBe('LOGIN_REQUIRED');

            // Under union rule: non-individual user falls back to org/role check (orphan role without selected org -> ACCESS_DENIED_ORG)
            expect(validateResponseMutation({
                form,
                identity: { userId: otherUserId },
                userDoc: { _id: otherUserId, role: { _id: studentRoleId, title: [{ key: 'en', value: 'Student' }] } },
                now
            }).reason).toBe('ACCESS_DENIED_ORG');

            expect(validateResponseMutation({
                form,
                identity: { userId: otherUserId },
                userDoc: { _id: otherUserId, role: { _id: 'other-role', title: [{ key: 'en', value: 'Admin' }] } },
                now
            }).allowed).toBe(true);

            expect(validateResponseMutation({
                form,
                identity: { userId },
                userDoc: { _id: userId, role: { _id: studentRoleId, title: [{ key: 'en', value: 'Student' }] } },
                now
            }).allowed).toBe(true);
        });

        test('allows org member who is NOT an individual when individuals are also set (Audience Union)', () => {
            const sciOrgId = String(new mongo.ObjectId());
            const itOrgId = String(new mongo.ObjectId());
            const lecturerRoleId = String(new mongo.ObjectId());
            const invitedUserId = String(new mongo.ObjectId());
            const orgMemberId = String(new mongo.ObjectId());
            const outsiderId = String(new mongo.ObjectId());

            const unionForm = {
                schedule: openSchedule,
                organization: [sciOrgId],
                settings: {
                    accessMode: 'private',
                    allowedRoles: [studentRoleId],
                    allowedUser: [invitedUserId],
                    allowedEmails: ['guest.vip@gmail.com']
                }
            };

            // 1. Org member matching selected org + role (but NOT in allowedUser / allowedEmails) is allowed
            expect(validateResponseMutation({
                form: unionForm,
                identity: { userId: orgMemberId },
                userDoc: {
                    _id: orgMemberId,
                    email: 'student.sci@lamduan.mfu.ac.th',
                    organization: sciOrgId,
                    role: { _id: studentRoleId, title: [{ key: 'en', value: 'Student' }] }
                },
                now
            }).allowed).toBe(true);

            // 2. Individual in allowedUser from a different org/role is also allowed
            expect(validateResponseMutation({
                form: unionForm,
                identity: { userId: invitedUserId },
                userDoc: {
                    _id: invitedUserId,
                    email: 'invited@mfu.ac.th',
                    organization: itOrgId,
                    role: { _id: lecturerRoleId, title: [{ key: 'en', value: 'Lecturer' }] }
                },
                now
            }).allowed).toBe(true);

            // 3. Individual in allowedEmails (external email) is also allowed
            expect(validateResponseMutation({
                form: unionForm,
                identity: { userId: outsiderId },
                userDoc: {
                    _id: outsiderId,
                    email: 'Guest.VIP@gmail.com',
                    organization: null,
                    role: null
                },
                now
            }).allowed).toBe(true);

            // 4. User who is neither an allowed individual nor in the target org/role is denied
            expect(validateResponseMutation({
                form: unionForm,
                identity: { userId: outsiderId },
                userDoc: {
                    _id: outsiderId,
                    email: 'stranger@lamduan.mfu.ac.th',
                    organization: itOrgId,
                    role: { _id: studentRoleId, title: [{ key: 'en', value: 'Student' }] }
                },
                now
            }).reason).toBe('ACCESS_DENIED_ORG');
        });

        test('enforces collectEmail login and external allowedEmails respondent access', () => {
            const externalUserId = String(new mongo.ObjectId());
            const collectEmailForm = {
                schedule: openSchedule,
                settings: { collectEmail: true, requireLogin: false }
            };

            expect(validateResponseMutation({ form: collectEmailForm, identity: { guestSessionId: 'guest-1' }, now }).reason)
                .toBe('LOGIN_REQUIRED');
            expect(validateResponseMutation({
                form: collectEmailForm,
                identity: { userId: externalUserId },
                userDoc: { _id: externalUserId, email: 'external.parent@gmail.com' },
                now
            }).allowed).toBe(true);

            const emailRestrictedForm = {
                schedule: openSchedule,
                settings: { allowedEmails: ['Parent@Gmail.com'] }
            };
            expect(validateResponseMutation({
                form: emailRestrictedForm,
                identity: { userId: externalUserId },
                userDoc: { _id: externalUserId, email: 'parent@gmail.com' },
                now
            }).allowed).toBe(true);

            expect(validateResponseMutation({
                form: emailRestrictedForm,
                identity: { userId: otherUserId },
                userDoc: { _id: otherUserId, email: 'other@lamduan.mfu.ac.th' },
                now
            }).reason).toBe('ACCESS_DENIED_USER');
        });

        test('binds allowedRoles strictly under selected organizations and denies standalone roles without an organization', () => {
            const sciOrgId = String(new mongo.ObjectId());
            const itOrgId = String(new mongo.ObjectId());
            const lecturerRoleId = String(new mongo.ObjectId());
            const generalOrgId = '6a0b51af2dbf6e77c4df73fe';

            const sciStudentForm = {
                schedule: openSchedule,
                organization: [sciOrgId],
                settings: { requireLogin: true, allowedRoles: [studentRoleId] }
            };

            // Student in Science org -> allowed
            expect(validateResponseMutation({
                form: sciStudentForm,
                identity: { userId },
                userDoc: { _id: userId, organization: sciOrgId, role: { _id: studentRoleId, title: [{ key: 'en', value: 'Student' }] } },
                now
            }).allowed).toBe(true);

            // Student in IT org -> denied (even though role matches Student, org does NOT match Science)
            expect(validateResponseMutation({
                form: sciStudentForm,
                identity: { userId: otherUserId },
                userDoc: { _id: otherUserId, organization: itOrgId, role: { _id: studentRoleId, title: [{ key: 'en', value: 'Student' }] } },
                now
            }).reason).toBe('ACCESS_DENIED_ORG');

            // Lecturer in Science org -> denied (org matches Science, role does NOT match Student)
            expect(validateResponseMutation({
                form: sciStudentForm,
                identity: { userId: otherUserId },
                userDoc: { _id: otherUserId, organization: sciOrgId, role: { _id: lecturerRoleId, title: [{ key: 'en', value: 'Lecturer' }] } },
                now
            }).reason).toBe('ACCESS_DENIED_ROLE');

            // General org + role restriction -> Student allowed across orgs, Lecturer denied
            const generalStudentForm = {
                schedule: openSchedule,
                organization: [generalOrgId],
                settings: { requireLogin: true, allowedRoles: [studentRoleId] }
            };
            expect(validateResponseMutation({
                form: generalStudentForm,
                identity: { userId },
                userDoc: { _id: userId, organization: itOrgId, role: { _id: studentRoleId } },
                now
            }).allowed).toBe(true);
            expect(validateResponseMutation({
                form: generalStudentForm,
                identity: { userId: otherUserId },
                userDoc: { _id: otherUserId, organization: itOrgId, role: { _id: lecturerRoleId } },
                now
            }).reason).toBe('ACCESS_DENIED_ROLE');

            // Role set without any selected organization -> denied (roles cannot work standalone outside Organization)
            const orphanRoleForm = {
                schedule: openSchedule,
                organization: [],
                settings: { requireLogin: true, allowedRoles: [studentRoleId] }
            };
            expect(validateResponseMutation({
                form: orphanRoleForm,
                identity: { userId },
                userDoc: { _id: userId, organization: sciOrgId, role: { _id: studentRoleId } },
                now
            }).reason).toBe('ACCESS_DENIED_ORG');
        });

        test('enforces limitResponse and guestSessionId for public guest forms', () => {
            const form = {
                schedule: openSchedule,
                settings: { requireLogin: false, limitResponse: true }
            };

            expect(validateResponseMutation({
                form,
                identity: { userId: null, guestSessionId: null },
                now
            }).reason).toBe('GUEST_SESSION_REQUIRED');

            expect(validateResponseMutation({
                form,
                identity: { userId: null, guestSessionId: 'guest-abc' },
                alreadySubmittedResponse: { _id: 'resp-1', submit: true },
                now
            }).reason).toBe('LIMIT_RESPONSE_REACHED');
        });

        test('enforces allowEditAfterSubmit and ownership on existing submitted responses', () => {
            const existing = { _id: 'resp-1', responder: userId, submit: true };

            const deniedOther = validateResponseMutation({
                form: { schedule: openSchedule, settings: { allowEditAfterSubmit: true } },
                identity: { userId: otherUserId },
                userDoc: { _id: otherUserId, role: { title: [{ key: 'en', value: 'Student' }] } },
                existingResponse: existing,
                now
            });
            expect(deniedOther.reason).toBe('RESPONSE_OWNERSHIP_DENIED');

            const deniedEditOff = validateResponseMutation({
                form: { schedule: openSchedule, settings: { allowEditAfterSubmit: false } },
                identity: { userId },
                existingResponse: existing,
                now
            });
            expect(deniedEditOff.reason).toBe('EDIT_NOT_ALLOWED');

            const allowedEditWhenQuotaAndLimitReached = validateResponseMutation({
                form: {
                    schedule: openSchedule,
                    settings: { limitResponse: true, allowEditAfterSubmit: true, maxResponses: 5 }
                },
                identity: { userId },
                existingResponse: existing,
                alreadySubmittedResponse: existing,
                submittedCount: 5,
                isSubmitting: true,
                now
            });
            expect(allowedEditWhenQuotaAndLimitReached).toEqual({ allowed: true, mode: 'edit_submitted' });
        });

        test('enforces maxResponses quota on new final submissions while allowing drafts', () => {
            const form = {
                schedule: openSchedule,
                settings: { maxResponses: 3 }
            };

            expect(validateResponseMutation({
                form,
                identity: { userId: null, guestSessionId: 'guest-new' },
                submittedCount: 3,
                isSubmitting: true,
                now
            }).reason).toBe('QUOTA_REACHED');

            expect(validateResponseMutation({
                form,
                identity: { userId: null, guestSessionId: 'guest-new' },
                submittedCount: 3,
                isSubmitting: false,
                now
            }).allowed).toBe(true);
        });

        test('separates Private (MFU institutional email + locked email) from Public (anonymous vs all-email login, preserved fields ignored)', () => {
            const sciOrgId = String(new mongo.ObjectId());
            const externalUserId = String(new mongo.ObjectId());

            // 1. Private mode enforces institutional MFU domain (@lamduan.mfu.ac.th / @mfu.ac.th) for org-scoped forms
            const privateOrgForm = {
                schedule: openSchedule,
                organization: [sciOrgId],
                settings: { accessMode: 'private', collectEmail: true, requireLogin: false }
            };
            expect(isLoginRequiredByForm(privateOrgForm)).toBe(true);
            expect(validateResponseMutation({
                form: privateOrgForm,
                identity: { userId: externalUserId },
                userDoc: { _id: externalUserId, email: 'external@gmail.com', organization: sciOrgId },
                now
            }).reason).toBe('ACCESS_DENIED_MFU_DOMAIN');

            expect(validateResponseMutation({
                form: privateOrgForm,
                identity: { userId },
                userDoc: { _id: userId, email: 'student@lamduan.mfu.ac.th', organization: sciOrgId },
                now
            }).allowed).toBe(true);

            // 2. Switching to Public with preserved Private restrictions ignores org/roles/users/emails
            const publicAnonymousWithPreserved = {
                schedule: openSchedule,
                organization: [sciOrgId],
                settings: {
                    accessMode: 'public',
                    collectEmail: false,
                    requireLogin: false,
                    allowedRoles: [studentRoleId],
                    allowedUser: [userId],
                    allowedEmails: ['only@lamduan.mfu.ac.th']
                }
            };
            expect(isLoginRequiredByForm(publicAnonymousWithPreserved)).toBe(false);
            expect(validateResponseMutation({
                form: publicAnonymousWithPreserved,
                identity: { userId: null, guestSessionId: 'guest-public-1' },
                now
            }).allowed).toBe(true);

            // 3. Public + requireLogin=true (consolidated single control) requires sign-in, collects any email (Gmail / MFU / Lamduan), and ignores preserved Private fields
            const publicRequireLoginWithPreserved = {
                ...publicAnonymousWithPreserved,
                settings: {
                    ...publicAnonymousWithPreserved.settings,
                    requireLogin: true,
                    collectEmail: true
                }
            };
            expect(isLoginRequiredByForm(publicRequireLoginWithPreserved)).toBe(true);
            expect(validateResponseMutation({
                form: publicRequireLoginWithPreserved,
                identity: { userId: null, guestSessionId: 'guest-public-2' },
                now
            }).reason).toBe('LOGIN_REQUIRED');
            expect(validateResponseMutation({
                form: publicRequireLoginWithPreserved,
                identity: { userId: externalUserId },
                userDoc: { _id: externalUserId, email: 'general.public@gmail.com' },
                now
            }).allowed).toBe(true);

            // 4. Consolidated Public requireLogin=false allows anonymous responses even if stale collectEmail=true existed from Private
            const publicLoginOffAfterPrivate = {
                schedule: openSchedule,
                organization: [sciOrgId],
                settings: { accessMode: 'public', collectEmail: true, requireLogin: false }
            };
            expect(isLoginRequiredByForm(publicLoginOffAfterPrivate)).toBe(false);
            expect(validateResponseMutation({
                form: publicLoginOffAfterPrivate,
                identity: { userId: null, guestSessionId: 'guest-public-3' },
                now
            }).allowed).toBe(true);
        });
    });
});

describe('Read scope & collaborator access policy', () => {
    const jwt = require('jsonwebtoken');
    const mongo = require('mongodb');
    const policy = require('../server/Project/Response/utils/responsePolicy');
    const savedEnv = process.env;

    beforeEach(() => {
        process.env = { ...savedEnv };
    });

    afterAll(() => {
        process.env = savedEnv;
    });

    test('getCollaboratorAccessRole distinguishes creator, editor, viewer, and unrelated users', () => {
        const creatorId = String(new mongo.ObjectId());
        const editorId = String(new mongo.ObjectId());
        const viewerId = String(new mongo.ObjectId());
        const strangerId = String(new mongo.ObjectId());

        const form = {
            creator: { _id: creatorId },
            collaborator: [
                { user: { _id: editorId }, type: { title: [{ key: 'en', value: 'Editor' }] } },
                { user: viewerId, type: { title: [{ key: 'en', value: 'Viewer' }] } }
            ]
        };

        expect(policy.getCollaboratorAccessRole(form, creatorId)).toBe('creator');
        expect(policy.getCollaboratorAccessRole(form, editorId)).toBe('editor');
        expect(policy.getCollaboratorAccessRole(form, viewerId)).toBe('viewer');
        expect(policy.getCollaboratorAccessRole(form, strangerId)).toBeNull();

        expect(policy.canUserManageOrViewForm(form, { _id: creatorId, role: { title: 'Student' } })).toBe(true);
        expect(policy.canUserManageOrViewForm(form, { _id: viewerId, role: { title: 'Student' } })).toBe(true);
        expect(policy.canUserManageOrViewForm(form, { _id: strangerId, role: { title: 'Student' } })).toBe(false);
        expect(policy.canUserManageOrViewForm(form, {
            _id: strangerId,
            role: { title: [{ key: 'en', value: 'Admin' }] }
        })).toBe(true);
    });

    test('resolveReadScopeUserId enforces verified JWT in production and allows dev fallback in developer env', () => {
        const jwtUser = String(new mongo.ObjectId());
        const spoofedUser = String(new mongo.ObjectId());
        process.env.APP_ENV = 'production';
        process.env.JWT_SECRET = 'prod-scope-secret';

        const token = jwt.sign({ userId: jwtUser }, process.env.JWT_SECRET);
        expect(policy.resolveReadScopeUserId({
            request: { cookies: { token } },
            fallbackId: spoofedUser
        })).toEqual({ userId: jwtUser, source: 'jwt', jwtUserId: jwtUser });

        expect(policy.resolveReadScopeUserId({
            request: { cookies: {} },
            fallbackId: spoofedUser
        })).toEqual({ userId: null, source: 'unauthenticated', jwtUserId: null });

        process.env.APP_ENV = 'developer';
        expect(policy.resolveReadScopeUserId({
            request: { cookies: { token } },
            fallbackId: spoofedUser
        })).toEqual({ userId: spoofedUser, source: 'developer-override', jwtUserId: jwtUser });
    });

    test('getJwtSecret shares one ephemeral secret in developer mode and throws when unset in production', () => {
        delete process.env.JWT_SECRET;
        process.env.APP_ENV = 'developer';
        const s1 = policy.getJwtSecret();
        const s2 = policy.getJwtSecret();
        expect(typeof s1).toBe('string');
        expect(s1.length).toBeGreaterThanOrEqual(32);
        expect(s1).toBe(s2);

        process.env.APP_ENV = 'production';
        expect(() => policy.getJwtSecret()).toThrow(/JWT_SECRET/);
    });
});
