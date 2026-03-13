<template>
    <div>
        <!-- Filter Toolbar Refactored -->
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate"
            :endDate.sync="endDate" />

        <div class="user-tables-container">
            <CDataTable :items="tableData" :fields="fields" :items-per-page="itemsPerPage" :activePage.sync="activePage"
                :pagination="false" hover class="mb-0 custom-table">
                <!-- Form Name (Title & Description) Slot -->
                <template #form="{ item }">
                    <td class="py-3">
                        <div class="font-weight-bold text-dark" style="font-size: 0.95rem;">{{ item.title }}</div>
                        <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                    </td>
                </template>

                <!-- Create By Slot -->
                <template #createBy="{ item }">
                    <td class="py-3">
                        <div class="small text-dark">{{ item.organization }}</div>
                    </td>
                </template>

                <!-- Time Range Slot -->
                <template #timeRange="{ item }">
                    <td class="py-3">
                        <div class="small text-dark font-weight-bold">{{ item.timeRange }}</div>
                        <div class="small text-muted mt-1">{{ item.daysLeft }}</div>
                    </td>
                </template>

                <!-- Status Slot -->
                <template #status="{ item }">
                    <td class="py-3">
                        <span class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-dot"></span>
                            {{ $t('status.' + item.status.toLowerCase()) }}
                        </span>
                    </td>
                </template>

                <!-- Progress Slot -->
                <template #progress="{ item }">
                    <td class="py-3" style="min-width: 140px;">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1 mr-3">
                                <CProgress :value="item.progress" :color="getProgressColor(item.progress)" height="6px"
                                    class="progress-xs" />
                            </div>
                            <div class="small font-weight-bold text-dark">{{ item.progress }}%</div>
                        </div>
                    </td>
                </template>

                <!-- Action Slot -->
                <template #action="{ item }">
                    <td class="py-3 text-right pr-4">
                        <div class="d-flex align-items-center justify-content-end">
                            <CIcon v-if="item.requireEmail" name="cil-warning" class="text-danger mr-2"
                                style="width: 20px;" v-c-tooltip="'Email required'" />
                            <CButton :color="getActionColor(item.status)" variant="ghost" class="p-2 action-icon-btn"
                                @click.stop="goToForm(item._id)" v-c-tooltip="getActionTooltip(item.status)">
                                <CIcon :name="getActionIcon(item.status)" size="lg" />
                            </CButton>
                        </div>
                    </td>
                </template>
            </CDataTable>

            <!-- Pagination -->
            <Pagination :activePage.sync="activePage" :pages="totalPages" />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Pagination from '@/projects/components/Util/Pagination.vue'
import FilterTable from '@/projects/components/Filter/FilterTable.vue'
import localeMixin from '@/mixins/localeMixin'

