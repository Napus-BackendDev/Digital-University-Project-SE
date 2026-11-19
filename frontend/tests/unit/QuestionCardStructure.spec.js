import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import TabQuestion from '@/projects/components/Tabs/TabQuestion.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('TabQuestion visual hierarchy and question description', () => {
    const sampleQuestion = {
        _id: 'q_mc_1',
        order: 1,
        type: { _id: 't_mc', type: 'multiple_choice' },
        title: [{ key: 'th', value: 'คุณพึงพอใจระดับใด' }],
        description: [],
        isRequired: false,
        config: {
            choices: [
                { key: '0', lang: [{ key: 'th', value: 'มากที่สุด' }] },
                { key: '1', lang: [{ key: 'th', value: 'ปานกลาง' }] }
            ]
        }
    };

    const createStore = () => {
        let seq = 1;
        return new Vuex.Store({
            modules: {
                'Setting/question_type': {
                    namespaced: true,
                    actions: { get: jest.fn() },
                    getters: {
                        item: () => [
                            { _id: 't_mc', type: 'multiple_choice' },
                            { _id: 't_ft', type: 'free_text' },
                            { _id: 't_sec', type: 'section' }
                        ]
                    }
                },
                Questions: {
                    namespaced: true,
                    actions: {
                        create: jest.fn((ctx, payload) => Promise.resolve({
                            data: { data: { ...payload, _id: `created_${seq++}` } }
                        })),
                        update: jest.fn().mockResolvedValue({}),
                        delete: jest.fn().mockResolvedValue({})
                    }
                }
            }
        });
    };

    const mountBuilder = (questionOverride = null, store = createStore()) => shallowMount(TabQuestion, {
        localVue,
        store,
        propsData: {
            form: {
                _id: 'form_1',
                title: [{ key: 'th', value: 'แบบสอบถามทดสอบ' }],
                description: [],
                questions: Array.isArray(questionOverride)
                    ? questionOverride
                    : [questionOverride || JSON.parse(JSON.stringify(sampleQuestion))]
            }
        },
        stubs: {
            GridLayout: { template: '<div class="grid-layout-stub"><slot /></div>' },
            GridItem: { template: '<div class="question-grid-item"><slot /></div>' },
            CCard: { template: '<div class="ccard-stub"><slot /></div>' },
            CCardBody: { template: '<div class="ccard-body-stub"><slot /></div>' },
            CButton: { template: '<button v-on="$listeners"><slot /></button>' },
            CDropdown: { template: '<div><slot name="toggler" /><slot /></div>' },
            CDropdownItem: { template: '<div v-on="$listeners"><slot /></div>' },
            CDropdownDivider: true,
            CInput: {
                props: ['value', 'placeholder'],
                template: '<input :value="value" :placeholder="placeholder" />'
            },
            CTextarea: {
                props: ['value', 'placeholder'],
                template: '<textarea :value="value" :placeholder="placeholder" />'
            },
            CSwitch: true,
            CModal: true,
            CIcon: true,
            CSpinner: true,
            CInputCheckbox: true
        },
        directives: {
            'c-tooltip': () => {}
        },
        mocks: {
            $t: (key) => key,
            $te: () => false,
            $i18n: { locale: 'th' }
        }
    });

    test('separates question prompt zone from answer choices zone and shows 6-dot drag handle', () => {
        const wrapper = mountBuilder();

        expect(wrapper.find('.question-grid-item').attributes('drag-allow-from')).toBe('.question-drag-handle');
        expect(wrapper.find('.question-drag-handle svg').exists()).toBe(true);
        expect(wrapper.find('.question-prompt-zone').exists()).toBe(true);
        expect(wrapper.find('.question-badge-pill').text()).toContain('builder.questionBadgePrefix');
        expect(wrapper.text()).toContain('builder.questionTitleLabel');
        expect(wrapper.text()).toContain('builder.addRegularQuestionDescPrompt');
        expect(wrapper.find('.question-add-desc-box').exists()).toBe(true);
        expect(wrapper.find('.question-title-input').attributes('placeholder')).toBe('builder.questionTitlePlaceholder');
        expect(wrapper.find('.question-answer-header').text()).toContain('builder.choicesZoneLabel');
        expect(wrapper.find('.question-answer-zone .choice-option-input').exists()).toBe(true);
    });

    test('resets question numbering per section in builder question badges', () => {
        const list = [
            { _id: 'q1', order: 1, type: { _id: 't_mc', type: 'multiple_choice' }, title: [{ key: 'th', value: 'Q1' }], description: [], config: { choices: [] } },
            { _id: 'q2', order: 2, type: { _id: 't_mc', type: 'multiple_choice' }, title: [{ key: 'th', value: 'Q2' }], description: [], config: { choices: [] } },
            { _id: 'sec1', order: 3, type: { _id: 't_sec', type: 'section' }, title: [{ key: 'th', value: 'Part 2' }], config: { description: [] } },
            { _id: 'q3', order: 4, type: { _id: 't_mc', type: 'multiple_choice' }, title: [{ key: 'th', value: 'Q3' }], description: [], config: { choices: [] } },
            { _id: 'q4', order: 5, type: { _id: 't_mc', type: 'multiple_choice' }, title: [{ key: 'th', value: 'Q4' }], description: [], config: { choices: [] } }
        ];
        const wrapper = mountBuilder(list);
        const badges = wrapper.findAll('.question-badge-pill').wrappers.map(w => w.text().trim());
        expect(badges).toEqual([
            'builder.questionBadgePrefix 1',
            'builder.questionBadgePrefix 2',
            'builder.questionBadgePrefix 1',
            'builder.questionBadgePrefix 2'
        ]);
    });

    test('expands and removes optional multilingual question description inside prompt zone', async () => {
        const wrapper = mountBuilder();
        expect(wrapper.find('.question-add-desc-box').exists()).toBe(true);
        expect(wrapper.find('.question-desc-input').exists()).toBe(false);

        await wrapper.find('.question-add-desc-box').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('builder.questionDescLabel');
        expect(wrapper.find('.question-desc-input').exists()).toBe(true);
        expect(wrapper.find('.question-desc-input').attributes('placeholder')).toBe('builder.questionDescPlaceholder');
    });

    test('renders static language badges on the left and scrolls to top when adding or removing language globally', async () => {
        const origScrollTo = window.scrollTo;
        const scrollSpy = jest.fn();
        window.scrollTo = scrollSpy;

        const wrapper = mountBuilder();
        expect(wrapper.find('.lang-key-badge').text()).toBe('TH');
        expect(wrapper.find('.add-lang-btn').exists()).toBe(false);

        await wrapper.vm.addLanguageGlobally('en');
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.getFormLanguages()).toEqual(['th', 'en']);
        expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

        scrollSpy.mockClear();
        wrapper.vm.requestRemoveLanguageGlobally('en');
        await wrapper.vm.confirmRemoveLanguageGlobally();
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.getFormLanguages()).toEqual(['th']);
        expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

        window.scrollTo = origScrollTo;
    });

    test('renders auto-resizing textareas for question titles and updates height from scrollHeight', () => {
        const wrapper = mountBuilder();
        const titleField = wrapper.find('.question-title-input');
        expect(titleField.exists()).toBe(true);
        expect(titleField.classes()).toContain('auto-resize-field');

        const mockEl = { style: { height: '38px' }, scrollHeight: 84 };
        const changed = wrapper.vm.autoResizeEl(mockEl);
        expect(changed).toBe(true);
        expect(mockEl.style.height).toBe('84px');
    });

    test('creates sections with collapsed description, supports collapse/expand summary, moves questions via footer selector, and swaps whole section groups without stale storedLayout snapback', async () => {
        const questions = [
            { _id: 'q1', order: 1, type: { _id: 't_mc', type: 'multiple_choice' }, title: [{ key: 'th', value: 'Q1' }], description: [], config: { choices: [] } },
            { _id: 'q2', order: 2, type: { _id: 't_mc', type: 'multiple_choice' }, title: [{ key: 'th', value: 'Q2' }], description: [], config: { choices: [] } }
        ];
        const wrapper = mountBuilder(questions);

        // Adding a Section when none exist creates Section 1 at top + Section 2 at end with title only (description collapsed)
        const sec2 = await wrapper.vm.addQuestion('section');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.localQuestions.map(q => q._id)).toEqual(['created_1', 'q1', 'q2', 'created_2']);
        expect(sec2.isDescExpanded).not.toBe(true);
        expect(wrapper.vm.sectionGroups).toHaveLength(2);
        expect(wrapper.find('.section-add-dropdown').exists()).toBe(false);
        expect(wrapper.find('.split-section-btn').exists()).toBe(false);
        expect(wrapper.find('.question-footer-section-select').exists()).toBe(true);
        expect(wrapper.find('.section-card .question-add-desc-box').exists()).toBe(true);

        // Adding a new question inserts into active Section 2
        await wrapper.vm.addQuestion('t_ft');
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.localQuestions.map(q => q._id)).toEqual(['created_1', 'q1', 'q2', 'created_2', 'created_3']);

        // Move Q1 (index 1) from Section 1 directly into Section 2 (targetSectionIdx 1)
        await wrapper.vm.moveQuestionToSection(1, 1);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.localQuestions.map(q => q._id)).toEqual(['created_1', 'q2', 'created_2', 'created_3', 'q1']);
        expect(wrapper.vm.layout.map(l => String(l.i))).toEqual(['created_1', 'q2', 'created_2', 'created_3', 'q1']);

        // Collapse Section 1 -> hides q2 cleanly while preserving all 5 items in localQuestions
        const sec1 = wrapper.vm.localQuestions[0];
        sec1.title = [{ key: 'th', value: 'ข้อมูลทั่วไปของโครงการ' }];
        sec1.config = { description: [{ key: 'th', value: 'คำอธิบายส่วนที่หนึ่งแบบละเอียด' }] };
        wrapper.vm.toggleSectionCollapse(sec1);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.visibleLocalQuestions.map(q => q._id)).toEqual(['created_1', 'created_2', 'created_3', 'q1']);
        expect(wrapper.find('.section-card.is-collapsed-section').exists()).toBe(true);
        expect(wrapper.find('.section-card.is-collapsed-section').text()).toContain('builder.sectionCollapsedSummary');
        expect(wrapper.find('.section-collapsed-summary-body .section-collapsed-title').text()).toBe('ข้อมูลทั่วไปของโครงการ');
        expect(wrapper.find('.section-collapsed-summary-body .section-collapsed-desc').text()).toBe('คำอธิบายส่วนที่หนึ่งแบบละเอียด');

        // Expand back & move Section 2 group above Section 1
        wrapper.vm.toggleSectionCollapse(sec1);
        await wrapper.vm.moveSectionGroup(2, -1);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.localQuestions.map(q => q._id)).toEqual(['created_2', 'created_3', 'q1', 'created_1', 'q2']);
        expect(wrapper.vm.layout.map(l => String(l.i))).toEqual(['created_2', 'created_3', 'q1', 'created_1', 'q2']);
    });
});
