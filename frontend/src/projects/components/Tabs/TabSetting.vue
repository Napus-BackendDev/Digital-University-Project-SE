<template>
    <div>
        <FormLanguageSettings v-if="section === 'language'" :form="settings" @auto-save="triggerAutoSave" />
        <template v-else-if="section === 'access'">
            <AccessControl :settings="settings" @auto-save="triggerAutoSave" />
            <OrganizationControl :settings="settings" @auto-save="triggerAutoSave" />
        </template>
        <template v-else-if="section === 'form_setting'">
            <FormStatus :settings="settings" @auto-save="triggerAutoSave" />
            <ResponseSettings :settings="settings" @auto-save="triggerAutoSave" />
        </template>
        <PublishSettings v-else-if="section === 'publish'" :form="settings" @auto-save="triggerAutoSave" />
    </div>
</template>

<script>
import OrganizationControl from '../context/OrganizationControl.vue';
import FormStatus from '../context/FormStatus.vue';
import AccessControl from '../context/AccessControl.vue';
import ResponseSettings from '../context/ResponseSettings.vue';
import FormLanguageSettings from '../context/FormLanguageSettings.vue';
import PublishSettings from '../context/PublishSettings.vue';

export default {
    name: 'TabSetting',
    components: {
        OrganizationControl,
        FormStatus,
        AccessControl,
        ResponseSettings,
        FormLanguageSettings,
        PublishSettings
    },
    props: {
        settings: {
            type: Object,
            required: true
        },
        section: {
            type: String,
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
