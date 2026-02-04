<template>
    <div class="pie-chart-wrapper">
        <div class="chart-area">
            <Pie id="my-chart-id" :options="chartOptions" :data="chartData" />
        </div>
        <div class="custom-legend" v-if="legendItems.length">
            <div v-for="(item, index) in legendItems" :key="index" class="legend-item">
                <div class="legend-info">
                    <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
                    <span class="legend-label">{{ item.label }}</span>
                </div>
                <span class="legend-count">{{ item.count }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default {
    name: 'PieChart',
    components: {
        Pie
    },
    props: {
        chartData: {
            type: Object,
            required: true
        },
        chartOptions: {
            type: Object,
            default: () => ({
                responsive: true,
                maintainAspectRatio: false
            })
        }
    },
    computed: {
        legendItems() {
            if (!this.chartData || !this.chartData.labels || !this.chartData.datasets) return [];

            const labels = this.chartData.labels;
            const dataset = this.chartData.datasets[0];

            if (!dataset || !dataset.data || !dataset.backgroundColor) return [];

            return labels.map((label, index) => ({
                label: label,
                count: dataset.data[index],
                color: dataset.backgroundColor[index]
            }));
        }
    }
}
</script>

<style scoped>
.pie-chart-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.chart-area {
    position: relative;
    height: 200px;
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}

.custom-legend {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.legend-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #374151;
}

.legend-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.legend-label {
    font-weight: 400;
    color: #4B5563;
}

.legend-count {
    font-weight: 600;
    color: #111827;
}
</style>
