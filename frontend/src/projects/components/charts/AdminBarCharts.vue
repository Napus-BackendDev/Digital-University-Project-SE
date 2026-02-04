<template>
    <div class="chart-wrapper-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <CIcon name="cil-chart" class="text-danger mr-2" size="lg" />
                <h4 class="m-0 font-weight-bold">Top Performing Forms</h4>
            </div>
            <div class="text-muted small ml-1">Forms with the most responses</div>
        </div>

        <!-- 
      Using CChartHorizontalBar if available for Chart.js 2.x which CoreUI usually wraps.
    -->
        <div class="chart-container">
            <CChartHorizontalBar :datasets="defaultDatasets" :labels="labels" :options="defaultOptions"
                style="height: 300px;" />
        </div>
    </div>
</template>

<script>
import { CChartHorizontalBar } from '@coreui/vue-chartjs'

export default {
    name: 'AdminBarCharts',
    components: { CChartHorizontalBar },
    data() {
        return {
            labels: [
                'Product Feature Request',
                'Customer Satisfaction Survey',
                'Event Registration Form',
                'Conference Feedback 2024',
                'Weekly Team Check-in'
            ]
        }
    },
    computed: {
        defaultDatasets() {
            return [
                {
                    label: 'Responses',
                    backgroundColor: '#9B1B30', // Deep Red
                    data: [235, 170, 95, 45, 15],
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        },
        defaultOptions() {
            return {
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: 240,
                            stepSize: 60
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
    border-radius: 8px;
    padding: 20px;
    height: 100%;
}

.header h4 {
    color: #2d3748;
}

.text-muted {
    color: #718096 !important;
}
</style>
