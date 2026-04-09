<template>
    <CRow class="mb-4">
        <CCol class="mb-4 mb-lg-0">
            <div class="response-trends-container h-100">
                <div class="header mb-4">
                    <h4 class="m-0 font-weight-bold">Submission Activity Trend</h4>
                    <div class="text-muted small mt-1">Overview of responses based on {{ timeRangeLabel }}</div>
                </div>
                <CChartLine
                    :datasets="computedTrendChartData"
                    :labels="computedTrendChartLabels"
                    :options="trendChartOptions"
                    style="height: 280px"
                />
            </div>
        </CCol>
    </CRow>
</template>

<script>
import { CChartLine } from '@coreui/vue-chartjs'
import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
    name: 'SubmissionTrendChart',
    components: {
        CChartLine
    },
    props: {
        timeRange: {
            type: String,
            default: '7d'
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
                    xPadding: 16,
                    yPadding: 12,
                    displayColors: false,
                    intersect: false,
                    mode: 'index',
                },
                scales: {
                    xAxes: [{
                        gridLines: { display: false, drawBorder: false },
                        ticks: { fontColor: '#64748b', maxTicksLimit: 7 }
                    }],
                    yAxes: [{
                        gridLines: { color: '#f1f5f9', drawBorder: false, zeroLineColor: '#f1f5f9' },
                        ticks: { beginAtZero: true, fontColor: '#64748b', maxTicksLimit: 5, padding: 10 }
                    }]
                },
                elements: {
                    point: { radius: 0, hitRadius: 10, hoverRadius: 4, hoverBorderWidth: 3 }
                }
            }
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user']),

        timeRangeLabel() {
            if (this.timeRange === '1d') return 'Today';
            if (this.timeRange === '7d') return '7 Days';
            return '30 Days';
        },

        chartDataObj() {
            if (!this.forms || !this.user) return { labels: [], data: [] };

            const myForms = this.forms.filter(f => {
                const creatorId = f.creator && f.creator._id ? f.creator._id : f.creator;
                return String(creatorId) === String(this.user._id);
            });

            let formatStr = 'MMM DD';
            let loopCount = 0;
            let unit = 'days';
            
            if (this.timeRange === '1d') {
                formatStr = 'HH:00';
                loopCount = 24;
                unit = 'hours';
            } else if (this.timeRange === '7d') {
                loopCount = 7;
            } else if (this.timeRange === '30d') {
                loopCount = 30;
            }

            const dataMap = {};
            const labels = [];
            
            for (let i = loopCount - 1; i >= 0; i--) {
                const d = moment().subtract(i, unit);
                const key = d.format(formatStr);
                labels.push(key);
                dataMap[key] = 0;
            }

            myForms.forEach(f => {
                if (!f.responses) return;
                f.responses.forEach(r => {
                    const isSubmitted = r && (r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true');
                    if (!isSubmitted || !r.createdAt) return;

                    const rDate = moment(r.createdAt);
                    if (this.timeRange === '1d' && !rDate.isSame(moment(), 'day')) return;
                    if (this.timeRange !== '1d' && rDate.isBefore(moment().subtract(loopCount, 'days'), 'day')) return;

                    const key = rDate.format(formatStr);
                    if (dataMap[key] !== undefined) {
                        dataMap[key]++;
                    }
                });
            });

            return { labels, data: labels.map(l => dataMap[l]) };
        },

        computedTrendChartData() {
            return [{
                label: 'Submissions',
                backgroundColor: 'rgba(50, 31, 219, 0.08)',
                borderColor: '#321fdb',
                pointBackgroundColor: '#321fdb',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#321fdb',
                borderWidth: 3,
                lineTension: 0.4,
                data: this.chartDataObj.data
            }];
        },

        computedTrendChartLabels() {
            return this.chartDataObj.labels;
        }
    }
}
</script>

<style scoped>
.response-trends-container {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
</style>
