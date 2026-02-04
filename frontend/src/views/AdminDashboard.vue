<template>
    <div>
        <PageHeader :title="$t('dashboard.title')" :subtitle="$t('dashboard.subtitle')" />
        <div class="Page-Card-Header">
            <div class="Card-Form">
                <div class="content">
                    <h1>{{ dataForms.length }} </h1>
                    <span>{{ $t('dashboard.totalForms') }}</span>
                </div>
                <div class="icon-wrapper red">
                    <Icon icon="material-symbols:docs-outline" width="32" height="32" />
                </div>
            </div>
            <div class="Card-Response">
                <div class="content">
                    <h1>{{ responses.length }} </h1>
                    <span>{{ $t('dashboard.totalResponses') }}</span>
                </div>
                <div class="icon-wrapper green">
                    <Icon icon="material-symbols:supervisor-account-outline-rounded" width="32" height="32" />
                </div>
            </div>
            <div class="Card-ActiveForms">
                <div class="content">
                    <h1>{{ ActiveForms.length }} </h1>
                    <span>{{ $t('dashboard.activeForms') }}</span>
                </div>
                <div class="icon-wrapper orange">
                    <Icon icon="material-symbols:show-chart-rounded" width="32" height="32" />
                </div>
            </div>
            <div class="Card-Avg-Responses">
                <div class="content">
                    <h1>{{ InactiveForms.length }} </h1>
                    <span>{{ $t('dashboard.avgResponses') }}</span>
                </div>
                <div class="icon-wrapper black">
                    <Icon icon="material-symbols:bar-chart-4-bars-rounded" width="32" height="32" />
                </div>
            </div>
        </div>
        <div class="Response-Trends-Container">
            <div class="Response-Trends">
                <div class="section-header">
                    <div>
                        <h1>{{ $t('dashboard.responseTrends') }}</h1>
                        <span>{{ $t('dashboard.responseTrendsSubtitle') }}</span>
                    </div>
                    <div class="icon-wrapper blue">
                        <Icon icon="material-symbols:show-chart-rounded" width="32" height="32" />
                    </div>
                </div>
                <FormTableAdmin :forms="paginatedForms" />
                <Pagination :current-page="currentPage" :total-pages="totalPages" @prev="previousPage" @next="nextPage"
                    @goto="goToPage" />
            </div>
            <div class="Response-Trends-Chart">
                <Icon icon="material-symbols:pie-chart-outline" width="24" height="24" />
                <h1>{{ $t('dashboard.formsByStatus') }}</h1>
                <span>{{ $t('dashboard.currentFormDistribution') }}</span>
                <div class="chart-container">
                    <PieChart :chartData="dataFormsPie" :chartOptions="pieChartOptions" />
                </div>
            </div>
        </div>
        <div class="Top-Performing-Forms">
            <h1>{{ $t('dashboard.topPerforming') }}</h1>
            <span>{{ $t('dashboard.topPerformingSubtitle') }}</span>
            <div class="Top-Performing-Forms-Chart">
                <div class="chart-container">
                    <BarChart :chartData="dataFormsBar" :chartOptions="barChartOptions" />
                </div>
            </div>
        </div>
        <div class="User-Role-Controls">
            <div class="section-header">
                <div>
                    <h1>{{ $t('dashboard.userRoleControl') }}</h1>
                    <span>{{ $t('dashboard.userRoleControlSubtitle') }}</span>
                </div>
                <div class="icon-wrapper blue">
                    <Icon icon="material-symbols:person" width="32" height="32" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import PageHeader from '@/components/PageHeader.vue'
import BarChart from '@/components/charts/Barcharts.vue'
import PieChart from '@/components/charts/PieCharts.vue'
import FormTableAdmin from '@/components/tables/FormTableAdmin.vue'
import Pagination from '@/components/Pagination.vue';

