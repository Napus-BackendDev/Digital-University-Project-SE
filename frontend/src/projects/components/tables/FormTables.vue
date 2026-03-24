<template>
    <div>
        <!-- Filter Toolbar Refactored -->
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate"
            :endDate.sync="endDate" />

        <CDataTable :items="tableData" :fields="fields" :items-per-page="itemsPerPage" :activePage.sync="activePage"
            :pagination="false" hover class="mb-0 tables-container"
            :no-items-view="{ noItems: $t('table.noForms') }">

            <!-- Form Name (Title & Description) Slot -->
            <template #form="{ item }">
                <td class="align-middle">
                    <div class="font-weight-bold text-dark" style="font-size: 0.95rem;">{{ item.title }}</div>
                    <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                </td>
            </template>

            <!-- Create By Slot (match ManagementTables) -->
            <template #createBy="{ item }">
                <td class="align-middle">
                    <div class="small text-dark font-weight-bold">{{ item.createdName || '-' }}</div>
                    <div class="small text-muted mt-1" v-if="item.createdEmail">{{ item.createdEmail }}</div>
                </td>
            </template>

            <!-- Access Slot -->
            <template #access="{ item }">
                <td class="align-middle">
                    <div class="access-stack">
                        <span v-for="(v, idx) in item.access" :key="idx" class="visibility-badge"
                            :class="getVisibilityClass(v)">
                            {{ $t('accessLabel.' + v.toLowerCase()) }}
                        </span>
                    </div>
                </td>
            </template>

            <!-- Time Range Slot (match ManagementTables) -->
            <template #timeRange="{ item }">
                <td class="align-middle">
                    <div class="small text-dark font-weight-bold">{{ item.timeRange || '-' }}</div>
                    <div class="small text-muted mt-1" v-if="item.daysLeft">{{ item.daysLeft }}</div>
                </td>
            </template>

            <!-- Status Slot (match ManagementTables display) -->
            <template #status="{ item }">
                <td class="align-middle">
                    <span v-if="item && item.status" class="status-badge" :class="getStatusClass(item.status)">
                        <span class="status-dot"></span>
                        {{ $t('status.' + item.status.toLowerCase().replace(/\s/g, '')) }}
                    </span>
                </td>
            </template>

            <template #progress="{ item }">
                <td class="align-middle">
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
                <td class="align-middle text-right pr-4">
                    <div class="d-flex align-items-center justify-content-end">
                        <CIcon v-if="item.requireEmail" name="cil-warning" class="text-danger mr-2" style="width: 20px;"
                            v-c-tooltip="$t('table.emailRequired')" />
                        <!-- Case 1: Form allows multiple responses AND is already completed -> Show "Add more" -->
                        <template
                            v-if="item._raw && item._raw.settings && item._raw.settings.limitResponse === false && item.status && item.status.toLowerCase() === 'completed'">
                            <CButton color="success" variant="ghost" class="action-icon-btn plus-btn"
                                @click.stop="goToForm(item._id, true)" v-c-tooltip="$t('table.addAnswer')">
                                <div class="plus-circle">
                                    <CIcon name="cil-plus" />
                                </div>
                            </CButton>
                        </template>

                        <!-- Case 2: In-progress forms OR forms limited to one response -->
                        <template v-else>
                            <CButton :color="getActionColor(item.status)" variant="ghost" class="p-2 action-icon-btn"
                                :disabled="item.status && item.status.toLowerCase() === 'completed'"
                                @click.stop="goToForm(item._id)" v-c-tooltip="getActionTooltip(item.status)">
                                <CIcon :name="getActionIcon(item.status)" size="lg" />
                            </CButton>
                        </template>
                    </div>
                </td>
            </template>
        </CDataTable>

        <!-- Pagination -->
        <Pagination :activePage.sync="activePage" :pages="totalPages" />
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
                { key: 'access', label: this.$t('table.access'), _style: 'width:15%' },
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

                let title = this.getLang(f.title) || this.$t('common.untitled');
                let description = this.getLang(f.description) || '-';

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

                let timeRange = '-';
                let daysLeft = '';
                if (f.schedule && (f.schedule.startAt || f.schedule.endAt)) {
                    const locale = this.$i18n.locale === 'th' ? 'th-TH' : 'en-US';
                    const startAt = f.schedule.startAt ? new Date(f.schedule.startAt).toLocaleDateString(locale) : '';
                    const endAt = f.schedule.endAt ? new Date(f.schedule.endAt).toLocaleDateString(locale) : '';
                    timeRange = startAt || endAt ? `${startAt}${endAt ? ' - ' + endAt : ''}` : '-';
                    if (f.schedule.endAt) {
                        const diff = Math.ceil((new Date(f.schedule.endAt) - new Date()) / (1000 * 60 * 60 * 24));
                        daysLeft = diff > 0 ? `${diff} ${this.$t('table.daysLeft')}` : this.$t('table.closed');
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

                    if (userResponse.submit === true) {
                        status = 'Completed';
                        progress = 100;
                    } else {
                        status = 'In Progress';
                    }
                }

                const rawOrgs = f.organization || [];
                let access = [];

                const orgNames = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => {
                    if (!o) return null;
                    if (typeof o === 'string') return o;
                    if (typeof o === 'object') {
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

            let filtered = mapped;
            if ((this.startDate && this.startDate.trim() !== '') || (this.endDate && this.endDate.trim() !== '')) {
                const filterStart = this.startDate ? new Date(`${this.startDate}T00:00:00`) : new Date(-8640000000000000);
                const filterEnd = this.endDate ? new Date(`${this.endDate}T23:59:59`) : new Date(8640000000000000);

                filtered = filtered.filter(row => {
                    const raw = row._raw || {};
                    const sched = raw.schedule || {};

                    const s = sched.startAt ? new Date(sched.startAt) : null;
                    const e = sched.endAt ? new Date(sched.endAt) : null;

                    if (!s && !e) return false;

                    const formStart = s || new Date(-8640000000000000);
                    const formEnd = e || new Date(8640000000000000);

                    return (formStart <= filterEnd) && (formEnd >= filterStart);
                });
            }
            if (this.selectedStatus && this.selectedStatus !== 'All') {
                filtered = filtered.filter(f => f.status === this.selectedStatus);
            }

            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(f => {
                    return f.title && f.title.toString().toLowerCase().includes(q);
                });
            }

            const now = new Date();
            filtered = filtered.filter(f => {
                const sched = (f._raw && f._raw.schedule) ? f._raw.schedule : {};
                if (!sched.startAt && !sched.endAt) return false;

                let isInTimeRange = true;
                if (sched.startAt && now < new Date(sched.startAt)) isInTimeRange = false;
                if (sched.endAt && now > new Date(sched.endAt)) isInTimeRange = false;

                return isInTimeRange;
            });

            return filtered;
        },
        stats() {
            const data = this.tableData || [];

            let total = data.length;
            let pending = data.filter(f => f.status === 'Pending').length;
            let completed = data.filter(f => f.status === 'Completed').length;
            let inProgress = data.filter(f => f.status === 'In Progress').length;

            return { total, pending, completed, inProgress };
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
        async goToForm(id, isNew = false) {
            if (!id) return;
            const query = { source: 'internal' };
            if (isNew) query.new = 'true';
            this.$router.push({ name: 'FormFill', params: { id: id }, query: query });
        },
        filterStatus(status) {
            this.selectedStatus = status;
            this.activePage = 1;
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'completed') return 'status-completed';
            if (s === 'in progress') return 'status-inprogress';
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
            if (s === 'pending') return 'primary';
            return 'warning';
        },
        getActionIcon(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'completed') return 'cil-check-circle';
            if (s === 'in progress' || s === 'inprogress') return 'cil-pencil';
            return 'cil-input';
        },
        getActionTooltip(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'completed') return this.$t('table.viewAnswer');
            if (s === 'in progress' || s === 'inprogress') return this.$t('table.continueForm');
            return this.$t('table.startForm');
        }
    }
}
</script>

<style scoped>
.tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    padding: 0;
    overflow: hidden;
}

.text-lg {
    font-size: 0.95rem;
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

.status-completed {
    background-color: #d1fae5;
    color: #065f46;
}

.status-completed .status-dot {
    background-color: #059669;
}

.status-pending {
    background-color: #dbeafe;
    color: #1e40af;
}

.status-pending .status-dot {
    background-color: #2563eb;
}

.status-inprogress {
    background-color: #fef9c3;
    color: #854d0e;
}

.status-inprogress .status-dot {
    background-color: #eab308;
}

.plus-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: white;
    background-color: #ecfdf5;
    border: 1.5px solid #10b981;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.plus-btn:hover .plus-circle {
    border-color: #3C4B64;
    color: #3C4B64;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

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
    background-color: #f8fafc;
}

.action-icon-btn {
    width: 38px;
    height: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.action-icon-btn:hover {
    background-color: #f1f5f9;
    color: #3c4b64;
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
</style>
```