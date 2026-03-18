<template>
    <CRow>
        <CCol md="9" class="mb-4">
            <TabQuestion v-if="activeTab === 'question'" ref="tabQuestion" :form="form"
                @auto-save="triggerAutoSave" />
            <TabResponses v-else-if="activeTab === 'response'" ref="tabResponses" :responses="form"
                @auto-save="triggerAutoSave" />
            <TabSetting v-else-if="activeTab === 'setting'" ref="tabSetting" :settings="form"
                @auto-save="triggerAutoSave" />
        </CCol>

        <Toolbar 
            :activeTab="activeTab" 
            @update:activeTab="(val) => $emit('update:activeTab', val)"
            :questionTypes="questionTypes"
            @add-question="addAndOpen"
            @open-image="openImageInQuestionTab"
        />
    </CRow>
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
        }
    },
    data() {
        return {
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
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        },
        async addAndOpen(typeId) {
            this.$emit('update:activeTab', 'question');
            await this.$nextTick();
            if (this.$refs.tabQuestion && typeof this.$refs.tabQuestion.addQuestion === 'function') {
                try {
                    const created = await this.$refs.tabQuestion.addQuestion(typeId);
                    if (created && created._id && typeof this.$refs.tabQuestion.scrollToQuestion === 'function') {
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
