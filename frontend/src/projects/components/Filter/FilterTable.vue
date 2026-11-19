<template>
    <CCard class="filter-card mb-4 border-0">
        <CCardBody class="p-3 p-md-4">
            <CRow class="align-items-end g-3">
                <!-- Search Input -->
                <CCol col="12" md="4" lg="3" class="mb-3 mb-lg-0">
                    <label class="filter-label">{{ $t('table.search') }}</label>
                    <div class="filter-input-wrap">
                        <CIcon name="cil-magnifying-glass" class="filter-icon" />
                        <input
                            type="text"
                            class="form-control modern-input"
                            :class="{ 'has-clear': Boolean(searchQuery) }"
                            :value="searchQuery"
                            @input="$emit('update:searchQuery', $event.target.value)"
                            :placeholder="searchPlaceholder || $t('table.searchPlaceholder')"
                        />
                        <button
                            v-if="searchQuery"
                            type="button"
                            class="clear-search-btn"
                            aria-label="Clear search"
                            @click="$emit('update:searchQuery', '')"
                        >
                            ×
                        </button>
                    </div>
                </CCol>

                <!-- Status Dropdown -->
                <CCol col="12" sm="6" md="3" lg="2" class="mb-3 mb-lg-0">
                    <label class="filter-label">{{ $t('table.status') }}</label>
                    <CDropdown class="filter-dropdown w-100">
                        <template #toggler>
                            <button class="btn modern-dropdown-btn w-100" type="button">
                                <div class="d-flex align-items-center text-truncate">
                                    <CIcon name="cil-filter" size="sm" class="mr-2 text-muted" />
                                    <span class="text-truncate font-weight-medium">{{ selectedStatusLabel }}</span>
                                </div>
                                <CIcon name="cil-chevron-bottom" size="sm" class="text-muted ml-2" />
                            </button>
                        </template>
                        <template v-if="Array.isArray(statusOptions) && statusOptions.length > 0">
                            <CDropdownItem
                                v-for="opt in statusOptions"
                                :key="opt.value"
                                @click="$emit('update:selectedStatus', opt.value)"
                            >
                                {{ opt.label }}
                            </CDropdownItem>
                        </template>
                        <template v-else>
                            <CDropdownItem @click="$emit('update:selectedStatus', 'All')">{{ $t('status.all') }}</CDropdownItem>
                            <template v-if="managementMode">
                                <CDropdownItem @click="$emit('update:selectedStatus', 'Draft')">{{ $t('status.draft') }}</CDropdownItem>
                                <CDropdownItem @click="$emit('update:selectedStatus', 'Scheduled')">{{ $t('status.scheduled') }}</CDropdownItem>
                                <CDropdownItem @click="$emit('update:selectedStatus', 'Active')">{{ $t('status.active') }}</CDropdownItem>
                                <CDropdownItem @click="$emit('update:selectedStatus', 'Closed')">{{ $t('status.closed') }}</CDropdownItem>
                            </template>
                            <template v-else>
                                <CDropdownItem @click="$emit('update:selectedStatus', 'Pending')">{{ $t('respondentStatus.pending') }}</CDropdownItem>
                                <CDropdownItem @click="$emit('update:selectedStatus', 'In Progress')">{{ $t('respondentStatus.inprogress') }}</CDropdownItem>
                                <CDropdownItem @click="$emit('update:selectedStatus', 'Completed')">{{ $t('respondentStatus.completed') }}</CDropdownItem>
                            </template>
                        </template>
                    </CDropdown>
                </CCol>

                <!-- Range Shortcuts -->
                <CCol col="12" sm="6" md="5" lg="3" class="mb-3 mb-lg-0">
                    <label class="filter-label">{{ $t('table.rangeShortcuts') }}</label>
                    <div class="segmented-control">
                        <button
                            v-for="shortcut in dateShortcuts"
                            :key="shortcut.id"
                            type="button"
                            class="segmented-btn"
                            :class="{ active: currentShortcut === shortcut.id }"
                            @click="applyQuickDate(shortcut.id)"
                        >
                            {{ shortcut.label || $t('table.quickDate.' + shortcut.id) }}
                        </button>
                    </div>
                </CCol>

                <!-- Time Range: From -->
                <CCol col="12" sm="6" md="6" lg="2" class="mb-2 mb-lg-0">
                    <label class="filter-label">{{ $t('table.dateFrom') }}</label>
                    <div class="filter-input-wrap picker-field-wrap">
                        <input
                            type="date"
                            class="form-control modern-input modern-date picker-only-input"
                            :class="{ 'has-picker-clear': Boolean(startDate) }"
                            :value="startDate"
                            @input="onDateInput('startDate', $event.target.value)"
                            @mousedown.prevent
                            @click="onPickerClick($event)"
                            @keydown="onPickerKeydown"
                            @beforeinput="onPickerBeforeInput"
                            @paste.prevent
                            @drop.prevent
                        />
                        <button
                            v-if="startDate"
                            type="button"
                            class="picker-clear-btn"
                            aria-label="Clear start date"
                            @click.stop="onDateInput('startDate', '')"
                        >
                            ×
                        </button>
                        <CIcon name="cil-calendar" size="sm" class="picker-field-icon" />
                    </div>
                </CCol>

                <!-- Time Range: To -->
                <CCol col="12" sm="6" md="6" lg="2" class="mb-2 mb-lg-0">
                    <label class="filter-label">{{ $t('table.dateTo') }}</label>
                    <div class="filter-input-wrap picker-field-wrap">
                        <input
                            type="date"
                            class="form-control modern-input modern-date picker-only-input"
                            :class="{ 'has-picker-clear': Boolean(endDate) }"
                            :value="endDate"
                            @input="onDateInput('endDate', $event.target.value)"
                            @mousedown.prevent
                            @click="onPickerClick($event)"
                            @keydown="onPickerKeydown"
                            @beforeinput="onPickerBeforeInput"
                            @paste.prevent
                            @drop.prevent
                        />
                        <button
                            v-if="endDate"
                            type="button"
                            class="picker-clear-btn"
                            aria-label="Clear end date"
                            @click.stop="onDateInput('endDate', '')"
                        >
                            ×
                        </button>
                        <CIcon name="cil-calendar" size="sm" class="picker-field-icon" />
                    </div>
                </CCol>
            </CRow>
        </CCardBody>
    </CCard>
