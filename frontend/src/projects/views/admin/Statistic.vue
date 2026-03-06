<template>
    <div class="flex-grow-1">
        <Header title="Admin Dashboard" description="Overview of all forms and responses" />
        <WidgetsDropdown class="mb-4" />
        <CRow class="mb-4">
            <CCol lg="8">
                <AdminTables />
            </CCol>
            <CCol lg="4">
                <AdminDoughnutCharts />
            </CCol>
        </CRow>
        <CRow>
            <CCol lg="12">
                <AdminBarCharts />
            </CCol>
        </CRow>
    </div>
</template>

<script>    
import WidgetsDropdown from '../../components/widgets/WidgetsDropdown.vue'
import AdminTables from '../../components/tables/AdminTables.vue';
import AdminDoughnutCharts from '../../components/charts/AdminDoughnutCharts.vue'
import AdminBarCharts from '../../components/charts/AdminBarCharts.vue'
import Header from '../../components/Util/Header.vue'

export default {
    name: "Admin Dashboard",
    components: {
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
                console.log('Forms:', val)
            },
            deep: true,
            immediate: true
        }
    }
}
</script>

<style scoped></style>
