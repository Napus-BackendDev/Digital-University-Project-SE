import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Toolbar from '@/projects/components/Tabs/Toolbar.vue';
import FormReportDetails from '@/projects/components/analytics/FormReportDetails.vue';

jest.doMock('vue-select/dist/vue-select.css', () => ({}));
const Tab = require('@/projects/components/Tabs/Tab.vue').default;
const CreateForm = require('@/projects/views/page/CreateForm.vue').default;

const localVue = createLocalVue();
localVue.use(Vuex);

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

function createCreateFormStore({
    currentUser = { _id: 'u1', role: { title: [{ key: 'en', value: 'Admin' }] } },
    formDoc = { _id: 'form-abc-123', title: [{ key: 'en', value: 'Test Form' }] }
} = {}) {
    return new Vuex.Store({
        modules: {
            User: {
                namespaced: true,
                getters: {
                    user: () => currentUser,
                    users: () => [currentUser]
                }
            },
            Forms: {
                namespaced: true,
                actions: {
                    getById: jest.fn(() => Promise.resolve(formDoc)),
                    update: jest.fn(() => Promise.resolve({})),
                    create: jest.fn(() => Promise.resolve(formDoc))
                },
                mutations: {
                    setDuplicateBuffer: jest.fn()
                },
                getters: {
                    duplicateBuffer: () => null,
                    forms: () => [formDoc]
                }
            },
            Questions: {
                namespaced: true,
                actions: {
                    create: jest.fn(() => Promise.resolve({}))
                }
            },
            Organizations: {
                namespaced: true,
                getters: {
                    organizations: () => []
                }
            },
            Roles: {
                namespaced: true,
                getters: {
                    roles: () => []
                }
            },
            'Setting/question_type': {
                namespaced: true,
                actions: {
                    get: jest.fn()
                },
                getters: {
                    item: () => []
                }
            }
        }
    });
}

