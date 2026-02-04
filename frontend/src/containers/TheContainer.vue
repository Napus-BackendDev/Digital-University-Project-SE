<template>
    <TheHeader />
    <div class="container">
        <router-view />
    </div>
</template>

<script>
import TheHeader from './TheHeader.vue'

export default {
    name: 'TheContainer',
    components: {
        TheHeader
    }
}
</script>

<style scoped>
.container {
    margin: 10px auto;
    padding: 5px 200px;
}

@media (max-width: 1200px) {
    .container {
        padding: 5px 40px;
    }
}

@media (max-width: 768px) {
    .container {
        padding: 5px 20px;
    }
}
</style>
