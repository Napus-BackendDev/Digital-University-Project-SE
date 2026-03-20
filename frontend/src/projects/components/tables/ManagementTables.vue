<template>
    <div>
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate"
            :endDate.sync="endDate" :managementMode="true" />

        <!-- Table -->
        <CDataTable class="user-tables-container mb-0" :items="tableData" :fields="fields"
            :items-per-page="itemsPerPage" :pagination="false" hover :activePage.sync="activePage"
            :no-items-view="{ noItems: 'No questionnaires yet. Create one to get started.' }">

            <!-- Questionnaire (Title & Description) -->
            <template #title="{ item }">
                <td class="py-3">
                    <template v-if="!item.isEmpty">
                        <div class="font-weight-bold text-dark" style="font-size: 0.95rem;">{{ item.title }}</div>
                        <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                    </template>
                </td>
            </template>

            <!-- Created By (Name + Email) -->
            <template #createBy="{ item }">
                <td class="py-3">
                    <div class="small text-dark font-weight-bold">{{ item.createdName || '-' }}</div>
                    <div class="small text-muted mt-1" v-if="item.createdEmail">{{ item.createdEmail }}</div>
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

            <!-- Access -->
            <template #access="{ item }">
                <td class="py-3">
                    <div v-if="!item.isEmpty" class="access-stack">
                        <span v-for="(acc, i) in (Array.isArray(item.access) ? item.access : [item.access])" :key="i"
                            class="visibility-badge" :class="getVisibilityClass(acc)">
                            {{ acc }}
                        </span>
                    </div>
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
                            <span class="response-count font-weight-bold mr-1">{{ getCompletedCount(item.responses)
                            }}</span>
                            <small class="text-muted">Completed</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="icon-wrapper mr-2"
                                style="width: 20px; height: 20px; background-color: #f1f5f9;">
                                <CIcon name="cil-history" size="sm" class="text-info" />
                            </div>
                            <span class="response-count font-weight-bold mr-1">{{ getOngoingCount(item.responses)
                            }}</span>
                            <small class="text-muted">Ongoing</small>
                        </div>
                    </div>
                </td>
            </template>

            <!-- Actions: individual icon buttons like FormTables -->
            <template #actions="{ item }">
                <td class="align-middle text-right pr-4">
                    <div class="d-flex align-items-center justify-content-end">
                        <CButton size="sm" color="info" variant="ghost" class="p-2 mr-2 action-icon-btn"
                            @click.stop="goToPreviewForm(item)" v-c-tooltip="'Preview'" aria-label="Preview">
                            <CIcon name="cil-magnifying-glass" />
                        </CButton>
                        <CButton size="sm" color="primary" variant="ghost" class="p-2 mr-2 action-icon-btn"
                            @click.stop="goToDuplicationForm(item)" v-c-tooltip="'Duplicate'" aria-label="Duplicate">
                            <CIcon name="cil-copy" />
                        </CButton>
                        <CButton size="sm" color="warning" variant="ghost" class="p-2 mr-2 action-icon-btn"
                            @click.stop="goToEditForm(item)" v-c-tooltip="'Edit'" aria-label="Edit">
                            <CIcon name="cil-pencil" />
                        </CButton>
                        <CButton size="sm" color="danger" variant="ghost" class="p-2 action-icon-btn"
                            @click.stop="confirmDeleteItem(item)" v-c-tooltip="'Delete'" aria-label="Delete">
                            <CIcon name="cil-trash" />
                        </CButton>
                    </div>
                </td>
            </template>

            <!-- Custom empty state -->
            <template #empty>
                <tr>
                    <td :colspan="fields.length" class="text-center py-5">
                        <div class="h5 mb-2">No questionnaires yet. Create one to get started.</div>
                        <div class="text-muted">Create one to get started.</div>
                    </td>
                </tr>
            </template>
        </CDataTable>

        <!-- Pagination -->
        <Pagination :activePage.sync="activePage" :pages="totalPages" />

        <!-- Confirm Delete modal -->
        <CModal class="delete-modal" :show.sync="deleteModal" :centered="true">
            <template #header-wrapper>
                <div class="align-items-start p-3">
                    <div class="d-flex flex-column align-items-center">
                        <div class="modal-icon-wrapper m-1">
                            <CIcon name="cil-x" class="text-danger" />
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
                    <CButton color="secondary" class="btn-cancel" @click="deleteModal = false">
                        {{ $t('modal.cancel') }}
                    </CButton>
                    <CButton color="danger" class="ml-2 btn-confirm" @click="confirmDelete()">
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
        fields() {
            return [
                { key: 'title', label: this.$t('table.questionnaire'), _style: 'width:20%' },
                { key: 'access', label: this.$t('table.access'), _style: 'width:10%' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:15%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:10%' },
                { key: 'responses', label: this.$t('table.responses'), _style: 'width:20%' },
                { key: 'createBy', label: this.$t('table.createdBy'), _style: 'width:10%' },
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
            const raw = this.items || [];

            // Normalize items into display rows
            const mapped = raw.map(f => {
                if (!f) return { isEmpty: true };

                // Title extraction
                let title = '-';
                if (Array.isArray(f.title) && f.title.length > 0) {
                    const en = f.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                    title = en ? (en.value || '-') : (f.title[0] && f.title[0].value) || '-';
                } else if (typeof f.title === 'string' && f.title.trim()) title = f.title;
                else if (f.title && typeof f.title === 'object') title = f.title.value || '-';

                // Description
                let description = '-';
                if (Array.isArray(f.description) && f.description.length > 0) {
                    const en = f.description.find(d => d && d.key && d.key.toLowerCase() === 'en');
                    description = en ? (en.value || '-') : (f.description[0] && f.description[0].value) || '-';
                } else if (typeof f.description === 'string' && f.description.trim()) description = f.description;
                else if (f.description && typeof f.description === 'object') description = f.description.value || '-';

                // Created By / Organization (extract name + email)
                let createdBy = '-';
                let createdName = '-';
                let createdEmail = '';
                if (f.creator) {
                    if (typeof f.creator === 'string') {
                        createdBy = f.creator;
                        createdName = f.creator;
                    } else if (typeof f.creator === 'object') {
                        createdName = f.creator.name || f.creator.fullname || f.creator.email || '-';
                        createdEmail = f.creator.email || '';
                        createdBy = createdName || createdEmail || '-';
                    }
                } else if (f.createdBy) {
                    if (typeof f.createdBy === 'string') {
                        createdBy = f.createdBy;
                        createdName = f.createdBy;
                    } else if (typeof f.createdBy === 'object') {
                        createdName = f.createdBy.name || f.createdBy.email || '-';
                        createdEmail = f.createdBy.email || '';
                        createdBy = createdName || createdEmail || '-';
                    }
                }
                let organization = '-';
                if (f.organization) {
                    if (typeof f.organization === 'string') organization = f.organization;
                    else if (typeof f.organization === 'object') organization = f.organization.name || f.organization.title || '-';
                }

                // Time Range
                let timeRange = '-';
                let daysLeft = '';
                if (f.schedule && (f.schedule.startAt || f.schedule.endAt)) {
                    const startAt = f.schedule.startAt ? new Date(f.schedule.startAt).toLocaleDateString() : '';
                    const endAt = f.schedule.endAt ? new Date(f.schedule.endAt).toLocaleDateString() : '';
                    timeRange = startAt || endAt ? `${startAt}${endAt ? ' - ' + endAt : ''}` : '-';
                    if (f.schedule.endAt) {
                        const diff = Math.ceil((new Date(f.schedule.endAt) - new Date()) / (1000 * 60 * 60 * 24));
                        daysLeft = diff > 0 ? `${diff} days left` : 'Closed';
                    }
                } else if (f.timeRange && typeof f.timeRange === 'string') {
                    timeRange = f.timeRange;
                }

                // Status: derive from schedule if available (Draft / Active / Closed)
                let status = 'Draft';
                const now = new Date();
                const hasStart = f.schedule && f.schedule.startAt;
                const hasEnd = f.schedule && f.schedule.endAt;
                if (hasStart || hasEnd) {
                    const start = hasStart ? new Date(f.schedule.startAt) : null;
                    const end = hasEnd ? new Date(f.schedule.endAt) : null;

                    // If current time is outside the set range, it's Closed
                    if ((start && now < start) || (end && now > end)) {
                        status = 'Closed';
                    } else {
                        status = 'Active';
                    }
                } else if (f.status) {
                    // fallback to existing status field if schedule not present
                    if (typeof f.status === 'string') status = f.status;
                    else if (typeof f.status === 'object') status = f.status.type || f.status.name || 'Pending';
                }
                else {
                    // no schedule or explicit status -> default to Draft
                    status = 'Draft';
                }

                // Access/Visibility Logic (Extract plain names from populated objects or strings)
                const rawOrgs = f.organization || [];
                let access = [];

                const orgNames = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => {
                    if (!o) return null;
                    if (typeof o === 'string') return o;
                    if (typeof o === 'object') {
                        // Support the multi-language title structure
                        if (Array.isArray(o.title)) {
                            const en = o.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                            return en ? en.value : (o.title[0] ? o.title[0].value : null);
                        }
                        return o.name || o.title || o.value || null;
                    }
                    return null;
                }).filter(Boolean);

                if (orgNames.includes('General')) {
                    access = ['Public'];
                } else if (orgNames.length > 0) {
                    access = orgNames;
                } else {
                    // No organizations assigned = Private
                    access = ['Private'];
                }

                // Responses array
                const responses = Array.isArray(f.responses) ? f.responses : [];

                return {
                    _id: f._id,
                    title,
                    description,
                    createdBy,
                    createdName: createdName || createdBy || '-',
                    createdEmail: createdEmail || '',
                    organization,
                    timeRange,
                    daysLeft,
                    access,
                    status,
                    responses,
                    isEmpty: false,
                    _raw: f
                };
            });

            // apply quick date / from-to filtering (based on schedule)
            let filtered = mapped;
            if (this.startDate || this.endDate) {
                const start = this.startDate ? new Date(this.startDate + 'T00:00:00') : new Date(-8640000000000000);
                const end = this.endDate ? new Date(this.endDate + 'T23:59:59') : new Date(8640000000000000);
                filtered = filtered.filter(f => {
                    if (!f) return false;
                    // attempt to find original schedule on the source item (stored in responses mapping)
                    const rawSched = f._raw && f._raw.schedule ? f._raw.schedule : null;
                    const s = rawSched && rawSched.startAt ? new Date(rawSched.startAt) : null;
                    const e = rawSched && rawSched.endAt ? new Date(rawSched.endAt) : null;
                    const formStart = s || e;
                    const formEnd = e || s;
                    if (!formStart && !formEnd) return false;
                    return (formStart <= end) && (formEnd >= start);
                });
            }

            // apply status filter
            if (this.selectedStatus !== 'All') filtered = filtered.filter(f => f.status === this.selectedStatus);

            // search
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(f => {
                    return (f.title && f.title.toString().toLowerCase().includes(q)) ||
                        (f.organization && f.organization.toString().toLowerCase().includes(q)) ||
                        (f.createdBy && f.createdBy.toString().toLowerCase().includes(q));
                });
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
            this.activePage = 1; // Reset pagination when filter changes
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'active') return 'status-active';
            if (s === 'closed') return 'status-closed';
            return 'status-pending';
        },
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = String(visibility).toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ') || v === 'general') return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            // Default class for organizations
            return 'visi-org';
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
                const formId = item._id || (item._raw ? item._raw._id : null) || item.id;

                if (!formId) {
                    console.error("Could not find a valid ID to delete the form.");
                    return;
                }

                await this.$store.dispatch('Forms/delete', { _id: formId });
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
    overflow: hidden;
}

.text-muted {
    color: #94a3b8 !important;
}

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

.status-active {
    background-color: #d1fae5;
    color: #065f46;
}

.status-active .status-dot {
    background-color: #059669;
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

.access-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
}

.visibility-badge {
    display: inline-flex;
    padding: 0.25em 0.8em;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}

.visi-public {
    background-color: #ecfdf5;
    color: #059669;
}

.visi-private {
    background-color: #fff1f2;
    color: #e11d48;
}

.visi-org {
    background-color: #f0f7ff;
    color: #1e40af;
}

.visi-default {
    background-color: #f1f5f9;
    color: #64748b;
}

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

.delete-modal>>>.modal-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background-color: #ffffff;
    border: 1px solid #dc2626;
    color: #dc2626;
}

.delete-modal>>>.modal-icon-wrapper .c-icon {
    font-size: 20px;
}

.delete-modal .btn-cancel {
    background-color: #f1f5f9 !important;
    border: 1px solid #cbd5e1 !important;
    color: #475569 !important;
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
}

.delete-modal .btn-confirm {
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
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
</style>