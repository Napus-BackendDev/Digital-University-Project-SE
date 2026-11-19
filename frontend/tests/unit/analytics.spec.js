import moment from 'moment';
import {
    GENERAL_ORG_ID,
    isUserAdmin,
    getUserFormAccessRole,
    canUserViewFormAnalytics,
    filterFormsByUserAccess,
    isSubmittedResponse,
    getRangeStart,
    isInTimeRange,
    getFilteredResponses,
    getFormStatusKey,
    getTableStatusLabel,
    getFormResponsesFromPool,
    getFormTargetUsers,
    getFormRatingSummary,
    getFormMetrics,
    filterForms,
    buildTrendSeries,
    buildOrgAndRoleBreakdown,
    buildAnalyticsDashboard,
    buildAnalyticsExportRows,
    buildCompactAccessSummary
} from '@/projects/utils/analytics';

describe('analytics.js utilities', () => {
    const now = moment('2026-11-12T10:00:00.000Z');

    const organizations = [
        {
            _id: 'org_sci',
            title: [
                { key: 'en', value: 'School of Science' },
                { key: 'th', value: 'สำนักวิชาวิทยาศาสตร์' }
            ]
        },
        {
            _id: 'org_it',
            title: [
                { key: 'en', value: 'School of IT' },
                { key: 'th', value: 'สำนักวิชาเทคโนโลยีสารสนเทศ' }
            ]
        },
        {
            _id: GENERAL_ORG_ID,
            title: [
                { key: 'en', value: 'General' },
                { key: 'th', value: 'ทั่วไป' }
            ]
        }
    ];

    const roles = [
        {
            _id: 'role_student',
            title: [
                { key: 'en', value: 'Student' },
                { key: 'th', value: 'นักศึกษา' }
            ]
        },
        {
            _id: 'role_staff',
            title: [
                { key: 'en', value: 'Staff' },
                { key: 'th', value: 'บุคลากร' }
            ]
        }
    ];

    const users = [
        { _id: 'u1', email: 'u1@mfu.ac.th', organization: 'org_sci', role: 'role_student' },
        { _id: 'u2', email: 'u2@mfu.ac.th', organization: 'org_sci', role: 'role_student' },
        { _id: 'u3', email: 'u3@mfu.ac.th', organization: 'org_sci', role: 'role_staff' },
        { _id: 'u4', email: 'u4@mfu.ac.th', organization: 'org_it', role: 'role_student' }
    ];

    const sciForm = {
        _id: 'form_sci',
        title: [
            { key: 'en', value: 'Science Satisfaction Survey' },
            { key: 'th', value: 'แบบประเมินความพึงพอใจวิทยาศาสตร์' }
        ],
        organization: ['org_sci'],
        settings: {
            allowedRoles: ['role_student'],
            allowedUser: []
        },
        schedule: {
            startAt: '2026-11-01T00:00:00.000Z',
            endAt: '2026-11-13T12:00:00.000Z' // within 7 days => isClosingSoon
        },
        questions: [
            { _id: 'q1', type: { type: 'short_answer' }, title: [{ key: 'en', value: 'Comment' }] },
            { _id: 'q2', type: { type: 'rating' }, title: [{ key: 'en', value: 'Overall Rating' }] }
        ],
        responses: [
            {
                _id: 'r1',
                form: 'form_sci',
                responder: { _id: 'u1', email: 'u1@mfu.ac.th', organization: 'org_sci', role: 'role_student' },
                submit: true,
                createdAt: '2026-11-11T08:00:00.000Z',
                updatedAt: '2026-11-11T08:05:00.000Z',
                answers: [{ question: 'q2', response: '5' }]
            },
            {
                _id: 'r2',
                form: 'form_sci',
                responder: null, // anonymous guest
                guestSessionId: 'guest-abc',
                submit: true,
                createdAt: '2026-11-12T06:00:00.000Z',
                updatedAt: '2026-11-12T06:10:00.000Z',
                answers: [{ question: 'q2', response: '3' }]
            }
        ]
    };

    const allResponses = [
        // Duplicate of r1 to verify deduplication
        { ...sciForm.responses[0], form: { _id: 'form_sci' } },
        { ...sciForm.responses[1], form: { _id: 'form_sci' } },
        // Ongoing draft for form_sci from Responses/exp
        {
            _id: 'r3_draft',
            form: { _id: 'form_sci' },
            responder: { _id: 'u2', email: 'u2@mfu.ac.th', organization: 'org_sci', role: 'role_student' },
            submit: false,
            createdAt: '2026-11-12T09:00:00.000Z',
            updatedAt: '2026-11-12T09:30:00.000Z',
            answers: [{ question: 'q1', response: 'Halfway done' }]
        },
        // Old submitted response (3 months ago) on a closed form to test timeRange === 'all'
        {
            _id: 'r4_old',
            form: 'form_old',
            responder: 'u4',
            submit: true,
            createdAt: '2026-08-15T10:00:00.000Z',
            updatedAt: '2026-08-15T10:15:00.000Z',
            answers: []
        },
        // Orphaned response with form: null must NOT leak into form_sci or form_old
        {
            _id: 'r_orphan',
            form: null,
            responder: { _id: 'u4', email: 'u4@mfu.ac.th', organization: 'org_it', role: 'role_student' },
            submit: true,
            createdAt: '2026-11-11T09:00:00.000Z',
            answers: []
        }
    ];

    const oldClosedForm = {
        _id: 'form_old',
        title: [
            { key: 'en', value: 'Old IT Survey' },
            { key: 'th', value: 'แบบสอบถามไอทีเก่า' }
        ],
        organization: [GENERAL_ORG_ID],
        settings: {
            allowedRoles: [],
            allowedUser: []
        },
        schedule: {
            startAt: '2026-08-01T00:00:00.000Z',
            endAt: '2026-08-31T23:59:59.000Z'
        },
        questions: [],
        responses: [allResponses[3]]
    };

    test('preserves legacy helper functions and accepts both moment and Date arguments', () => {
        expect(isSubmittedResponse({ submit: true })).toBe(true);
        expect(isSubmittedResponse({ submit: false })).toBe(false);
        expect(isSubmittedResponse(null)).toBe(false);

        const nativeNow = new Date('2026-11-12T10:00:00.000Z');
        expect(moment.isMoment(getRangeStart('1d', nativeNow))).toBe(true);
        expect(isInTimeRange('2026-11-12T09:00:00.000Z', '1d', nativeNow)).toBe(true);
        expect(isInTimeRange('2026-11-01T09:00:00.000Z', '1d', nativeNow)).toBe(false);
        expect(isInTimeRange('2026-08-15T10:00:00.000Z', 'all', nativeNow)).toBe(true);

        expect(getFilteredResponses(sciForm, '1d', now)).toHaveLength(1);
        expect(getFilteredResponses(sciForm, 'all', now)).toHaveLength(2);

        expect(getFormStatusKey(sciForm, now)).toBe('open');
        expect(getFormStatusKey(oldClosedForm, now)).toBe('closed');
        expect(getTableStatusLabel(sciForm, now)).toBe('Active');
        expect(getTableStatusLabel(oldClosedForm, now)).toBe('Closed');
    });

    test('getFormResponsesFromPool deduplicates and merges Ongoing drafts from Responses/exp', () => {
        const merged = getFormResponsesFromPool(sciForm, allResponses);
        expect(merged.map((r) => r._id).sort()).toEqual(['r1', 'r2', 'r3_draft']);
        expect(merged.filter((r) => !isSubmittedResponse(r))).toHaveLength(1);
    });

    test('getFormTargetUsers resolves org + role intersection and General fallback', () => {
        const sciTarget = getFormTargetUsers(sciForm, users, organizations);
        expect(sciTarget.targetCount).toBe(2); // u1, u2 (org_sci + role_student)
        expect(sciTarget.targetUsers.map((u) => u._id)).toEqual(['u1', 'u2']);

        const generalTarget = getFormTargetUsers(oldClosedForm, users, organizations);
        expect(generalTarget.targetCount).toBe(4); // General matches all users
    });

    test('getFormRatingSummary computes average rating and 1-5 star distribution', () => {
        const rating = getFormRatingSummary(sciForm, sciForm.responses);
        expect(rating.ratingCount).toBe(2);
        expect(rating.avgRating).toBe(4); // (5 + 3) / 2
        expect(rating.distribution).toEqual([0, 0, 1, 0, 1]); // [1★, 2★, 3★, 4★, 5★]
    });

    test('getFormMetrics computes completed, ongoing drafts, responseRate, completionRate, guest count, and isClosingSoon', () => {
        const metrics = getFormMetrics(sciForm, {
            allResponses,
            users,
            organizations,
            timeRange: 'all',
            locale: 'en',
            now
        });

        expect(metrics.completedCount).toBe(2);
        expect(metrics.ongoingCount).toBe(1);
        expect(metrics.targetCount).toBe(2);
        expect(metrics.responseRate).toBe(100); // 2 / 2 => 100%
        expect(metrics.completionRate).toBe(67); // 2 / (2 + 1) = 66.7 => 67%
        expect(metrics.signedInCount).toBe(1);
        expect(metrics.guestCount).toBe(1);
        expect(metrics.avgRating).toBe(4);
        expect(metrics.isClosingSoon).toBe(true);
        expect(metrics.status).toBe('Active');
    });

    test('buildTrendSeries fixes all-time bug by generating real multi-month buckets with ongoing drafts series', () => {
        const trendAll = buildTrendSeries([sciForm, oldClosedForm], {
            allResponses,
            timeRange: 'all',
            now
        });

        expect(trendAll.mode).toBe('monthly');
        // Spans 2026-08 through 2026-11 (4 months) instead of clamping to 30 days
        expect(trendAll.labels.length).toBeGreaterThanOrEqual(4);
        expect(trendAll.completedData.reduce((a, b) => a + b, 0)).toBe(3); // r1, r2, r4_old
        expect(trendAll.ongoingData.reduce((a, b) => a + b, 0)).toBe(1); // r3_draft

        const trend7d = buildTrendSeries([sciForm], { allResponses, timeRange: '7d', now });
        expect(trend7d.mode).toBe('daily');
        expect(trend7d.labels).toHaveLength(7);

        const trend1d = buildTrendSeries([sciForm], { allResponses, timeRange: '1d', now });
        expect(trend1d.mode).toBe('hourly');
        expect(trend1d.labels).toHaveLength(24);
    });

    test('filterForms supports org, status (including closingSoon), and multilingual search', () => {
        const bySearchTh = filterForms([sciForm, oldClosedForm], {
            searchQuery: 'วิทยาศาสตร์',
            locale: 'th',
            organizations,
            now
        });
        expect(bySearchTh.map((f) => f._id)).toEqual(['form_sci']);

        const byOrg = filterForms([sciForm, oldClosedForm], {
            selectedOrgId: 'org_sci',
            organizations,
            locale: 'en',
            now
        });
        expect(byOrg.map((f) => f._id)).toEqual(['form_sci']);

        const byClosingSoon = filterForms([sciForm, oldClosedForm], {
            selectedStatus: 'closingSoon',
            organizations,
            locale: 'en',
            now
        });
        expect(byClosingSoon.map((f) => f._id)).toEqual(['form_sci']);
    });

    test('buildAnalyticsDashboard & buildAnalyticsExportRows produce complete outputs', () => {
        const dashboard = buildAnalyticsDashboard([sciForm, oldClosedForm], {
            allResponses,
            users,
            organizations,
            roles,
            timeRange: 'all',
            selectedOrgId: 'all',
            selectedStatus: 'all',
            searchQuery: '',
            locale: 'en',
            now
        });

        expect(dashboard.summary.totalForms).toBe(2);
        expect(dashboard.summary.activeForms).toBe(1);
        expect(dashboard.summary.closingSoonForms).toBe(1);
        expect(dashboard.summary.totalCompleted).toBe(3);
        expect(dashboard.summary.totalOngoing).toBe(1);
        expect(dashboard.summary.overallCompletionRate).toBe(75); // 3 / (3 + 1)
        expect(dashboard.summary.guestResponses).toBe(1);
        expect(dashboard.summary.avgRating).toBe(4);

        expect(dashboard.breakdown.byOrganization.some((o) => o.id === 'org_sci')).toBe(true);
        expect(dashboard.breakdown.byRole.some((r) => r.id === 'role_student')).toBe(true);

        const rows = buildAnalyticsExportRows(dashboard.formRows);
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveProperty('Form Title');
        expect(rows[0]).toHaveProperty('Ongoing Drafts');
        expect(rows[0]).toHaveProperty('Response Rate (%)');
    });

    test('buildOrgAndRoleBreakdown attributes actual respondents even when form organization array is empty', () => {
        const privateForm = {
            _id: 'form_private',
            title: [{ key: 'en', value: 'Private Open Link Form' }],
            organization: [],
            settings: { allowedRoles: [], allowedUser: [] },
            schedule: { startAt: '2026-11-01T00:00:00.000Z', endAt: null },
            questions: [],
            responses: [
                {
                    _id: 'r_priv_1',
                    form: 'form_private',
                    responder: { _id: 'u1', organization: 'org_sci', role: 'role_student' },
                    submit: true,
                    createdAt: '2026-11-11T08:00:00.000Z'
                }
            ]
        };

        const m = getFormMetrics(privateForm, {
            allResponses: privateForm.responses,
            users,
            organizations,
            timeRange: 'all',
            locale: 'en',
            now
        });
        const breakdown = buildOrgAndRoleBreakdown([m], { organizations, roles, users, locale: 'en' });
        expect(breakdown.byOrganization).toEqual([
            expect.objectContaining({ id: 'org_sci', label: 'School of Science', completed: 1 })
        ]);
        expect(breakdown.byRole).toEqual([
            expect.objectContaining({ id: 'role_student', label: 'Student', completed: 1 })
        ]);
    });

    test('analytics user scope helpers allow Admin (all), Creator, Collaborator Editor/Viewer, and hide unrelated forms', () => {
        const adminUser = { _id: 'u_admin', role: { title: [{ key: 'en', value: 'Admin' }] } };
        const creatorUser = { _id: 'u_creator', role: { title: [{ key: 'en', value: 'Lecturer' }] } };
        const editorUser = { _id: 'u_editor', role: { title: [{ key: 'en', value: 'Staff' }] } };
        const viewerUser = { _id: 'u_viewer', role: { title: [{ key: 'en', value: 'Student' }] } };
        const unrelatedStudent = { _id: 'u1', role: { title: [{ key: 'en', value: 'Student' }] } };

        const ownedForm = {
            ...sciForm,
            _id: 'form_owned',
            creator: { _id: 'u_creator' },
            collaborator: [
                { user: { _id: 'u_editor' }, type: { title: [{ key: 'en', value: 'Editor' }] } },
                { user: 'u_viewer', type: { title: [{ key: 'en', value: 'Viewer' }] } }
            ]
        };
        const otherForm = {
            ...oldClosedForm,
            _id: 'form_other',
            creator: 'u_other_creator',
            collaborator: []
        };

        expect(isUserAdmin(adminUser)).toBe(true);
        expect(isUserAdmin(unrelatedStudent)).toBe(false);

        expect(getUserFormAccessRole(ownedForm, creatorUser)).toBe('creator');
        expect(getUserFormAccessRole(ownedForm, editorUser)).toBe('editor');
        expect(getUserFormAccessRole(ownedForm, viewerUser)).toBe('viewer');
        expect(getUserFormAccessRole(ownedForm, adminUser)).toBe('admin');
        expect(getUserFormAccessRole(ownedForm, unrelatedStudent)).toBeNull();
        expect(canUserViewFormAnalytics(ownedForm, viewerUser)).toBe(true);
        expect(canUserViewFormAnalytics(ownedForm, unrelatedStudent)).toBe(false);

        expect(filterFormsByUserAccess([ownedForm, otherForm], adminUser).map(f => f._id)).toEqual(['form_owned', 'form_other']);
        expect(filterFormsByUserAccess([ownedForm, otherForm], creatorUser).map(f => f._id)).toEqual(['form_owned']);
        expect(filterFormsByUserAccess([ownedForm, otherForm], editorUser).map(f => f._id)).toEqual(['form_owned']);
        expect(filterFormsByUserAccess([ownedForm, otherForm], viewerUser).map(f => f._id)).toEqual(['form_owned']);
        expect(filterFormsByUserAccess([ownedForm, otherForm], unrelatedStudent)).toEqual([]);
        expect(filterFormsByUserAccess([ownedForm, otherForm], null)).toEqual([]);

        // Unrelated student who responded to sciForm/ownedForm still sees 0 KPIs in Analytics
        const studentDash = buildAnalyticsDashboard([ownedForm, otherForm], {
            allResponses,
            users,
            organizations,
            roles,
            currentUser: unrelatedStudent,
            now
        });
        expect(studentDash.summary.totalForms).toBe(0);
        expect(studentDash.summary.totalCompleted).toBe(0);
        expect(studentDash.summary.totalOngoing).toBe(0);
        expect(studentDash.formRows).toEqual([]);

        // Collaborator Viewer sees only shared form metrics
        const viewerDash = buildAnalyticsDashboard([ownedForm, otherForm], {
            allResponses,
            users,
            organizations,
            roles,
            currentUser: viewerUser,
            now
        });
        expect(viewerDash.summary.totalForms).toBe(1);
        expect(viewerDash.formRows.map(r => r.id)).toEqual(['form_owned']);
    });

    test('buildCompactAccessSummary formats private, single target, and multi-target grouped summaries', () => {
        const priv = buildCompactAccessSummary(['Private'], { formatLabel: (v) => (v === 'Private' ? 'PrivateLabel' : v) });
        expect(priv.label).toBe('PrivateLabel');
        expect(priv.badgeClass).toBe('visi-private');
        expect(priv.hasDropdown).toBe(false);

        const singleOrg = buildCompactAccessSummary(['School of Science']);
        expect(singleOrg.label).toBe('School of Science');
        expect(singleOrg.badgeClass).toBe('visi-org');
        expect(singleOrg.hasDropdown).toBe(false);

        const multi = buildCompactAccessSummary(
            ['Public', 'Personal: Alice', 'Role: Lecturer'],
            { formatLabel: (v) => v, orgUnit: 'Orgs', userUnit: 'Users', roleUnit: 'Roles' }
        );
        expect(multi.label).toBe('Public · 1 Users · 1 Roles');
        expect(multi.badgeClass).toBe('visi-public');
        expect(multi.hasDropdown).toBe(true);
        expect(multi.orgs).toEqual(['Public']);
        expect(multi.users).toEqual(['Alice']);
        expect(multi.roles).toEqual(['Lecturer']);

        const multiWithUnits = buildCompactAccessSummary(
            ['สำนักวิชาเทคโนโลยีสารสนเทศ', 'สำนักวิชาวิทยาศาสตร์', 'Personal: Alice', 'Personal: Bob', 'Role: Lecturer'],
            { orgUnit: 'หน่วยงาน', userUnit: 'บุคคล', roleUnit: 'บทบาท' }
        );
        expect(multiWithUnits.label).toBe('สำนักวิชาเทคโนโลยีสารสนเทศ +1 หน่วยงาน · 2 บุคคล · 1 บทบาท');
        expect(multiWithUnits.badgeClass).toBe('visi-org');
        expect(multiWithUnits.hasDropdown).toBe(true);

        const multiOrgs = buildCompactAccessSummary(
            ['สำนักวิชาเทคโนโลยีสารสนเทศ', 'สำนักวิชาวิทยาศาสตร์', 'สำนักวิชาการจัดการ'],
            { orgUnit: 'หน่วยงาน' }
        );
        expect(multiOrgs.label).toBe('สำนักวิชาเทคโนโลยีสารสนเทศ +2 หน่วยงาน');
        expect(multiOrgs.badgeClass).toBe('visi-org');
        expect(multiOrgs.hasDropdown).toBe(true);
    });
});
