<template>
    <div class="wizard-shell">
        <!-- ── 1. Top 5-Step Progress Bar ── -->
        <section v-if="mode === 'stepper'" class="wizard-stepper-card mb-4" aria-label="Form Builder 5-Step Wizard">
            <div class="wizard-stepper-top d-flex flex-wrap align-items-center justify-content-between">
                <div class="d-flex align-items-center mb-2 mb-sm-0">
                    <span class="wizard-brand-pill mr-2">
                        <CIcon name="cil-layers" size="sm" class="mr-1" />
                        {{ $t('wizard.badge') }}
                    </span>
                    <h2 class="wizard-stepper-heading mb-0">
                        {{ $t('wizard.heading', { step: currentStep }) }}
                    </h2>
                </div>
            </div>

            <div class="wizard-steps-grid mt-3">
                <button
                    v-for="step in steps"
                    :key="step.num"
                    type="button"
                    class="wizard-step-pill"
                    :data-wizard-step="step.num"
                    :class="{
                        'is-current': currentStep === step.num,
                        'is-done': currentStep > step.num,
                        'is-pending': currentStep < step.num
                    }"
                    @click="$emit('select-step', step.num)"
                >
                    <span class="step-status-indicator">
                        <CIcon v-if="currentStep > step.num" name="cil-check-alt" size="sm" />
                        <span v-else>{{ step.num }}</span>
                    </span>
                    <span class="step-text-wrap text-left">
                        <strong class="step-main-label">{{ step.num }}. {{ step.title }}</strong>
                        <small class="step-sub-label">{{ step.subtitle }}</small>
                    </span>
                </button>
            </div>
        </section>

        <!-- ── 2. Step 1: Language Preset Selection Workspace ── -->
        <section v-else-if="mode === 'step1'" class="wizard-card mb-4" data-testid="wizard-step1-panel">
            <div class="wizard-card-header">
                <div>
                    <h3 class="wizard-card-title mb-1">{{ $t('wizard.step1.title') }}</h3>
                    <p class="wizard-card-subtitle mb-0">{{ $t('wizard.step1.subtitle') }}</p>
                </div>
            </div>

            <div class="wizard-card-body">
                <div class="lang-preset-grid">
                    <button
                        v-for="preset in languagePresets"
                        :key="preset.key"
                        type="button"
                        class="lang-preset-card text-left"
                        :data-lang-preset="preset.key"
                        :class="{ 'is-selected': selectedPreset === preset.key }"
                        @click="selectLanguagePreset(preset.key)"
                    >
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="lang-preset-badge">{{ preset.code }}</span>
                            <span class="lang-preset-radio" :class="{ 'is-checked': selectedPreset === preset.key }">
                                <CIcon v-if="selectedPreset === preset.key" name="cil-check-alt" size="sm" />
                            </span>
                        </div>
                        <div class="lang-preset-title">{{ preset.title }}</div>
                        <div class="lang-preset-desc">{{ preset.desc }}</div>
                        <div class="lang-preset-tag mt-2">{{ preset.tag }}</div>
                    </button>
                </div>

                <div class="wizard-info-note mt-3">
                    <CIcon name="cil-globe-alt" size="sm" class="mr-2 text-primary flex-shrink-0" />
                    <span>{{ $t('wizard.step1.extraNote') }}</span>
                </div>

                <div class="wizard-footer-actions mt-4 pt-3 justify-content-end">
                    <button
                        type="button"
                        class="wizard-btn is-primary"
                        data-testid="wizard-next-btn"
                        @click="confirmStep1AndNext"
                    >
                        <span>{{ $t('wizard.step1.nextBtn') }}</span>
                        <CIcon name="cil-arrow-right" size="sm" class="ml-2" />
                    </button>
                </div>
            </div>
        </section>

        <!-- ── 3. Steps 2, 3, 4: Inline Guide Banner Above Editor/Settings ── -->
        <section v-else-if="mode === 'guide'" class="wizard-card wizard-guide-banner mb-4" :data-testid="'wizard-guide-step-' + currentStep">
            <div class="wizard-card-header d-flex flex-wrap align-items-center justify-content-between">
                <div class="d-flex align-items-center flex-wrap">
                    <CIcon name="cil-lightbulb" size="sm" class="mr-2 text-primary" />
                    <h3 class="wizard-card-title mb-0 mr-2">{{ activeGuide.title }}</h3>
                    <span v-if="currentStep === 2" class="wizard-count-pill" :class="{ 'is-ready': questionCount > 0 }">
                        {{ questionCount > 0 ? $t('wizard.step2.badgeQuestions', { count: questionCount }) : $t('wizard.step2.badgeEmpty') }}
                    </span>
                </div>
                <button
                    v-if="currentStep === 2"
                    type="button"
                    class="wizard-btn is-ghost-sm mt-2 mt-sm-0"
                    data-testid="wizard-collapse-tips-btn"
                    @click="step2TipsCollapsed = !step2TipsCollapsed"
                >
                    <CIcon :name="step2TipsCollapsed ? 'cil-chevron-bottom' : 'cil-chevron-top'" size="sm" class="mr-1" />
                    <span>{{ step2TipsCollapsed ? $t('wizard.expandHint') : $t('wizard.collapseHint') }}</span>
                </button>
            </div>

            <div class="wizard-card-body pt-2">
                <!-- Step 2: 3-Point Collapsible Quick Guide -->
                <div v-if="currentStep === 2 && !step2TipsCollapsed" class="step2-tips-grid mb-3">
                    <div v-for="(tip, idx) in step2Tips" :key="idx" class="step2-tip-item">
                        <div class="step2-tip-title">{{ tip.title }}</div>
                        <div class="step2-tip-desc">{{ tip.desc }}</div>
                    </div>
                </div>

                <!-- Step 3 & Step 4 Description -->
                <p v-if="currentStep === 3 || currentStep === 4" class="wizard-guide-desc mb-3">
                    {{ activeGuide.desc }}
                </p>

                <!-- Step 4 Contextual Login Reminder when Org/User restriction active -->
                <div v-if="currentStep === 4 && needsLoginWarning" class="wizard-warning-banner mb-3" role="alert">
                    <div class="d-flex align-items-center">
                        <CIcon name="cil-warning" size="sm" class="mr-2 flex-shrink-0" />
                        <span>{{ $t('wizard.step4.loginWarning') }}</span>
                    </div>
                    <button
                        type="button"
                        class="wizard-btn is-warn-action mt-2 mt-md-0"
                        data-testid="wizard-enable-login-btn"
                        @click="$emit('enable-require-login')"
                    >
                        {{ $t('wizard.step4.enableLoginBtn') }}
                    </button>
                </div>

                <div class="wizard-footer-actions pt-2">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                        <button
                            type="button"
                            class="wizard-btn is-neutral"
                            data-testid="wizard-prev-btn"
                            @click="$emit('prev-step')"
                        >
                            <CIcon name="cil-arrow-left" size="sm" class="mr-1" />
                            <span>{{ $t('wizard.back') }}</span>
                        </button>
                        <button
                            v-if="currentStep === 2"
                            type="button"
                            class="wizard-btn is-outline-primary"
                            data-testid="wizard-add-sample-btn"
                            @click="$emit('add-sample-question')"
                        >
                            {{ $t('wizard.step2.addSampleBtn') }}
                        </button>
                    </div>
                    <button
                        type="button"
                        class="wizard-btn is-primary"
                        data-testid="wizard-next-btn"
                        @click="$emit('next-step')"
                    >
                        <span>{{ activeGuide.nextBtn }}</span>
                        <CIcon name="cil-arrow-right" size="sm" class="ml-2" />
                    </button>
                </div>
            </div>
        </section>

        <!-- ── 4. Step 5: Readiness Summary, Preview & Share Workspace ── -->
        <section v-else-if="mode === 'step5'" class="wizard-card mb-4" data-testid="wizard-step5-panel">
            <div class="wizard-card-header">
                <h3 class="wizard-card-title mb-0 d-flex align-items-center">
                    <CIcon name="cil-check-circle" size="sm" class="mr-2 text-success" />
                    <span>{{ $t('wizard.step5.title') }}</span>
                </h3>
            </div>

            <div class="wizard-card-body">
                <CRow>
                    <!-- Left: Readiness Checklist -->
                    <CCol lg="6" class="mb-3 mb-lg-0">
                        <div class="step5-subpanel h-100">
                            <h6 class="step5-subpanel-title">{{ $t('wizard.step5.checklistTitle') }}</h6>
                            <div
                                v-for="(item, idx) in readinessItems"
                                :key="idx"
                                class="readiness-row"
                                :class="{ 'is-ready': item.ready, 'is-warn': !item.ready }"
                            >
                                <div class="d-flex align-items-center justify-content-between flex-wrap">
                                    <div class="d-flex align-items-center">
                                        <CIcon :name="item.ready ? 'cil-check-circle' : 'cil-warning'" size="sm" class="mr-2 readiness-icon" />
                                        <span class="font-weight-bold small">{{ item.label }}</span>
                                    </div>
                                    <div class="d-flex align-items-center mt-1 mt-sm-0">
                                        <span class="readiness-badge">{{ item.detail }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CCol>

                    <!-- Right: Share Link, QR Code & Preview -->
                    <CCol lg="6">
                        <div class="step5-subpanel h-100">
                            <h6 class="step5-subpanel-title">{{ $t('wizard.step5.shareTitle') }}</h6>
                            <div class="d-flex flex-column flex-sm-row align-items-center">
                                <div class="qr-canvas-box mr-sm-3 mb-3 mb-sm-0 text-center" ref="qrBox">
                                    <qr-code
                                        v-if="publicFormUrl"
                                        :text="publicFormUrl"
                                        :size="136"
                                        level="H"
                                        render-as="canvas"
                                    />
                                    <div class="qr-caption mt-1">{{ $t('wizard.step5.scanCaption') }}</div>
                                </div>

                                <div class="flex-grow-1 w-100">
                                    <label class="small font-weight-bold text-muted mb-1 d-block">{{ $t('wizard.step5.publicUrlLabel') }}</label>
                                    <input
                                        type="text"
                                        class="form-control url-readonly-input mb-2"
                                        :value="publicFormUrl"
                                        readonly
                                        @focus="$event.target.select()"
                                    />
                                    <div class="d-flex flex-column gap-2">
                                        <button
                                            type="button"
                                            class="wizard-btn is-outline-primary w-100 justify-content-center"
                                            @click="copyPublicLink"
                                        >
                                            <CIcon :name="copied ? 'cil-check-alt' : 'cil-link'" size="sm" class="mr-2" />
                                            <span>{{ copied ? $t('wizard.step5.copied') : $t('wizard.step5.copyLink') }}</span>
                                        </button>
                                        <button
                                            type="button"
                                            class="wizard-btn is-outline-primary w-100 justify-content-center"
                                            @click="$emit('open-preview')"
                                        >
                                            <CIcon name="cil-eye" size="sm" class="mr-2" />
                                            <span>{{ $t('wizard.step5.openPreview') }}</span>
                                        </button>
                                        <button
                                            type="button"
                                            class="wizard-btn is-neutral w-100 justify-content-center"
                                            @click="downloadQrCode"
                                        >
                                            <CIcon name="cil-cloud-download" size="sm" class="mr-2" />
                                            <span>{{ $t('wizard.step5.downloadQr') }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CCol>
                </CRow>

                <div class="wizard-footer-actions mt-4 pt-3">
                    <button
                        type="button"
                        class="wizard-btn is-neutral"
                        data-testid="wizard-prev-btn"
                        @click="$emit('prev-step')"
                    >
                        <CIcon name="cil-arrow-left" size="sm" class="mr-1" />
                        <span>{{ $t('wizard.back') }}</span>
                    </button>
                    <button
                        type="button"
                        class="wizard-btn is-success"
                        data-testid="wizard-finish-btn"
                        @click="$emit('finish')"
                    >
                        <CIcon name="cil-check-circle" size="sm" class="mr-2" />
                        <span>{{ $t('wizard.finish') }}</span>
                    </button>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import { getScheduleStatus, normalizeMaxResponses } from '@/projects/utils/formPolicy';

export default {
    name: 'FormBuilderWizard',
    props: {
        mode: {
            type: String,
            default: 'stepper' // 'stepper' | 'step1' | 'guide' | 'step5'
        },
        currentStep: {
            type: Number,
            default: 1
        },
        form: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            selectedPreset: 'th_en',
            step2TipsCollapsed: false,
            copied: false
        };
    },
    watch: {
        'form.title': {
            handler() {
                this.syncSelectedPresetFromForm();
            },
            immediate: true,
            deep: true
        }
    },
    computed: {
        steps() {
            return [
                { num: 1, title: this.$t('wizard.steps.s1Title'), subtitle: this.$t('wizard.steps.s1Sub') },
                { num: 2, title: this.$t('wizard.steps.s2Title'), subtitle: this.$t('wizard.steps.s2Sub') },
                { num: 3, title: this.$t('wizard.steps.s3Title'), subtitle: this.$t('wizard.steps.s3Sub') },
                { num: 4, title: this.$t('wizard.steps.s4Title'), subtitle: this.$t('wizard.steps.s4Sub') },
                { num: 5, title: this.$t('wizard.steps.s5Title'), subtitle: this.$t('wizard.steps.s5Sub') }
            ];
        },
        languagePresets() {
            return [
                {
                    key: 'th',
                    code: 'TH',
                    title: this.$t('wizard.step1.presets.thTitle'),
                    desc: this.$t('wizard.step1.presets.thDesc'),
                    tag: this.$t('wizard.step1.presets.thTag')
                },
                {
                    key: 'en',
                    code: 'EN',
                    title: this.$t('wizard.step1.presets.enTitle'),
                    desc: this.$t('wizard.step1.presets.enDesc'),
                    tag: this.$t('wizard.step1.presets.enTag')
                },
                {
                    key: 'th_en',
                    code: 'TH + EN',
                    title: this.$t('wizard.step1.presets.bilingualTitle'),
                    desc: this.$t('wizard.step1.presets.bilingualDesc'),
                    tag: this.$t('wizard.step1.presets.bilingualTag')
                }
            ];
        },
        step2Tips() {
            return [
                { title: this.$t('wizard.step2.tip1Title'), desc: this.$t('wizard.step2.tip1Desc') },
                { title: this.$t('wizard.step2.tip2Title'), desc: this.$t('wizard.step2.tip2Desc') },
                { title: this.$t('wizard.step2.tip3Title'), desc: this.$t('wizard.step2.tip3Desc') }
            ];
        },
        activeGuide() {
            if (this.currentStep === 2) {
                return { title: this.$t('wizard.step2.title'), desc: '', nextBtn: this.$t('wizard.step2.nextBtn') };
            }
            if (this.currentStep === 3) {
                return { title: this.$t('wizard.step3.title'), desc: this.$t('wizard.step3.desc'), nextBtn: this.$t('wizard.step3.nextBtn') };
            }
            return { title: this.$t('wizard.step4.title'), desc: this.$t('wizard.step4.desc'), nextBtn: this.$t('wizard.step4.nextBtn') };
        },
        formLangKeys() {
            const titles = Array.isArray(this.form?.title) ? this.form.title : [];
            const keys = titles.map(t => String(t?.key || '').trim().toLowerCase()).filter(Boolean);
            return keys.length ? Array.from(new Set(keys)) : ['en'];
        },
        questionCount() {
            return Array.isArray(this.form?.questions) ? this.form.questions.length : 0;
        },
        hasOrgRestriction() {
            return Array.isArray(this.form?.organization) && this.form.organization.length > 0;
        },
        hasUserRestriction() {
            const s = this.form?.settings || {};
            return Array.isArray(s.allowedUser) && s.allowedUser.length > 0;
        },
        hasRoleRestriction() {
            const s = this.form?.settings || {};
            return Array.isArray(s.allowedRoles) && s.allowedRoles.length > 0;
        },
        isRequireLoginEnabled() {
            return Boolean(this.form?.settings?.requireLogin);
        },
        needsLoginWarning() {
            return (this.hasOrgRestriction || this.hasUserRestriction || this.hasRoleRestriction) && !this.isRequireLoginEnabled;
        },
        scheduleStatus() {
            return getScheduleStatus(this.form?.schedule);
        },
        isFormOpen() {
            return this.scheduleStatus === 'open' || this.scheduleStatus === 'open_forever';
        },
        publicFormUrl() {
            if (!this.form || !this.form._id || typeof window === 'undefined') return '';
            return `${window.location.origin}/forms/${this.form._id}?mode=public`;
        },
        readinessItems() {
            const titles = Array.isArray(this.form?.title) ? this.form.title : [];
            const primaryTitle = titles.find(t => t && String(t.value || '').trim())?.value || 'Untitled Form';
            const statusTextMap = {
                draft: this.$t('editor.settings.status.draft'),
                open: this.$t('editor.settings.status.open'),
                open_forever: this.$t('editor.settings.status.openForever'),
                closed_forever: this.$t('editor.settings.status.closedForever'),
                scheduled: this.$t('editor.settings.status.scheduled'),
                closed: this.$t('editor.settings.status.closed')
            };

            const s = this.form?.settings || {};
            const activeRules = [];
            if (s.requireLogin) activeRules.push('Login');
            if (s.limitResponse) activeRules.push('Limit 1');
            const quota = normalizeMaxResponses(s.maxResponses);
            if (quota) activeRules.push(`Max ${quota}`);
            if (s.emailNotifications || s.notifyCreator) activeRules.push('Email');

            return [
                {
                    label: this.$t('wizard.step5.langItem'),
                    ready: true,
                    detail: this.formLangKeys.map(k => k.toUpperCase()).join(' + '),
                    canQuickOpen: false
                },
                {
                    label: this.$t('wizard.step5.titleItem'),
                    ready: Boolean(primaryTitle && primaryTitle.toLowerCase() !== 'untitled form'),
                    detail: primaryTitle,
                    canQuickOpen: false
                },
                {
                    label: this.$t('wizard.step5.questionsItem'),
                    ready: this.questionCount > 0,
                    detail: this.questionCount > 0
                        ? this.$t('wizard.step5.questionsCount', { count: this.questionCount })
                        : this.$t('wizard.step5.questionsNeedOne'),
                    canQuickOpen: false
                },
                {
                    label: this.$t('wizard.step5.statusItem'),
                    ready: this.isFormOpen || this.scheduleStatus === 'scheduled',
                    detail: statusTextMap[this.scheduleStatus] || statusTextMap.draft,
                    canQuickOpen: this.scheduleStatus === 'draft' || this.scheduleStatus === 'closed' || this.scheduleStatus === 'closed_forever'
                },
                {
                    label: this.$t('wizard.step5.responseItem'),
                    ready: true,
                    detail: activeRules.length ? activeRules.join(' · ') : 'Default (Guest / Unlimited)',
                    canQuickOpen: false
                }
            ];
        }
    },
    methods: {
        syncSelectedPresetFromForm() {
            const keys = this.formLangKeys;
            const hasTh = keys.includes('th');
            const hasEn = keys.includes('en');
            if (hasTh && hasEn) this.selectedPreset = 'th_en';
            else if (hasTh) this.selectedPreset = 'th';
            else if (hasEn) this.selectedPreset = 'en';
        },
        selectLanguagePreset(presetKey) {
            this.selectedPreset = presetKey;
            this.$emit('apply-language-preset', presetKey);
        },
        confirmStep1AndNext() {
            this.$emit('apply-language-preset', this.selectedPreset);
            this.$emit('next-step');
        },
        copyPublicLink() {
            if (!this.publicFormUrl) return;
            const onDone = () => {
                this.copied = true;
                setTimeout(() => { this.copied = false; }, 2000);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(this.publicFormUrl).then(onDone).catch(() => this.fallbackCopy(onDone));
            } else {
                this.fallbackCopy(onDone);
            }
        },
        fallbackCopy(done) {
            const el = document.createElement('textarea');
            el.value = this.publicFormUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            done();
        },
        downloadQrCode() {
            const wrapper = this.$refs.qrBox;
            const canvas = wrapper && wrapper.querySelector('canvas');
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `form-qr-${this.form?._id || 'link'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    }
};
</script>

<style scoped>
.wizard-shell {
    font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    letter-spacing: 0.014em;
    line-height: 1.65;
}

.wizard-stepper-card,
.wizard-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 1.5rem 1.75rem;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
}

.wizard-stepper-top {
    gap: 0.75rem;
}

.wizard-brand-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.34rem 0.85rem;
    border-radius: 999px;
    background: #fdf2f2;
    border: 1px solid #f5d0d0;
    color: #8c1515;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.02em;
}

.wizard-stepper-heading,
.wizard-card-title {
    font-size: 1.12rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.5;
    letter-spacing: 0.015em;
}

.wizard-card-header {
    margin-bottom: 0.85rem;
}

.wizard-card-subtitle,
.wizard-guide-desc {
    font-size: 0.93rem;
    color: #475569;
    line-height: 1.7;
    letter-spacing: 0.014em;
}

.wizard-steps-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.9rem;
}

@media (max-width: 1199.98px) {
    .wizard-steps-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.wizard-step-pill {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-radius: 14px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.16s ease;
}

.wizard-step-pill:hover {
    border-color: #d6a3a3;
    background: #fffafa;
}

.wizard-step-pill.is-current {
    border-color: #8c1515;
    background: #fdf4f4;
    box-shadow: 0 2px 8px rgba(140, 21, 21, 0.08);
}

.wizard-step-pill.is-done {
    border-color: #bbf7d0;
    background: #f0fdf4;
}

.step-status-indicator {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
    background: #e2e8f0;
    color: #334155;
}

.wizard-step-pill.is-current .step-status-indicator {
    background: #8c1515;
    color: #ffffff;
}

.wizard-step-pill.is-done .step-status-indicator {
    background: #16a34a;
    color: #ffffff;
}

.step-main-label {
    display: block;
    font-size: 0.86rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.45;
    margin-bottom: 0.22rem;
    letter-spacing: 0.012em;
}

.step-sub-label {
    display: block;
    font-size: 0.76rem;
    color: #64748b;
    line-height: 1.45;
    letter-spacing: 0.012em;
}

.lang-preset-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
    margin-top: 0.5rem;
}

@media (max-width: 767.98px) {
    .lang-preset-grid {
        grid-template-columns: 1fr;
    }
}

.lang-preset-card {
    padding: 1.4rem 1.5rem;
    border-radius: 16px;
    border: 2px solid #e2e8f0;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.16s ease;
    display: flex;
    flex-direction: column;
}

.lang-preset-card:hover {
    border-color: #d6a3a3;
    background: #fffafa;
}

.lang-preset-card.is-selected {
    border-color: #8c1515;
    background: #fdf4f4;
    box-shadow: 0 4px 14px rgba(140, 21, 21, 0.08);
}

.lang-preset-badge {
    display: inline-block;
    padding: 0.28rem 0.72rem;
    border-radius: 8px;
    background: #f1f5f9;
    color: #1e293b;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.03em;
}

.lang-preset-card.is-selected .lang-preset-badge {
    background: #8c1515;
    color: #ffffff;
}

.lang-preset-radio {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    border: 2px solid #cbd5e1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
}

.lang-preset-radio.is-checked {
    border-color: #8c1515;
    background: #8c1515;
}

.lang-preset-title {
    font-weight: 700;
    color: #0f172a;
    font-size: 1.05rem;
    line-height: 1.5;
    margin-top: 0.55rem;
    margin-bottom: 0.4rem;
    letter-spacing: 0.015em;
}

.lang-preset-desc {
    font-size: 0.88rem;
    color: #475569;
    line-height: 1.65;
    letter-spacing: 0.014em;
    flex-grow: 1;
}

.lang-preset-tag {
    font-size: 0.79rem;
    font-weight: 700;
    color: #8c1515;
    letter-spacing: 0.02em;
    padding-top: 0.45rem;
}

.wizard-info-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 1.1rem;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-size: 0.88rem;
    color: #475569;
    line-height: 1.65;
    letter-spacing: 0.014em;
}

.wizard-guide-banner {
    border: 1px solid rgba(140, 21, 21, 0.22);
}

.step2-tips-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.1rem;
    margin-top: 0.35rem;
}

@media (max-width: 767.98px) {
    .step2-tips-grid {
        grid-template-columns: 1fr;
    }
}

.step2-tip-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 1rem 1.15rem;
}

.step2-tip-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.45rem;
    line-height: 1.5;
    letter-spacing: 0.014em;
}

.step2-tip-desc {
    font-size: 0.84rem;
    color: #475569;
    line-height: 1.65;
    letter-spacing: 0.012em;
}

.wizard-count-pill {
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    background: #f1f5f9;
    color: #475569;
    letter-spacing: 0.015em;
}

.wizard-count-pill.is-ready {
    background: #dcfce7;
    color: #166534;
}

.wizard-warning-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem;
    padding: 0.9rem 1.15rem;
    border-radius: 12px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    color: #92400e;
    font-size: 0.88rem;
    line-height: 1.65;
}

.step5-subpanel {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.25rem 1.35rem;
}

.step5-subpanel-title {
    font-size: 0.98rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1rem;
    letter-spacing: 0.015em;
}

.readiness-row {
    padding: 0.75rem 0.95rem;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    margin-bottom: 0.65rem;
    line-height: 1.55;
}

.readiness-row:last-child {
    margin-bottom: 0;
}

.readiness-row.is-ready .readiness-icon {
    color: #16a34a;
}

.readiness-row.is-warn .readiness-icon {
    color: #d97706;
}

.readiness-badge {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
    background: #f1f5f9;
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
    letter-spacing: 0.015em;
}

.qr-canvas-box {
    background: #ffffff;
    padding: 0.85rem;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
}

.qr-caption {
    font-size: 0.76rem;
    color: #64748b;
    line-height: 1.5;
}

.url-readonly-input {
    font-size: 0.84rem;
    padding: 0.55rem 0.85rem;
    background: #ffffff !important;
    letter-spacing: 0.01em;
}

.wizard-footer-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem;
    border-top: 1px solid #e2e8f0;
    margin-top: 0.75rem;
    padding-top: 1rem !important;
}

.wizard-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.58rem 1.2rem;
    border-radius: 12px;
    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1.45;
    letter-spacing: 0.015em;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
}

.wizard-btn.is-primary {
    background: #8c1515;
    color: #ffffff;
    box-shadow: 0 3px 10px rgba(140, 21, 21, 0.18);
}

.wizard-btn.is-primary:hover {
    background: #721111;
}

.wizard-btn.is-outline-primary {
    background: #fdf4f4;
    border-color: #e8c4c4;
    color: #8c1515;
}

.wizard-btn.is-outline-primary:hover {
    background: #fae8e8;
    border-color: #d6a3a3;
}

.wizard-btn.is-neutral {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #334155;
}

.wizard-btn.is-neutral:hover {
    background: #e2e8f0;
}

.wizard-btn.is-ghost-sm {
    padding: 0.38rem 0.85rem;
    font-size: 0.8rem;
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #475569;
}

.wizard-btn.is-warn-action {
    padding: 0.45rem 0.95rem;
    font-size: 0.82rem;
    background: #d97706;
    color: #ffffff;
}

.wizard-btn.is-success {
    background: #15803d;
    color: #ffffff;
    box-shadow: 0 3px 10px rgba(21, 128, 61, 0.18);
}

.wizard-btn.is-success:hover {
    background: #166534;
}

.wizard-btn.is-success-sm {
    padding: 0.3rem 0.75rem;
    font-size: 0.78rem;
    background: #15803d;
    color: #ffffff;
}

.gap-2 {
    gap: 0.65rem;
}

@media (max-width: 767.98px) {
    .wizard-stepper-card,
    .wizard-card {
        padding: 1rem;
        border-radius: 16px;
    }

    .wizard-steps-grid {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        gap: 0.5rem;
        padding-bottom: 6px;
        scrollbar-width: thin;
        scrollbar-color: rgba(140, 21, 21, 0.35) #f1f5f9;

        &::-webkit-scrollbar {
            height: 4px;
        }

        &::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(140, 21, 21, 0.35);
            border-radius: 4px;
        }
    }

    .wizard-step-pill {
        flex: 1 1 auto;
        min-width: 130px;
        max-width: 180px;
        padding: 0.55rem 0.75rem;
        gap: 0.5rem;
    }

    .step-main-label {
        font-size: 0.82rem;
    }

    .step-sub-label {
        font-size: 0.72rem;
    }

    .wizard-btn {
        flex: 1 1 auto;
        justify-content: center;
        white-space: normal;
        text-align: center;
    }
}

@media (max-width: 575.98px) {
    .wizard-steps-grid {
        gap: 0.35rem;
        padding-bottom: 4px;
    }

    .wizard-step-pill {
        min-width: 0;
        flex: 1 1 auto;
        padding: 0.45rem 0.45rem;
        gap: 0.35rem;
        justify-content: center;

        .step-text-wrap {
            .step-sub-label {
                display: none;
            }
            .step-main-label {
                font-size: 0.74rem;
                margin-bottom: 0;
                white-space: nowrap;
            }
        }

        .step-status-indicator {
            width: 24px;
            height: 24px;
            font-size: 0.72rem;
        }
    }
}
</style>
