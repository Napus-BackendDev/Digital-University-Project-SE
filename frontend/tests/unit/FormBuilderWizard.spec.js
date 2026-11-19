import Vue from 'vue';
import { shallowMount } from '@vue/test-utils';
import FormBuilderWizard from '@/projects/components/Wizard/FormBuilderWizard.vue';
import FormStatus from '@/projects/components/context/FormStatus.vue';

jest.doMock('vue-select/dist/vue-select.css', () => ({}));
const TabSetting = require('@/projects/components/Tabs/TabSetting.vue').default;

const wizardStubs = {
    CIcon: { template: '<i />' },
    CRow: { template: '<div><slot /></div>' },
    CCol: { template: '<div><slot /></div>' },
    'qr-code': { props: ['text'], template: '<canvas :data-qr="text"></canvas>' }
};

function mountWizard(propsData) {
    return shallowMount(FormBuilderWizard, {
        propsData,
        stubs: wizardStubs,
        mocks: {
            $t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key)
        }
    });
}

describe('FormBuilderWizard.vue (5-Step Wizard)', () => {
    test('stepper mode renders 5 steps and emits select-step and skip', async () => {
        const wrapper = mountWizard({
            mode: 'stepper',
            currentStep: 3,
            form: { _id: 'f1', title: [{ key: 'th', value: 'A' }], questions: [] }
        });

        const pills = wrapper.findAll('[data-wizard-step]');
        expect(pills.length).toBe(5);
        expect(pills.at(2).classes()).toContain('is-current');
        expect(pills.at(0).classes()).toContain('is-done');
        expect(pills.at(4).classes()).toContain('is-pending');

        await pills.at(3).trigger('click');
        expect(wrapper.emitted('select-step')).toEqual([[4]]);

        expect(wrapper.find('[data-testid="wizard-skip-btn"]').exists()).toBe(false);
    });

    test('step1 renders 3 language presets, emits apply-language-preset and next-step', async () => {
        const wrapper = mountWizard({
            mode: 'step1',
            currentStep: 1,
            form: { _id: 'f1', title: [{ key: 'en', value: 'Untitled Form' }], questions: [] }
        });

        const presets = wrapper.findAll('[data-lang-preset]');
        expect(presets.length).toBe(3);

        await wrapper.find('[data-lang-preset="th_en"]').trigger('click');
        expect(wrapper.emitted('apply-language-preset')[0]).toEqual(['th_en']);

        await wrapper.find('[data-testid="wizard-next-btn"]').trigger('click');
        expect(wrapper.emitted('apply-language-preset')[1]).toEqual(['th_en']);
        expect(wrapper.emitted('next-step')).toBeTruthy();
    });

    test('step2 guide mode supports collapsible tips and sample question action', async () => {
        const wrapper = mountWizard({
            mode: 'guide',
            currentStep: 2,
            form: { _id: 'f1', title: [{ key: 'th', value: 'Test' }], questions: [] }
        });

        expect(wrapper.find('.step2-tips-grid').exists()).toBe(true);
        await wrapper.find('[data-testid="wizard-collapse-tips-btn"]').trigger('click');
        expect(wrapper.find('.step2-tips-grid').exists()).toBe(false);

        await wrapper.find('[data-testid="wizard-add-sample-btn"]').trigger('click');
        expect(wrapper.emitted('add-sample-question')).toBeTruthy();
    });

    test('step4 shows Require Sign-in warning when organization restricted without requireLogin', async () => {
        const wrapper = mountWizard({
            mode: 'guide',
            currentStep: 4,
            form: {
                _id: 'f1',
                title: [{ key: 'th', value: 'Test' }],
                organization: ['org1'],
                settings: { requireLogin: false }
            }
        });

        const warn = wrapper.find('.wizard-warning-banner');
        expect(warn.exists()).toBe(true);
        await wrapper.find('[data-testid="wizard-enable-login-btn"]').trigger('click');
        expect(wrapper.emitted('enable-require-login')).toBeTruthy();

        await wrapper.setProps({
            form: {
                _id: 'f1',
                title: [{ key: 'th', value: 'Test' }],
                organization: ['org1'],
                settings: { requireLogin: true }
            }
        });
        expect(wrapper.find('.wizard-warning-banner').exists()).toBe(false);
    });

    test('step5 renders readiness summary, quick open button for Draft, clean history-mode URL, and finish', async () => {
        const wrapper = mountWizard({
            mode: 'step5',
            currentStep: 5,
            form: {
                _id: '6af5b56ab80a4751680de770',
                title: [{ key: 'th', value: 'แบบสอบถามทดสอบ' }],
                questions: [{ _id: 'q1' }],
                schedule: {},
                settings: { requireLogin: true, limitResponse: true }
            }
        });

        const urlInput = wrapper.find('.url-readonly-input');
        expect(urlInput.element.value).toContain('/forms/6af5b56ab80a4751680de770?mode=public');
        expect(urlInput.element.value).not.toContain('/#/');

        expect(wrapper.find('[data-testid="wizard-open-now-btn"]').exists()).toBe(false);

        await wrapper.find('[data-testid="wizard-finish-btn"]').trigger('click');
        expect(wrapper.emitted('finish')).toBeTruthy();
    });
});

