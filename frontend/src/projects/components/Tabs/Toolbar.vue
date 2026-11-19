<template>
    <CCol md="3">
        <CCard class="tab-card shadow-sm border">
            <CCardBody class="p-3 p-md-4 d-flex flex-column h-100">
                <!-- Navigation Buttons -->
                <div class="d-flex justify-content-between mb-3 mb-md-4 align-items-center">
                    <ButtonBack />
                    <ButtonPreview />
                </div>

                <!-- Tab Selectors -->
                <div class="tab-buttons mb-3 mb-md-4">
                    <label class="small text-uppercase font-weight-bold text-muted mb-2 d-none d-md-block">{{ $t('toolbar.mainNav') }}</label>
                    <div class="tab-buttons-grid">
                        <CButton v-if="!readOnly" class="w-100 mb-md-2 text-md-left nav-btn" color="primary"
                            :variant="activeTab === 'question' ? null : 'ghost'"
                            @click="$emit('update:activeTab', 'question')">
                            <CIcon name="cil-description" class="mr-1 mr-md-2" /> <span>{{ $t('toolbar.questions') }}</span>
                        </CButton>
                        <CButton class="w-100 mb-md-2 text-md-left nav-btn nav-btn-responses" color="primary"
                            variant="ghost"
                            data-test="toolbar-responses-btn"
                            @click="navigateToReport">
                            <CIcon name="cil-chart-pie" class="mr-1 mr-md-2" /> <span>{{ $t('toolbar.responses') }}</span>
                        </CButton>
                        <CButton v-if="!readOnly" class="w-100 mb-md-2 text-md-left nav-btn" color="primary"
                            :variant="activeTab === 'setting' ? null : 'ghost'"
                            @click="$emit('update:activeTab', 'setting')">
                            <CIcon name="cil-settings" class="mr-1 mr-md-2" /> <span>{{ $t('toolbar.settings') }}</span>
                        </CButton>
                    </div>
                </div>

                <!-- Sharing Section (New) -->
                <div class="mb-3 mb-md-4" v-if="!readOnly && activeTab === 'setting'">
                    <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">{{ $t('toolbar.sharing') }}</label>
                    <div class="toolbar-palette-row">
                        <CButton variant="ghost" color="dark" class="w-100 mb-md-1 text-left type-btn d-flex align-items-center"
                            :class="{ 'type-btn-copied': copied }"
                            @click="copyLink">
                            <div class="icon-circle mr-2 mr-md-3">
                                <CIcon :name="copied ? 'cil-check' : 'cil-link'" size="sm" />
                            </div>
                            <span class="font-weight-medium">{{ copied ? $t('toolbar.copied') : $t('toolbar.copyLink') }}</span>
                        </CButton>  

                        <CButton variant="ghost" color="dark" class="w-100 mb-md-1 text-left type-btn d-flex align-items-center"
                            @click="showQRModal = true">
                            <div class="icon-circle mr-2 mr-md-3">
                                <CIcon name="cil-qr-code" size="sm" />
                            </div>
                            <span class="font-weight-medium">{{ $t('toolbar.qr.scan') }}</span>
                        </CButton>
                    </div>
                </div>

                <!-- Question Types Section -->
                <div class="toolbar-scroll-area flex-grow-1 pr-md-2" v-if="!readOnly && activeTab === 'question'">
                    <!-- Form Languages Section -->
                    <div class="mb-3 mb-md-4 pb-2 pb-md-3 border-bottom">
                        <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">
                            {{ $t('toolbar.formLanguages') }}
                        </label>
                        <div class="d-flex flex-md-column toolbar-palette-row">
                            <div
                                v-for="lang in normalizedActiveLanguages"
                                :key="lang"
                                class="toolbar-lang-row w-100 mb-md-1 d-flex align-items-center justify-content-between"
                            >
                                <div class="d-flex align-items-center min-width-0">
                                    <div class="icon-circle mr-2 mr-md-3 font-weight-bold toolbar-lang-code-box">
                                        {{ lang.toUpperCase() }}
                                    </div>
                                    <span class="font-weight-medium toolbar-lang-label">{{ formatLanguageName(lang) }}</span>
                                </div>
                                <button
                                    v-if="normalizedActiveLanguages.length > 1"
                                    type="button"
                                    class="toolbar-lang-remove-btn ml-2 flex-shrink-0"
                                    :aria-label="`${$t('builder.remove')} ${lang.toUpperCase()}`"
                                    @click="$emit('remove-language', lang)"
                                >
                                    &times;
                                </button>
                            </div>
                            <CDropdown color="light" class="w-100 toolbar-add-lang-dropdown">
                                <template #toggler>
                                    <CButton
                                        variant="ghost"
                                        color="dark"
                                        class="w-100 mb-md-1 text-left lang-add-btn d-flex align-items-center"
                                    >
                                        <div class="icon-circle mr-2 mr-md-3">
                                            <CIcon name="cil-globe-alt" size="sm" />
                                        </div>
                                        <span class="font-weight-medium">+ {{ $t('toolbar.addLanguage') }}</span>
                                    </CButton>
                                </template>
                                <CDropdownItem
                                    v-for="opt in availableCommonLanguages"
                                    :key="opt.value"
                                    @click="selectPresetLanguage(opt.value)"
                                >
                                    {{ opt.label }} ({{ opt.value.toUpperCase() }})
                                </CDropdownItem>
                                <CDropdownDivider v-if="availableCommonLanguages.length > 0" />
                                <div class="px-3 py-2" @click.stop>
                                    <div class="d-flex align-items-center" style="gap: 6px;">
                                        <input
                                            v-model.trim="customLangInput"
                                            type="text"
                                            maxlength="5"
                                            class="form-control form-control-sm text-uppercase"
                                            :placeholder="$t('toolbar.customLanguagePlaceholder')"
                                            @keydown.enter.prevent="submitCustomLanguage"
                                        />
                                        <CButton
                                            size="sm"
                                            color="primary"
                                            :disabled="!canAddCustomLanguage"
                                            @click="submitCustomLanguage"
                                        >
                                            {{ $t('builder.add') }}
                                        </CButton>
                                    </div>
                                </div>
                            </CDropdown>
                        </div>
                    </div>

                    <div class="mb-3 mb-md-4">
                        <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">
                            {{ $t('toolbar.questionTypes') }}
                        </label>
                        <div class="d-flex flex-md-column toolbar-palette-row">
                            <CButton v-for="type in paletteQuestionTypes" :key="type._id"
                                v-if="!isNonInputQuestionType(type.type)" variant="ghost"
                                color="dark" class="w-100 mb-md-1 text-left type-btn d-flex align-items-center"
                                @click="$emit('add-question', type._id)">
                                <div class="icon-circle mr-2 mr-md-3">
                                    <CIcon :name="getIconForType(type.type)" size="sm" />
                                </div>
                                <span class="font-weight-medium">{{ formatTypeLabel(type.type) }}</span>
                            </CButton>
                        </div>
                    </div>

                    <div class="pt-2 pt-md-3 border-top">
                        <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">
                            {{ $t('toolbar.contentElements') }}
                        </label>
                        <div class="d-flex flex-md-column toolbar-palette-row">
                            <CButton variant="ghost" color="dark"
                                class="w-100 mb-md-1 text-left type-btn d-flex align-items-center"
                                @click="$emit('add-question', 'section')">
                                <div class="icon-circle mr-2 mr-md-3">
                                    <CIcon name="cil-view-stream" size="sm" />
                                </div>
                                <span class="font-weight-medium">{{ $t('types.section') }}</span>
                            </CButton>
                            <CButton variant="ghost" color="dark"
                                class="w-100 mb-md-1 text-left type-btn d-flex align-items-center"
                                @click="$emit('add-question', 'title_description')">
                                <div class="icon-circle mr-2 mr-md-3">
                                    <CIcon name="cil-text" size="sm" />
                                </div>
                                <span class="font-weight-medium">{{ $t('types.title_description') }}</span>
                            </CButton>
                            <CButton variant="ghost" color="dark"
                                class="w-100 mb-md-1 text-left type-btn d-flex align-items-center"
                                @click="$emit('open-image')">
                                <div class="icon-circle mr-2 mr-md-3">
                                    <CIcon name="cil-image-1" size="sm" />
                                </div>
                                <span class="font-weight-medium">{{ $t('types.image') }}</span>
                            </CButton>
                        </div>
                    </div>
                </div>
            </CCardBody>
        </CCard>

        <CModal :show.sync="showQRModal" centered size="lg" class="premium-modal">
            <template #header>
                <div class="w-100 d-flex justify-content-between align-items-center border-bottom-0 pb-0">
                    <h5 class="mb-0 font-weight-bold text-dark d-flex align-items-center">
                        <div class="icon-circle-header mr-3">
                            <CIcon name="cil-qr-code" class="text-primary" size="lg" />
                        </div>
                        {{ $t('toolbar.qr.share') }}
                    </h5>
                    <CButton class="text-secondary p-0 shadow-none border-0" @click="showQRModal = false">
                        <CIcon name="cil-x" size="lg" />
                    </CButton>
                </div>
            </template>
            <div v-if="showQRModal" class="share-modal-body py-3 px-2 px-md-3" data-test="share-qr-modal-body">
                <div class="share-modal-grid">
                    <!-- Left Column: Compact Audience Summary, Period & Status -->
                    <div class="share-summary-col" data-test="share-audience-summary">
                        <h4 class="font-weight-bold text-dark mb-3">{{ formTitle }}</h4>

                        <div class="share-meta-list">
                            <div class="share-meta-item" data-test="share-meta-audience">
                                <span class="share-meta-label">{{ $t('toolbar.qr.audienceLabel') }}</span>
                                <div class="d-flex align-items-center mt-1">
                                    <span class="share-audience-pill" :class="shareAccessSummary.badgeClass" :title="shareAccessSummary.tooltip">
                                        <CIcon :name="shareAccessSummary.icon" size="sm" class="mr-2 flex-shrink-0" />
                                        <span>{{ shareAccessSummary.label }}</span>
                                    </span>
                                </div>
                            </div>

                            <div class="share-meta-item" data-test="share-meta-period">
                                <span class="share-meta-label">{{ $t('toolbar.qr.periodLabel') }}</span>
                                <div class="share-meta-value mt-1">
                                    <CIcon name="cil-calendar" size="sm" class="mr-2 text-muted flex-shrink-0" />
                                    <span>{{ shareScheduleText }}</span>
                                </div>
                            </div>

                            <div class="share-meta-item" data-test="share-meta-status">
                                <span class="share-meta-label">{{ $t('toolbar.qr.statusLabel') }}</span>
                                <div class="mt-1">
                                    <span class="share-status-pill" :class="shareStatusMeta.pillClass">
                                        <span class="share-status-dot"></span>
                                        <span>{{ shareStatusMeta.label }}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p class="text-muted mb-0 mt-3 small">
                            {{ $t('toolbar.qr.instruction') }}
                        </p>
                    </div>

                    <!-- Right / Center Column: Large QR Code (>= 240px), Copy Button & Read-Only Link -->
                    <div class="share-qr-col" data-test="share-qr-column">
                        <div class="qr-wrapper mb-3 text-center" data-test="share-qr-wrapper">
                            <qr-code v-if="showQRModal" :text="formUrl" :size="248" level="H" render-as="canvas" />
                        </div>

                        <CButton
                            color="primary"
                            block
                            class="w-100 mb-2 font-weight-bold share-copy-btn d-flex align-items-center justify-content-center"
                            :class="{ 'share-copy-btn--copied': copied }"
                            data-test="share-copy-link-btn"
                            @click="copyLink"
                        >
                            <CIcon :name="copied ? 'cil-check' : 'cil-link'" size="sm" class="mr-2" />
                            <span>{{ copied ? $t('toolbar.copied') : $t('toolbar.copyLink') }}</span>
                        </CButton>

                        <input
                            type="text"
                            readonly
                            class="form-control form-control-sm share-link-readonly"
                            :value="formUrl"
                            :aria-label="$t('toolbar.qr.linkLabel')"
                            data-test="share-link-readonly"
                            @focus="$event.target.select()"
                        />
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="w-100 d-flex justify-content-center border-top-0 pt-0 pb-2">
                    <CButton color="primary" variant="outline" shape="pill" class="px-5 font-weight-bold btn-done shadow-sm" @click="showQRModal = false">
                        {{ $t('toolbar.qr.done') }}
                    </CButton>
                </div>
            </template>
        </CModal>
    </CCol>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue';
