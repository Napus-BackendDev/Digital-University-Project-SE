<template>
    <div class="flex-grow-1">
        <Header :title="headerTitle" :description="headerDescription" :isSaving="isSaving" :isSaved="isSaved" />
        <Container>
            <Tab :form="formData" :activeTab.sync="activeTab" @auto-save="triggerAutoSave" />
        </Container>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Tab from '../../components/Tabs/Tab.vue';
import Header from '../../components/Util/Header.vue';

export default {
    name: "CreateForm",
    components: {
        Tab,
        Header
    },
    data() {
        return {
            formData: {},
            activeTab: 'question',
            isNewDuplication: false,
            isSaving: false,
            isSaved: false,
            saveTimer: null
        };
    },
    created() {
        this.onInit();
    },
    watch: {
        user: {
            async handler(val, oldVal) {
                if (val && val._id && (!oldVal || val._id !== oldVal._id)) {
                    await this.onInit();
                }
            },
            immediate: false
        }
    },
    methods: {
        async onInit() {
            // Check if we have duplicated data from the buffer
            if (this.duplicateBuffer) {
                this.formData = JSON.parse(JSON.stringify(this.duplicateBuffer));
                this.isNewDuplication = true;
                // Clear the buffer after taking the data
                this.$store.commit('Forms/setDuplicateBuffer', null);
                return;
            }

            const formId = this.$route.params._id;
            if (!formId || formId === 'new') return;

            try {
                this.formData = await this.$store.dispatch('Forms/getById', { _id: formId });

                const currentUserId = this.user?._id ? String(this.user._id) : null;
                if (currentUserId && this.formData) {
                    const creatorId = String(this.formData.creator?._id || this.formData.creator || '');
                    const isCreator = creatorId === currentUserId;
                    let isEditor = false;
                    if (Array.isArray(this.formData.controll)) {
                        isEditor = this.formData.controll.some((item) => {
                            const collabUserId = String(item?.user?._id || item?.user || '');
                            if (collabUserId !== currentUserId) return false;
                            const typeTitle = Array.isArray(item?.type?.title)
                                ? item.type.title.map((t) => String(t?.value || '')).join(' ').toLowerCase()
                                : String(item?.type?.title || '').toLowerCase();
                            return typeTitle.includes('edit') || typeTitle.includes('แก้ไข');
                        });
                    }

                    const roleTitle = Array.isArray(this.user?.role?.title)
                        ? this.user.role.title.map((t) => String(t?.value || '')).join(' ').toLowerCase()
                        : String(this.user?.role?.title || '').toLowerCase();
                    const isAdmin = roleTitle.includes('admin');

                    if (!isAdmin && !isCreator && !isEditor) {
                        this.$router.replace({ name: 'ManageForms' });
                        return;
                    }
                }
            } catch (error) {
                console.error("Error fetching form:", error);
                this.formData = {}; // Default to empty object on error
            }
        },
        async triggerAutoSave() {
            if (!this.formData || Object.keys(this.formData).length === 0) return;
            this.isSaving = true;
            this.isSaved = false;
            
            if (this.saveTimer) clearTimeout(this.saveTimer);

            try {
                if (this.isNewDuplication) {                    
                    // 1. Create the Form
                    const formPayload = {
                        title: this.formData.title,
                        description: this.formData.description,
                        settings: this.formData.settings,
                        organization: this.formData.organization || [],
                        status: this.formData.status || '69b0e3adf864c1088c19da36',
                        creator: this.user?._id
                    };
                    const formRes = await this.$store.dispatch('Forms/create', formPayload);
                    const newForm = formRes?.data?.data || formRes?.data || formRes;
                    const newId = newForm?._id || newForm?.id;

                    if (!newId) throw new Error("Failed to create new form");

                    // 2. Create the Questions
                    const questions = this.formData.questions || [];
                    for (const q of questions) {
                        const qPayload = {
                            ...q,
                            form: newId
                        };
                        // Remove temporary ID so DB can create a new one
                        if (qPayload._id && String(qPayload._id).startsWith('tmp-')) {
                            delete qPayload._id;
                        }
                        await this.$store.dispatch('Questions/create', qPayload);
                    }

                    // 3. Finalize and Redirect
                    this.isNewDuplication = false;
                    this.formData._id = newId;
                    this.$router.replace({ name: 'EditorCreateForm', params: { _id: newId } });
                } else {
                    const payload = {
                        ...this.formData,
                        user: this.user?._id
                    };
                    await this.$store.dispatch('Forms/update', payload);
                }
            } catch (error) {
                console.error("Error saving form:", error);
            } finally {
                // Delay showing "Saved" slightly for better visual transition
                setTimeout(() => {
                    this.isSaving = false;
                    this.isSaved = true;
                    
                    // Clear "Saved" message after 3 seconds
                    this.saveTimer = setTimeout(() => {
                        this.isSaved = false;
                    }, 3000);
                }, 500);
            }
        }
    },
    computed: {
        ...mapGetters('User', ['user']),
        ...mapGetters('Forms', ['duplicateBuffer']),
        headerTitle() {
            if (this.activeTab === 'question') return this.$t('editor.header.questionTitle');
            if (this.activeTab === 'response') return this.$t('editor.header.responseTitle');
            if (this.activeTab === 'setting') return this.$t('editor.header.settingTitle');
            
            // Default: show form title for 'question' tab
            if (!this.formData || !this.formData.title) return this.$t('common.loading');
            if (Array.isArray(this.formData.title)) {
                return this.formData.title[0]?.value || this.$t('common.untitled');
            }
            return this.formData.title || this.$t('common.untitled');
        },
        headerDescription() {
            if (this.activeTab === 'question') return this.$t('editor.header.questionDesc');
            if (this.activeTab === 'response') return this.$t('editor.header.responseDesc');
            if (this.activeTab === 'setting') return this.$t('editor.header.settingDesc');

            // Default: show form description for 'question' tab
            if (!this.formData || !this.formData.description) return "";
            if (Array.isArray(this.formData.description)) {
                return this.formData.description[0]?.value || "";
            }
            return this.formData.description || "";
        }
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
