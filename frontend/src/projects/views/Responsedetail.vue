<template>
    <div class="pb-5 px-3 pt-4">
        <CProgress v-if="loading" indeterminate color="primary" class="mb-3" style="height: 4px;" />
        
        <CRow v-if="error" class="justify-content-center mt-5">
            <CCol md="6">
                <CCallout color="danger" class="bg-white shadow-sm border-left-4">
                    <h5 class="text-danger font-weight-bold">Error</h5>
                    <p>{{ error }}</p>
                    <CButton color="primary" variant="outline" @click="fetchResponseDetail">Try Again</CButton>
                </CCallout>
            </CCol>
        </CRow>

        <div v-else-if="response">
            <CRow class="justify-content-center">
                <CCol lg="10" xl="9">
                    <!-- Header Section -->
                    <CCard class="mb-4 border-0 shadow-sm rounded-20 overflow-hidden">
                        <CCardBody class="p-4">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div class="d-flex align-items-center">
                                    <ButtonBack :route="backRoute" class="mr-3" />
                                    <div>
                                        <h2 class="m-0 font-weight-bold text-dark" style="letter-spacing: -0.5px;">
                                            Response Detail
                                        </h2>
                                        <p class="text-muted small mb-0">Individual response details and metadata</p>
                                    </div>
                                </div>
                                <div class="d-flex gap-2 align-items-center">
                                    <button class="btn btn-success px-3 d-flex align-items-center shadow-sm" style="height: 40px;" @click="exportXlsx">
                                        <CIcon name="cil-spreadsheet" class="mr-2" /> Export XLSX
                                    </button>
                                    <button class="btn btn-outline-primary px-3 d-flex align-items-center shadow-sm" style="height: 40px;" @click="downloadJson">
                                        <CIcon name="cil-code" class="mr-2" /> JSON
                                    </button>
                                    <button class="btn btn-outline-danger px-3 d-flex align-items-center shadow-sm" style="height: 40px;" @click="deleteResponse">
                                        <CIcon name="cil-trash" class="mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        
                            <CRow class="bg-light p-3 rounded-16 mx-0 border">
                                <CCol md="4" class="py-2 border-right-md d-flex flex-column justify-content-center">
                                    <label class="small text-uppercase font-weight-bold text-muted d-block mb-1">Responder</label>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar-circle mr-3">
                                            {{ getAvatarChar() }}
                                        </div>
                                        <div class="d-flex flex-column overflow-hidden">
                                            <div class="font-weight-bold text-dark text-truncate" style="font-size: 0.95rem; line-height: 1.2;">
                                                {{ getResponderName() }}
                                            </div>
                                            <div class="text-muted small text-truncate" style="font-size: 0.8rem;">
                                                {{ getResponderEmail() }}
                                            </div>
                                        </div>
                                    </div>
                                </CCol>
                                <CCol md="4" class="py-2 border-right-md d-flex flex-column justify-content-center">
                                    <label class="small text-uppercase font-weight-bold text-muted d-block mb-1">Submitted at</label>
                                    <div class="font-weight-bold text-dark">
                                        <CIcon name="cil-calendar" class="mr-1 text-primary" />
                                        {{ formatDate(response.createdAt) }}
                                    </div>
                                </CCol>
                                <CCol md="4" class="py-2 d-flex flex-column justify-content-center">
                                    <label class="small text-uppercase font-weight-bold text-muted d-block mb-1">Status & Progress</label>
                                    <div class="d-flex align-items-center">
                                        <CBadge :color="response.submit ? 'success' : 'warning'" class="px-3 py-2 rounded-pill mr-2 shadow-sm">
                                            {{ response.submit ? 'Completed' : 'Draft' }}
                                        </CBadge>
                                        <span class="text-muted small font-weight-bold">{{ (response.answers || []).length }} Answered</span>
                                    </div>
                                </CCol>
                            </CRow>
                        </CCardBody>
                    </CCard>

                    <!-- Detailed Answers Table (Restored) -->
                    <CCard class="mb-5 border-0 shadow-sm rounded-20 overflow-hidden">
                        <CCardHeader class="bg-white p-4 border-bottom-0 d-flex justify-content-between align-items-center">
                            <h4 class="m-0 font-weight-bold text-dark">Detailed Answers</h4>
                            <span class="badge badge-light p-2 px-3 rounded-pill text-primary font-weight-bold border">
                                {{ (enrichedAnswers || []).length }} Questions
                            </span>
                        </CCardHeader>
                        <CCardBody class="p-0">
                            <AnswerTable :answers="enrichedAnswers" />
                        </CCardBody>
                    </CCard>

                    <!-- Other Responses for this Form -->
                    <div class="mb-5">
                        <div class="mb-4">
                            <h4 class="font-weight-bold text-dark mb-1">Other Submissions</h4>
                            <p class="text-muted">Browse through other responses for this form</p>
                        </div>
                        <ResponseTables :responseList="responsesList" :currentId="id" />
                    </div>
                </CCol>
            </CRow>
        </div>
    </div>
</template>

