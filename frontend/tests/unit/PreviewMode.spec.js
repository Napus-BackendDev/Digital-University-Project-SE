import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import ButtonPreview from '@/projects/components/Button/ButtonPreview.vue';
import FormFill from '@/projects/views/page/FormFill.vue';
import th from '@/store/lang/th';
import localeMixin from '@/mixins/localeMixin';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.mixin(localeMixin);

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const commonStubs = {
    CContainer: { template: '<div><slot /></div>' },
    CRow: { template: '<div><slot /></div>' },
    CCol: { template: '<div><slot /></div>' },
    CCard: { template: '<div><slot /></div>' },
    CCardBody: { template: '<div><slot /></div>' },
    CButton: {
        template: '<button :disabled="$attrs.disabled" v-on="$listeners"><slot /></button>'
    },
    CTextarea: {
        props: ['value', 'disabled'],
        template: '<textarea :disabled="disabled" :value="value" @input="$emit(\'input\', $event.target.value, $event)" />'
    },
    CInput: {
        props: ['value', 'disabled'],
        template: '<input :disabled="disabled" :value="value" @input="$emit(\'input\', $event.target.value)" />'
    },
    CSpinner: true,
    CModal: { template: '<div><slot name="body-wrapper" /></div>' },
    CIcon: {
        props: ['name'],
        template: '<i :data-icon="name" />'
    },
    SkeletonLoader: true
};

describe('Interactive Preview Mode & Eye Icon Button', () => {
    test('ButtonPreview uses cil-eye icon and Thai label "ดูตัวอย่าง"', () => {
        expect(th.button.preview).toBe('ดูตัวอย่าง');
        expect(th.wizard.step5.openPreview).toBe('พรีวิว (Preview)');

        const wrapper = shallowMount(ButtonPreview, {
            localVue,
            stubs: {
                CButton: { template: '<button v-on="$listeners"><slot /></button>' },
                CIcon: {
                    props: ['name'],
                    template: '<i :data-icon="name" />'
                }
            },
            mocks: {
                $t: (key) => (key === 'button.preview' ? th.button.preview : key),
                $route: { params: { _id: 'form_1' } },
                $router: { push: jest.fn() }
            }
        });

        expect(wrapper.find('i[data-icon="cil-eye"]').exists()).toBe(true);
        expect(wrapper.text()).toContain('ดูตัวอย่าง');
    });

    test('FormFill in Preview mode allows answering and skip-logic testing without saving to DB', async () => {
        const sampleForm = {
            _id: 'form_preview_1',
            title: [{ key: 'th', value: 'แบบสอบถามทดสอบพรีวิว' }],
            description: [],
            settings: { requireLogin: false },
            questions: [
                {
                    _id: 'q1',
                    order: 1,
                    title: [{ key: 'th', value: 'ข้อแรก' }],
                    type: { type: 'multiple_choice' },
                    isRequired: true,
                    config: {
                        choices: [
                            { key: '0', lang: [{ key: 'th', value: 'ไปข้อ 3' }], nextQuestion: 'q3' },
                            { key: '1', lang: [{ key: 'th', value: 'ตอบปกติ' }] }
                        ]
                    },
                    followUp: [
                        { key: '0', question: 'q2' }
                    ]
                },
                {
                    _id: 'q2',
                    order: 2,
                    title: [{ key: 'th', value: 'ข้อต่อเมื่อเลือกข้อ 0' }],
                    type: { type: 'checkbox' },
                    isRequired: false,
                    config: {
                        choices: [{ key: '0', lang: [{ key: 'th', value: 'A' }] }]
                    }
                },
                {
                    _id: 'q3',
                    order: 3,
                    title: [{ key: 'th', value: 'ข้อสุดท้าย' }],
                    type: { type: 'free_text' },
                    isRequired: false,
                    config: {}
                }
            ]
        };

        const createResponseMock = jest.fn();
        const updateResponseMock = jest.fn();

        const store = new Vuex.Store({
            modules: {
                User: {
                    namespaced: true,
                    getters: { user: () => ({ _id: 'creator_1' }) },
                    actions: { get: jest.fn() }
                },
                Forms: {
                    namespaced: true,
                    actions: { getById: jest.fn().mockResolvedValue(sampleForm) }
                },
                Responses: {
                    namespaced: true,
                    actions: {
                        create: createResponseMock,
                        update: updateResponseMock,
                        get: jest.fn()
                    }
                }
            }
        });

        const wrapper = shallowMount(FormFill, {
            localVue,
            store,
            propsData: { formId: 'form_preview_1' },
            stubs: commonStubs,
            mocks: {
                $t: (key) => key,
                $i18n: { locale: 'th' },
                $route: { name: 'Preview', query: {} },
                $router: { push: jest.fn() }
            }
        });

        await flushPromises();
        await wrapper.vm.$nextTick();

        // Banner uses eye icon and radio inputs are enabled
        expect(wrapper.find('.preview-banner i[data-icon="cil-eye"]').exists()).toBe(true);
        const radioInputs = wrapper.findAll('input[type="radio"]');
        expect(radioInputs.length).toBe(2);
        expect(radioInputs.at(0).attributes('disabled')).toBeUndefined();

        // Checkbox answer array initialized cleanly before returning in preview mode
        expect(Array.isArray(wrapper.vm.answers.q2)).toBe(true);

        // Before q1 (branching single-choice) is answered, downstream question q3 (textarea) stays hidden
        expect(wrapper.vm.reachableQuestionIds.has('q3')).toBe(false);
        expect(wrapper.find('textarea').exists()).toBe(false);

        // Select option '0' on q1 that reveals follow-up q2 and reaches skip target q3 (textarea)
        wrapper.setData({ answers: { ...wrapper.vm.answers, q1: '0', q3: 'ทดสอบข้อความ' } });
        wrapper.vm.autoSave(true);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.isQuestionVisible(sampleForm.questions[1])).toBe(true);
        expect(wrapper.vm.reachableQuestionIds.has('q3')).toBe(true);
        expect(wrapper.find('textarea').exists()).toBe(true);
        expect(wrapper.find('textarea').attributes('disabled')).toBeUndefined();

        // Submit test validates and opens preview success modal without calling DB actions
        await wrapper.vm.submitForm();
        expect(createResponseMock).not.toHaveBeenCalled();
        expect(updateResponseMock).not.toHaveBeenCalled();
        expect(wrapper.vm.showModal).toBe(true);
        expect(wrapper.vm.modalTitle).toBe('form.previewCompleteTitle');
        expect(wrapper.vm.modalType).toBe('success');

        // Reset clears preview answers without saving
        wrapper.vm.resetPreviewAnswers();
        expect(wrapper.vm.answers.q1).toBeNull();
        expect(wrapper.vm.answers.q3).toBeNull();
        expect(createResponseMock).not.toHaveBeenCalled();
        expect(updateResponseMock).not.toHaveBeenCalled();
    });
});
