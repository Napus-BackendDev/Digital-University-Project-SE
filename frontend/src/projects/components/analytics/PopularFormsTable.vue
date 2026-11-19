<template>
    <CRow>
        <CCol lg="12">
            <div class="response-trends-container">
                <div class="d-flex justify-content-between align-items-center flex-wrap mb-3" style="gap: 10px;">
                    <div class="d-flex align-items-center" style="gap: 10px;">
                        <h4 class="m-0 font-weight-bold">{{ $t('analytics.popularForms') }}</h4>
                        <span class="count-pill">{{ tableItems.length }}</span>
                    </div>
                    <div class="d-flex align-items-center sort-header-wrap">
                        <label class="sort-header-label mb-0 mr-2">{{ $t('analytics.sortLabel') }}</label>
                        <select v-model="sortBy" class="form-control sort-select" :aria-label="$t('analytics.sortMostResponses')">
                            <option value="responses">{{ $t('analytics.sortMostResponses') }}</option>
                            <option value="lowestRate">{{ $t('analytics.sortLowestRate') }}</option>
                            <option value="closingSoon">{{ $t('analytics.sortClosingSoonest') }}</option>
                            <option value="title">{{ $t('analytics.sortTitleAsc') }}</option>
                        </select>
                    </div>
                </div>

                <!-- Unified Filter & Search Toolbar (Matches /forms & /manage via shared FilterTable) -->
                <FilterTable
                    class="mb-3"
                    :searchQuery="searchQuery"
                    :selectedStatus="activeStatusFilter"
                    :statusOptions="statusFilterOptions"
                    :startDate.sync="startDate"
                    :endDate.sync="endDate"
                    @update:searchQuery="$emit('update:searchQuery', $event)"
                    @update:selectedStatus="selectStatusTab"
                />

                <CDataTable
                    :items="loading ? [] : pagedItems"
                    :fields="tableFields"
                    :loading="loading"
                    :hover="!loading && tableItems.length > 0"
                    class="mb-0 tables-container mobile-card-table"
                    :class="{ 'table-empty': !loading && tableItems.length === 0 }"
                    @row-clicked="openFormReport"
                >
                    <template #loading>
                        <TableLoading borderless />
                    </template>

                    <template #no-items-view>
                        <EmptyState
                            borderless
                            icon="cil-chart-line"
                            :title="$t('table.noItems')"
                            :description="$t('analytics.dailyResponsesDesc')"
                        />
                    </template>

                    <!-- Form Name Slot -->
                    <template #formName="{ item }">
                        <td class="py-3 pl-3 text-dark clickable-cell" @click="openFormReport(item)">
                            <div class="font-weight-bold text-primary-hover line-clamp-2" style="font-size: 0.95rem; margin-bottom: 2px;" :title="item.formName">
                                {{ item.formName }}
                            </div>
                            <div v-if="item.description" class="text-muted small desc-clamp line-clamp-2" :title="item.description">
                                {{ item.description }}
                            </div>
                        </td>
                    </template>

                    <!-- Access Slot (1 compact pill + grouped dropdown, no scrollbar) -->
                    <template #access="{ item }">
                        <td class="align-middle py-3">
                            <div class="d-flex align-items-center">
                                <span
                                    v-if="!getAccessSummary(item).hasDropdown"
                                    class="visibility-badge text-truncate-pill"
                                    :class="getAccessSummary(item).badgeClass"
                                    :title="getAccessSummary(item).tooltip"
                                >
                                    <CIcon :name="getAccessSummary(item).icon" size="sm" class="mr-2 flex-shrink-0" />
                                    <span class="text-truncate">{{ getAccessSummary(item).label }}</span>
                                </span>

                                <CDropdown
                                    v-else
                                    variant="ghost"
                                    size="sm"
                                    class="m-0 p-0 custom-dropdown"
                                    placement="bottom-start"
                                    :customPopperOptions="{ placement: 'bottom-start', strategy: 'fixed', modifiers: [{ name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } }] }"
                                    @click.native.stop
                                >
                                    <template #toggler-content>
                                        <div
                                            class="visibility-badge cursor-pointer text-truncate-pill"
                                            :class="getAccessSummary(item).badgeClass"
                                            :title="getAccessSummary(item).tooltip"
                                        >
                                            <CIcon :name="getAccessSummary(item).icon" size="sm" class="mr-2 flex-shrink-0" />
                                            <span class="text-truncate">{{ getAccessSummary(item).label }}</span>
                                            <CIcon name="cil-chevron-bottom" size="sm" class="ml-2 dropdown-caret flex-shrink-0" />
                                        </div>
                                    </template>
                                    <div class="dropdown-menu-scrollable access-grouped-menu" @click.stop>
                                        <template v-if="getAccessSummary(item).orgs.length > 0">
                                            <div class="dropdown-section-header px-3 py-2 border-bottom">
                                                {{ $t('table.accessGroups.orgs') }}
                                            </div>
                                            <CDropdownItem v-for="(acc, i) in getAccessSummary(item).orgs" :key="'org-' + i" class="p-0 border-bottom">
                                                <div class="px-3 py-2 d-flex align-items-center w-100" style="min-width: 200px;">
                                                    <CIcon
                                                        :name="(acc === 'Public' || acc === 'Publicly') ? 'cil-globe-alt' : 'cil-bank'"
                                                        size="sm"
                                                        class="mr-2 flex-shrink-0"
                                                        :class="(acc === 'Public' || acc === 'Publicly') ? 'text-success' : 'text-info'"
                                                    />
                                                    <span class="small font-weight-bold text-dark text-truncate">{{ formatAccessLabel(acc) }}</span>
                                                </div>
                                            </CDropdownItem>
                                        </template>
                                        <template v-if="getAccessSummary(item).users.length > 0">
                                            <div class="dropdown-section-header px-3 py-2 border-bottom">
                                                {{ $t('table.accessGroups.users') }}
                                            </div>
                                            <CDropdownItem v-for="(userName, i) in getAccessSummary(item).users" :key="'user-' + i" class="p-0 border-bottom">
                                                <div class="px-3 py-2 d-flex align-items-center w-100" style="min-width: 200px;">
                                                    <CIcon name="cil-user" size="sm" class="mr-2 text-primary flex-shrink-0" />
                                                    <span class="small font-weight-bold text-dark text-truncate">{{ userName }}</span>
                                                </div>
                                            </CDropdownItem>
                                        </template>
                                        <template v-if="getAccessSummary(item).roles.length > 0">
                                            <div class="dropdown-section-header px-3 py-2 border-bottom">
                                                {{ $t('table.accessGroups.roles') }}
                                            </div>
                                            <CDropdownItem v-for="(roleName, i) in getAccessSummary(item).roles" :key="'role-' + i" class="p-0 border-bottom last-border-0">
                                                <div class="px-3 py-2 d-flex align-items-center w-100" style="min-width: 200px;">
                                                    <CIcon name="cil-shield-alt" size="sm" class="mr-2 text-primary flex-shrink-0" />
                                                    <span class="small font-weight-bold text-dark text-truncate">{{ roleName }}</span>
                                                </div>
                                            </CDropdownItem>
                                        </template>
                                    </div>
                                </CDropdown>
                            </div>
                        </td>
                    </template>

                    <!-- Response Rate Slot (clear Completed / Target, rate %, Pending, Ongoing) -->
                    <template #responses="{ item }">
                        <td class="align-middle py-3">
                            <div class="d-flex flex-column" style="gap: 5px; min-width: 145px; max-width: 200px;">
                                <div class="d-flex align-items-center justify-content-between">
                                    <span class="font-weight-bold text-dark small">
                                        {{ item.completedCount }}
                                        <span v-if="item.targetCount > 0" class="text-muted font-weight-normal">/ {{ item.targetCount }}</span>
                                        {{ $t('table.completed') }}
                                    </span>
                                    <span v-if="item.responseRate !== null" class="rate-badge ml-2">{{ item.responseRate }}%</span>
                                </div>
                                <div v-if="item.targetCount > 0" class="mini-progress-track">
                                    <div
                                        class="mini-progress-fill"
                                        :style="{ width: Math.min(100, item.responseRate || 0) + '%' }"
                                    ></div>
                                </div>
                                <div class="d-flex align-items-center text-muted" style="font-size: 0.8125rem; gap: 6px;">
                                    <span v-if="item.targetCount > 0">
                                        <strong class="text-dark">{{ Math.max(0, item.targetCount - item.completedCount) }}</strong> {{ $t('status.pending') }}
                                    </span>
                                    <span v-if="item.targetCount > 0 && item.ongoingCount > 0">·</span>
                                    <span v-if="item.ongoingCount > 0" class="text-warning-dark font-weight-bold">
                                        {{ item.ongoingCount }} {{ $t('table.ongoing') }}
                                    </span>
                                    <span v-else-if="item.targetCount === 0">
                                        0 {{ $t('table.ongoing') }}
                                    </span>
                                </div>
                            </div>
                        </td>
                    </template>

                    <!-- Time Range Slot -->
                    <template #scheduleRange="{ item }">
                        <td class="align-middle py-3">
                            <div class="text-dark font-weight-bold small">{{ item.scheduleRange }}</div>
                            <div v-if="item.isClosingSoon" class="closing-soon-pill mt-1">
                                <CIcon name="cil-clock" size="sm" class="mr-1" />
                                {{ $t('analytics.closingSoonTag', { days: item.daysLeft }) }}
                            </div>
                            <div v-else-if="item.status === 'Active' && item.daysLeft !== null"
                                class="text-muted font-weight-bold mt-1" style="font-size: 0.8125rem;">
                                <CIcon name="cil-clock" size="sm" class="mr-1" />
                                {{ $t('table.daysLeft', { count: item.daysLeft }) }}
                            </div>
                            <div v-else-if="item.status === 'Closed'" class="text-muted font-weight-bold mt-1" style="font-size: 0.8125rem;">
                                {{ $t('table.closed') }}
                            </div>
                        </td>
                    </template>

                    <!-- Status Slot -->
                    <template #status="{ item }">
                        <td class="align-middle py-3">
                            <span class="status-badge" :class="getStatusClass(item.status)">
                                <span class="status-dot"></span>
                                {{ $t('status.' + item.status.toLowerCase()) }}
                            </span>
                        </td>
                    </template>

                    <!-- Action Drill-Down + Quick View + Form Excel Export -->
                    <template #actions="{ item }">
                        <td class="align-middle py-3 text-right pr-3">
                            <div class="d-inline-flex align-items-center justify-content-end" style="gap: 6px;">
                                <CButton
                                    size="sm"
                                    color="light"
                                    class="drill-btn font-weight-bold"
                                    @click.stop="openFormReport(item)"
                                >
                                    {{ $t('analytics.viewReport') }}
                                    <CIcon name="cil-arrow-right" size="sm" class="ml-1" />
                                </CButton>
                                <div class="row-export-wrap" @click.stop>
                                    <button
                                        type="button"
                                        class="icon-action-btn icon-action-btn--export"
                                        :disabled="exportingFormId === item.id"
                                        :title="$t('analytics.exportForm')"
                                        :aria-label="$t('analytics.exportForm')"
                                        @click.stop="toggleRowExportMenu(item.id)"
                                    >
                                        <CIcon name="cil-data-transfer-down" size="sm" />
                                    </button>
                                    <div v-if="openExportRowId === item.id" class="row-export-menu" role="menu">
                                        <button
                                            type="button"
                                            role="menuitem"
                                            class="row-export-option"
                                            @click.stop="emitRowExport(item, 'xlsx')"
                                        >
                                            <CIcon name="cil-spreadsheet" size="sm" class="mr-2 text-success" />
                                            <span>{{ $t('analytics.exportFormExcel') }}</span>
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            class="row-export-option"
                                            @click.stop="emitRowExport(item, 'json')"
                                        >
                                            <CIcon name="cil-code" size="sm" class="mr-2 text-info" />
                                            <span>{{ $t('analytics.exportFormJson') }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </template>
                </CDataTable>

                <Pagination
                    v-if="!loading && tableItems.length > 0"
                    :activePage.sync="activePage"
                    :pages="totalPages"
                    :showPerPage="true"
                    :itemsPerPage.sync="perPage"
                    :totalItems="tableItems.length"
                />
            </div>
        </CCol>
    </CRow>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import localeMixin from '@/mixins/localeMixin';
import EmptyState from '@/projects/components/Util/EmptyState.vue';
import FilterTable from '@/projects/components/Filter/FilterTable.vue';
import Pagination from '@/projects/components/Util/Pagination.vue';
import TableLoading from '@/projects/components/Util/TableLoading.vue';
import { buildAnalyticsDashboard, buildCompactAccessSummary } from '@/projects/utils/analytics';

export default {
    name: 'PopularFormsTable',
    components: { EmptyState, FilterTable, Pagination, TableLoading },
    mixins: [localeMixin],
    props: {
        timeRange: {
            type: String,
            default: 'all'
        },
        formRows: {
            type: Array,
            default: null
        },
        searchQuery: {
            type: String,
            default: ''
        },
        loading: {
            type: Boolean,
            default: false
        },
        selectedStatus: {
            type: String,
            default: 'all'
        },
        statusCounts: {
            type: Object,
            default: null
        },
        exportingFormId: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            activePage: 1,
            perPage: 5,
            sortBy: 'responses',
            localStatus: 'all',
            openExportRowId: null,
            startDate: '',
            endDate: ''
        };
    },
    mounted() {
        this._closeRowExport = () => {
            this.openExportRowId = null;
        };
        window.addEventListener('click', this._closeRowExport);
    },
    beforeDestroy() {
        if (this._closeRowExport) {
            window.removeEventListener('click', this._closeRowExport);
        }
    },
    watch: {
        tableItems() {
            if (this.activePage > this.totalPages) {
                this.activePage = 1;
            }
        },
        perPage() {
            this.activePage = 1;
        },
        selectedStatus(val) {
            this.localStatus = val || 'all';
            this.activePage = 1;
        },
        sortBy() {
            this.activePage = 1;
        },
        startDate() {
            this.activePage = 1;
        },
        endDate() {
            this.activePage = 1;
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('Responses', ['responses']),
        ...mapGetters('User', ['user', 'users']),
        ...mapGetters('Organizations', ['organizations']),

        tableFields() {
            return [
                { key: 'formName', label: this.$t('table.questionnaire'), _style: 'width:26%' },
                { key: 'access', label: this.$t('table.access'), _style: 'width:14%' },
                { key: 'responses', label: this.$t('analytics.responseRateCol'), _style: 'width:20%' },
                { key: 'scheduleRange', label: this.$t('table.timeRange'), _style: 'width:14%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:9%' },
                { key: 'actions', label: '', _style: 'width:17%', _classes: 'text-right', sorter: false }
            ];
        },

        activeStatusFilter() {
            return this.$listeners && this.$listeners['update:selectedStatus']
                ? this.selectedStatus
                : this.localStatus;
        },

        statusFilterOptions() {
            return [
                { value: 'all', label: this.$t('analytics.allFormsTab') },
                { value: 'Active', label: this.$t('status.active') },
                { value: 'Pending', label: this.$t('status.pending') },
                { value: 'Closed', label: this.$t('status.closed') }
            ];
        },

        baseRows() {
            if (Array.isArray(this.formRows)) {
                return this.formRows;
            }
            return buildAnalyticsDashboard(this.forms || [], {
                allResponses: this.responses || [],
                users: this.users || [],
                organizations: this.organizations || [],
                currentUser: this.user,
                timeRange: this.timeRange,
                searchQuery: this.searchQuery
            }).formRows;
        },

        tableItems() {
            let rows = [...this.baseRows];
            if (!(this.$listeners && this.$listeners['update:selectedStatus']) && this.localStatus !== 'all') {
                rows = rows.filter((row) => {
                    if (this.localStatus === 'closingSoon') return Boolean(row && row.isClosingSoon);
                    return row && row.status === this.localStatus;
                });
            }

            if ((this.startDate && this.startDate.trim()) || (this.endDate && this.endDate.trim())) {
                const filterStart = this.startDate ? new Date(`${this.startDate}T00:00:00`).getTime() : -Infinity;
                const filterEnd = this.endDate ? new Date(`${this.endDate}T23:59:59.999`).getTime() : Infinity;
                if (!Number.isNaN(filterStart) && !Number.isNaN(filterEnd)) {
                    rows = rows.filter((row) => {
                        const { startMs, endMs } = this.resolveRowScheduleBounds(row);
                        if (startMs === null && endMs === null) return false;
                        const formStart = startMs !== null ? startMs : -Infinity;
                        const formEnd = endMs !== null ? endMs : Infinity;
                        return (formStart <= filterEnd) && (formEnd >= filterStart);
                    });
                }
            }

            if (this.sortBy === 'lowestRate') {
                rows.sort((a, b) => {
                    const rA = a.responseRate !== null && a.responseRate !== undefined ? a.responseRate : 999;
                    const rB = b.responseRate !== null && b.responseRate !== undefined ? b.responseRate : 999;
                    return rA - rB;
                });
            } else if (this.sortBy === 'closingSoon') {
                rows.sort((a, b) => {
                    const dA = a.daysLeft !== null && a.daysLeft !== undefined ? a.daysLeft : 9999;
                    const dB = b.daysLeft !== null && b.daysLeft !== undefined ? b.daysLeft : 9999;
                    return dA - dB;
                });
            } else if (this.sortBy === 'title') {
                rows.sort((a, b) => String(a.formName || '').localeCompare(String(b.formName || '')));
            } else {
                rows.sort((a, b) => (b.completedCount - a.completedCount) || (b.ongoingCount - a.ongoingCount));
            }
            return rows;
        },

        totalPages() {
            return Math.max(1, Math.ceil(this.tableItems.length / this.perPage));
        },

        pagedItems() {
            const start = (this.activePage - 1) * this.perPage;
            return this.tableItems.slice(start, start + this.perPage);
        }
    },
    methods: {
        toggleRowExportMenu(id) {
            this.openExportRowId = this.openExportRowId === id ? null : id;
        },
        emitRowExport(item, format) {
            this.openExportRowId = null;
            this.$emit('export-form', { item, format });
        },
        selectStatusTab(value) {
            this.localStatus = value;
            this.activePage = 1;
            this.$emit('update:selectedStatus', value);
        },
        openFormReport(item) {
            if (!item || !item.id) return;
            const query = (this.timeRange && this.timeRange !== 'all')
                ? { timeRange: this.timeRange }
                : undefined;
            this.$router.push({
                name: 'AnalyticsFormReport',
                params: { formId: item.id },
                ...(query ? { query } : {})
            });
        },
        getStatusClass(status) {
            const s = status ? String(status).toLowerCase() : '';
            if (s === 'active' || s.includes('open')) return 'status-active';
            if (s === 'closed') return 'status-closed';
            return 'status-pending';
        },
        formatAccessLabel(visibility) {
            if (!visibility) return '';
            const key = String(visibility).toLowerCase();
            const i18nKey = `accessLabel.${key}`;
            return this.$te(i18nKey) ? this.$t(i18nKey) : visibility;
        },
        getAccessSummary(item) {
            return buildCompactAccessSummary(item && item.access, {
                formatLabel: (val) => this.formatAccessLabel(val),
                orgUnit: this.$t('table.orgUnit'),
                userUnit: this.$t('table.userUnit'),
                roleUnit: this.$t('table.roleUnit')
            });
        },
        resolveRowScheduleBounds(row) {
            if (!row) return { startMs: null, endMs: null };
            const toMs = (val, endOfDay = false) => {
                if (!val) return null;
                const d = moment(val);
                if (!d.isValid()) return null;
                return (endOfDay ? d.endOf('day') : d.startOf('day')).valueOf();
            };
            let startMs = toMs(row.scheduleStartAt, false);
            let endMs = toMs(row.scheduleEndAt, true);
            if (startMs === null && endMs === null && typeof row.scheduleRange === 'string' && row.scheduleRange !== '-') {
                const parts = row.scheduleRange.split(' - ').map(s => s.trim());
                if (parts[0]) {
                    const pStart = moment(parts[0].replace(/^Until\s+/i, ''), 'DD/MM/YYYY', true);
                    if (pStart.isValid()) {
                        if (/^Until\s+/i.test(parts[0])) endMs = pStart.endOf('day').valueOf();
                        else startMs = pStart.startOf('day').valueOf();
                    }
                }
                if (parts[1] && !/^open$/i.test(parts[1])) {
                    const pEnd = moment(parts[1], 'DD/MM/YYYY', true);
                    if (pEnd.isValid()) endMs = pEnd.endOf('day').valueOf();
                }
            }
            return { startMs, endMs };
        }
    }
};
</script>

<style scoped>
.response-trends-container {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.count-pill {
    background: #fef2f2;
    color: #8c1515;
    font-weight: 700;
    font-size: 0.8125rem;
    padding: 2px 10px;
    border-radius: 999px;
}

.tables-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0 !important;
    padding: 0;
    overflow: visible;
}

.tables-container.table-empty tbody tr,
.tables-container.table-empty tbody tr:hover,
.tables-container.table-empty tbody td {
    background: transparent !important;
    cursor: default !important;
    pointer-events: none !important;
}

.clickable-cell {
    cursor: pointer;
}

.clickable-cell:hover .text-primary-hover {
    color: #8c1515;
}

.desc-clamp {
    line-height: 1.25;
    max-width: 280px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.mini-progress-track {
    width: 100%;
    height: 6px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
}

.mini-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 999px;
}

.rate-badge {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #059669;
    background: #ecfdf5;
    padding: 1px 6px;
    border-radius: 999px;
}


.closing-soon-pill {
    display: inline-flex;
    align-items: center;
    background: #fff1f2;
    color: #be123c;
    font-weight: 700;
    font-size: 0.8125rem;
    padding: 2px 8px;
    border-radius: 999px;
}

.drill-btn {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    color: #334155;
    white-space: nowrap;
    font-size: 0.8125rem;
}

.drill-btn:hover {
    background-color: #fef2f2 !important;
    color: #8c1515 !important;
    border-color: #fecaca !important;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35em 0.8em;
    border-radius: 50rem;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    flex-shrink: 0;
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

.visibility-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35em 0.85em;
    border-radius: 100px;
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
}

.visi-public {
    background-color: #ecfdf5;
    color: #065f46;
}

.visi-private {
    background-color: #fff1f2;
    color: #be123c;
}

.visi-org {
    background-color: #f0f7ff;
    color: #1e40af;
}

.visi-default {
    background-color: #f1f5f9;
    color: #64748b;
}

.visi-personal {
    background-color: #f5f3ff;
    color: #7c3aed;
}

.text-warning-dark {
    color: #d97706;
}

.cursor-pointer {
    cursor: pointer;
}

.gap-1 {
    gap: 0.25rem;
}

.min-width-0 {
    min-width: 0;
}

.text-truncate-pill {
    display: inline-flex;
    align-items: center;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.visi-role {
    background-color: #f3e8ff;
    color: #6b21a8;
}

.custom-dropdown /deep/ .dropdown-menu,
.custom-dropdown ::v-deep .dropdown-menu {
    background: #ffffff !important;
    border-radius: 12px !important;
    padding: 0 !important;
    margin-top: 8px !important;
    z-index: 2000 !important;
    border: 1px solid #edf2f7 !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
    max-height: 250px;
    overflow-y: auto;
    min-width: 220px;
}

.custom-dropdown /deep/ .dropdown-item,
.custom-dropdown ::v-deep .dropdown-item {
    padding: 0 !important;
}

.custom-dropdown /deep/ .dropdown-toggle,
.custom-dropdown ::v-deep .dropdown-toggle {
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    outline: none !important;
}

.custom-dropdown /deep/ .dropdown-toggle::after,
.custom-dropdown ::v-deep .dropdown-toggle::after {
    display: none !important;
}

.dropdown-menu-scrollable {
    max-height: 240px;
    overflow-y: auto;
}

.dropdown-section-header {
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
    background-color: #f8fafc;
    position: sticky;
    top: 0;
    z-index: 1;
}

.dropdown-caret {
    width: 12px !important;
    height: 12px !important;
    opacity: 0.7;
}

.last-border-0:last-child {
    border-bottom: 0 !important;
}

.sort-header-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.sort-select {
    height: 38px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #0f172a;
    padding: 0 12px;
    min-width: 195px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.sort-select:focus {
    background: #ffffff;
    border-color: #8c1515;
    box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.1);
    outline: none;
}

.icon-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #475569;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
}

.icon-action-btn:hover:not(:disabled) {
    border-color: #8c1515;
    color: #8c1515;
    background: #fffafa;
}

.row-export-wrap {
    position: relative;
    display: inline-flex;
}

.row-export-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    min-width: 175px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
    padding: 4px;
    z-index: 1055;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.row-export-option {
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
    padding: 6px 10px;
    border-radius: 7px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    cursor: pointer;
    white-space: nowrap;
}

.row-export-option:hover {
    background: #f1f5f9;
}

.icon-action-btn--export:hover:not(:disabled) {
    border-color: #059669;
    color: #059669;
    background: #ecfdf5;
}

.icon-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 767.98px) {
    .response-trends-container {
        padding: 16px;
        border-radius: 14px;
    }

    .tables-container:not(.table-empty) {
        overflow: visible;
    }
}
</style>
