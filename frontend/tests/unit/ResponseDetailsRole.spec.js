import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import moment from 'moment';
import Responsedetail from '@/projects/views/Responsedetail.vue';
import ResponseTables from '@/projects/components/tables/ResponseTables.vue';
import {
    resolveUserRoleLabel,
    resolveUserOrganizationLabel,
    countInputQuestions,
    countValidAnswers
} from '@/projects/utils/formPolicy';

const localVue = createLocalVue();
localVue.use(Vuex);

function createStore(lang = 'th') {
    const store = new Vuex.Store({
        modules: {
            Setting: {
                namespaced: true,
                getters: { lang: () => lang },
                modules: {
                    question_type: {
                        namespaced: true,
                        getters: { item: () => [] }
                    }
                }
            },
            Organizations: {
                namespaced: true,
                getters: {
                    organizations: () => [
                        { _id: 'org_it', title: [{ key: 'th', value: 'สำนักวิชาเทคโนโลยีสารสนเทศ' }, { key: 'en', value: 'School of IT' }] }
                    ]
                }
            },
            Responses: { namespaced: true, getters: { responses: () => [] } },
            User: {
                namespaced: true,
                getters: {
                    users: () => [
                        {
                            _id: 'u_fallback',
                            name: 'Fallback Student',
                            organization: 'org_it',
                            role: { _id: 'r_std', title: [{ key: 'th', value: 'นักศึกษา' }, { key: 'en', value: 'Student' }] }
                        }
                    ]
                }
            }
        }
    });
    store.dispatch = jest.fn(() => Promise.resolve(null));
    return store;
}

