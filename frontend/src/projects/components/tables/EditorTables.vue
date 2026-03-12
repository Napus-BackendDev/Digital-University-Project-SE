<template>
    <div>
        <div class="d-flex justify-content-between align-items-center py-3 mb-3">
            <div class="flex-grow-1 mr-3">
                <CInput v-model="searchQuery" placeholder="Search..." class="mb-0">
                    <template #prepend-content>
                        <CIcon name="cil-magnifying-glass" />
                    </template>
                </CInput>
            </div>

            <div class="d-flex align-items-center">
                <CDropdown class="filter-dropdown" style="border-radius: 1rem; margin-right: 1rem;">
                    <template #toggler>
                        <button class="btn d-flex align-items-center text-muted border bg-white"
                            style="border-radius: 6px;">
                            <CIcon name="cil-filter" size="sm" class="mr-2" />
                            <span>{{ selectedStatus }}</span>
                            <CIcon name="cil-chevron-bottom" size="sm" class="ml-2" />
                        </button>
                    </template>
                    <CDropdownItem @click="filterStatus('All Status')">All Status</CDropdownItem>
                    <CDropdownItem @click="filterStatus('Open')">Open</CDropdownItem>
                    <CDropdownItem @click="filterStatus('Closed')">Closed</CDropdownItem>
                    <CDropdownItem @click="filterStatus('Draft')">Draft</CDropdownItem>
                </CDropdown>

                <CButton color="danger" class="d-flex align-items-center text-white px-3"
                    style="border-radius: 6px; background-color: #be123c; border-color: #be123c; border-radius: .5rem;"
                    hover @click="createNewForm" :disabled="isCreating">
                    <CIcon v-if="!isCreating" name="cil-plus" size="sm" class="mr-2" />
                    <CSpinner v-else size="sm" class="mr-2" />
                    Create Form
                </CButton>
            </div>
        </div>

        <div class="user-tables-container">
            <CDataTable class="custom-table mb-0" :items="tableData" :fields="columns" :items-per-page="itemsPerPage"
                :pagination="false" hover :activePage.sync="activePage">

                <!-- Under Table Pagination & Info -->
                <template #under-table>
                    <!-- Empty under-table intentionally to remove built-in text -->
                </template>

                <!-- Title Combo -->
                <template #title="{ item }">
                    <td class="align-middle">
                        <template v-if="!item.isEmpty">
                            <strong class="text-dark form-title">{{ item.title }}</strong>
                            <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                        </template>
                    </td>
                </template>

                <!-- Status Label -->
                <template #status="{ item }">
                    <td class="align-middle">
                        <span v-if="!item.isEmpty" class="status-badge" :class="getStatusClass(item.status)">
                            <span class="status-dot"></span>
                            {{ item.status }}
                        </span>
                    </td>
                </template>

                <!-- Responses Combo -->
                <template #responses="{ item }">
                    <td class="align-middle">
                        <div v-if="!item.isEmpty" class="d-flex align-items-center">
                            <div class="icon-wrapper mr-3 chart-color">
                                <CIcon name="cil-comment-bubble" size="sm" />
                            </div>
                            <div class="text-left">
                                <div class="font-weight-bold text-dark responses-value">{{ item.responses }}</div>
                                <div class="small text-muted">responses</div>
                            </div>
                        </div>
                    </td>
                </template>

                <!-- Vision/Visibility Status Badge -->
                <template #visibility="{ item }">
                    <td class="align-middle">
                        <span v-if="!item.isEmpty" class="visibility-badge" :class="getVisibilityClass(item.visibility)">
                            {{ item.visibility }}
                        </span>
                    </td>
                </template>

                <!-- Actions -->
                <template #actions="{ item }">
                    <td class="align-middle text-right">
                        <CDropdown v-if="!item.isEmpty" placement="bottom-end">
                            <template #toggler>
                                <button class="btn btn-link text-muted p-0 text-decoration-none shadow-none">
                                    <CIcon name="cil-options" size="lg" />
                                </button>
                            </template>
                            <CDropdownItem @click="goToViewForm(item)">
                                <CIcon name="cil-magnifying-glass" class="mr-2 text-info" /> View
                            </CDropdownItem>
                            <CDropdownItem @click="goToDuplicationForm(item)">
                                <CIcon name="cil-copy" class="mr-2 text-info" /> Duplication
                            </CDropdownItem>
                            <CDropdownItem @click="goToEditForm(item)">
                                <CIcon name="cil-pencil" class="mr-2 text-warning" /> Edit
                            </CDropdownItem>
                            <CDropdownItem @click="deleteModal = true && (deleteItem = item)" class="text-danger">
                                <CIcon name="cil-trash" class="mr-2" /> Delete
                            </CDropdownItem>
                        </CDropdown>
                    </td>
                </template>

            </CDataTable>
        </div>

        <!-- Pagination -->
        <Pagination :activePage.sync="activePage" :pages="totalPages" />

        <!-- Confirm Delete modal -->
        <CModal :show.sync="deleteModal" :centered="true">
            <template #header-wrapper>
                <div class="align-items-start p-3">
                    <div class="d-flex flex-column align-items-center">
                        <div class="icon-wrapper border-danger m-1">
                            <CIcon name="cil-x" />
                        </div>
                        <span class="font-weight-bold">Delete Confirmation</span>
                    </div>
                </div>
            </template>
            <template #body-wrapper>
                <div class="d-flex justify-content-center p-4">
                    <span>Do you really need this? after deleting you can't undone</span>
                </div>
            </template>
            <template #footer-wrapper>
                <div class="d-flex justify-content-center p-3">
                    <CButton color="secondary" @click="deleteModal = false">
                        Cancel
                    </CButton>
                    <CButton color="danger" class="ml-2" @click="confirmDelete()">
                        OK
                    </CButton>
                </div>
            </template>
        </CModal>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'

