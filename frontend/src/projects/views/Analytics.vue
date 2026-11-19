<template>
  <div :data-analytics-ready="!isLoading ? 'true' : 'false'">
    <CRow>
        <CCol lg="12">
            <Header :title="$t('hero.analyticsTitle')" :description="$t('hero.analyticsDesc')">
                <template #actions>
                    <div class="d-flex align-items-center flex-wrap analytics-actions" style="gap: 10px;">
                        <select v-model="selectedOrgId" class="filter-select" aria-label="Organization Filter">
                            <option value="all">{{ $t('analytics.allOrganizations') }}</option>
                            <option v-for="org in organizationOptions" :key="org.value" :value="org.value">
                                {{ org.label }}
                            </option>
                        </select>

                        <select v-model="selectedStatus" class="filter-select" aria-label="Status Filter">
                            <option value="all">{{ $t('table.allStatus') }}</option>
                            <option value="Active">{{ $t('status.active') }}</option>
                            <option value="closingSoon">{{ $t('analytics.closingSoonFilter') }}</option>
                            <option value="Pending">{{ $t('status.pending') }}</option>
                            <option value="Closed">{{ $t('status.closed') }}</option>
                        </select>

                        <div class="analytics-segmented-control">
                            <button
                                type="button"
                                class="segmented-btn"
                                :class="{ active: timeRange === 'all' }"
                                @click="timeRange = 'all'">{{ $t('table.quickDate.all') }}</button>
                            <button
                                type="button"
                                class="segmented-btn"
                                :class="{ active: timeRange === '1d' }"
                                @click="timeRange = '1d'">{{ $t('table.quickDate.today') }}</button>
                            <button
                                type="button"
                                class="segmented-btn"
                                :class="{ active: timeRange === '7d' }"
                                @click="timeRange = '7d'">{{ $t('table.quickDate.last7Days') }}</button>
                            <button
                                type="button"
                                class="segmented-btn"
                                :class="{ active: timeRange === '30d' }"
                                @click="timeRange = '30d'">{{ $t('table.quickDate.last30Days') }}</button>
                        </div>
                    </div>
                </template>
            </Header>
        </CCol>
    </CRow>

    <div v-if="apiCopied" class="copied-banner mb-3" role="status">
        <CIcon name="cil-check-alt" size="sm" class="mr-2 text-success" />
        <span>{{ $t('analytics.apiCopied') }}</span>
    </div>

    <!-- Per-Form Performance Directory -->
    <PopularFormsTable
        :timeRange="timeRange"
        :formRows="dashboard.formRows"
        :loading="isLoading"
        :searchQuery.sync="searchQuery"
        :selectedStatus.sync="selectedStatus"
        :statusCounts="statusCounts"
        :exportingFormId="exportingFormId"
        @export-form="exportSingleForm"
    />
  </div>
</template>

<script>
import * as XLSX from 'xlsx';
import moment from 'moment';
import Header from '../components/Util/Header.vue';
import PopularFormsTable from '../components/analytics/PopularFormsTable.vue';
import localeMixin from '@/mixins/localeMixin';
import Service from '@/service/api';
import { buildApiUrl, copyText } from '@/projects/utils/apiUrl';
import { mapGetters } from 'vuex';
import {
    buildAnalyticsDashboard,
    filterFormsByUserAccess,
    getLocalizedText,
    loadAnalyticsWorkspaceData,
    toIdStr
} from '@/projects/utils/analytics';
import {
    buildAnalyticsQueryParams,
    buildSafeFormFilename,
    downloadAnalyticsWorkbookFile
} from '@/projects/utils/analyticsWorkbook';

