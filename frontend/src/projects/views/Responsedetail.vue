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
                                        <div class="avatar-circle mr-3" style="background-color: #f1f5f9; color: #475569; min-width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
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
                                {{ (response.answers || []).length }} Submissions
                            </span>
                        </CCardHeader>
                        <CCardBody class="p-0">
                            <AnswerTable :answers="response.answers || []" />
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
    name: 'Response',
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
            // First search in list
            let idx = this.responsesList.findIndex(r => (r._id || r.id) === this.id);
            // If not found in list (e.g. refresh), but match current response, return 0
            if (idx === -1 && this.response && (this.response._id || this.response.id) === this.id) {
                return 0;
            }
            return idx;
        },
        backRoute() {
            if (this.response && this.response.form) {
                const formId = this.response.form._id || (typeof this.response.form === 'string' ? this.response.form : null);
                if (formId) {
                    return { name: 'EditorCreateForm', params: { _id: formId } };
                }
            }
            return null;
        }
    },

    watch: {
        // Watch for ID changes to refresh data when navigating between different responses
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
                // Dispatch 'get' action from store to fetch or retrieve the response
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
            let content = titleArr.find(t => t.key && t.key.toLowerCase() === currentLang.toLowerCase());
            if (!content) content = titleArr.find(t => t.key && t.key.toLowerCase() === 'en');
            if (!content) content = titleArr[0];
            return content ? content.value : '';
        },
        isEmpty(val) {
            if (val === null || val === undefined || val === '') return true;
            if (Array.isArray(val) && val.length === 0) return true;
            return false;
        },
        isRating(question) {
            if (!question || !question.type) return false;
            const t = question.type.type ? question.type.type.toLowerCase() : '';
            return t === 'rating' || t === 'rate';
        },
        getRatingMax(question) {
            if (question && question.config && question.config.maxRate) {
                return Number(question.config.maxRate);
            }
            return 5;
        },
        formatDate(dateStr) {
            if (!dateStr) return '-';
            return moment(dateStr).format('D/M/YYYY, h:mm:ss');
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
            if (!this.response || !this.response.answers) {
                alert("No data available to export.");
                return;
            }

            // Create Rows
            const headers = ["Question", "Response"];
            const rows = this.response.answers.map(item => {
                const questionText = this.getTitle(item.question && item.question.title) || 'Unknown Question';
                
                let responseText = '';
                if (this.isEmpty(item.response)) {
                    responseText = '';
                } else if (Array.isArray(item.response)) {
                    responseText = item.response.join(', ');
                } else if (this.isRating(item.question)) {
                    responseText = `${item.response} / ${this.getRatingMax(item.question)}`;
                } else {
                    responseText = String(item.response);
                }
                
                return [questionText, responseText];
            });

            const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Response Details");

            // Set column widths
            worksheet['!cols'] = [
                { wch: 50 }, // Question
                { wch: 60 }  // Response
            ];

            // Format filename with responder info and date
            const dateStr = moment(this.response.form.createdAt).format('YYYYMMDD');
            const responder = this.response.responder;
            const responderName = responder ? (responder.name || responder.email || 'Anonymous').split('@')[0] : (this.response.responderName || 'Anonymous');
            const filename = `response_${responderName}_${dateStr}.xlsx`;

            XLSX.writeFile(workbook, filename);
        },

        copyApiLink() {
            const responsesID = this.responses && this.responses._id;
            if (!responsesID) { alert('ResponsesID not available yet.'); return; }
            const BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081/api/v1';
            const url = `${BASE}/response/download/${responsesID}`;

        },

        goToResponse(index) {
            if (index >= 0 && index < this.totalResponses) {
                const targetId = this.responsesList[index]._id;
                this.$router.push({ name: 'Response', params: { id: targetId } });
            }
        },

        async deleteResponse() {
            if (confirm("Are you sure you want to delete this response?")) {
                this.loading = true;
                try {
                    await this.$store.dispatch('Responses/delete', { _id: this.id });
                    alert("Response deleted successfully.");
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
.rounded-20 {
    border-radius: 20px !important;
}
.rounded-16 {
    border-radius: 16px !important;
}
.rounded-pill {
    border-radius: 50rem !important;
}

.bg-light {
    background-color: #f8fafc !important;
}

.avatar-circle {
    width: 38px;
    height: 38px;
    background: #e0e7ff;
    color: #4338ca;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(67, 56, 202, 0.1);
}

.border-right-md {
    border-right: 1px solid #e2e8f0;
}

@media (max-width: 767.98px) {
    .border-right-md {
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
    }
}

.gap-2 {
    gap: 0.5rem;
}

h4 {
    letter-spacing: -0.02em;
}

::v-deep .card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

::v-deep .card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
}

.btn-export-custom {
    background-color: #ffffff !important;
    border: none !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.04) !important;
    border-radius: 100px !important;
    padding: 0.5rem 1.4rem !important;
    color: #0f172a !important;
    transition: all 0.2s ease;
    cursor: pointer;
}

.btn-export-custom:hover {
    background-color: #f8fafc !important;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05) !important;
    transform: translateY(-2px);
}

.dropdown-export /deep/ .dropdown-toggle::after {
    display: none !important;
}

.font-weight-medium {
    font-weight: 500;
}
</style>
