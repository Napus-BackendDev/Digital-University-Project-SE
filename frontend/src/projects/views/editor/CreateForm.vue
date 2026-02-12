<template>
    <div>
        <CRow class="mb-4">
            <CCol col="12" class="d-flex justify-content-between align-items-center">
                <ButtonBack path="/editor/dashboard" />
                <div class="d-flex align-items-center">
                    <AutoSave :saveStatus="saveStatus" />
                    <ButtonPreview />
                </div>
            </CCol>
        </CRow>

        <CRow>
            <CCol col="12" class="mb-4">
                <Tab 
                    :title="formTitle" 
                    :description="formDescription" 
                    :questions="questions" 
                    :settings="settings"
                    @update:title="formTitle = $event" 
                    @update:description="formDescription = $event"
                    @auto-save="triggerAutoSave" 
                />
            </CCol>
        </CRow>
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
            const formId = this.$route.params._id;
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

            // Try to find 'en' or use the first one
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

            // Debounce save by 1.5 seconds
            this.saveTimeout = setTimeout(() => {
                this.saveForm();
            }, 1500);
        },
        async saveForm() {
            try {
                const formData = {
                    _id: this.$route.params._id,
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
    computed: {
    }
}
</script>

<style lang="scss">
.form-title-input input {
    font-size: 2rem !important;
    padding: 0px !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-weight: bold;
    color: #1a202c;
    height: auto !important;
}

.form-title-input input:focus {
    border-bottom: 2px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.form-desc-input textarea {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    resize: none;
    padding: 0px !important;
    color: #64748b;
    font-size: 1rem;
}

.form-desc-input textarea:focus {
    border-bottom: 1px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.sticky-sidebar {
    position: sticky;
    top: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>