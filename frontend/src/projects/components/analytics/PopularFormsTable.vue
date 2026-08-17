<template>
    <CRow>
        <CCol lg="12">
            <div class="response-trends-container">
                <div class="header mb-4">
                    <h4 class="m-0 font-weight-bold">{{ $t('analytics.popularForms') }}</h4>
                </div>
                <CDataTable
                    :items="computedTableItems"
                    :fields="tableFields"
                    hover
                    class="mb-0 tables-container"
                >
                    <!-- Form Name Slot -->
                    <template #formName="{item}">
                        <td class="py-3 pl-3 text-dark">
                            <div class="font-weight-bold" style="font-size: 0.95rem; margin-bottom: 2px;">{{item.formName}}</div>
                            <div v-if="item.description" class="text-muted small" style="line-height: 1.2; max-width: 300px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                {{item.description}}
                            </div>
                        </td>
                    </template>

                    <!-- Responses Slot -->
                    <template #responses="{item}">
                        <td class="align-middle py-3">
                            <div class="d-flex flex-column" style="gap: 4px;">
                                <div class="d-flex align-items-center">
                                    <div class="response-icon-box text-success mr-2">
                                        <CIcon name="cil-check" size="sm" />
                                    </div>
                                    <span class="font-weight-bold mr-1" style="font-size: 0.9rem;">{{ item.responses || 0 }}</span>
                                    <span class="text-muted" style="font-size: 0.8rem;">{{ $t('table.completed') }}</span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <div class="response-icon-box text-primary mr-2">
                                        <CIcon name="cil-history" size="sm" />
                                    </div>
                                    <span class="font-weight-bold mr-1" style="font-size: 0.9rem;">{{ item.ongoing || 0 }}</span>
                                    <span class="text-muted" style="font-size: 0.8rem;">{{ $t('table.ongoing') }}</span>
                                </div>
                            </div>
                        </td>
                    </template>

                    <!-- Access Slot -->
                    <template #access="{item}">
                        <td class="align-middle py-3">
                            <div class="access-stack">
                                <span v-for="(v, idx) in item.access" :key="idx" class="visibility-badge"
                                        :class="getVisibilityClass(v)">
                                    {{ v.startsWith('Personal: ') ? v.replace('Personal: ', '') : ($te('accessLabel.' + v.toLowerCase()) ? $t('accessLabel.' + v.toLowerCase()) : v) }}
                                </span>
                            </div>
                        </td>
                    </template>

                    <!-- Time Range Slot (Schedule) -->
                    <template #scheduleRange="{item}">
                        <td class="align-middle py-3">
                            <div class="text-dark font-weight-bold small" style="letter-spacing: 0.2px;">
                                {{ item.scheduleRange }}
                            </div>
                            <div v-if="item.status === 'Active' && item.daysLeft !== null" 
                                    class="font-weight-bold" 
                                    style="font-size: 0.8rem; margin-top: 4px; color: #8c1515;">
                                <CIcon name="cil-clock" size="sm" class="mr-1" />
                                {{ $t('table.daysLeft', { count: item.daysLeft }) }}
                            </div>
                            <div v-else-if="item.status === 'Closed'" 
                                    class="text-muted font-weight-bold" 
                                    style="font-size: 0.8rem; margin-top: 4px;">
                                {{ $t('table.closed') }}
                            </div>
                        </td>
                    </template>

                    <!-- Status Slot -->
                    <template #status="{item}">
                        <td class="align-middle py-3">
                            <span class="status-badge" :class="getStatusClass(item.status)">
                                <span class="status-dot"></span>
                                {{ $t('status.' + item.status.toLowerCase()) }}
                            </span>
                        </td>
                    </template>
                </CDataTable>
            </div>
        </CCol>
    </CRow>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import localeMixin from '@/mixins/localeMixin'
import { getTableStatusLabel, isInTimeRange, isSubmittedResponse } from '@/projects/utils/analytics'

