<template>
    <div>
        <!-- Filter Toolbar -->
        <div class="toolbar">
            <div class="toolbar__search">
                <div class="search-input">
                    <svg class="search-input__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input v-model="searchQuery" type="text" placeholder="Search forms..." class="search-input__field" />
                </div>
            </div>
            <div class="toolbar__actions">
                <div class="filter-dropdown-wrapper">
                    <CDropdown class="filter-dropdown">
                        <template #toggler>
                            <button class="filter-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                <span>{{ selectedStatus }}</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        </template>
                        <CDropdownItem @click="filterStatus('All Status')">All Status</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Open')">Open</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Closed')">Closed</CDropdownItem>
                        <CDropdownItem @click="filterStatus('Draft')">Draft</CDropdownItem>
                    </CDropdown>
                </div>
                <button class="create-btn" @click="createNewForm" :disabled="isCreating">
                    <CSpinner v-if="isCreating" size="sm" class="create-btn__spinner" />
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fafafa" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Create Form</span>
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="forms-table-container">
            <CDataTable :items="tableData" :fields="fields" :items-per-page="7" hover
                :pagination="{ align: 'center' }" class="mb-0 forms-datatable">

                <!-- Form Name (Title) Slot -->
                <template #title="{ item }">
                    <td class="forms-table__cell forms-table__cell--name">
                        <div class="form-info">
                            <div class="form-info__title">{{ item.title }}</div>
                            <div class="form-info__description" v-if="item.description">{{ item.description }}</div>
                        </div>
                    </td>
                </template>

                <!-- Status Slot -->
                <template #status="{ item }">
                    <td class="forms-table__cell">
                        <span class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-badge__dot"></span>
                            {{ item.status }}
                        </span>
                    </td>
                </template>

                <!-- Responses Slot -->
                <template #responses="{ item }">
                    <td class="forms-table__cell">
                        <div class="response-info">
                            <div class="response-info__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ba0c2f"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path
                                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <div class="response-info__text">
                                <div class="response-info__count">{{ item.responses }}</div>
                                <div class="response-info__label">responses</div>
                            </div>
                        </div>
                    </td>
                </template>

                <!-- Created (Last Modified) Slot -->
                <template #created="{ item }">
                    <td class="forms-table__cell">
                        <div class="date-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span class="date-info__text">{{ item.created }}</span>
                        </div>
                    </td>
                </template>

                <!-- Actions Slot -->
                <template #actions="{ item }">
                    <td class="forms-table__cell forms-table__cell--actions">
                        <CDropdown placement="bottom-end">
                            <template #toggler>
                                <button class="actions-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="1" />
                                        <circle cx="12" cy="5" r="1" />
                                        <circle cx="12" cy="19" r="1" />
                                    </svg>
                                </button>
                            </template>
                            <CDropdownItem @click="goToEditForm(item)">Edit</CDropdownItem>
                            <CDropdownItem>Duplicate</CDropdownItem>
                            <CDropdownItem class="text-danger" @click="deleteForm(item)">Delete</CDropdownItem>
                        </CDropdown>
                    </td>
                </template>
            </CDataTable>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
    name: 'EditorTables',
    data() {
        return {
            searchQuery: '',
            selectedStatus: 'All Status',
            isCreating: false,
            fields: [
                { key: 'title', label: 'Form Name', _style: 'width:40%' },
                { key: 'status', label: 'Status', _style: 'width:15%' },
                { key: 'responses', label: 'Responses', _style: 'width:15%' },
                { key: 'created', label: 'Last Modified', _style: 'width:20%' },
                { key: 'actions', label: 'Actions', _style: 'width:10%; text-align:right' }
            ]
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('setting', ['lang']),

        tableData() {
            // Force reactivity on locale change
            const locale = this.lang;

            if (!Array.isArray(this.forms) || this.forms.length === 0) return []

            // Sort forms by createdAt (newest first)
            const sortedForms = [...this.forms].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt)
            })

            // 2. Map to display objects
            const mappedData = sortedForms.map(form => {
                // Safe check for status
                let statusTitle = 'Draft';
                if (form.status && form.status.title) {
                    statusTitle = this.getLang(form.status.title);
                } else if (typeof form.status === 'string') {
                    statusTitle = form.status;
                }

                return {
                    _id: form._id,
                    title: this.getLang(form.title) || 'Untitled Form',
                    description: this.getLang(form.description) || '',
                    status: statusTitle,
                    access: form.isPublic ? 'Public' : 'Private',
                    responses: form.responses ? form.responses.length : 0,
                    created: form.createdAt ? moment(form.createdAt).format('MMM D, YYYY') : '-'
                }
            })

            // 3. Apply filters
            return mappedData.filter(item => {
                // Filter by Status
                if (this.selectedStatus !== 'All Status' && item.status !== this.selectedStatus) {
                    return false;
                }

                // Filter by Search Query
                if (this.searchQuery) {
                    const query = this.searchQuery.toLowerCase();
                    const titleMatch = item.title.toLowerCase().includes(query);
                    const descMatch = item.description.toLowerCase().includes(query);
                    return titleMatch || descMatch;
                }

                return true;
            });
        }
    },
    methods: {
        filterStatus(status) {
            this.selectedStatus = status;
            this.currentPage = 1; // Reset pagination when filter changes
        },
        getLang(data) {
            if (!data) return '';
            if (typeof data === 'string') return data;
            if (!Array.isArray(data)) return '';

            // Find content matching current locale
            const currentLang = this.lang;
            let content = data.find(item => item.key === currentLang);

            // Fallback to 'en' if current locale not found
            if (!content) {
                content = data.find(item => item.key === 'en');
            }

            // Fallback to first available if 'en' not found
            if (!content && data.length > 0) {
                content = data[0];
            }

            return content ? content.value : '';
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'open' || s === 'published') return 'status-open';
            if (s === 'closed') return 'status-closed';
            return 'status-draft'; // Default/Draft
        },
        async createNewForm() {
            this.isCreating = true;
            try {
                const newFormData = {
                    title: [
                        { key: 'en', value: 'Untitled Form' },
                        { key: 'th', value: 'แบบร่างฟอร์ม' }
                    ],
                };

                const response = await this.$store.dispatch('Forms/createForm', newFormData);

                this.$router.push({ name: 'EditorCreateForm', params: { id: response.data.data._id } });
            } catch (error) {
                console.error("Failed to create form:", error);
            } finally {
                this.isCreating = false;
            }
        },
        goToEditForm(item) {
            this.$router.push({ name: 'EditorCreateForm', params: { id: item._id } });
        },
        async deleteForm(item) {
            if (confirm("Are you sure you want to delete this form?")) {
                try {
                    await this.$store.dispatch('Forms/deleteForm', { _id: item._id });
                    await this.$store.dispatch('Forms/getForms');
                } catch (error) {
                    console.error("Failed to delete form:", error);
                }
            }
        }
    }
}
</script>

