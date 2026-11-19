import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Toolbar from '@/projects/components/Tabs/Toolbar.vue';

jest.doMock('@/projects/components/Tabs/TabQuestion.vue', () => ({
    name: 'TabQuestion',
    template: '<div class="stub-q" />'
}));
jest.doMock('@/projects/components/Tabs/TabResponses.vue', () => ({
    name: 'TabResponses',
    template: '<div class="stub-r" />'
}));
jest.doMock('@/projects/components/Tabs/TabSetting.vue', () => ({
    name: 'TabSetting',
    template: '<div class="stub-s" />'
}));

const Tab = require('@/projects/components/Tabs/Tab.vue').default;
const CreateForm = require('@/projects/views/page/CreateForm.vue').default;

const localVue = createLocalVue();
localVue.use(Vuex);

const mocks = {
    $t: (key) => key,
    $te: () => false,
    $i18n: { locale: 'en' }
};

describe('Collaborator Viewer read-only drill-down', () => {
    const viewerUser = { _id: 'viewer1', role: { title: [{ key: 'en', value: 'Student' }] } };
    const editorUser = { _id: 'editor1', role: { title: [{ key: 'en', value: 'Student' }] } };
    const strangerUser = { _id: 'stranger1', role: { title: [{ key: 'en', value: 'Student' }] } };

    const sharedForm = {
        _id: 'form_shared_1',
        title: [{ key: 'en', value: 'Shared Evaluation' }],
        creator: { _id: 'creator1' },
        collaborator: [
            { user: { _id: 'viewer1' }, type: { title: [{ key: 'en', value: 'Viewer' }] } },
            { user: { _id: 'editor1' }, type: { title: [{ key: 'en', value: 'Editor' }] } }
        ]
    };

    test('Toolbar hides Questions and Settings buttons in readOnly mode while keeping Responses button', () => {
        const roWrapper = shallowMount(Toolbar, {
            localVue,
            propsData: { activeTab: 'response', form: sharedForm, readOnly: true },
            stubs: {
                CCol: { template: '<div><slot /></div>' },
                CCard: { template: '<div><slot /></div>' },
                CCardBody: { template: '<div><slot /></div>' },
                CButton: { template: '<button><slot /></button>' },
                CIcon: true,
                ButtonBack: true,
                ButtonPreview: true,
                CModal: true
            },
            mocks
        });

        expect(roWrapper.text()).toContain('toolbar.responses');
        expect(roWrapper.text()).not.toContain('toolbar.questions');
        expect(roWrapper.text()).not.toContain('toolbar.settings');

        const rwWrapper = shallowMount(Toolbar, {
            localVue,
            propsData: { activeTab: 'question', form: sharedForm, readOnly: false },
            stubs: {
                CCol: { template: '<div><slot /></div>' },
                CCard: { template: '<div><slot /></div>' },
                CCardBody: { template: '<div><slot /></div>' },
                CButton: { template: '<button><slot /></button>' },
                CIcon: true,
                ButtonBack: true,
                ButtonPreview: true,
                CModal: true
            },
            mocks
        });

        expect(rwWrapper.text()).toContain('toolbar.questions');
        expect(rwWrapper.text()).toContain('toolbar.responses');
        expect(rwWrapper.text()).toContain('toolbar.settings');
    });

    test('Toolbar renders a single Free Text button even when short_answer and paragraph both exist in questionTypes', () => {
        const wrapper = shallowMount(Toolbar, {
            localVue,
            propsData: {
                activeTab: 'question',
                form: sharedForm,
                readOnly: false,
                questionTypes: [
                    { _id: 'id_short', type: 'short_answer' },
                    { _id: 'id_para', type: 'paragraph' },
                    { _id: 'id_mc', type: 'multiple_choice' },
                    { _id: 'id_rate', type: 'rating' },
                    { _id: 'id_sec', type: 'section' }
                ]
            },
            stubs: {
                CCol: { template: '<div><slot /></div>' },
                CCard: { template: '<div><slot /></div>' },
                CCardBody: { template: '<div><slot /></div>' },
                CButton: { template: '<button><slot /></button>' },
                CIcon: true,
                ButtonBack: true,
                ButtonPreview: true,
                CModal: true
            },
            mocks: {
                ...mocks,
                $t: (key) => ({ 'types.free_text': 'Free Text', 'types.multiple_choice': 'Multiple Choice', 'types.rating': 'Rating', 'types.section': 'Section Divider' }[key] || key),
                $te: (key) => ['types.free_text', 'types.multiple_choice', 'types.rating', 'types.section'].includes(key)
            }
        });

        const typeButtons = wrapper.findAll('.toolbar-scroll-area .type-btn');
        // 3 question types (Free Text, Multiple Choice, Rating) + 3 content elements (section, title_description, image)
        expect(typeButtons.length).toBe(6);
        expect(wrapper.text()).toContain('Free Text');
        expect(wrapper.text().match(/Free Text/g).length).toBe(1);
        expect(wrapper.text()).toContain('Section Divider');
        expect(wrapper.text().match(/Section Divider/g).length).toBe(1);
        expect(wrapper.text()).not.toContain('Short Answer');
        expect(wrapper.text()).not.toContain('Paragraph');
    });

    test('Toolbar manages form languages above questionTypes and emits add/remove events', async () => {
        const wrapper = shallowMount(Toolbar, {
            localVue,
            propsData: {
                activeTab: 'question',
                form: sharedForm,
                readOnly: false,
                activeLanguages: ['en', 'th'],
                questionTypes: [{ _id: 'id_mc', type: 'multiple_choice' }]
            },
            stubs: {
                CCol: { template: '<div><slot /></div>' },
                CCard: { template: '<div><slot /></div>' },
                CCardBody: { template: '<div><slot /></div>' },
                CButton: { template: '<button v-on="$listeners"><slot /></button>' },
                CDropdown: { template: '<div class="dropdown-stub"><slot name="toggler" /><slot /></div>' },
                CDropdownItem: { template: '<button class="dd-item-stub" v-on="$listeners"><slot /></button>' },
                CDropdownDivider: true,
                CIcon: true,
                ButtonBack: true,
                ButtonPreview: true,
                CModal: true
            },
            mocks
        });

        const text = wrapper.text();
        expect(text.indexOf('toolbar.formLanguages')).toBeGreaterThan(-1);
        expect(text.indexOf('toolbar.formLanguages')).toBeLessThan(text.indexOf('toolbar.questionTypes'));
        expect(wrapper.findAll('.toolbar-lang-row').length).toBe(2);
        expect(text).toContain('English (EN)');
        expect(text).toContain('ไทย (TH)');

        await wrapper.find('.toolbar-lang-remove-btn').trigger('click');
        expect(wrapper.emitted('remove-language')[0]).toEqual(['en']);

        const presetBtn = wrapper.findAll('.dd-item-stub').at(0);
        await presetBtn.trigger('click');
        expect(wrapper.emitted('add-language')[0]).toEqual(['cn']);
    });

    test('Tab blocks switching or rendering TabQuestion/TabSetting when readOnly is true', () => {
        const store = new Vuex.Store({
            modules: {
                'Setting/question_type': {
                    namespaced: true,
                    actions: { get: jest.fn() },
                    getters: { item: () => [] }
                }
            }
        });

        const wrapper = shallowMount(Tab, {
            localVue,
            store,
            propsData: { form: sharedForm, activeTab: 'question', readOnly: true },
            stubs: {
                CRow: { template: '<div><slot /></div>' },
                CCol: { template: '<div><slot /></div>' },
                TabQuestion: { template: '<div class="stub-q" />' },
                TabResponses: { template: '<div class="stub-r" />' },
                TabSetting: { template: '<div class="stub-s" />' },
                Toolbar: true
            },
            mocks
        });

        expect(wrapper.find('.stub-r').exists()).toBe(false);
        expect(wrapper.find('.stub-q').exists()).toBe(false);
        expect(wrapper.find('.stub-s').exists()).toBe(false);

        wrapper.vm.triggerAutoSave();
        expect(wrapper.emitted('auto-save')).toBeUndefined();
    });

    test('CreateForm allows Collaborator Viewer on response tab read-only, keeps Editor editable, and redirects stranger', async () => {
        const mountForUser = async (currentUser, qTab = 'question') => {
            const updateSpy = jest.fn();
            const replaceSpy = jest.fn(() => Promise.resolve());
            const store = new Vuex.Store({
                modules: {
                    User: { namespaced: true, getters: { user: () => currentUser } },
                    Forms: {
                        namespaced: true,
                        actions: {
                            getById: jest.fn(() => Promise.resolve(sharedForm)),
                            update: updateSpy
                        },
                        mutations: { setDuplicateBuffer: jest.fn() },
                        getters: { duplicateBuffer: () => null }
                    }
                }
            });

            const wrapper = shallowMount(CreateForm, {
                localVue,
                store,
                stubs: { Header: true, Tab: true },
                mocks: {
                    ...mocks,
                    $route: { params: { _id: 'form_shared_1' }, query: { tab: qTab } },
                    $router: { replace: replaceSpy }
                }
            });
            await wrapper.vm.onInit();
            return { wrapper, updateSpy, replaceSpy };
        };

        // Viewer requesting ?tab=question is read-only, redirected to AnalyticsFormReport, and blocked from autosave
        const viewerRes = await mountForUser(viewerUser, 'question');
        expect(viewerRes.wrapper.vm.isReadOnlyViewer).toBe(true);
        expect(viewerRes.replaceSpy).toHaveBeenCalledWith({
            name: 'AnalyticsFormReport',
            params: { formId: 'form_shared_1' }
        });
        await viewerRes.wrapper.vm.triggerAutoSave();
        expect(viewerRes.updateSpy).not.toHaveBeenCalled();

        // Editor stays writable and renders directly without Wizard Mode toggle or stepper
        const editorRes = await mountForUser(editorUser, 'question');
        expect(editorRes.wrapper.vm.isReadOnlyViewer).toBe(false);
        expect(editorRes.wrapper.vm.activeTab).toBe('question');
        expect(editorRes.wrapper.find('[data-testid="wizard-toggle-btn"]').exists()).toBe(false);
        expect(editorRes.wrapper.find('formbuilderwizard-stub').exists()).toBe(false);
        expect(editorRes.wrapper.vm.$options.components.FormBuilderWizard).toBeUndefined();
        expect(editorRes.wrapper.find('tab-stub').exists()).toBe(true);

        // Unrelated user is redirected to ManageForms
        const strangerRes = await mountForUser(strangerUser, 'response');
        expect(strangerRes.replaceSpy).toHaveBeenCalledWith({ name: 'ManageForms' });
    });

    test('Hero Banner renders Publish button for Editor/Creator and publishes/unpublishes form via Forms/update', async () => {
        const draftForm = {
            ...sharedForm,
            schedule: { startAt: null, endAt: null }
        };
        const mountHero = async (currentUser) => {
            const updateSpy = jest.fn(() => Promise.resolve({}));
            const store = new Vuex.Store({
                modules: {
                    User: { namespaced: true, getters: { user: () => currentUser } },
                    Forms: {
                        namespaced: true,
                        actions: {
                            getById: jest.fn(() => Promise.resolve(JSON.parse(JSON.stringify(draftForm)))),
                            update: updateSpy
                        },
                        mutations: { setDuplicateBuffer: jest.fn() },
                        getters: { duplicateBuffer: () => null }
                    }
                }
            });
            const wrapper = shallowMount(CreateForm, {
                localVue,
                store,
                stubs: {
                    Header: { template: '<div class="header-stub"><slot name="actions" /></div>' },
                    Tab: true,
                    CButton: { template: '<button v-bind="$attrs" v-on="$listeners"><slot /></button>' },
                    CIcon: true,
                    CSpinner: true
                },
                mocks: {
                    ...mocks,
                    $route: { params: { _id: 'form_shared_1' }, query: { tab: 'question' } },
                    $router: { replace: jest.fn() }
                }
            });
            await wrapper.vm.onInit();
            await wrapper.vm.$nextTick();
            return { wrapper, updateSpy };
        };

        const viewerHero = await mountHero(viewerUser);
        expect(viewerHero.wrapper.find('.hero-publish-btn').exists()).toBe(false);
        viewerHero.wrapper.destroy();

        const editorHero = await mountHero(editorUser);
        expect(editorHero.wrapper.vm.isFormPublished).toBe(false);
        expect(editorHero.wrapper.find('.hero-publish-btn').exists()).toBe(true);

        await editorHero.wrapper.find('.hero-publish-btn').trigger('click');
        await editorHero.wrapper.vm.$nextTick();

        expect(editorHero.wrapper.vm.isFormPublished).toBe(true);
        expect(editorHero.updateSpy).toHaveBeenCalled();
        expect(editorHero.wrapper.find('.hero-status-pill.is-live').exists()).toBe(true);
        expect(editorHero.wrapper.find('.hero-unpublish-btn').exists()).toBe(true);

        // Wait for the 500ms save indicator transition before clicking unpublish
        await new Promise(resolve => setTimeout(resolve, 550));
        await editorHero.wrapper.vm.$nextTick();

        await editorHero.wrapper.find('.hero-unpublish-btn').trigger('click');
        await editorHero.wrapper.vm.$nextTick();
        expect(editorHero.wrapper.vm.isFormPublished).toBe(false);
        expect(editorHero.wrapper.find('.hero-publish-btn').exists()).toBe(true);

        // Wait for the 500ms save indicator transition before testing Publish again
        await new Promise(resolve => setTimeout(resolve, 550));
        await editorHero.wrapper.vm.$nextTick();

        // Empty end_only mode disables Publish quietly without cluttering Hero Banner with a warning box
        editorHero.wrapper.setData({
            formData: {
                ...editorHero.wrapper.vm.formData,
                schedule: { isPublished: false, mode: 'end_only', startAt: null, endAt: null }
            }
        });
        await editorHero.wrapper.vm.$nextTick();
        expect(editorHero.wrapper.vm.isPublishBlocked).toBe(true);
        expect(editorHero.wrapper.find('[data-testid="hero-publish-validation-error"]').exists()).toBe(false);

        // Selecting a past endAt disables Publish, shows validation banner, and rejects programmatic togglePublishForm()
        const pastEnd = '2020-01-01T00:00:00.000Z';
        editorHero.wrapper.setData({
            formData: {
                ...editorHero.wrapper.vm.formData,
                schedule: { isPublished: false, mode: 'end_only', startAt: null, endAt: pastEnd }
            }
        });
        await editorHero.wrapper.vm.$nextTick();

        expect(editorHero.wrapper.vm.isPublishBlocked).toBe(true);
        expect(editorHero.wrapper.find('.hero-publish-btn').attributes('disabled')).toBeTruthy();
        expect(editorHero.wrapper.find('[data-testid="hero-publish-validation-error"]').exists()).toBe(true);

        const callsBeforeBlocked = editorHero.updateSpy.mock.calls.length;
        await editorHero.wrapper.vm.togglePublishForm();
        expect(editorHero.wrapper.vm.isFormPublished).toBe(false);
        expect(editorHero.updateSpy.mock.calls.length).toBe(callsBeforeBlocked);

        // Fixing endAt to future enables Publish and auto-stamps startAt in end_only mode
        const futureEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        editorHero.wrapper.setData({
            formData: {
                ...editorHero.wrapper.vm.formData,
                schedule: { isPublished: false, mode: 'end_only', startAt: null, endAt: futureEnd }
            }
        });
        await editorHero.wrapper.vm.$nextTick();
        expect(editorHero.wrapper.vm.isPublishBlocked).toBe(false);

        await editorHero.wrapper.find('.hero-publish-btn').trigger('click');
        await editorHero.wrapper.vm.$nextTick();
        expect(editorHero.wrapper.vm.isFormPublished).toBe(true);
        expect(editorHero.wrapper.vm.formData.schedule.startAt).toBeTruthy();
        expect(editorHero.wrapper.vm.formData.schedule.endAt).toBe(futureEnd);
        editorHero.wrapper.destroy();
    });
});
