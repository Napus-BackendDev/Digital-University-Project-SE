<template>
    <CCard :class="embedded ? 'mb-0 border-0 shadow-none bg-transparent' : 'mb-4 border-0 shadow-sm rounded-20'">
        <CCardBody :class="embedded ? 'px-3 px-md-4 pt-1 pb-4' : 'p-4'">
            <h5 v-if="!embedded" class="mb-4 font-weight-bold text-dark">{{ $t('editor.settings.response.title') }}</h5>

            <!-- Public Mode: 2-Option Radio-Card Picker -->
            <div v-if="isPublicMode" class="mb-4 pb-3 border-bottom-soft" data-test="public-email-mode-picker">
                <div class="mb-3">
                    <h6 class="mb-1 font-weight-bold text-dark">{{ $t('editor.settings.response.publicEmailModeTitle') }}</h6>
                    <small class="text-muted">{{ $t('editor.settings.response.publicEmailModeDesc') }}</small>
                </div>
                <div class="public-email-card-group" role="radiogroup" :aria-label="$t('editor.settings.response.publicEmailModeTitle')">
                    <!-- Option 1: Anonymous -->
                    <div
                        class="public-email-card mb-2"
                        :class="{ 'is-selected': !mappedRequireLogin }"
                        role="radio"
                        :aria-checked="!mappedRequireLogin ? 'true' : 'false'"
                        tabindex="0"
                        data-test="public-email-anonymous"
                        @click="setPublicEmailMode(false)"
                        @keydown.enter.prevent="setPublicEmailMode(false)"
                        @keydown.space.prevent="setPublicEmailMode(false)"
                    >
                        <div class="d-flex align-items-start">
                            <input
                                type="radio"
                                name="publicEmailMode"
                                :checked="!mappedRequireLogin"
                                class="public-email-radio mt-1 mr-3"
                                tabindex="-1"
                                aria-hidden="true"
                            />
                            <div class="flex-grow-1 min-w-0">
                                <div class="d-flex align-items-center flex-wrap mb-1" style="gap: 8px;">
                                    <span class="font-weight-bold text-dark card-title-text">{{ $t('editor.settings.response.publicEmailAnonymous') }}</span>
                                    <span class="public-email-badge badge-anonymous">{{ $t('editor.settings.response.publicEmailAnonymousBadge') }}</span>
                                </div>
                                <div class="small text-muted card-desc-text">{{ $t('editor.settings.response.publicEmailAnonymousDesc') }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Option 2: Required -->
                    <div
                        class="public-email-card mb-2"
                        :class="{ 'is-selected': mappedRequireLogin }"
                        role="radio"
                        :aria-checked="mappedRequireLogin ? 'true' : 'false'"
                        tabindex="0"
                        data-test="public-email-required"
                        @click="setPublicEmailMode(true)"
                        @keydown.enter.prevent="setPublicEmailMode(true)"
                        @keydown.space.prevent="setPublicEmailMode(true)"
                    >
                        <div class="d-flex align-items-start">
                            <input
                                type="radio"
                                name="publicEmailMode"
                                :checked="mappedRequireLogin"
                                class="public-email-radio mt-1 mr-3"
                                tabindex="-1"
                                aria-hidden="true"
                            />
                            <div class="flex-grow-1 min-w-0">
                                <div class="d-flex align-items-center flex-wrap mb-1" style="gap: 8px;">
                                    <span class="font-weight-bold text-dark card-title-text">{{ $t('editor.settings.response.publicEmailRequired') }}</span>
                                    <span class="public-email-badge badge-required">{{ $t('editor.settings.response.publicEmailRequiredBadge') }}</span>
                                </div>
                                <div class="small text-muted card-desc-text">{{ $t('editor.settings.response.publicEmailRequiredDesc') }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Private Mode: Existing Single Switch -->
            <div v-else class="d-flex justify-content-between align-items-center mb-4">
                <div class="pr-3">
                    <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.requireLogin') }}</h6>
                    <small class="text-muted">{{ $t('editor.settings.response.requireLoginDesc') }}</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedRequireLogin"
                    @update:checked="val => { mappedRequireLogin = val; triggerAutoSave(); }" />
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="pr-3">
                    <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.limitOne') }}</h6>
                    <small class="text-muted">{{ $t('editor.settings.response.limitOneDesc') }}</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedLimitResponse"
                    @update:checked="val => { mappedLimitResponse = val; triggerAutoSave(); }" />
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="pr-3">
                    <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.allowEdit') }}</h6>
                    <small class="text-muted">{{ $t('editor.settings.response.allowEditDesc') }}</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedAllowEditAfterSubmit"
                    @update:checked="val => { mappedAllowEditAfterSubmit = val; triggerAutoSave(); }" />
            </div>

            <div class="mb-4 pb-3 border-bottom-soft">
                <CRow class="align-items-center">
                    <CCol md="7" class="mb-2 mb-md-0">
                        <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.maxResponses') }}</h6>
                        <small class="text-muted">{{ $t('editor.settings.response.maxResponsesDesc') }}</small>
                    </CCol>
                    <CCol md="5">
                        <input
                            type="number"
                            min="1"
                            step="1"
                            class="form-control quota-input"
                            :value="mappedMaxResponses"
                            :placeholder="$t('editor.settings.response.maxResponsesPlaceholder')"
                            @input="onMaxResponsesInput($event.target.value)"
                            @change="flushAutoSave"
                        />
                    </CCol>
                </CRow>
                <small class="text-muted mt-2 d-block">{{ $t('editor.settings.response.maxResponsesTip') }}</small>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="pr-3">
                    <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.notifications') }}</h6>
                    <small class="text-muted">{{ $t('editor.settings.response.notificationsDesc') }}</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedEmailNotifications"
                    @update:checked="val => { mappedEmailNotifications = val; triggerAutoSave(); }" />
            </div>

            <div v-if="mappedEmailNotifications" class="mb-4 pl-3 nested-panel">
                <label class="font-weight-bold small mb-2">{{ $t('editor.settings.response.message') }}</label>
                <textarea
                    v-model="mappedEmailMessage"
                    :placeholder="$t('editor.settings.response.messagePlaceholder')"
                    rows="3"
                    class="form-control p-3 setting-textarea"
                    @input="debouncedAutoSave"
                    @change="flushAutoSave"
                ></textarea>
                <small class="text-muted mt-2 d-inline-block">{{ $t('editor.settings.response.messageTip') }}</small>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="pr-3">
                    <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.notifyCreator') }}</h6>
                    <small class="text-muted">{{ $t('editor.settings.response.notifyCreatorDesc') }}</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedNotifyCreator"
                    @update:checked="val => { mappedNotifyCreator = val; triggerAutoSave(); }" />
            </div>

            <div class="pt-3 border-top-soft mb-4">
                <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.confirmMessage') }}</h6>
                <small class="text-muted d-block mb-2">{{ $t('editor.settings.response.confirmMessageDesc') }}</small>
                <textarea
                    v-model="mappedConfirmMessage"
                    :placeholder="$t('editor.settings.response.confirmMessagePlaceholder')"
                    rows="2"
                    class="form-control p-3 setting-textarea"
                    @input="debouncedAutoSave"
                    @change="flushAutoSave"
                ></textarea>
            </div>

            <div class="pt-3 border-top-soft" data-test="form-contact-settings">
                <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.response.contactSectionTitle') }}</h6>
                <small class="text-muted d-block mb-3">{{ $t('editor.settings.response.contactSectionDesc') }}</small>

                <CRow>
                    <CCol md="6" class="mb-3 mb-md-0">
                        <label class="font-weight-bold small mb-2" for="form-contact-org-input">
                            {{ $t('editor.settings.response.contactOrganizationLabel') }}
                        </label>
                        <input
                            id="form-contact-org-input"
                            v-model="mappedContactOrganization"
                            type="text"
                            data-test="contact-org-input"
                            class="form-control quota-input"
                            :placeholder="$t('editor.settings.response.contactOrganizationPlaceholder', { fallback: defaultCreatorOrganization })"
                            @input="debouncedAutoSave"
                            @change="flushAutoSave"
                        />
                    </CCol>
                    <CCol md="6">
                        <label class="font-weight-bold small mb-2" for="form-contact-email-input">
                            {{ $t('editor.settings.response.contactEmailLabel') }}
                        </label>
                        <input
                            id="form-contact-email-input"
                            v-model.trim="mappedContactEmail"
                            type="email"
                            data-test="contact-email-input"
                            class="form-control quota-input"
                            :class="{ 'is-invalid-contact': contactEmailError }"
                            :placeholder="$t('editor.settings.response.contactEmailPlaceholder', { fallback: defaultCreatorEmail })"
                            @input="onContactEmailInput"
                            @change="flushAutoSave"
                        />
                        <small v-if="contactEmailError" class="text-danger d-block mt-1">
                            {{ $t('editor.settings.response.contactEmailInvalid') }}
                        </small>
                    </CCol>
                </CRow>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
import { normalizeMaxResponses, resolveFormAccessMode } from '@/projects/utils/formPolicy';

export default {
    name: 'ResponseSettings',
    props: {
        settings: {
            type: Object,
            required: true
        },
        embedded: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            autoSaveTimer: null
        };
    },
    beforeDestroy() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    },
    computed: {
        isPublicMode() {
            return resolveFormAccessMode(this.settings) === 'public';
        },
        mappedRequireLogin: {
            get() {
                return !!(this.settings.settings && this.settings.settings.requireLogin);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                const enabled = Boolean(val);
                this.$set(this.settings.settings, 'requireLogin', enabled);
                // In Public mode, requireLogin is the single switch that also controls collecting any Google email
                if (resolveFormAccessMode(this.settings) === 'public') {
                    this.$set(this.settings.settings, 'collectEmail', enabled);
                }
            }
        },
        mappedLimitResponse: {
            get() {
                return !!(this.settings.settings && this.settings.settings.limitResponse);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'limitResponse', val);
            }
        },
        mappedAllowEditAfterSubmit: {
            get() {
                return !!(this.settings.settings && this.settings.settings.allowEditAfterSubmit);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'allowEditAfterSubmit', val);
            }
        },
        mappedMaxResponses: {
            get() {
                const raw = this.settings.settings && this.settings.settings.maxResponses;
                const normalized = normalizeMaxResponses(raw);
                return normalized === null ? '' : normalized;
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'maxResponses', normalizeMaxResponses(val));
            }
        },
        mappedEmailNotifications: {
            get() {
                return !!(this.settings.settings && this.settings.settings.emailNotifications);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'emailNotifications', val);
            }
        },
        mappedEmailMessage: {
            get() {
                return (this.settings.settings && this.settings.settings.emailMessage) || '';
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'emailMessage', val);
            }
        },
        mappedNotifyCreator: {
            get() {
                return !!(this.settings.settings && this.settings.settings.notifyCreator);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'notifyCreator', val);
            }
        },
        mappedConfirmMessage: {
            get() {
                return (this.settings.settings && this.settings.settings.confirmMessage) || '';
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'confirmMessage', val);
            }
        },
        mappedContactOrganization: {
            get() {
                return (this.settings.settings && this.settings.settings.contactOrganization) || '';
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'contactOrganization', val);
            }
        },
        mappedContactEmail: {
            get() {
                return (this.settings.settings && this.settings.settings.contactEmail) || '';
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'contactEmail', String(val || '').trim());
            }
        },
        defaultCreatorOrganization() {
            const creator = this.settings && this.settings.creator && typeof this.settings.creator === 'object'
                ? this.settings.creator
                : ((this.$store && this.$store.state && this.$store.state.User && this.$store.state.User.user) || {});
            const org = creator && creator.organization;
            if (!org) return 'Mae Fah Luang University';
            if (typeof org === 'string') return org;
            if (Array.isArray(org.title)) {
                const locale = (this.$i18n && this.$i18n.locale) || 'en';
                const matched = org.title.find(t => t && t.key === locale && t.value) || org.title.find(t => t && t.value);
                if (matched) return matched.value;
            }
            return org.name || 'Mae Fah Luang University';
        },
        defaultCreatorEmail() {
            const creator = this.settings && this.settings.creator && typeof this.settings.creator === 'object'
                ? this.settings.creator
                : ((this.$store && this.$store.state && this.$store.state.User && this.$store.state.User.user) || {});
            return (creator && creator.email) || 'no-reply@mfu.ac.th';
        },
        contactEmailError() {
            const email = String(this.mappedContactEmail || '').trim();
            if (!email) return false;
            return !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
        }
    },
    methods: {
        onContactEmailInput() {
            if (!this.contactEmailError) {
                this.debouncedAutoSave();
            }
        },
        onMaxResponsesInput(rawVal) {
            this.mappedMaxResponses = rawVal;
            this.debouncedAutoSave();
        },
        debouncedAutoSave() {
            if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(() => {
                this.autoSaveTimer = null;
                this.triggerAutoSave();
            }, 400);
        },
        flushAutoSave() {
            if (this.autoSaveTimer) {
                clearTimeout(this.autoSaveTimer);
                this.autoSaveTimer = null;
            }
            this.triggerAutoSave();
        },
        async triggerAutoSave() {
            this.$emit('auto-save');
        },
        setPublicEmailMode(required) {
            if (!this.settings.settings) this.$set(this.settings, 'settings', {});
            const enabled = Boolean(required);
            this.$set(this.settings.settings, 'requireLogin', enabled);
            this.$set(this.settings.settings, 'collectEmail', enabled);
            this.triggerAutoSave();
        }
    }
}
</script>