import ButtonPreview from '../../components/Button/ButtonPreview.vue';
import localeMixin from '@/mixins/localeMixin';
import {
    consolidateQuestionTypes,
    formatSettingDateSummary,
    getScheduleStatus,
    isNonInputQuestionType,
    normalizeQuestionTypeKey
} from '@/projects/utils/formPolicy';
import { buildCompactAccessSummary, getFormAccessLabels } from '@/projects/utils/analytics';


export default {
    name: 'Toolbar',
    mixins: [localeMixin],
    components: {
        ButtonBack,
        ButtonPreview
    },
    props: {
        activeTab: {
            type: String,
            default: 'question'
        },
        questionTypes: {
            type: Array,
            default: () => []
        },
        form: {
            type: Object,
            default: () => ({})
        },
        readOnly: {
            type: Boolean,
            default: false
        },
        activeLanguages: {
            type: Array,
            default: () => ['en']
        }
    },
    data() {
        return {
            copied: false,
            copyTimer: null,
            showQRModal: false,
            customLangInput: ''
        }
    },
    computed: {
        currentLocale() {
            return (this.$i18n && this.$i18n.locale) || 'th';
        },
        normalizedActiveLanguages() {
            const list = Array.isArray(this.activeLanguages) ? this.activeLanguages : [];
            const unique = [];
            list.forEach((k) => {
                const norm = String(k || '').trim().toLowerCase();
                if (norm && !unique.includes(norm)) unique.push(norm);
            });
            return unique.length > 0 ? unique : ['en'];
        },
        availableCommonLanguages() {
            const presets = [
                { label: 'ไทย', value: 'th' },
                { label: 'English', value: 'en' },
                { label: '中文', value: 'cn' },
                { label: '日本語', value: 'jp' }
            ];
            return presets.filter(p => !this.normalizedActiveLanguages.includes(p.value));
        },
        canAddCustomLanguage() {
            const code = String(this.customLangInput || '').trim().toLowerCase();
            return /^[a-z]{2,5}$/.test(code) && !this.normalizedActiveLanguages.includes(code);
        },
        paletteQuestionTypes() {
            return consolidateQuestionTypes(this.questionTypes);
        },
        formUrl() {
            if (!this.form || !this.form._id) return '';
            return `${window.location.origin}/forms/${this.form._id}?mode=public`;
        },
        formTitle() {
            return this.getLang(this.form.title) || this.$t('common.untitled') || 'Form';
        },
        shareAccessSummary() {
            const organizations = this.storeList('Organizations/organizations');
            const users = this.storeList('User/users');
            const roles = this.storeList('Roles/roles');
            const { access } = getFormAccessLabels(this.form, {
                organizations,
                users,
                roles,
                locale: this.currentLocale
            });
            return buildCompactAccessSummary(access, {
                formatLabel: (val) => {
                    if (!val) return '';
                    const key = `accessLabel.${String(val).toLowerCase()}`;
                    return (this.$te && this.$te(key)) ? this.$t(key) : val;
                },
                orgUnit: this.$t('table.orgUnit') || 'หน่วยงาน',
                userUnit: this.$t('table.userUnit') || 'ผู้ใช้',
                roleUnit: this.$t('table.roleUnit') || 'ตำแหน่ง'
            });
        },
        shareScheduleText() {
            const sched = (this.form && this.form.schedule) || {};
            const startText = formatSettingDateSummary(sched.startAt, this.currentLocale);
            const endText = formatSettingDateSummary(sched.endAt, this.currentLocale);
            if (startText && endText) {
                return `${startText} – ${endText}`;
            }
            if (endText) {
                return this.$t('form.responseSummary.periodUntilDesc', { end: endText });
            }
            if (startText) {
                return this.$t('form.responseSummary.periodSinceDesc', { start: startText });
            }
            return this.$t('table.openForever');
        },
        shareStatusMeta() {
            const status = getScheduleStatus(this.form && this.form.schedule);
            if (status === 'open' || status === 'open_forever') {
                return { label: this.$t('status.active'), pillClass: 'is-active' };
            }
            if (status === 'scheduled') {
                return { label: this.$t('status.scheduled'), pillClass: 'is-scheduled' };
            }
            if (status === 'closed' || status === 'closed_forever') {
                return { label: this.$t('status.closed'), pillClass: 'is-closed' };
            }
            return { label: this.$t('status.draft'), pillClass: 'is-draft' };
        }
    },
    methods: {
        navigateToReport() {
            const formId = String(
                (this.form && (this.form._id || this.form.id)) ||
                (this.$route && this.$route.params && (this.$route.params._id || this.$route.params.formId || this.$route.params.id)) ||
                ''
            );
            const routeTarget = { name: 'AnalyticsFormReport', params: { formId } };
            this.$emit('navigate-report', routeTarget);
            this.$emit('navigate-responses', routeTarget);
            if (formId && this.$router) {
                Promise.resolve(this.$router.push(routeTarget)).catch(() => {});
            }
        },
        isNonInputQuestionType,
        storeList(getterKey) {
            const getters = this.$store && this.$store.getters;
            const list = getters ? getters[getterKey] : null;
            return Array.isArray(list) ? list : [];
        },
        selectPresetLanguage(code) {
            if (!code) return;
            this.$emit('add-language', code);
        },
        formatLanguageName(code) {
            const norm = String(code || '').trim().toLowerCase();
            const map = {
                th: 'ไทย (TH)',
                en: 'English (EN)',
                cn: '中文 (CN)',
                jp: '日本語 (JP)'
            };
            return map[norm] || norm.toUpperCase();
        },
        submitCustomLanguage() {
            if (!this.canAddCustomLanguage) return;
            const code = String(this.customLangInput || '').trim().toLowerCase();
            this.customLangInput = '';
            this.$emit('add-language', code);
        },
        formatTypeLabel(rawType) {
            if (!rawType) return '';
            const key = normalizeQuestionTypeKey(rawType);
            if (this.$te(`types.${key}`)) {
                return this.$t(`types.${key}`);
            }
            return rawType
                .split(/[_\s]+/)
                .map(seg => seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : '')
                .join(' ');
        },
        getIconForType(typeStr) {
            const type = normalizeQuestionTypeKey(typeStr);
            switch (type) {
                case 'free_text': return 'cil-align-left';
                case 'multiple_choice': return 'cil-circle';
                case 'checkbox': return 'cil-square';
                case 'rating': return 'cil-star';
                case 'file_upload': return 'cil-cloud-upload';
                case 'title_description': return 'cil-text';
                case 'section': return 'cil-view-stream';
                case 'image': return 'cil-image-1';
                default: return 'cil-notes';
            }
        },
        copyLink() {
            if (!this.form || !this.form._id) return;
            const url = `${window.location.origin}/forms/${this.form._id}?mode=public`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url)
                    .then(() => this.showCopied())
                    .catch(() => this.fallbackCopyText(url));
            } else {
                this.fallbackCopyText(url);
            }
        },
        fallbackCopyText(url) {
            const el = document.createElement('textarea');
            el.value = url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            this.showCopied();
        },
        showCopied() {
            this.copied = true;
            if (this.copyTimer) {
                clearTimeout(this.copyTimer);
            }
            this.copyTimer = setTimeout(() => {
                this.copied = false;
                this.copyTimer = null;
            }, 2000);
        },
        sendEmail() {
            if (!this.form || !this.form._id) return;
            const url = `${window.location.origin}/forms/${this.form._id}?mode=public`;
            const title = this.getLang(this.form.title) || 'Form';
            const subject = encodeURIComponent(`Please fill out this form: ${title}`);
            const body = encodeURIComponent(`You can access the form here:\n${url}`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
    }
}
</script>

