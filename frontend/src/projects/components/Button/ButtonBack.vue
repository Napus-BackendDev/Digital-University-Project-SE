<template>
    <button class="btn-back" @click="$router.push(path)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ label }}
    </button>
</template>

<script>
export default {
    name: "ButtonBack",
    props: {
        path: { type: String, default: '/user/dashboard' },
        label: { type: String, default: 'Back to Forms' }
    }
}
</script>

<style scoped>
.btn-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border: none;
    background: transparent;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    line-height: 20px;
    letter-spacing: -0.15px;
    transition: color 0.15s;
}
.btn-back:hover {
    color: #ba0c2f;
}
</style>
