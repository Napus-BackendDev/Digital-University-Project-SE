<template>
    <div v-if="showPerPage" class="d-flex justify-content-center justify-content-md-between align-items-center flex-wrap" style="gap: 8px;">
        <div class="d-flex align-items-center justify-content-center flex-wrap text-muted small font-weight-bold my-1">
            <span class="mr-2">{{ $t('table.showing') || 'แสดง' }}</span>
            <select
                :value="itemsPerPage"
                class="custom-per-page-select mr-2"
                aria-label="Items per page"
                @change="onPerPageChange"
            >
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <span class="mr-2">{{ $t('table.itemsPerPage') || 'รายการต่อหน้า' }}</span>
            <span class="text-secondary">
                ({{ startItem }} - {{ endItem }} {{ $t('table.of') || 'จาก' }} {{ totalItems }} {{ $t('table.items') || 'รายการ' }})
            </span>
        </div>
        <div class="my-1">
            <CPagination :activePage="activePage" :pages="pages" :doubleArrows="false" align="end"
                class="custom-pagination border-0 mb-0" @update:activePage="$emit('update:activePage', $event)" />
        </div>
    </div>
    <div v-else :class="['d-flex', noMargin ? 'my-0' : 'mt-4 mb-2', (align === 'right' || align === 'end') ? 'justify-content-end' : 'justify-content-center']">
        <CPagination :activePage="activePage" :pages="pages" :doubleArrows="false" :align="align"
            class="custom-pagination border-0 mb-0" @update:activePage="$emit('update:activePage', $event)" />
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
        },
        align: {
            type: String,
            default: 'center'
        },
        noMargin: {
            type: Boolean,
            default: false
        },
        showPerPage: {
            type: Boolean,
            default: false
        },
        itemsPerPage: {
            type: Number,
            default: 5
        },
        totalItems: {
            type: Number,
            default: 0
        },
        perPageOptions: {
            type: Array,
            default: () => [5, 10, 15, 20]
        }
    },
    computed: {
        startItem() {
            if (this.totalItems <= 0) return 0;
            return (this.activePage - 1) * this.itemsPerPage + 1;
        },
        endItem() {
            return Math.min(this.activePage * this.itemsPerPage, this.totalItems);
        }
    },
    methods: {
        onPerPageChange(event) {
            const next = Number(event.target.value) || 5;
            this.$emit('update:itemsPerPage', next);
            this.$emit('update:activePage', 1);
        }
    }
}
</script>

<style scoped>
.custom-per-page-select {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px !important;
    padding: 4px 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
}

.custom-per-page-select:focus,
.custom-per-page-select:hover {
    border-color: #8c1515;
    box-shadow: 0 0 0 2px rgba(140, 21, 21, 0.1);
}
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
