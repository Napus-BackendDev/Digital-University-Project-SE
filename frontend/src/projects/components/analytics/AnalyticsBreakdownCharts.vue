<template>
    <CRow class="mb-4">
        <!-- Left: Participation by Organization / Role -->
        <CCol lg="8" class="mb-4 mb-lg-0">
            <div class="analytics-card h-100 d-flex flex-column justify-content-between">
                <div>
                    <div class="d-flex justify-content-between align-items-start flex-wrap mb-3" style="gap: 12px;">
                        <div>
                            <h5 class="m-0 font-weight-bold text-dark">{{ $t('analytics.breakdownTitle') }}</h5>
                            <div class="text-muted small mt-1">{{ $t('analytics.breakdownDesc') }}</div>
                        </div>
                        <div class="segmented-mini">
                            <button
                                type="button"
                                class="segmented-mini-btn"
                                :class="{ active: activeDimension === 'org' }"
                                @click="activeDimension = 'org'">
                                {{ $t('analytics.byOrganization') }}
                            </button>
                            <button
                                type="button"
                                class="segmented-mini-btn"
                                :class="{ active: activeDimension === 'role' }"
                                @click="activeDimension = 'role'">
                                {{ $t('analytics.byRole') }}
                            </button>
                        </div>
                    </div>

                    <div v-if="activeRows.length === 0" class="py-4">
                        <EmptyState
                            borderless
                            icon="cil-chart"
                            :title="$t('analytics.noBreakdownData')"
                        />
                    </div>

                    <template v-else>
                        <CChartBar
                            :datasets="barDatasets"
                            :labels="barLabels"
                            :options="barOptions"
                            style="height: 230px"
                        />

                        <div class="breakdown-chips mt-3">
                            <div v-for="item in activeRows" :key="item.id" class="breakdown-chip">
                                <span class="font-weight-bold text-dark mr-2">{{ item.label }}</span>
                                <span v-if="item.target > 0" class="text-muted small mr-2">{{ item.completed }} / {{ item.target }}</span>
                                <span v-else class="text-muted small mr-2">{{ item.completed }} {{ $t('table.completed') }}</span>
                                <span v-if="item.target > 0" class="rate-pill">{{ item.rate }}%</span>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </CCol>

        <!-- Right: Respondent Channel & Overall Rating Benchmark -->
        <CCol lg="4">
            <div class="analytics-card h-100 d-flex flex-column justify-content-between">
                <div>
                    <h5 class="m-0 font-weight-bold text-dark">{{ $t('analytics.channelAndRating') }}</h5>
                    <div class="text-muted small mt-1 mb-3">{{ $t('analytics.channelMixDesc') }}</div>

                    <div v-if="totalChannelCount > 0" :class="showRating ? 'mb-3' : 'mb-0'">
                        <CChartDoughnut
                            :datasets="channelDatasets"
                            :labels="channelLabels"
                            :options="doughnutOptions"
                            style="height: 155px"
                        />
                        <div class="d-flex justify-content-around text-center mt-2">
                            <div>
                                <div class="small font-weight-bold text-dark">{{ summary.signedInResponses || 0 }}</div>
                                <div class="text-muted" style="font-size: 0.8125rem;">
                                    <span class="dot-inline" style="background: #8c1515;"></span>
                                    {{ $t('analytics.signedInUsers') }}
                                </div>
                            </div>
                            <div>
                                <div class="small font-weight-bold text-dark">{{ summary.guestResponses || 0 }}</div>
                                <div class="text-muted" style="font-size: 0.8125rem;">
                                    <span class="dot-inline" style="background: #0ea5e9;"></span>
                                    {{ $t('analytics.guestAnonymous') }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-muted small text-center py-3">
                        {{ $t('analytics.noBreakdownData') }}
                    </div>

                    <template v-if="showRating">
                        <hr class="my-3" />

                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2" style="gap: 8px;">
                                <span class="small font-weight-bold text-dark">{{ $t('analytics.ratingDistributionLabel') }}</span>
                                <span v-if="summary.avgRating !== null" class="badge badge-warning px-2 py-1 flex-shrink-0">
                                    {{ summary.avgRating.toFixed(2) }} ★ ({{ summary.totalRatingCount }})
                                </span>
                            </div>
                            <div v-if="(summary.totalRatingCount || 0) === 0" class="text-muted small">
                                {{ $t('analytics.noRatingData') }}
                            </div>
                            <div v-else class="rating-bars">
                                <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="rating-row">
                                    <span class="rating-star-lbl">{{ star }}★</span>
                                    <div class="rating-track">
                                        <div
                                            class="rating-fill"
                                            :style="{ width: getRatingPercent(star) + '%' }"
                                        ></div>
                                    </div>
                                    <span class="rating-count-lbl">{{ (summary.ratingDistribution && summary.ratingDistribution[star - 1]) || 0 }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </CCol>
    </CRow>
</template>

<script>
import { CChartBar, CChartDoughnut } from '@coreui/vue-chartjs';
import EmptyState from '@/projects/components/Util/EmptyState.vue';

export default {
    name: 'AnalyticsBreakdownCharts',
    components: {
        CChartBar,
        CChartDoughnut,
        EmptyState
    },
    props: {
        breakdown: {
            type: Object,
            default: () => ({ byOrganization: [], byRole: [] })
        },
        summary: {
            type: Object,
            default: () => ({
                signedInResponses: 0,
                guestResponses: 0,
                avgRating: null,
                totalRatingCount: 0,
                ratingDistribution: [0, 0, 0, 0, 0]
            })
        },
        showRating: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            activeDimension: 'org',
            barOptions: {
                maintainAspectRatio: false,
                legend: { display: true, position: 'top', labels: { boxWidth: 12, fontColor: '#475569' } },
                scales: {
                    xAxes: [{
                        gridLines: { display: false },
                        ticks: { fontColor: '#475569' }
                    }],
                    yAxes: [{
                        gridLines: { color: '#f1f5f9', drawBorder: false },
                        ticks: { beginAtZero: true, precision: 0, fontColor: '#64748b' }
                    }]
                }
            },
            doughnutOptions: {
                maintainAspectRatio: false,
                cutoutPercentage: 65,
                legend: { display: false }
            }
        };
    },
    computed: {
        activeRows() {
            const list = this.activeDimension === 'role'
                ? (this.breakdown && this.breakdown.byRole) || []
                : (this.breakdown && this.breakdown.byOrganization) || [];
            return list.slice(0, 8);
        },
        barLabels() {
            return this.activeRows.map(r => r.label);
        },
        barDatasets() {
            return [
                {
                    label: this.$t('table.completed'),
                    backgroundColor: '#8c1515',
                    maxBarThickness: 56,
                    data: this.activeRows.map(r => r.completed)
                },
                {
                    label: this.$t('analytics.targetAudienceBar'),
                    backgroundColor: '#e2e8f0',
                    maxBarThickness: 56,
                    data: this.activeRows.map(r => r.target)
                }
            ];
        },
        totalChannelCount() {
            return Number(this.summary.signedInResponses || 0) + Number(this.summary.guestResponses || 0);
        },
        channelLabels() {
            return [this.$t('analytics.signedInUsers'), this.$t('analytics.guestAnonymous')];
        },
        channelDatasets() {
            return [{
                backgroundColor: ['#8c1515', '#0ea5e9'],
                borderWidth: 0,
                data: [this.summary.signedInResponses || 0, this.summary.guestResponses || 0]
            }];
        }
    },
    methods: {
        getRatingPercent(star) {
            const total = Number(this.summary.totalRatingCount || 0);
            if (!total) return 0;
            const count = (this.summary.ratingDistribution && this.summary.ratingDistribution[star - 1]) || 0;
            return Math.round((count / total) * 100);
        }
    }
};
</script>

<style scoped>
.analytics-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
}

.segmented-mini {
    display: inline-flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
}

.segmented-mini-btn {
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
    padding: 5px 12px;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.segmented-mini-btn.active {
    background: #ffffff;
    color: #8c1515;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.breakdown-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.breakdown-chip {
    display: inline-flex;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 0.8125rem;
}

.breakdown-chip .small {
    font-size: 0.8125rem;
}

.badge-warning {
    font-size: 0.8125rem;
}

.rate-pill {
    background: #ecfdf5;
    color: #059669;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 0.8125rem;
}

.dot-inline {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 4px;
}

.rating-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.rating-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8125rem;
}

.rating-star-lbl {
    width: 26px;
    font-weight: 700;
    color: #b45309;
}

.rating-track {
    flex: 1;
    height: 8px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
}

.rating-fill {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #d97706);
    border-radius: 999px;
}

.rating-count-lbl {
    width: 28px;
    text-align: right;
    color: #64748b;
    font-weight: 600;
}

@media (max-width: 575.98px) {
    .analytics-card {
        padding: 16px;
    }

    .segmented-mini {
        width: 100%;
        display: flex;
    }

    .segmented-mini-btn {
        flex: 1;
        text-align: center;
    }
}
</style>
