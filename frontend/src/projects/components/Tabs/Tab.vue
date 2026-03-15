<template>
    <CRow>
        <CCol md="9" class="mb-4">
            <div>
                <TabQuestion v-if="activeTab === 'question'" ref="tabQuestion" :form="form"
                    @auto-save="triggerAutoSave" />
                <TabResponses v-else-if="activeTab === 'response'" ref="tabResponses" :responses="form"
                    @auto-save="triggerAutoSave" />
                <TabSetting v-else-if="activeTab === 'setting'" ref="tabSetting" :settings="form"
                    @auto-save="triggerAutoSave" />
            </div>
        </CCol>

        <CCol md="3">
            <CCard class="tab-card">
                <CCardBody class="p-3 d-flex flex-column">
                    <div class="d-flex justify-content-between mb-3">
                        <ButtonBack />
                        <ButtonPreview />
                    </div>

                    <div class="tab-buttons mb-3">
                        <CButton class="w-100 mb-2 text-left" color='primary'
                            :variant="activeTab === 'question' ? 'solid' : 'outline'" @click="activeTab = 'question'">
                            <CIcon name="cil-description" class="mr-2" /> Questions
                        </CButton>
                        <CButton class="w-100 mb-2 text-left" color='primary'
                            :variant="activeTab === 'response' ? 'solid' : 'outline'" @click="activeTab = 'response'">
                            <CIcon name="cil-chart-pie" class="mr-2" /> Responses
                        </CButton>
                        <CButton class="w-100 mb-2 text-left" color='primary'
                            :variant="activeTab === 'setting' ? 'solid' : 'outline'" @click="activeTab = 'setting'">
                            <CIcon name="cil-settings" class="mr-2" /> Settings
                        </CButton>
                    </div>

                    <div class="tab-body" v-if="activeTab === 'question'">
                        <h5 class="font-weight-bold">Question Types</h5>
                        <div class="d-flex flex-column mb-3">
                            <CButton v-for="type in questionTypes" :key="type._id"
                                v-if="type.type !== 'title_description' && type.type !== 'image'" variant="ghost"
                                color="dark" class="w-100 mb-2 text-left d-flex align-items-center"
                                @click="$refs.tabQuestion && $refs.tabQuestion.addQuestion(type._id)">
                                <CIcon :name="getIconForType(type.type)" class="mr-2" />
                                <span class="text-capitalize">{{ formatTypeLabel(type.type) }}</span>
                            </CButton>
                        </div>

                        <h5 class="font-weight-bold pt-3 border-top">Content Elements</h5>
                        <div class="d-flex flex-column mt-2">
                            <CButton variant="ghost" color="dark" class="w-100 mb-2 text-left d-flex align-items-center"
                                @click="$refs.tabQuestion && $refs.tabQuestion.addQuestion('title_description')">
                                <CIcon name="cil-text" class="mr-2" /> Title & Description
                            </CButton>
                            <CButton variant="ghost" color="dark" class="w-100 mb-2 text-left d-flex align-items-center"
                                @click="$refs.tabQuestion && ($refs.tabQuestion.modalImageIndex = null, $refs.tabQuestion.modalFiles = '', $refs.tabQuestion.showImageModal = true)">
                                <CIcon name="cil-image-1" class="mr-2" /> Image
                            </CButton>
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>
</template>

<script>
import { mapGetters } from 'vuex';
import TabQuestion from './TabQuestion.vue';
import TabResponses from './TabResponses.vue';
import TabSetting from './TabSetting.vue';
import ButtonBack from '../../components/Button/ButtonBack.vue';
import ButtonPreview from '../../components/Button/ButtonPreview.vue';

export default {
    name: 'Tab',
    components: {
        TabQuestion,
        TabResponses,
        TabSetting,
        ButtonBack,
        ButtonPreview,
    },
    props: {
        form: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            activeTab: 'question'
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
        formatTypeLabel(rawType) {
            if (!rawType) return '';
            const type = rawType.toLowerCase();
            if (type === 'short_answer') return 'Short Paragraph';
            return type.split('_').join(' ');
        },
        getIconForType(typeStr) {
            const type = (typeStr || '').toLowerCase().replace(/ /g, '_');
            switch (type) {
                case 'short_answer': return 'cil-minus';
                case 'paragraph': return 'cil-align-left';
                case 'multiple_choice': return 'cil-circle';
                case 'checkbox': return 'cil-square';
                case 'rating': return 'cil-star';
                case 'file_upload': return 'cil-cloud-upload';
                case 'title_description': return 'cil-text';
                case 'image': return 'cil-image-1';
                default: return 'cil-question';
            }
        }
    }
}
</script>

<style lang="scss">
.tab-card {
    position: sticky;
    top: calc(64px + 0.5rem);
    align-self: flex-start;
    height: calc(100vh - (64px + 2rem));
    overflow: hidden;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
}

.tab-card .card-body,
.tab-card .p-3 {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.tab-card .tab-body {
    flex: 1 1 auto;
    overflow: auto;
    padding-right: 0.25rem;
}

.tab-card .tab-buttons CButton,
.tab-card .tab-buttons .btn {
    text-align: left;
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
