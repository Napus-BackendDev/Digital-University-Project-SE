<template>
    <div class="mt-3">
        <FormStatus :settings="settings" @auto-save="triggerAutoSave" />
        <OrganizationControl :settings="settings" @auto-save="triggerAutoSave" />
        <AccessControl :settings="settings" @auto-save="triggerAutoSave" />
        <ResponseSettings :settings="settings" @auto-save="triggerAutoSave" />
        <SendForm />
    </div>
</template>

<script>
import OrganizationControl from '../context/OrganizationControl.vue';
import FormStatus from '../context/FormStatus.vue';
import AccessControl from '../context/AccessControl.vue';
import ResponseSettings from '../context/ResponseSettings.vue';
import SendForm from '../context/SendForm.vue';

export default {
    name: 'TabSetting',
    components: {
        OrganizationControl,
        FormStatus,
        AccessControl,
        ResponseSettings,
        SendForm
    },
    props: {
        settings: {
            type: Object,
            required: true
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        }
    },
    watch: {
        settings: {
            handler(newVal) {
            },
            deep: true,
            immediate: true
        }
    }
}
</script>
