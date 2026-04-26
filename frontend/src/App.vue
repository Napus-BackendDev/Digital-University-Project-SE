<template>
    <router-view></router-view>
</template>

<script>
export default {
    name: "App",
    async created() {
        await this.initGlobalData();
    },
    methods: {
        async initGlobalData() {
            try {
                await this.$store.dispatch("Organizations/getAll");


            } catch (err) {
                console.error("Critical error during application initialization:", err);
            }
        }
    }
}
</script>

<style lang="scss">
@import 'assets/scss/style';
</style>
