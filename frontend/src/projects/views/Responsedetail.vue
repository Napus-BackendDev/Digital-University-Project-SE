<template>
    <div class="response-detail-view">
        <div v-if="loading" class="py-4 px-3">
            <SkeletonLoader type="form-fill" />
        </div>
        
        <CRow v-else-if="error" class="justify-content-center mt-5">
            <CCol md="6">
                <CCallout color="danger" class="bg-white shadow-sm border-left-4">
                    <h5 class="text-danger font-weight-bold">{{ $t('common.error') }}</h5>
                    <p>{{ error }}</p>
                    <CButton color="primary" variant="outline" @click="fetchResponseDetail">{{ $t('responseDetail.tryAgain') }}</CButton>
                </CCallout>
            </CCol>
        </CRow>

            <div v-else-if="response" class="pb-5 px-2 px-sm-3 pt-3 pt-md-4">
            <CRow class="justify-content-center">
                <CCol lg="10" xl="9">
                    <!-- Header Section -->
                    <CCard class="mb-4 border-0 shadow-sm rounded-20 overflow-hidden">
                        <CCardBody class="p-3 p-md-4">
                            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4" style="gap: 12px;">
                                <div class="d-flex align-items-center">
                                    <ButtonBack :to="backRoute" class="mr-3 flex-shrink-0" />
                                    <div>
                                        <h2 class="m-0 font-weight-bold text-dark response-detail-title" style="letter-spacing: -0.5px;">
                                            {{ $t('responseDetail.title') }}
                                        </h2>
                                        <p class="text-muted small mb-0">{{ $t('responseDetail.subtitle') }}</p>
                                    </div>
                                </div>
                                <div class="d-flex flex-wrap gap-2 align-items-center response-action-bar">
                                    <button class="btn btn-success px-3 d-flex align-items-center justify-content-center shadow-sm" style="height: 40px;" @click="exportXlsx">
                                        <CIcon name="cil-spreadsheet" class="mr-2" /> {{ $t('responseDetail.exportXlsx') }}
                                    </button>
                                    <button class="btn btn-outline-primary px-3 d-flex align-items-center justify-content-center shadow-sm" style="height: 40px;" @click="copyApiUrl">
                                        <CIcon :name="apiCopied ? 'cil-check-alt' : 'cil-copy'" class="mr-2" /> {{ apiCopied ? $t('responses.apiCopied') : $t('responses.copyApi') }}
                                    </button>
                                    <button class="btn btn-outline-danger px-3 d-flex align-items-center justify-content-center shadow-sm" style="height: 40px;" @click="deleteResponse">
                                        <CIcon name="cil-trash" class="mr-1" /> {{ $t('responseDetail.delete') }}
                                    </button>
                                </div>
                            </div>
                        
                            <CRow class="bg-light p-3 rounded-16 mx-0 border">
                                <CCol md="4" class="py-2 border-right-md d-flex flex-column justify-content-center">
                                    <label class="small text-uppercase font-weight-bold text-muted d-block mb-1">{{ $t('responseDetail.responder') }}</label>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar-circle mr-3 flex-shrink-0">
                                            {{ getAvatarChar() }}
                                        </div>
                                        <div class="d-flex flex-column overflow-hidden">
                                            <div class="font-weight-bold text-dark text-truncate" style="font-size: 0.95rem; line-height: 1.2;">
                                                {{ getResponderName() }}
                                            </div>
                                            <div v-if="getResponderRole()" class="responder-role-text text-truncate mt-1">
                                                {{ getResponderRole() }}
                                            </div>
                                            <div v-if="getResponderEmail()" class="text-muted small text-truncate" style="font-size: 0.8125rem;">
                                                {{ getResponderEmail() }}
                                            </div>
                                        </div>
                                    </div>
                                </CCol>
                                <CCol md="4" class="py-2 border-right-md d-flex flex-column justify-content-center">
                                    <label class="small text-uppercase font-weight-bold text-muted d-block mb-1">{{ $t('responseDetail.submittedAt') }}</label>
                                    <div class="font-weight-bold text-dark">
                                        <CIcon name="cil-calendar" class="mr-1 text-primary" />
                                        {{ formatDate(response.createdAt) }}
                                    </div>
                                </CCol>
                                <CCol md="4" class="py-2 d-flex flex-column justify-content-center">
                                    <label class="small text-uppercase font-weight-bold text-muted d-block mb-1">{{ $t('responseDetail.statusProgress') }}</label>
                                    <div class="d-flex align-items-center">
                                        <CBadge :color="response.submit ? 'success' : 'warning'" class="px-3 py-2 rounded-pill mr-2 shadow-sm">
                                            {{ response.submit ? $t('status.completed') : $t('status.draft') }}
                                        </CBadge>
                                        <span class="text-muted small font-weight-bold" v-if="response.submit && (response.answers || []).length === 0">
                                            {{ $t('responseDetail.submittedNoAnswers') }}
                                        </span>
                                        <span class="text-muted small font-weight-bold" v-else>
                                            {{ $t('responseDetail.answeredCount', { count: (response.answers || []).length }) }}
                                        </span>
                                    </div>
                                </CCol>
                            </CRow>
                        </CCardBody>
                    </CCard>

                        <!-- Detailed Answers Table -->
                    <CCard class="mb-5 border-0 shadow-sm rounded-20 overflow-hidden">
                        <CCardHeader class="bg-white p-3 p-md-4 border-bottom-0 d-flex flex-wrap justify-content-between align-items-center" style="gap: 8px;">
                            <h4 class="m-0 font-weight-bold text-dark">{{ $t('responseDetail.detailedAnswers') }}</h4>
                            <span class="badge badge-light p-2 px-3 rounded-pill text-primary font-weight-bold border">
                                {{ $t('responseDetail.questionsCount', { count: (enrichedAnswers || []).length }) }}
                            </span>
                        </CCardHeader>
                        <CCardBody class="p-0">
                            <AnswerTable :answers="enrichedAnswers" />
                        </CCardBody>
                    </CCard>

                    <!-- Other Responses for this Form -->
                    <div class="mb-5">
                        <div class="mb-4">
                            <h4 class="font-weight-bold text-dark mb-1">{{ $t('responseDetail.otherSubmissions') }}</h4>
                            <p class="text-muted">{{ $t('responseDetail.otherSubmissionsDesc') }}</p>
                        </div>
                        <ResponseTables :responseList="responsesList" :currentId="id" :totalQuestions="formInputQuestionCount" />
                    </div>
                </CCol>
            </CRow>
        </div>
        </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import moment from 'moment';
