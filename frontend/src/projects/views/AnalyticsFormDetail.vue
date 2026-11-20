<template>
    <div :data-form-report-ready="!isLoading ? 'true' : 'false'">
        <div class="d-flex flex-wrap align-items-center justify-content-between mb-3" style="gap: 10px;">
            <button
                type="button"
                class="back-link-btn"
                @click="goBackToList"
            >
                <CIcon name="cil-arrow-left" size="sm" class="mr-2" />
                {{ $t('analytics.backToForms') }}
            </button>

            <div v-if="targetForm" class="d-flex flex-wrap align-items-center" style="gap: 8px;">
                <span v-if="formStatus" class="status-pill" :class="statusClass">
                    {{ $t('status.' + formStatus.toLowerCase()) }}
                </span>
                <span v-if="formRow && formRow.scheduleRange && formRow.scheduleRange !== '-'" class="meta-pill">
                    <CIcon name="cil-calendar" size="sm" class="mr-1" />
                    {{ formRow.scheduleRange }}
                </span>
            </div>
        </div>

        <div v-if="isLoading" class="analytics-state-card text-center py-5 text-muted">
            <CSpinner color="danger" size="sm" class="mr-2" />
            {{ $t('analytics.loadingDetails') }}
        </div>

        <div v-else-if="!targetForm" class="analytics-state-card py-5">
            <EmptyState
                borderless
                icon="cil-warning"
                :title="$t('analytics.formNotFoundTitle')"
                :description="$t('analytics.formNotFoundDesc')"
            >
                <template #actions>
                    <CButton color="light" class="font-weight-bold" @click="goBackToList">
                        <CIcon name="cil-arrow-left" size="sm" class="mr-1" />
                        {{ $t('analytics.backToForms') }}
                    </CButton>
                </template>
            </EmptyState>
        </div>

        <template v-else>
            <CRow>
                <CCol lg="12">
                    <Header :title="formTitle" :description="formDescription">
                        <template #actions>
                            <div class="d-flex align-items-center flex-wrap detail-actions" style="gap: 10px;">
                                <div class="analytics-segmented-control">
                                    <button
                                        type="button"
                                        class="segmented-btn"
                                        :class="{ active: timeRange === 'all' }"
                                        @click="setTimeRange('all')">{{ $t('table.quickDate.all') }}</button>
                                    <button
                                        type="button"
                                        class="segmented-btn"
                                        :class="{ active: timeRange === '1d' }"
                                        @click="setTimeRange('1d')">{{ $t('table.quickDate.today') }}</button>
                                    <button
                                        type="button"
                                        class="segmented-btn"
                                        :class="{ active: timeRange === '7d' }"
                                        @click="setTimeRange('7d')">{{ $t('table.quickDate.last7Days') }}</button>
                                    <button
                                        type="button"
                                        class="segmented-btn"
                                        :class="{ active: timeRange === '30d' }"
                                        @click="setTimeRange('30d')">{{ $t('table.quickDate.last30Days') }}</button>
                                </div>

                                <CDropdown class="export-dropdown" placement="bottom-end">
                                    <template #toggler>
                                        <CButton class="btn-export-analytics" :disabled="isExporting">
                                            <CIcon name="cil-data-transfer-down" size="sm" class="mr-2" />
                                            {{ isExporting ? $t('analytics.exportingReport') : $t('analytics.exportForm') }}
                                            <CIcon name="cil-chevron-bottom" size="sm" class="ml-1" />
                                        </CButton>
                                    </template>
                                    <CDropdownItem @click="exportFormExcel" :disabled="isExporting">
                                        <CIcon name="cil-spreadsheet" size="sm" class="mr-2 text-success" />
                                        {{ $t('analytics.exportFormExcel') }}
                                    </CDropdownItem>
                                    <CDropdownItem @click="copyFormApiUrl" :disabled="isExporting">
                                        <CIcon :name="apiCopied ? 'cil-check-alt' : 'cil-code'" size="sm" class="mr-2 text-info" />
                                        {{ apiCopied ? $t('analytics.apiCopied') : $t('analytics.exportFormJson') }}
                                    </CDropdownItem>
                                </CDropdown>
                            </div>
                        </template>
                    </Header>
                </CCol>
            </CRow>

            <!-- Single-Form KPI Strip -->
            <div class="kpi-grid mb-4" :class="hasRatingQuestions ? 'kpi-grid--4' : 'kpi-grid--3'">
                <div class="kpi-card">
                    <div class="kpi-label">{{ $t('analytics.totalResponsesLabel') }}</div>
                    <div class="kpi-value-row">
                        <span class="kpi-value">{{ mergedSummary.totalCompleted }}</span>
                        <span v-if="mergedSummary.totalTargeted > 0" class="kpi-target">
                            / {{ mergedSummary.totalTargeted }}
                        </span>
                        <span
                            v-if="mergedSummary.overallResponseRate !== null"
                            class="kpi-rate-badge"
                        >
                            {{ mergedSummary.overallResponseRate }}%
                        </span>
                    </div>
                    <div class="kpi-subtext">
                        <template v-if="mergedSummary.totalTargeted > 0">
                            {{ $t('analytics.pendingCountShort', { count: mergedSummary.totalPendingTargets }) }}
                        </template>
                        <template v-else>
                            {{ $t('analytics.noTargetLimit') }}
                        </template>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">{{ $t('analytics.completionRateLabel') }}</div>
                    <div class="kpi-value-row">
                        <span class="kpi-value">{{ mergedSummary.overallCompletionRate }}%</span>
                    </div>
                    <div class="kpi-subtext">
                        {{ $t('table.completed') }} {{ mergedSummary.totalCompleted }} · {{ $t('table.ongoing') }} {{ mergedSummary.totalOngoing }}
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">{{ $t('analytics.respondentMixLabel') }}</div>
                    <div class="kpi-value-row">
                        <span class="kpi-value">{{ mergedSummary.signedInResponses }}</span>
                        <span class="kpi-target">/ {{ mergedSummary.guestResponses }}</span>
                    </div>
                    <div class="kpi-subtext">
                        {{ $t('analytics.signedInUsers') }} {{ mergedSummary.signedInResponses }} · {{ $t('analytics.guestAnonymous') }} {{ mergedSummary.guestResponses }}
                    </div>
                </div>

                <div v-if="hasRatingQuestions" class="kpi-card">
                    <div class="kpi-label">{{ $t('analytics.avgRatingLabel') }}</div>
                    <div class="kpi-value-row">
                        <span class="kpi-value">
                            {{ mergedSummary.avgRating !== null ? mergedSummary.avgRating.toFixed(2) + ' ★' : '-' }}
                        </span>
                    </div>
                    <div class="kpi-subtext">
                        {{ mergedSummary.totalRatingCount }} {{ $t('analytics.ratingReviews') }}
                    </div>
                </div>
            </div>

            <!-- Respondent Tracker (Top of Report) -->
            <div class="mb-4">
                <FormReportDetails
                    mode="respondents"
                    :loading="detailLoading"
                    :summaryRow="formRow"
                    :detailPayload="detailPayload"
                />
            </div>

            <!-- Single-Form Submission Trend -->
            <div class="mb-4">
                <SubmissionTrendChart
                    :timeRange="timeRange"
                    :trendData="singleDashboard.trend"
                />
            </div>

            <!-- Single-Form Org / Role Breakdown & Channel Mix -->
            <AnalyticsBreakdownCharts
                :breakdown="singleDashboard.breakdown"
                :summary="mergedSummary"
                :showRating="hasRatingQuestions"
            />

            <!-- Inline Question Highlights -->
            <FormReportDetails
                mode="questions"
                :loading="detailLoading"
                :summaryRow="formRow"
                :detailPayload="detailPayload"
            />
        </template>
    </div>
