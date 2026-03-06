<template>
    <div class="d-flex justify-content-center mt-4 mb-2">
        <CPagination :activePage="activePage" :pages="pages" :doubleArrows="false" align="center"
            class="custom-pagination border-0" @update:activePage="$emit('update:activePage', $event)" />
    </div>
</template>

<script>
export default {
    name: 'Pagination',
    props: {
        activePage: {
            type: Number,
            default: 1
        },
        pages: {
            type: Number,
            default: 1
        }
    }
}
</script>

<style scoped>
::v-deep .custom-pagination .page-item .page-link {
    border: none !important;
    background-color: transparent !important;
    color: #475569 !important;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 50%;
    margin: 0 4px;
}

::v-deep .custom-pagination .page-item.active .page-link {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    font-weight: 600;
}

::v-deep .custom-pagination .page-item:not(.active) .page-link:hover {
    background-color: #f8fafc !important;
    color: #1e293b !important;
}

::v-deep .custom-pagination .page-item.disabled .page-link {
    color: #94a3b8 !important;
}
</style>
