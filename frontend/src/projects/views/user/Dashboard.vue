<template>
    <div>
        <h1 class="mb-2 text-dark font-weight-bold">My Forms</h1>
        <h5 class="text-muted mb-4">Fill and submit your forms</h5>
        <CRow>
            <CCol col="12">
                <UserTables />
            </CCol>
        </CRow>
    </div>
</template>

<script>
import UserTables from '../../components/tables/EditorTables.vue'

export default {
    name: "UserDashboard",
    components: {
        UserTables
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
    }
}
</script>
