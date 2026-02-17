<template>
    <div class="page-header">
        <h1 class="page-header__title">{{ title }}</h1>
        <p class="page-header__description">{{ description }}</p>
    </div>
</template>

<script>
export default {
    name: "Header",
    props: {
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        }
    }
}
</script>

<style scoped>
.page-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 0;
}

.page-header__title {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 36px;
    line-height: 40px;
    letter-spacing: -0.531px;
    color: #333333;
    margin: 0;
}

.page-header__description {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: -0.3125px;
    color: #525252;
    margin: 0;
}
</style>