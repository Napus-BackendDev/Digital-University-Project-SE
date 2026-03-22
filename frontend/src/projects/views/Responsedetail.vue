<template>
    <div class="flex-grow-1">

        <!-- Back Button -->
        <ButtonBack />

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
        <div v-else-if="response" class="response-detail-body pb-5 px-3">

            <!-- Shared Standard Header -->
            <Header 
                title="Response Details" 
                :description="'Submitted on ' + formatDate(response.createdAt)"
            >
                <template #actions>
                    <div class="d-flex align-items-center" style="gap: 12px;">
                        <!-- Minimal Navigation -->
                        <div class="nav-minimal bg-light px-2 py-1 rounded-pill d-flex align-items-center mr-2 shadow-sm border">
                            <button class="btn-nav-small" :disabled="currentIndex <= 0" @click="goToResponse(currentIndex - 1)">
                                <CIcon name="cil-chevron-left" size="sm" />
                            </button>
                            <span class="mx-2 font-weight-bold text-dark" style="font-size: 0.85rem;">{{ currentIndex + 1 }} / {{ totalResponses }}</span>
                            <button class="btn-nav-small" :disabled="currentIndex >= totalResponses - 1" @click="goToResponse(currentIndex + 1)">
                                <CIcon name="cil-chevron-right" size="sm" />
                            </button>
                        </div>

                        <!-- Export Dropdown -->
                        <CDropdown class="custom-dropdown">
                            <template #toggler>
                                <CButton color="primary" class="d-flex align-items-center action-btn-header transition-all shadow-sm">
                                    <CIcon name="cil-cloud-download" size="sm" class="mr-2" />
                                    Export
                                    <CIcon name="cil-chevron-bottom" size="sm" class="ml-2 opacity-50" />
                                </CButton>
                            </template>
                            <CDropdownItem @click="exportXlsx" class="dropdown-item-modern">
                                <CIcon name="cil-spreadsheet" size="sm" class="mr-2 text-success" />
                                Export Excel
                            </CDropdownItem>
                            <CDropdownItem @click="copyApiLink" class="dropdown-item-modern">
                                <CIcon name="cil-link" size="sm" class="mr-2 text-primary" />
                                Copy API Link
                            </CDropdownItem>
                        </CDropdown>

                        <!-- Delete Button -->
                        <CButton color="danger" variant="outline" class="d-flex align-items-center action-btn-danger-header transition-all shadow-sm" @click="deleteResponse">
                            <CIcon name="cil-trash" size="sm" class="mr-2" />
                            Delete
                        </CButton>
                    </div>
                </template>
            </Header>

            <!-- Content Area -->
            <div class="detail-cards-wrapper">
                <CCard class="mb-4 shadow-sm border-0 rounded-24 overflow-hidden">
                    <div class="card-header-gradient p-4 text-white">
                        <div class="d-flex align-items-center">
                            <div class="user-avatar-circle mr-3">
                                <CIcon name="cil-user" size="lg" />
                            </div>
                            <div>
                                <h5 class="mb-1 font-weight-bold">Respondent Identification</h5>
                                <p class="mb-0 opacity-80 small">Details for user submission</p>
                            </div>
                        </div>
                    </div>
                    <CCardBody class="p-0">
                        <AnswerTable :answers="response.answers" />
                    </CCardBody>
                </CCard>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import * as XLSX from 'xlsx';
import api from '@/service/api';
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
            return this.$store.getters['Responses/responses'] || [];
        },
        totalResponses() {
            return this.responsesList.length;
        },
        currentIndex() {
            if (!this.responsesList || !this.id) return -1;
            return this.responsesList.findIndex(r => (r._id || r.id) === this.id);
        }
    },

    created() {
        this.fetchResponseDetail();
    },
    methods: {
        async fetchResponseDetail() {
            this.loading = true;
            this.error = null;
            try {
                // 1. First attempt: Find in the Vuex store for speed
                const resArray = this.responsesList;
                if (resArray && Array.isArray(resArray) && resArray.length > 0) {
                    const found = resArray.find(r => (r._id || r.id) === this.id);
                    if (found) {
                        this.response = found;
                        this.loading = false;
                        return;
                    }
                }

                // 2. Second attempt: Fallback to direct API if not in store (e.g., page refresh)
                console.log('[Responsedetail] Not found in store, fetching via API...');
                const res = await api.response('get', { _id: this.id });
                if (res && res.data) {
                    this.response = res.data;
                } else {
                    this.error = "Response not found or has been removed.";
                }

            } catch (err) {
                console.error('[Responsedetail] Error loading response:', err);
                this.error = "Failed to load response details. Please try again later.";
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
            const responderName = this.response.user && this.response.user.email ? this.response.user.email.split('@')[0] : 'Anonymous';
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
.border-top-3 {
    border-top-width: 4px !important;
}

.answer-box {
    border: 1px solid #f1f5f9;
    font-size: 0.95rem;
    color: #334155;
}

/* Header Action Buttons */
.nav-btn {
    background-color: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    color: #64748b !important;
    padding: 6px 10px !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
    transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
}

.nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-btn {
    background-color: #fff !important;
    border: 1px solid #e2e8f0 !important;
    padding: 6px 16px !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
    transition: all 0.2s;
}

.action-btn:hover {
    background-color: #f8fafc !important;
    border-color: #cbd5e1 !important;
}

.action-btn.text-danger:hover {
    background-color: #fff1f2 !important;
    color: #e11d48 !important;
    border-color: #fecdd3 !important;
}

.font-weight-500 {
    font-weight: 500;
}

::v-deep .custom-dropdown .dropdown-toggle {
    background-color: #fff !important;
    border: 1px solid #e2e8f0 !important;
    color: #0f172a !important;
    font-weight: 500;
    padding: 6px 16px !important;
    border-radius: 8px !important;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
}

::v-deep .custom-dropdown .dropdown-toggle::after {
    display: none;
}

::v-deep .custom-dropdown .dropdown-toggle:hover {
    background-color: #f8fafc !important;
    border-color: #cbd5e1 !important;
}
</style>
