<template>
    <div class="flex-grow-1">
        <Header
            :title="headerTitle"
            :description="headerDescription"
            :isSaving="isSaving"
            :isSaved="isSaved"
        >
            <template #actions>
                <div class="builder-top-actions d-flex flex-wrap align-items-center gap-2">
                    <!-- Back to Manage Forms Table Button -->
                    <button
                        type="button"
                        class="top-action-btn is-back"
                        @click="goBackToManage"
                    >
                        <CIcon name="cil-arrow-left" size="sm" class="mr-1" />
                        <span>กลับหน้าตารางฟอร์ม</span>
                    </button>

                    <!-- Launch / Replay Step-by-Step Wizard Button -->
                    <button
                        type="button"
                        class="top-action-btn is-wizard"
                        :class="{ 'is-active': isWizardActive }"
                        @click="toggleWizard"
                    >
                        <CIcon name="cil-layers" size="sm" class="mr-1" />
                        <span>{{ isWizardActive ? 'โหมดสอนสร้างฟอร์ม (กำลังเปิด)' : 'โหมดสอนสร้างฟอร์ม (Wizard)' }}</span>
                    </button>

                    <!-- Preview & Share Buttons (Spotlighted in Step 4) -->
                    <div
                        class="d-inline-flex flex-wrap align-items-center gap-2"
                        :class="{ 'top-actions-spotlight': isWizardActive && wizardStep === 4 }"
                    >
                        <button
                            type="button"
                            class="top-action-btn is-preview"
                            @click="openPreviewPage"
                        >
                            <CIcon name="cil-external-link" size="sm" class="mr-1" />
                            <span>Preview (ดูตัวอย่างผู้ตอบ)</span>
                        </button>

                        <button
                            type="button"
                            class="top-action-btn is-share"
                            @click="openShareModal"
                        >
                            <CIcon name="cil-qr-code" size="sm" class="mr-1" />
                            <span>Share / QR Code</span>
                        </button>
                    </div>

                    <!-- Manual Save Button -->
                    <button
                        type="button"
                        class="top-action-btn is-save"
                        @click="triggerAutoSave"
                    >
                        <CIcon name="cil-save" size="sm" class="mr-1" />
                        <span>Save Form</span>
                    </button>
                </div>
            </template>
        </Header>

        <!-- Completion Banner when Wizard is finished -->
        <transition name="fade">
            <div v-if="wizardCompletedBanner" class="wizard-done-banner mb-3 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <CIcon name="cil-check-circle" size="lg" class="mr-2" />
                    <span>
                        <strong>เสร็จสิ้นการสร้างแบบสอบถามครั้งแรกเรียบร้อยแล้ว!</strong>
                        คุณสามารถแก้ไขฟอร์มต่อได้ตามปกติ หรือกดปุ่ม "โหมดสอนสร้างฟอร์ม (Wizard)" ด้านบนเพื่อเปิดดูซ้ำได้ทุกเมื่อ
                    </span>
                </div>
                <button type="button" class="banner-close-btn" @click="wizardCompletedBanner = false">
                    <CIcon name="cil-x" size="sm" />
                </button>
            </div>
        </transition>

        <!-- Top 4-Step Progress Bar (FormBuilderWizard Stepper Component) -->
        <FormBuilderWizard
            v-if="isWizardActive"
            mode="stepper"
            :currentStep="wizardStep"
            :form="formData"
            @select-step="goToWizardStep"
            @skip="skipWizard"
        />

        <!-- Main Builder Workspace & Right Panel -->
        <Tab
            ref="builderTab"
            :form="formData"
            :activeTab.sync="activeTab"
            :isWizardActive="isWizardActive"
            :wizardStep="wizardStep"
            @auto-save="triggerAutoSave"
            @wizard-next="nextWizardStep"
            @wizard-prev="prevWizardStep"
            @wizard-skip="skipWizard"
            @wizard-finish="finishWizard"
            @wizard-open-preview="openPreviewPage"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Tab from '../../components/Tabs/Tab.vue';
