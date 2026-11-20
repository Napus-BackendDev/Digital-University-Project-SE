import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import AnalyticsFormDetail from '@/projects/views/AnalyticsFormDetail.vue';
import SubmissionTrendChart from '@/projects/components/analytics/SubmissionTrendChart.vue';
import AnalyticsBreakdownCharts from '@/projects/components/analytics/AnalyticsBreakdownCharts.vue';
import FormReportDetails from '@/projects/components/analytics/FormReportDetails.vue';
import Service from '@/service/api';
import * as apiUrl from '@/projects/utils/apiUrl';

const localVue = createLocalVue();
localVue.use(Vuex);

const mocks = {
    $t: (key, params) => {
        if (params && typeof params === 'object') {
            return `${key}:${JSON.stringify(params)}`;
        }
        return key;
    },
    $te: () => true,
    $i18n: { locale: 'en' }
};

function createMockStore({
    currentUser = { _id: 'admin1', role: { title: 'Admin' } },
    forms = null,
    responses = null,
    organizations = [],
    roles = [],
    users = []
} = {}) {
    const now = new Date();
    const defaultForms = forms || [
        {
            _id: 'f1',
            title: [{ key: 'en', value: 'Course Evaluation' }, { key: 'th', value: 'ประเมินรายวิชา' }],
            description: [{ key: 'en', value: 'Evaluate instructors' }],
            organization: ['org1'],
            schedule: { startAt: new Date(now.getTime() - 86400000).toISOString(), endAt: new Date(now.getTime() + 86400000 * 3).toISOString() },
            creator: 'admin1',
            questions: [
                { _id: 'q1', order: 1, type: { type: 'rating' }, title: [{ key: 'en', value: 'Overall Satisfaction' }] }
            ],
            settings: { allowedUser: ['u1', 'u2'], allowedRoles: [] }
        },
        {
            _id: 'f2',
            title: [{ key: 'en', value: 'Campus Facility Check' }],
            organization: ['org1'],
            schedule: { startAt: new Date(now.getTime() - 86400000 * 2).toISOString(), endAt: new Date(now.getTime() + 86400000 * 20).toISOString() },
            creator: 'admin1',
            questions: [
                { _id: 'q2', order: 1, type: { type: 'free_text' }, title: [{ key: 'en', value: 'Comments' }] }
            ],
            settings: { allowedUser: ['u1'], allowedRoles: [] }
        }
    ];
    const defaultResponses = responses || [
        {
            _id: 'r1',
            form: 'f1',
            responder: 'u1',
            submit: true,
            createdAt: now.toISOString(),
            answers: [{ question: 'q1', response: 5 }]
        },
        {
            _id: 'r2',
            form: 'f1',
            responder: 'u2',
            submit: false,
            createdAt: now.toISOString(),
            answers: []
        },
        {
            _id: 'r3',
            form: 'f2',
            responder: null,
            submit: true,
            createdAt: now.toISOString(),
            answers: [{ question: 'q2', response: 'Clean classrooms' }]
        }
    ];

    return new Vuex.Store({
        modules: {
            Forms: {
                namespaced: true,
                getters: { forms: () => defaultForms },
                mutations: { clearForms: jest.fn() },
                actions: { getByUser: jest.fn().mockResolvedValue(defaultForms) }
            },
            Responses: {
                namespaced: true,
                getters: { responses: () => defaultResponses, exp: () => defaultResponses },
                actions: { exp: jest.fn().mockResolvedValue(defaultResponses) }
            },
            User: {
                namespaced: true,
                getters: { user: () => currentUser, users: () => users },
                actions: { getAll: jest.fn().mockResolvedValue(users) }
            },
            Organizations: {
                namespaced: true,
                getters: { organizations: () => organizations },
                actions: { getAll: jest.fn().mockResolvedValue(organizations) }
            },
            Roles: {
                namespaced: true,
                getters: { roles: () => roles },
                actions: { getAll: jest.fn().mockResolvedValue(roles) }
            }
        }
    });
}

const chartLineStub = {
    name: 'CChartLine',
    props: ['datasets', 'labels', 'options'],
    template: '<div class="c-chart-line-stub" :data-datasets="JSON.stringify(datasets)" :data-labels="JSON.stringify(labels)"></div>'
};