<style scoped>
/* ===== Toolbar ===== */
.toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 32px;
}

.toolbar__search {
    flex: 1;
}

.toolbar__actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* ===== Search Input ===== */
.search-input {
    position: relative;
    width: 100%;
}

.search-input__icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
}

.search-input__field {
    width: 100%;
    height: 36px;
    padding: 4px 12px 4px 40px;
    background: rgba(229, 229, 229, 0.3);
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #333333;
    outline: none;
    transition: border-color 0.2s ease;
}

.search-input__field::placeholder {
    color: #a3a3a3;
}

.search-input__field:focus {
    border-color: #ba0c2f;
}

/* ===== Filter Button ===== */
.filter-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: 36px;
    padding: 1px 13px;
    background: rgba(229, 229, 229, 0.3);
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #333333;
    cursor: pointer;
    transition: border-color 0.2s ease;
    white-space: nowrap;
}

.filter-btn:hover {
    border-color: #d4d4d4;
}

/* ===== Create Button ===== */
.create-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 8px 16px;
    background-color: #ba0c2f;
    border: none;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #fafafa;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;
}

.create-btn:hover {
    background-color: #9a0a27;
}

.create-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.create-btn__spinner {
    color: #fafafa;
}

/* ===== Table Container ===== */
.forms-table-container {
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

/* ===== Table Header ===== */
::v-deep .forms-datatable .table thead th {
    background-color: #fafafa;
    border-bottom: 1px solid #e5e5e5;
    border-top: none;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #404040;
    padding: 16px 24px;
    text-transform: none;
}

/* ===== Table Body ===== */
::v-deep .forms-datatable .table tbody tr {
    transition: background-color 0.15s ease;
}

::v-deep .forms-datatable .table tbody tr:hover {
    background-color: #fafafa;
}

::v-deep .forms-datatable .table tbody td {
    border-top: none;
    border-bottom: 1px solid #f5f5f5;
    vertical-align: middle;
    padding: 20px 24px;
}

::v-deep .forms-datatable .table tbody tr:last-child td {
    border-bottom: none;
}

/* ===== Table Cells ===== */
.forms-table__cell {
    padding: 20px 24px !important;
}

.forms-table__cell--name {
    padding-left: 24px !important;
}

.forms-table__cell--actions {
    text-align: right;
    padding-right: 24px !important;
}

/* ===== Form Info ===== */
.form-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.form-info__title {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #1a1a1a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.form-info__description {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 22.75px;
    letter-spacing: -0.1504px;
    color: #525252;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ===== Status Badges ===== */
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px 4px 10px;
    border-radius: 9999px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
}

.status-badge__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    flex-shrink: 0;
}