<script>
import moment from 'moment';
import ResponseTables from '@/projects/components/tables/ResponseTables.vue';
import AnswerTable from '@/projects/components/tables/AnswerTable.vue';
import ButtonBack from '@/projects/components/Button/ButtonBack.vue';

export default {
    name: 'ResponseDetail',
    components: { ResponseTables, AnswerTable, ButtonBack },
    props: {
        id: { type: String, required: true }
    },
    data() {
        return {
            loading: false,
            error: null,
            response: null
        };
    },
    computed: {
        lang() {
            var store = this.$store;
            return (store && store.getters['Setting/lang']) || 'en';
        },
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
        backRoute() {
            if (this.response && this.response.form) {
                var form = this.response.form;
                var formId = form._id || (typeof form === 'string' ? form : (form.id || null));
                if (formId) return { name: 'EditorCreateForm', params: { _id: formId } };
            }
            return null;
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
            if (!this.response) return 'Anonymous';
            var responder = this.response.responder;
            if (responder) return responder.fullname || responder.name || responder.email || 'Anonymous';
            return this.response.responderName || 'Anonymous';
        },
        getResponderEmail() {
            if (!this.response) return '';
            var responder = this.response.responder;
            return (responder && responder.email) ? responder.email : '';
        },
        exportXlsx() {
            console.log("XLSX Export triggered");
            try {
                var XLSX = require('xlsx');
                if (!this.response || !this.enrichedAnswers.length) {
                    alert("No data available to export.");
                    return;
                }
                
                var responderName = this.getResponderName();
                var metadata = [
                    ["Individual Response Report"],
                    ["Responder:", responderName],
                    ["Submission Date:", this.formatDate(this.response.createdAt)],
                    [""],
                    ["#", "Question", "Type", "Response"]
                ];

                var self = this;
                var rows = this.enrichedAnswers.map(function(item, index) {
                    var questionText = self.getTitle(item.question && item.question.title) || 'Question';
                    var type = self.getQuestionTypeLabel(item.question);
                    var val = item.response;
                    if (Array.isArray(val)) val = val.join(', ');
                    return [index + 1, questionText, type, String(val || '')];
                });

                var worksheet = XLSX.utils.aoa_to_sheet(metadata.concat(rows));
                var workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Individual Report");
                
                worksheet['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 60 }];

                XLSX.writeFile(workbook, "Report_" + responderName.replace(/\s+/g, '_') + ".xlsx");
            } catch (err) { 
                alert("XLSX Export Error: " + err.message); 
            }
        },
        downloadJson() {
            try {
                if (!this.response) {
                    alert("No data available.");
                    return;
                }
                var dateStr = moment(this.response.createdAt || new Date()).format('YYYYMMDD');
                var filename = "response_" + dateStr + ".json";
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.response, null, 2));
                var dl = document.createElement('a');
                dl.setAttribute("href", dataStr);
                dl.setAttribute("download", filename);
                document.body.appendChild(dl);
                dl.click();
                dl.remove();
            } catch (err) {
                alert("JSON Error: " + err.message);
            }
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
                        self.error = "Response not found.";
                    }
                })
                .catch(function(err) {
                    self.error = "Failed to load data.";
                    console.error(err);
                })
                .finally(function() {
                    self.loading = false;
                });
        },
        getTitle(titleArr) {
            if (!titleArr || !Array.isArray(titleArr) || titleArr.length === 0) return '';
            var currentLang = (this.lang || 'en').toLowerCase();
            var content = titleArr.find(function(t) { return t.key && t.key.toLowerCase() === currentLang; });
            if (!content) content = titleArr.find(function(t) { return t.key && t.key.toLowerCase() === 'en'; });
            if (!content) content = titleArr[0];
            return content ? String(content.value || '') : '';
        },
        formatDate(dateStr) {
            return dateStr ? moment(dateStr).format('D/M/YYYY, HH:mm') : '-';
        },
        getQuestionTypeLabel(question) {
            if (!question || !question.type) return 'Text';
            var t = String(question.type.type || question.type || '').toLowerCase();
            switch (t) {
                case 'short_answer': return 'Short Text';
                case 'paragraph': return 'Long Paragraph';
                case 'multiple_choice': return 'Multiple Choice';
                case 'checkboxes': return 'Checkboxes';
                case 'dropdown': return 'Dropdown';
                case 'rating': return 'Rating';
                default: return t.charAt(0).toUpperCase() + t.slice(1);
            }
        },
        deleteResponse() {
            if (confirm("Are you sure you want to delete this response?")) {
                var self = this;
                this.loading = true;
                this.$store.dispatch('Responses/delete', { _id: this.id })
                    .then(function() {
                        self.$router.back();
                    })
                    .catch(function() {
                        alert("Delete failed.");
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
.border-right-md { border-right: 1px solid #e2e8f0; }
@media (max-width: 767.98px) {
    .border-right-md { border-right: none; border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem; padding-bottom: 1rem; }
}
.gap-2 { gap: 0.5rem; }
::v-deep .card { transition: all 0.2s ease; }
::v-deep .card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
</style>
