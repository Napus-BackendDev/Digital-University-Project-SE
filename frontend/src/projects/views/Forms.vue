<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.forms')" :description="$t('table.header')" />
        <WidgetsDropdownUser />
        <UserTables />
    </div>
</template>

<script>
import UserTables from '../components/tables/UserTables.vue'
import WidgetsDropdownUser from '../components/widgets/WidgetsDropdownUser.vue'
import Header from '../components/Util/Header.vue'

export default {
    name: "Forms",
    components: {
        UserTables,
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
}
</script>

<style scoped></style>
