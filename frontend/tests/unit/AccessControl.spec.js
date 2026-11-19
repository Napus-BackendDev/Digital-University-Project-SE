import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from 'vue';

jest.doMock('vue-select/dist/vue-select.css', () => ({}));
const AccessControl = require('@/projects/components/context/AccessControl.vue').default;

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
    CIcon: { template: '<i />' },
    'v-select': {
        props: ['value', 'options'],
        template: '<div class="v-select-stub" />'
    }
};

describe('AccessControl.vue tokenized chip & live typeahead collaborator input', () => {
    const sampleUsers = [
        {
            _id: 'u_plum',
            name: 'Plum Thidarat',
            email: 'plum@lamduan.mfu.ac.th',
            picture: 'https://example.com/plum.jpg'
        },
        {
            _id: 'u_teacher',
            name: 'Teacher QA',
            email: 'teacher.qa@mfu.ac.th',
            picture: null
        }
    ];

    const sampleRoles = [
        { _id: 'role_editor', title: [{ key: 'th', value: 'ผู้แก้ไข' }] },
        { _id: 'role_viewer', title: [{ key: 'th', value: 'ผู้มีสิทธิ์ดูข้อมูล' }] }
    ];

    function mountAccessControl(initialCollaborators = [], users = sampleUsers) {
        const store = new Vuex.Store({
            modules: {
                User: {
                    namespaced: true,
                    getters: { users: () => users },
                    actions: { getAll: jest.fn() }
                },
                Setting: {
                    namespaced: true,
                    getters: { lang: () => 'th' },
                    modules: {
                        collaborator: {
                            namespaced: true,
                            getters: { item: () => sampleRoles },
                            actions: { get: jest.fn() }
                        }
                    }
                }
            }
        });

        const settings = Vue.observable({
            collaborator: initialCollaborators
        });

        const wrapper = mount(AccessControl, {
            localVue,
            store,
            propsData: { settings },
            stubs: commonStubs,
            mocks: {
                $t: (key, params) => {
                    if (params && params.email) return `${key}:${params.email}`;
                    if (params && params.emails) return `${key}:${params.emails}`;
                    return key;
                },
                $i18n: { locale: 'th' }
            }
        });

        return { wrapper, settings };
    }

    test('hides suggestion popup when empty and shows matching "did you mean?" options while typing', async () => {
        const { wrapper } = mountAccessControl();

        const input = wrapper.find('[data-test="collaborator-email-input"]');
        expect(input.exists()).toBe(true);
        expect(wrapper.find('datalist').exists()).toBe(false);
        expect(wrapper.findAll('.v-select-stub').length).toBe(1);

        // Focusing empty box does not open any full-list dropdown
        await input.trigger('focus');
        expect(wrapper.find('[data-test="collaborator-suggestions"]').exists()).toBe(false);

        // Typing name/email shows at most 5 matching users even if more exist; clicking locks pill chip and clears text
        const manyUsersWrapper = mountAccessControl([], Array.from({ length: 8 }, (_, idx) => ({
            _id: `u_${idx}`,
            name: `Na User ${idx + 1}`,
            email: `na${idx + 1}@mfu.ac.th`
        }))).wrapper;
        const manyInput = manyUsersWrapper.find('[data-test="collaborator-email-input"]');
        await manyInput.setValue('na');
        expect(manyUsersWrapper.findAll('[data-test="collaborator-suggestion-item"]').length).toBe(5);
        manyUsersWrapper.destroy();

        await input.setValue('plum');
        const rows = wrapper.findAll('[data-test="collaborator-suggestion-item"]');
        expect(rows.length).toBe(1);
        expect(rows.at(0).text()).toContain('Plum Thidarat');
        expect(rows.at(0).text()).toContain('plum@lamduan.mfu.ac.th');

        await rows.at(0).trigger('mousedown');
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(1);
        expect(wrapper.find('[data-test="pending-collaborator-chip"]').text()).toContain('Plum Thidarat');
        expect(input.element.value).toBe('');
        expect(wrapper.find('[data-test="collaborator-suggestions"]').exists()).toBe(false);
    });

    test('locks unregistered email via Spacebar into pill chip, keeps typing next person, and saves both on Add', async () => {
        const { wrapper, settings } = mountAccessControl();
        wrapper.vm.newCollaborator.type = 'role_editor';

        const input = wrapper.find('[data-test="collaborator-email-input"]');
        await input.trigger('focus');

        // 1. Type an email NOT in DB -> shows manual option, Spacebar locks it as a chip & clears cursor
        await input.setValue('saranjit.kh@summitthai.com');
        expect(wrapper.find('[data-test="collaborator-manual-option"]').exists()).toBe(true);

        await input.trigger('keydown', { key: ' ' });
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(1);
        expect(wrapper.find('[data-test="pending-collaborator-chip"]').text()).toContain('saranjit.kh@summitthai.com');
        expect(input.element.value).toBe('');

        // 2. Multi-word name search preserves Spacebar so user can type "Teacher QA" and press Enter
        await input.setValue('Teacher');
        await input.trigger('keydown', { key: ' ' });
        await input.setValue('Teacher QA');
        expect(wrapper.findAll('[data-test="collaborator-suggestion-item"]').length).toBe(1);

        await input.trigger('keydown', { key: 'Enter' });
        const chips = wrapper.findAll('[data-test="pending-collaborator-chip"]');
        expect(chips.length).toBe(2);
        expect(input.element.value).toBe('');

        // 3. Submit locked chips via Add button -> saves both DB user & manual email
        const addBtn = wrapper.findAll('button').filter(b => b.text().trim() === 'editor.settings.access.add').at(0);
        await addBtn.trigger('click');

        expect(settings.collaborator).toEqual([
            {
                user: { email: 'saranjit.kh@summitthai.com', name: 'saranjit.kh@summitthai.com' },
                email: 'saranjit.kh@summitthai.com',
                type: 'role_editor'
            },
            {
                user: 'u_teacher',
                type: 'role_editor'
            }
        ]);
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(0);
        expect(wrapper.emitted('auto-save').length).toBe(1);
    });

    test('supports Backspace / remove-button on locked chips and saves valid query directly on Add without Spacebar first', async () => {
        const { wrapper, settings } = mountAccessControl();
        wrapper.vm.newCollaborator.type = 'role_viewer';

        const input = wrapper.find('[data-test="collaborator-email-input"]');
        await input.setValue('plum@lamduan.mfu.ac.th');
        await input.trigger('keydown', { key: ' ' });
        await input.setValue('external@gmail.com');
        await input.trigger('keydown', { key: ' ' });
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(2);

        // Backspace on empty input pops last locked chip
        await input.trigger('keydown', { key: 'Backspace' });
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(1);

        // Remove first chip via its X button
        await wrapper.find('[data-test="remove-pending-chip"]').trigger('click');
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(0);

        // Direct free-text email added immediately when clicking Add (no Spacebar needed)
        await input.setValue('direct.new@gmail.com');
        const addBtn = wrapper.findAll('button').filter(b => b.text().trim() === 'editor.settings.access.add').at(0);
        await addBtn.trigger('click');

        // Trailing space via IME / input composition also locks valid email and resets box to ""
        await input.setValue('ime.user@gmail.com ');
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(1);
        expect(input.element.value).toBe('');
        await wrapper.find('[data-test="remove-pending-chip"]').trigger('click');

        expect(settings.collaborator).toEqual([
            {
                user: { email: 'direct.new@gmail.com', name: 'direct.new@gmail.com' },
                email: 'direct.new@gmail.com',
                type: 'role_viewer'
            }
        ]);
        expect(wrapper.emitted('auto-save').length).toBe(1);
    });

    test('shows inline error on invalid text while saving locked valid chips, and deduplicates saved collaborators', async () => {
        const { wrapper, settings } = mountAccessControl([
            { user: 'u_plum', type: 'role_editor' }
        ]);
        wrapper.vm.newCollaborator.type = 'role_viewer';

        const input = wrapper.find('[data-test="collaborator-email-input"]');

        // Duplicate existing collaborator shows already-added hint and does not emit redundant auto-save
        await input.setValue('plum@lamduan.mfu.ac.th');
        expect(wrapper.find('[data-test="collaborator-already-added-hint"]').exists()).toBe(true);
        await input.trigger('keydown', { key: ' ' });
        expect(wrapper.findAll('[data-test="pending-collaborator-chip"]').length).toBe(0);

        // Lock one new external email then leave invalid token in text and click Add
        await input.setValue('outside@gmail.com');
        await input.trigger('keydown', { key: ' ' });
        await input.setValue('not-an-email');

        const addBtn = wrapper.findAll('button').filter(b => b.text().trim() === 'editor.settings.access.add').at(0);
        await addBtn.trigger('click');

        expect(settings.collaborator).toHaveLength(2);
        expect(wrapper.emitted('auto-save').length).toBe(1);
        expect(wrapper.find('[data-test="collaborator-email-error"]').text()).toContain('not-an-email');
        expect(wrapper.find('[data-test="collaborator-suggestions"]').exists()).toBe(false);
        expect(input.element.value).toBe('not-an-email');
    });
});
