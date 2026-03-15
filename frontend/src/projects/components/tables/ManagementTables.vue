<template>
    <div>
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate" :endDate.sync="endDate" />
        
        <!-- Table -->
        <div class="user-tables-container">
            <CDataTable class="custom-table mb-0" :items="tableData" :fields="columns" :items-per-page="itemsPerPage"
                :pagination="false" hover :activePage.sync="activePage">

                <!-- Questionnaire (Title & Description) -->
                <template #title="{ item }">
                    <td class="py-3">
                        <template v-if="!item.isEmpty">
                            <div class="font-weight-bold text-dark" style="font-size: 0.95rem;">{{ item.title }}</div>
                            <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                        </template>
                    </td>
                </template>

                <!-- Created By -->
                <template #createBy="{ item }">
                    <td class="py-3">
                        <div class="small text-dark font-weight-bold">{{ item.organization || '-' }}</div>
                        <div class="small text-muted mt-1" v-if="item.createdBy">{{ item.createdBy }}</div>
                    </td>
                </template>

                <!-- Time Range -->
                <template #timeRange="{ item }">
                    <td class="py-3">
                        <div class="small text-dark font-weight-bold">{{ item.timeRange || '-' }}</div>
                        <div class="small text-muted mt-1">{{ item.daysLeft || '' }}</div>
                    </td>
                </template>

                <!-- Status Label -->
                <template #status="{ item }">
                    <td class="py-3">
                        <span v-if="!item.isEmpty" class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-dot"></span>
                            {{ item.status }}
                        </span>
                    </td>
                </template>

                <!-- Responses: show two rows (Completed vs Ongoing) -->
                <template #responses="{ item }">
                    <td class="align-middle">
                        <div v-if="!item.isEmpty" class="d-flex flex-column">
                            <div class="d-flex align-items-center mb-1">
                                <div class="icon-wrapper mr-2 chart-color" style="width: 20px; height: 20px;">
                                    <CIcon name="cil-check-alt" size="sm" class="text-success" />
                                </div>
                                <span class="response-count font-weight-bold mr-1">{{ getCompletedCount(item.responses) }}</span>
                                <small class="text-muted">Completed</small>
                            </div>
                            <div class="d-flex align-items-center">
                                <div class="icon-wrapper mr-2" style="width: 20px; height: 20px; background-color: #f1f5f9;">
                                    <CIcon name="cil-history" size="sm" class="text-info" />
                                </div>
                                <span class="response-count font-weight-bold mr-1">{{ getOngoingCount(item.responses) }}</span>
                                <small class="text-muted">Ongoing</small>
                            </div>
                        </div>
                    </td>
                </template>

                <!-- Actions: individual icon buttons like FormTables -->
                <template #actions="{ item }">
                    <td class="align-middle text-right pr-4">
                        <div class="d-flex align-items-center justify-content-end">
                            <CButton size="sm" color="info" variant="ghost" class="p-2 mr-2 action-icon-btn" @click.stop="goToPreviewForm(item)" v-c-tooltip="'Preview'" aria-label="Preview">
                                <CIcon name="cil-magnifying-glass" />
                            </CButton>
                            <CButton size="sm" color="primary" variant="ghost" class="p-2 mr-2 action-icon-btn" @click.stop="goToDuplicationForm(item)" v-c-tooltip="'Duplicate'" aria-label="Duplicate">
                                <CIcon name="cil-copy" />
                            </CButton>
                            <CButton size="sm" color="warning" variant="ghost" class="p-2 mr-2 action-icon-btn" @click.stop="goToEditForm(item)" v-c-tooltip="'Edit'" aria-label="Edit">
                                <CIcon name="cil-pencil" />
                            </CButton>
                            <CButton size="sm" color="danger" variant="ghost" class="p-2 action-icon-btn" @click.stop="confirmDeleteItem(item)" v-c-tooltip="'Delete'" aria-label="Delete">
                                <CIcon name="cil-trash" />
                            </CButton>
                        </div>
                    </td>
                </template>

            </CDataTable>
        </div>

        <!-- Pagination -->
        <Pagination :activePage.sync="activePage" :pages="totalPages" />

        <!-- Confirm Delete modal -->
        <CModal :show.sync="deleteModal" :centered="true">
            <template #header-wrapper>
                <div class="align-items-start p-3">
                    <div class="d-flex flex-column align-items-center">
                        <div class="icon-wrapper border-danger m-1">
                            <CIcon name="cil-x" />
                        </div>
                        <span class="font-weight-bold">{{ $t('modal.deleteTitle') }}</span>
                    </div>
                </div>
            </template>
            <template #body-wrapper>
                <div class="d-flex justify-content-center p-4">
                    <span>{{ $t('modal.deleteMessage') }}</span>
                </div>
            </template>
            <template #footer-wrapper>
                <div class="d-flex justify-content-center p-3">
                    <CButton color="secondary" @click="deleteModal = false">
                        {{ $t('modal.cancel') }}
                    </CButton>
                    <CButton color="danger" class="ml-2" @click="confirmDelete()">
                        {{ $t('modal.confirm') }}
                    </CButton>
                </div>
            </template>
        </CModal>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'
