<template>
    <div>
        <div class="d-flex justify-content-between align-items-center">
            <div class="flex-grow-1 mr-3">
                <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate" :endDate.sync="endDate" />
            </div>
        </div>
        
        <!-- <div class="d-flex align-items-center">
            <CButton color="danger" class="d-flex align-items-center text-white px-3"
                style="border-radius: 6px; background-color: #be123c; border-color: #be123c; border-radius: .5rem;"
                hover @click="createNewForm" :disabled="isCreating">
                <CIcon v-if="!isCreating" name="cil-plus" size="sm" class="mr-2" />
                <CSpinner v-else size="sm" class="mr-2" />
                {{ $t('button.create') }}
            </CButton>
        </div> -->

        <!-- Table -->
        <div class="user-tables-container">
            <CDataTable class="custom-table mb-0" :items="tableData" :fields="columns" :items-per-page="itemsPerPage"
                :pagination="false" hover :activePage.sync="activePage">

                <!-- Questionnaire (Title & Description) -->
                <template #title="{ item }">
                    <td class="align-middle">
                        <template v-if="!item.isEmpty">
                            <strong class="text-dark form-title">{{ item.title }}</strong>
                            <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                        </template>
                    </td>
                </template>

                <!-- Created By -->
                <template #createBy="{ item }">
                    <td class="align-middle">
                        <div class="small text-dark">{{ item.createdBy || item.organization || '-' }}</div>
                    </td>
                </template>

                <!-- Time Range -->
                <template #timeRange="{ item }">
                    <td class="align-middle">
                        <div class="small text-dark font-weight-bold">{{ item.timeRange || '-' }}</div>
                        <div class="small text-muted mt-1">{{ item.daysLeft || '' }}</div>
                    </td>
                </template>

                <!-- Status Label -->
                <template #status="{ item }">
                    <td class="align-middle">
                        <span v-if="!item.isEmpty" class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-dot"></span>
                            {{ item.status }}
                        </span>
                    </td>
                </template>

                <!-- Responses: show all responses (as small badges) -->
                <template #responses="{ item }">
                    <td class="align-middle">
                        <div v-if="!item.isEmpty" class="d-flex align-items-center">
                            <div class="icon-wrapper mr-3 chart-color">
                                <CIcon name="cil-comment-bubble" size="sm" />
                            </div>
                            <div v-if="Array.isArray(item.responses) && item.responses.length > 0"
                                class="d-flex flex-wrap">
                                <span v-for="(response, idx) in item.responses" :key="idx"
                                    class="response-badge mr-2 mb-1">
                                    <small class="text-muted">{{ formatResponseLabel(response, idx) }}</small>
                                </span>
                            </div>
                            <div v-else class="small text-muted">0</div>
                            <small class="text-muted ml-2">Responses</small>
                        </div>
                    </td>
                </template>

                <!-- Vision/Visibility Status Badge -->
                <template #visibility="{ item }">
                    <td class="align-middle">
                        <span v-if="!item.isEmpty" class="visibility-badge"
                            :class="getVisibilityClass(item.visibility)">
                            {{ item.visibility }}
                        </span>
                    </td>
                </template>

                <!-- Actions: individual icon buttons like FormTables -->
                <template #actions="{ item }">
                    <td class="align-middle text-right pr-4">
                        <div class="d-flex align-items-center justify-content-end">
                            <CButton size="sm" color="info" variant="ghost" class="p-2 mr-2 action-icon-btn" @click.stop="goToViewForm(item)" v-c-tooltip="'View'" aria-label="View">
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
    components: { Pagination },
    components: { Pagination, FilterTable },
    data() {
        return {
            searchQuery: '',
            selectedStatus: 'All',
            startDate: '',
            endDate: '',
            isCreating: false,
            activePage: 1,
            itemsPerPage: 5,
            deleteModal: false,
            deleteItem: null,
        }
    },
    computed: {
        columns() {
            return [
                { key: 'title', label: this.$t('table.questionnaire'), _style: 'width:30%' },
                { key: 'createBy', label: this.$t('table.createdBy'), _style: 'width:12%' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:18%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:12%' },
                { key: 'responses', label: this.$t('table.responses'), _style: 'width:18%' },
                { key: 'actions', label: this.$t('table.actions'), _style: 'width:10%; text-align:right' }
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
            let finalData = [];

            if (Array.isArray(this.forms) && this.forms.length > 0) {
                // Sort forms by updatedAt (newest first)
                const sortedForms = [...this.forms].sort((a, b) => {
                    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
                })

                // 2. Map to display objects
                const mappedData = sortedForms.map(form => {
                    // Determine status based on schedule and map to Active/Pending/Closed
                    let statusTitle = 'Pending';
                    const now = new Date();
                    const schedule = form.schedule;
                    if (schedule && schedule.startAt) {
                        const start = new Date(schedule.startAt);
                        const end = new Date(schedule.endAt);
                        if (!start && !end) {
                            statusTitle = 'Pending';
                        } else if (start <= now && now <= end) {
                            statusTitle = 'Active';
                        } else {
                            statusTitle = 'Closed';
                        }
                    }

                    return {
                        _id: form._id,
                        title: this.getLang(form.title) || 'Untitled Form',
                        description: this.getLang(form.description) || '',
                        status: statusTitle,
                        organization: form.organization || form.createdBy || '-',
                        timeRange: schedule && schedule.startAt ? `${moment(schedule.startAt).format('MMM D, YYYY')} - ${moment(schedule.endAt).format('MMM D, YYYY')}` : '-',
                        daysLeft: schedule && schedule.endAt ? this.calculateDaysLeft(schedule.endAt) : '',
                        responses: Array.isArray(form.responses) ? form.responses : (form.responses ? [form.responses] : []),
                        created: form.updatedAt ? moment(form.updatedAt).format('MMM D, YYYY') : '-'
                    }
                });

                // 3. Apply filters
                finalData = mappedData.filter(item => {
                    // Filter by Status (map selectedStatus coming from FilterTable to our display statuses)
                    if (this.selectedStatus !== 'All' && item.status !== this.selectedStatus) {
                        return false;
                    }

                    // Filter by Search Query
                    if (this.searchQuery) {
                        const query = this.searchQuery.toLowerCase();
                        const titleMatch = item.title.toLowerCase().includes(query);
                        const descMatch = item.description && item.description.toLowerCase().includes(query);
                        return titleMatch || descMatch;
                    }

                    return true;
                });
            }

            console.log(finalData)

            return finalData;
        }
    },
    methods: {
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
        formatResponseLabel(r, idx) {
            if (!r) return `#${idx + 1}`;
            if (r.email) return r.email;
            if (r.createdAt) return moment(r.createdAt).format('MMM D');
            return `#${idx + 1}`;
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
            if (s === 'active') return 'status-open';
            if (s === 'closed') return 'status-closed';
            return 'status-draft';
        },
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = visibility.toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ')) return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            return 'visi-default';
        },
        async createNewForm() {
            this.isCreating = true;
            try {
                const newFormData = {
                    title: [
                        { key: 'en', value: 'Untitled Form' }
                    ],
                    description: [
                        { key: 'en', value: 'Description' }
                    ],
                    questions: [],
                    responses: [],
                    settings: {
                        startDateTime: '',
                        endDateTime: '',
                        accessType: 'Anyone with the link',
                        newCollaborator: {
                            email: '',
                            role: 'Editor'
                        },
                        collectEmails: false,
                        limitOneResponse: false,
                        allowEditing: false,
                        showProgressBar: false
                    }
                };

                const response = await this.$store.dispatch('Forms/create', newFormData);

                this.$router.push({ name: 'EditorCreateForm', params: { _id: response.data.data._id } });
            } catch (error) {
                console.error("Failed to create form:", error);
            } finally {
                this.isCreating = false;
            }
        },
        goToEditForm(item) {
            this.$router.push({ name: 'EditorCreateForm', params: { _id: item._id } });
        },
        goToDuplicationForm(item) {
            this.$router.push({ name: 'FormFill', params: { id: item._id }, query: { mode: 'duplicate', source: 'internal' } });
        },
        goToViewForm(item) {
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
        },
    }
}
</script>

