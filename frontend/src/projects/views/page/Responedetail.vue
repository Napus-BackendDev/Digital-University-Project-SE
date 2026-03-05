<template>
    <div class="flex-grow-1">

        <!-- Back Button -->
        <CButton variant="ghost" color="dark" class="mb-4 d-inline-flex align-items-center" @click="$router.back()">
            <CIcon name="cil-arrow-left" class="mr-2" />
            Back to Responses
        </CButton>

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
        <div v-else-if="response" class="response-detail-body pb-5">

            <!-- Wrapper for Section 1 (Header) & Section 2 (Answers) -->
            <div>
                <!-- Section 1: Header Card (Form Info) -->
                <CCard>
                    <CCardBody class="">
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div>
                                <h1 class="h3 font-weight-bold text-dark mb-1">
                                    Response Details
                                </h1>
                                <p class="text-muted mb-0" style="font-size: 0.95rem;">
                                    Submitted on {{ formatDate(response.createdAt) }}
                                </p>
                            </div>

                            <div class="d-flex align-items-center flex-wrap" style="gap: 12px;">
                                <!-- Navigation -->
                                <div class="d-flex align-items-center mr-2">
                                    <CButton color="light" class="nav-btn" :disabled="currentIndex <= 0"
                                        @click="goToResponse(currentIndex - 1)">
                                        <CIcon name="cil-chevron-left" size="sm" />
                                    </CButton>
                                    <span class="text-dark mx-3 font-weight-500" style="font-size: 0.95rem;">
                                        {{ currentIndex + 1 }} of {{ totalResponses }}
                                    </span>
                                    <CButton color="light" class="nav-btn"
                                        :disabled="currentIndex >= totalResponses - 1"
                                        @click="goToResponse(currentIndex + 1)">
                                        <CIcon name="cil-chevron-right" size="sm" />
                                    </CButton>
                                </div>

                                <!-- Vertical Divider -->
                                <div class="border-right"
                                    style="height: 32px; margin: 0 4px; border-color: #e2e8f0 !important;"></div>

                                <!-- Export Dropdown -->
                                <CDropdown class="custom-dropdown ml-2">
                                    <template #toggler>
                                        <CButton color="light"
                                            class="d-flex align-items-center action-btn text-dark font-weight-500">
                                            Export
                                            <CIcon name="cil-chevron-bottom" size="sm" class="ml-2 text-muted" />
                                        </CButton>
                                    </template>
                                    <CDropdownItem @click="exportCsv">
                                        <CIcon name="cil-data-transfer-down" size="sm" class="mr-2" />
                                        Export CSV
                                    </CDropdownItem>
                                    <CDropdownItem @click="copyApiLink">
                                        <CIcon name="cil-copy" size="sm" class="mr-2" />
                                        Copy API Link
                                    </CDropdownItem>
                                </CDropdown>

                                <!-- Delete Button -->
                                <CButton variant="outline" color="danger"
                                    class="d-flex align-items-center action-btn text-danger font-weight-500 ml-1"
                                    @click="deleteResponse">
                                    <CIcon name="cil-trash" size="sm" class="mr-2" />
                                    Delete
                                </CButton>
                            </div>
                        </div>
                    </CCardBody>
                </CCard>

                <CCard class="mb-3 shadow-sm border-0">
                    <CCardHeader>
                        <h5 class="font-weight-bold text-dark">
                            Email address
                        </h5>
                        <h6 class="text-muted">
                            สมชาย@gmail.com
                        </h6>
                    </CCardHeader>
                    <CCardBody class="">
                        <!-- Answers Table matching Design -->
                        <CDataTable :items="response.answers" :fields="answerFields" hover class="mb-0 custom-table">
                            <!-- Index / # Column -->
                            <template #id="{ item, index }">
                                <td class="align-middle text-center" style="width: 50px;">
                                    <div class="index-circle">{{ index + 1 }}</div>
                                </td>
                            </template>

                            <!-- Question Column -->
                            <template #question="{ item }">
                                <td class="align-middle" style="width: 45%;">
                                    <h6 class="font-weight-bold text-dark mb-1" style="font-size: 0.95rem;">
                                        {{ getTitle(item.question && item.question.title) || 'Unknown Question' }}
                                    </h6>
                                    <div class="text-muted small">
                                        {{ getQuestionTypeLabel(item.question) }}
                                    </div>
                                </td>
                            </template>

                            <!-- Response Column -->
                            <template #response="{ item }">
                                <td class="align-middle">
                                    <template v-if="isEmpty(item.response)">
                                        <span class="text-muted font-italic">No response</span>
                                    </template>
                                    <template v-else-if="Array.isArray(item.response)">
                                        <span class="text-dark">{{ item.response.join(', ') }}</span>
                                    </template>
                                    <template v-else-if="isRating(item.question)">
                                        <div class="d-flex align-items-center h6 mb-0">
                                            <strong class="text-warning mr-2" style="font-size: 1.1rem;">{{
                                                item.response }}</strong>
                                            <span class="text-muted small"> / {{ getRatingMax(item.question) }}</span>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <span class="text-dark" style="white-space: pre-wrap;">{{ item.response
                                        }}</span>
                                    </template>
                                </td>
                            </template>

                        </CDataTable>
                    </CCardBody>
                </CCard>

            </div>

            <CCard class="mt-3">
                <CCardHeader>
                    <h5 class="font-weight-bold text-dark">All Responses Overview</h5>
                </CCardHeader>
                <CCardBody>
                    <ResponeTables />
                </CCardBody>
            </CCard>

        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import ResponeTables from '@/projects/components/tables/ResponeTables.vue';

