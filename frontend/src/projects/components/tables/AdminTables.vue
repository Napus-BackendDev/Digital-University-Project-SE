<template>
    <div class="response-trends-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold">Response Trends</h4>
            </div>
            <div class="text-muted small ">Daily responses over the last week</div>
        </div>

        <div class="table-responsive">
            <CDataTable :items="paginatedData" :fields="fields" :items-per-page="pageSize" :activePage="1"
                :pagination="false" hover class="mb-0 custom-table">
                <!-- Form Title Slot -->
                <template #form="{ item }">
                    <td class="py-3 pl-3">
                        <div class="font-weight-bold text-dark">{{ item.title }}</div>
                        <div class="small text-muted" v-if="item.description">{{ item.description }}</div>
                    </td>
                </template>

                <!-- Status Slot -->
                <template #status="{ item }">
                    <td class="align-middle py-3">
                        <div class="d-flex align-items-center"
                            :class="{ 'text-dark': item.status === 'Open' || item.status === 'Draft', 'text-muted': item.status === 'Closed' }">
                            <CIcon :name="getStatusIcon(item.status)" size="sm" class="mr-1" />
                            {{ item.status }}
                        </div>
                    </td>
                </template>

                <!-- Access Slot -->
                <template #access="{ item }">
                    <td class="align-middle py-3">
                        <span class="badge badge-pill badge-light border px-3 py-1">{{ item.access }}</span>
                    </td>
                </template>

                <!-- Responses Slot -->
                <template #responses="{ item }">
                    <td class="align-middle py-3 text-center">
                        <div class="response-circle">
                            {{ item.responses }}
                        </div>
                    </td>
                </template>

                <!-- Created Slot -->
                <template #created="{ item }">
                    <td class="align-middle py-3 text-right text-muted pr-4">
                        {{ item.created }}
                    </td>
                </template>
            </CDataTable>
        </div>
        <div class="d-flex justify-content-center mt-3">
            <CPagination :active-page.sync="currentPage" :pages="totalPages" responsive />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
    name: 'AdminTables',
    data() {
        return {
            currentPage: 1,
            pageSize: 5,
            fields: [
                { key: 'form', label: 'Form Title', _style: 'width:40%' },
                { key: 'status', label: 'Status' },
                { key: 'access', label: 'Access' },
                { key: 'responses', label: 'Responses', _classes: 'text-center' },
                { key: 'created', label: 'Created', _classes: 'text-right pr-4' }
            ]
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),

        tableData() {
            // Force reactivity on locale change
            const locale = this.$i18n.locale;

            if (!this.forms || this.forms.length === 0) return []

            // Sort forms by updatedAt (newest first)
            const sortedForms = [...this.forms].sort((a, b) => {
                return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            })

            return sortedForms.map(form => {
                let statusTitle = 'Draft';
                const now = new Date();
                const schedule = form.schedule || (form.settings && form.settings.schedule);

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
                    title: this.getLang(form.title) || 'Untitled Form',
                    description: this.getLang(form.description) || '',
                    status: statusTitle,
                    access: form.isPublic ? 'Public' : 'Private',
                    responses: form.responses ? form.responses.length : 0,
                    created: form.updatedAt ? moment(form.updatedAt).format('D MMM YYYY') : '-'
                }
            })
        },
        totalPages() {
            return Math.ceil(this.tableData.length / this.pageSize)
        },
        paginatedData() {
            const start = (this.currentPage - 1) * this.pageSize
            const end = start + this.pageSize
            return this.tableData.slice(start, end)
        }
    },
    methods: {
        getLang(data) {
            if (!data || !Array.isArray(data)) return data;

            // Find content matching current locale
            const currentLang = this.$i18n.locale;
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
        getStatusIcon(status) {
            switch (status) {
                case 'Open': return 'cil-check-circle';
                case 'Draft': return 'cil-clock';
                case 'Closed': return 'cil-x-circle';
                case 'Scheduled': return 'cil-calendar';
                default: return 'cil-circle';
            }
        }
    }
}
</script>

<style scoped>
.response-trends-container {
    background: white;
    border-radius: 8px;
    padding: 20px;
}

.custom-table thead th {
    border-top: none;
    border-bottom: 1px solid #edf2f7;
    color: #4a5568;
    font-weight: 600;
    font-size: 0.875rem;
    padding-bottom: 1rem;
}

.custom-table tbody td {
    border-top: 1px solid #edf2f7;
    padding-top: 1rem;
    padding-bottom: 1rem;
    vertical-align: top;
}

.custom-table tbody tr:hover {
    background-color: #fafbfc;
}

.response-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background-color: #fce8e8;
    color: #c53030;
    font-weight: 700;
    font-size: 0.9rem;
}

.badge-light {
    background-color: #f7fafc;
    color: #4a5568;
    border: 1px solid #edf2f7 !important;
    font-weight: 500;
}

.text-muted {
    color: #718096 !important;
}

/* Pagination Overrides for 'White' look if not default */
::v-deep .page-link {
    color: #4a5568;
    background-color: #fff;
    border: 1px solid #edf2f7;
}

::v-deep .page-item.active .page-link {
    background-color: #e55353;
    /* Match theme danger color or similar */
    border-color: #e55353;
    color: white;
}
</style>