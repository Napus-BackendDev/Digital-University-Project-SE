<template>
    <div class="flex-grow-1">

        <!-- Back Button -->
        <ButtonBack :to="backRoute" />

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5 text-muted">
            <CSpinner color="secondary" />
            <p class="mt-3">Loading response details...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-5 text-danger">
            <CIcon name="cil-warning" size="xl" class="mb-3" />
            <p>{{ error }}</p>
        </div>

        <!-- Content -->
        <div v-else-if="response" class="pb-5 px-3 pt-4">
            <!-- Header Section -->
            <Header 
                :title="getTitle(response.form && response.form.title) || 'Response Details'" 
                :description="getTitle(response.form && response.form.description)" 
            />

            <CRow class="mt-5">
                <CCol lg="12">
                    <!-- Response Information Card -->
                    <CCard class="mb-5 border-0 shadow-sm rounded-20">
                        <CCardBody class="p-4">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h4 class="m-0 font-weight-bold text-dark">Submission Overview</h4>
                                    <p class="text-muted small mb-0">General metadata about this form submission</p>
                                </div>
                                <div class="d-flex gap-2 align-items-center">
                                    <CDropdown
                                        class="mr-2 dropdown-export"
                                        add-toggler-classes="btn-export-custom d-flex align-items-center"
                                        :caret="false"
                                    >
                                        <template #toggler-content>
                                            <CIcon name="cil-data-transfer-down" class="text-dark mr-2" style="width: 1.1rem; height: 1.1rem;" />
                                            <span class="font-weight-medium mx-1" style="color: #0f172a; font-size: 1rem; letter-spacing: 0.3px;">Export</span>
                                            <CIcon name="cil-chevron-bottom" class="text-dark ml-2" style="width: 0.9rem; height: 0.9rem; stroke-width: 2px;" />
                                        </template>
                                        <CDropdownItem @click="exportXlsx">
                                            <CIcon name="cil-spreadsheet" class="mr-2 text-success" /> Export XLSX
                                        </CDropdownItem>
                                        <CDropdownItem @click="downloadJson">
                                            <CIcon name="cil-code" class="mr-2 text-primary" /> Download JSON
                                        </CDropdownItem>
                                    </CDropdown>
                                    <CButton color="danger" variant="outline" size="sm" class="px-3" style="height: 40px; border-width: 1.5px" @click="deleteResponse">
                                        <CIcon name="cil-trash" class="mr-1" /> Delete
                                    </CButton>
                                </div>
                            </div>
                            
                            <CRow class="bg-light p-3 rounded-16 mx-0">
                                <CCol md="4" class="py-2 border-right-md d-flex flex-column justify-content-center">
                                    <label class="small text-uppercase font-weight-bold text-muted d-block mb-1">Responder</label>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar-circle mr-3">
                                            {{ (response.responder ? (response.responder.name || response.responder.email || 'A') : (response.responderName || 'A')).charAt(0).toUpperCase() }}
                                        </div>
                                        <div class="d-flex flex-column overflow-hidden">
                                            <div class="font-weight-bold text-dark text-truncate" style="font-size: 0.95rem; line-height: 1.2;">
                                                {{ response.responder ? (response.responder.name || response.responder.email.split('@')[0]) : (response.responderName || 'Anonymous') }}
                                            </div>
                                            <div class="text-muted small text-truncate" style="font-size: 0.8rem;">
                                                {{ response.responder ? response.responder.email : '' }}
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
                                        <span class="text-muted small font-weight-bold">{{ (response.answers || []).length }} Questions Answered</span>
                                    </div>
                                </CCol>
                            </CRow>
                        </CCardBody>
                    </CCard>

                    <!-- Detailed Answers Table -->
                    <CCard class="mb-5 border-0 shadow-sm rounded-20 overflow-hidden">
                        <CCardHeader class="bg-white p-4 border-bottom-0 d-flex justify-content-between align-items-center">
                            <h4 class="m-0 font-weight-bold text-dark">Detailed Answers</h4>
                            <span class="badge badge-light p-2 px-3 rounded-pill text-primary font-weight-bold">
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
                            <p class="text-muted">Browse through other responses for "{{ getTitle(response.form && response.form.title) }}"</p>
                        </div>
                        <ResponseTables :responseList="responsesList" :currentId="id" />
                    </div>
                </CCol>
            </CRow>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import * as XLSX from 'xlsx';
