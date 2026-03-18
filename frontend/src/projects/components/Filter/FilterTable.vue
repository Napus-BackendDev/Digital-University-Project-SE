<template>
    <CCard class="filter-card mb-4">
        <CCardBody class="p-4">
            <CRow class="align-items-end">
                <!-- Search -->
                <CCol md="3" lg="3" class="mb-2 mb-md-0">
                    <label class="small text-muted font-weight-bold text-uppercase mb-2 d-block">{{ $t('table.search')
                        }}</label>
                    <CInput :value="searchQuery" @input="$emit('update:searchQuery', $event)"
                        :placeholder="$t('table.searchPlaceholder')" class="mb-0 custom-filter-input"
                        style="height: 38px;">
                        <template #prepend-content>
                            <CIcon name="cil-magnifying-glass" class="text-muted" />
                        </template>
                    </CInput>
                </CCol>

                <!-- Status Dropdown -->
                <CCol md="3" lg="2" class="mb-2 mb-md-0">
                    <label class="small text-muted font-weight-bold text-uppercase mb-2 d-block">{{ $t('table.status')
                        }}</label>
                    <CDropdown class="filter-dropdown w-100">
                        <template #toggler>
                            <button
                                class="btn d-flex align-items-center justify-content-between text-muted border bg-white w-100 px-3"
                                style="border-radius: 6px; height: 38px;">
                                <div class="d-flex align-items-center text-truncate">
                                    <CIcon name="cil-filter" size="sm" class="mr-2" />
                                    <span class="text-truncate small">{{ selectedStatus === 'All' ? $t('status.all') :
                                        $t('status.' + selectedStatus.toLowerCase()) }}</span>
                                </div>
                                <CIcon name="cil-chevron-bottom" size="sm" class="ml-2" />
                            </button>
                        </template>
                        <CDropdownItem @click="$emit('update:selectedStatus', 'All')">{{ $t('status.all') }}
                        </CDropdownItem>
                        <CDropdownItem @click="$emit('update:selectedStatus', 'Pending')">{{ $t('status.pending') }}
                        </CDropdownItem>
                        <CDropdownItem @click="$emit('update:selectedStatus', 'InProgress')">{{ $t('status.inprogress')
                            }}
                        </CDropdownItem>
                        <CDropdownItem @click="$emit('update:selectedStatus', 'Completed')">{{ $t('status.completed') }}
                        </CDropdownItem>
                    </CDropdown>
                </CCol>

                <!-- Time Range Filters -->
                <CCol md="3" lg="4" class="mb-2 mb-md-0">
                    <label class="small text-muted font-weight-bold text-uppercase mb-2 d-block">{{
                        $t('table.rangeShortcuts')
                        }}</label>
                    <CButtonGroup class="w-100">
                        <CButton v-for="shortcut in dateShortcuts" :key="shortcut.id"
                            :color="currentShortcut === shortcut.id ? 'primary' : 'secondary'"
                            :variant="currentShortcut === shortcut.id ? 'solid' : 'outline'"
                            style="height: 38px; flex: 1;" @click="applyQuickDate(shortcut.id)">
                            {{ shortcut.label || $t('table.quickDate.' + shortcut.id) }}
                        </CButton>
                    </CButtonGroup>
                </CCol>

                <!-- Time Range: From -->
                <CCol sm="6" md="1.5" class="mb-2 mb-md-0" style="flex: 0 0 12.5%; max-width: 12.5%;">
                    <label class="small text-muted font-weight-bold text-uppercase mb-2 d-block">{{ $t('table.dateFrom')
                        }}</label>
                    <CInput type="date" :value="startDate" @input="onDateInput('startDate', $event)"
                        class="mb-0 custom-filter-input" style="height: 38px;" />
                </CCol>

                <!-- Time Range: To -->
                <CCol sm="6" md="1.5" lg="1.5" class="mb-2 mb-md-0" style="flex: 0 0 12.5%; max-width: 12.5%;">
                    <label class="small text-muted font-weight-bold text-uppercase mb-2 d-block">{{ $t('table.dateTo')
                        }}</label>
                    <CInput type="date" :value="endDate" @input="onDateInput('endDate', $event)"
                        class="mb-0 custom-filter-input" style="height: 38px;" />
                </CCol>

            </CRow>
        </CCardBody>
    </CCard>
</template>

<script>
import moment from 'moment'

export default {
    name: 'FilterTable',
    props: {
        searchQuery: {
            type: String,
            default: ''
        },
        selectedStatus: {
            type: String,
            default: 'All'
        },
        startDate: {
            type: String,
            default: ''
        },
        endDate: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            currentShortcut: 'all',
            dateShortcuts: [
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: 'last7Days', label: 'Last 7 Days' },
                { id: 'last30Days', label: 'Last 30 Days' }
            ]
        }
    },
    methods: {
        applyQuickDate(type) {
            this.currentShortcut = type;
            let start = '';
            let end = '';
            if (type === 'today') {
                start = moment().format('YYYY-MM-DD');
                end = moment().format('YYYY-MM-DD');
            } else if (type === 'last7Days') {
                // Last 7 days: from 6 days ago up to today (7-day window)
                start = moment().subtract(6, 'days').format('YYYY-MM-DD');
                end = moment().format('YYYY-MM-DD');
            } else if (type === 'last30Days') {
                start = moment().subtract(30, 'days').format('YYYY-MM-DD');
                end = moment().format('YYYY-MM-DD');
            }

            this.$emit('update:startDate', start);
            this.$emit('update:endDate', end);
        },
        onDateInput(prop, value) {
            this.currentShortcut = ''; // Reset shortcut when manually inputting date
            this.$emit(`update:${prop}`, value);
        }
    }
}
</script>

<style scoped>
.filter-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.custom-filter-input ::v-deep .form-control {
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    font-size: 0.9rem;
}

.custom-filter-input ::v-deep .form-control:focus {
    border-color: #3c4b64;
    box-shadow: 0 0 0 0.2rem rgba(60, 75, 100, 0.1);
}

.filter-dropdown ::v-deep .dropdown-item {
    font-size: 0.9rem;
    padding: 10px 20px;
}
</style>
