<template>
    <div class="chart-wrapper-container premium-card shadow-sm">
        <div class="header mb-4 pt-1">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold text-dark-blue">{{ $t('analytics.responsesOverTime') }}</h4>
                <div class="ml-auto">
                    <CButtonGroup class="premium-button-group">
                        <CButton v-for="range in ['7d', '30d', '1y']" :key="range" size="sm" :variant="timeRange === range ? '' : 'ghost'"
                            :color="timeRange === range ? 'maroon' : 'secondary'" @click="$emit('time-range-change', range)"
                            class="px-3 py-2 range-btn" :class="{ 'active-range': timeRange === range }">
                            {{ $t(`analytics.timeRange.${range}`) }}
                        </CButton>
                    </CButtonGroup>
                </div>
            </div>
            <p class="text-muted-modern small mb-0">{{ $t('analytics.responsesOverTimeDesc') }}</p>
        </div>

        <div class="chart-container">
            <CChartLine :datasets="defaultDatasets" :labels="labels" :options="defaultOptions" />
        </div>
    </div>
</template>

<script>
import { CChartLine } from '@coreui/vue-chartjs'
import { mapGetters } from 'vuex'
import moment from 'moment'
import localeMixin from '@/mixins/localeMixin'
import { getFilteredResponses } from '@/projects/utils/analytics'

export default {
    name: 'AdminLineCharts',
    components: { CChartLine },
    mixins: [localeMixin],
    props: {
        timeRange: {
            type: String,
            default: '7d'
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),

        chartData() {
            const labels = [];
            const dataMap = {};
            moment.locale(this.$i18n.locale);
            const now = moment();

            if (this.timeRange === '1y') {
                // Monthly aggregation for 1 year
                for (let i = 11; i >= 0; i--) {
                    const monthKey = moment().subtract(i, 'months').format('YYYY-MM');
                    const displayKey = moment().subtract(i, 'months').format('MMM YY');
                    labels.push(displayKey);
                    dataMap[monthKey] = 0;
                }
            } else {
                // Daily aggregation for 7d and 30d
                const days = this.timeRange === '30d' ? 30 : 7;
                for (let i = days - 1; i >= 0; i--) {
                    const dateKey = moment().subtract(i, 'days').format('YYYY-MM-DD');
                    const displayKey = moment().subtract(i, 'days').format('DD MMM');
                    labels.push(displayKey);
                    dataMap[dateKey] = 0;
                }
            }

            this.forms.forEach(form => {
                const submittedResponses = getFilteredResponses(form, this.timeRange, now);
                submittedResponses.forEach(res => {
                    if (res && res.createdAt) {
                        const d = moment(res.createdAt);
                        let key;
                        if (this.timeRange === '1y') {
                            key = d.format('YYYY-MM');
                        } else {
                            key = d.format('YYYY-MM-DD');
                        }

                        if (dataMap[key] !== undefined) {
                            dataMap[key]++;
                        }
                    }
                });
            });

            const dataCounts = Object.values(dataMap);
            return { labels, data: dataCounts };
        },

        labels() {
            return this.chartData.labels;
        },

        defaultDatasets() {
            return [
                {
                    label: this.$t('table.responses'),
                    backgroundColor: 'rgba(155, 27, 48, 0.08)', // Premium Soft Maroon
                    borderColor: '#9B1B30', // Theme Maroon
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#9B1B30',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#9B1B30',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3,
                    borderWidth: 3,
                    fill: 'start',
                    tension: 0.4,
                    data: this.chartData.data
                }
            ]
        },

        defaultOptions() {
            const maxVal = Math.max(...this.chartData.data, 10);
            return {
                maintainAspectRatio: false,
                responsive: true,
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    }
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        offset: false,
                        gridLines: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            fontColor: '#94a3b8',
                            fontSize: 10,
                            padding: 4, // Tighter padding for bottom fit
                            maxRotation: 0,
                            autoSkip: true
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            maxTicksLimit: 6,
                            stepSize: Math.ceil(maxVal / 5),
                            fontColor: '#94a3b8',
                            fontSize: 11,
                            padding: 10,
                            display: true
                        },
                        gridLines: {
                            display: true,
                            color: '#f1f5f9',
                            drawBorder: false,
                            zeroLineColor: 'transparent',
                            offsetGridLines: false
                        }
                    }]
                },
                tooltips: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1e293b',
                    titleFontColor: '#fff',
                    titleFontSize: 13,
                    titleFontStyle: 'bold',
                    bodyFontColor: '#e2e8f0',
                    bodyFontSize: 12,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    xPadding: 16,
                    yPadding: 12,
                    displayColors: false,
                    cornerRadius: 12,
                    caretSize: 8,
                    bodySpacing: 4
                }
            }
        }
    }
}
</script>

<style scoped>
.chart-wrapper-container {
    background: white;
    padding: 24px 0 0 0; /* Remove bottom padding completely for bleed effect */
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Ensure anything bleeding is clipped by rounded corners */
    border: 1px solid #e2e8f0;
}

.premium-card {
    border-radius: 20px;
}

.header {
    padding: 0 24px;
    margin-bottom: 0.5rem; /* Further reduced to give more space to the chart */
}

.text-dark-blue {
    color: #1e293b;
    letter-spacing: -0.02em;
}

.text-muted-modern {
    color: #64748b;
    font-weight: 400;
}

.badge-soft-maroon {
    background-color: #fff1f2;
    color: #9B1B30;
    border-radius: 50px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.premium-button-group {
    background: #f8fafc;
    padding: 4px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.range-btn {
    border-radius: 8px !important;
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.2s ease;
    border: none !important;
}

.active-range {
    background-color: #9B1B30 !important;
    color: white !important;
    box-shadow: 0 4px 6px -1px rgba(155, 27, 48, 0.2);
}

.btn-ghost- marron:hover {
    background-color: #fff1f2;
    color: #9B1B30;
}

.chart-container {
    flex-grow: 1;
    position: relative;
    width: 100%;
    height: 100%; /* Ensure it fills the flex parent */
    padding: 0; /* Remove horizontal padding entirely for actual full-width chart */
}
</style>