</template>

<script>
import { resolveQuickDateRange } from '@/projects/utils/analytics'
import { tryOpenDatePicker, handleDatePickerKeydown, blockFreeTextBeforeInput } from '@/projects/utils/formPolicy'

export default {
    name: 'FilterTable',
    props: {
        searchQuery: {
            type: String,
            default: ''
        },
        searchPlaceholder: {
            type: String,
            default: ''
        },
        managementMode: {
            type: Boolean,
            default: false
        },
        selectedStatus: {
            type: String,
            default: 'All'
        },
        statusOptions: {
            type: Array,
            default: null
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
                { id: 'all' },
                { id: 'today' },
                { id: 'last7Days' },
                { id: 'last30Days' }
            ]
        }
    },
    computed: {
        selectedStatusLabel() {
            if (Array.isArray(this.statusOptions) && this.statusOptions.length > 0) {
                const matched = this.statusOptions.find(opt => opt && opt.value === this.selectedStatus);
                if (matched) return matched.label;
            }
            if (!this.selectedStatus || this.selectedStatus === 'All' || this.selectedStatus === 'all') {
                return this.$t('status.all');
            }
            const prefix = this.managementMode ? 'status.' : 'respondentStatus.';
            return this.$t(prefix + String(this.selectedStatus).toLowerCase().replace(/\s/g, ''));
        }
    },
    watch: {
        startDate(val) {
            if (!val && !this.endDate) this.currentShortcut = 'all';
        },
        endDate(val) {
            if (!val && !this.startDate) this.currentShortcut = 'all';
        }
    },
    methods: {
        applyQuickDate(type) {
            this.currentShortcut = type;
            const { startDate, endDate } = resolveQuickDateRange(type);
            this.$emit('update:startDate', startDate);
            this.$emit('update:endDate', endDate);
        },
        onDateInput(prop, value) {
            this.currentShortcut = '';
            this.$emit(`update:${prop}`, value);
        },
        onPickerClick(event) {
            if (event && event.currentTarget) {
                tryOpenDatePicker(event.currentTarget);
            }
        },
        onPickerKeydown(event) {
            handleDatePickerKeydown(event);
        },
        onPickerBeforeInput(event) {
            blockFreeTextBeforeInput(event);
        }
    }
}
</script>