import ResponseTables from '@/projects/components/tables/ResponseTables.vue';
import AnswerTable from '@/projects/components/tables/AnswerTable.vue';
import ButtonBack from '@/projects/components/Button/ButtonBack.vue';
import Header from '@/projects/components/Util/Header.vue';

export default {
    name: 'ResponseDetail',
    components: { ResponseTables, AnswerTable, ButtonBack, Header },
    props: {
        id: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            loading: false,
            error: null,
            response: null
        }
    },
    computed: {
        ...mapGetters('Setting', ['lang']),
        enrichedAnswers() {
            if (!this.response || !Array.isArray(this.response.answers)) return [];
            
            // Create a map of Question IDs -> Question Objects from the form structure
            const questionMap = {};
            if (this.response.form && Array.isArray(this.response.form.questions)) {
                this.response.form.questions.forEach(q => {
                    const qid = q._id || q.id;
                    if (qid) questionMap[String(qid)] = q;
                });
            }

            // Map through answers and enrich them with full question metadata
            return this.response.answers.map(ans => {
                let q = ans.question;
                const qId = q && (q._id || q.id || (typeof q === 'string' ? q : null));
                
                if (qId && questionMap[String(qId)]) {
                    return {
                        ...ans,
                        question: questionMap[String(qId)]
                    };
                }
                return ans;
            });
        },
        responsesList() {
            return (this.response && this.response.form && Array.isArray(this.response.form.responses)) 
                ? this.response.form.responses 
                : [];
        },
        totalResponses() {
            return this.responsesList.length;
        },
        currentIndex() {
            if (!this.id) return -1;
            let idx = this.responsesList.findIndex(r => (r._id || r.id) === this.id);
            if (idx === -1 && this.response && (this.response._id || this.response.id) === this.id) return 0;
            return idx;
        },
        backRoute() {
            if (this.response && this.response.form) {
                const formId = this.response.form._id || (typeof this.response.form === 'string' ? this.response.form : (this.response.form.id || null));
                if (formId) return { name: 'EditorCreateForm', params: { _id: formId } };
            }
            return null;
        }
    },
    watch: {
        id: {
            handler: 'fetchResponseDetail',
            immediate: false
        }
    },
    created() {
        this.fetchResponseDetail();
    },
    methods: {
        async fetchResponseDetail() {
            this.loading = true;
            this.error = null;
            this.response = null;
            try {
                const result = await this.$store.dispatch('Responses/get', { _id: this.id });
                const doc = Array.isArray(result) ? result[0] : result;
                if (doc && typeof doc === 'object' && doc._id) {
                    this.response = doc;
                } else {
                    this.error = "Response not found.";
                }
            } catch (err) {
                console.error('[Responsedetail] Error fetching from store:', err);
                this.error = "Failed to load response details.";
            } finally {
                this.loading = false;
            }
        },
        getTitle(titleArr) {
            if (!titleArr || !Array.isArray(titleArr) || titleArr.length === 0) return '';
            const currentLang = this.lang || 'en';
            let content = titleArr.find(t => t.key && t.key.toLowerCase() === currentLang.toLowerCase()) || titleArr.find(t => t.key && t.key.toLowerCase() === 'en') || titleArr[0];
            return content ? content.value : '';
        },
        isEmpty(val) {
            return val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
        },
        isRating(question) {
            if (!question || !question.type) return false;
            const t = (question.type.type || question.type || '').toString().toLowerCase();
            return t === 'rating' || t === 'rate';
        },
        getRatingMax(question) {
            return (question && question.config && question.config.maxRate) ? Number(question.config.maxRate) : 5;
        },
        formatDate(dateStr) {
            return dateStr ? moment(dateStr).format('D/M/YYYY, h:mm:ss') : '-';
        },
        downloadJson() {
            if (!this.response || !this.response.answers) {
                alert("No data available to export.");
                return;
            }
            const dateStr = moment(this.response.form?.createdAt || new Date()).format('YYYYMMDD');
            const responder = this.response.responder;
            const responderName = responder ? (responder.name || responder.email || 'Anonymous').split('@')[0] : (this.response.responderName || 'Anonymous');
            const filename = `response_${responderName}_${dateStr}.json`;
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.response, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", filename);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },

        // ── Export XLSX ───────────────────────────────────────────────────
        exportXlsx() {
            if (!this.response || !this.enrichedAnswers.length) { alert("No data available to export."); return; }
            const headers = ["Question", "Response"];
            const rows = this.enrichedAnswers.map(item => {
                const questionText = this.getTitle(item.question && item.question.title) || 'Unknown Question';
                let responseText = '';
                const raw = item.response;

                if (this.isEmpty(raw)) {
                    responseText = '';
                } else if (this.isRating(item.question)) {
                    responseText = `${raw} / ${this.getRatingMax(item.question)}`;
                } else {
                    const type = (item.question?.type?.type || item.question?.type || '').toString().toLowerCase();
                    const isChoice = ['multiple_choice', 'dropdown', 'checkboxes', 'checkbox', 'select'].includes(type);
                    
                    if (isChoice && item.question?.config?.choices) {
                        const options = item.question.config.choices;
                        const values = Array.isArray(raw) ? raw : [raw];
                        const labels = values.map(v => {
                            const opt = options.find(o => String(o.key) === String(v) || String(o._id) === String(v));
                            if (opt) return (opt.lang ? this.getTitle(opt.lang) : (opt.label ? this.getTitle(opt.label) : (opt.value || v)));
                            return v;
                        });
                        responseText = labels.join(', ');
                    } else {
                        responseText = Array.isArray(raw) ? raw.join(', ') : String(raw);
                    }
                }
                return [questionText, responseText];
            });

            const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Response Details");
            worksheet['!cols'] = [{ wch: 50 }, { wch: 60 }];

            const dateStr = moment(this.response.form.createdAt).format('YYYYMMDD');
            const responder = this.response.responder;
            const responderName = responder ? (responder.name || responder.email || 'Anonymous').split('@')[0] : (this.response.responderName || 'Anonymous');
            const filename = `response_${responderName}_${dateStr}.xlsx`;
            XLSX.writeFile(workbook, filename);
        },
        async deleteResponse() {
            if (confirm("Are you sure you want to delete this response?")) {
                this.loading = true;
                try {
                    await this.$store.dispatch('Responses/delete', { _id: this.id });
                    alert("Response deleted successfully.");
                    if (this.backRoute) this.$router.push(this.backRoute); else this.$router.push('/forms');
                } catch (err) {
                    console.error("Error deleting response:", err);
                    alert("An error occurred while deleting the response.");
                } finally {
                    this.loading = false;
                }
            }
        }
    }
}
</script>

<style scoped>
.rounded-20 { border-radius: 20px !important; }
.rounded-16 { border-radius: 16px !important; }
.rounded-pill { border-radius: 50rem !important; }
.bg-light { background-color: #f8fafc !important; }
.avatar-circle {
    width: 38px; height: 38px; background: #e0e7ff; color: #4338ca;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1rem; box-shadow: 0 2px 4px rgba(67, 56, 202, 0.1);
}
.border-right-md { border-right: 1px solid #e2e8f0; }
@media (max-width: 767.98px) {
    .border-right-md { border-right: none; border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem; padding-bottom: 1rem; }
}
.gap-2 { gap: 0.5rem; }
h4 { letter-spacing: -0.02em; }
::v-deep .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
::v-deep .card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important; }
.btn-export-custom {
    background-color: #ffffff !important; border: none !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.04) !important;
    border-radius: 100px !important; padding: 0.5rem 1.4rem !important;
    color: #0f172a !important; transition: all 0.2s ease; cursor: pointer;
}
.btn-export-custom:hover {
    background-color: #f8fafc !important; transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05) !important;
}
.dropdown-export /deep/ .dropdown-toggle::after { display: none !important; }
.font-weight-medium { font-weight: 500; }
</style>
