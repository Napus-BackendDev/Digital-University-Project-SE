<template>
    <div>
        <!-- Filter Toolbar -->
        <div class="d-flex justify-content-between align-items-center pt-3 py-3 mb-3">
            <div class="flex-grow-1 mr-3">
                <CInput v-model="searchQuery" placeholder="Search forms..." class=" mb-0">
                    <template #prepend-content>
                        <CIcon name="cil-magnifying-glass" class="text-muted" />
                    </template>
                </CInput>
            </div>

            <div class="d-flex align-items-center">
                <div class="mr-3">
                    <CDropdown class="filter-dropdown">
                        <template #toggler>
                            <button class="btn d-flex align-items-center text-muted border bg-white"
                                style="border-radius: 6px;">
                                <CIcon name="cil-filter" size="sm" class="mr-2" />
                                <span>{{ selectedStatus }}</span>
                                <CIcon name="cil-chevron-bottom" size="sm" class="ml-2" />
                            </button>
                        </template>
                        <CDropdownItem @click="filterStatus('All Status')">All Status</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Open')">Open</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Closed')">Closed</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Draft')">Draft</CDropdownItem>
                    </CDropdown>
                </div>
            </div>
        </div>

        <div class="user-tables-container">
            <CDataTable :items="tableData" :fields="fields" :items-per-page="itemsPerPage" :activePage.sync="activePage"
                :pagination="false" hover sorter :loading="loading" clickable-rows @row-clicked="goToForm"
                class="mb-0 custom-datatable">
                <!-- Form Name (Title) Slot -->
                <template #title="{ item }">
                    <td class="pl-4 py-3">
                        <div class="font-weight-bold text-dark text-lg">{{ item.title }}</div>
                        <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                    </td>
                </template>

                <!-- Status Slot -->
                <template #status="{ item }">
                    <td class="py-3">
                        <span class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-dot"></span>
                            {{ item.status }}
                        </span>
                    </td>
                </template>

                <!-- Responses Slot -->
                <template #responses="{ item }">
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
                </template>
            </CDataTable>
        </div>

        <!-- Pagination -->
        <Pagination :activePage.sync="activePage" :pages="totalPages" />
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'

export default {
    name: 'UserTables',
    components: { Pagination },
    data() {
        return {
            searchQuery: '',
            selectedStatus: 'All Status',
            loading: false,
            activePage: 1,
            itemsPerPage: 5,
            fields: [
                { key: 'title', label: 'Form Name', _style: 'width:40%' },
                { key: 'status', label: 'Status', _style: 'width:15%' },
                { key: 'responses', label: 'Responses', _style: 'width:15%' },
            ]
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('setting', ['lang']),

        totalPages() {
            return Math.max(1, Math.ceil(this.tableData.length / this.itemsPerPage))
        },

        tableData() {
            // Force reactivity on locale change
            const locale = this.lang;

            if (!this.forms || this.forms.length === 0) return []

            // Sort forms by createdAt (newest first)
            const sortedForms = [...this.forms].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt)
            })

            // 2. Map to display objects
            const mappedData = sortedForms.map(form => {
                // Safe check for status
                let statusTitle = 'Draft';
                if (form.status && form.status.title) {
                    statusTitle = this.getLang(form.status.title);
                } else if (typeof form.status === 'string') {
                    statusTitle = form.status;
                }

                return {
                    _id: form._id || form.id,
                    title: this.getLang(form.title) || 'Untitled Form',
                    description: this.getLang(form.description) || '',
                    status: statusTitle,
                    access: form.isPublic ? 'Public' : 'Private',
                    responses: form.responses ? form.responses.length : 0,
                    created: form.createdAt ? moment(form.createdAt).format('MMM D, YYYY') : '-'
                }
            })

            // 3. Apply filters
            return mappedData.filter(item => {
                // Filter by Status
                if (this.selectedStatus !== 'All Status' && item.status !== this.selectedStatus) {
                    return false;
                }

                // Filter by Search Query
                if (this.searchQuery) {
                    const query = this.searchQuery.toLowerCase();
                    const titleMatch = item.title.toLowerCase().includes(query);
                    const descMatch = item.description.toLowerCase().includes(query);
                    return titleMatch || descMatch;
                }

                return true;
            });
        }
    },
    methods: {
        goToForm(id) {
            if (id) {
                this.$router.push({
                    name: 'UserFormFill',
                    params: {
                        id: id
                    }
                })
            }
        },
        filterStatus(status) {
            this.selectedStatus = status;
            this.currentPage = 1; // Reset pagination when filter changes
        },
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

/* Clickable Rows */
.custom-table tbody tr {
    transition: background-color 0.2s ease;
    cursor: pointer;
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

.search-input-group {
    background-color: #f8fafc;
    border-radius: 6px;
    overflow: hidden;
}

.search-input-group .input-group-text {
    background-color: #f8fafc !important;
}

.search-input-group input {
    background-color: #f8fafc !important;
}
</style>