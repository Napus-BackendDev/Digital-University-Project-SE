import {
    getScheduleStatus,
    isFormOpenForSubmission,
    isSchedulePublished,
    resolveScheduleMode,
    validateScheduleConfig,
    validateScheduleForPublish,
    buildPublishedSchedule,
    buildUnpublishedSchedule,
    resolveFormAccessMode,
    isMfuInstitutionalEmail,
    isLoginRequiredByForm,
    normalizeAllowedEmails,
    parseEmailInputList,
    isUserAllowedByIndividualAccess,
    isUserAllowedByOrganizationAndRole,
    normalizeMaxResponses,
    getSubmittedCountFromForm,
    isQuotaReached,
    hasAnswerValue,
    findMissingRequiredQuestions,
    getOrCreateGuestSessionId,
    extractPolicyErrorReason,
    getReachableQuestionIds,
    buildResponseRuleDetails,
    normalizeQuestionTypeKey,
    isFreeTextQuestionType,
    isNonInputQuestionType,
    isSectionQuestionType,
    getQuestionNumberInSection,
    extractFormLanguages,
    countInputQuestions,
    consolidateQuestionTypes,
    buildQuestionSectionGroups,
    getQuestionSectionIndex,
    reorderMoveQuestionToSection,
    reorderMoveSectionGroup,
    mergeVisibleOrderWithHiddenSections,
    canManageForms
} from '@/projects/utils/formPolicy';

