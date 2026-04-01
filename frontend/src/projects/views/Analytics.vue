<template>
    <div class="flex-grow-1">
        <Header :title="$t('analytics.dailyResponsesTrend')" :description="$t('analytics.dailyResponsesDesc')" />
        <WidgetsDropdown class="mb-4" :timeRange="timeRange" />
        <CRow class="mb-4 no-gutters">
            <CCol lg="12" class="px-0">
                <AdminLineCharts :timeRange="timeRange" @time-range-change="handleTimeRangeChange" />
            </CCol>
        </CRow>
        <CRow>
            <CCol lg="12">
                <AdminBarCharts :timeRange="timeRange" />
            </CCol>
        </CRow>
        <CRow>
            <CCol lg="12" class="mt-4">
                <AdminTables :timeRange="timeRange" />
            </CCol>
        </CRow>
    </div>
</template>

<script>
import WidgetsDropdown from '../components/widgets/WidgetsDropdown.vue'
import AdminTables from '../components/tables/AdminTables.vue';
import AdminDoughnutCharts from '../components/charts/AdminDoughnutCharts.vue'
import AdminBarCharts from '../components/charts/AdminBarCharts.vue'
import Header from '../components/Util/Header.vue'
import AdminLineCharts from '../components/charts/AdminLineCharts.vue';

export default {
    name: "Dashboard",
    components: {
        AdminLineCharts,
        WidgetsDropdown,
        AdminTables,
        AdminDoughnutCharts,
        AdminBarCharts,
        Header
    },
    data() {
        return {
            timeRange: '7d'
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
            this.$store.dispatch('Forms/get');
            this.$store.dispatch('User/getAll');
        },
        handleTimeRangeChange(newRange) {
            this.timeRange = newRange;
        }
    },
    computed: {
    },
    watch: {
        forms: {
            handler(val) {
            },
            deep: true,
            immediate: true
        }
    }
}
</script>

<style scoped></style>
