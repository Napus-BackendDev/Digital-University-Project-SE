<template>
    <div class="flex-grow-1">
        <Header :title="$t('analytics.dailyResponsesTrend')" :description="$t('analytics.dailyResponsesDesc')" />
        <WidgetsDropdown class="mb-4" />
        <CRow class="mb-4 no-gutters">
            <CCol lg="12" class="px-0">
                <AdminLineCharts />
            </CCol>
        </CRow>
        <CRow>
            <CCol lg="12">
                <AdminBarCharts />
            </CCol>
        </CRow>
        <CRow>
            <CCol lg="12" class="mt-4">
                <AdminTables />
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
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
            this.$store.dispatch('Forms/get');
        },
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