<style scoped>
.tab-card {
    position: sticky;
    top: 75px;
    height: calc(100vh - 100px);
    border-radius: 20px !important;
    background: #ffffff;
    z-index: 10;
}

.toolbar-scroll-area {
    overflow-y: auto;
    overflow-x: hidden;
}

.toolbar-scroll-area::-webkit-scrollbar {
    width: 4px;
}

.toolbar-scroll-area::-webkit-scrollbar-track {
    background: transparent;
}

.toolbar-scroll-area::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}

.nav-btn {
    border-radius: 12px !important;
    padding: 10px 16px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease;
}

.lang-add-btn,
.toolbar-lang-row,
.type-btn {
    border-radius: 12px !important;
    padding: 8px 12px !important;
    color: #475569 !important;
    transition: all 0.2s ease;
}

.lang-add-btn:hover,
.lang-add-btn:focus,
.lang-add-btn:active,
.toolbar-lang-row:hover,
.type-btn:hover,
.type-btn:focus,
.type-btn:active {
    background-color: #f1f5f9 !important;
    color: #1e293b !important;
    box-shadow: none !important;
    outline: none !important;
}

.lang-add-btn:hover .icon-circle,
.toolbar-lang-row:hover .icon-circle,
.type-btn:hover .icon-circle {
    background: #ffffff;
    color: #2563eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-lang-code-box {
    font-size: 0.8125rem;
    letter-spacing: 0.02em;
    flex-shrink: 0;
}