<style scoped>
.user-tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
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

/* Responses badge */
.response-badge {
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
}

/* Visibility Badges */
.visibility-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25em 0.75em;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
}

.visi-public {
    background-color: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
}

.visi-private {
    background-color: #f3e8ff;
    color: #7e22ce;
    border: 1px solid #e9d5ff;
}

.visi-default {
    background-color: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
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

.search-input-group .input-group-text {
    background-color: #f8fafc !important;
}

.search-input-group input {
    background-color: #f8fafc !important;
}


::v-deep .custom-table table {
    margin-bottom: 0;
}

::v-deep .custom-table thead th {
    background-color: #f8fafc !important;
    /* Very subtle grey background for header */
    color: #475569 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    text-transform: capitalize !important;
    letter-spacing: normal;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    vertical-align: middle;
}

::v-deep .custom-table tbody td {
    color: #1e293b !important;
    font-size: 14px;
    font-weight: 500;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 18px 24px !important;
    vertical-align: middle;
    height: 76px;
    /* Set a default height to prevent empty rows from shrinking */
}

::v-deep .custom-table tbody tr:hover td {
    background-color: #f8fafc !important;
}

::v-deep .custom-table tbody tr:last-child td {
    border-bottom: none !important;
    /* Remove bottom border from the last row */
}
</style>