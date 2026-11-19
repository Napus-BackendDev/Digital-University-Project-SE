<template>
    <div class="flex-grow-1" :data-editor-ready="canRenderEditor ? 'true' : 'false'">
        <Header :title="headerTitle" :description="headerDescription" :isSaving="isSaving" :isSaved="isSaved">
            <template v-if="canTogglePublish" #actions>
                <div class="d-flex flex-column align-items-end hero-publish-wrapper">
                    <div class="d-flex align-items-center flex-wrap hero-publish-actions">
                        <span class="hero-status-pill" :class="heroStatusPillClass">
                            <span class="hero-status-dot"></span>
                            <span>{{ heroStatusLabel }}</span>
                        </span>
                        <CButton
                            v-if="!isFormPublished"
                            color="success"
                            class="hero-publish-btn d-inline-flex align-items-center font-weight-bold shadow-sm"
                            :disabled="isPublishing || isSaving || isPublishBlocked"
                            :title="publishBlockMessage"
                            @click="togglePublishForm"
                        >
                            <CSpinner v-if="isPublishing" size="sm" class="mr-2" />
                            <CIcon v-else name="cil-check-circle" size="sm" class="mr-2" />
                            <span>{{ $t('editor.header.publishForm') }}</span>
                        </CButton>
                        <CButton
                            v-else
                            color="light"
                            variant="outline"
                            class="hero-unpublish-btn d-inline-flex align-items-center font-weight-bold"
                            :disabled="isPublishing || isSaving"
                            @click="togglePublishForm"
                        >
                            <CSpinner v-if="isPublishing" size="sm" class="mr-2" />
                            <CIcon v-else name="cil-ban" size="sm" class="mr-2" />
                            <span>{{ $t('editor.header.unpublishForm') }}</span>
                        </CButton>
                    </div>
                    <div
                        v-if="heroValidationBanner"
                        class="hero-publish-warning mt-2 d-flex align-items-center flex-wrap"
                        :class="heroValidationBanner.isError ? 'is-error' : 'is-hint'"
                        role="alert"
                        data-testid="hero-publish-validation-error"
                    >
                        <CIcon :name="heroValidationBanner.isError ? 'cil-warning' : 'cil-info'" size="sm" class="mr-2 flex-shrink-0" />
                        <span class="small font-weight-bold">{{ heroValidationBanner.text }}</span>
                        <button
                            v-if="activeTab !== 'setting'"
                            type="button"
                            class="hero-fix-schedule-link ml-2"
                            @click="activeTab = 'setting'"
                        >
                            {{ $t('editor.header.goToScheduleSettings') }}
                        </button>
                    </div>
                </div>
            </template>
        </Header>

        <Tab
            v-if="canRenderEditor"
            ref="mainTab"
            :form="formData"
            :activeTab.sync="activeTab"
            :readOnly="isReadOnlyViewer"
            @auto-save="triggerAutoSave"
        />
        <div v-else class="d-flex justify-content-center align-items-center py-5 text-muted">
            <div class="spinner-border spinner-border-sm mr-2" role="status"></div>
            <span>{{ $t('common.loading') }}</span>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Tab from '../../components/Tabs/Tab.vue';
import Header from '../../components/Util/Header.vue';
import { getUserFormAccessRole, isUserAdmin } from '@/projects/utils/analytics';
import {
    getScheduleStatus,
    isSchedulePublished,
    validateScheduleForPublish,
    buildPublishedSchedule,
    buildUnpublishedSchedule,
    getScheduleValidationMessageKey
} from '@/projects/utils/formPolicy';

