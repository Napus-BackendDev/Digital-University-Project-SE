<template>
    <div class="chart-wrapper-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold">Forms by Status</h4>
            </div>
            <div class="text-muted small ">Current form distribution</div>
        </div>

        <div class="chart-container mb-4">
            <CChartPie :datasets="defaultDatasets" :labels="['Open', 'Draft', 'Closed']" :options="defaultOptions" />
        </div>

        <div class="custom-legend">
            <div class="legend-item d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <span class="legend-dot bg-success"></span>
                    <span class="text-muted">Open</span>
                </div>
                <span class="font-weight-bold">5</span>
            </div>
            <div class="legend-item d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <span class="legend-dot bg-warning"></span>
                    <span class="text-muted">Draft</span>
                </div>
                <span class="font-weight-bold">1</span>
            </div>
            <div class="legend-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <span class="legend-dot" style="background-color: #6c757d;"></span>
                    <span class="text-muted">Closed</span>
                </div>
                <span class="font-weight-bold">1</span>
            </div>
        </div>
    </div>
</template>

<script>
import { CChartPie } from '@coreui/vue-chartjs'

export default {
    name: 'AdminPieCharts',
    components: { CChartPie },
    computed: {
        defaultDatasets() {
            return [
                {
                    backgroundColor: [
                        '#4dbd74', // Green - Open
                        '#f9b115', // Yellow - Draft
                        '#6c757d'  // Grey - Closed
                    ],
                    data: [5, 1, 1],
                    borderWidth: 0
                }
            ]
        },
        defaultOptions() {
            return {
                maintainAspectRatio: false,
                cutoutPercentage: 70,
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: true
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
    display: flex;
    flex-direction: column;
}

.chart-container {
    height: 200px;
    position: relative;
    display: flex;
    justify-content: center;
}

.legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 10px;
    display: inline-block;
}

.header h4 {
    color: #2d3748;
}

.text-muted {
    color: #718096 !important;
}

.custom-legend {
    margin-top: auto;
    padding: 0 10px;
}
</style>
