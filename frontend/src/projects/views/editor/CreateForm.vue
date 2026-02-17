<template>
    <div class="create-form-page">
        <!-- Top bar: Back + Preview -->
        <div class="create-form-page__topbar">
            <ButtonBack path="/editor/dashboard" />
            <div class="create-form-page__topbar-right">
                <AutoSave :saveStatus="saveStatus" />
                <ButtonPreview />
            </div>
        </div>

        <!-- Tab area -->
        <Tab 
            :title="formTitle" 
            :description="formDescription" 
            :questions="questions" 
            :settings="settings"
            @update:title="formTitle = $event" 
            @update:description="formDescription = $event"
            @auto-save="triggerAutoSave" 
        />
    </div>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue'
import ButtonPreview from '../../components/Button/ButtonPreview.vue'
import AutoSave from '../../components/Util/AutoSave.vue';
import Tab from '../../components/Tabs/Tab.vue';

export default {
    name: "CreateForm",
    components: {
        ButtonBack,
        ButtonPreview,
        AutoSave,
        Tab
    },
    data() {
        return {
            saveStatus: 'Saved',
            saveTimeout: null,
            formTitle: 'Untitled Form',
            formDescription: '',
            questions: [],
            settings: {
                startDateTime: '',
                endDateTime: '',
                accessType: 'Anyone with the link',
                newCollaborator: {
                    email: '',
                    role: 'Editor'
                },
                collectEmails: false,
                limitOneResponse: false,
                allowEditing: false,
                showProgressBar: false
            },
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        async onInit() {
            const formId = this.$route.params.id;
            try {
                const formData = await this.$store.dispatch('Forms/getFormById', { _id: formId });
                if (formData) {
                    this.formTitle = this.getLang(formData.title) || 'Untitled Form';
                    this.formDescription = this.getLang(formData.description) || '';

                    if (formData.settings) {
                        this.settings.collectEmails = formData.settings.collectEmail;
                        this.settings.limitOneResponse = formData.settings.limitResponse;
                        this.settings.showProgressBar = formData.settings.progressBar;
                    }
                    if (formData.schedule) {
                        this.settings.startDateTime = this.formatDateForInput(formData.schedule.startAt);
                        this.settings.endDateTime = this.formatDateForInput(formData.schedule.endAt);
                    }
                }
            } catch (error) {
                console.error("Error fetching form:", error);
            }
        },
        getLang(data) {
            if (!data) return '';
            if (typeof data === 'string') return data;
            if (!Array.isArray(data)) return '';
            const content = data.find(item => item.key === 'en') || data[0];
            return content ? content.value : '';
        },
        formatDateForInput(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const pad = (num) => num.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
        triggerAutoSave() {
            this.saveStatus = 'Saving...';
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveForm();
            }, 1500);
        },
        async saveForm() {
            try {
                const formData = {
                    _id: this.$route.params.id,
                    title: [{ key: 'en', value: this.formTitle }],
                    description: [{ key: 'en', value: this.formDescription }],
                    schedule: {
                        startAt: this.settings.startDateTime,
                        endAt: this.settings.endDateTime
                    },
                    settings: {
                        collectEmail: this.settings.collectEmails,
                        limitResponse: this.settings.limitOneResponse,
                        progressBar: this.settings.showProgressBar,
                    },
                };
                console.log('Auto-saving form data...', formData);
                await this.$store.dispatch('Forms/updateForm', formData);
                this.saveStatus = 'Saved';
                const now = new Date();
                console.log(`Saved at ${now.toLocaleTimeString()}`);
            } catch (error) {
                console.error('Auto-save failed:', error);
                this.saveStatus = 'Error saving';
            }
        }
    },
    computed: {}
}
</script>

<style scoped lang="scss">
.create-form-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1088px;
    margin: 0 auto;

    &__topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__topbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }
}
</style>