export default {
    name: 'Analytics',
    mixins: [localeMixin],
    components: {
        Header,
        PopularFormsTable
    },
    data() {
        return {
            isLoading: true,
            apiCopied: false,
            apiCopyTimer: null,
            exportingFormId: null,
            formDetailsCache: {},
            timeRange: 'all',
            selectedOrgId: 'all',
            selectedStatus: 'all',
            searchQuery: ''
        };
    },
    computed: {
        ...mapGetters('User', ['user', 'users']),
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('Responses', ['responses']),
        ...mapGetters('Organizations', ['organizations']),
        ...mapGetters('Roles', ['roles']),

        organizationOptions() {
            const locale = (this.$i18n && this.$i18n.locale) || 'en';
            return (this.organizations || [])
                .filter(o => o && o._id)
                .map(o => ({
                    value: toIdStr(o._id),
                    label: getLocalizedText(o.title || o.name, locale) || toIdStr(o._id)
                }));
        },

        scopedForms() {
            return filterFormsByUserAccess(this.forms || [], this.user);
        },

        unfilteredByStatusDashboard() {
            const locale = (this.$i18n && this.$i18n.locale) || 'en';
            return buildAnalyticsDashboard(this.scopedForms, {
                allResponses: this.responses || [],
                users: this.users || [],
                organizations: this.organizations || [],
                roles: this.roles || [],
                currentUser: this.user,
                timeRange: this.timeRange,
                selectedOrgId: this.selectedOrgId,
                selectedStatus: 'all',
                searchQuery: '',
                locale
            });
        },

        statusCounts() {
            const rows = (this.unfilteredByStatusDashboard && this.unfilteredByStatusDashboard.formRows) || [];
            const counts = { all: rows.length, Active: 0, closingSoon: 0, Pending: 0, Closed: 0 };
            rows.forEach((r) => {
                if (r.status === 'Active') counts.Active += 1;
                else if (r.status === 'Closed') counts.Closed += 1;
                else counts.Pending += 1;
                if (r.isClosingSoon) counts.closingSoon += 1;
            });
            return counts;
        },

        dashboard() {
            const locale = (this.$i18n && this.$i18n.locale) || 'en';
            return buildAnalyticsDashboard(this.scopedForms, {
                allResponses: this.responses || [],
                users: this.users || [],
                organizations: this.organizations || [],
                roles: this.roles || [],
                currentUser: this.user,
                timeRange: this.timeRange,
                selectedOrgId: this.selectedOrgId,
                selectedStatus: this.selectedStatus,
                searchQuery: this.searchQuery,
                locale
            });
        }
    },
    created() {
        this.$store.commit('Forms/clearForms');
        if (this.user && this.user._id) {
            this.onInit();
        } else if (typeof window === 'undefined' || !window.localStorage || !window.localStorage.getItem('activeUserId')) {
            this.isLoading = false;
        }
    },
    beforeDestroy() {
        clearTimeout(this.apiCopyTimer);
    },
    watch: {
        user: {
            handler(val, oldVal) {
                const newId = val && val._id ? String(val._id) : null;
                const oldId = oldVal && oldVal._id ? String(oldVal._id) : null;
                if (newId && newId !== oldId) {
                    this.onInit();
                } else if (!newId) {
                    this.$store.commit('Forms/clearForms');
                    this.isLoading = false;
                }
            }
        },
        timeRange() {
            this.formDetailsCache = {};
        }
    },
    methods: {
        async onInit() {
            if (!(this.user && this.user._id)) {
                this.$store.commit('Forms/clearForms');
                this.isLoading = false;
                return null;
            }
            if (this._initPromise) return this._initPromise;
            this.isLoading = true;

            this._initPromise = (async () => {
                try {
                    await loadAnalyticsWorkspaceData(this.$store, this.user);
                } finally {
                    this.isLoading = false;
                    this._initPromise = null;
                }
            })();
            return this._initPromise;
        },
        async loadFormDetailPayload(formId) {
            const cacheKey = `${formId}:${this.timeRange}`;
            if (this.formDetailsCache[cacheKey]) {
                return this.formDetailsCache[cacheKey];
            }
            const res = await Service.analytics('export', buildAnalyticsQueryParams({
                timeRange: this.timeRange,
                formIds: [formId],
                userId: this.user && this.user._id
            }));
            const payload = res && res.data && (res.data.data || res.data);
            const formEntry = payload && Array.isArray(payload.forms) ? payload.forms[0] : null;
            if (formEntry) {
                this.$set(this.formDetailsCache, cacheKey, { payload, formEntry });
            }
            return { payload, formEntry };
        },
        async exportSingleForm(eventArg) {
            const item = (eventArg && eventArg.item) ? eventArg.item : eventArg;
            const format = (eventArg && eventArg.format) || 'xlsx';
            if (format === 'json') {
                this.copyFormApiUrl(item);
                return;
            }
            if (!item || !item.id || this.exportingFormId) return;
            this.exportingFormId = item.id;
            try {
                const res = await this.loadFormDetailPayload(item.id);
                const locale = (this.$i18n && this.$i18n.locale) || 'en';
                const downloaded = downloadAnalyticsWorkbookFile(XLSX, res && res.payload, {
                    locale,
                    filePrefix: buildSafeFormFilename(item.formName),
                    stamp: moment().format('YYYYMMDD_HHmm')
                });
                if (!downloaded) {
                    alert(this.$t('analytics.noExportData'));
                }
            } catch (err) {
                console.error('exportSingleForm Error:', err);
                alert(this.$t('analytics.exportError'));
            } finally {
                this.exportingFormId = null;
            }
        },
        showApiCopied() {
            this.apiCopied = true;
            clearTimeout(this.apiCopyTimer);
            this.apiCopyTimer = setTimeout(() => { this.apiCopied = false; }, 2200);
        },
        copyFormApiUrl(item) {
            if (!item || !item.id) return;
            copyText(buildApiUrl(`response/export/${item.id}`)).then(this.showApiCopied);
        }
    }
};
</script>

<style scoped>
.filter-select {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 6px 12px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
    height: 36px;
}

.analytics-segmented-control {
    display: inline-flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
}

.segmented-btn {
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
    border-radius: 8px;
    padding: 6px 14px;
    white-space: nowrap;
    transition: all 0.18s ease;
    cursor: pointer;
}

.segmented-btn:hover {
    color: #0f172a;
}

.segmented-btn.active {
    background: #ffffff;
    color: #8c1515;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.copied-banner {
    display: inline-flex;
    align-items: center;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 999px;
}

@media (max-width: 767.98px) {
    .analytics-actions {
        width: 100%;
    }

    .filter-select {
        flex: 1 1 calc(50% - 6px);
        min-width: 140px;
    }

    .analytics-segmented-control {
        width: 100%;
        display: flex;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .segmented-btn {
        flex: 1 1 auto;
        padding: 6px 10px;
        font-size: 0.8125rem;
    }
}
</style>