.toolbar-lang-label {
    font-size: 0.8125rem;
    line-height: 1.6;
}

.public-lang-toggle .btn,
.switch-account-btn {
    font-size: 0.8125rem;
}

.toolbar-lang-remove-btn {
    border: none;
    background: transparent;
    color: #64748b;
    font-weight: 700;
    font-size: 1.05rem;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 6px;
    cursor: pointer;
}

.toolbar-lang-remove-btn:hover {
    color: #dc2626;
    background-color: rgba(220, 38, 38, 0.08);
}

.icon-circle {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.2s ease;
}

.type-btn.type-btn-copied,
.type-btn.type-btn-copied:hover,
.type-btn.type-btn-copied:focus,
.type-btn.type-btn-copied:active {
    background-color: #dcfce7 !important;
    color: #15803d !important;
    border: 1px solid #86efac !important;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.16) !important;
}

.type-btn.type-btn-copied .icon-circle,
.type-btn.type-btn-copied:hover .icon-circle {
    background-color: #16a34a !important;
    color: #ffffff !important;
    box-shadow: none !important;
}

.type-btn.type-btn-copied .font-weight-medium {
    font-weight: 700 !important;
}

.font-weight-medium {
    font-weight: 500;
}

.btn-send {
    border-radius: 8px !important;
    background-color: #2563eb !important;
    border: none !important;
    font-size: 0.9rem !important;
    transition: all 0.2s ease;
}

