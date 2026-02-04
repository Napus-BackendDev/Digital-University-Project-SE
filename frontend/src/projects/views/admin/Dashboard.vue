<template>
    <div>
        <h1 class="mb-2 text-dark font-weight-bold">Admin Dashboard</h1>
        <h5 class="text-muted mb-4">Overview of all forms and responses</h5>

        <WidgetsDropdown class="mb-4" />

        <CRow class="mb-4">
            <CCol lg="8">
                <AdminTables />
            </CCol>
            <CCol lg="4">
                <AdminPieCharts />
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
import AdminPieCharts from '../../components/charts/AdminPieCharts.vue'
import AdminBarCharts from '../../components/charts/AdminBarCharts.vue'
import { mapGetters } from 'vuex'

export default {
    name: "Admin Dashboard",
    components: {
        WidgetsDropdown,
        AdminTables,
        AdminPieCharts,
        AdminBarCharts
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
            this.$store.dispatch('Forms/getForms');
        },
    },
    computed: {
        ...mapGetters('Forms', ['forms'])
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
