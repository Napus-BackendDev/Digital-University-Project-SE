import Vue from 'vue';
import { shallowMount } from '@vue/test-utils';
import ResponseSettings from '@/projects/components/context/ResponseSettings.vue';

const stubs = {
    CCard: { template: '<div><slot /></div>' },
    CCardBody: { template: '<div><slot /></div>' },
    CRow: { template: '<div><slot /></div>' },
    CCol: { template: '<div><slot /></div>' },
    CSwitch: {
        props: ['checked'],
        template: '<input type="checkbox" :checked="checked" @change="$emit(\'update:checked\', $event.target.checked)" />'
    }
};

describe('ResponseSettings.vue', () => {
    function mountComponent(settingsOverride = {}) {
        const settings = Vue.observable({
            settings: {
                collectEmail: false,
                requireLogin: false,
                limitResponse: false,
                allowEditAfterSubmit: false,
                maxResponses: null,
                emailNotifications: false,
                emailMessage: '',
                notifyCreator: false,
                confirmMessage: 'Thank you',
                ...settingsOverride
            }
        });

        const wrapper = shallowMount(ResponseSettings, {
            propsData: { settings },
            stubs,
            mocks: {
                $t: (key) => key
            }
        });

        return { wrapper, settings };
    }

    afterEach(() => {
        jest.useRealTimers();
    });

    test('public mode renders 2-option radio cards and choosing each sets requireLogin/collectEmail correctly, while private mode keeps single switch and locks collectEmail ON', async () => {
        // 1. Public mode: 2-option radio card picker for anonymous vs required email (Requirement 2.2 / B7-2)
        const { wrapper: publicWrapper, settings: publicSettings } = mountComponent({
            accessMode: 'public',
            collectEmail: false,
            requireLogin: false
        });
        const html = publicWrapper.html();

        expect(html).not.toContain('requireAll');
        expect(html).not.toContain('showAnotherResponseLink');
        expect(publicWrapper.find('[data-test="public-email-anonymous"]').exists()).toBe(true);
        expect(publicWrapper.find('[data-test="public-email-required"]').exists()).toBe(true);

        // Choosing option 2 sets requireLogin=true and collectEmail=true
        await publicWrapper.find('[data-test="public-email-required"]').trigger('click');
        expect(publicSettings.settings.requireLogin).toBe(true);
        expect(publicSettings.settings.collectEmail).toBe(true);

        // Choosing option 1 sets requireLogin=false and collectEmail=false
        await publicWrapper.find('[data-test="public-email-anonymous"]').trigger('click');
        expect(publicSettings.settings.requireLogin).toBe(false);
        expect(publicSettings.settings.collectEmail).toBe(false);
        expect(publicWrapper.emitted('auto-save').length).toBe(2);

        // 2. Private mode: toggling requireLogin does NOT disable locked collectEmail=true
        const { wrapper: privateWrapper, settings: privateSettings } = mountComponent({
            accessMode: 'private',
            collectEmail: true,
            requireLogin: true
        });
        expect(privateWrapper.find('[data-test="public-email-anonymous"]').exists()).toBe(false);
        expect(privateWrapper.find('[data-test="public-email-required"]').exists()).toBe(false);
        const privateCheckboxes = privateWrapper.findAll('input[type="checkbox"]');
        await privateCheckboxes.at(0).setChecked(false);
        expect(privateSettings.settings.requireLogin).toBe(false);
        expect(privateSettings.settings.collectEmail).toBe(true);
    });

    test('public mode radio cards support keyboard accessibility (Enter/Space)', async () => {
        const { wrapper, settings } = mountComponent({
            accessMode: 'public',
            requireLogin: false,
            collectEmail: false
        });
        const requiredCard = wrapper.find('[data-test="public-email-required"]');
        expect(requiredCard.attributes('role')).toBe('radio');
        expect(requiredCard.attributes('aria-checked')).toBe('false');

        await requiredCard.trigger('keydown.enter');
        expect(settings.settings.requireLogin).toBe(true);
        expect(settings.settings.collectEmail).toBe(true);
        expect(requiredCard.attributes('aria-checked')).toBe('true');

        const anonCard = wrapper.find('[data-test="public-email-anonymous"]');
        await anonCard.trigger('keydown.space');
        expect(settings.settings.requireLogin).toBe(false);
        expect(settings.settings.collectEmail).toBe(false);
        expect(anonCard.attributes('aria-checked')).toBe('true');
    });

    test('renders all consolidated switches and inputs and emits auto-save on toggle', async () => {
        const { wrapper, settings } = mountComponent({ accessMode: 'private' });
        const checkboxes = wrapper.findAll('input[type="checkbox"]');

        // requireLogin, limitResponse, allowEditAfterSubmit, emailNotifications, notifyCreator
        expect(checkboxes.length).toBe(5);

        // Toggle requireLogin -> index 0
        await checkboxes.at(0).setChecked(true);
        expect(settings.settings.requireLogin).toBe(true);

        // Toggle allowEditAfterSubmit -> index 2
        await checkboxes.at(2).setChecked(true);
        expect(settings.settings.allowEditAfterSubmit).toBe(true);

        // Toggle emailNotifications -> index 3 reveals emailMessage textarea
        expect(wrapper.findAll('textarea').length).toBe(1); // confirmMessage only
        await checkboxes.at(3).setChecked(true);
        expect(settings.settings.emailNotifications).toBe(true);
        expect(wrapper.findAll('textarea').length).toBe(2); // emailMessage + confirmMessage

        // Toggle notifyCreator -> index 4
        await checkboxes.at(4).setChecked(true);
        expect(settings.settings.notifyCreator).toBe(true);

        expect(wrapper.emitted('auto-save').length).toBe(4);
    });

    test('normalizes maxResponses quota input and flushes auto-save on change', async () => {
        const { wrapper, settings } = mountComponent();
        const numberInput = wrapper.find('input[type="number"]');

        numberInput.element.value = '50';
        await numberInput.trigger('input');
        expect(settings.settings.maxResponses).toBe(50);

        numberInput.element.value = '0';
        await numberInput.trigger('input');
        expect(settings.settings.maxResponses).toBeNull();

        await numberInput.trigger('change');
        expect(wrapper.emitted('auto-save').length).toBeGreaterThanOrEqual(1);
    });

    test('binds form contact organization/email overrides and flags invalid contact email', async () => {
        const { wrapper, settings } = mountComponent();
        const orgInput = wrapper.find('[data-test="contact-org-input"]');
        const emailInput = wrapper.find('[data-test="contact-email-input"]');

        expect(orgInput.exists()).toBe(true);
        expect(emailInput.exists()).toBe(true);

        await orgInput.setValue('Division of Student Affairs');
        expect(settings.settings.contactOrganization).toBe('Division of Student Affairs');

        await emailInput.setValue('invalid-email');
        expect(wrapper.vm.contactEmailError).toBe(true);
        expect(emailInput.classes()).toContain('is-invalid-contact');

        await emailInput.setValue('student.affairs@mfu.ac.th');
        expect(wrapper.vm.contactEmailError).toBe(false);
        expect(settings.settings.contactEmail).toBe('student.affairs@mfu.ac.th');
        await emailInput.trigger('change');
        expect(wrapper.emitted('auto-save').length).toBeGreaterThanOrEqual(1);
    });
});
