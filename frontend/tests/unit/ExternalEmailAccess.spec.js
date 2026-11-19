import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from 'vue';
import Login from '@/projects/views/Login.vue';
import { getFormAccessLabels, getFormTargetUsers } from '@/projects/utils/analytics';

jest.doMock('vue-select/dist/vue-select.css', () => ({}));
const OrganizationControl = require('@/projects/components/context/OrganizationControl.vue').default;

const localVue = createLocalVue();
localVue.use(Vuex);

const commonStubs = {
    CCard: { template: '<div><slot /></div>' },
    CCardBody: { template: '<div><slot /></div>' },
    CRow: { template: '<div><slot /></div>' },
    CCol: { template: '<div><slot /></div>' },
    CButton: {
        template: '<button type="button" v-on="$listeners"><slot /></button>'
    },
    CContainer: { template: '<div><slot /></div>' },
    CAlert: { template: '<div><slot /></div>' },
    CSpinner: { template: '<span />' },
    CIcon: { template: '<i />' }
};

describe('External email access control & external Google login', () => {
    function mountOrgControl(initialSettings = {}, { organizations = [], roles = [], users = [], organization = [] } = {}) {
        const store = new Vuex.Store({
            modules: {
                Organizations: {
                    namespaced: true,
                    getters: { organizations: () => organizations },
                    actions: { getAll: jest.fn() }
                },
                User: {
                    namespaced: true,
                    getters: { users: () => users },
                    actions: { getAll: jest.fn() }
                },
                Roles: {
                    namespaced: true,
                    getters: { roles: () => roles },
                    actions: { getAll: jest.fn() }
                }
            }
        });

        const settings = Vue.observable({
            organization,
            settings: {
                allowedUser: [],
                allowedEmails: [],
                allowedRoles: [],
                ...initialSettings
            }
        });

        const wrapper = mount(OrganizationControl, {
            localVue,
            store,
            propsData: { settings },
            stubs: {
                ...commonStubs,
                'v-select': { template: '<div class="v-select-stub" />' }
            },
            mocks: {
                $t: (key, params) => (params && params.emails ? `${key}:${params.emails}` : (params && params.email ? `${key}:${params.email}` : key)),
                $i18n: { locale: 'th' }
            }
        });

        return { wrapper, settings };
    }

    test('OrganizationControl unifies university directory search and external email input into one tokenized typeahead box', async () => {
        const users = [
            { _id: 'u_plum', name: 'Plum Thidarat', email: 'plum@lamduan.mfu.ac.th', picture: null }
        ];
        const { wrapper, settings } = mountOrgControl({ accessMode: 'private' }, { users });
        const input = wrapper.find('[data-test="allowed-user-email-input"]');
        const addBtn = wrapper.find('[data-test="add-allowed-people-btn"]');
        expect(input.exists()).toBe(true);
        // No separate user dropdown + separate external email input
        expect(wrapper.find('[data-test="external-email-input"]').exists()).toBe(false);

        // 1. Search university directory user via typeahead and lock into pill chip
        await input.trigger('focus');
        await input.setValue('plum');
        const suggestions = wrapper.findAll('[data-test="allowed-user-suggestion-item"]');
        expect(suggestions.length).toBe(1);
        await suggestions.at(0).trigger('mousedown');
        expect(wrapper.findAll('[data-test="pending-respondent-chip"]').length).toBe(1);

        // 2. Lock an external email via Spacebar in the same box, then type mixed valid + invalid and click Add
        await input.setValue('parent@gmail.com');
        await input.trigger('keydown', { key: ' ' });
        expect(wrapper.findAll('[data-test="pending-respondent-chip"]').length).toBe(2);

        await input.setValue('alumni@gmail.com, not-an-email, parent@gmail.com');
        await addBtn.trigger('click');

        expect(settings.settings.allowedUser.map(u => String(u._id || u))).toEqual(['u_plum']);
        expect(settings.settings.allowedEmails).toEqual(['parent@gmail.com', 'alumni@gmail.com']);
        expect(wrapper.find('[data-test="allowed-user-email-error"]').text()).toContain('not-an-email');
        expect(wrapper.findAll('[data-test="allowed-user-chip"]').length).toBe(1);
        expect(wrapper.findAll('[data-test="external-email-chip"]').length).toBe(2);
        expect(wrapper.emitted('auto-save').length).toBe(1);

        // Fix invalid input and add another valid email directly
        await input.setValue('guest.speaker@outlook.com');
        await addBtn.trigger('click');
        expect(settings.settings.allowedEmails).toEqual([
            'parent@gmail.com',
            'alumni@gmail.com',
            'guest.speaker@outlook.com'
        ]);
        expect(wrapper.find('[data-test="allowed-user-email-error"]').exists()).toBe(false);

        // Remove middle external chip
        const deleteIcons = wrapper.findAll('[data-test="external-email-chip"] .delete-icon-wrapper');
        await deleteIcons.at(1).trigger('click');
        expect(settings.settings.allowedEmails).toEqual([
            'parent@gmail.com',
            'guest.speaker@outlook.com'
        ]);
    });

    test('Login.vue advertises external Google/Gmail login when arriving from a form link or allowExternal=1', () => {
        const externalLoginWrapper = shallowMount(Login, {
            localVue,
            stubs: commonStubs,
            mocks: {
                $i18n: { locale: 'th' },
                $route: { query: { redirect: '/forms/form-123', allowExternal: '1' } },
                $router: { push: jest.fn() }
            },
            created() {}
        });
        expect(externalLoginWrapper.vm.isExternalFormLogin).toBe(true);
        expect(externalLoginWrapper.find('[data-test="external-gmail-badge"]').exists()).toBe(true);

        const standardLoginWrapper = shallowMount(Login, {
            localVue,
            stubs: commonStubs,
            mocks: {
                $i18n: { locale: 'th' },
                $route: { query: {} },
                $router: { push: jest.fn() }
            },
            created() {}
        });
        expect(standardLoginWrapper.vm.isExternalFormLogin).toBe(false);
        expect(standardLoginWrapper.find('[data-test="external-gmail-badge"]').exists()).toBe(false);
    });

    test('analytics helpers include external allowedEmails in access summary and target user count without duplicating DB users', () => {
        const users = [
            { _id: 'u1', name: 'Parent Registered', email: 'parent@gmail.com' }
        ];
        const form = {
            organization: [],
            settings: {
                allowedUser: ['u1'],
                allowedEmails: ['parent@gmail.com', 'new.alumni@gmail.com']
            }
        };

        const summary = getFormAccessLabels(form, { users, organizations: [], locale: 'en' });
        expect(summary.access).toEqual([
            'Private',
            'Personal: Parent Registered',
            'Personal: new.alumni@gmail.com'
        ]);

        const targets = getFormTargetUsers(form, users, []);
        expect(targets.targetCount).toBe(2);
        expect(targets.targetUsers.map(u => u.email)).toEqual(['parent@gmail.com', 'new.alumni@gmail.com']);
    });

    test('OrganizationControl nests allowedRoles strictly under selected Organization and clears roles when last org is removed', async () => {
        const organizations = [{ _id: 'org_sci', title: [{ key: 'th', value: 'สำนักวิชาวิทยาศาสตร์' }] }];
        const roles = [{ _id: 'role_student', title: [{ key: 'th', value: 'นักศึกษา (Student)' }] }];

        const { wrapper, settings } = mountOrgControl({ accessMode: 'private' }, { organizations, roles, organization: [] });

        // Without selected organizations, role section shows locked hint and addRole is blocked
        const panel = wrapper.find('[data-test="org-bound-role-panel"]');
        expect(panel.exists()).toBe(true);
        expect(wrapper.find('[data-test="role-requires-org-hint"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="add-role-btn"]').exists()).toBe(false);

        wrapper.vm.newRoleId = ['role_student'];
        wrapper.vm.addRole();
        expect(settings.settings.allowedRoles).toEqual([]);

        // Select an organization -> role selector unlocks inside org panel with scoped org label
        wrapper.vm.selectedOrgId = ['org_sci'];
        wrapper.vm.addOrganization();
        await wrapper.vm.$nextTick();

        expect(wrapper.find('[data-test="role-requires-org-hint"]').exists()).toBe(false);
        expect(panel.text()).toContain('สำนักวิชาวิทยาศาสตร์');
        expect(wrapper.find('[data-test="add-role-btn"]').exists()).toBe(true);

        wrapper.vm.newRoleId = ['role_student'];
        await wrapper.find('[data-test="add-role-btn"]').trigger('click');
        expect(settings.settings.allowedRoles).toHaveLength(1);
        expect(wrapper.findAll('[data-test="allowed-role-chip"]').length).toBe(1);

        // Removing the last organization automatically clears bound allowedRoles
        wrapper.vm.removeOrganization(0);
        await wrapper.vm.$nextTick();
        expect(settings.organization).toEqual([]);
        expect(settings.settings.allowedRoles).toEqual([]);
        expect(wrapper.find('[data-test="role-requires-org-hint"]').exists()).toBe(true);
    });

    test('OrganizationControl separates Private (locked collectEmail + MFU) from Public (anonymous vs all-email) and preserves Private selections on toggle', async () => {
        const organizations = [{ _id: 'org_sci', title: [{ key: 'th', value: 'สำนักวิชาวิทยาศาสตร์' }] }];
        const roles = [{ _id: 'role_student', title: [{ key: 'th', value: 'นักศึกษา (Student)' }] }];

        const { wrapper, settings } = mountOrgControl(
            {
                accessMode: 'private',
                collectEmail: true,
                requireLogin: false,
                allowedRoles: ['role_student'],
                allowedUser: ['u_1'],
                allowedEmails: ['guest@gmail.com']
            },
            { organizations, roles, organization: ['org_sci'] }
        );

        // Private mode renders org/role/user panel without the removed redundant locked-email banner, and keeps collectEmail=true
        expect(wrapper.find('[data-test="private-access-panel"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="private-collect-email-locked"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="public-access-panel"]').exists()).toBe(false);

        // Switch to Public -> hides org/role/user panel without duplicate sub-cards, PRESERVES data in settings, and syncs collectEmail with requireLogin
        await wrapper.find('[data-test="access-mode-public"]').trigger('click');
        expect(settings.settings.accessMode).toBe('public');
        expect(settings.settings.collectEmail).toBe(false);
        expect(settings.settings.requireLogin).toBe(false);
        expect(settings.organization).toEqual(['org_sci']);
        expect(settings.settings.allowedRoles).toEqual(['role_student']);
        expect(settings.settings.allowedUser).toEqual(['u_1']);
        expect(settings.settings.allowedEmails).toEqual(['guest@gmail.com']);
        expect(wrapper.find('[data-test="public-access-panel"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="public-open-info"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="public-email-anonymous"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="public-email-required"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="public-preserved-hint"]').exists()).toBe(true);

        // Switch back to Private -> restores Private panel with all preserved org/role/user values intact and locks collectEmail=true
        await wrapper.find('[data-test="access-mode-private"]').trigger('click');
        expect(settings.settings.accessMode).toBe('private');
        expect(settings.settings.collectEmail).toBe(true);
        expect(settings.settings.requireLogin).toBe(false);
        expect(wrapper.find('[data-test="private-access-panel"]').exists()).toBe(true);
        expect(settings.organization).toEqual(['org_sci']);
    });
});
