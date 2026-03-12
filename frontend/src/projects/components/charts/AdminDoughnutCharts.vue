<template>
    <div class="chart-wrapper-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold">{{ $t('chart.formsByStatus') }}</h4>
            </div>
            <div class="text-muted small ">{{ $t('chart.distribution') }}</div>
        </div>

        <div class="chart-container mb-4">
            <CChartDoughnut :datasets="defaultDatasets" :labels="[$t('status.open'), $t('status.draft'), $t('status.closed')]"
                :options="defaultOptions" />
        </div>

        <div class="custom-legend">
            <div class="legend-item d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <span class="legend-dot bg-success"></span>
                    <span class="text-muted">{{ $t('status.open') }}</span>
                </div>
                <span class="font-weight-bold">{{ statusCounts.Open }}</span>
            </div>
            <div class="legend-item d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <span class="legend-dot bg-warning"></span>
                    <span class="text-muted">{{ $t('status.draft') }}</span>
                </div>
                <span class="font-weight-bold">{{ statusCounts.Draft }}</span>
            </div>
            <div class="legend-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <span class="legend-dot" style="background-color: #6c757d;"></span>
                    <span class="text-muted">{{ $t('status.closed') }}</span>
                </div>
                <span class="font-weight-bold">{{ statusCounts.Closed }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { CChartDoughnut } from '@coreui/vue-chartjs'
import { mapGetters } from 'vuex'

export default {
    name: 'AdminDoughnutCharts',
    components: { CChartDoughnut },
    computed: {
        ...mapGetters('Forms', ['forms']),

        statusCounts() {
            const counts = { Open: 0, Draft: 0, Closed: 0 };

            this.forms.forEach(form => {
                let status = 'Draft';
                const now = new Date();
                const schedule = form.schedule || (form.settings && form.settings.schedule);

                if (schedule && schedule.startAt) {
                    const start = new Date(schedule.startAt);
                    const end = new Date(schedule.endAt);

                    if (!start && !end) {
                        status = 'Draft';
                    } else if (start <= now && now <= end) {
                        status = 'Open';
                    } else {
                        status = 'Closed';
                    }
                }

                counts[status]++
            })

            return counts
        },

        defaultDatasets() {
            return [
                {
                    backgroundColor: [
                        '#4dbd74', // Green - Open
                        '#f9b115', // Yellow - Draft
                        '#6c757d'  // Grey - Closed
                    ],
                    data: [
                        this.statusCounts.Open,
                        this.statusCounts.Draft,
                        this.statusCounts.Closed
                    ],
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
    },
    methods: {
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
