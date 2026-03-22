<template>
    <div class="response-table-wrapper">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-5 text-muted bg-white rounded-20 shadow-sm">
            <div class="spinner-grow text-primary mr-2" role="status" style="width: 1.5rem; height: 1.5rem;" />
            <div class="mt-2 font-weight-bold">Fetching latest responses...</div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-5 text-danger bg-white rounded-20 shadow-sm">
            <CIcon name="cil-warning" size="xl" class="mb-3" />
            <div class="font-weight-bold">{{ error }}</div>
        </div>

        <!-- Empty -->
        <div v-else-if="tableItems.length === 0 || tableItems.every(i => i.isEmpty)"
            class="empty-state-container py-5 text-muted bg-white rounded-20 shadow-sm border-dashed">
            <div class="empty-illustration mb-3">
                <CIcon name="cil-find-in-page" size="xl" class="opacity-20" />
            </div>
            <h5 class="font-weight-bold text-dark">No responses found</h5>
            <p class="small">There is no data to display for this form yet.</p>
        </div>

        <!-- Table -->
        <template v-else>
            <div class="premium-table-container shadow-sm bg-white">
                <CDataTable :items="pagedItems" :fields="fields" class="mb-0 custom-premium-table">
                    <!-- # column -->
                    <template #id="{ item }">
                        <td class="align-middle pl-4 shadow-none border-0">
                            <div v-if="!item.isEmpty" class="index-badge-modern">{{ item.id }}</div>
                        </td>
                    </template>

                    <!-- Responder column -->
                    <template #responder="{ item }">
                        <td class="align-middle border-0">
                            <div v-if="!item.isEmpty" class="responder-info">
                                <span class="responder-name text-truncate d-block" style="max-width: 250px;">{{ item.responder }}</span>
                                <span class="responder-meta d-block text-truncate" v-if="item.responderEmail" style="max-width: 250px;">{{ item.responderEmail }}</span>
                            </div>
                        </td>
                    </template>

                    <!-- Submitted column -->
                    <template #submitted="{ item }">
                        <td class="align-middle border-0">
                            <div v-if="!item.isEmpty" class="date-display">
                                <div class="date-main">{{ formatDateMain(item.raw.createdAt) }}</div>
                                <div class="time-sub">{{ formatTimeSub(item.raw.createdAt) }}</div>
                            </div>
                        </td>
                    </template>

                    <!-- Answers column -->
                    <template #answers="{ item }">
                        <td class="align-middle text-center border-0">
                            <div v-if="!item.isEmpty" class="answer-count-pill">
                                <span class="count-num">{{ item.answers }}</span>
                                <span class="count-label">Answers</span>
                            </div>
                        </td>
                    </template>

                    <!-- Actions column -->
                    <template #actions="{ item }">
                        <td class="align-middle text-right pr-4 border-0">
                            <div v-if="!item.isEmpty">
                                <!-- Viewing Status -->
                                <div v-if="item.isActive" class="btn-action-viewing">
                                    <CIcon name="cil-check-alt" size="sm" class="mr-1" />
                                    Viewing
                                </div>
                                <!-- View Details Action -->
                                <button v-else @click="viewResponse(item)" class="btn-action-view">
                                    <CIcon name="cil-chevron-right" size="sm" class="mr-1" />
                                    Details
                                </button>
                            </div>
                        </td>
                    </template>
                </CDataTable>
            </div>

            <!-- Pagination Modern -->
            <div class="d-flex justify-content-between align-items-center mt-4 px-2">
                <div class="text-muted small font-weight-bold">
                    Showing {{ ((activePage - 1) * perPage) + 1 }} - {{ Math.min(activePage * perPage, tableItems.length) }} of {{ tableItems.length }}
                </div>
                <Pagination :activePage.sync="activePage" :pages="totalPages" />
            </div>
        </template>
    </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'