describe('Requirement 7.5 / B7-1 Separation of form management from statistics', () => {
    describe('Toolbar.vue responses navigation', () => {
        test('Responses button navigates to AnalyticsFormReport instead of switching tabs and emits target route', async () => {
            const routerPush = jest.fn().mockReturnValue(Promise.resolve());
            const store = createCreateFormStore();
            const wrapper = shallowMount(Toolbar, {
                localVue,
                store,
                propsData: {
                    form: { _id: 'form-abc-123', title: 'Customer Feedback' },
                    activeTab: 'question',
                    readOnly: false
                },
                mocks: {
                    $t: (k) => k,
                    $te: () => false,
                    $i18n: { locale: 'en' },
                    $router: { push: routerPush },
                    $route: { params: { _id: 'form-abc-123' } }
                },
                stubs: {
                    CButton: {
                        props: ['color', 'variant'],
                        template: '<button class="c-button" :data-variant="variant" @click="$emit(\'click\')"><slot /></button>'
                    },
                    CIcon: true,
                    CCard: true,
                    CCardBody: true,
                    CCol: true,
                    CModal: true,
                    ButtonBack: true,
                    ButtonPreview: true
                }
            });

            const responsesBtn = wrapper.find('[data-test="toolbar-responses-btn"]');
            expect(responsesBtn.exists()).toBe(true);

            await responsesBtn.trigger('click');

            const expectedTarget = {
                name: 'AnalyticsFormReport',
                params: { formId: 'form-abc-123' }
            };

            expect(routerPush).toHaveBeenCalledWith(expectedTarget);
            expect(wrapper.emitted('navigate-report')).toBeTruthy();
            expect(wrapper.emitted('navigate-report')[0][0]).toEqual(expectedTarget);
            expect(wrapper.emitted('update:activeTab')).toBeFalsy();
        });
    });

    describe('Tab.vue no longer renders TabResponses', () => {
        test('does not import, register, or render TabResponses component', async () => {
            const store = createCreateFormStore();
            const wrapper = shallowMount(Tab, {
                localVue,
                store,
                propsData: {
                    form: { _id: 'form-abc-123' },
                    activeTab: 'question',
                    readOnly: false
                },
                mocks: {
                    $t: (k) => k,
                    $te: () => false,
                    $i18n: { locale: 'en' }
                },
                stubs: {
                    CRow: { template: '<div><slot /></div>' },
                    CCol: { template: '<div><slot /></div>' },
                    TabQuestion: true,
                    TabSetting: true,
                    Toolbar: true
                }
            });

            expect(wrapper.vm.$options.components.TabResponses).toBeUndefined();
            expect(wrapper.find({ ref: 'tabResponses' }).exists()).toBe(false);

            wrapper.setProps({ activeTab: 'response', readOnly: true });
            await wrapper.vm.$nextTick();
            expect(wrapper.find({ ref: 'tabResponses' }).exists()).toBe(false);
            expect(wrapper.html()).not.toContain('tab-responses');
        });
    });

    describe('CreateForm.vue redirect behavior', () => {
        test('redirects requests with ?tab=response to AnalyticsFormReport', async () => {
            const routerReplace = jest.fn().mockReturnValue(Promise.resolve());
            const store = createCreateFormStore();
            const wrapper = shallowMount(CreateForm, {
                localVue,
                store,
                mocks: {
                    $t: (k) => k,
                    $te: () => false,
                    $i18n: { locale: 'en' },
                    $route: {
                        params: { _id: 'form-abc-123' },
                        query: { tab: 'response' }
                    },
                    $router: { replace: routerReplace }
                },
                stubs: {
                    Tab: true,
                    Header: true,
                    CButton: true,
                    CIcon: true,
                    CSpinner: true
                }
            });

            await flushPromises();
            await wrapper.vm.$nextTick();

            expect(routerReplace).toHaveBeenCalledWith({
                name: 'AnalyticsFormReport',
                params: { formId: 'form-abc-123' }
            });
            expect(wrapper.vm.activeTab).not.toBe('response');
            wrapper.destroy();
        });

        test('redirects readOnly viewer collaborator to AnalyticsFormReport', async () => {
            const routerReplace = jest.fn().mockReturnValue(Promise.resolve());
            const viewerUser = { _id: 'student-viewer-1', role: { title: [{ key: 'en', value: 'Student' }] } };
            const formDoc = {
                _id: 'form-abc-123',
                creator: { _id: 'creator-99' },
                collaborator: [
                    { user: { _id: 'student-viewer-1' }, type: { title: [{ key: 'en', value: 'Viewer' }] } }
                ]
            };
            const store = createCreateFormStore({ currentUser: viewerUser, formDoc });
            const wrapper = shallowMount(CreateForm, {
                localVue,
                store,
                mocks: {
                    $t: (k) => k,
                    $te: () => false,
                    $i18n: { locale: 'en' },
                    $route: {
                        params: { _id: 'form-abc-123' },
                        query: {}
                    },
                    $router: { replace: routerReplace }
                },
                stubs: {
                    Tab: true,
                    Header: true,
                    CButton: true,
                    CIcon: true,
                    CSpinner: true
                }
            });

            await wrapper.vm.onInit();
            await flushPromises();
            await wrapper.vm.$nextTick();

            expect(routerReplace).toHaveBeenCalledWith({
                name: 'AnalyticsFormReport',
                params: { formId: 'form-abc-123' }
            });
            wrapper.destroy();
        });
    });

    describe('FormReportDetails.vue respondent links', () => {
        test('links respondents with submitted or draft response to Response detail page', () => {
            const detailPayload = {
                questions: [],
                summary: {},
                results: [
                    {
                        _id: 'u1',
                        name: 'Somchai Prasert',
                        email: 'somchai@mfu.ac.th',
                        organization: 'School of IT',
                        submissionStatus: 'submitted',
                        responseId: 'resp-submitted-1',
                        startedAt: '2026-11-19T08:00:00Z',
                        submittedAt: '2026-11-19T08:30:00Z'
                    },
                    {
                        _id: 'u2',
                        name: 'Jane Doe',
                        email: 'jane@mfu.ac.th',
                        organization: 'School of Science',
                        submissionStatus: 'ongoing',
                        responseId: 'resp-ongoing-2',
                        startedAt: '2026-11-19T09:00:00Z',
                        submittedAt: null
                    },
                    {
                        _id: 'u3',
                        name: 'Pending User',
                        email: 'pending@mfu.ac.th',
                        organization: 'School of Science',
                        submissionStatus: 'pending',
                        responseId: null,
                        startedAt: null,
                        submittedAt: null
                    }
                ]
            };

            const wrapper = shallowMount(FormReportDetails, {
                propsData: {
                    mode: 'respondents',
                    loading: false,
                    detailPayload
                },
                mocks: {
                    $t: (k, params) => (params ? `${k}:${JSON.stringify(params)}` : k),
                    $te: () => false
                },
                stubs: {
                    RouterLink: {
                        props: ['to'],
                        template: '<a class="router-link-stub" :data-to-name="to && to.name" :data-to-id="to && to.params && to.params.id"><slot /></a>'
                    },
                    CIcon: true,
                    EmptyState: true,
                    Pagination: true
                }
            });

            const responseLinks = wrapper.findAll('[data-test="respondent-response-link"]');
            expect(responseLinks.length).toBe(2);

            const submittedLink = responseLinks.at(0);
            expect(submittedLink.attributes('data-to-name')).toBe('Response');
            expect(submittedLink.attributes('data-to-id')).toBe('resp-submitted-1');

            const ongoingLink = responseLinks.at(1);
            expect(ongoingLink.attributes('data-to-name')).toBe('Response');
            expect(ongoingLink.attributes('data-to-id')).toBe('resp-ongoing-2');

            const viewDetailsBtns = wrapper.findAll('[data-test="respondent-view-details-btn"]');
            expect(viewDetailsBtns.length).toBe(2);
            expect(viewDetailsBtns.at(0).attributes('data-to-id')).toBe('resp-submitted-1');
            expect(viewDetailsBtns.at(1).attributes('data-to-id')).toBe('resp-ongoing-2');
        });
    });
});