</template>

<script>
import * as XLSX from 'xlsx';
import moment from 'moment';
import { mapGetters } from 'vuex';
import Header from '../components/Util/Header.vue';
import EmptyState from '../components/Util/EmptyState.vue';
import SubmissionTrendChart from '../components/analytics/SubmissionTrendChart.vue';
import AnalyticsBreakdownCharts from '../components/analytics/AnalyticsBreakdownCharts.vue';
import FormReportDetails from '../components/analytics/FormReportDetails.vue';
import localeMixin from '@/mixins/localeMixin';
import Service from '@/service/api';
import { buildApiUrl, copyText } from '@/projects/utils/apiUrl';
import {
    buildAnalyticsDashboard,
    canUserViewFormAnalytics,
    formHasRatingQuestions,
    getLocalizedText,
    loadAnalyticsWorkspaceData,
    toIdStr
} from '@/projects/utils/analytics';
import {
    buildAnalyticsQueryParams,
    buildSafeFormFilename,
    downloadAnalyticsWorkbookFile
} from '@/projects/utils/analyticsWorkbook';

const ALLOWED_RANGES = new Set(['all', '1d', '7d', '30d']);

export default {
    name: 'AnalyticsFormDetail',
    mixins: [localeMixin],
    components: {
        Header,
        EmptyState,
        SubmissionTrendChart,
        AnalyticsBreakdownCharts,
        FormReportDetails
    },
    props: {
        formId: {
            type: String,
            default: ''
        }
    },
    data() {
        const queryRange = this.$route && this.$route.query && this.$route.query.timeRange;
        return {
            isLoading: true,
            detailLoading: false,
            isExporting: false,
            apiCopied: false,
            apiCopyTimer: null,
            timeRange: ALLOWED_RANGES.has(queryRange) ? queryRange : 'all',
            detailPayload: null,
            exportEnvelope: null
        };
    },
    computed: {
        ...mapGetters('User', ['user', 'users']),
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('Responses', ['responses']),
        ...mapGetters('Organizations', ['organizations']),
        ...mapGetters('Roles', ['roles']),

        resolvedFormId() {
            return this.formId || (this.$route && this.$route.params && this.$route.params.formId) || '';
        },
        rawForm() {
            const targetId = String(this.resolvedFormId || '');
            if (!targetId) return null;
            return (this.forms || []).find((f) => f && toIdStr(f._id) === targetId) || null;
        },
        hasAccess() {
            return Boolean(this.rawForm && canUserViewFormAnalytics(this.rawForm, this.user));
        },
        targetForm() {
            return this.hasAccess ? this.rawForm : null;
        },
        singleDashboard() {
            const locale = (this.$i18n && this.$i18n.locale) || 'en';
            return buildAnalyticsDashboard(this.targetForm ? [this.targetForm] : [], {
                allResponses: this.responses || [],
                users: this.users || [],
                organizations: this.organizations || [],
                roles: this.roles || [],
                currentUser: this.user,
                timeRange: this.timeRange,
                locale
            });
        },
        formRow() {
            return (this.singleDashboard && this.singleDashboard.formRows && this.singleDashboard.formRows[0]) || null;
        },
        mergedSummary() {
            const localSummary = (this.singleDashboard && this.singleDashboard.summary) || {};
            const apiSummary = (this.detailPayload && this.detailPayload.summary) || null;
            if (!apiSummary) {
                return {
                    totalCompleted: localSummary.totalCompleted || 0,
                    totalTargeted: localSummary.totalTargeted || 0,
                    overallResponseRate: localSummary.overallResponseRate !== undefined ? localSummary.overallResponseRate : null,
                    overallCompletionRate: localSummary.overallCompletionRate || 0,
                    totalPendingTargets: localSummary.totalPendingTargets || 0,
                    totalOngoing: localSummary.totalOngoing || 0,
                    signedInResponses: localSummary.signedInResponses || 0,
                    guestResponses: localSummary.guestResponses || 0,
                    avgRating: localSummary.avgRating !== undefined ? localSummary.avgRating : null,
                    totalRatingCount: localSummary.totalRatingCount || 0,
                    ratingDistribution: localSummary.ratingDistribution || [0, 0, 0, 0, 0]
                };
            }
            const distObj = apiSummary.ratingDistribution || {};
            const distArr = Array.isArray(distObj)
                ? distObj
                : [1, 2, 3, 4, 5].map((star) => Number(distObj[star] || distObj[String(star)] || 0));
            return {
                totalCompleted: apiSummary.completedCount || 0,
                totalTargeted: apiSummary.targetCount || 0,
                overallResponseRate: apiSummary.responseRate !== undefined ? apiSummary.responseRate : null,
                overallCompletionRate: apiSummary.completionRate || 0,
                totalPendingTargets: apiSummary.pendingCount || 0,
                totalOngoing: apiSummary.ongoingCount || 0,
                signedInResponses: apiSummary.signedInCount || 0,
                guestResponses: apiSummary.guestCount || 0,
                avgRating: apiSummary.avgRating !== undefined ? apiSummary.avgRating : null,
                totalRatingCount: apiSummary.ratingCount || 0,
                ratingDistribution: distArr
            };
        },
        hasRatingQuestions() {
            if (formHasRatingQuestions(this.targetForm)) return true;
            const detailQs = (this.detailPayload && Array.isArray(this.detailPayload.questions)) ? this.detailPayload.questions : [];
            if (detailQs.some((q) => String((q && q.type) || '').toLowerCase() === 'rating')) return true;
            return Number(this.mergedSummary.totalRatingCount || 0) > 0;
        },
        formTitle() {
            const locale = (this.$i18n && this.$i18n.locale) || 'en';
            return getLocalizedText(this.targetForm && this.targetForm.title, locale)
                || (this.formRow && this.formRow.formName)
                || '-';
        },
        formDescription() {
            const locale = (this.$i18n && this.$i18n.locale) || 'en';
            return getLocalizedText(this.targetForm && this.targetForm.description, locale)
                || (this.formRow && this.formRow.description)
                || '';
        },
        formStatus() {
            return (this.formRow && this.formRow.status) || '';
        },
        statusClass() {
            const s = String(this.formStatus || '').toLowerCase();
            if (s === 'active') return 'status-pill--active';
            if (s === 'closed') return 'status-pill--closed';
            return 'status-pill--pending';
        }
    },
    created() {
        if ((this.forms || []).length > 0 && this.user && this.user._id) {
            this.isLoading = false;
            if (this.hasAccess) {
                this.loadFormDetail();
            }
        } else if (this.user && this.user._id) {
            this.onInit();
        } else if (typeof window === 'undefined' || !window.localStorage || !window.localStorage.getItem('activeUserId')) {
            this.isLoading = false;
        }
    },
    beforeDestroy() {
        clearTimeout(this.apiCopyTimer);
    },
    watch: {
        resolvedFormId() {
            this.detailPayload = null;
            this.exportEnvelope = null;
            if (this.hasAccess) {
                this.loadFormDetail();
            }
        },
        user: {
            handler(val, oldVal) {
                const newId = val && val._id ? String(val._id) : null;
                const oldId = oldVal && oldVal._id ? String(oldVal._id) : null;
                if (newId && newId !== oldId) {
                    this.onInit();
                } else if (!newId) {
                    this.$store.commit('Forms/clearForms');
                    this.detailPayload = null;
                    this.isLoading = false;
                }
            }
        },
        '$route.query.timeRange'(next) {
            const normalized = ALLOWED_RANGES.has(next) ? next : 'all';
            if (normalized !== this.timeRange) {
                this.timeRange = normalized;
                if (this.hasAccess) {
                    this.loadFormDetail();
                }
            }
        }
    },
    methods: {
        async onInit() {
            if (!(this.user && this.user._id)) {
                this.$store.commit('Forms/clearForms');
                this.isLoading = false;
                return;
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
            await this._initPromise;
            if (this.hasAccess) {
                await this.loadFormDetail();
            }
        },
        async fetchFormDetailEnvelope() {
            const res = await Service.analytics('export', buildAnalyticsQueryParams({
                timeRange: this.timeRange,
                formIds: [this.resolvedFormId],
                userId: this.user && this.user._id
            }));
            return (res && res.data && (res.data.data || res.data)) || null;
        },
        async loadFormDetail() {
            if (!this.resolvedFormId || !this.hasAccess) return;
            const requestRange = this.timeRange;
            const requestId = this.resolvedFormId;
            this.detailLoading = true;
            try {
                const payload = await this.fetchFormDetailEnvelope();
                if (this.resolvedFormId !== requestId || this.timeRange !== requestRange) return;
                this.exportEnvelope = payload;
                this.detailPayload = (payload && Array.isArray(payload.forms)) ? payload.forms[0] || null : null;
            } catch (err) {
                console.error('loadFormDetail Error:', err);
            } finally {
                if (this.resolvedFormId === requestId && this.timeRange === requestRange) {
                    this.detailLoading = false;
                }
            }
        },
        setTimeRange(nextRange) {
            if (this.timeRange === nextRange) return;
            this.timeRange = nextRange;
            if (this.$router && this.$route) {
                const query = { ...this.$route.query };
                if (nextRange === 'all') delete query.timeRange;
                else query.timeRange = nextRange;
                this.$router.replace({ query }).catch(() => {});
            }
            if (this.hasAccess) {
                this.loadFormDetail();
            }
        },
        goBackToList() {
            this.$router.push({ name: 'ManageForms' });
        },
        async exportFormExcel() {
            if (!this.resolvedFormId || this.isExporting) return;
            this.isExporting = true;
            try {
                const envelope = this.exportEnvelope || await this.fetchFormDetailEnvelope();
                const locale = (this.$i18n && this.$i18n.locale) || 'en';
                const downloaded = downloadAnalyticsWorkbookFile(XLSX, envelope, {
                    locale,
                    filePrefix: buildSafeFormFilename(this.formTitle),
                    stamp: moment().format('YYYYMMDD_HHmm')
                });
                if (!downloaded) {
                    alert(this.$t('analytics.noExportData'));
                }
            } catch (err) {
                console.error('exportFormExcel Error:', err);
                alert(this.$t('analytics.exportError'));
            } finally {
                this.isExporting = false;
            }
        },
        showApiCopied() {
            this.apiCopied = true;
            clearTimeout(this.apiCopyTimer);
            this.apiCopyTimer = setTimeout(() => { this.apiCopied = false; }, 2200);
        },
        copyFormApiUrl() {
            if (!this.resolvedFormId) return;
            copyText(buildApiUrl(`response/export/${this.resolvedFormId}`)).then(this.showApiCopied);
        },
        copyApiUrl() {
            return this.copyFormApiUrl();
        }
    }
};
</script>

<style scoped>
.back-link-btn {
    display: inline-flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 7px 14px;
    font-size: 0.84rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.back-link-btn:hover {
    border-color: #8c1515;
    color: #8c1515;
    background: #fffafa;
}

.status-pill {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 700;
}

.status-pill--active { background: #ecfdf5; color: #047857; }
.status-pill--pending { background: #fffbeb; color: #b45309; }
.status-pill--closed { background: #fef2f2; color: #b91c1c; }

.meta-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
    background: #ffffff;
    border: 1px solid #e2e8f0;
}

.analytics-state-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
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

::v-deep .btn-export-analytics {
    background: #8c1515 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 6px 14px !important;
    font-size: 0.82rem !important;
    font-weight: 600 !important;
    height: 36px;
    display: inline-flex;
    align-items: center;
}

::v-deep .btn-export-analytics:hover {
    background: #721010 !important;
}

::v-deep .export-dropdown .dropdown-menu {
    z-index: 1050;
    min-width: 195px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    padding: 6px;
}

::v-deep .export-dropdown .dropdown-item {
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.84rem;
    font-weight: 500;
    display: flex;
    align-items: center;
}

.kpi-grid {
    display: grid;
    gap: 16px;
}

.kpi-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.kpi-grid--4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.kpi-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px 20px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
}

.kpi-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
}

.kpi-value-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px;
}

.kpi-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
}

.kpi-target {
    font-size: 0.95rem;
    font-weight: 600;
    color: #64748b;
    font-variant-numeric: tabular-nums;
}

.kpi-rate-badge {
    margin-left: auto;
    font-size: 0.8125rem;
    font-weight: 700;
    color: #047857;
    background: #ecfdf5;
    padding: 2px 8px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
}

.kpi-subtext {
    font-size: 0.8125rem;
    color: #64748b;
    font-variant-numeric: tabular-nums;
}

@media (max-width: 991.98px) {
    .kpi-grid--3,
    .kpi-grid--4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 767.98px) {
    .detail-actions {
        width: 100%;
    }

    .analytics-segmented-control {
        width: 100%;
        display: flex;
        overflow-x: auto;
    }

    .segmented-btn {
        flex: 1 1 auto;
        padding: 6px 10px;
        font-size: 0.8125rem;
    }

    .export-dropdown {
        flex: 1 1 auto;
    }

    ::v-deep .export-dropdown .dropdown-toggle,
    ::v-deep .btn-export-analytics,
    ::v-deep .btn-individual-responses {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 575.98px) {
    .kpi-grid--3,
    .kpi-grid--4 {
        grid-template-columns: 1fr;
    }
}
</style>