import Header from '../../components/Util/Header.vue';
import FormBuilderWizard from '../../components/Wizard/FormBuilderWizard.vue';

export default {
    name: "CreateForm",
    components: {
        Tab,
        Header,
        FormBuilderWizard
    },
    data() {
        return {
            formData: {},
            activeTab: 'question',
            isNewDuplication: false,
            isSaving: false,
            isSaved: false,
            saveTimer: null,
            isWizardActive: false,
            wizardStep: 1,
            wizardCompletedBanner: false
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
        },
        '$route.query.wizard': {
            handler(val) {
                if (val === '1') {
                    this.isWizardActive = true;
                    this.wizardStep = 1;
                    this.activeTab = 'question';
                }
            },
            immediate: true
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
                this.checkAutoStartWizard();
                return;
            }

            const formId = this.$route.params._id;
            if (!formId || formId === 'new') return;

            try {
                this.formData = await this.$store.dispatch('Forms/getById', { _id: formId });

                const currentUserId = this.user?._id ? String(this.user._id) : null;
                const creatorId = String(this.formData?.creator?._id || this.formData?.creator || '');
                if (currentUserId && this.formData && creatorId) {
                    const isCreator = creatorId === currentUserId;
                    let isEditor = false;
                    if (Array.isArray(this.formData.collaborator)) {
                        isEditor = this.formData.collaborator.some((item) => {
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

                this.checkAutoStartWizard();
            } catch (error) {
                console.error("Error fetching form:", error);
                this.formData = {};
            }
        },
        checkAutoStartWizard() {
            const userId = this.user?._id || 'guest';
            const doneKey = `mfu_wizard_done_${userId}`;
            const hasDone = localStorage.getItem(doneKey) === 'true';
            const queryWizard = this.$route.query.wizard === '1';

            const isUntitledNewForm = (() => {
                if (!this.formData) return false;
                const qLen = Array.isArray(this.formData.questions) ? this.formData.questions.length : 0;
                const firstTitle = Array.isArray(this.formData.title) && this.formData.title[0]
                    ? String(this.formData.title[0].value || '').trim().toLowerCase()
                    : '';
                return qLen === 0 && (firstTitle === '' || firstTitle === 'untitled form');
            })();

            if (queryWizard || !hasDone || isUntitledNewForm) {
                this.isWizardActive = true;
                const savedStep = Number(localStorage.getItem(`mfu_wizard_step_${this.formData?._id}`));
                if (savedStep >= 1 && savedStep <= 4 && !queryWizard) {
                    this.goToWizardStep(savedStep);
                } else {
                    this.goToWizardStep(1);
                }
            }
        },
        toggleWizard() {
            if (this.isWizardActive) {
                this.isWizardActive = false;
            } else {
                this.isWizardActive = true;
                this.wizardCompletedBanner = false;
                this.goToWizardStep(1);
            }
        },
        goToWizardStep(stepNum) {
            const target = Math.max(1, Math.min(4, Number(stepNum) || 1));
            this.wizardStep = target;
            if (this.formData && this.formData._id) {
                localStorage.setItem(`mfu_wizard_step_${this.formData._id}`, String(target));
            }
            if (target === 1 || target === 2) {
                this.activeTab = 'question';
            } else if (target === 3) {
                this.activeTab = 'setting';
            } else if (target === 4) {
                this.activeTab = 'question';
            }
        },
        nextWizardStep() {
            this.triggerAutoSave();
            if (this.wizardStep < 4) {
                this.goToWizardStep(this.wizardStep + 1);
            }
        },
        prevWizardStep() {
            if (this.wizardStep > 1) {
                this.goToWizardStep(this.wizardStep - 1);
            }
        },
        skipWizard() {
            this.isWizardActive = false;
        },
        finishWizard() {
            const userId = this.user?._id || 'guest';
            localStorage.setItem(`mfu_wizard_done_${userId}`, 'true');
            if (this.formData && this.formData._id) {
                localStorage.removeItem(`mfu_wizard_step_${this.formData._id}`);
            }
            this.triggerAutoSave();
            this.isWizardActive = false;
            this.wizardCompletedBanner = true;
        },
        goBackToManage() {
            this.$router.push({ name: 'ManageForms' });
        },
        openPreviewPage() {
            const id = this.formData?._id || this.$route.params._id;
            if (!id) return;
            this.$router.push({ name: 'UserFillForm', params: { _id: id }, query: { mode: 'preview' } });
        },
        openShareModal() {
            if (this.$refs.builderTab && typeof this.$refs.builderTab.openQRModal === 'function') {
                this.$refs.builderTab.openQRModal();
            } else {
                this.isWizardActive = true;
                this.goToWizardStep(4);
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
                setTimeout(() => {
                    this.isSaving = false;
                    this.isSaved = true;
                    
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
    font-size: 1.75rem !important;
    padding: 0px !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-weight: 700;
    color: #0f172a;
    height: auto !important;
}

.form-title-input input:focus {
    border-bottom: 2px solid #cbd5e1 !important;
    border-radius: 0 !important;
}

.form-desc-input textarea {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    resize: none;
    padding: 0px !important;
    color: #334155;
    font-size: 0.98rem;
}

.form-desc-input textarea:focus {
    border-bottom: 1px solid #cbd5e1 !important;
    border-radius: 0 !important;
}

.sticky-sidebar {
    position: sticky;
    top: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Top Builder Action Buttons matching PAGE 10 Spec */
.builder-top-actions {
    gap: 0.5rem;
}

.top-action-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.9rem;
    border-radius: 10px;
    font-size: 0.83rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s ease;
}

.top-action-btn:hover {
    transform: translateY(-1px);
}

.top-action-btn.is-back {
    background-color: #f1f5f9;
    border: 1.5px solid #64748b;
    color: #334155;
}

.top-action-btn.is-wizard {
    background-color: #f5f3ff;
    border: 2px solid #7c3aed;
    color: #5b21b6;
}

.top-action-btn.is-wizard.is-active {
    background-color: #7c3aed;
    border-color: #4c1d95;
    color: #ffffff;
}

.top-action-btn.is-preview {
    background-color: #eff6ff;
    border: 1.5px solid #2563eb;
    color: #1d4ed8;
}

.top-action-btn.is-share {
    background-color: #dcfce7;
    border: 1.5px solid #16a34a;
    color: #15803d;
}

.top-action-btn.is-save {
    background-color: #8b1f1f;
    border: 1.5px solid #7f1d1d;
    color: #ffffff;
}

.top-actions-spotlight {
    padding: 0.3rem 0.45rem;
    border: 2.5px dashed #f59e0b;
    background-color: #fffbeb;
    border-radius: 12px;
}

.wizard-done-banner {
    background-color: #f0fdf4;
    border: 1.5px solid #16a34a;
    color: #14532d;
    border-radius: 12px;
    padding: 0.75rem 1.15rem;
    font-size: 0.9rem;
}

.banner-close-btn {
    background: transparent;
    border: none;
    color: #14532d;
    cursor: pointer;
    padding: 0.25rem;
}

/* Modern Dropdown Styling */
.dropdown-menu {
    border-radius: 0.75rem !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e2e8f0 !important;
    padding: 0.35rem !important;
}

.dropdown-item {
    border-radius: 0.5rem !important;
    font-size: 0.85rem !important;
    font-weight: 500 !important;
    padding: 0.4rem 0.75rem !important;
    color: #475569 !important;
    transition: all 0.15s ease !important;
}

.dropdown-item.active,
.dropdown-item:active {
    background-color: #f0f7ff !important;
    color: #1e40af !important;
    font-weight: 600 !important;
}

.dropdown-item:hover:not(.active) {
    background: #f1f5f9 !important;
    color: #0f172a !important;
}
</style>