import FilterTable from '@/projects/components/Filter/FilterTable.vue'

export default {
    name: 'ManagementTables',
    components: { Pagination, FilterTable },
    props: {
        items: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            searchQuery: '',
            selectedStatus: 'All',
            startDate: '',
            endDate: '',
            activePage: 1,
            itemsPerPage: 5,
            deleteModal: false,
            deleteItem: null,
        }
    },
    computed: {
        columns() {
            return [
                { key: 'title', label: this.$t('table.questionnaire'), _style: 'width:25%' },
                { key: 'createBy', label: this.$t('table.createdBy'), _style: 'width:10%' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:18%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:12%' },
                { key: 'responses', label: this.$t('table.responses'), _style: 'width:20%' },
                { key: 'actions', label: this.$t('table.actions'), _style: 'width:15%; text-align:right' }
            ]
        },
        ...mapGetters('Forms', ['forms']),

        totalPages() {
            return Math.ceil(this.tableData.length / this.itemsPerPage) || 1;
        },
        tableStartItem() {
            if (this.tableData.length === 0) return 0;
            return (this.activePage - 1) * this.itemsPerPage + 1;
        },
        tableEndItem() {
            const validItemsCount = this.tableData.filter(item => !item.isEmpty).length;
            return Math.min(this.activePage * this.itemsPerPage, validItemsCount);
        },

        tableData() {
            let filtered = this.items || [];

            // Filter by Status
            if (this.selectedStatus !== 'All') {
                filtered = filtered.filter(f => f.status === this.selectedStatus);
            }

            // Filter by Search Query
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(f =>
                    f.title.toLowerCase().includes(q) ||
                    (f.organization && f.organization.toLowerCase().includes(q)) ||
                    (f.createdBy && f.createdBy.toLowerCase().includes(q))
                );
            }

            return filtered;
        }
    },
    methods: {
        getCompletedCount(responses) {
            if (!Array.isArray(responses)) return 0;
            return responses.filter(r => r.submit === true).length;
        },
        getOngoingCount(responses) {
            if (!Array.isArray(responses)) return 0;
            return responses.filter(r => r.submit !== true).length;
        },
        calculateDaysLeft(endAt) {
            try {
                const end = new Date(endAt);
                const now = new Date();
                const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                return diff > 0 ? `${diff} days left` : 'Closed';
            } catch (e) {
                return '';
            }
        },
        confirmDeleteItem(item) {
            this.deleteItem = item;
            this.deleteModal = true;
        },
        filterStatus(status) {
            this.selectedStatus = status;
            this.currentPage = 1; // Reset pagination when filter changes
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'active') return 'status-active';
            if (s === 'closed') return 'status-closed';
            return 'status-pending';
        },
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = visibility.toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ')) return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            return 'visi-default';
        },
        goToEditForm(item) {
            this.$router.push({ name: 'EditorCreateForm', params: { _id: item._id } });
        },
        goToDuplicationForm(item) {
            this.$router.push({ name: 'FormFill', params: { id: item._id }, query: { mode: 'duplicate', source: 'internal' } });
        },
        goToPreviewForm(item) {
            this.$router.push({ name: 'FormFill', params: { id: item._id }, query: { mode: 'preview', source: 'internal' } });
        },
        async confirmDelete() {
            if (this.deleteItem) {
                await this.deleteForm(this.deleteItem);
            }
            this.deleteModal = false;
            this.deleteItem = null;
        },
        async deleteForm(item) {
            try {
                await this.$store.dispatch('Forms/delete', { _id: item._id });
                await this.$store.dispatch('Forms/get');
            } catch (error) {
                console.error("Failed to delete form:", error);
            }
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
.status-active {
    background-color: #dbeafe;
    color: #1e40af;
}

.status-active .status-dot {
    background-color: #2563eb;
}

.status-pending {
    background-color: #fef9c3;
    color: #854d0e;
}

.status-pending .status-dot {
    background-color: #eab308;
}

.status-closed {
    background-color: #fee2e2;
    color: #991b1b;
}

.status-closed .status-dot {
    background-color: #dc2626;
}

/* Responses badge */
.response-badge {
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
}

.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background-color: #f1f5f9;
    color: #475569;
}

/* Action Buttons */
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

</style>