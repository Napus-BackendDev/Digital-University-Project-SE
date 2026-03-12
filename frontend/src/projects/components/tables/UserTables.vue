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
                        <CDropdownItem @click="filterStatus('All')">All Status</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Pending')">Pending</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Completed')">Completed</CDropdownItem>
                    </CDropdown>
                </div>
            </div>
        </div>

        <div class="user-tables-container">
            <CDataTable :items="tableData" :fields="fields" :items-per-page="itemsPerPage" :activePage.sync="activePage"
                :pagination="false" hover class="mb-0 custom-table">
                <!-- Form Name (Title & Description) Slot -->
                <template #form="{ item }">
                    <td class="pl-4 py-3" :style="{ height: item.isEmptyRow ? '76px' : 'auto' }">
                        <div class="font-weight-bold text-dark text-lg" style="font-size: 0.95rem;">{{ item.title }}
                        </div>
                        <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                    </td>
                </template>

                <!-- Status Slot -->
                <template #status="{ item }">
                    <td class="py-3">
                        <span v-if="!item.isEmptyRow" class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-dot"></span>
                            {{ item.status }}
                        </span>
                    </td>
                </template>

                <!-- Action Slot -->
                <template #action="{ item }">
                    <td class="py-3 text-right pr-4">
                        <CButton v-if="!item.isEmptyRow"
                            :color="item.status.toLowerCase() === 'completed' ? 'secondary' : 'primary'"
                            :disabled="item.status.toLowerCase() === 'completed'" size="sm"
                            class="font-weight-bold px-4" style="border-radius: 6px;" @click.stop="goToForm(item._id)">
                            {{ item.status.toLowerCase() === 'completed' ? 'Completed' : 'Start' }}
                        </CButton>
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
            selectedStatus: 'All',
            loading: false,
            activePage: 1,
            itemsPerPage: 5,
            fields: [
                { key: 'form', label: 'Questionnaire', _style: 'width:60%' },
                { key: 'status', label: 'Status', _style: 'width:20%' },
                { key: 'action', label: 'Action', _style: 'width:20%; text-align:right' }
            ]
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('Setting', ['lang']),

        totalPages() {
            return Math.max(1, Math.ceil(this.tableData.length / this.itemsPerPage))
        },

        tableData() {
            const locale = this.lang;
            
            if (!this.forms || this.forms.length === 0) return []

            const sortedForms = [...this.forms].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt)
            })

            const mappedData = [];
            const now = new Date();

            sortedForms.forEach(form => {
                const schedule = form.schedule;
                let isOpen = false;

                if (schedule && schedule.startAt) {
                    const start = new Date(schedule.startAt);
                    const end = new Date(schedule.endAt);

                    if (start <= now && now <= end) {
                        isOpen = true;
                    }
                }

                if (isOpen) {
                    const responder = '69a50fcc5f1adf15e09b2d86';

                    let hasCompleted = false;
                    let hasDraft = false;
                    if (form.responses && Array.isArray(form.responses)) {
                        form.responses.forEach(r => {
                            if (!r) return;
                            if (typeof r === 'object') {
                                try {
                                    if (String(r.responder) === String(responder)) {
                                        if (r.submit === true || r.submit === 'true') hasCompleted = true;
                                        else hasDraft = true;
                                    }
                                } catch (e) {
                                    // ignore
                                }
                            }
                        });
                    }

                    const statusTitle = hasCompleted ? 'Completed' : 'Pending';

                    mappedData.push({
                        _id: form._id || form.id,
                        title: this.getLang(form.title) || 'Untitled Form',
                        description: this.getLang(form.description) || '',
                        status: statusTitle
                    });
                }
            });

            let finalData = mappedData.filter(item => {
                if (this.selectedStatus !== 'All' && item.status !== this.selectedStatus) {
                    return false;
                }

                if (this.searchQuery) {
                    const query = this.searchQuery.toLowerCase();
                    const titleMatch = item.title.toLowerCase().includes(query);
                    const descMatch = (item.description || '').toLowerCase().includes(query);
                    return titleMatch || descMatch;
                }

                return true;
            });

            return JSON.parse(JSON.stringify(finalData));
        }
    },
    methods: {
        goToFormRecord(item) {
            if (item && !item.isEmptyRow) {
                this.goToForm(item._id);
            }
        },
        goToForm(id) {
            if (id) {
                this.$router.push({ name: 'FormFill', params: { id: id }, query: { source: 'internal' } })
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
            if (s === 'completed') return 'status-completed';
            return 'status-pending';
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
.status-completed {
    background-color: #d1fae5;
    color: #065f46;
}

.status-completed .status-dot {
    background-color: #059669;
}

.status-pending {
    background-color: #fef9c3;
    color: #854d0e;
}

.status-pending .status-dot {
    background-color: #eab308;
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
</style>