<template>
    <div>
        <div v-if="activeTab !== 'response'" class="form-flow-tabs mb-4">
            <button v-for="(step, index) in flowSteps" :key="step.key" type="button"
                class="flow-tab" :class="{ active: activeTab === step.key, locked: isStepLocked(index) }"
                :disabled="isStepLocked(index)" @click="selectStep(step, index)">
                <span class="flow-number">{{ step.number }}</span>
                <CIcon :name="step.icon" class="mr-2" />
                <span>{{ step.label }}</span>
                <CIcon v-if="isStepLocked(index)" name="cil-lock-locked" size="sm" class="ml-2" />
            </button>
        </div>
    <CRow>
        <CCol :md="activeTab === 'question' ? 9 : 12" class="mb-4">
            <TabQuestion v-if="activeTab === 'question'" ref="tabQuestion" :form="form"
                @auto-save="triggerAutoSave" />
            <TabResponses v-else-if="activeTab === 'response'" ref="tabResponses" :responses="form"
                @auto-save="triggerAutoSave" />
            <TabSetting v-else ref="tabSetting" :settings="form" :section="activeTab"
                @auto-save="triggerAutoSave" />
        </CCol>

        <Toolbar v-if="activeTab === 'question'"
            :activeTab="activeTab" 
            :form="form"
            @update:activeTab="(val) => $emit('update:activeTab', val)"
            :questionTypes="questionTypes"
            @add-question="addAndOpen"
            @open-image="openImageInQuestionTab"
        />
    </CRow>
        <div v-if="sequentialFlow" class="flow-actions mt-2 mb-4">
            <div class="flow-validation-message">
                <CIcon v-if="flowError" name="cil-warning" class="mr-2" />{{ flowError }}
            </div>
            <div class="ml-auto d-flex">
                <CButton v-if="currentStepIndex > 0" color="secondary" variant="outline" class="mr-2 flow-back-button" @click="goPrevious">{{ $t('flow.back') }}</CButton>
                <CButton color="primary" @click="goNext">
                    {{ currentStepIndex === flowSteps.length - 1 ? $t('flow.finish') : $t('flow.next') }}
                    <CIcon :name="currentStepIndex === flowSteps.length - 1 ? 'cil-check' : 'cil-chevron-right'" class="ml-2" />
                </CButton>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import TabQuestion from './TabQuestion.vue';
import TabResponses from './TabResponses.vue';
import TabSetting from './TabSetting.vue';
import Toolbar from './Toolbar.vue';

