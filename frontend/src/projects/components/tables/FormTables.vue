<template>
    <div>
        <!-- Filter Toolbar Refactored -->
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate"
            :endDate.sync="endDate" />

        <div class="user-tables-container">
            <CDataTable :items="tableData" :fields="fields" :items-per-page="itemsPerPage" :activePage.sync="activePage"
                :pagination="false" hover class="mb-0 custom-table"
                :no-items-view="{ noItems: 'No questionnaires yet. Create one to get started.' }">

                <!-- Form Name (Title & Description) Slot -->
                <template #form="{ item }">
                    <td class="py-3">
                        <div class="font-weight-bold text-dark" style="font-size: 0.95rem;">{{ item.title }}</div>
                        <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                    </td>
                </template>

                <!-- Create By Slot (match ManagementTables) -->
                <template #createBy="{ item }">
                    <td class="py-3">
                        <div class="small text-dark font-weight-bold">{{ item.createdName || '-' }}</div>
                        <div class="small text-muted mt-1" v-if="item.createdEmail">{{ item.createdEmail }}</div>
                    </td>
                </template>

                <!-- Access Slot -->
                <template #access="{ item }">
                    <td class="py-3">
                        <div class="access-stack">
                            <span v-for="(v, idx) in item.access" :key="idx" 
                                  class="visibility-badge" :class="getVisibilityClass(v)">
                                {{ v }}
                            </span>
                        </div>
                    </td>
                </template>

                <!-- Time Range Slot (match ManagementTables) -->
                <template #timeRange="{ item }">
                    <td class="py-3">
                        <div class="small text-dark font-weight-bold">{{ item.timeRange || '-' }}</div>
                        <div class="small text-muted mt-1" v-if="item.daysLeft">{{ item.daysLeft }}</div>
                    </td>
                </template>

                <!-- Status Slot (match ManagementTables display) -->
                <template #status="{ item }">
                    <td class="py-3">
                        <span v-if="item && item.status" class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-dot"></span>
                            {{ item.status }}
                        </span>
                    </td>
                </template>

                <template #progress="{ item }">
                    <td class="py-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1 mr-3" v-if="typeof item.progress === 'number'">
                                <CProgress :value="item.progress" :color="getProgressColor(item.progress)" height="6px"
                                    class="progress-xs" />
                            </div>
                            <div class="small font-weight-bold text-dark" v-if="typeof item.progress === 'number'">{{
                                item.progress }}%</div>
                            <div class="small font-weight-bold text-dark" v-else>-</div>
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
    async created() {
    },
    computed: {
        fields() {
            return [
                { key: 'form', label: this.$t('table.questionnaire'), _style: 'width:22%' },
                { key: 'access', label: 'Access', _style: 'width:15%' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:18%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:12%' },
                { key: 'progress', label: this.$t('table.progress'), _style: 'width:12%' },
                { key: 'createBy', label: this.$t('table.createdBy'), _style: 'width:13%' },
                { key: 'action', label: this.$t('table.action'), _style: 'width:8%; text-align:right' }
            ]
        },
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user']),

        totalPages() {
            return Math.max(1, Math.ceil(this.tableData.length / this.itemsPerPage))
        },

        tableData() {
            if (!this.forms || this.forms.length === 0) return [];
            console.log(JSON.parse(JSON.stringify(this.forms))); // log raw forms data for debugging
            
            const currentUser = this.user;

            const mapped = this.forms.map(f => {
                if (!f) f = {};
                const missingFields = [];

                // Title: robust support, default to '-'
                let title = '-';
                if (Array.isArray(f.title) && f.title.length > 0) {
                    const en = f.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                    title = en ? (en.value || '-') : (f.title[0] && f.title[0].value) || '-';
                } else if (typeof f.title === 'string' && f.title.trim()) {
                    title = f.title;
                } else if (f.title && typeof f.title === 'object') {
                    title = f.title.value || f.title.en || '-';
                } else {
                    missingFields.push('title');
                }

                // Description
                let description = '-';
                if (Array.isArray(f.description) && f.description.length > 0) {
                    const en = f.description.find(d => d && d.key && d.key.toLowerCase() === 'en');
                    description = en ? (en.value || '-') : (f.description[0] && f.description[0].value) || '-';
                } else if (typeof f.description === 'string' && f.description.trim()) {
                    description = f.description;
                } else if (f.description && typeof f.description === 'object') {
                    description = f.description.value || '-';
                } else {
                    // description is optional but show '-' if absent
                    description = '-';
                }

                // Organization
                let organization = '-';
                if (f.organization) {
                    if (typeof f.organization === 'string' && f.organization.trim()) organization = f.organization;
                    else if (typeof f.organization === 'object') organization = f.organization.name || f.organization.title || '-';
                } else {
                    missingFields.push('organization');
                }

                // Created By (extract name and email separately)
                let createdName = '-';
                let createdEmail = '';
                if (f.creator) {
                    if (typeof f.creator === 'string' && f.creator.trim()) createdName = f.creator;
                    else if (typeof f.creator === 'object') {
                        createdName = f.creator.name || f.creator.fullname || f.creator.email || '-';
                        createdEmail = f.creator.email || '';
                    }
                } else if (f.createdBy) {
                    if (typeof f.createdBy === 'string' && f.createdBy.trim()) createdName = f.createdBy;
                    else if (typeof f.createdBy === 'object') {
                        createdName = f.createdBy.name || f.createdBy.email || '-';
                        createdEmail = f.createdBy.email || '';
                    }
                } else {
                    missingFields.push('createdBy');
                }

                // Time Range: show schedule start - end and compute daysLeft
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
                } else if (f.timeRange && typeof f.timeRange === 'string' && f.timeRange.trim()) {
                    timeRange = f.timeRange;
                } else {
                    missingFields.push('timeRange');
                }

                // Determine total questions if available
                let totalQuestions = null;
                if (Array.isArray(f.questions)) totalQuestions = f.questions.length;
                else if (typeof f.questions === 'number') totalQuestions = f.questions;
                else if (Array.isArray(f.questionIds)) totalQuestions = f.questionIds.length;

                // Identify the user's specific response and its 'submit' status
                // Identify the user's response from their profile list
                const userObj = currentUser || {};
                const userResponses = userObj.response || []; // Populated from backend earlier
                
                let status = 'Pending';
                let progress = 0;
                let userAnswerCount = 0;

                // Match response by form ID
                const userResponse = userResponses.find(r => {
                    if (!r || !r.form) return false;
                    const resFormId = (typeof r.form === 'object' ? r.form._id : r.form).toString();
                    return resFormId === f._id.toString();
                });

                if (userResponse) {
                    // 1. Determine total questions from the form linked in the response
                    const nestedForm = userResponse.form || {};
                    if (Array.isArray(nestedForm.questions)) {
                        totalQuestions = nestedForm.questions.length;
                    } else if (Array.isArray(nestedForm.questionIds)) {
                        totalQuestions = nestedForm.questionIds.length;
                    }

                    // 2. Count valid answers (where response is not null/empty/placeholder)
                    if (Array.isArray(userResponse.answers)) {
                        userAnswerCount = userResponse.answers.filter(a => {
                            if (!a || a.response === null || a.response === undefined) return false;
                            const resStr = String(a.response).trim();
                            return resStr !== '' && resStr !== 'null' && resStr !== 'undefined' && resStr !== '[]';
                        }).length;
                    }
                    
                    if (totalQuestions > 0) {
                        progress = Math.min(100, Math.round((userAnswerCount / totalQuestions) * 100));
                    }

                    // Status based on submit field
                    if (userResponse.submit === true) {
                        status = 'Completed';
                        progress = 100;
                    } else {
                        status = 'InProgress';
                    }
                }

                // Access Logic (match ManagementTables)
                const rawOrgs = f.organization || [];
                let access = [];

                // Extract plain names from populated objects or strings
                const orgNames = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => {
                    if (!o) return null;
                    if (typeof o === 'string') return o;
                    if (typeof o === 'object') {
                        // Support the multi-language title structure
                        if (Array.isArray(o.title)) {
                            const en = o.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                            return en ? en.value : (o.title[0] ? o.title[0].value : null);
                        }
                        return o.name || o.value || o.title || null;
                    }
                    return null;
                }).filter(Boolean);

                if (orgNames.includes('General')) {
                    access = ['Public'];
                } else if (orgNames.length > 0) {
                    access = orgNames;
                } else {
                    access = ['Private'];
                }

                const createdAt = f.updatedAt || f.createdAt || '-';

                return {
                    _id: f._id,
                    title: title || '-',
                    description: description || '-',
                    status: status || '-',
                    timeRange: timeRange || '-',
                    daysLeft: daysLeft || '',
                    progress: (typeof progress === 'number') ? progress : 0,
                    organization: organization || '-',
                    createdAt,
                    createdBy: createdName || createdEmail || '-',
                    createdName: createdName || '-',
                    createdEmail: createdEmail || '',
                    access: access,
                    _raw: f
                };
            });

            // apply Quick Range / From-To date filtering if provided (based on schedule overlap)
            let filtered = mapped;
            if (this.startDate || this.endDate) {
                const start = this.startDate ? new Date(this.startDate + 'T00:00:00') : new Date(-8640000000000000);
                const end = this.endDate ? new Date(this.endDate + 'T23:59:59') : new Date(8640000000000000);
                filtered = filtered.filter(row => {
                    const raw = row._raw || {};
                    const s = raw.schedule && raw.schedule.startAt ? new Date(raw.schedule.startAt) : null;
                    const e = raw.schedule && raw.schedule.endAt ? new Date(raw.schedule.endAt) : null;
                    const formStart = s || e;
                    const formEnd = e || s;
                    if (!formStart && !formEnd) return false;
                    return (formStart <= end) && (formEnd >= start);
                });
            }

            // apply status filter (same behavior as ManagementTables)
            if (this.selectedStatus && this.selectedStatus !== 'All') {
                filtered = filtered.filter(f => f.status === this.selectedStatus);
            }

            // apply search filter (title, organization, createdBy)
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(f => {
                    return (f.title && f.title.toString().toLowerCase().includes(q)) ||
                        (f.organization && f.organization.toString().toLowerCase().includes(q)) ||
                        (f.createdBy && f.createdBy.toString().toLowerCase().includes(q));
                });
            }

            // apply final default filtering:
            // 1. Hide if no schedule is provided (always)
            // 2. If 'Completed', always show for historical records 
            // 3. Otherwise, only show if current time is within [startAt, endAt]
            const now = new Date();
            filtered = filtered.filter(f => {
                const sched = (f._raw && f._raw.schedule) ? f._raw.schedule : {};
                
                // Always hide if no schedule at all (requested)
                if (!sched.startAt && !sched.endAt) return false;

                // Always show completed questionnaires
                if (f.status === 'Completed') return true;

                // Check if current time is within schedule
                let isInTimeRange = true;
                if (sched.startAt && now < new Date(sched.startAt)) isInTimeRange = false;
                if (sched.endAt && now > new Date(sched.endAt)) isInTimeRange = false;
                
                return isInTimeRange;
            });

            return filtered;
        },
        stats() {
            const fallback = { total: 0, pending: 0, completed: 0, inProgress: 0 };
            if (!this.forms || !Array.isArray(this.forms)) return fallback;
            
            const currentUser = this.user;
            const userResponses = currentUser?.response || [];
            const now = new Date();

            let total = 0;
            let pending = 0;
            let completed = 0;
            let inProgress = 0;

            this.forms.forEach(f => {
                if (!f) return;
                
                // UNIFIED LOGIC: Match tableData's schedule and status detection
                const sched = f.schedule || {};
                const start = sched.startAt ? new Date(sched.startAt) : null;
                const end = sched.endAt ? new Date(sched.endAt) : null;
                
                // Identify Status based on User's response list
                let s = 'Pending';
                const userRes = userResponses.find(r => {
                    if (!r || !r.form) return false;
                    const resFormId = (typeof r.form === 'object' ? (r.form._id || r.form.id) : r.form).toString();
                    return resFormId === (f._id || f.id).toString();
                });

                if (userRes) {
                    if (userRes.submit === true) s = 'Completed';
                    else s = 'InProgress';
                }

                // UNIFIED LOGIC: Determine if it's currently live or historially completed
                let isLive = true;
                if (start && now < start) isLive = false;
                if (end && now > end) isLive = false;

                // Requirement: Must have schedule dates to be counted at all
                if (start || end) {
                    // Only count if it's currently live OR it's already completed
                    if (s === 'Completed' || isLive) {
                        total++;
                        if (s === 'Completed') completed++;
                        else if (s === 'InProgress') inProgress++;
                        else pending++;
                    }
                }
            });
            const result = { total, pending, completed, inProgress };
            return result;
        }
    },
    watch: {
        stats: {
            immediate: true,
            handler(newVal) {
                this.$emit('update-stats', newVal);
            }
        }
    },
    methods: {
        goToFormRecord(item) {
            if (item) {
                this.goToForm(item._id);
            }
        },
        async goToForm(id) {
            if (!id) return;
            this.$router.push({ name: 'FormFill', params: { id: id }, query: { source: 'internal' } });
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
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = String(visibility).toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ') || v === 'general') return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            return 'visi-org';
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
            if (s === 'completed') return 'View Summary';
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
    table-layout: fixed !important;
    width: 100% !important;
}

::v-deep .custom-table table td {
    overflow: hidden;
    text-overflow: ellipsis;
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

/* Visibility Badges for Access column */
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

/* Remove bottom border from the very last row */
::v-deep .custom-table tbody tr:last-child td {
    border-bottom: none !important;
}
</style>
```