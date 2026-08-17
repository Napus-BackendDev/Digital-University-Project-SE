<template>
    <label class="page-size-control mb-0">
        <span>{{ $t('table.itemsPerPage') }}</span>
        <select class="page-size-select" :value="value" @change="$emit('input', Number($event.target.value))">
            <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
        </select>
    </label>
</template>

<script>
export default {
    name: 'TablePageSize',
    props: {
        value: {
            type: Number,
            default: 5
        },
        options: {
            type: Array,
            default: () => [5, 10, 20, 50]
        }
    }
}
</script>

<style scoped>
.page-size-control {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.6rem 0.5rem 1rem;
    color: #475569;
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.page-size-select {
    min-width: 66px;
    height: 34px;
    padding: 0 1.75rem 0 0.7rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background-color: #f8fafc;
    color: #3c4b64;
    cursor: pointer;
    outline: none;
}

.page-size-select:focus {
    border-color: #8b1f1b;
    background-color: #fff;
    box-shadow: 0 0 0 2px rgba(139, 31, 27, 0.12);
}
</style>