export default {
    name: 'EditorTables',
    components: { Pagination },
    data() {
        return {
            searchQuery: '',
            selectedStatus: 'All Status',
            isCreating: false,
            activePage: 1,
            itemsPerPage: 5,
            deleteModal: false,
            deleteItem: null,
            columns: [
                { key: 'title', label: 'Questionnaire', _style: 'width:40%' },
                { key: 'status', label: 'Status', _style: 'width:15%' },
                { key: 'responses', label: 'Responses', _style: 'width:15%' },
                { key: 'visibility', label: 'Vision', _style: 'width:20%' },
                { key: 'actions', label: 'Actions', _style: 'width:10%; text-align:right' }
            ]
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('Setting', ['lang']),

        totalPages() {
            return Math.ceil(this.tableData.length / this.itemsPerPage) || 1;
        },
        tableStartItem() {
            if (this.tableData.length === 0) return 0;
            return (this.activePage - 1) * this.itemsPerPage + 1;
        },
        tableEndItem() {
            const validItemsCount = this.tableData.filter(item => !item.isEmpty).length;
            return Math.min(this.activePage * this.itemsPerPage, validItemsCount);
        },

        tableData() {
            let finalData = [];

            if (Array.isArray(this.forms) && this.forms.length > 0) {
                // Sort forms by updatedAt (newest first)
                const sortedForms = [...this.forms].sort((a, b) => {
                    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
                })

                // 2. Map to display objects
                const mappedData = sortedForms.map(form => {
                    // Determine status based on schedule
                    let statusTitle = 'Draft';
                    const now = new Date();
                    const schedule = form.schedule;

                    if (schedule && schedule.startAt) {
                        const start = new Date(schedule.startAt);
                        const end = new Date(schedule.endAt);

                        if (!start && !end) {
                            statusTitle = 'Draft';
                        } else if (start <= now && now <= end) {
                            statusTitle = 'Open';
                        } else {
                            statusTitle = 'Closed';
                        }
                    }

                    return {
                        _id: form._id,
                        title: this.getLang(form.title) || 'Untitled Form',
                        description: this.getLang(form.description) || '',
                        status: statusTitle,
                        access: form.isPublic ? 'Public' : 'Private',
                        visibility: form.status ? this.getLang(form.status.title) : '-',
                        responses: form.responses ? form.responses.length : 0,
                        created: form.updatedAt ? moment(form.updatedAt).format('MMM D, YYYY') : '-'
                    }
                });

                // 3. Apply filters
                finalData = mappedData.filter(item => {
                    // Filter by Status
                    if (this.selectedStatus !== 'All Status' && item.status !== this.selectedStatus) {
                        return false;
                    }

                    // Filter by Search Query
                    if (this.searchQuery) {
                        const query = this.searchQuery.toLowerCase();
                        const titleMatch = item.title.toLowerCase().includes(query);
                        const descMatch = item.description && item.description.toLowerCase().includes(query);
                        return titleMatch || descMatch;
                    }

                    return true;
                });
            }

            // Fill empty rows if less than Items Per Page (5)
            const minRows = this.itemsPerPage;
            if (finalData.length < minRows) {
                const emptySlotCount = minRows - finalData.length;
                for (let i = 0; i < emptySlotCount; i++) {
                    finalData.push({
                        _id: `empty-${i}`,
                        isEmpty: true,
                        title: '',
                        description: '',
                        status: '',
                        visibility: '',
                        responses: '',
                        created: ''
                    });
                }
            }

            return finalData;
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
            if (s === 'open') return 'status-open';
            if (s === 'closed') return 'status-closed';
            return 'status-draft';
        },
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = visibility.toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ')) return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            return 'visi-default';
        },
        async createNewForm() {
            this.isCreating = true;
            try {
                const newFormData = {
                    title: [
                        { key: 'en', value: 'Untitled Form' }
                    ],
                    description: [
                        { key: 'en', value: 'Description' }
                    ],
                    questions: [],
                    responses: [],
                    settings: {
                        startDateTime: '',
                        endDateTime: '',
                        accessType: 'Anyone with the link',
                        newCollaborator: {
                            email: '',
                            role: 'Editor'
                        },
                        collectEmails: false,
                        limitOneResponse: false,
                        allowEditing: false,
                        showProgressBar: false
                    }
                };

                const response = await this.$store.dispatch('Forms/create', newFormData);

                this.$router.push({ name: 'EditorCreateForm', params: { _id: response.data.data._id } });
            } catch (error) {
                console.error("Failed to create form:", error);
            } finally {
                this.isCreating = false;
            }
        },
        goToEditForm(item) {
            this.$router.push({ name: 'EditorCreateForm', params: { _id: item._id } });
        },
        goToDuplicationForm(item) {
            this.$router.push({ name: 'FormFill', params: { id: item._id }, query: { mode: 'duplicate', source: 'internal' } });
        },
        goToViewForm(item) {
            this.$router.push({ name: 'FormFill', params: { id: item._id }, query: { mode: 'preview', source: 'internal' } });
        },
        async confirmDelete() {
            if (this.deleteItem) {
                await this.deleteForm(this.deleteItem);
            }
            this.deleteModal = false;
            this.deleteItem = null;
        },
        async deleteForm(item) {
            try {
                await this.$store.dispatch('Forms/delete', { _id: item._id });
                await this.$store.dispatch('Forms/get');
            } catch (error) {
                console.error("Failed to delete form:", error);
            }
        },
    }
}
</script>