<style scoped>
.public-email-card {
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 16px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.18s ease;
    outline: none;
}

.public-email-card:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
}

.public-email-card:focus {
    border-color: #8c1515;
    box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.12);
}

.public-email-card.is-selected {
    border-color: #8c1515;
    background: #fffafa;
    box-shadow: 0 1px 3px rgba(140, 21, 21, 0.08);
}

.public-email-radio {
    width: 18px;
    height: 18px;
    accent-color: #8c1515;
    cursor: pointer;
}

.public-email-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 700;
}

.badge-anonymous {
    background: #f1f5f9;
    color: #475569;
}

.badge-required {
    background: #fee2e2;
    color: #991b1b;
}

.rounded-20 {
    border-radius: 20px !important;
    overflow: hidden;
}

.nested-panel {
    border-left: 3px solid #e2e8f0;
    animation: fadeIn 0.3s ease;
}

.border-bottom-soft {
    border-bottom: 1px solid #f1f5f9;
}

.border-top-soft {
    border-top: 1px solid #f1f5f9;
}

.setting-textarea,
.quota-input {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background-color: #f8f9fa;
}

.setting-textarea {
    resize: vertical;
}

.quota-input {
    height: 44px;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

.form-control:focus {
    border-color: #ac1515 !important;
    box-shadow: 0 0 0 0.2rem rgba(172, 21, 21, 0.15) !important;
}

.is-invalid-contact {
    border-color: #dc2626 !important;
}
</style>