const chartBarStub = {
    name: 'CChartBar',
    props: ['datasets', 'labels', 'options'],
    template: '<div class="c-chart-bar-stub" :data-labels="JSON.stringify(labels)"></div>'
};

const chartDoughnutStub = {
    name: 'CChartDoughnut',
    props: ['datasets', 'labels', 'options'],
    template: '<div class="c-chart-doughnut-stub" :data-datasets="JSON.stringify(datasets)"></div>'
};

const dataTableStub = {
    name: 'CDataTable',
    props: ['items', 'fields', 'loading', 'hover'],
    template: `
        <div class="c-data-table-stub">
            <div v-if="loading" class="loading-slot"><slot name="loading" /></div>
            <div v-else-if="!items || !items.length" class="empty-slot"><slot name="no-items-view" /></div>
            <div v-else>
                <div v-for="(item, idx) in items" :key="item.id || idx" class="table-row-stub" @click="$emit('row-clicked', item)">
                    <slot name="formName" :item="item" />
                    <slot name="access" :item="item" />
                    <slot name="responses" :item="item" />
                    <slot name="scheduleRange" :item="item" />
                    <slot name="status" :item="item" />
                    <slot name="actions" :item="item" />
                </div>
            </div>
        </div>
    `
};

const baseStubs = {
    Header: {
        props: ['title', 'description'],
        template: '<div class="header-stub"><h1>{{ title }}</h1><p>{{ description }}</p><slot name="actions" /></div>'
    },
    CRow: { template: '<div class="c-row"><slot /></div>' },
    CCol: { template: '<div class="c-col"><slot /></div>' },
    CCard: { template: '<div class="c-card"><slot /></div>' },
    CCardBody: { template: '<div class="c-card-body"><slot /></div>' },
    CButton: { template: '<button type="button" v-bind="$attrs" v-on="$listeners"><slot /></button>' },
    CDropdown: { template: '<div class="c-dropdown"><slot name="toggler" /><div class="c-dropdown-menu"><slot /></div></div>' },
    CDropdownItem: { template: '<button type="button" class="c-dropdown-item" v-bind="$attrs" v-on="$listeners"><slot /></button>' },
    CIcon: { template: '<i class="c-icon"></i>' },
    CSpinner: { template: '<span class="c-spinner"></span>' },
    CChartLine: chartLineStub,
    CChartBar: chartBarStub,
    CChartDoughnut: chartDoughnutStub,
    CDataTable: dataTableStub,
    FilterTable: {
        name: 'FilterTable',
        props: ['search', 'statusTabs', 'selectedStatus', 'searchPlaceholder', 'statusOptions'],
        template: `
            <div class="filter-table-stub">
                <slot name="toolbar-extra" />
                <button
                    v-for="tab in statusTabs"
                    :key="tab.value"
                    type="button"
                    :class="'status-tab-' + tab.value"
                    @click="$emit('update:selectedStatus', tab.value)"
                >{{ tab.label }}</button>
                <input
                    class="search-input-stub"
                    :value="search"
                    @input="$emit('update:search', $event.target.value)"
                />
            </div>
        `
    },
    Pagination: {
        props: ['activePage', 'pages', 'itemsPerPage', 'showPerPage', 'totalItems'],
        template: `
            <div class="pagination-stub" :data-per-page="itemsPerPage">
                <button type="button" class="per-page-10" @click="$emit('update:itemsPerPage', 10)">10</button>
            </div>
        `
    },
    TableLoading: { template: '<div class="table-loading-stub">loading...</div>' },
    EmptyState: {
        props: ['title', 'description'],
        template: '<div class="empty-state-stub">{{ title }} {{ description }}<slot name="actions" /></div>'
    }
};