export default {
    name: "CreateForm",
    components: {
        Tab,
        Header
    },
    data() {
        const qTab = this.$route && this.$route.query && this.$route.query.tab;
        return {
            formData: {},
            activeTab: ['question', 'setting'].includes(qTab) ? qTab : 'question',
            accessChecked: false,
            isNewDuplication: false,
            isSaving: false,
            isSaved: false,
            isPublishing: false,
            publishAttemptError: '',
            nowMs: Date.now(),
            clockTimer: null,
            saveTimer: null
        };
    },
    created() {
        const qTab = this.$route && this.$route.query && this.$route.query.tab;
        const formId = this.$route && this.$route.params && this.$route.params._id;
        if (qTab === 'response' && formId && formId !== 'new') {
            Promise.resolve(this.$router.replace({ name: 'AnalyticsFormReport', params: { formId } })).catch(() => {});
            return;
        }
        this.onInit();
    },
    mounted() {
        this.clockTimer = setInterval(() => {
            this.nowMs = Date.now();
        }, 15000);
    },
    beforeDestroy() {
        if (this.clockTimer) {
            clearInterval(this.clockTimer);
            this.clockTimer = null;
        }
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
    },
    watch: {
        'formData.schedule': {
            handler() {
                this.publishAttemptError = '';
            },
            deep: true
        },
        '$route.params._id'(newId, oldId) {
            if (newId !== oldId) {
                this.onInit();
            }
        },
        '$route.query.tab'(val) {
            const formId = this.$route && this.$route.params && this.$route.params._id;
            if (val === 'response' && formId && formId !== 'new') {
                this.$router.replace({ name: 'AnalyticsFormReport', params: { formId } });
                return;
            }
            if (['question', 'setting'].includes(val)) {
                this.activeTab = val;
            }
        },
        isReadOnlyViewer(val) {
            if (val) {
                const formId = (this.$route && this.$route.params && this.$route.params._id) || (this.formData && this.formData._id);
                if (formId && formId !== 'new') {
                    this.$router.replace({ name: 'AnalyticsFormReport', params: { formId } });
                }
            }
        },
        user: {
            async handler(val, oldVal) {
                if (val && val._id && (!oldVal || val._id !== oldVal._id)) {
                    if (this.isNewDuplication && !this.formData._id) {
                        await this.triggerAutoSave();
                        return;
                    }
                    await this.onInit();
                }
            },
            immediate: false
        }
    },
    methods: {
        async onInit() {
            this.accessChecked = false;
            // Check if we have duplicated data from the buffer
            if (this.duplicateBuffer) {
                this.formData = JSON.parse(JSON.stringify(this.duplicateBuffer));
                this.formData.schedule = {
                    isPublished: false,
                    mode: 'always',
                    startAt: null,
                    endAt: null
                };
                this.isNewDuplication = true;
                this.accessChecked = true;
                // Clear the buffer after taking the data
                this.$store.commit('Forms/setDuplicateBuffer', null);
                if (this.user && this.user._id) {
                    await this.triggerAutoSave();
                }
                return;
            }

            const formId = this.$route.params._id;
            if (!formId || formId === 'new') {
                this.accessChecked = true;
                return;
            }

            try {
                if (!this.formData || String(this.formData._id || '') !== String(formId)) {
                    try {
                        this.formData = await this.$store.dispatch('Forms/getById', { _id: formId });
                    } catch (firstErr) {
                        await new Promise(resolve => setTimeout(resolve, 250));
                        this.formData = await this.$store.dispatch('Forms/getById', { _id: formId });
                    }
                }

                const currentUserId = this.user?._id ? String(this.user._id) : null;
                if (!currentUserId) {
                    return;
                }

                if (this.formData) {
                    if (!this.formData.schedule || typeof this.formData.schedule !== 'object') {
                        this.$set(this.formData, 'schedule', {
                            isPublished: false,
                            mode: 'always',
                            startAt: null,
                            endAt: null
                        });
                    }
                    const accessRole = getUserFormAccessRole(this.formData, this.user);
                    if (!accessRole) {
                        this.$router.replace({ name: 'ManageForms' });
                        return;
                    }
                    if (!isUserAdmin(this.user) && accessRole === 'viewer') {
                        this.$router.replace({ name: 'AnalyticsFormReport', params: { formId } });
                        return;
                    }
                    this.accessChecked = true;
                }
            } catch (error) {
                console.error("Error fetching form:", error);
                this.formData = {}; // Default to empty object on error
            }
        },
        async triggerAutoSave() {
            if (!this.canRenderEditor || this.isReadOnlyViewer) return;
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
                        schedule: this.formData.schedule || { isPublished: false, mode: 'always', startAt: null, endAt: null },
                        settings: this.formData.settings,
                        organization: this.formData.organization || [],
                        originalFormId: this.formData.originalFormId || null,
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

                    // 3. Finalize, reload persisted questions, and Redirect
                    this.isNewDuplication = false;
                    const savedDoc = await this.$store.dispatch('Forms/getById', { _id: newId });
                    if (savedDoc && savedDoc._id) {
                        this.formData = savedDoc;
                    } else {
                        this.formData._id = newId;
                    }
                    Promise.resolve(
                        this.$router.replace({ name: 'EditorCreateForm', params: { _id: newId } })
                    ).catch(() => {});
                } else {
                    const formId = this.formData._id || this.formData.id || this.$route.params._id;
                    const payload = {
                        ...this.formData,
                        _id: formId,
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
        },
        async togglePublishForm() {
            if (!this.canTogglePublish || this.isPublishing) return;
            this.nowMs = Date.now();
            this.publishAttemptError = '';
            const now = new Date(this.nowMs);
            const currentSchedule = (this.formData && this.formData.schedule) || {};

            if (!this.isFormPublished) {
                const prepared = buildPublishedSchedule(currentSchedule, now);
                if (!prepared.valid) {
                    const msgKey = getScheduleValidationMessageKey(prepared.reason);
                    this.publishAttemptError = msgKey ? this.$t(msgKey) : (prepared.reason || 'Invalid schedule');
                    return;
                }
                this.isPublishing = true;
                try {
                    this.$set(this.formData, 'schedule', prepared.schedule);
                    await this.triggerAutoSave();
                } finally {
                    this.isPublishing = false;
                }
                return;
            }

            this.isPublishing = true;
            try {
                this.$set(this.formData, 'schedule', buildUnpublishedSchedule(currentSchedule));
                await this.triggerAutoSave();
            } finally {
                this.isPublishing = false;
            }
        }
    },
    computed: {
        ...mapGetters('User', ['user']),
        ...mapGetters('Forms', ['duplicateBuffer']),
        formAccessRole() {
            return getUserFormAccessRole(this.formData, this.user);
        },
        isReadOnlyViewer() {
            return !isUserAdmin(this.user) && this.formAccessRole === 'viewer';
        },
        canRenderEditor() {
            if (this.isNewDuplication) return true;
            const formId = this.$route && this.$route.params && this.$route.params._id;
            if (!formId || formId === 'new') return Boolean(this.accessChecked);
            return Boolean(this.accessChecked && this.user && this.user._id && this.formData && this.formData._id && this.formAccessRole);
        },
        nowDate() {
            return new Date(this.nowMs);
        },
        formScheduleStatus() {
            return getScheduleStatus(this.formData && this.formData.schedule, this.nowDate);
        },
        isFormPublished() {
            return isSchedulePublished(this.formData && this.formData.schedule);
        },
        publishValidation() {
            return validateScheduleForPublish(this.formData && this.formData.schedule, this.nowDate);
        },
        isPublishBlocked() {
            return !this.isFormPublished && !this.publishValidation.valid;
        },
        publishBlockMessage() {
            if (!this.isPublishBlocked) return '';
            const key = getScheduleValidationMessageKey(this.publishValidation.reason);
            return key ? this.$t(key) : '';
        },
        heroValidationBanner() {
            if (this.publishAttemptError) {
                return {
                    isError: true,
                    text: `${this.$t('editor.header.publishBlockedPrefix')} ${this.publishAttemptError}`
                };
            }
            if (!this.isPublishBlocked) return null;
            const errorReasons = ['END_IN_PAST', 'END_BEFORE_START', 'START_MUST_BE_FUTURE'];
            if (!errorReasons.includes(this.publishValidation.reason)) {
                return null;
            }
            return {
                isError: true,
                text: `${this.$t('editor.header.publishBlockedPrefix')} ${this.publishBlockMessage}`
            };
        },
        heroStatusPillClass() {
            switch (this.formScheduleStatus) {
                case 'open':
                case 'open_forever':
                    return 'is-live';
                case 'scheduled':
                    return 'is-scheduled';
                case 'closed':
                case 'closed_forever':
                    return 'is-closed';
                default:
                    return 'is-draft';
            }
        },
        canTogglePublish() {
            return Boolean(this.canRenderEditor && !this.isReadOnlyViewer && this.formData && this.formData._id);
        },
        heroStatusLabel() {
            switch (this.formScheduleStatus) {
                case 'open':
                case 'open_forever':
                    return this.$t('editor.header.statusPublished');
                case 'scheduled':
                    return this.$t('editor.settings.status.scheduled');
                case 'closed':
                case 'closed_forever':
                    return this.$t('editor.settings.status.closed');
                default:
                    return this.$t('editor.settings.status.draft');
            }
        },
        headerTitle() {
            if (this.activeTab === 'question') return this.$t('editor.header.questionTitle');
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
.form-title-input input,
.form-title-input textarea {
    font-size: 1.75rem !important;
    line-height: 1.35 !important;
    padding: 0.1rem 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-weight: bold;
    color: #1a202c;
    min-height: 2.5rem;
    resize: none !important;
    overflow: hidden !important;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.form-title-input input:focus,
.form-title-input textarea:focus {
    border-bottom: 2px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.form-desc-input textarea {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    resize: none !important;
    overflow: hidden !important;
    padding: 0.4rem 0 !important;
    line-height: 1.5 !important;
    min-height: 2.25rem;
    color: #64748b;
    font-size: 0.98rem;
    overflow-wrap: anywhere;
    word-break: break-word;
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

.hero-publish-actions {
    gap: 10px;
}

.hero-publish-wrapper {
    max-width: 100%;
}

.hero-status-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.42rem 0.9rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
}

.hero-status-pill.is-draft {
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
}

.hero-status-pill.is-live {
    background-color: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.hero-status-pill.is-scheduled {
    background-color: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
}

.hero-status-pill.is-closed {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
}

.hero-publish-warning {
    padding: 0.4rem 0.75rem;
    border-radius: 10px;
    max-width: 460px;
    text-align: left;
}

.hero-publish-warning.is-error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
}

.hero-publish-warning.is-hint {
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
}

.hero-fix-schedule-link {
    background: transparent;
    border: none;
    padding: 0;
    color: #8c1515;
    font-size: 0.8125rem;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
}

.hero-publish-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.hero-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 7px;
    background-color: currentColor;
}

.hero-publish-btn {
    border-radius: 12px !important;
    padding: 0.55rem 1.15rem !important;
    white-space: nowrap;
}

.hero-unpublish-btn {
    border-radius: 12px !important;
    padding: 0.5rem 1rem !important;
    color: #475569 !important;
    border-color: #cbd5e1 !important;
    background-color: #ffffff !important;
    white-space: nowrap;
}

.hero-unpublish-btn:hover {
    background-color: #fef2f2 !important;
    color: #dc2626 !important;
    border-color: #fecaca !important;
}
</style>
