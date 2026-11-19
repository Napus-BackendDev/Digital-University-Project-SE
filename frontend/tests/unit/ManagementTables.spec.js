import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import ManagementTables from '@/projects/components/tables/ManagementTables.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

const tableStubs = {
    FilterTable: { template: '<div />' },
    Pagination: { template: '<div />' },
    EmptyState: { template: '<div />' },
    TableLoading: { template: '<div />' },
    CIcon: { props: ['name'], template: '<i :data-icon="name" />' },
    CDropdown: {
        template: '<div class="c-dropdown-stub"><slot name="toggler-content" /><slot /></div>'
    },
    CDropdownItem: { template: '<div class="c-dropdown-item-stub" @click="$emit(\'click\', $event)"><slot /></div>' },
    CDataTable: {
        props: ['items', 'fields'],
        template: `
            <div class="c-datatable-stub">
                <div class="fields-count">{{ fields.length }}</div>
                <div v-for="(item, idx) in items" :key="item._id || idx" class="row-stub">
                    <slot name="title" :item="item" />
                    <slot name="access" :item="item" />
                    <slot name="responses" :item="item" />
                    <slot name="createBy" :item="item" />
                    <slot name="collaborators" :item="item" />
                    <slot name="responseSettings" :item="item" />
                    <slot name="actions" :item="item" />
                </div>
            </div>
        `
    }
};

function mountTable(items = []) {
    const store = new Vuex.Store({
        modules: {
            Forms: { namespaced: true, getters: { forms: () => items } },
            User: {
                namespaced: true,
                getters: {
                    user: () => ({ _id: 'u1', email: 'owner@mfu.ac.th', role: { title: 'Staff' } }),
                    users: () => [
                        { _id: 'u1', name: 'Owner User', email: 'owner@mfu.ac.th' },
                        { _id: 'u2', name: 'Alice', email: 'alice@mfu.ac.th' },
                        { _id: 'u3', name: 'Bob', email: 'bob@mfu.ac.th' }
                    ]
                }
            },
            Organizations: {
                namespaced: true,
                getters: {
                    organizations: () => [
                        { _id: 'org_gen', title: [{ key: 'en', value: 'General' }] },
                        { _id: 'org_it', title: [{ key: 'en', value: 'School of IT' }] }
                    ]
                }
            },
            Responses: { namespaced: true, getters: { responses: () => [] } },
            Setting: { namespaced: true, getters: { lang: () => 'en' } },
            dialog: { namespaced: true, getters: { isCode: () => '' } }
        }
    });
    store.dispatch = jest.fn(() => Promise.resolve());

    return shallowMount(ManagementTables, {
        localVue,
        store,
        propsData: { items, loading: false },
        stubs: tableStubs,
        directives: {
            'c-tooltip': () => {}
        },
        mocks: {
            $t: (key, params) => {
                const map = {
                    'table.orgUnit': 'Orgs',
                    'table.userUnit': 'Users',
                    'table.roleUnit': 'Roles',
                    'table.settingTooltips.requireLogin': 'Sign-in required',
                    'table.settingTooltips.limitResponse': 'Limit to 1 response',
                    'table.settingTooltips.allowEditAfterSubmit': 'Allow edit after submit',
                    'table.settingTooltips.maxResponses': `Quota limit: ${params && params.count}`,
                    'table.settingTooltips.emailNotifications': 'Email respondent',
                    'table.settingTooltips.notifyCreator': 'Notify creator',
                    'table.accessGroups.orgs': 'Organizations',
                    'table.accessGroups.users': 'Authorized Users',
                    'table.accessGroups.roles': 'Authorized Roles',
                    'accessLabel.public': 'Public',
                    'accessLabel.private': 'Private'
                };
                return map[key] || (params ? `${key}:${JSON.stringify(params)}` : key);
            },
            $te: (key) => ['accessLabel.public', 'accessLabel.private'].includes(key),
            $i18n: { locale: 'en' }
        }
    });
}

