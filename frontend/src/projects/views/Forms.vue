<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.forms')" :description="$t('table.header')" />
        <WidgetsDropdownUser />
        <FormTables />
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
