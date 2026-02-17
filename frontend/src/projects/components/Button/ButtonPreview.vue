<template>
    <button class="btn-preview" @click="$emit('click')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Preview
    </button>
</template>

<script>
export default {
    name: 'ButtonPreview'
}
</script>

<style scoped>
.btn-preview {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid #e5e5e5;
    background: #fff;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    line-height: 20px;
    letter-spacing: -0.15px;
    transition: all 0.15s;
}
.btn-preview:hover {
    background: #f5f5f5;
    border-color: #d4d4d4;
}
</style>