describe('ManagementTables.vue compact table layout', () => {
    test('guards non-array items prop gracefully without throwing', () => {
        const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const wrapper = mountTable({ code: 40100, message: 'Unauthorized' });
            expect(wrapper.vm.tableData).toEqual([]);
        } finally {
            warnSpy.mockRestore();
        }
    });

    test('defines 9 columns including responseSettings before actions', () => {
        const wrapper = mountTable([]);
        const keys = wrapper.vm.fields.map(f => f.key);
        expect(keys).toEqual([
            'title',
            'access',
            'timeRange',
            'status',
            'responses',
            'createBy',
            'collaborators',
            'responseSettings',
            'actions'
        ]);
    });

    test('unifies Access, Collaborators, Response Settings (6 rules), and 3-dot Actions', () => {
        const sampleForms = [
            {
                _id: 'f_full',
                title: [{ key: 'en', value: 'Course Satisfaction Survey' }],
                creator: { _id: 'u1', name: 'Owner User', email: 'owner@mfu.ac.th' },
                organization: ['org_gen'],
                collaborator: [
                    { user: 'u1', type: { title: [{ key: 'en', value: 'Editor' }] } },
                    { user: 'u2', type: { title: [{ key: 'en', value: 'Editor' }] } },
                    { user: 'u3', type: { title: [{ key: 'en', value: 'Viewer' }] } }
                ],
                settings: {
                    allowedUser: ['u2', 'u3'],
                    allowedRoles: [{ name: 'Student' }, { name: 'Lecturer' }],
                    requireLogin: true,
                    limitResponse: true,
                    allowEditAfterSubmit: false,
                    maxResponses: 100,
                    emailNotifications: true,
                    notifyCreator: false
                },
                schedule: { startAt: '2026-11-01T00:00:00.000Z', endAt: '2026-12-30T00:00:00.000Z' },
                responses: []
            },
            {
                _id: 'f_viewer_only',
                title: [{ key: 'en', value: 'Simple Private Draft' }],
                creator: { _id: 'u2', name: 'Alice', email: 'alice@mfu.ac.th' },
                organization: [],
                collaborator: [
                    { user: 'u1', type: { title: [{ key: 'en', value: 'Viewer' }] } }
                ],
                settings: {},
                responses: []
            }
        ];

        const wrapper = mountTable(sampleForms);
        const rows = wrapper.vm.tableData;
        expect(rows).toHaveLength(2);

        // Row 1: Unified Access -> Public · 2 Users · 2 Roles, grouped orgs/users/roles
        expect(rows[0].accessSummary.hasDropdown).toBe(true);
        expect(rows[0].accessSummary.label).toBe('Public · 2 Users · 2 Roles');
        expect(rows[0].accessSummary.orgs).toEqual(['Public']);
        expect(rows[0].accessSummary.users).toHaveLength(2);
        expect(rows[0].accessSummary.roles).toEqual(['Student', 'Lecturer']);

        // Row 1: Unified Collaborators -> 2 Editors · 1 Viewer
        expect(rows[0].collaboratorSummary.editors).toBe(2);
        expect(rows[0].collaboratorSummary.viewers).toBe(1);

        // Row 1: Response Settings -> renders only the 4 active rule icons with concise tooltips
        expect(rows[0].activeResponseRules.map(r => r.key)).toEqual([
            'requireLogin',
            'limitResponse',
            'maxResponses',
            'emailNotifications'
        ]);
        const quotaRule = rows[0].activeResponseRules.find(r => r.key === 'maxResponses');
        expect(quotaRule.valueText).toBe('100');
        expect(quotaRule.tooltip).toBe('Quota limit: 100');

        // Row 2: Private form with 0 active rules and Viewer-only permission
        expect(rows[1].accessSummary.hasDropdown).toBe(false);
        expect(rows[1].accessSummary.label).toBe('Private');
        expect(rows[1].activeResponseRules).toEqual([]);
        expect(rows[1].canEdit).toBe(false);

        const rowStubs = wrapper.findAll('.row-stub');
        // Row 1 renders 4 mini-icons in a 3-column grid; Row 2 renders 0 mini-icons ('-')
        expect(rowStubs.at(0).findAll('.setting-icon-badge')).toHaveLength(4);
        expect(rowStubs.at(0).find('.response-icons-grid').exists()).toBe(true);
        expect(rowStubs.at(0).findAll('.setting-icon-badge').at(0).attributes('title')).toBe('Sign-in required');
        expect(rowStubs.at(1).findAll('.setting-icon-badge')).toHaveLength(0);
        // Title wrapping box, no-wrap responses lines, and omitted placeholder '-' description
        expect(rowStubs.at(0).find('.mgmt-form-title').text()).toBe('Course Satisfaction Survey');
        expect(rowStubs.at(0).find('.mgmt-form-desc').exists()).toBe(false);
        expect(rowStubs.at(0).findAll('.response-stat-line')).toHaveLength(2);
        // Row 1 kebab menu has 4 actions (Preview, Duplicate, Edit, Delete)
        expect(rowStubs.at(0).find('.actions-menu-list').findAll('.c-dropdown-item-stub')).toHaveLength(4);
        // Row 2 Viewer-only kebab menu has only 1 action (Preview)
        expect(rowStubs.at(1).find('.actions-menu-list').findAll('.c-dropdown-item-stub')).toHaveLength(1);
    });
});
