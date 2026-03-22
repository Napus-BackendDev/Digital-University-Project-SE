<template>
    <div class="mt-3 mb-2 px-1">
        <div class="back-pill" @click="$router.back()">
            <CIcon name="cil-chevron-left" size="sm" class="mr-1" />
            <span>Back</span>
        </div>
    </div>
</template>

<script>
export default {
    name: "ButtonBack"
}
</script>

<style scoped>
.back-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1.25rem;
    border-radius: 50px;
    background-color: #4a6cf7;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: 0 4px 6px -1px rgba(74, 108, 247, 0.2), 0 2px 4px -1px rgba(74, 108, 247, 0.1);
    border: none;
}

.back-pill:hover {
    background-color: #3b5bdb;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px -2px rgba(74, 108, 247, 0.25);
}

.back-pill:active {
    transform: translateY(0);
    background-color: #364fc7;
}

.back-pill span {
    line-height: 1;
}
</style>