describe('formPolicy frontend helper', () => {
    const now = new Date('2026-11-11T12:00:00Z');

    test('computes schedule status matching FormStatus conventions', () => {
        expect(getScheduleStatus({}, now)).toBe('draft');
        expect(isFormOpenForSubmission({}, now)).toBe(false);

        expect(getScheduleStatus({ startAt: null, endAt: '2026-12-01T00:00:00Z' }, now)).toBe('closed_forever');
        expect(getScheduleStatus({ startAt: '2026-11-12T00:00:00Z' }, now)).toBe('scheduled');
        expect(getScheduleStatus({ startAt: '2026-11-01T00:00:00Z' }, now)).toBe('open_forever');
        expect(isFormOpenForSubmission({ startAt: '2026-11-01T00:00:00Z' }, now)).toBe(true);
        expect(getScheduleStatus({ startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-20T00:00:00Z' }, now)).toBe('open');
        expect(getScheduleStatus({ startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-10T00:00:00Z' }, now)).toBe('closed');

        // Explicit Draft gate keeps configured schedule in draft until formally published
        const draftScheduled = { isPublished: false, mode: 'range', startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-20T00:00:00Z' };
        expect(isSchedulePublished(draftScheduled)).toBe(false);
        expect(getScheduleStatus(draftScheduled, now)).toBe('draft');
        expect(isFormOpenForSubmission(draftScheduled, now)).toBe(false);
    });

    test('validates all 4 schedule modes and blocks past end dates / invalid future starts before publish', () => {
        expect(resolveScheduleMode({ mode: 'end_only', endAt: '2026-12-01T00:00:00Z' }, now)).toBe('end_only');

        // Past endAt validation fails both live and for publish
        const pastEnd = validateScheduleConfig({ isPublished: false, mode: 'end_only', endAt: '2026-11-01T00:00:00Z' }, { now });
        expect(pastEnd.valid).toBe(false);
        expect(pastEnd.reason).toBe('END_IN_PAST');
        expect(validateScheduleForPublish({ isPublished: false, mode: 'range', startAt: '2026-11-01T00:00:00Z', endAt: '2026-11-05T00:00:00Z' }, now).reason).toBe('END_IN_PAST');

        // End Before Start validation
        expect(validateScheduleForPublish({ isPublished: false, mode: 'range', startAt: '2026-11-25T00:00:00Z', endAt: '2026-11-20T00:00:00Z' }, now).reason).toBe('END_BEFORE_START');

        // Mode 4 Scheduled requires future startAt
        expect(validateScheduleForPublish({ isPublished: false, mode: 'scheduled', startAt: '2026-11-05T00:00:00Z' }, now).reason).toBe('START_MUST_BE_FUTURE');

        // Mode 3 End Only auto-stamps startAt at publish timestamp
        const publishedEndOnly = buildPublishedSchedule({ isPublished: false, mode: 'end_only', endAt: '2026-12-01T00:00:00Z' }, now);
        expect(publishedEndOnly.valid).toBe(true);
        expect(publishedEndOnly.schedule).toEqual({
            isPublished: true,
            mode: 'end_only',
            startAt: now.toISOString(),
            endAt: '2026-12-01T00:00:00.000Z'
        });

        // Unpublishing end_only returns to Draft preserving endAt while clearing auto-start timestamp
        expect(buildUnpublishedSchedule(publishedEndOnly.schedule)).toEqual({
            isPublished: false,
            mode: 'end_only',
            startAt: null,
            endAt: '2026-12-01T00:00:00.000Z'
        });
    });

    test('computes login requirement for collectEmail, requireLogin, allowedUser, allowedEmails, and allowedRoles', () => {
        expect(isLoginRequiredByForm({ settings: { collectEmail: true, requireLogin: false } })).toBe(true);
        expect(isLoginRequiredByForm({ settings: { collectEmail: false, requireLogin: false } })).toBe(false);
        expect(isLoginRequiredByForm({ settings: { requireLogin: true } })).toBe(true);
        expect(isLoginRequiredByForm({ settings: { allowedUser: ['u1'] } })).toBe(true);
        expect(isLoginRequiredByForm({ settings: { allowedEmails: ['parent@gmail.com'] } })).toBe(true);
        expect(isLoginRequiredByForm({ settings: { allowedRoles: ['r1'] } })).toBe(true);

        // Private vs Public access mode resolution + institutional MFU domain check
        expect(resolveFormAccessMode({ organization: ['org_sci'], settings: {} })).toBe('private');
        expect(resolveFormAccessMode({ organization: ['org_sci'], settings: { accessMode: 'public', allowedUser: ['u1'] } })).toBe('public');
        expect(isLoginRequiredByForm({ organization: ['org_sci'], settings: { accessMode: 'public', collectEmail: true, requireLogin: false } })).toBe(false);
        expect(isLoginRequiredByForm({ organization: ['org_sci'], settings: { accessMode: 'public', requireLogin: true } })).toBe(true);
        expect(isMfuInstitutionalEmail('student@lamduan.mfu.ac.th')).toBe(true);
        expect(isMfuInstitutionalEmail('lecturer@mfu.ac.th')).toBe(true);
        expect(isMfuInstitutionalEmail('user@gmail.com')).toBe(false);
    });

    test('parses, normalizes, and matches external allowedEmails cleanly', () => {
        const parsed = parseEmailInputList('Parent@Gmail.com, bad-email\nalumni@mfu.ac.th, parent@gmail.com');
        expect(parsed).toEqual({
            validEmails: ['parent@gmail.com', 'alumni@mfu.ac.th'],
            invalidEntries: ['bad-email']
        });
        expect(normalizeAllowedEmails([' User@Gmail.com ', 'user@gmail.com', 'notanemail'])).toEqual(['user@gmail.com']);
        expect(isUserAllowedByIndividualAccess({ allowedEmails: ['parent@gmail.com'] }, 'u-ext', 'PARENT@gmail.com')).toBe(true);
        expect(isUserAllowedByIndividualAccess({ allowedEmails: ['parent@gmail.com'] }, 'u-ext', 'other@gmail.com')).toBe(false);
    });

    test('binds allowedRoles strictly under selected organization in frontend policy check', () => {
        const form = {
            organization: ['org_sci'],
            settings: { allowedRoles: ['role_student'] }
        };
        expect(isUserAllowedByOrganizationAndRole(form, { organization: 'org_sci', role: 'role_student' }).allowed).toBe(true);
        expect(isUserAllowedByOrganizationAndRole(form, { organization: 'org_it', role: 'role_student' }).reason).toBe('ACCESS_DENIED_ORG');
        expect(isUserAllowedByOrganizationAndRole(form, { organization: 'org_sci', role: 'role_lecturer' }).reason).toBe('ACCESS_DENIED_ROLE');
        expect(isUserAllowedByOrganizationAndRole({ organization: [], settings: { allowedRoles: ['role_student'] } }, { organization: 'org_sci', role: 'role_student' }).reason).toBe('ACCESS_DENIED_ORG');
    });

    test('normalizes maxResponses and detects quota saturation', () => {
        expect(normalizeMaxResponses('')).toBeNull();
        expect(normalizeMaxResponses(0)).toBeNull();
        expect(normalizeMaxResponses(-1)).toBeNull();
        expect(normalizeMaxResponses('12')).toBe(12);

        const formAtQuota = {
            settings: { maxResponses: 2 },
            responses: [{ submit: true }, { submit: false }, { submit: true }]
        };
        expect(getSubmittedCountFromForm(formAtQuota)).toBe(2);
        expect(isQuotaReached(formAtQuota, false)).toBe(true);
        expect(isQuotaReached(formAtQuota, true)).toBe(false);
    });

    test('validates required questions while skipping non-input and hidden skip-logic blocks', () => {
        const questions = [
            { _id: 'sec1', type: { type: 'section' }, isRequired: true },
            { _id: 'title1', type: { type: 'title_description' }, isRequired: true },
            { _id: 'img1', type: { type: 'image' }, isRequired: true },
            { _id: 'q1', type: { type: 'short_answer' }, isRequired: true },
            { _id: 'qHidden', type: { type: 'short_answer' }, isRequired: true },
            { _id: 'qOpt', type: { type: 'short_answer' }, isRequired: false },
            { _id: 'qArr', type: { type: 'checkbox' }, isRequired: true }
        ];

        const answers = {
            q1: '   ',
            qHidden: '',
            qOpt: '',
            qArr: []
        };

        const missing = findMissingRequiredQuestions({
            questions,
            answers,
            isVisibleFn: (q) => q._id !== 'qHidden'
        });

        expect(missing.map(q => q._id)).toEqual(['q1', 'qArr']);
        expect(hasAnswerValue('ok')).toBe(true);
        expect(hasAnswerValue(['file.png'])).toBe(true);
        expect(hasAnswerValue('   ')).toBe(false);
    });

    test('creates and persists deterministic guest session ID per form', () => {
        window.localStorage.clear();
        const id1 = getOrCreateGuestSessionId('form-123');
        const id2 = getOrCreateGuestSessionId('form-123');
        expect(id1).toMatch(/^guest-/);
        expect(id2).toBe(id1);
    });

    test('extracts backend policy error reason safely', () => {
        expect(extractPolicyErrorReason({ response: { data: { data: { reason: 'QUOTA_REACHED' } } } })).toBe('QUOTA_REACHED');
        expect(extractPolicyErrorReason(new Error('network'))).toBe('');
    });

    test('computes reachable questions for skip logic branches, unanswered conditional hiding, submit terminator, and cycles', () => {
        const questions = [
            {
                _id: 'q1',
                order: 1,
                config: {
                    choices: [
                        { key: '0', nextQuestion: 'q2' },
                        { key: '1', nextQuestion: 'q3' },
                        { key: '2', nextQuestion: 'submit' }
                    ]
                }
            },
            { _id: 'q2', order: 2, nextQuestion: 'q3' },
            { _id: 'q3', order: 3, nextQuestion: null }
        ];

        // When single-choice question q1 has choice-level nextQuestion branches and is NOT answered yet,
        // traversal stops at q1 so downstream conditional questions stay hidden until an answer is chosen
        expect([...getReachableQuestionIds({ questions, answers: {} })]).toEqual(['q1']);
        expect([...getReachableQuestionIds({ questions, answers: { q1: null } })]).toEqual(['q1']);
        expect([...getReachableQuestionIds({ questions, answers: { q1: '' } })]).toEqual(['q1']);

        expect([...getReachableQuestionIds({ questions, answers: { q1: '0' } })]).toEqual(['q1', 'q2', 'q3']);
        expect([...getReachableQuestionIds({ questions, answers: { q1: '1' } })]).toEqual(['q1', 'q3']);
        expect([...getReachableQuestionIds({ questions, answers: { q1: '2' } })]).toEqual(['q1']);

        // Single-choice questions WITHOUT any choice.nextQuestion branch keep linear traversal when unanswered
        const linearChoiceQuestions = [
            {
                _id: 'q1',
                order: 1,
                config: {
                    choices: [
                        { key: '0', nextQuestion: null },
                        { key: '1', nextQuestion: null }
                    ]
                }
            },
            { _id: 'q2', order: 2, nextQuestion: null }
        ];
        expect([...getReachableQuestionIds({ questions: linearChoiceQuestions, answers: {} })]).toEqual(['q1', 'q2']);

        // Cycle safety: q1 -> q2 -> q3 -> q2 must terminate cleanly without hanging
        const cyclic = [
            { _id: 'q1', order: 1, nextQuestion: 'q2' },
            { _id: 'q2', order: 2, nextQuestion: 'q3' },
            { _id: 'q3', order: 3, nextQuestion: 'q2' }
        ];
        expect([...getReachableQuestionIds({ questions: cyclic, answers: {} })]).toEqual(['q1', 'q2', 'q3']);
    });

    test('builds clear response setting explanations for both public and restricted forms', () => {
        const publicRules = buildResponseRuleDetails({ emailNotifications: true }, (k) => k, { isSignedIn: false });
        expect(publicRules.map(r => r.key)).toEqual(['schedulePeriod', 'noLogin', 'unlimitedSubmits', 'noEditAfterSubmit']);

        const strictRules = buildResponseRuleDetails({
            requireLogin: true,
            collectEmail: true,
            limitResponse: true,
            allowEditAfterSubmit: true,
            maxResponses: 100,
            emailNotifications: true,
            notifyCreator: true
        }, (k, p) => (p && p.max ? `${k}:${p.max}:${p.remaining}` : (p && p.count ? `${k}:${p.count}` : k)), {
            isSignedIn: true,
            submittedCount: 12
        });
        expect(strictRules.map(r => r.key)).toEqual([
            'schedulePeriod',
            'requireLogin',
            'collectEmail',
            'limitResponse',
            'allowEditAfterSubmit',
            'maxResponses',
            'emailNotifications'
        ]);
        expect(strictRules.find(r => r.key === 'maxResponses').title).toBe('form.responseSummary.quotaWithRemaining:100:88');
    });

    test('consolidates short_answer and paragraph question types into a single Free Text type', () => {
        expect(isFreeTextQuestionType('short_answer')).toBe(true);
        expect(isFreeTextQuestionType('paragraph')).toBe(true);
        expect(isFreeTextQuestionType('free_text')).toBe(true);
        expect(isFreeTextQuestionType('rating')).toBe(false);
        expect(normalizeQuestionTypeKey('short_answer')).toBe('free_text');
        expect(normalizeQuestionTypeKey('paragraph')).toBe('free_text');
        expect(normalizeQuestionTypeKey('multiple_choice')).toBe('multiple_choice');

        const rawTypes = [
            { _id: 'id_short', type: 'short_answer' },
            { _id: 'id_para', type: 'paragraph' },
            { _id: 'id_mc', type: 'multiple_choice' },
            { _id: 'id_rate', type: 'rating' }
        ];
        const consolidated = consolidateQuestionTypes(rawTypes);
        expect(consolidated).toEqual([
            { _id: 'id_para', type: 'free_text' },
            { _id: 'id_mc', type: 'multiple_choice' },
            { _id: 'id_rate', type: 'rating' }
        ]);
    });

    test('treats section dividers alongside title_description and image as non-input layout elements', () => {
        expect(isNonInputQuestionType('section')).toBe(true);
        expect(isNonInputQuestionType({ type: { type: 'section' } })).toBe(true);
        expect(isNonInputQuestionType('title_description')).toBe(true);
        expect(isNonInputQuestionType('image')).toBe(true);
        expect(isNonInputQuestionType('free_text')).toBe(false);

        const questions = [
            { _id: 'sec1', type: { type: 'section' } },
            { _id: 'q1', type: { type: 'free_text' } },
            { _id: 'td1', type: { type: 'title_description' } },
            { _id: 'q2', type: { type: 'rating' } },
            { _id: 'img1', type: { type: 'image' } }
        ];
        expect(countInputQuestions(questions)).toBe(2);
    });

    test('resets question numbering to 1 at each section divider while ignoring other non-input blocks', () => {
        const ordered = [
            { _id: 's1', type: { type: 'section' } },
            { _id: 'q1', type: { type: 'free_text' } },
            { _id: 'img1', type: { type: 'image' } },
            { _id: 'q2', type: { type: 'multiple_choice' } },
            { _id: 'q3', type: { type: 'rating' } },
            { _id: 's2', type: { type: 'section' } },
            { _id: 'q4', type: { type: 'checkbox' } },
            { _id: 'q5', type: { type: 'free_text' } }
        ];

        expect(isSectionQuestionType(ordered[0])).toBe(true);
        expect(isSectionQuestionType(ordered[1])).toBe(false);
        expect(getQuestionNumberInSection(ordered, ordered[1])).toBe(1);
        expect(getQuestionNumberInSection(ordered, ordered[3])).toBe(2);
        expect(getQuestionNumberInSection(ordered, ordered[4])).toBe(3);
        expect(getQuestionNumberInSection(ordered, ordered[6])).toBe(1);
        expect(getQuestionNumberInSection(ordered, ordered[7])).toBe(2);
    });

    test('extracts normalized form languages with English default fallback', () => {
        expect(extractFormLanguages(null)).toEqual(['en']);
        const form = {
            title: [{ key: 'EN', value: 'Hi' }, { key: 'th', value: 'สวัสดี' }],
            questions: [
                {
                    title: [{ key: 'th', value: 'ถาม' }, { key: 'cn', value: '问' }],
                    config: { choices: [{ lang: [{ key: 'en', value: 'A' }] }] }
                }
            ]
        };
        expect(extractFormLanguages(form)).toEqual(['en', 'th', 'cn']);
    });

    test('builds section groups and moves questions or whole section blocks cleanly', () => {
        const s1 = { _id: 's1', type: { type: 'section' } };
        const q1 = { _id: 'q1', type: { type: 'free_text' } };
        const q2 = { _id: 'q2', type: { type: 'multiple_choice' } };
        const s2 = { _id: 's2', type: { type: 'section' } };
        const q3 = { _id: 'q3', type: { type: 'rating' } };
        const list = [s1, q1, q2, s2, q3];

        const groups = buildQuestionSectionGroups(list);
        expect(groups).toHaveLength(2);
        expect(groups[0].sectionNumber).toBe(1);
        expect(groups[0].questionCount).toBe(2);
        expect(groups[1].sectionNumber).toBe(2);
        expect(groups[1].questionCount).toBe(1);
        expect(getQuestionSectionIndex(list, 1)).toBe(0);
        expect(getQuestionSectionIndex(list, 4)).toBe(1);

        // Move q1 (index 1) from Section 1 to Section 2
        const moved = reorderMoveQuestionToSection(list, 1, 1);
        expect(moved.questions.map(x => x._id)).toEqual(['s1', 'q2', 's2', 'q3', 'q1']);
        expect(getQuestionNumberInSection(moved.questions, q2)).toBe(1);
        expect(getQuestionNumberInSection(moved.questions, q1)).toBe(2);

        // Swap Section 2 block up above Section 1 block
        const swapped = reorderMoveSectionGroup(moved.questions, 2, -1);
        expect(swapped.questions.map(x => x._id)).toEqual(['s2', 'q3', 'q1', 's1', 'q2']);
        expect(swapped.newHeaderIndex).toBe(0);

        // Merging collapsed Section 1 (whose q2 child was hidden) keeps q2 attached under s1
        const merged = mergeVisibleOrderWithHiddenSections(swapped.questions, [s1, s2, q3, q1]);
        expect(merged.map(x => x._id)).toEqual(['s1', 'q2', 's2', 'q3', 'q1']);
    });

    describe('canManageForms policy helper (Requirement 5.1 / B6-1)', () => {
        test('grants access to Admin role by title, ID, or Thai label', () => {
            expect(canManageForms({ role: { _id: '69aec1c73996270d703db3d7', title: 'Admin' } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }, { key: 'en', value: 'Admin' }] } })).toBe(true);
            expect(canManageForms({ role: '69aec1c73996270d703db3d7' })).toBe(true);
            expect(canManageForms({ role: { name: 'admin' } })).toBe(true);
        });

        test('grants access to Staff role when matrix has no entry for manage page', () => {
            expect(canManageForms({ role: { _id: '69e9e2226c400846810ef689', title: [{ key: 'en', value: 'Staff' }] } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'เจ้าหน้าที่ (Staff)' }] } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'บุคลากร' }] } })).toBe(true);
            expect(canManageForms({ role: '69e9e2226c400846810ef689' })).toBe(true);
        });

        test('grants access to Lecturer role when matrix has no entry for manage page', () => {
            expect(canManageForms({ role: { _id: '69e9e2226c400846810ef688', title: [{ key: 'en', value: 'Lecturer' }] } })).toBe(true);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'อาจารย์ (Lecturer)' }] } })).toBe(true);
            expect(canManageForms({ role: '69e9e2226c400846810ef688' })).toBe(true);
        });

        test('denies access to Student role when matrix has no entry for manage page', () => {
            expect(canManageForms({ role: { _id: '69e9e2226c400846810ef687', title: [{ key: 'en', value: 'Student' }] } })).toBe(false);
            expect(canManageForms({ role: { title: [{ key: 'th', value: 'นักศึกษา (Student)' }] } })).toBe(false);
            expect(canManageForms({ role: '69e9e2226c400846810ef687' })).toBe(false);
        });

        test('denies access when user has no role or invalid role structure', () => {
            expect(canManageForms(null)).toBe(false);
            expect(canManageForms({})).toBe(false);
            expect(canManageForms({ role: null })).toBe(false);
            expect(canManageForms({ role: undefined })).toBe(false);
            expect(canManageForms({ role: { title: [{ key: 'en', value: 'UnknownGuestRole' }] } })).toBe(false);
        });

        test('grants access to Student role whose role matrix grants manage (manage / forms-management / create)', () => {
            const studentWithManage = {
                role: {
                    _id: '69e9e2226c400846810ef687',
                    title: [{ key: 'en', value: 'Student' }],
                    permission: [
                        { page: 'manage', access: [{ key: 'create', value: true }] }
                    ]
                }
            };
            expect(canManageForms(studentWithManage)).toBe(true);

            const studentWithFormsManagement = {
                role: {
                    _id: '69e9e2226c400846810ef687',
                    title: [{ key: 'en', value: 'Student' }],
                    permission: [
                        { page: 'forms-management', access: [{ key: 'read', value: true }] }
                    ]
                }
            };
            expect(canManageForms(studentWithFormsManagement)).toBe(true);

            const studentWithCreate = {
                role: {
                    _id: '69e9e2226c400846810ef687',
                    title: [{ key: 'en', value: 'Student' }],
                    permission: [
                        { page: 'create', access: [{ key: 'create', value: true }] }
                    ]
                }
            };
            expect(canManageForms(studentWithCreate)).toBe(true);
        });

        test('denies access if matrix has an entry for manage page but value is false', () => {
            const studentWithFalseManage = {
                role: {
                    _id: '69e9e2226c400846810ef687',
                    title: [{ key: 'en', value: 'Student' }],
                    permission: [
                        { page: 'manage', access: [{ key: 'create', value: false }, { key: 'read', value: false }] }
                    ]
                }
            };
            expect(canManageForms(studentWithFalseManage)).toBe(false);

            // Even for Staff, if the matrix explicitly has a manage entry that does NOT grant access, it's denied
            const staffWithRevokedManage = {
                role: {
                    _id: '69e9e2226c400846810ef689',
                    title: [{ key: 'en', value: 'Staff' }],
                    permission: [
                        { page: 'manage', access: [{ key: 'create', value: false }] }
                    ]
                }
            };
            expect(canManageForms(staffWithRevokedManage)).toBe(false);
        });
    });
});
