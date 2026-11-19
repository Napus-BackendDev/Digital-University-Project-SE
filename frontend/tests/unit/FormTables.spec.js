import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import FormTables from '@/projects/components/tables/FormTables.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

const tableStubs = {
    FilterTable: { template: '<div />' },
    Pagination: { template: '<div />' },
    EmptyState: { template: '<div />' },
    TableLoading: { template: '<div />' },
    CIcon: { props: ['name'], template: '<i :data-icon="name" />' },
    CProgress: { props: ['value'], template: '<div class="c-progress-stub">{{ value }}%</div>' },
    CDropdown: {
        template: '<div class="c-dropdown-stub"><slot name="toggler-content" /><slot /></div>'
    },
    CDropdownItem: { template: '<div class="c-dropdown-item-stub"><slot /></div>' },
    CDataTable: {
        props: ['items', 'fields'],
        template: `
            <div class="c-datatable-stub">
                <div class="fields-count">{{ fields.length }}</div>
                <div v-for="(item, idx) in items" :key="item._id || idx" class="row-stub">
                    <slot name="form" :item="item" />
                    <slot name="timeRange" :item="item" />
                    <slot name="status" :item="item" />
                    <slot name="createdBy" :item="item" />
                    <slot name="action" :item="item" />
                </div>
            </div>
        `
    }
};

function daysFromNow(delta) {
    const d = new Date();
    d.setDate(d.getDate() + delta);
    return d.toISOString();
}

function mountFormTables(forms = [], responses = []) {
    const store = new Vuex.Store({
        modules: {
            Forms: { namespaced: true, getters: { forms: () => forms } },
            User: {
                namespaced: true,
                getters: {
                    user: () => ({
                        _id: 'u1',
                        name: 'Napus',
                        email: 'napus@mfu.ac.th',
                        organization: { _id: 'org_it' },
                        role: { _id: 'role_student', title: [{ key: 'en', value: 'Student' }] }
                    }),
                    users: () => [
                        { _id: 'u1', name: 'Napus', email: 'napus@mfu.ac.th', role: { _id: 'role_student', title: [{ key: 'en', value: 'Student' }] } },
                        { _id: 'creator1', name: 'Prof. Somchai', email: 'somchai@mfu.ac.th', organization: 'org_it', role: { _id: 'role_admin', title: [{ key: 'en', value: 'Admin' }, { key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }] } }
                    ]
                }
            },
            Organizations: {
                namespaced: true,
                getters: {
                    organizations: () => [
                        { _id: 'org_gen', title: [{ key: 'en', value: 'General' }, { key: 'th', value: 'ทั่วไป' }] },
                        { _id: 'org_it', title: [{ key: 'en', value: 'School of IT' }, { key: 'th', value: 'สำนักวิชาเทคโนโลยีสารสนเทศ' }] }
                    ]
                }
            },
            Responses: { namespaced: true, getters: { responses: () => responses } },
            Setting: { namespaced: true, getters: { lang: () => 'en' } }
        }
    });
    store.dispatch = jest.fn(() => Promise.resolve());

    return shallowMount(FormTables, {
        localVue,
        store,
        propsData: { loading: false },
        stubs: tableStubs,
        directives: { 'c-tooltip': () => {} },
        mocks: {
            $router: { push: jest.fn() },
            $t: (key, params) => {
                const map = {
                    'table.questionnaire': 'Questionnaire',
                    'table.access': 'Access',
                    'table.timeRange': 'Time Range',
                    'table.status': 'Status',
                    'table.progress': 'Progress',
                    'table.createdBy': 'Created By',
                    'table.responseSettings': 'Response Settings',
                    'table.action': 'Action',
                    'table.orgUnit': 'Orgs',
                    'table.userUnit': 'Users',
                    'table.roleUnit': 'Roles',
                    'table.openForever': 'Open always',
                    'table.closingSoon': 'Closing soon',
                    'table.submittedCount': `Submitted ${params && params.count} times`,
                    'table.settingTooltips.requireLogin': 'Sign-in required',
                    'table.settingTooltips.limitResponse': 'Limit to 1 response',
                    'table.settingTooltips.allowEditAfterSubmit': 'Allow edit after submit',
                    'table.settingTooltips.maxResponses': `Quota limit: ${params && params.count}`,
                    'table.settingTooltips.emailNotifications': 'Email respondent',
                    'table.settingTooltips.notifyCreator': 'Notify creator',
                    'table.ruleAllowEdit': 'Editable',
                    'table.ruleQuota': `Max ${params && params.count}`,
                    'table.questionCount': `${params && params.count} Qs`,
                    'table.byAuthor': `By ${params && params.name}`,
                    'table.answeredFraction': `${params && params.answered}/${params && params.total} Qs`,
                    'table.daysLeft': `${params && params.count} days left`,
                    'table.cta.start': 'Start',
                    'table.startForm': 'Start Form',
                    'table.cta.continue': 'Continue',
                    'table.cta.editAnswer': 'Edit Answer',
                    'table.cta.submitAgain': 'Submit Again',
                    'table.cta.submitted': 'Submitted',
                    'table.cta.restricted': 'Restricted',
                    'respondentStatus.pending': 'Not Started',
                    'respondentStatus.inprogress': 'In Progress',
                    'respondentStatus.completed': 'Submitted',
                    'accessLabel.public': 'Public',
                    'accessLabel.private': 'Private'
                };
                return map[key] || key;
            },
            $te: (key) => ['accessLabel.public', 'accessLabel.private'].includes(key),
            $i18n: { locale: 'en' }
        }
    });
}

