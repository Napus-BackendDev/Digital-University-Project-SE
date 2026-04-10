<template>
    <div class="response-trends-container">
        <div class="header mb-4">
            <div class="d-flex align-items-center mb-1">
                <h4 class="m-0 font-weight-bold">{{ $t('nav.analytics') }}</h4>
            </div>
            <div class="text-muted small ">{{ $t('analytics.responsesOverTimeDesc') }}</div>
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
                    <span class="status-badge" :class="getStatusClass(item.status)">
                        <span class="status-dot"></span>
                        {{ $t(`status.${item.status.toLowerCase()}`) }}
                    </span>
                </td>
            </template>

            <!-- Access Slot -->
            <template #access="{ item }">
                <td class="align-middle py-3">
                    <span class="visibility-badge" :class="getVisibilityClass(item.access)">
                        {{ item.access }}
                    </span>
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
    import { getFilteredResponses as filterResponsesInRange, getTableStatusLabel, getFormStatusKey } from '@/projects/utils/analytics'

export default {
    name: 'AdminTables',
    components: {
        Pagination
    },
    mixins: [localeMixin],
    props: {
        timeRange: {
            type: String,
            default: '7d'
        }
    },
    data() {
        return {
            currentPage: 1,
            pageSize: 5,
        }
    },
    computed: {
        fields() {
            // Reference this.lang to ensure the table headers re-compute when language changes
            this.lang;
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
            // Reference this.lang to ensure the data re-computes when language changes
            this.lang;
            if (!this.forms || this.forms.length === 0) return []

            // Sort forms by updatedAt (newest first)
            const sortedForms = [...this.forms].sort((a, b) => {
                return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            })

            return sortedForms
                .filter(form => {
                    if (!form) return false;

                    const statusKey = getFormStatusKey(form);
                    const schedule = form.schedule || (form.settings && form.settings.schedule);

                    // Hide true draft forms from analytics table.
                    if (statusKey === 'pending' && (!schedule || (!schedule.startAt && !schedule.endAt))) {
                        return false;
                    }

                    return true;
                })
                .map(form => {
                const statusTitle = getTableStatusLabel(form);

                const localFormat = this.$i18n.locale === 'th' ? 'th-TH' : 'en-GB';
                moment.locale(this.$i18n.locale === 'th' ? 'th' : 'en');
                const accessTitle = this.getAccessTitle(form);

                return {
                    title: this.getLang(form.title) || this.$t('common.untitled'),
                    description: this.getLang(form.description) || '',
                    status: statusTitle,
                    access: accessTitle,
                    responses: filterResponsesInRange(form, this.timeRange).length,
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
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'active') return 'status-active';
            if (s === 'closed') return 'status-closed';
            return 'status-pending';
        },
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = String(visibility).toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ') || v === 'general') return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            return 'visi-org';
        },
        getAccessTitle(form) {
            // Use canonical backend field first, keep legacy boolean fallback.
            const accessRaw = (form && form.access) ? String(form.access).toLowerCase() : '';

            if (accessRaw === 'private') return this.$t('accessLabel.private');
            if (accessRaw === 'organization') return this.$t('accessLabel.general');
            if (accessRaw === 'public') return this.$t('accessLabel.public');

            if (typeof form?.isPublic === 'boolean') {
                return form.isPublic ? this.$t('accessLabel.public') : this.$t('accessLabel.private');
            }

            // Backend visibility rules treat missing access as public (legacy records).
            return this.$t('accessLabel.public');
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
    color: #94a3b8 !important;
}

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

.status-active {
    background-color: #d1fae5;
    color: #065f46;
}

.status-active .status-dot {
    background-color: #059669;
}

.status-pending {
    background-color: #fef9c3;
    color: #854d0e;
}

.status-pending .status-dot {
    background-color: #eab308;
}

.status-closed {
    background-color: #fee2e2;
    color: #991b1b;
}

.status-closed .status-dot {
    background-color: #dc2626;
}

.visibility-badge {
    display: inline-flex;
    padding: 0.25em 0.8em;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}

.visi-public {
    background-color: #ecfdf5;
    color: #059669;
}

.visi-private {
    background-color: #fff1f2;
    color: #e11d48;
}

.visi-org {
    background-color: #f0f7ff;
    color: #1e40af;
}

.visi-default {
    background-color: #f1f5f9;
    color: #64748b;
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