describe('TabSetting.vue section filtering', () => {
    const settingStubs = {
        FormStatus: { template: '<div data-section="status" />' },
        AccessControl: { template: '<div data-section="access" />' },
        OrganizationControl: { template: '<div data-section="organization" />' },
        ResponseSettings: { template: '<div data-section="response" />' }
    };

    test('renders all 4 sections by default and filters/orders cleanly when sections prop is provided', async () => {
        const wrapper = shallowMount(TabSetting, {
            propsData: { settings: {} },
            stubs: settingStubs,
            mocks: { $t: k => k }
        });
        expect(wrapper.findAll('[data-section]').length).toBe(4);

        await wrapper.setProps({ sections: ['status', 'access'] });
        const step3 = wrapper.findAll('[data-section]');
        expect(step3.length).toBe(2);
        expect(step3.at(0).attributes('data-section')).toBe('status');
        expect(step3.at(1).attributes('data-section')).toBe('access');

        await wrapper.setProps({ sections: ['response', 'organization'] });
        const step4 = wrapper.findAll('[data-section]');
        expect(step4.length).toBe(2);
        expect(step4.at(0).attributes('data-section')).toBe('response');
        expect(step4.at(1).attributes('data-section')).toBe('organization');
    });
});

describe('FormStatus.vue schedule display', () => {
    const statusStubs = {
        CCard: { template: '<div><slot /></div>' },
        CCardBody: { template: '<div><slot /></div>' },
        CRow: { template: '<div><slot /></div>' },
        CCol: { template: '<div><slot /></div>' },
        CInput: {
            props: ['value', 'type'],
            template: '<input :type="type || \'text\'" :value="value" @input="$emit(\'input\', $event.target.value)" />'
        },
        CButton: { template: '<button><slot /></button>' },
        CIcon: { template: '<i />' }
    };

    test('renders 4 categorized schedule modes without quick status preset buttons and keeps Draft state on config changes', async () => {
        const settings = Vue.observable({ schedule: { isPublished: false, mode: 'always', startAt: null, endAt: null } });
        const wrapper = shallowMount(FormStatus, {
            propsData: { settings },
            stubs: statusStubs,
            mocks: { $t: k => k }
        });

        expect(wrapper.findAll('.quick-status-btn').length).toBe(0);
        const modeCards = wrapper.findAll('.schedule-mode-card');
        expect(modeCards.length).toBe(4);
        expect(modeCards.wrappers.map(w => w.attributes('data-schedule-mode'))).toEqual([
            'always',
            'range',
            'end_only',
            'scheduled'
        ]);

        // Switching to Mode 4 (scheduled) with empty startAt keeps clean UI (no required-hint or bottom status-summary banners)
        await wrapper.find('[data-schedule-mode="scheduled"]').trigger('click');
        expect(wrapper.find('[data-testid="schedule-required-hint"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="schedule-status-summary"]').exists()).toBe(false);

        // Switching to Mode 3 (end_only) and setting a future endAt auto-saves as Draft (isPublished stays false)
        await wrapper.find('[data-schedule-mode="end_only"]').trigger('click');
        expect(settings.schedule.mode).toBe('end_only');
        expect(settings.schedule.isPublished).toBe(false);
        expect(wrapper.find('[data-testid="mode-config-end-only-note"]').exists()).toBe(true);

        const futureEndInput = wrapper.find('[data-testid="schedule-end-input"]');
        futureEndInput.element.value = '2099-12-31T23:59';
        await futureEndInput.trigger('input');
        expect(settings.schedule.isPublished).toBe(false);
        expect(wrapper.vm.currentStatus).toBe('draft');
        expect(wrapper.find('[data-testid="schedule-validation-error"]').exists()).toBe(false);

        // Entering a past endAt immediately triggers validation error alert
        futureEndInput.element.value = '2020-01-01T00:00';
        await futureEndInput.trigger('input');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[data-testid="schedule-validation-error"]').exists()).toBe(true);
        expect(wrapper.vm.liveValidation.reason).toBe('END_IN_PAST');

        // Picker-only guard: input uses .picker-only-input, blocks free-text keydown/paste, allows Tab, opens picker on Enter, and clears via clear button
        expect(futureEndInput.classes()).toContain('picker-only-input');
        const showPickerMock = jest.fn();
        futureEndInput.element.showPicker = showPickerMock;

        const keyDigit = new KeyboardEvent('keydown', { key: '5', cancelable: true });
        futureEndInput.element.dispatchEvent(keyDigit);
        expect(keyDigit.defaultPrevented).toBe(true);

        const keyBackspace = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
        futureEndInput.element.dispatchEvent(keyBackspace);
        expect(keyBackspace.defaultPrevented).toBe(true);

        const keyTab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
        futureEndInput.element.dispatchEvent(keyTab);
        expect(keyTab.defaultPrevented).toBe(false);

        const keyEnter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
        futureEndInput.element.dispatchEvent(keyEnter);
        expect(keyEnter.defaultPrevented).toBe(true);
        expect(showPickerMock).toHaveBeenCalledTimes(1);

        expect(futureEndInput.classes()).toContain('has-picker-clear');
        await futureEndInput.trigger('click');
        expect(showPickerMock).toHaveBeenCalledTimes(2);

        await wrapper.find('[data-testid="schedule-end-clear"]').trigger('click');
        expect(settings.schedule.endAt).toBeNull();
        expect(futureEndInput.classes()).not.toContain('has-picker-clear');
        wrapper.destroy();
    });
});
