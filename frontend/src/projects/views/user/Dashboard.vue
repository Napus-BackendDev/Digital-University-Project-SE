<template>
    <div class="flex-grow-1">
        <Header title="My Forms" description="Fill and submit your forms" />
        <UserTables />
    </div>
</template>

<script>
import UserTables from '../../components/tables/UserTables.vue'
import Header from '../../components/Util/Header.vue'

export default {
    name: "UserDashboard",
    components: {
        UserTables,
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
            this.$store.dispatch('Forms/getForms');
        },
    },
    computed: {
    }
}
</script>