export default {
    name: 'PopularFormsTable',
    mixins: [localeMixin],
    props: {
        timeRange: {
            type: String,
            default: '7d'
        }
    },
    data() {
        return {
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user', 'users']),
        ...mapGetters('Organizations', ['organizations']),
        
        tableFields() {
            return [
                { key: 'formName', label: this.$t('table.questionnaire'), _style: 'width:30%' },
                { key: 'access', label: this.$t('table.access') },
                { key: 'responses', label: this.$t('table.responses') },
                { key: 'scheduleRange', label: this.$t('table.timeRange') },
                { key: 'status', label: this.$t('table.status') }
            ];
        },

        computedTableItems() {
            if (!this.forms || !Array.isArray(this.forms)) return [];
            
            const now = moment();
            const myForms = this.forms;
            
            const items = myForms.map(f => {
                const formName = this.getLang(f.title) || this.$t('common.untitled') || 'Untitled Form';
                const rawOrgs = f.organization || [];
                let access = [];

                const orgNames = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => {
                    if (!o) return null;
                    let orgObj = o;
                    if (typeof o === 'string' && this.organizations) {
                        const found = this.organizations.find(x => String(x._id) === String(o));
                        if (found) orgObj = found;
                    }
                    if (typeof orgObj === 'string') return null;
                    if (typeof orgObj === 'object') {
                        if (Array.isArray(orgObj.title)) {
                            const locale = this.$i18n.locale.toLowerCase();
                            const localTitle = orgObj.title.find(t => t && t.key && t.key.toLowerCase() === locale);
                            return localTitle ? localTitle.value : (orgObj.title[0] ? orgObj.title[0].value : null);
                        }
                        return orgObj.name || orgObj.value || orgObj.title || null;
                    }
                    return null;
                }).filter(Boolean);

                const isPublicForm = orgNames.some(name => name === 'General' || name === 'ทั่วไป');
                if (isPublicForm) {
                    access = ['Public'];
                } else if (orgNames.length > 0) {
                    access = orgNames;
                } else {
                    access = ['Private'];
                }

                if (f.settings && Array.isArray(f.settings.allowedUser) && f.settings.allowedUser.length > 0) {
                    f.settings.allowedUser.forEach(u => {
                        access.push('Personal: ' + this.getUserName(u));
                    });
                }
                
                let responses = 0;
                let ongoing = 0;
                if (f.responses && Array.isArray(f.responses)) {
                    const inRange = f.responses.filter(r => isInTimeRange(r.createdAt, this.timeRange, now));
                    responses = inRange.filter(r => isSubmittedResponse(r)).length;
                    ongoing = inRange.filter(r => !isSubmittedResponse(r)).length;
                }
                
                const schedule = f.schedule || (f.settings && f.settings.schedule);
                let scheduleRange = '-';
                let daysLeft = null;
                if (schedule && schedule.startAt && schedule.endAt) {
                    const startStr = moment(schedule.startAt).format('DD/MM/YYYY');
                    const endStr = moment(schedule.endAt).format('DD/MM/YYYY');
                    scheduleRange = `${startStr} - ${endStr}`;
                    const end = moment(schedule.endAt);
                    daysLeft = end.diff(now, 'days');
                }

                const statusResult = getTableStatusLabel(f, now);
                const description = this.getLang(f.description);
                
                return {
                    id: f._id,
                    formName,
                    description,
                    access,
                    responses,
                    ongoing,
                    scheduleRange,
                    daysLeft,
                    status: statusResult
                };
            });
            
            items.sort((a, b) => b.responses - a.responses);
            return items.slice(0, 5);
        }
    },
    methods: {
        getStatusClass(status) {
            const s = status ? String(status).toLowerCase() : '';
            if (s === 'active' || s.includes('open')) return 'status-active';
            if (s === 'closed') return 'status-closed';
            return 'status-pending';
        },
        getUserName(userRef) {
            if (!userRef) return 'Unknown';
            if (typeof userRef === 'object' && userRef.email) return userRef.name || userRef.email;
            if (!this.users) return userRef;
            const u = this.users.find(x => String(x._id) === String(userRef));
            return u ? (u.name || u.email) : userRef;
        },
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = String(visibility).toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ') || v === 'general') return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            if (v.includes('personal')) return 'visi-personal';
            return 'visi-org';
        },
        checkAdmin(user) {
            if (user && user.role) {
                const role = user.role;
                if (Array.isArray(role.title)) {
                    return role.title.some(t => t && t.value && t.value.toLowerCase().includes('admin'));
                } else if (typeof role.title === 'string') {
                    return role.title.toLowerCase().includes('admin');
                }
            }
            return false;
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
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0 !important;
    padding: 0;
    overflow: hidden;
}

.response-icon-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background-color: #f1f5f9;
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

.access-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    max-height: 85px;
    overflow-y: auto;
    padding-right: 4px;
}

.access-stack::-webkit-scrollbar {
    width: 3px;
}

.access-stack::-webkit-scrollbar-track {
    background: transparent;
}

.access-stack::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}

.visi-personal {
    background-color: #f5f3ff;
    color: #7c3aed;
}
</style>
