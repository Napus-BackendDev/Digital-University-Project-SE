<template>
    <div class="response-trends-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold">{{ $t('nav.analytics') }}</h4>
            </div>
<<<<<<< HEAD
            <div class="text-muted small ">{{ $t('analytics.dailyResponsesTrend') }}</div>
=======
            <div class="text-muted small ">{{ $t('analytics.responsesOverTimeDesc') }}</div>
>>>>>>> 36a8da6550c6e56ca16a2631998b494be1890130
        </div>

        <!-- Table -->
        <CDataTable :items="paginatedData" :fields="fields" :items-per-page="pageSize" :activePage="1"
            :pagination="false" hover class="mb-0 tables-container">
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
                        :class="{ 'text-dark': item.status === 'Active' || item.status === 'Draft', 'text-muted': item.status === 'Closed' }">
                        <CIcon :name="getStatusIcon(item.status)" size="sm" class="mr-1" />
                        {{ $t(`status.${item.status.toLowerCase()}`) }}
                    </div>
                </td>
            </template>

            <!-- Access Slot -->
            <template #access="{ item }">
                <td class="align-middle py-3">
                    <span class="badge badge-pill badge-light border px-3 py-1">{{ $t('status.' + item.access.toLowerCase()) }}</span>
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

        <!-- Pagination -->
        <Pagination :activePage.sync="currentPage" :pages="totalPages" />
    </div>
</template>

<script>
    import { mapGetters } from 'vuex'
    import Pagination from '@/projects/components/Util/Pagination.vue'
import moment from 'moment'
import localeMixin from '@/mixins/localeMixin'

export default {
    name: 'AdminTables',
    components: {
        Pagination
    },
    mixins: [localeMixin],
    data() {
        return {
            currentPage: 1,
            pageSize: 5,
        }
    },
    computed: {
        fields() {
            return [
                { key: 'form', label: this.$t('table.title'), _style: 'width:40%' },
                { key: 'status', label: this.$t('table.status') },
                { key: 'access', label: this.$t('table.access') },
                { key: 'responses', label: this.$t('table.responses'), _classes: 'text-center' },
                { key: 'created', label: this.$t('table.created'), _classes: 'text-right pr-4' }
            ]
        },
        ...mapGetters('Forms', ['forms']),

        tableData() {
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
                        statusTitle = 'Active';
                    } else {
                        statusTitle = 'Closed';
                    }
                }

<<<<<<< HEAD
                const localFormat = this.$i18n.locale === 'th' ? 'th-TH' : 'en-GB';

=======
                moment.locale(this.$i18n.locale === 'th' ? 'th' : 'en');
>>>>>>> 36a8da6550c6e56ca16a2631998b494be1890130
                return {
                    title: this.getLang(form.title) || this.$t('common.untitled'),
                    description: this.getLang(form.description) || '',
                    status: statusTitle,
                    access: form.isPublic ? this.$t('accessLabel.public') : this.$t('accessLabel.private'),
                    responses: form.responses ? form.responses.filter(r => r && (r.submit === true || r.submit === 'true')).length : 0,
                    created: form.updatedAt ? new Date(form.updatedAt).toLocaleDateString(localFormat, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
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
        getStatusIcon(status) {
            switch (status) {
                case 'Active': return 'cil-check-circle';
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
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    padding: 0;
    overflow: hidden;
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