<template>
    <div class="chart-wrapper-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <CIcon name="cil-chart" class="text-danger mr-2" size="lg" />
                <h4 class="m-0 font-weight-bold">Most Responded Form</h4>
            </div>
            <div class="text-muted small ">{{ $t('analytics.mostRespondedDesc') }}</div>
        </div>

        <div class="chart-container">
            <CChartHorizontalBar :datasets="defaultDatasets" :labels="chartData.labels" :options="defaultOptions"
                style="height: 300px;" />
        </div>
    </div>
</template>

<script>
import { CChartHorizontalBar } from '@coreui/vue-chartjs'
import { mapGetters } from 'vuex'
import moment from 'moment'
import localeMixin from '@/mixins/localeMixin'

export default {
    name: 'AdminBarCharts',
    components: { CChartHorizontalBar },
    mixins: [localeMixin],
    props: {
        timeRange: {
            type: String,
            default: '7d'
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),

        topForms() {
            if (!this.forms) return []
            // Sort by response count within range descending
            const sorted = [...this.forms].sort((a, b) => {
                const countA = this.getFilteredResponses(a).length;
                const countB = this.getFilteredResponses(b).length;
                return countB - countA
            })
            // Take top 5
            return sorted.slice(0, 5)
        },

        chartData() {
            const labels = []
            const data = []

            this.topForms.forEach(form => {
                // Initial title logic
                let title = 'default'
                if (form.title) {
                    if (Array.isArray(form.title)) {
                        const enItem = form.title.find(item => item.key === 'en')
                        title = enItem ? enItem.value : (form.title[0]?.value)
                    } else {
                        title = form.title
                    }
                }
                labels.push(title)

                data.push(this.getFilteredResponses(form).length)
            })

            return { labels, data }
        },

        defaultDatasets() {
            return [
                {
                    label: this.$t('table.responses'),
                    backgroundColor: '#9B1B30',
                    data: this.chartData.data,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        },
        defaultOptions() {
            // Find max value to set scale slightly higher
            const maxVal = Math.max(...this.chartData.data, 0)
            const tickMax = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.2) // Add 20% breathing room
            const stepSize = Math.ceil(tickMax / 5)

            return {
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: tickMax,
                            stepSize: stepSize || 1 // Prevent 0 step size
                        },
                        gridLines: {
                            display: true,
                            borderDash: [5, 5],
                            color: '#f0f0f0'
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            fontColor: '#5c6873',
                            fontSize: 12
                        }
                    }]
                },
                tooltips: {
                    enabled: true,
                    displayColors: false
                }
            }
        }
    },
    methods: {
        getFilteredResponses(form) {
            if (!form || !form.responses) return [];
            return form.responses.filter(r => {
                const isSubmitted = r && (
                    r.submit === true || 
                    r.submit === 1 || 
                    String(r.submit).toLowerCase() === 'true'
                );
                if (!isSubmitted) return false;
                if (!r.createdAt) return false;

                const createdAt = moment(r.createdAt);
                if (this.timeRange === '7d') {
                    return createdAt.isSameOrAfter(moment().subtract(7, 'days'), 'day');
                } else if (this.timeRange === '30d') {
                    return createdAt.isSameOrAfter(moment().subtract(30, 'days'), 'day');
                } else if (this.timeRange === '1y') {
                    return createdAt.isSameOrAfter(moment().subtract(1, 'years'), 'day');
                }
                return true;
            });
        }
    }
}
</script>

<style scoped>
.chart-wrapper-container {
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 20px;
    height: 100%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header h4 {
    color: #2d3748;
}

.text-muted {
    color: #718096 !important;
}
</style>
