<template>
    <CCard class="permission-card border-0 mb-4">
        <CCardBody class="p-4">
            <div class="security-table-card__header mb-3">
                <div class="d-flex align-items-center">
                    <div class="header-icon-box mr-3">
                        <CIcon name="cil-shield-alt" size="lg" />
                    </div>
                    <div>
                        <h5 class="font-weight-bold text-dark mb-0">{{ ($te && $te('security.rolePermissions')) ? $t('security.rolePermissions') : 'Role Permissions Matrix' }}</h5>
                        <div class="text-muted small">Configure read, write, update, and delete access per role</div>
                    </div>
                </div>

                <!-- Role Filter Buttons -->
                <div class="role-filter-group mt-3 mt-md-0">
                    <button
                        v-for="opt in roleOptions"
                        :key="opt.value"
                        type="button"
                        class="role-pill-btn"
                        :class="{ active: selectedRoleId === opt.value }"
                        @click="selectedRoleId = opt.value"
                    >
                        {{ opt.label }}
                    </button>
                </div>
            </div>

            <div class="table-responsive tables-container border-0" :class="{ 'table-empty': filteredItems.length === 0 }">
                <CDataTable :items="filteredItems" :fields="fields" :items-per-page="itemsPerPage"
                    :activePage.sync="activePage" :pagination="false" :hover="filteredItems.length > 0" class="mb-0">
                    
                    <template #no-items-view>
                        <EmptyState
                            borderless
                            icon="cil-shield-alt"
                            title="ยังไม่มีข้อมูลบทบาทและสิทธิ์"
                            description="ตารางสิทธิ์จะแสดงขึ้นเมื่อมีการกำหนดบทบาทผู้ใช้งานในระบบ"
                        />
                    </template>

                    <template #role="{ item }">
                        <td class="align-middle">
                            <span class="role-badge">{{ item.role }}</span>
                        </td>
                    </template>
                    <template #page="{ item }">
                        <td class="align-middle font-weight-bold text-dark">
                            {{ item.page }}
                        </td>
                    </template>
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
            </div>

            <!-- Pagination -->
            <div class="mt-3 d-flex justify-content-end" v-if="totalPages > 1">
                <Pagination :activePage.sync="activePage" :pages="totalPages" />
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
import Pagination from '@/projects/components/Util/Pagination.vue'
import EmptyState from '@/projects/components/Util/EmptyState.vue'

export default {
    name: 'PermissionTable',
    components: { Pagination, EmptyState },
    props: {
        items: { type: Array, default: () => [] },
        fields: { type: Array, default: () => [] },
        roleOptions: {
            type: Array,
            default: () => [{ value: 'all', label: 'All Roles' }]
        }
    },
    data() {
        return {
            permCols: ['create', 'read', 'update', 'delete'],
            activePage: 1,
            itemsPerPage: 15,
            selectedRoleId: 'all'
        }
    },
    computed: {
        selectedRoleLabel() {
            const opt = this.roleOptions.find(o => o.value === this.selectedRoleId)
            return opt ? opt.label : 'All Roles'
        },
        filteredItems() {
            let rows = this.items
            if (this.selectedRoleId !== 'all') {
                rows = rows.filter(row => row.roleId === this.selectedRoleId)
            }
            return rows
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.filteredItems.length / this.itemsPerPage))
        }
    },
    watch: {
        selectedRoleId() { this.activePage = 1 }
    }
}
</script>

<style scoped>
.tables-container.table-empty tbody tr,
.tables-container.table-empty tbody tr:hover,
.tables-container.table-empty tbody td {
    background: transparent !important;
    background-color: transparent !important;
    cursor: default !important;
    pointer-events: none !important;
    user-select: none !important;
}

.tables-container.table-empty thead th {
    cursor: default !important;
    pointer-events: none !important;
    user-select: none !important;
}

.permission-card {
    background: #ffffff;
    border: 1px solid #e2e8f0 !important;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
}

.security-table-card__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #f1f5f9;
}

.header-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(140, 21, 21, 0.08);
    color: #8c1515;
    display: flex;
    align-items: center;
    justify-content: center;
}

.role-filter-group {
    display: inline-flex;
    flex-wrap: wrap;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 10px;
    gap: 2px;
}

.role-pill-btn {
    border: none;
    background: transparent;
    font-size: 0.8rem;
    font-weight: 600;
    color: #64748b;
    border-radius: 8px;
    padding: 6px 14px;
    cursor: pointer;
    transition: all 0.18s ease;
}

.role-pill-btn:hover {
    color: #0f172a;
}

.role-pill-btn.active {
    background: #ffffff;
    color: #8c1515;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.role-badge {
    display: inline-flex;
    padding: 0.3em 0.85em;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    background: #f1f5f9;
    color: #475569;
}

.tables-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
}

.empty-state-box {
    padding: 3.5rem 1.5rem;
}

.empty-state-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: #f1f5f9;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Permission checkbox */
.perm-cell {
    padding: 0.75rem 0.5rem;
}

.perm-checkbox-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: 0;
    position: relative;
    width: 24px;
    height: 24px;
}

.perm-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.perm-checkmark {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid #cbd5e1;
    background: #f8fafc;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;
    flex-shrink: 0;
}

.perm-checkmark.checked {
    background: #10b981;
    border-color: #10b981;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.perm-checkmark.checked::after {
    content: '';
    width: 6px;
    height: 10px;
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
    background-color: #8c1515 !important;
    color: white !important;
}
</style>