.status-open {
    background-color: #ecfdf5;
    border: 1px solid #a4f4cf;
    color: #007a55;
}

.status-open .status-badge__dot {
    background-color: #00bc7d;
}

.status-draft {
    background-color: #f5f5f5;
    border: 1px solid #e5e5e5;
    color: #404040;
}

.status-draft .status-badge__dot {
    background-color: #a3a3a3;
}

.status-closed {
    background-color: #fef2f2;
    border: 1px solid #ffc9c9;
    color: #c10007;
}

.status-closed .status-badge__dot {
    background-color: #fb2c36;
}

/* ===== Response Info ===== */
.response-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.response-info__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: #fef2f2;
    border-radius: 16px;
    flex-shrink: 0;
}

.response-info__text {
    display: flex;
    flex-direction: column;
}

.response-info__count {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #1a1a1a;
}

.response-info__label {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
    color: #737373;
}

/* ===== Date Info ===== */
.date-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.date-info__text {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #525252;
}

/* ===== Actions Button ===== */
.actions-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    margin-left: auto;
}

.actions-btn:hover {
    background-color: #f5f5f5;
}

/* ===== Pagination ===== */
::v-deep .forms-datatable .pagination {
    margin-top: 16px;
    margin-bottom: 16px;
}

::v-deep .forms-datatable .page-link {
    border: none;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.1504px;
    color: #333333;
    padding: 8px 14px;
    margin: 0 2px;
    transition: all 0.15s ease;
}

::v-deep .forms-datatable .page-link:hover {
    background-color: #f5f5f5;
    color: #0a0a0a;
}

::v-deep .forms-datatable .page-item.active .page-link {
    background: rgba(229, 229, 229, 0.3);
    border: 1px solid #e5e5e5;
    color: #0a0a0a;
}

::v-deep .forms-datatable .page-item.disabled .page-link {
    opacity: 0.5;
    color: #333333;
}

/* ===== Dropdown Overrides ===== */
::v-deep .dropdown-menu {
    border-radius: 12px;
    border: 1px solid #e5e5e5;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    padding: 4px;
    min-width: 140px;
}

::v-deep .dropdown-item {
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    padding: 8px 12px;
}

::v-deep .dropdown-item:hover {
    background-color: #f5f5f5;
}
</style>