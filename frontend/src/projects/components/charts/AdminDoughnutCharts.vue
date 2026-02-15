<template>
    <div class="chart-wrapper-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold">Forms by Status</h4>
            </div>
            <div class="text-muted small ">Current form distribution</div>
        </div>

        <div class="chart-container mb-4">
            <CChartDoughnut :datasets="defaultDatasets" :labels="['Open', 'Draft', 'Closed']"
                :options="defaultOptions" />
        </div>

        <div class="custom-legend">
            <div class="legend-item d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <span class="legend-dot bg-success"></span>
                    <span class="text-muted">Open</span>
                </div>
                <span class="font-weight-bold">{{ statusCounts.Open }}</span>
            </div>
            <div class="legend-item d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <span class="legend-dot bg-warning"></span>
                    <span class="text-muted">Draft</span>
                </div>
                <span class="font-weight-bold">{{ statusCounts.Draft }}</span>
            </div>
            <div class="legend-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <span class="legend-dot" style="background-color: #6c757d;"></span>
                    <span class="text-muted">Closed</span>
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
                let statusRaw = ''
                if (form.status && form.status.title) {
                    if (Array.isArray(form.status.title)) {
                        const enItem = form.status.title.find(item => item.key === 'en')
                        statusRaw = enItem ? enItem.value : (form.status.title[0]?.value || '')
                    } else {
                        statusRaw = form.status.title
                    }
                }

                statusRaw = statusRaw.toLowerCase()

                let status = 'Draft'
                if (statusRaw.includes('open') || statusRaw.includes('publish')) status = 'Open'
                else if (statusRaw.includes('close')) status = 'Closed'
                else if (statusRaw.includes('draft')) status = 'Draft'

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
        getLang(data) {
            if (!data || !Array.isArray(data)) return data;
            const currentLang = this.$i18n.locale;
            let content = data.find(item => item.key === currentLang);
            if (!content) content = data.find(item => item.key === 'en');
            if (!content && data.length > 0) content = data[0];
            return content ? content.value : '';
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
