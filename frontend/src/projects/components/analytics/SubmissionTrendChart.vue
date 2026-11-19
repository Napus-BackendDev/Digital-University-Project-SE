<template>
    <div class="response-trends-container h-100 d-flex flex-column justify-content-between">
        <div>
            <div class="d-flex justify-content-between align-items-start flex-wrap mb-3" style="gap: 12px;">
                <div>
                    <h4 class="m-0 font-weight-bold trend-title">{{ $t('analytics.submissionTrend') }}</h4>
                    <div class="text-muted small mt-1">{{ $t('analytics.overviewBasedOn', { range: timeRangeLabel }) }}</div>
                </div>
                <div class="d-flex align-items-center flex-wrap" style="gap: 14px;">
                    <span class="legend-item">
                        <span class="legend-dot legend-dot--completed"></span>
                        {{ $t('analytics.submissions') }}
                        <strong class="legend-num">{{ periodCompletedTotal }}</strong>
                    </span>
                    <span class="legend-item">
                        <span class="legend-dot legend-dot--ongoing"></span>
                        {{ $t('analytics.ongoingDrafts') }}
                        <strong class="legend-num">{{ periodOngoingTotal }}</strong>
                    </span>
                </div>
            </div>
        </div>
        <CChartLine
            :datasets="computedTrendChartData"
            :labels="computedTrendChartLabels"
            :options="trendChartOptions"
            style="height: 295px"
        />
    </div>
</template>

<script>
import { CChartLine } from '@coreui/vue-chartjs';
import { mapGetters } from 'vuex';
import { buildTrendSeries, filterFormsByUserAccess } from '@/projects/utils/analytics';

export default {
    name: 'SubmissionTrendChart',
    components: {
        CChartLine
    },
    props: {
        timeRange: {
            type: String,
            default: 'all'
        },
        trendData: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            trendChartOptions: {
                maintainAspectRatio: false,
                legend: { display: false },
                tooltips: {
                    backgroundColor: '#ffffff',
                    titleFontColor: '#1e293b',
                    bodyFontColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    xPadding: 14,
                    yPadding: 10,
                    displayColors: true,
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    xAxes: [{
                        gridLines: { display: false, drawBorder: false },
                        ticks: { fontColor: '#64748b', maxTicksLimit: 10 }
                    }],
                    yAxes: [{
                        gridLines: { color: '#f1f5f9', drawBorder: false, zeroLineColor: '#f1f5f9' },
                        ticks: { beginAtZero: true, precision: 0, fontColor: '#64748b', maxTicksLimit: 5, padding: 10 }
                    }]
                },
                elements: {
                    point: { radius: 2, hitRadius: 10, hoverRadius: 5, hoverBorderWidth: 2 }
                }
            }
        };
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('Responses', ['responses']),
        ...mapGetters('User', ['user']),

        timeRangeLabel() {
            if (this.timeRange === '1d') return this.$t('analytics.today');
            if (this.timeRange === '7d') return this.$t('analytics.oneWeek');
            if (this.timeRange === '30d') return this.$t('analytics.oneMonth');
            return this.$t('analytics.allTime');
        },

        resolvedTrend() {
            if (this.trendData && Array.isArray(this.trendData.labels)) {
                return this.trendData;
            }
            return buildTrendSeries(filterFormsByUserAccess(this.forms || [], this.user), {
                allResponses: this.responses || [],
                timeRange: this.timeRange
            });
        },

        computedTrendChartData() {
            return [
                {
                    label: this.$t('analytics.submissions'),
                    backgroundColor: 'rgba(140, 21, 21, 0.08)',
                    borderColor: '#8c1515',
                    pointBackgroundColor: '#8c1515',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#8c1515',
                    borderWidth: 3,
                    lineTension: 0.35,
                    data: this.resolvedTrend.completedData || []
                },
                {
                    label: this.$t('analytics.ongoingDrafts'),
                    backgroundColor: 'rgba(217, 119, 6, 0.04)',
                    borderColor: '#d97706',
                    borderDash: [6, 4],
                    pointBackgroundColor: '#d97706',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#d97706',
                    borderWidth: 2,
                    lineTension: 0.35,
                    data: this.resolvedTrend.ongoingData || []
                }
            ];
        },

        computedTrendChartLabels() {
            return this.resolvedTrend.labels || [];
        },

        periodCompletedTotal() {
            return (this.resolvedTrend.completedData || []).reduce((acc, val) => acc + (Number(val) || 0), 0);
        },

        periodOngoingTotal() {
            return (this.resolvedTrend.ongoingData || []).reduce((acc, val) => acc + (Number(val) || 0), 0);
        }
    }
};
</script>

<style scoped>
.response-trends-container {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 22px;
}

.trend-title {
    font-size: 1rem;
    letter-spacing: -0.01em;
}

.legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
}

.legend-num {
    color: #0f172a;
    background: #f1f5f9;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
}

.legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
}

.legend-dot--completed {
    background-color: #8c1515;
}

.legend-dot--ongoing {
    background-color: #d97706;
}

@media (max-width: 575.98px) {
    .response-trends-container {
        padding: 16px;
    }
}
</style>