describe('Analytics UI components & per-form architecture', () => {
    let analyticsSpy;
    let copySpy;

    beforeEach(() => {
        jest.clearAllMocks();
        analyticsSpy = jest.spyOn(Service, 'analytics').mockResolvedValue({ data: { data: { forms: [] } } });
        copySpy = jest.spyOn(apiUrl, 'copyText').mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('SubmissionTrendChart uses localized analytics.allTime label and plots 2 series (completed + ongoing)', () => {
        const store = createMockStore();
        const wrapper = shallowMount(SubmissionTrendChart, {
            localVue,
            store,
            propsData: {
                timeRange: 'all',
                trendData: {
                    labels: ['2026-01', '2026-02'],
                    completedData: [3, 5],
                    ongoingData: [1, 2]
                }
            },
            stubs: baseStubs,
            mocks
        });

        expect(wrapper.text()).toContain('analytics.allTime');
        const chartStub = wrapper.find('.c-chart-line-stub');
        expect(chartStub.exists()).toBe(true);
        const datasets = JSON.parse(chartStub.attributes('data-datasets'));
        expect(datasets).toHaveLength(2);
        expect(datasets[0].data).toEqual([3, 5]);
        expect(datasets[1].data).toEqual([1, 2]);
    });

    test('AnalyticsBreakdownCharts toggles org/role and conditionally hides Rating Distribution when showRating is false', async () => {
        const store = createMockStore();
        const baseProps = {
            breakdown: {
                byOrganization: [{ id: 'o1', label: 'IT School', target: 10, completed: 8, pending: 2, rate: 80 }],
                byRole: [{ id: 'r1', label: 'Student', target: 10, completed: 7, pending: 3, rate: 70 }]
            },
            summary: {
                signedInResponses: 7,
                guestResponses: 1,
                avgRating: 4.5,
                totalRatingCount: 4,
                ratingDistribution: [0, 0, 1, 1, 2]
            }
        };

        const withRating = shallowMount(AnalyticsBreakdownCharts, {
            localVue,
            store,
            propsData: baseProps,
            stubs: baseStubs,
            mocks
        });

        expect(withRating.find('.c-chart-bar-stub').attributes('data-labels')).toContain('IT School');
        expect(withRating.text()).toContain('analytics.ratingDistributionLabel');
        expect(withRating.text()).toContain('4.50');

        const roleBtn = withRating.findAll('.segmented-mini-btn').at(1);
        await roleBtn.trigger('click');
        expect(withRating.find('.c-chart-bar-stub').attributes('data-labels')).toContain('Student');

        const withoutRating = shallowMount(AnalyticsBreakdownCharts, {
            localVue,
            store,
            propsData: {
                ...baseProps,
                showRating: false
            },
            stubs: baseStubs,
            mocks
        });

        expect(withoutRating.text()).not.toContain('analytics.ratingDistributionLabel');
    });

    test('FormReportDetails renders inline tabs for question stats (+N expand, clickable files) and respondent filter/search', async () => {
        const options = Array.from({ length: 7 }, (_, idx) => ({
            key: `k${idx}`,
            label: { en: `Choice ${idx + 1}`, th: `ตัวเลือก ${idx + 1}` },
            count: 7 - idx,
            percentage: 14
        }));

        const wrapper = mount(FormReportDetails, {
            localVue,
            propsData: {
                loading: false,
                summaryRow: { id: 'f1', formName: 'Course Eval', targetCount: 4, completedCount: 3 },
                detailPayload: {
                    form: { _id: 'f1', title: { en: 'Course Eval', th: 'ประเมิน' } },
                    summary: { targetCount: 4, completedCount: 3, pendingCount: 1, responseRate: 75, completionRate: 75, avgRating: 4.5, ratingCount: 2 },
                    questions: [
                        { _id: 'q1', order: 1, title: { en: 'Score?' }, type: 'rating', stats: { answeredCount: 2, average: 4.5, min: 4, max: 5, distribution: { 4: 1, 5: 1 } } },
                        { _id: 'q2', order: 2, title: { en: 'Favorite?' }, type: 'multiple_choice', stats: { answeredCount: 49, options } },
                        { _id: 'q3', order: 3, title: { en: 'Feedback' }, type: 'free_text', stats: { answeredCount: 4 } },
                        { _id: 'q4', order: 4, title: { en: 'Attachment' }, type: 'file_upload', stats: { answeredCount: 1 } }
                    ],
                    results: [
                        {
                            _id: 'u1',
                            name: 'Alice',
                            email: 'alice@mfu.ac.th',
                            organization: 'IT',
                            role: 'Student',
                            submitted: true,
                            submissionStatus: 'submitted',
                            startedAt: '2026-11-12T08:00:00.000Z',
                            submittedAt: '2026-11-12T08:05:00.000Z',
                            answers: [
                                { questionId: 'q3', order: 3, type: 'free_text', value: 'First answer' },
                                { questionId: 'q4', order: 4, type: 'file_upload', value: 'http://localhost:8081/uploads/evidence.pdf' }
                            ]
                        },
                        { _id: 'u2', name: 'Bob', email: 'bob@mfu.ac.th', organization: 'IT', role: 'Student', submitted: true, submissionStatus: 'submitted', answers: [{ questionId: 'q3', order: 3, type: 'free_text', value: 'Second answer' }] },
                        { _id: 'u3', name: 'Carol', email: 'carol@mfu.ac.th', organization: 'Law', role: 'Staff', submitted: true, submissionStatus: 'submitted', answers: [{ questionId: 'q3', order: 3, type: 'free_text', value: 'Third answer' }] },
                        { _id: 'u4', name: 'Dave', email: 'dave@mfu.ac.th', organization: 'IT', role: 'Staff', submitted: true, submissionStatus: 'submitted', answers: [{ questionId: 'q3', order: 3, type: 'free_text', value: 'Fourth expanded answer' }] },
                        { _id: 'u5', name: 'Eve Pending', email: 'eve@mfu.ac.th', organization: 'Law', role: 'Student', submitted: false, submissionStatus: 'pending', startedAt: null, submittedAt: null, answers: [] }
                    ]
                }
            },
            stubs: baseStubs,
            mocks
        });

        // Default opens on Respondent Status table (5 columns, status labels, pagination)
        const headers = wrapper.findAll('.respondent-tracker-table thead th');
        expect(headers).toHaveLength(5);
        expect(headers.wrappers.map(h => h.text())).toEqual([
            'analytics.respondentTable.nameCol',
            'analytics.respondentTable.organizationCol',
            'analytics.respondentTable.statusCol',
            'analytics.respondentTable.startTimeCol',
            'analytics.respondentTable.submitTimeCol'
        ]);
        expect(wrapper.findAll('.person-table-row')).toHaveLength(5);
        expect(wrapper.text()).toContain('analytics.respondentTable.statusCompleted');
        expect(wrapper.text()).toContain('analytics.respondentTable.statusAssigned');
        expect(wrapper.find('.pagination-stub').exists()).toBe(true);
        expect(wrapper.find('.pagination-stub').attributes('data-per-page')).toBe('10');

        // Filter respondents by search
        await wrapper.find('.people-search').setValue('Eve');
        expect(wrapper.findAll('.person-table-row')).toHaveLength(1);
        expect(wrapper.text()).toContain('Eve Pending');

        // Switch to Question Highlights tab
        await wrapper.findAll('.details-tab').at(1).trigger('click');
        expect(wrapper.text()).toContain('4.5 ★');
        expect(wrapper.text()).toContain('Min 4 · Max 5');
        expect(wrapper.findAll('.option-row')).toHaveLength(5);
        expect(wrapper.text()).toContain('+2 analytics.moreOptions');
        expect(wrapper.find('.answer-preview-list').exists()).toBe(false);
        expect(wrapper.text()).not.toContain('Fourth expanded answer');
        const expandBtns = wrapper.findAll('.more-toggle-btn');
        expect(expandBtns).toHaveLength(1);
        await expandBtns.at(0).trigger('click');
        expect(wrapper.findAll('.option-row')).toHaveLength(7);
    });

    test('AnalyticsFormDetail renders single-form report, hides Rating KPI/chart when form has no rating questions, and guards unauthorized access', async () => {
        analyticsSpy.mockResolvedValue({
            data: {
                data: {
                    forms: [
                        {
                            form: { _id: 'f2', title: { en: 'Campus Facility Check' } },
                            summary: {
                                targetCount: 1,
                                completedCount: 1,
                                pendingCount: 0,
                                ongoingCount: 0,
                                responseRate: 100,
                                completionRate: 100,
                                signedInCount: 0,
                                guestCount: 1,
                                avgRating: null,
                                ratingCount: 0,
                                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                            },
                            questions: [
                                { _id: 'q2', order: 1, title: { en: 'Comments' }, type: 'free_text', stats: { answeredCount: 1 } }
                            ],
                            results: []
                        }
                    ]
                }
            }
        });

        const pushMock = jest.fn();
        const replaceMock = jest.fn(() => Promise.resolve());
        const store = createMockStore();

        // 1. Form f2 (text only, no rating questions) -> Rating KPI omitted & showRating=false
        const wrapperNoRating = shallowMount(AnalyticsFormDetail, {
            localVue,
            store,
            propsData: { formId: 'f2' },
            stubs: baseStubs,
            mocks: {
                ...mocks,
                $route: { params: { formId: 'f2' }, query: {} },
                $router: { push: pushMock, replace: replaceMock }
            }
        });
        await wrapperNoRating.vm.$nextTick();
        await wrapperNoRating.vm.$nextTick();

        expect(analyticsSpy).toHaveBeenCalledWith('export', expect.objectContaining({
            formIds: 'f2',
            timeRange: 'all'
        }));
        expect(wrapperNoRating.findAll('.kpi-card')).toHaveLength(3);
        expect(wrapperNoRating.text()).not.toContain('analytics.avgRatingLabel');
        expect(wrapperNoRating.find(AnalyticsBreakdownCharts).props('showRating')).toBe(false);
        expect(wrapperNoRating.find(SubmissionTrendChart).exists()).toBe(true);
        expect(wrapperNoRating.find(FormReportDetails).exists()).toBe(true);

        // Back button navigates to /manage list; legacy link to /manage/:_id?tab=response is removed and Copy API is supported
        await wrapperNoRating.find('.back-link-btn').trigger('click');
        expect(pushMock).toHaveBeenCalledWith({ name: 'ManageForms' });
        expect(wrapperNoRating.find('.btn-individual-responses').exists()).toBe(false);
        await wrapperNoRating.vm.copyFormApiUrl();
        expect(copySpy).toHaveBeenCalledWith(expect.stringContaining('response/export/f2'));

        // 2. Form f1 (has rating question) -> Rating KPI card & showRating=true rendered
        analyticsSpy.mockResolvedValueOnce({
            data: {
                data: {
                    forms: [
                        {
                            form: { _id: 'f1', title: { en: 'Course Evaluation' } },
                            summary: {
                                targetCount: 2,
                                completedCount: 1,
                                pendingCount: 1,
                                ongoingCount: 1,
                                responseRate: 50,
                                completionRate: 50,
                                signedInCount: 1,
                                guestCount: 0,
                                avgRating: 5,
                                ratingCount: 1,
                                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 }
                            },
                            questions: [
                                { _id: 'q1', order: 1, title: { en: 'Overall Satisfaction' }, type: 'rating', stats: { answeredCount: 1, average: 5 } }
                            ],
                            results: []
                        }
                    ]
                }
            }
        });
        const wrapperWithRating = shallowMount(AnalyticsFormDetail, {
            localVue,
            store,
            propsData: { formId: 'f1' },
            stubs: baseStubs,
            mocks: {
                ...mocks,
                $route: { params: { formId: 'f1' }, query: {} },
                $router: { push: pushMock, replace: replaceMock }
            }
        });
        await wrapperWithRating.vm.$nextTick();
        await wrapperWithRating.vm.$nextTick();

        expect(wrapperWithRating.findAll('.kpi-card')).toHaveLength(4);
        expect(wrapperWithRating.text()).toContain('analytics.avgRatingLabel');
        expect(wrapperWithRating.find(AnalyticsBreakdownCharts).props('showRating')).toBe(true);

        // 3. Unauthorized user cannot view f1 report -> displays empty/unavailable state
        const unauthorizedStore = createMockStore({
            currentUser: { _id: 'stranger99', role: { title: 'Student' } }
        });
        const unauthorizedWrapper = shallowMount(AnalyticsFormDetail, {
            localVue,
            store: unauthorizedStore,
            propsData: { formId: 'f1' },
            stubs: baseStubs,
            mocks: {
                ...mocks,
                $route: { params: { formId: 'f1' }, query: {} },
                $router: { push: pushMock, replace: replaceMock }
            }
        });
        await unauthorizedWrapper.vm.$nextTick();
        expect(unauthorizedWrapper.text()).toContain('analytics.formNotFoundTitle');
        expect(unauthorizedWrapper.find('.kpi-card').exists()).toBe(false);
    });
});
