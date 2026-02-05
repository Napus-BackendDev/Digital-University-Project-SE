<template>
    <div class="user-tables-container">
        <div class="table-responsive">
            <table class="table table-hover custom-table align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th scope="col" class="pl-4" width="40%">Form Name</th>
                        <th scope="col" width="15%">Status</th>
                        <th scope="col" width="15%">Responses</th>
                        <th scope="col" width="20%">Last Modified</th>
                        <th scope="col" width="10%" class="text-right pr-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in paginatedData" :key="index">
                        <td class="pl-4 py-3">
                            <div class="font-weight-bold text-dark text-lg">{{ item.title }}</div>
                            <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                        </td>
                        <td class="py-3">
                            <span class="status-badge" :class="getStatusClass(item.status)">
                                <span class="status-dot"></span>
                                {{ item.status }}
                            </span>
                        </td>
                        <td class="py-3">
                            <div class="d-flex align-items-center">
                                <div class="icon-wrapper mr-2 chart-color">
                                    <CIcon name="cil-comment-bubble" size="sm" />
                                </div>
                                <div>
                                    <div class="font-weight-bold text-dark">{{ item.responses }}</div>
                                    <div class="small text-muted">responses</div>
                                </div>
                            </div>
                        </td>
                        <td class="py-3">
                            <div class="d-flex align-items-center text-muted">
                                <CIcon name="cil-calendar" size="sm" class="mr-2" />
                                <span>{{ item.created }}</span>
                            </div>
                        </td>
                        <td class="text-right pr-4 py-3">
                            <CDropdown placement="bottom-end">
                                <template #toggler>
                                    <button class="btn btn-link text-muted p-0 text-decoration-none">
                                        <CIcon name="cil-options" />
                                    </button>
                                </template>
                                <CDropdownItem>Edit</CDropdownItem>
                                <CDropdownItem>Share</CDropdownItem>
                                <CDropdownItem class="text-danger">Delete</CDropdownItem>
                            </CDropdown>
                        </td>
                    </tr>
                    <tr v-if="paginatedData.length === 0">
                        <td colspan="5" class="text-center py-5 text-muted">
                            No forms found.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="d-flex justify-content-end p-3 border-top" v-if="totalPages > 1">
            <CPagination :active-page.sync="currentPage" :pages="totalPages" size="sm" align="center" />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
    name: 'EditorTables',
    data() {
        return {
            currentPage: 1,
            pageSize: 5,
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),

        tableData() {
            // Force reactivity on locale change
            const locale = this.$i18n.locale;

            if (!this.forms || this.forms.length === 0) return []

            // Sort forms by createdAt (newest first)
            const sortedForms = [...this.forms].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt)
            })

            return sortedForms.map(form => {
                // Safe check for status
                let statusTitle = 'Draft';
                if (form.status && form.status.title) {
                    statusTitle = this.getLang(form.status.title);
                } else if (typeof form.status === 'string') {
                    statusTitle = form.status;
                }

                return {
                    title: this.getLang(form.title) || 'Untitled Form',
                    description: this.getLang(form.description) || '',
                    status: statusTitle,
                    access: form.isPublic ? 'Public' : 'Private',
                    responses: form.responses ? form.responses.length : 0,
                    created: form.createdAt ? moment(form.createdAt).format('MMM D, YYYY') : '-'
                }
            })
        },
        totalPages() {
            return Math.ceil(this.tableData.length / this.pageSize)
        },
        paginatedData() {
            const start = (this.currentPage - 1) * this.pageSize
            const end = start + this.pageSize
            return this.tableData.slice(start, end)
        }
    },
    methods: {
        getLang(data) {
            if (!data) return '';
            if (typeof data === 'string') return data;
            if (!Array.isArray(data)) return '';

            // Find content matching current locale
            const currentLang = this.$i18n.locale;
            let content = data.find(item => item.key === currentLang);

            // Fallback to 'en' if current locale not found
            if (!content) {
                content = data.find(item => item.key === 'en');
            }

            // Fallback to first available if 'en' not found
            if (!content && data.length > 0) {
                content = data[0];
            }

            return content ? content.value : '';
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'open' || s === 'published') return 'status-open';
            if (s === 'closed') return 'status-closed';
            return 'status-draft'; // Default/Draft
        }
    }
}
</script>

<style scoped>
.user-tables-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    overflow: hidden;
    /* For rounded corners on child elements */
}

/* Table Header */
.custom-table thead th {
    background-color: #f8fafc;
    border-bottom: 1px solid #edf2f7;
    color: #64748b;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-top: 1rem;
    padding-bottom: 1rem;
    border-top: none;
}

/* Rows */
.custom-table tbody tr {
    transition: background-color 0.2s ease;
}

.custom-table tbody tr:hover {
    background-color: #f8fafc;
}

.custom-table tbody td {
    border-top: 1px solid #edf2f7;
    vertical-align: middle;
}

/* Typography */
.text-lg {
    font-size: 0.95rem;
}

.text-muted {
    color: #94a3b8 !important;
}

/* Status Badges */
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35em 0.8em;
    border-radius: 50rem;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}

/* Status Colors */
.status-open {
    background-color: #d1fae5;
    color: #065f46;
}

.status-open .status-dot {
    background-color: #059669;
}

.status-draft {
    background-color: #f3f4f6;
    color: #4b5563;
}

.status-draft .status-dot {
    background-color: #9ca3af;
}

.status-closed {
    background-color: #fee2e2;
    color: #991b1b;
}

.status-closed .status-dot {
    background-color: #dc2626;
}

/* Icon Wrapper */
.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: #fff1f2;
    /* Light rose background for chart looking icon */
    color: #be123c;
}

.chart-color {
    background-color: #fff5f5;
    color: #e55353;
}

/* Dropdown */
.btn-link {
    color: #94a3b8;
}

.btn-link:hover {
    color: #64748b;
}

/* Pagination customization to match clean theme */
::v-deep .page-link {
    border: none;
    color: #64748b;
    border-radius: 6px;
    margin: 0 2px;
}

::v-deep .page-link:hover {
    background-color: #f1f5f9;
    color: #0f172a;
}

::v-deep .page-item.active .page-link {
    background-color: #0ea5e9;
    /* Sky blue or primary brand color */
    color: white;
}
</style>