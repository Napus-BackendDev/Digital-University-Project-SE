<template>
  <router-view></router-view>
</template>

<script>
export default {
    name: "App",
    async created() {
        // Application Global Initialization
        await this.initGlobalData();
    },
    methods: {
        async initGlobalData() {
            try {
                // Fetch the default user for this session/mockup
                const defaultUserId = "69bba7d59d4daa635049ac6b";
                
                await this.$store.dispatch("User/get", { _id: defaultUserId });

                // Also fetch all organizations to have them ready in the store for dropdowns/badges
                await this.$store.dispatch("Organizations/getAll");

                console.log("Global Application Data Loaded Successfully");
            } catch (err) {
                console.error("Critical error during application initialization:", err);
            }
        }
    }
}
</script>

<style lang="scss">
  // Import Main styles for this application
  @import 'assets/scss/style';
</style>
