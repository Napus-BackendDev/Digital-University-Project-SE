<template>
    <div class="chart-wrapper-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <CIcon name="cil-chart" class="text-danger mr-2" size="lg" />
                <h4 class="m-0 font-weight-bold">{{ $t('analytics.mostResponded') }}</h4>
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
import localeMixin from '@/mixins/localeMixin'

export default {
    name: 'AdminBarCharts',
    components: { CChartHorizontalBar },
    mixins: [localeMixin],
    computed: {
        ...mapGetters('Forms', ['forms']),

        topForms() {
            if (!this.forms) return []
            // Sort by response count descending
            const sorted = [...this.forms].sort((a, b) => {
                const countA = a.responses ? a.responses.length : 0
                const countB = b.responses ? b.responses.length : 0
                return countB - countA
            })
            // Take top 5
            return sorted.slice(0, 5)
        },

        chartData() {
            const labels = []
            const data = []

            this.topForms.forEach(form => {
                labels.push(this.getLang(form.title) || 'Untitled Form')
                data.push(form.responses ? form.responses.length : 0)
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
