<template>
    <div class="mt-3">
        <FormStatus :settings="settings" @auto-save="triggerAutoSave" />
        <AccessControl :settings="settings" @auto-save="triggerAutoSave" />
        <ResponseSettings :settings="settings" @auto-save="triggerAutoSave" />
        <SendForm />
    </div>
</template>

<script>
import FormStatus from '../context/FormStatus.vue';
import AccessControl from '../context/AccessControl.vue';
import ResponseSettings from '../context/ResponseSettings.vue';
import SendForm from '../context/SendForm.vue';

export default {
    name: 'TabSetting',
    components: {
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
                console.log('Settings in TabSetting:', newVal);
            },
            deep: true,
            immediate: true
        }
    }
}
</script>