export default {
    name: 'AdminDashboard',
    components: {
        PageHeader,
        BarChart,
        PieChart,
        FormTableAdmin,
        Pagination
    },
    data() {
        return {
            responses: [],
            ActiveForms: [],
            InactiveForms: [],
            currentPage: 1,
            itemsPerPage: 5,
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false
            },
            barChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            },
            pieChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    },

    mounted() {

    },

    created() {
        this.onInit();
    },

    beforeDestroy() {

    },

    methods: {
        onInit() {
            this.$store.dispatch('form/getForms');
        },

        previousPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },

        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },

        goToPage(page) {
            this.currentPage = page;
        }

    },

    computed: {
        dataForms() {
            const forms = this.$store.getters['form/forms'];
            const locale = this.$i18n.locale;

            return forms.map(form => {
                const titleObj = form.title.find(item => item.key === locale);
                const descObj = form.description.find(item => item.key === locale);

                return {
                    ...form,
                    title: titleObj?.value || '',
                    description: descObj?.value || ''
                };
            });
        },

        dataFormsBar() {
            // Logic for Top Performing Forms (Bar Chart)
            const forms = this.$store.getters['form/forms'] || [];

            // 1. Map forms to include a mock response count (since we don't have real data yet)
            // Using a seeded random or stable value if possible, but here just random for demo
            const formsWithCounts = forms.map(f => {
                let title = 'Untitled';
                if (Array.isArray(f.title)) {
                    const en = f.title.find(t => t.key === 'en');
                    title = en ? en.value : (f.title[0]?.value || 'Untitled');
                } else {
                    title = f.title || 'Untitled';
                }

                return {
                    title: title,
                    count: Math.floor(Math.random() * 100) + 1 // Mock count
                };
            });

            // 2. Sort by count descending
            formsWithCounts.sort((a, b) => b.count - a.count);

            // 3. Take top 5
            const topForms = formsWithCounts.slice(0, 5);

            return {
                labels: topForms.map(f => f.title),
                datasets: [
                    {
                        label: 'Responses',
                        backgroundColor: '#EF4444',
                        data: topForms.map(f => f.count)
                    }
                ]
            };
        },

        pieStats() {
            const forms = this.$store.getters['form/forms'] || [];
            const statusCounts = { open: 0, closed: 0, draft: 0 };

            forms.forEach(form => {
                const status = form.status ? form.status.toLowerCase() : 'draft';
                if (statusCounts[status] !== undefined) statusCounts[status]++;
            });

            return [
                { label: 'Open', count: statusCounts.open, color: '#5D9C59' },    // Green
                { label: 'Draft', count: statusCounts.draft, color: '#DF9D3B' },  // Amber/Gold
                { label: 'Closed', count: statusCounts.closed, color: '#6D727B' } // Slate Gray
            ];
        },

        dataFormsPie() {
            return {
                labels: this.pieStats.map(s => s.label),
                datasets: [{
                    backgroundColor: this.pieStats.map(s => s.color),
                    data: this.pieStats.map(s => s.count),
                    borderWidth: 0,
                }]
            };
        },

        totalPages() {
            return Math.ceil(this.dataForms.length / this.itemsPerPage);
        },

        paginatedForms() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.dataForms.slice(start, end);
        }
    },

    watch: {
        forms: {
            handler(val) {
                console.log('Forms:', val)
            },
            deep: true,
            immediate: true
        }
    }
}
</script>

<style scoped>
.Page-Card-Header {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-top: 24px;
    margin-bottom: 32px;
}

.Page-Card-Header>div {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.content {
    display: flex;
    flex-direction: column;
}

.icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.blue {
    background-color: #E0F2FE;
    color: #0284C7;
}

.green {
    background-color: #DCFCE7;
    color: #16A34A;
}

.orange {
    background-color: #FFEDD5;
    color: #EA580C;
}

.red {
    background-color: #FEE2E2;
    color: #DC2626;
}

.black {
    background-color: #F3F4F6;
    color: #111827;
}

.Page-Card-Header>div:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.Page-Card-Header h1 {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
}

.Page-Card-Header span {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
}

.Response-Trends-Container {
    color: #111827;
    display: grid;
    grid-template-columns: 2.5fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
}

.Response-Trends,
.Response-Trends-Chart,
.Top-Performing-Forms,
.User-Role-Controls {
    color: #111827;
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.Top-Performing-Forms {
    margin-bottom: 32px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.chart-container {
    position: relative;
    width: 100%;
    height: 300px;
    margin-top: 20px;
    margin-bottom: 20px;
}
</style>