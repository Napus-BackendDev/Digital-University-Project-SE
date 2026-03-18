<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.forms')" :description="$t('table.header')" />
        <WidgetsDropdownUser :stats="stats" @filter="(status) => $refs.table.filterStatus(status)" />
        <FormTables ref="table" @update-stats="updateStats" />
    </div>
</template>

<script>
import FormTables from '../components/tables/FormTables.vue'
import WidgetsDropdownUser from '../components/widgets/WidgetsDropdownUser.vue'
import Header from '../components/Util/Header.vue'

export default {
    name: "Forms",
    components: {
        FormTables,
        WidgetsDropdownUser,
        Header
    },
    data() {
        return {
            stats: { total: 0, pending: 0, completed: 0, inProgress: 0 }
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
            this.$store.dispatch('Forms/get');
        },
        updateStats(newStats) {
            this.stats = newStats;
        }
    },
}
</script>

<style scoped></style>