import ResponseTables from '@/projects/components/tables/ResponseTables.vue';
import AnswerTable from '@/projects/components/tables/AnswerTable.vue';
import ButtonBack from '@/projects/components/Button/ButtonBack.vue';
import SkeletonLoader from '@/projects/components/Util/SkeletonLoader.vue';
import { formatExportAnswerValue, applySheetHyperlinks } from '@/projects/utils/exportFileUrl';
import { resolveUserRoleLabel, countInputQuestions, isFreeTextQuestionType } from '@/projects/utils/formPolicy';
import { buildApiUrl, copyText } from '@/projects/utils/apiUrl';
import localeMixin from '@/mixins/localeMixin';

export default {
    name: 'ResponseDetail',
    mixins: [localeMixin],
    components: { ResponseTables, AnswerTable, ButtonBack, SkeletonLoader },
    props: {
        id: { type: String, required: true }
    },
    data() {
        return {
            loading: false,
            error: null,
            apiCopied: false,
            apiCopyTimer: null,
            response: null
        };
    },
    computed: {
        ...mapGetters({
            organizations: 'Organizations/organizations',
            users: 'User/users',
            questionTypesStore: 'Setting/question_type/item'
        }),
        question_type_list() {
            var store = this.$store;
            return (store && store.getters['Setting/question_type/item']) || [];
        },
        questionTypes() {
            if (!this.question_type_list || !Array.isArray(this.question_type_list)) return [];
            return this.question_type_list.map(function(type) {
                return { _id: type._id, type: type.type };
            });
        },
        enrichedAnswers() {
            if (!this.response || !Array.isArray(this.response.answers)) return [];
            var self = this;
            var questionMap = {};
            var form = this.response.form || {};
            var formQuestions = form.questions || form.items || [];
            
            if (Array.isArray(formQuestions)) {
                formQuestions.forEach(function(q) {
                    if (!q) return;
                    var qid = q._id || q.id;
                    if (qid) questionMap[String(qid)] = q;
                });
            }

            return this.response.answers.map(function(ans, index) {
                var q = ans.question;
                var qId = q && (typeof q === 'object' ? (q._id || q.id) : q);
                var enrichedQuestion = (qId && questionMap[String(qId)]) ? Object.assign({}, questionMap[String(qId)]) : null;
                
                if (!enrichedQuestion && q && typeof q === 'object') enrichedQuestion = q;
                
                if (!enrichedQuestion) {
                    enrichedQuestion = {
                        _id: qId || ('q-' + index),
                        title: [{ key: 'en', value: 'Question ' + (index + 1) }],
                        type: 'unknown'
                    };
                }
                
                var newAns = Object.assign({}, ans);
                newAns.id = index + 1;
                newAns.question = enrichedQuestion;
                return newAns;
            });
        },
        responsesList() {
            if (this.response && this.response.form && Array.isArray(this.response.form.responses)) {
                return this.response.form.responses;
            }
            return [];
        },
        formInputQuestionCount() {
            const formQuestions = (this.response && this.response.form && (this.response.form.questions || this.response.form.items)) || [];
            return countInputQuestions(formQuestions);
        },
        backRoute() {
            if (this.response && this.response.form) {
                const form = this.response.form;
                const formId = form._id || form.id || (typeof form === 'string' ? form : null);
                if (formId) return { name: 'EditorCreateForm', params: { _id: formId } };
            }
            return { name: 'ManageForms' };
        }
    },
    watch: {
        id: function() {
            this.fetchResponseDetail();
        }
    },
    created() {
        this.fetchResponseDetail();
        if (this.$store) {
            this.$store.dispatch('Setting/question_type/get');
        }
    },
    methods: {
        getAvatarChar() {
            var name = this.getResponderName();
            return (name ? name.charAt(0) : 'A').toUpperCase();
        },
        getResponderName() {
            const anon = this.$t('responseDetail.anonymous');
            if (!this.response) return anon;
            var responder = this.response.responder;
            if (responder) return responder.fullname || responder.name || responder.email || anon;
            return this.response.responderName || anon;
        },
        getResponderEmail() {
            if (!this.response) return '';
            var responder = this.response.responder;
            return (responder && responder.email) ? responder.email : '';
        },
        getResponderRole() {
            if (!this.response || !this.response.responder) return '';
            return resolveUserRoleLabel(this.response.responder, {
                users: this.users || [],
                getText: (val) => this.getLang(val)
            });
        },
        exportXlsx() {
            console.log("XLSX Export triggered");
            try {
                var XLSX = require('xlsx');
                if (!this.response || !this.enrichedAnswers.length) {
                    alert(this.$t('responseDetail.noExportData'));
                    return;
                }
                
                var responderName = this.getResponderName();
                var responderEmail = this.getResponderEmail();
                var responderRole = this.getResponderRole() || '-';
                
                // Resolve Department Name
                let departmentName = '-';
                const responder = this.response.responder;
                if (responder && responder.organization) {
                    const orgId = responder.organization._id || responder.organization;
                    const foundOrg = (this.organizations || []).find(o => (o._id === orgId || o.id === orgId));
                    departmentName = foundOrg ? (this.getLang(foundOrg.title) || foundOrg.name) : orgId;
                }

                var metadata = [
                    [this.$t('responseDetail.reportTitle')],
                    [this.$t('responseDetail.metaResponder'), responderName],
                    [this.$t('responseDetail.metaRole'), responderRole],
                    [this.$t('responseDetail.metaEmail'), responderEmail],
                    [this.$t('responseDetail.metaDepartment'), departmentName],
                    [this.$t('responseDetail.metaSubmissionDate'), this.formatDate(this.response.createdAt)],
                    [""],
                    ["#", this.$t('responseDetail.colQuestion'), this.$t('responseDetail.colType'), this.$t('responseDetail.colResponse')]
                ];

                var self = this;
                var rows = this.enrichedAnswers.map(function(item, index) {
                    var questionText = self.getLang(item.question && item.question.title) || self.$t('form.question');
                    var type = self.getQuestionTypeLabel(item.question);
                    const isChoice = self.isChoiceType(type);
                    
                    let val = item.response;
                    
                    // Choice Label Resolution (New)
                    if (isChoice) {
                        const options = (item.question.config && Array.isArray(item.question.config.choices)) 
                            ? item.question.config.choices 
                            : (item.question.options || []);
                        
                        const choices = Array.isArray(val) ? val : (val !== null && val !== undefined ? [val] : []);
                        const labels = choices.map(c => {
                            let opt = options.find(o => o && (String(o.key) === String(c) || String(o._id) === String(c) || String(o.value) === String(c)));
                            if (!opt && !isNaN(c) && options[Number(c)]) opt = options[Number(c)];
                            if (opt) return (opt.lang && Array.isArray(opt.lang)) ? self.getLang(opt.lang) : (opt.label ? self.getLang(opt.label) : (opt.value || c));
                            return c;
                        });
                        val = labels.join(', ');
                    } else {
                        val = formatExportAnswerValue(val);
                    }

                    return [index + 1, questionText, type, val];
                });

                var worksheet = applySheetHyperlinks(XLSX.utils.aoa_to_sheet(metadata.concat(rows)));
                var workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, this.$t('responseDetail.reportSheetName'));
                
                worksheet['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 60 }];

                var formTitle = this.getLang(this.response.form && this.response.form.title) || 'Form';
                var filename = (formTitle + "_Response_" + responderName).replace(/\s+/g, '_') + ".xlsx";

                XLSX.writeFile(workbook, filename);
            } catch (err) { 
                alert(this.$t('responseDetail.exportErrorPrefix') + err.message); 
            }
        },
        copyApiUrl() {
            const id = this.response && this.response._id;
            if (!id) return;
            copyText(buildApiUrl('response/exp', { _id: id })).then(() => {
                this.apiCopied = true;
                clearTimeout(this.apiCopyTimer);
                this.apiCopyTimer = setTimeout(() => { this.apiCopied = false; }, 2000);
            });
        },
        fetchResponseDetail() {
            var self = this;
            this.loading = true;
            this.error = null;
            if (!this.$store) return;
            
            this.$store.dispatch('Responses/get', { _id: this.id })
                .then(function(result) {
                    var doc = Array.isArray(result) ? result[0] : result;
                    if (doc && (doc._id || doc.id)) {
                        self.response = doc;
                    } else {
                        self.error = self.$t('responseDetail.notFoundError');
                    }
                })
                .catch(function(err) {
                    self.error = self.$t('responseDetail.loadError');
                    console.error(err);
                })
                .finally(function() {
                    self.loading = false;
                });
        },
        formatDate(dateStr) {
            return dateStr ? moment(dateStr).format('D/M/YYYY, HH:mm') : '-';
        },
        getQuestionTypeLabel(question) {
            if (!question || !question.type) return this.$t('types.free_text');
            
            let rawType = question.type;
            let typeStr = '';

            // If type is an ObjectId (string), look it up in the store
            if (typeof rawType === 'string') {
                const found = (this.questionTypesStore || []).find(t => t._id === rawType || t.id === rawType);
                typeStr = found ? (found.type || found.name || rawType) : rawType;
            } else {
                typeStr = rawType.type || rawType.name || String(rawType);
            }

            const t = typeStr.toString().toLowerCase();
            if (isFreeTextQuestionType(t)) return this.$t('types.free_text');
            if (t.includes('multiple_choice') || t.includes('multiplechoice')) return this.$t('types.multiple_choice');
            if (t.includes('checkbox')) return this.$t('types.checkbox');
            if (t.includes('rating')) return this.$t('types.rating');
            if (t.includes('file')) return this.$t('types.file_upload');
            
            return t.charAt(0).toUpperCase() + t.slice(1);
        },
        isChoiceType(type) {
            const t = (type || '').toLowerCase();
            return t.includes('choice') || t.includes('check') || t.includes('dropdown') || t.includes('select');
        },
        deleteResponse() {
            if (confirm(this.$t('responseDetail.deleteConfirm'))) {
                var self = this;
                this.loading = true;
                this.$store.dispatch('Responses/delete', { _id: this.id })
                    .then(function() {
                        self.$router.back();
                    })
                    .catch(function() {
                        alert(self.$t('responseDetail.deleteError'));
                    })
                    .finally(function() {
                        self.loading = false;
                    });
            }
        }
    }
};
</script>

<style scoped>
.rounded-20 { border-radius: 20px !important; }
.rounded-16 { border-radius: 16px !important; }
.rounded-pill { border-radius: 50rem !important; }
.bg-light { background-color: #f8fafc !important; }
.avatar-circle {
    width: 38px; height: 38px; background: #e0e7ff; color: #4338ca;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1rem;
}
.responder-role-text {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #475569;
    line-height: 1.3;
}
.border-right-md { border-right: 1px solid #e2e8f0; }
@media (max-width: 767.98px) {
    .border-right-md { border-right: none; border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem; padding-bottom: 1rem; }
}
.gap-2 { gap: 0.5rem; }
.response-action-bar { width: 100%; }
@media (min-width: 768px) {
    .response-action-bar { width: auto; }
}
@media (max-width: 575.98px) {
    .response-detail-title { font-size: 1.35rem; }
    .response-action-bar .btn { flex: 1 1 auto; font-size: 0.84rem; }
}
::v-deep .card { transition: all 0.2s ease; }
::v-deep .card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
</style>