<style scoped>
.filter-card {
    background: #ffffff;
    border: 1px solid #e2e8f0 !important;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
    display: block;
}

.filter-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.filter-icon {
    position: absolute;
    left: 12px;
    color: #64748b;
    pointer-events: none;
    z-index: 2;
    width: 16px;
    height: 16px;
}

.filter-input-wrap .modern-input {
    padding-left: 36px;
}

.filter-input-wrap .modern-input.has-clear {
    padding-right: 34px;
}

.clear-search-btn {
    position: absolute;
    right: 8px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 1.05rem;
    line-height: 1;
    padding: 4px 6px;
    cursor: pointer;
    z-index: 2;
}

.clear-search-btn:hover {
    color: #0f172a;
}

.modern-input {
    height: 44px;
    min-height: 44px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    font-size: 0.875rem;
    color: #0f172a;
    transition: all 0.2s ease;
    width: 100%;
}

.modern-date {
    min-height: 44px;
    padding-left: 10px !important;
    font-size: 0.825rem;
}

.modern-date.picker-only-input {
    padding-right: 28px !important;
}

.modern-date.picker-only-input.has-picker-clear {
    padding-right: 46px !important;
}

.filter-input-wrap .picker-field-icon {
    right: 8px;
}

.filter-input-wrap .picker-clear-btn {
    right: 26px;
    width: 18px;
    height: 18px;
}

.modern-input:focus {
    background: #ffffff;
    border-color: #8c1515;
    box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.1);
    outline: none;
}

.modern-dropdown-btn {
    height: 44px;
    min-height: 44px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    font-size: 0.875rem;
    color: #0f172a;
    transition: all 0.2s ease;
}

.modern-dropdown-btn:hover,
.modern-dropdown-btn:focus {
    background: #ffffff;
    border-color: #8c1515;
    box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.1);
}

.segmented-control {
    display: flex;
    align-items: center;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 12px;
    min-height: 50px;
    height: auto;
}

.segmented-btn {
    flex: 1;
    min-height: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
    border-radius: 10px;
    padding: 0 4px;
    white-space: nowrap;
    transition: all 0.18s ease;
    cursor: pointer;
}

.segmented-btn:hover {
    color: #0f172a;
}

.segmented-btn.active {
    background: #ffffff;
    color: #8c1515;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-dropdown ::v-deep .dropdown-menu {
    min-width: 180px;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05);
    border: 1px solid #e2e8f0;
    padding: 6px;
}

.filter-dropdown ::v-deep .dropdown-item {
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 8px 12px;
    color: #334155;
    transition: all 0.15s ease;
}

.filter-dropdown ::v-deep .dropdown-item.active,
.filter-dropdown ::v-deep .dropdown-item:active {
    background-color: #fef2f2 !important;
    color: #8c1515 !important;
    font-weight: 600;
}

.filter-dropdown ::v-deep .dropdown-item:hover:not(.active) {
    background: #f8fafc;
    color: #0f172a;
}
</style>
