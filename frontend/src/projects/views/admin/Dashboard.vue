<template>
    <div>
        <h1>Admin Dashboard</h1>
        <h5>Overview of all forms and responses</h5>
        <WidgetsDropdown />
    </div>
</template>

<script>
import WidgetsDropdown from './componants/WidgetsDropdown'

export default {
    name: "Admin Dashboard",
    components: {   
        WidgetsDropdown
    },
    data() {
        return {

        }
    },
    mounted() {

    },

    created() {
        this.onInit();
    },

    beforeDestroy() {

    },

    methods: {
        onInit() {
            this.$store.dispatch('form/getForms');
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