.btn-send:hover {
    background-color: #1d4ed8 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.premium-modal /deep/ .modal-content {
    border-radius: 24px;
    border: none;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.icon-circle-header {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-wrapper {
    background: #ffffff;
    padding: 18px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01) !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 240px;
    min-height: 240px;
}

.share-modal-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 310px);
    gap: 24px;
    align-items: center;
}

.share-summary-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 20px;
    height: 100%;
}

.share-meta-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.share-meta-item {
    display: flex;
    flex-direction: column;
}

.share-meta-label {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
}

.share-meta-value {
    display: inline-flex;
    align-items: center;
    font-size: 0.92rem;
    font-weight: 600;
    color: #1e293b;
}

.share-audience-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    max-width: 100%;
}

.share-audience-pill.visi-public {
    background-color: #ecfdf5;
    color: #059669;
}

.share-audience-pill.visi-private {
    background-color: #fff1f2;
    color: #e11d48;
}

.share-audience-pill.visi-org {
    background-color: #f0f7ff;
    color: #1e40af;
}

.share-audience-pill.visi-personal {
    background-color: #f5f3ff;
    color: #7c3aed;
}

.share-audience-pill.visi-role {
    background-color: #f3e8ff;
    color: #6b21a8;
}

.share-status-pill {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 0.84rem;
    font-weight: 700;
}