describe('Responder details, date-range/org filters, and redesigned ResponseTables', () => {
    test('helpers resolve role, organization, input question count, and non-empty answer count cleanly', () => {
        const role = resolveUserRoleLabel(
            { _id: 'u1', role: { title: [{ key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }, { key: 'en', value: 'Admin' }] } },
            { getText: (v) => v.find(i => i.key === 'th')?.value || '' }
        );
        expect(role).toBe('ผู้ดูแลระบบ (Admin)');

        const fallbackOrg = resolveUserOrganizationLabel(
            { _id: 'u_fallback' },
            {
                organizations: [{ _id: 'org_it', title: [{ key: 'th', value: 'สำนักวิชาเทคโนโลยีสารสนเทศ' }] }],
                users: [{ _id: 'u_fallback', organization: 'org_it' }],
                getText: (v) => v.find(i => i.key === 'th')?.value || ''
            }
        );
        expect(fallbackOrg).toBe('สำนักวิชาเทคโนโลยีสารสนเทศ');

        expect(countInputQuestions([
            { _id: 'q1', type: { type: 'rating' } },
            { _id: 'q2', type: { type: 'title_description' } },
            { _id: 'q3', type: { type: 'image' } },
            { _id: 'q4', type: { type: 'short_answer' } }
        ])).toBe(2);

        expect(countValidAnswers([
            { response: '5' },
            { response: '' },
            { response: '[]' },
            { response: ['opt1'] }
        ])).toBe(2);
    });

    test('Responsedetail displays plain-text responder role under responder name and omits it for guests', async () => {
        const store = createStore('th');
        const responseDoc = {
            _id: 'resp1',
            submit: true,
            createdAt: '2026-11-16T05:14:00.000Z',
            responder: {
                _id: 'u1',
                name: 'Napus Samuanpho',
                email: 'napus.dev@gmail.com',
                role: { title: [{ key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }, { key: 'en', value: 'Admin' }] }
            },
            form: { _id: 'f1', title: [{ key: 'th', value: 'แบบประเมิน' }], questions: [], responses: [] },
            answers: []
        };
        store.dispatch = jest.fn((action) => {
            if (action === 'Responses/get') return Promise.resolve(responseDoc);
            return Promise.resolve([]);
        });

        const wrapper = shallowMount(Responsedetail, {
            localVue,
            store,
            propsData: { id: 'resp1' },
            stubs: {
                CCard: { template: '<div><slot /></div>' },
                CCardBody: { template: '<div><slot /></div>' },
                CCardHeader: { template: '<div><slot /></div>' },
                CRow: { template: '<div><slot /></div>' },
                CCol: { template: '<div><slot /></div>' },
                CBadge: { template: '<span><slot /></span>' },
                CCallout: { template: '<div><slot /></div>' },
                CButton: { template: '<button><slot /></button>' },
                CIcon: { template: '<i />' },
                ButtonBack: { template: '<button />' },
                SkeletonLoader: { template: '<div />' },
                AnswerTable: { template: '<div />' },
                ResponseTables: { template: '<div />' }
            },
            mocks: {
                $t: (k) => k,
                $i18n: { locale: 'th' },
                $router: { back: jest.fn(), push: jest.fn() }
            }
        });

        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Napus Samuanpho');
        expect(wrapper.find('.responder-role-text').text()).toBe('ผู้ดูแลระบบ (Admin)');
        expect(wrapper.text()).toContain('napus.dev@gmail.com');

        await wrapper.setData({
            response: { ...responseDoc, responder: null, responderName: 'Guest User' }
        });
        expect(wrapper.find('.responder-role-text').exists()).toBe(false);
    });

    test('ResponseTables renders 6 columns with org, MFU/Guest, progress X/Y, edited timestamp, and shared FilterTable controls', async () => {
        const store = createStore('th');
        const todayIso = moment().toISOString();
        const oldIso = moment().subtract(45, 'days').toISOString();
        const editedIso = moment().add(2, 'hours').toISOString();

        const responseList = [
            {
                _id: 'r1',
                submit: true,
                createdAt: todayIso,
                updatedAt: editedIso,
                responder: {
                    _id: 'u1',
                    name: 'Napus Samuanpho',
                    email: 'napus.dev@gmail.com',
                    organization: { _id: 'org_it', title: [{ key: 'th', value: 'สำนักวิชาเทคโนโลยีสารสนเทศ' }] },
                    role: { title: [{ key: 'th', value: 'ผู้ดูแลระบบ (Admin)' }] }
                },
                answers: [{ _id: 'a1', response: '5' }, { _id: 'a2', response: 'Good' }]
            },
            {
                _id: 'r2',
                submit: false,
                createdAt: oldIso,
                updatedAt: oldIso,
                responder: null,
                guestSessionId: 'guest-123',
                answers: [{ _id: 'a3', response: '4' }]
            }
        ];

        const wrapper = mount(ResponseTables, {
            localVue,
            store,
            propsData: { responseList, totalQuestions: 2 },
            stubs: {
                CCard: { template: '<div><slot /></div>' },
                CCardBody: { template: '<div><slot /></div>' },
                CRow: { template: '<div><slot /></div>' },
                CCol: { template: '<div><slot /></div>' },
                CDropdown: {
                    template: '<div class="c-dropdown-stub"><slot name="toggler" /><div class="c-dropdown-menu-stub"><slot /></div></div>'
                },
                CDropdownItem: {
                    template: '<div class="c-dropdown-item-stub" @click="$emit(\'click\', $event)"><slot /></div>'
                },
                Pagination: { template: '<div />' },
                EmptyState: { template: '<div class="empty-stub"><slot name="action" /></div>' },
                TableLoading: { template: '<div />' },
                CIcon: { template: '<i />' },
                CBadge: { template: '<span><slot /></span>' },
                CDataTable: {
                    props: ['items'],
                    template: `
                        <div>
                            <div v-if="!items.length"><slot name="no-items-view" /></div>
                            <div v-for="item in items" :key="item._id" class="resp-row">
                                <slot name="responder" :item="item" />
                                <slot name="organization" :item="item" />
                                <slot name="submitted" :item="item" />
                                <slot name="answers" :item="item" />
                                <slot name="actions" :item="item" />
                            </div>
                        </div>
                    `
                }
            },
            mocks: {
                $t: (k, params) => {
                    if (k === 'table.answeredFraction') return `${params.answered}/${params.total} ข้อ`;
                    if (k === 'responses.mfuAccount') return 'สมาชิก MFU';
                    if (k === 'responses.guestAccount') return 'บุคคลภายนอก';
                    if (k === 'responses.editedAt') return 'แก้ไขล่าสุด';
                    return k;
                },
                $i18n: { locale: 'th' },
                $router: { push: jest.fn() }
            }
        });

        expect(wrapper.vm.fields.map(f => f.key)).toEqual(['id', 'responder', 'organization', 'submitted', 'answers', 'actions']);
        expect(wrapper.findAll('.resp-row')).toHaveLength(2);

        const row0 = wrapper.findAll('.resp-row').at(0);
        expect(row0.text()).toContain('Napus Samuanpho');
        expect(row0.text()).toContain('สมาชิก MFU');
        expect(row0.find('.responder-role-text').text()).toBe('ผู้ดูแลระบบ (Admin)');
        expect(row0.text()).toContain('สำนักวิชาเทคโนโลยีสารสนเทศ');
        expect(row0.text()).toContain('แก้ไขล่าสุด');
        expect(row0.text()).toContain('100%');
        expect(row0.text()).toContain('2/2 ข้อ');

        const row1 = wrapper.findAll('.resp-row').at(1);
        expect(row1.text()).toContain('บุคคลภายนอก');
        expect(row1.text()).toContain('50%');
        expect(row1.text()).toContain('1/2 ข้อ');

        // Uses shared FilterTable layout matching /forms and /manage (Search, Status dropdown, Quick date, From, To)
        expect(wrapper.find('.filter-card').exists()).toBe(true);
        expect(wrapper.find('.filter-dropdown').exists()).toBe(true);
        expect(wrapper.find('.segmented-control').exists()).toBe(true);
        expect(wrapper.findAll('input[type="date"]')).toHaveLength(2);

        // Status dropdown filters Ongoing (3 items: All, Completed, Ongoing)
        const statusItems = wrapper.findAll('.filter-dropdown .c-dropdown-item-stub');
        expect(statusItems).toHaveLength(3);
        await statusItems.at(2).trigger('click');
        expect(wrapper.findAll('.resp-row')).toHaveLength(1);
        expect(wrapper.text()).toContain('บุคคลภายนอก');
        await statusItems.at(0).trigger('click');
        expect(wrapper.findAll('.resp-row')).toHaveLength(2);

        // Quick date range ("Today") keeps today's submission and hides 45-day-old response
        await wrapper.findAll('.segmented-btn').at(1).trigger('click');
        expect(wrapper.findAll('.resp-row')).toHaveLength(1);
        expect(wrapper.text()).toContain('Napus Samuanpho');
        await wrapper.findAll('.segmented-btn').at(0).trigger('click');
        expect(wrapper.findAll('.resp-row')).toHaveLength(2);

        // Search also matches organization name & empty search triggers EmptyState Reset Filters
        await wrapper.find('.filter-card input[type="text"]').setValue('สำนักวิชาเทคโนโลยีสารสนเทศ');
        expect(wrapper.findAll('.resp-row')).toHaveLength(1);
        await wrapper.find('.filter-card input[type="text"]').setValue('ไม่พบแน่ๆ');
        expect(wrapper.findAll('.resp-row')).toHaveLength(0);
        await wrapper.find('.empty-stub button').trigger('click');
        expect(wrapper.findAll('.resp-row')).toHaveLength(2);
    });
});