describe('FormTables.vue redesigned respondent table', () => {
    test('defines 5 columns (no access/responseSettings columns, progress hidden) with createdBy (org + name) and emits update-stats', () => {
        const forms = [
            {
                _id: 'f1',
                title: [{ key: 'th', value: 'แบบฟอร์มทดสอบ 1' }, { key: 'en', value: '' }],
                description: [{ key: 'en', value: 'Pending survey' }],
                schedule: { startAt: daysFromNow(-1), endAt: daysFromNow(3) },
                organization: ['org_gen'],
                questions: [{ _id: 'q1', type: { type: 'rating' } }, { _id: 'q2', type: { type: 'short_answer' } }],
                creator: 'creator1',
                settings: { requireLogin: true, maxResponses: 50 }
            },
            {
                _id: 'f2',
                title: [{ key: 'en', value: 'Draft Survey' }],
                schedule: { startAt: daysFromNow(-1), endAt: null },
                organization: ['org_gen'],
                questions: [{ _id: 'q3', type: { type: 'short_answer' } }, { _id: 'q4', type: { type: 'short_answer' } }],
                creator: { _id: 'c2', name: 'Dr. Malee', email: 'malee@mfu.ac.th', role: { title: [{ key: 'en', value: 'Lecturer' }] } },
                settings: {}
            },
            {
                _id: 'f3',
                title: [{ key: 'en', value: 'Locked Survey' }],
                schedule: { startAt: daysFromNow(-2), endAt: daysFromNow(10) },
                organization: ['org_it'],
                questions: [{ _id: 'q5', type: { type: 'rating' } }],
                creator: 'creator1',
                settings: { limitResponse: true }
            }
        ];
        const responses = [
            { _id: 'r2', form: 'f2', responder: 'u1', submit: false, answers: [{ question: 'q3', response: 'half' }] },
            { _id: 'r3', form: 'f3', responder: 'u1', submit: true, answers: [{ question: 'q5', response: 5 }] }
        ];

        const wrapper = mountFormTables(forms, responses);
        expect(wrapper.vm.fields.map(f => f.key)).toEqual([
            'form',
            'timeRange',
            'status',
            'createdBy',
            'action'
        ]);

        const emitted = wrapper.emitted('update-stats');
        expect(emitted).toBeTruthy();
        expect(emitted[emitted.length - 1][0]).toEqual({
            total: 3,
            pending: 1,
            completed: 1,
            inProgress: 1
        });

        const rows = wrapper.vm.tableData;
        expect(rows[0].title).toBe('แบบฟอร์มทดสอบ 1');
        expect(rows[0].isClosingSoon).toBe(true);
        expect(rows[0].createdName).toBe('Prof. Somchai');
        expect(rows[0].createdEmail).toBe('somchai@mfu.ac.th');
        expect(rows[0].activeResponseRules.map(r => r.key)).toEqual(['requireLogin', 'maxResponses']);
        expect(rows[0].cta.label).toBe('Start');

        expect(rows[1].createdName).toBe('Dr. Malee');
        expect(rows[1].daysLeft).toBe('Open always');
        expect(rows[1].progress).toBe(50);
        expect(rows[1].cta.label).toBe('Continue');

        expect(rows[2].cta.label).toBe('Submitted');
        expect(rows[2].cta.disabled).toBe(true);

        const row0 = wrapper.findAll('.row-stub').at(0);
        const cells0 = row0.findAll('td');
        // #form cell has no author, no question count pill, and no submitted count
        expect(cells0.at(0).text()).not.toContain('Prof. Somchai');
        expect(cells0.at(0).text()).not.toContain('2 Qs');
        // #createdBy cell shows creator organization first, then name (no email/role badge)
        expect(rows[0].createdOrg).toBe('School of IT');
        expect(cells0.at(3).text()).toContain('School of IT');
        expect(cells0.at(3).text()).toContain('Prof. Somchai');
        expect(cells0.at(3).text()).not.toContain('somchai@mfu.ac.th');
        expect(cells0.at(3).text()).not.toContain('Admin');
        expect(row0.find('.creator-role-badge').exists()).toBe(false);
        // Action cell renders icon + word button without tooltip
        const actionBtn0 = cells0.at(4).find('.respondent-cta-btn');
        expect(actionBtn0.find('i.cta-icon').attributes('data-icon')).toBe('cil-arrow-right');
        expect(actionBtn0.find('.cta-label').text().trim()).toBe('Start');
        expect(actionBtn0.attributes('aria-label')).toBe('Start');
        expect(actionBtn0.attributes('data-original-title')).toBeUndefined();
        // Completed row does not display submission count or progress under #status or #form
        const row2 = wrapper.findAll('.row-stub').at(2);
        const cells2 = row2.findAll('td');
        // #status cell uses clear respondent status wording
        expect(cells0.at(2).text().trim()).toBe('Not Started');
        expect(cells2.at(2).text().trim()).toBe('Submitted');
        expect(cells2.at(0).text()).not.toContain('Submitted 1 times');
        expect(cells2.at(2).text()).not.toContain('Submitted 1 times');
        expect(cells2.at(2).text()).not.toContain('100%');
    });

    test('renders unified accessSummary dropdown and editable/resubmittable CTA states accurately', () => {
        const forms = [
            {
                _id: 'f_edit',
                title: [{ key: 'en', value: 'Editable Survey' }],
                schedule: { startAt: daysFromNow(-1), endAt: daysFromNow(10) },
                organization: ['org_it'],
                questions: [{ _id: 'q1', type: { type: 'rating' } }],
                settings: {
                    limitResponse: true,
                    allowEditAfterSubmit: true,
                    allowedUser: ['u1'],
                    allowedRoles: [{ _id: 'role_student', title: [{ key: 'en', value: 'Student' }] }]
                }
            },
            {
                _id: 'f_again',
                title: [{ key: 'en', value: 'Unlimited Survey' }],
                schedule: { startAt: daysFromNow(-1), endAt: daysFromNow(10) },
                organization: ['org_gen'],
                questions: [{ _id: 'q2', type: { type: 'rating' } }],
                settings: {}
            }
        ];
        const responses = [
            { _id: 'r1', form: 'f_edit', responder: 'u1', submit: true, answers: [{ question: 'q1', response: 4 }] },
            { _id: 'r2', form: 'f_again', responder: 'u1', submit: true, answers: [{ question: 'q2', response: 5 }] }
        ];

        const wrapper = mountFormTables(forms, responses);
        const rows = wrapper.vm.tableData;

        expect(rows[0].accessSummary.hasDropdown).toBe(true);
        expect(rows[0].accessSummary.orgs).toEqual(['School of IT']);
        expect(rows[0].accessSummary.users).toEqual(['Napus']);
        expect(rows[0].accessSummary.roles).toEqual(['Student']);
        expect(rows[0].cta.label).toBe('Edit Answer');
        expect(rows[0].cta.disabled).toBe(false);
        expect(rows[0].cta.isNew).toBe(false);

        expect(rows[1].cta.label).toBe('Submit Again');
        expect(rows[1].cta.disabled).toBe(false);
        expect(rows[1].cta.isNew).toBe(true);
    });

    test('allows org member who is NOT in allowedUser/allowedEmails to enter when individuals are also set (Audience Union)', () => {
        const forms = [
            {
                _id: 'f_union',
                title: [{ key: 'en', value: 'IT Department + Guest Union Survey' }],
                schedule: { startAt: daysFromNow(-1), endAt: daysFromNow(10) },
                organization: ['org_it'],
                questions: [{ _id: 'q1', type: { type: 'rating' } }],
                settings: {
                    accessMode: 'private',
                    allowedRoles: ['role_student'],
                    allowedUser: ['other_individual_id'],
                    allowedEmails: ['vip.external@gmail.com']
                }
            }
        ];

        // Current user in store is u1 (org_it + role_student), NOT in allowedUser or allowedEmails
        const wrapper = mountFormTables(forms, []);
        const rows = wrapper.vm.tableData;
        expect(rows).toHaveLength(1);
        expect(rows[0]._id).toBe('f_union');
        expect(rows[0].canEnter).toBe(true);
        expect(rows[0].cta.label).toBe('Start');
        expect(rows[0].cta.disabled).toBe(false);
    });

    test('orders unsubmitted forms before completed ones by urgency without header sort controls', () => {
        const forms = [
            {
                _id: 'f_done_late',
                title: [{ key: 'en', value: 'Beta Completed Later' }],
                schedule: { startAt: daysFromNow(-2), endAt: daysFromNow(30) },
                organization: ['org_gen'],
                creator: 'creator1',
                settings: {}
            },
            {
                _id: 'f_done_soon',
                title: [{ key: 'en', value: 'Alpha Completed Sooner' }],
                schedule: { startAt: daysFromNow(-3), endAt: daysFromNow(10) },
                organization: ['org_gen'],
                creator: { _id: 'c2', name: 'Dr. Malee', organization: 'org_gen' },
                settings: {}
            },
            {
                _id: 'f_pending_open',
                title: [{ key: 'en', value: 'Gamma Pending Always' }],
                schedule: { startAt: daysFromNow(-1), endAt: null },
                organization: ['org_gen'],
                creator: 'creator1',
                settings: {}
            },
            {
                _id: 'f_progress_open',
                title: [{ key: 'en', value: 'Delta In Progress Always' }],
                schedule: { startAt: daysFromNow(-4), endAt: null },
                organization: ['org_gen'],
                creator: 'creator1',
                settings: {}
            },
            {
                _id: 'f_pending_urgent',
                title: [{ key: 'en', value: 'Epsilon Pending Closing Soon' }],
                schedule: { startAt: daysFromNow(-2), endAt: daysFromNow(2) },
                organization: ['org_gen'],
                creator: 'creator1',
                settings: {}
            }
        ];
        const responses = [
            { _id: 'r_done_1', form: 'f_done_late', responder: 'u1', submit: true, answers: [] },
            { _id: 'r_done_2', form: 'f_done_soon', responder: 'u1', submit: true, answers: [] },
            { _id: 'r_prog', form: 'f_progress_open', responder: 'u1', submit: false, answers: [] }
        ];

        const wrapper = mountFormTables(forms, responses);

        // Default order: unsubmitted first (urgent closing-soon -> In Progress -> Pending), then completed (sooner deadline -> later deadline)
        expect(wrapper.vm.tableData.map(r => r._id)).toEqual([
            'f_pending_urgent',
            'f_progress_open',
            'f_pending_open',
            'f_done_soon',
            'f_done_late'
        ]);
        expect(wrapper.vm.sorterValue).toBeUndefined();
    });
});