export default {
    name: 'ResponseDetail',
    components: { ResponeTables },
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
            response: null,
            answerFields: [
                { key: 'id', label: '#' },
                { key: 'question', label: 'Question' },
                { key: 'response', label: 'Response' }
            ]
        }
    },
    computed: {
        ...mapGetters('setting', ['lang']),
        responsesList() {
            return this.$store.getters['Responses/responses'] || [];
        },
        totalResponses() {
            return this.responsesList.length;
        },
        currentIndex() {
            return this.responsesList.findIndex(r => r._id === this.id);
        }
    },
    watch: {
        id: {
            handler() {
                this.fetchResponseDetail();
            }
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
                const resArray = this.responsesList;
                if (resArray && resArray.length > 0) {
                    const found = resArray.find(r => r._id === this.id);
                    if (found) {
                        this.response = found;
                        this.loading = false;
                        return;
                    }
                }

                this.error = "Response not found or please navigate from the Responses table.";

            } catch (err) {
                console.error(err);
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
        formatDate(dateStr) {
            if (!dateStr) return '-';
            return moment(dateStr).format('D/M/YYYY, h:mm:ss');
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
        getQuestionTypeLabel(question) {
            if (!question || !question.type) return 'Unknown Type';
            const t = question.type.type ? question.type.type.toLowerCase() : '';
            switch (t) {
                case 'short_answer': case 'short': return 'Short answer';
                case 'paragraph': return 'Paragraph';
                case 'multiple_choice': return 'Multiple choice';
                case 'checkboxes': case 'checkbox': return 'Checkbox';
                case 'dropdown': return 'Dropdown';
                case 'rating': case 'rate': return 'Rating';
                case 'date': return 'Date';
                case 'time': return 'Time';
                case 'file_upload': case 'file': return 'File upload';
                case 'image': return 'Image';
                case 'video': return 'Video';
                default:
                    // Capitalize first letter
                    return t.charAt(0).toUpperCase() + t.slice(1);
            }
        },
        // Placeholder methods for header buttons
        exportCsv() {
            if (!this.response || !this.response.answers) {
                alert("No data available to export.");
                return;
            }

            // Create CSV Headers
            let csvContent = "Question,Response\n";

            // Loop through answers and append to CSV string
            this.response.answers.forEach(item => {
                // Get question text safely
                let questionText = this.getTitle(item.question && item.question.title) || 'Unknown Question';
                // Escape quotes in question text
                questionText = questionText.replace(/"/g, '""');

                // Get response content safely
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
                // Escape quotes and newlines in response text
                responseText = responseText.replace(/"/g, '""');

                // Add row to CSV content, enclosing fields in quotes to handle commas
                csvContent += `"${questionText}","${responseText}"\n`;
            });

            // Create Blob and trigger download
            const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' }); // \ufeff adds BOM for Excel UTF-8 support

            // Format filename with responder info and date
            const dateStr = moment(this.response.form.createdAt).format('YYYYMMDD');
            const responderName = this.response.user && this.response.user.email ? this.response.user.email.split('@')[0] : 'Anonymous';
            const filename = `response_${responderName}_${dateStr}.csv`;

            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            // Append link, click, and clean up
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        copyApiLink() {
            const userId
        },


         copyApiLink() {
            const formId = this.responses && this.responses._id;
            if (!formId) { alert('Form ID not available yet.'); return; }
            const BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081/api/v1';
            const url = `${BASE}/response/download/${formId}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => this.showCopied());
            } else {
                const el = document.createElement('textarea');
                el.value = url;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                this.showCopied();
            }
        },

        goToResponse(index) {
            if (index >= 0 && index < this.totalResponses) {
                const targetId = this.responsesList[index]._id;
                this.$router.push({ name: 'ResponseDetail', params: { id: targetId } });
            }
        },
        deleteResponse() {
            if (confirm("Are you sure you want to delete this response?")) {
                // TODO: Implement delete API call
                console.log("Delete Response clicked for:", this.id);
                alert("Delete response feature is coming soon!");
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

/* Custom Answers Table Styling matching ResponeTables */
::v-deep .custom-table table {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

/* Header Styling */
::v-deep .custom-table thead th {
    background-color: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    text-transform: capitalize !important;
    letter-spacing: normal;
    border: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    vertical-align: middle;
}

::v-deep .custom-table thead th:first-child {
    border-top-left-radius: 8px;
}

::v-deep .custom-table thead th:last-child {
    border-top-right-radius: 8px;
}

/* Body Styling */
::v-deep .custom-table tbody td {
    color: #1e293b !important;
    font-size: 14px;
    font-weight: 500;
    border: none !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 18px 24px !important;
    vertical-align: middle;
    height: 76px;
}

/* Hover Effect */
::v-deep .custom-table tbody tr:hover td {
    background-color: #f8fafc !important;
}

/* Remove bottom border from the very last row */
::v-deep .custom-table tbody tr:last-child td {
    border-bottom: none !important;
}

.index-circle {
    width: 32px;
    height: 32px;
    background-color: #f1f5f9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: #475569;
    margin: 0 auto;
}
</style>
