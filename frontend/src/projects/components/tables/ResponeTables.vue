<template>
    <div>
        <!-- Loading -->
        <div v-if="loading" class="text-center py-5 text-muted">
            <div class="spinner-border spinner-border-sm text-secondary mr-2" role="status" />
            Loading responses...
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-4 text-danger small">{{ error }}</div>

        <!-- Empty -->
        <div v-else-if="tableItems.length === 0 || tableItems.every(i => i.isEmpty)"
            class="text-center py-5 text-muted">
            <p>No responses yet for this form.</p>
        </div>

        <!-- Table -->
        <template v-else>
            <CDataTable :items="pagedItems" :fields="fields" class="mb-0 custom-table">
                <!-- # column -->
                <template #id="{ item }">
                    <td class="align-middle pl-4">
                        <div v-if="!item.isEmpty" class="index-circle pink-circle">{{ item.id }}</div>
                    </td>
                </template>

                <!-- Responder column -->
                <template #responder="{ item }">
                    <td class="align-middle font-weight-bold" style="font-size:0.82rem;">
                        {{ item.isEmpty ? '' : item.responder }}
                    </td>
                </template>

                <!-- Submitted column -->
                <template #submitted="{ item }">
                    <td class="align-middle" style="color:#64748b;">
                        {{ item.isEmpty ? '' : item.submitted }}
                    </td>
                </template>

                <!-- Answers column -->
                <template #answers="{ item }">
                    <td class="align-middle text-center">
                        <span v-if="!item.isEmpty"
                            class="badge badge-light px-3 py-2 rounded-pill font-weight-normal text-dark"
                            style="background-color:#f1f5f9; font-size:0.85rem;">
                            {{ item.answers }} answers
                        </span>
                    </td>
                </template>

                <!-- Actions column -->
                <template #actions="{ item }">
                    <td class="align-middle text-right pr-4">
                        <CButton v-if="!item.isEmpty" color="link"
                            class="text-dark d-flex align-items-center justify-content-end w-100 px-0 text-decoration-none font-weight-bold"
                            @click="viewResponse(item)">
                            <CIcon name="cil-eye" size="sm" class="mr-2" />
                            View
                        </CButton>
                    </td>
                </template>
            </CDataTable>

            <!-- Pagination -->
            <Pagination :activePage.sync="activePage" :pages="totalPages" />
        </template>

    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'

export default {
    name: 'ResponeTables',
    components: { Pagination },
    props: {
        responseList: {
            type: Array,
            default: null
        }
    },
    data() {
        return {
            loading: false,
            error: null,
            activePage: 1,
            perPage: 5
        }
    },

    computed: {
        ...mapGetters({
            responses: 'Responses/responses'
        }),

        fields() {
            return [
                { key: 'id', label: '#', _style: 'width:70px;', sorter: false },
                { key: 'responder', label: 'Responder', _style: 'min-width:160px;' },
                { key: 'submitted', label: 'Submitted', _style: 'min-width:180px;' },
                { key: 'answers', label: 'Answers', _classes: 'text-center', sorter: false },
                { key: 'actions', label: 'Actions', _classes: 'text-right', sorter: false, filter: false }
            ]
        },

        tableItems() {
            // Use prop if provided, otherwise fallback to store responses (and filter them)
            const source = this.responseList !== null
                ? this.responseList
                : (this.responses || []).filter(r => r && (r.submit === true || r.submit === 'true'));

            return source.map((r, idx) => ({
                id: idx + 1,
                _id: r._id,
                responder: r.responder || '-',
                submitted: r.createdAt ? moment(r.createdAt).format('DD/MM/YYYY, HH:mm') : '-',
                answers: Array.isArray(r.answers) ? r.answers.length : 0,
                raw: r,
                isEmpty: false
            }))
        },

        // Total pages for CPagination
        totalPages() {
            return Math.max(1, Math.ceil(this.tableItems.length / this.perPage))
        },

        // Slice of items for current page
        pagedItems() {
            const start = (this.activePage - 1) * this.perPage
            return this.tableItems.slice(start, start + this.perPage)
        }
    },

    methods: {
        ...mapActions({
            fetchResponses: 'Responses/get'
        }),

        // ── View a single response ────────────────────────────────────────
        viewResponse(item) {
            this.$router.push({ name: 'Response', params: { id: item._id } })
        },

        // ── Title helper for multilingual title array ─────────────────────
        getAnswerTitle(ans) {
            const title = ans.question && ans.question.title
            if (!title || !Array.isArray(title) || !title.length) return 'Unknown question'
            const lang = (navigator.language || 'en').substring(0, 2).toUpperCase()
            return (title.find(t => t.key && t.key.toUpperCase() === lang) || title[0]).value || ''
        },

        // ── Format response value for display ────────────────────────────
        formatResponse(val) {
            if (val === null || val === undefined || val === '') return '—'
            if (Array.isArray(val)) return val.join(', ')
            return String(val)
        }
    }
}
</script>

<style scoped>
.index-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: 600;
    background-color: #f1f5f9;
    color: #334155;
}

.pink-circle {
    background-color: #ffe4e6;
    color: #be123c;
}

/* Base text styling */
.text-dark {
    color: #0f172a !important;
}

.text-muted {
    color: #64748b !important;
}

/* Custom Table Styling matching EditorTables */
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
    /* Remove all borders */
    border-bottom: 1px solid #e2e8f0 !important;
    /* Add only bottom border */
    padding: 16px 24px !important;
    vertical-align: middle;
}

/* Remove border from the first header cell (leftmost) */
::v-deep .custom-table thead th:first-child {
    border-top-left-radius: 8px;
    /* Optional: adds rounded corner */
}

/* Remove border from the last header cell (rightmost) */
::v-deep .custom-table thead th:last-child {
    border-top-right-radius: 8px;
    /* Optional: adds rounded corner */
}

/* Body Styling */
::v-deep .custom-table tbody td {
    color: #1e293b !important;
    font-size: 14px;
    font-weight: 500;
    border: none !important;
    /* Remove all borders */
    border-bottom: 1px solid #f1f5f9 !important;
    /* Add only bottom border */
    padding: 18px 24px !important;
    vertical-align: middle;
    height: 76px;
}

/* Hover Effect */
::v-deep .custom-table tbody tr:hover td {
    background-color: #f8fafc !important;
    cursor: pointer;
}

/* Remove bottom border from the very last row */
::v-deep .custom-table tbody tr:last-child td {
    border-bottom: none !important;
}
</style>
