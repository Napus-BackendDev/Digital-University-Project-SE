<template>
    <CCard class="security-table-card border-0 rounded-sm shadow-none bg-transparent">
        <CCardBody class="p-0 bg-white">
            <div class="security-table-card__header">

                <!-- Filter dropdowns -->
                <div class="d-flex align-items-center flex-wrap" style="gap: 0.5rem;">
                    <!-- Organization filter -->
                    <CDropdown class="filter-dropdown">
                        <template #toggler>
                            <button
                                class="btn d-flex align-items-center justify-content-between text-muted border bg-white px-3"
                                style="border-radius: 6px; height: 36px; min-width: 170px;">
                                <div class="d-flex align-items-center text-truncate">
                                    <CIcon name="cil-building" size="sm" class="mr-2" />
                                    <span class="text-truncate small">{{ selectedOrgLabel }}</span>
                                </div>
                                <CIcon name="cil-chevron-bottom" size="sm" class="ml-2" />
                            </button>
                        </template>
                        <CDropdownItem v-for="opt in organizationOptions" :key="opt.value"
                            :active="selectedOrgId === opt.value" @click="selectedOrgId = opt.value">
                            {{ opt.label }}
                        </CDropdownItem>
                    </CDropdown>
                </div>
            </div>

            <CDataTable :items="filteredItems" :fields="fields" :items-per-page="itemsPerPage"
                :activePage.sync="activePage" :pagination="false" hover class="mb-0 tables-container">
                <template v-for="col in permCols" v-slot:[col]="{ item }">
                    <td :key="col" class="align-middle text-center perm-cell">
                        <label class="perm-checkbox-label">
                            <input type="checkbox" class="perm-checkbox" :checked="item[col]"
                                @change="$emit('toggle', item, col, $event.target.checked)" />
                            <span class="perm-checkmark" :class="item[col] ? 'checked' : ''"></span>
                        </label>
                    </td>
                </template>
            </CDataTable>

            <!-- Pagination -->
            <Pagination :activePage.sync="activePage" :pages="totalPages" />
        </CCardBody>
    </CCard>
</template>

<script>
import Pagination from '@/projects/components/Util/Pagination.vue'

export default {
    name: 'PermissionTable',
    components: { Pagination },
    props: {
        items: { type: Array, default: () => [] },
        fields: { type: Array, default: () => [] },
        organizationOptions: {
            type: Array,
            default: () => [{ value: 'all', label: 'All Organizations' }]
        }
    },
    data() {
        return {
            permCols: ['create', 'read', 'update', 'delete'],
            activePage: 1,
            itemsPerPage: 15,
            selectedOrgId: 'all'
        }
    },
    computed: {
        selectedOrgLabel() {
            const opt = this.organizationOptions.find(o => o.value === this.selectedOrgId)
            return opt ? opt.label : 'All Organizations'
        },
        filteredItems() {
            let rows = this.items
            if (this.selectedOrgId !== 'all') {
                rows = rows.filter(row => row.orgId === this.selectedOrgId)
            }
            return rows
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.filteredItems.length / this.itemsPerPage))
        }
    },
    watch: {
        selectedOrgId() { this.activePage = 1 }
    }
}
</script>

<style scoped>
.security-table-card__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 0.85rem;
}

.security-table-card__title {
    font-size: 1rem;
    font-weight: 700;
    color: #233247;
}

.security-table-card__icon {
    color: #8c1515;
}

.filter-dropdown>>>.dropdown-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.35rem 0.75rem;
    border-radius: 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #41536d;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: all 0.15s ease;
}

.filter-dropdown>>>.dropdown-toggle:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
}

.filter-dropdown>>>.dropdown-toggle::after {
    display: none;
}

.filter-dropdown>>>.dropdown-menu {
    min-width: 160px;
    border-radius: 0.75rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    padding: 0.35rem;
}

.filter-dropdown>>>.dropdown-item {
    border-radius: 0.5rem;
    font-size: 0.82rem;
    font-weight: 500;
    padding: 0.4rem 0.75rem;
}

.filter-dropdown>>>.dropdown-item.active,
.filter-dropdown>>>.dropdown-item:active {
    background-color: #f0f7ff;
    color: #1e40af;
}

.filter-dropdown>>>.dropdown-item:hover {
    background: #f1f5f9;
}

.chevron-icon {
    font-size: 0.6rem;
    opacity: 0.6;
}

/* Table */
.tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    padding: 0;
    overflow: hidden;
}

/* Permission checkbox */
.perm-cell {
    padding: 0.4rem 0.5rem;
}

.perm-checkbox-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: 0;
    position: relative;
    width: 22px;
    height: 22px;
}

.perm-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.perm-checkmark {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #cbd5e1;
    background: #f8fafc;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
}

.perm-checkmark.checked {
    background: #10b981;
    border-color: #10b981;
}

.perm-checkmark.checked::after {
    content: '';
    width: 5px;
    height: 9px;
    border: 2px solid white;
    border-top: none;
    border-left: none;
    transform: rotate(45deg) translateY(-1px);
    display: block;
}

.perm-checkbox-label:hover .perm-checkmark:not(.checked) {
    border-color: #10b981;
    background: #ecfdf5;
}

/* Pagination */
::v-deep .page-link {
    border: none;
    color: #64748b;
    border-radius: 6px;
    margin: 0 2px;
}

::v-deep .page-link:hover {
    background-color: #f1f5f9;
    color: #0f172a;
}

::v-deep .page-item.active .page-link {
    background-color: #0ea5e9;
    color: white;
}

/* Source badge */
.visibility-badge {
    display: inline-flex;
    padding: 0.25em 0.8em;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}

.visi-org {
    background-color: #f0f7ff;
    color: #1e40af;
}

.visi-public {
    background-color: #ecfdf5;
    color: #059669;
}
</style>
