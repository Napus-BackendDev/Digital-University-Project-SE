<template>
    <div class="response-trends-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold">Response Trends</h4>
            </div>
            <div class="text-muted small ">Daily responses over the last week</div>
        </div>

        <div class="table-responsive">
            <table class="table table-hover custom-table">
                <thead>
                    <tr>
                        <th scope="col" width="40%">Form Title</th>
                        <th scope="col">Status</th>
                        <th scope="col">Access</th>
                        <th scope="col" class="text-center">Responses</th>
                        <th scope="col" class="text-right">Created</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in paginatedData" :key="index">
                        <td>
                            <div class="font-weight-bold text-dark">{{ item.title }}</div>
                            <div class="small text-muted" v-if="item.description">{{ item.description }}</div>
                        </td>
                        <td class="align-middle">
                            <div class="d-flex align-items-center"
                                :class="{ 'text-dark': item.status === 'Open' || item.status === 'Draft', 'text-muted': item.status === 'Closed' }">
                                <CIcon :name="getStatusIcon(item.status)" size="sm" class="mr-1" />
                                {{ item.status }}
                            </div>
                        </td>
                        <td class="align-middle">
                            <span class="badge badge-pill badge-light border px-3 py-1">{{ item.access }}</span>
                        </td>
                        <td class="align-middle text-center">
                            <div class="response-circle">
                                {{ item.responses }}
                            </div>
                        </td>
                        <td class="align-middle text-right text-muted">
                            {{ item.created }}
                        </td>
                    </tr>
                </tbody>
            </table>
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
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),

        tableData() {

            if (!this.forms || this.forms.length === 0) return []

            // Sort forms by createdAt (newest first)
            const sortedForms = [...this.forms].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt)
            })

            return sortedForms.map(form => {

                return {
                    title: this.getLang(form.title) || 'Untitled Form',
                    description: this.getLang(form.description) || '',
                    status: this.getLang(form.status.title) || 'Draft',
                    access: form.isPublic ? 'Public' : 'Private',
                    responses: form.responses ? form.responses.length : 0,
                    created: form.createdAt ? moment(form.createdAt).format('D MMM YYYY') : '-'
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