<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.manage')" :description="$t('description')" />
        <WidgetsDropdownUser />
        <ManagementTables />
    </div>
</template>

<script>
import ManagementTables from '../components/tables/ManagementTables.vue'
import WidgetsDropdownUser from '../components/widgets/WidgetsDropdownUser.vue'
import Header from '../components/Util/Header.vue'

export default {
    name: "EditorDashboard",
    components: {
        ManagementTables,
        WidgetsDropdownUser,
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
    }
}
</script>
