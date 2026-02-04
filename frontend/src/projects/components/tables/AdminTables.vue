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
                    <tr v-for="(item, index) in tableData" :key="index">
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
            <CPagination :active-page.sync="currentPage" :pages="10" responsive />
        </div>
    </div>
</template>

<script>
export default {
    name: 'AdminTables',
    data() {
        return {
            currentPage: 1,
            tableData: [
                {
                    title: 'Comprehensive Survey - All Question Types',
                    description: 'A demonstration survey showcasing all available question types in the system',
                    status: 'Open',
                    access: 'Public',
                    responses: 6,
                    created: '1 ธ.ค. 2567'
                },
                {
                    title: 'Customer Satisfaction Survey',
                    description: 'Help us improve our services by sharing your feedback',
                    status: 'Draft',
                    access: 'Private',
                    responses: 12,
                    created: '1 ธ.ค. 2567'
                },
                {
                    title: 'Weekly Team Check-in',
                    description: 'Quick pulse check for the team',
                    status: 'Closed',
                    access: 'Private',
                    responses: 0,
                    created: '1 ธ.ค. 2567'
                },
                {
                    title: 'Employee Feedback Q4 2024',
                    description: 'Internal feedback survey for team members',
                    status: 'Open',
                    access: 'Public',
                    responses: 156,
                    created: '1 ธ.ค. 2567'
                },
                {
                    title: 'Conference Feedback 2025',
                    description: '',
                    status: 'Open',
                    access: 'Public',
                    responses: 234,
                    created: '1 ธ.ค. 2567'
                }
            ]
        }
    },
    methods: {
        getStatusIcon(status) {
            switch (status) {
                case 'Open': return 'cil-check-circle';
                case 'Draft': return 'cil-clock';
                case 'Closed': return 'cil-x-circle';
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