export default {
    name: 'UserTables',
    components: { Pagination, FilterTable },
    mixins: [localeMixin],
    data() {
        return {
            searchQuery: '',
            selectedStatus: 'All',
            startDate: '',
            endDate: '',
            loading: false,
            activePage: 1,
            itemsPerPage: 5
        }
    },
    computed: {
        fields() {
            return [
                { key: 'form', label: this.$t('table.questionnaire'), _style: 'width:25%' },
                { key: 'createBy', label: this.$t('table.createdBy'), _style: 'width:15%' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:18%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:12%' },
                { key: 'progress', label: this.$t('table.progress'), _style: 'width:15%' },
                { key: 'action', label: this.$t('table.action'), _style: 'width:15%; text-align:right' }
            ]
        },
        ...mapGetters('Forms', ['forms']),

        totalPages() {
            return Math.max(1, Math.ceil(this.tableData.length / this.itemsPerPage))
        },

        tableData() {
            // Mockup data as requested by the user
            return [
                {
                    _id: '1',
                    title: '2024 Faculty Satisfaction Survey',
                    description: 'Collecting feedback from all faculty members on facilities and resources.',
                    status: 'InProgress',
                    timeRange: 'Mar 1, 2024 - Mar 31, 2024',
                    daysLeft: '18 days left',
                    progress: 65,
                    organization: 'Faculty of Engineering',
                    createdAt: '2024-03-01T08:00:00Z'
                },
                {
                    _id: '2',
                    title: 'Course Evaluation - Semester 2',
                    description: 'Standard end-of-semester evaluation for GE courses.',
                    status: 'Completed',
                    timeRange: 'Feb 15, 2024 - Mar 15, 2024',
                    daysLeft: 'Closed',
                    progress: 100,
                    organization: 'Department of Computer Science',
                    createdAt: '2024-02-15T10:00:00Z'
                },
                {
                    _id: '3',
                    title: 'Research Proposal Feedback',
                    description: 'Optional survey for graduate students to provide feedback on proposal process.',
                    status: 'Pending',
                    timeRange: 'Mar 10, 2024 - Apr 10, 2024',
                    daysLeft: '28 days left',
                    progress: 0,
                    organization: 'Graduate School',
                    createdAt: '2024-03-05T09:00:00Z'
                },
                {
                    _id: '4',
                    title: 'Library Services Annual Review',
                    description: 'Help us improve our library services by sharing your experience.',
                    status: 'InProgress',
                    timeRange: 'Feb 20, 2024 - Apr 20, 2024',
                    daysLeft: '38 days left',
                    progress: 35,
                    organization: 'Central Library',
                    createdAt: '2024-02-10T11:00:00Z'
                },
                {
                    _id: '5',
                    title: 'IT Infrastructure Survey',
                    description: 'Feedback on campus WiFi and computing facilities.',
                    status: 'Pending',
                    timeRange: 'Mar 15, 2024 - Apr 15, 2024',
                    daysLeft: '33 days left',
                    progress: 0,
                    organization: 'IT Center',
                    requireEmail: true,
                    createdAt: '2024-03-12T14:00:00Z'
                }
            ];
        }
    },
    methods: {
        goToFormRecord(item) {
            if (item) {
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
            this.activePage = 1;
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'completed') return 'status-completed';
            if (s === 'inprogress') return 'status-inprogress';
            return 'status-pending';
        },
        getProgressColor(progress) {
            if (progress >= 100) return 'success';
            if (progress >= 40) return 'info';
            if (progress > 0) return 'warning';
            return 'secondary';
        },
        getProgressColor(progress) {
            if (progress >= 100) return 'success';
            if (progress >= 40) return 'info';
            if (progress > 0) return 'warning';
            return 'secondary';
        },
        getActionColor(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'completed') return 'success';
            if (s === 'pending') return 'warning';
            return 'primary';
        },
        getActionIcon(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'completed') return 'cil-check-circle';
            if (s === 'inprogress') return 'cil-pencil';
            return 'cil-input';
        },
        getActionTooltip(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'completed') return 'View ฆummary';
            if (s === 'inprogress') return 'Continue โorm';
            return 'Start Form';
        }
    }
}
</script>

<style scoped>
.user-tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    padding: 0;
    /* ensure no extra spacing around table */
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

.status-inprogress {
    background-color: #dbeafe;
    color: #1e40af;
}

.status-inprogress .status-dot {
    background-color: #2563eb;
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

/* Custom Table Styling matching ManagementTables */
::v-deep .custom-table table {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

/* Header Styling */
::v-deep .custom-table thead th {
    background-color: #ffffff !important;
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
    background-color: #ffffff !important;
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
    background-color: #ffffff !important;
}

.action-icon-btn {
    width: 38px;
    height: 38px;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    border-radius: 50% !important;
    transition: all 0.2s ease;
}

.action-icon-btn:hover {
    background-color: #f1f5f9 !important;
    color: #3c4b64 !important;
    transform: translateY(-1px);
}

/* Remove bottom border from the very last row */
::v-deep .custom-table tbody tr:last-child td {
    border-bottom: none !important;
}
</style>