export default {
    name: 'ResponseTables',
    components: { Pagination },
    props: {
        responseList: {
            type: Array,
            default: null
        },
        currentId: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            loading: false,
            error: null,
            activePage: 1,
            perPage: 5 // Updated to 5 items per page as requested
        }
    },

    computed: {
        ...mapGetters({
            responses: 'Responses/responses'
        }),

        fields() {
            return [
                { key: 'id', label: '#', _style: 'width:80px;', sorter: false },
                { key: 'responder', label: 'RESPONDER', _style: 'min-width:180px;' },
                { key: 'submitted', label: 'SUBMITTED DATE', _style: 'min-width:180px;' },
                { key: 'answers', label: 'COMPLETION', _classes: 'text-center', sorter: false },
                { key: 'actions', label: '', _classes: 'text-right', sorter: false, filter: false }
            ]
        },

        tableItems() {
            const source = this.responseList !== null
                ? this.responseList
                : (this.responses || []).filter(r => r && ((r.submit === true || r.submit === 'true') || (Array.isArray(r.answers) && r.answers.length > 0)));

            return source.map((r, idx) => {
                let responder = '-';
                let responderEmail = null;

                const tryFields = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;
                    return obj.name || obj.fullname || obj.username || (obj._id ? obj._id.toString() : null);
                };

                if (r) {
                    if (r.responder && typeof r.responder === 'object') {
                        responder = tryFields(r.responder) || '-';
                        responderEmail = r.responder.email || null;
                    } else if (r.responder && typeof r.responder === 'string' && r.responder.trim()) {
                        responder = r.responder;
                    } else if (r.responderName) {
                        responder = r.responderName;
                        responderEmail = r.email || null;
                    }
                }

                return {
                    id: idx + 1,
                    _id: r._id,
                    isActive: r._id === this.currentId,
                    responder: responder || '-',
                    responderEmail: responderEmail,
                    submitted: r.createdAt ? moment(r.createdAt).format('DD/MM/YYYY, HH:mm') : '-',
                    answers: Array.isArray(r.answers) ? r.answers.length : 0,
                    raw: r,
                    isEmpty: false
                };
            })
        },

        totalPages() {
            return Math.max(1, Math.ceil(this.tableItems.length / this.perPage))
        },

        pagedItems() {
            const start = (this.activePage - 1) * this.perPage
            return this.tableItems.slice(start, start + this.perPage)
        }
    },

    methods: {
        ...mapActions({
            fetchResponses: 'Responses/get'
        }),

        formatDateMain(date) {
            return date ? moment(date).format('MMM DD, YYYY') : '-';
        },

        formatTimeSub(date) {
            return date ? moment(date).format('HH:mm') : '';
        },

        viewResponse(item) {
            this.$router.push({ name: 'Response', params: { id: item._id } })
        }
    }
}
</script>

<style scoped>
.response-table-wrapper {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

.index-badge-modern {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #eff6ff; /* Soft Blue */
    color: #3b82f6; /* Modern Blue */
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

/* Responder Styling */
.responder-info {
    display: flex;
    flex-direction: column;
}

.responder-name {
    color: #0f172a;
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 2px;
}

.responder-meta {
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 500;
}

/* Date Display */
.date-display {
    line-height: 1.3;
}

.date-main {
    color: #334155;
    font-weight: 600;
    font-size: 0.9rem;
}

.time-sub {
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 500;
}

/* Answer Count Pill */
.answer-count-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: #eff6ff; /* Soft Blue */
    border-radius: 50rem;
    gap: 6px;
}

.count-num {
    color: #2563eb; /* Strong Blue */
    font-weight: 800;
    font-size: 0.9rem;
}

.count-label {
    color: #64748b;
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
}

/* Action Button Blue */
.btn-action-view {
    display: inline-flex;
    align-items: center;
    padding: 8px 18px;
    background-color: #2563eb; /* Premium Blue */
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-action-view:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
    cursor: pointer;
}

.btn-action-viewing {
    display: inline-flex;
    align-items: center;
    padding: 8px 18px;
    background-color: #f0fdf4; /* Soft Green */
    color: #166534; /* Strong Green */
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 700;
}

/* Premium Table Core */
.premium-table-container {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #f1f5f9;
}

::v-deep .custom-premium-table table {
    margin-bottom: 0;
}

::v-deep .custom-premium-table thead th {
    background-color: #f8fafc !important;
    color: #64748b !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em;
    border: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    vertical-align: middle;
}

::v-deep .custom-premium-table tbody td {
    padding: 20px 24px !important;
    border: none !important;
    border-bottom: 1px solid #f8fafc !important;
    background: white;
    transition: background 0.2s ease;
}

::v-deep .custom-premium-table tbody tr:hover td {
    background-color: #fcfdfe !important;
}

::v-deep .custom-premium-table tbody tr:last-child td {
    border-bottom: none !important;
}

/* Empty State Illustration */
.empty-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px dashed #e2e8f0;
}

.opacity-20 {
    opacity: 0.2;
}
</style>