<style scoped>
.user-tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
}

/* Typography */
.text-lg {
    font-size: 0.95rem;
}

.text-muted {
    color: #94a3b8 !important;
}

/* Status Badges */
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35em 0.8em;
    border-radius: 50rem;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}

/* Status Colors */
.status-open {
    background-color: #d1fae5;
    color: #065f46;
}

.status-open .status-dot {
    background-color: #059669;
}

.status-draft {
    background-color: #f3f4f6;
    color: #4b5563;
}

.status-draft .status-dot {
    background-color: #9ca3af;
}

.status-closed {
    background-color: #fee2e2;
    color: #991b1b;
}

.status-closed .status-dot {
    background-color: #dc2626;
}

/* Visibility Badges */
.visibility-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25em 0.75em;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
}

.visi-public {
    background-color: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
}

.visi-private {
    background-color: #f3e8ff;
    color: #7e22ce;
    border: 1px solid #e9d5ff;
}

.visi-default {
    background-color: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

/* Icon Wrapper */
.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: #fff1f2;
    /* Light rose background for chart looking icon */
    color: #be123c;
}

.chart-color {
    background-color: #fff5f5;
    color: #e55353;
}

/* Dropdown */
.btn-link {
    color: #94a3b8;
}

.btn-link:hover {
    color: #64748b;
}


/* Pagination customization to match clean theme */
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
    /* Sky blue or primary brand color */
    color: white;
}

.search-input-group .input-group-text {
    background-color: #f8fafc !important;
}

.search-input-group input {
    background-color: #f8fafc !important;
}


::v-deep .custom-table table {
    margin-bottom: 0;
}

::v-deep .custom-table thead th {
    background-color: #f8fafc !important;
    /* Very subtle grey background for header */
    color: #475569 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    text-transform: capitalize !important;
    letter-spacing: normal;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    vertical-align: middle;
}

::v-deep .custom-table tbody td {
    color: #1e293b !important;
    font-size: 14px;
    font-weight: 500;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 18px 24px !important;
    vertical-align: middle;
    height: 76px;
    /* Set a default height to prevent empty rows from shrinking */
}

::v-deep .custom-table tbody tr:hover td {
    background-color: #f8fafc !important;
}

::v-deep .custom-table tbody tr:last-child td {
    border-bottom: none !important;
    /* Remove bottom border from the last row */
}
</style>