export default {
    name: 'Tab',
    components: {
        TabQuestion,
        TabResponses,
        TabSetting,
        Toolbar
    },
    props: {
        form: {
            type: Object,
            default: () => ({})
        },
        activeTab: {
            type: String,
            default: 'question'
        },
        sequentialFlow: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            flowSteps: [
                { key: 'language', number: 1, icon: 'cil-language', label: this.$t('flow.steps.language') },
                { key: 'question', number: 2, icon: 'cil-description', label: this.$t('flow.steps.question') },
                { key: 'access', number: 3, icon: 'cil-lock-locked', label: this.$t('flow.steps.access') },
                { key: 'form_setting', number: 4, icon: 'cil-settings', label: this.$t('flow.steps.formSetting') },
                { key: 'publish', number: 5, icon: 'cil-check-circle', label: this.$t('flow.steps.publish') }
            ],
            highestUnlockedStep: this.activeTab === 'language' ? 0 : 4,
            stepActions: {},
            flowError: ''
        };
    },
    created() {
        this.$store.dispatch('Setting/question_type/get');
    },
    computed: {
        ...mapGetters('Setting/question_type', { question_type: 'item' }),
        questionTypes() {
            if (!this.question_type || !Array.isArray(this.question_type)) return [];
            return JSON.parse(JSON.stringify(this.question_type)).map(type => ({
                _id: type._id,
                type: type.type,
            }));
        },
        currentStepIndex() {
            const index = this.flowSteps.findIndex(step => step.key === this.activeTab);
            return index < 0 ? 0 : index;
        }
    },
    methods: {
        isStepLocked(index) {
            return this.sequentialFlow && this.flowSteps[index].key !== this.activeTab;
        },
        selectStep(step, index) {
            if (this.isStepLocked(index)) return;
            this.$emit('update:activeTab', step.key);
        },
        validateCurrentStep() {
            if (this.activeTab === 'language') {
                const languages = this.form && this.form.settings && this.form.settings.languages;
                if (!Array.isArray(languages) || !languages.length) return this.$t('flow.languageRequired');
                return '';
            }
            if (!this.stepActions[this.activeTab]) return this.$t('flow.actionRequired');
            const questions = this.$refs.tabQuestion && this.$refs.tabQuestion.localQuestions;
            if (this.activeTab === 'question' && (!Array.isArray(questions) || !questions.length)) {
                return this.$t('flow.questionRequired');
            }
            return '';
        },
        goPrevious() {
            this.flowError = '';
            const previous = this.flowSteps[this.currentStepIndex - 1];
            if (previous) this.$emit('update:activeTab', previous.key);
        },
        goNext() {
            this.flowError = this.validateCurrentStep();
            if (this.flowError) return;
            if (this.currentStepIndex === this.flowSteps.length - 1) {
                this.$emit('flow-complete');
                return;
            }
            this.$emit('update:activeTab', this.flowSteps[this.currentStepIndex + 1].key);
        },
        triggerAutoSave() {
            if (this.sequentialFlow) this.$set(this.stepActions, this.activeTab, true);
            this.flowError = '';
            this.$emit('auto-save');
        },
        async addAndOpen(typeId) {
            this.$emit('update:activeTab', 'question');
            await this.$nextTick();
            if (this.$refs.tabQuestion && typeof this.$refs.tabQuestion.addQuestion === 'function') {
                try {
                    const created = await this.$refs.tabQuestion.addQuestion(typeId);
                    if (created && created._id && typeof this.$refs.tabQuestion.scrollToQuestion === 'function') {
                        if (this.sequentialFlow) this.$set(this.stepActions, 'question', true);
                        this.flowError = '';
                        this.$refs.tabQuestion.scrollToQuestion(created._id);
                    }
                } catch (err) {
                    console.error('addAndOpen failed', err);
                }
            }
        },
        openImageInQuestionTab() {
            this.$emit('update:activeTab', 'question');
            this.$nextTick(() => {
                if (this.$refs.tabQuestion) {
                    this.$refs.tabQuestion.modalImageIndex = null;
                    this.$refs.tabQuestion.modalFiles = '';
                    this.$refs.tabQuestion.showImageModal = true;
                }
            });
        }
    }
}
</script>

<style lang="scss">
.form-flow-tabs {
    display: grid;
    grid-template-columns: repeat(5, minmax(180px, 1fr));
    padding: 6px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, .05);
    overflow-x: auto;
    overflow-y: hidden;
}

.flow-tab {
    min-height: 52px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: #64748b;
    font-weight: 700;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all .2s ease;
    white-space: nowrap;
}

.flow-tab.active {
    color: #fff;
    background: #8b1a1a;
    box-shadow: 0 4px 10px rgba(139, 26, 26, .22);
}

.flow-tab.locked {
    opacity: .45;
    cursor: not-allowed;
    background: #f8fafc;
}

.flow-number {
    width: 24px;
    height: 24px;
    margin-right: 8px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: .75rem;
}

.flow-tab.active .flow-number { background: rgba(255,255,255,.2); color: #fff; }
.flow-actions { min-height: 48px; display: flex; align-items: center; }
.flow-validation-message { color: #b91c1c; font-size: .875rem; font-weight: 600; }
.flow-back-button {
    background: #fff !important;
    border: 1px solid #cbd5e1 !important;
    color: #334155 !important;
    box-shadow: 0 2px 6px rgba(15, 23, 42, .1) !important;
}
.flow-back-button:hover,
.flow-back-button:focus {
    background: #f8fafc !important;
    border-color: #94a3b8 !important;
    color: #0f172a !important;
}

.custom-tabs-wrapper {
    width: 100%;
}

.custom-tabs-wrapper .tab-content .active {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
}

.custom-tabs-wrapper .nav-pills {
    background-color: #f1f5f9;
    padding: 4px;
    border-radius: 50px;
    display: flex;
    width: 100%;
    border: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
}

.custom-tabs-wrapper .nav-item {
    margin-right: 0 !important;
    flex: 1;
    text-align: center;
}

.custom-tabs-wrapper .nav-link {
    border-radius: 50px !important;
    color: #64748b !important;
    padding: 10px 0 !important;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none !important;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}


.custom-tabs-wrapper .nav-link:hover {
    color: #334155 !important;
}

.custom-tabs-wrapper .nav-link.active {
    background-color: white !important;
    color: #0f172a !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 600;
}
</style>