.share-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 7px;
    background-color: currentColor;
}

.share-status-pill.is-active {
    background-color: #ecfdf5;
    color: #065f46;
}

.share-status-pill.is-scheduled {
    background-color: #eff6ff;
    color: #1e40af;
}

.share-status-pill.is-closed {
    background-color: #fef2f2;
    color: #991b1b;
}

.share-status-pill.is-draft {
    background-color: #f1f5f9;
    color: #475569;
}

.share-qr-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.share-copy-btn {
    border-radius: 12px !important;
    padding: 10px 16px !important;
    transition: all 0.2s ease;
}

.share-copy-btn--copied,
.share-copy-btn--copied:hover,
.share-copy-btn--copied:focus {
    background-color: #16a34a !important;
    border-color: #16a34a !important;
    color: #ffffff !important;
}

.share-link-readonly {
    border-radius: 10px !important;
    background-color: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    color: #475569 !important;
    font-size: 0.82rem !important;
    text-align: center;
}

.btn-done {
    border-width: 2px !important;
    transition: all 0.2s ease;
}

.btn-done:hover {
    background-color: #e0e7ff !important;
    border-color: #4f46e5 !important;
    color: #4f46e5 !important;
    transform: translateY(-1px);
}

@media (max-width: 767.98px) {
    .share-modal-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .tab-card {
        position: static;
        top: auto;
        height: auto;
        border-radius: 16px !important;
    }

    .tab-buttons-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
    }

    .nav-btn {
        padding: 8px 6px !important;
        font-size: 0.8125rem !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        text-align: center !important;
        white-space: nowrap;
        margin-bottom: 0 !important;
    }

    .toolbar-palette-row {
        display: flex;
        flex-direction: row !important;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        gap: 8px;
        padding-bottom: 4px;
    }

    .toolbar-palette-row .type-btn,
    .toolbar-palette-row .toolbar-lang-row,
    .toolbar-palette-row .lang-add-btn {
        width: auto !important;
        flex: 0 0 auto;
        white-space: nowrap;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        padding: 6px 12px !important;
        margin-bottom: 0 !important;
        font-size: 0.8125rem;
    }

    .toolbar-palette-row .icon-circle {
        width: 26px;
        height: 26px;
    }
}
</style>
