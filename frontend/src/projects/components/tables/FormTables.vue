<template>
    <div>
        <!-- Filter Toolbar Refactored -->
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate"
            :endDate.sync="endDate" />

        <CDataTable :items="loading ? [] : tableData" :fields="fields" :items-per-page="itemsPerPage" :activePage.sync="activePage"
            :pagination="false" :loading="loading" :hover="!loading && tableData.length > 0" class="mb-0 tables-container mobile-card-table" :class="{ 'table-empty': !loading && tableData.length === 0 }">

            <template #loading>
                <TableLoading borderless />
            </template>

            <template #no-items-view>
                <EmptyState
                    borderless
                    icon="cil-description"
                    :title="$t('table.noForms')"
                    :description="$t('table.noAssignedFormsDesc')"
                />
            </template>

            <!-- Form Name (Title, Description & Urgent Deadline Meta) Slot -->
            <template #form="{ item }">
                <td class="align-middle py-3">
                    <div class="font-weight-bold text-dark form-row-title line-clamp-2" :title="item.title">{{ item.title }}</div>
                    <div class="small text-muted mt-1 form-row-desc line-clamp-2" v-if="item.description && item.description !== '-'" :title="item.description">{{ item.description }}</div>
                    <div v-if="item.isClosingSoon" class="respondent-meta-row mt-2">
                        <span class="meta-chip meta-closing">
                            <CIcon name="cil-clock" size="sm" class="mr-1" />
                            {{ $t('table.closingSoon') }}
                        </span>
                    </div>
                </td>
            </template>

            <!-- Time Range Slot (match ManagementTables) -->
            <template #timeRange="{ item }">
                <td class="align-middle">
                    <div class="small text-dark font-weight-bold" v-if="item.timeRange && item.timeRange !== '-'">{{ item.timeRange }}</div>
                    <div class="small mt-1" :class="item.isClosingSoon ? 'text-warning font-weight-bold' : 'text-muted'" v-if="item.daysLeft">{{ item.daysLeft }}</div>
                </td>
            </template>

            <!-- Status Slot (status pill only) -->
            <template #status="{ item }">
                <td class="align-middle">
                    <span v-if="item && item.status" class="status-badge" :class="getStatusClass(item.status)">
                        <span class="status-dot"></span>
                        {{ $t('respondentStatus.' + item.status.toLowerCase().replace(/\s/g, '')) }}
                    </span>
                </td>
            </template>

            <!-- Created By Slot (Name + Email matching /manage) -->
            <template #createdBy="{ item }">
                <td class="align-middle">
                    <div class="creator-cell" :title="[item.createdOrg, item.createdName, item.createdEmail].filter(Boolean).join(' · ')">
                        <div class="small text-dark font-weight-bold text-truncate creator-name">{{ item.createdOrg || item.createdName || '-' }}</div>
                        <div v-if="item.createdOrg && item.createdName !== '-'" class="text-muted text-truncate creator-email mt-1">{{ item.createdName }}</div>
                    </div>
                </td>
            </template>

            <!-- Action Slot (Icon + Label Respondent CTA without tooltip) -->
            <template #action="{ item }">
                <td class="align-middle text-right pr-3">
                    <div class="d-flex align-items-center justify-content-end">
                        <button
                            type="button"
                            class="respondent-cta-btn"
                            :class="item.cta.btnClass"
                            :disabled="item.cta.disabled"
                            :aria-label="item.cta.label"
                            @click.stop="!item.cta.disabled && goToForm(item._id, item.cta.isNew)"
                        >
                            <CIcon :name="item.cta.icon" size="sm" class="cta-icon" />
                            <span class="cta-label">{{ item.cta.label }}</span>
                        </button>
                    </div>
                </td>
            </template>
        </CDataTable>

        <!-- Table Footer: Rows per page & Pagination -->
        <div v-if="!loading && tableData.length > 0" class="d-flex justify-content-between align-items-center flex-wrap mt-3 px-2">
            <!-- Left: Items Per Page Selector -->
            <div class="d-flex align-items-center text-muted small font-weight-bold my-1">
                <span class="mr-2">{{ $t('table.showing') }}</span>
                <select v-model.number="itemsPerPage" class="custom-per-page-select mr-2">
                    <option :value="5">5</option>
                    <option :value="10">10</option>
                    <option :value="15">15</option>
                    <option :value="20">20</option>
                </select>
                <span class="mr-2">{{ $t('table.itemsPerPage') }}</span>
                <span class="text-secondary">({{ startItem }} - {{ endItem }} {{ $t('table.of') }} {{ totalItems }} {{ $t('table.items') }})</span>
            </div>

            <!-- Right: Pagination -->
            <div class="my-1">
                <Pagination :activePage.sync="activePage" :pages="totalPages" align="end" noMargin />
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Pagination from '@/projects/components/Util/Pagination.vue'
import FilterTable from '@/projects/components/Filter/FilterTable.vue'
import EmptyState from '@/projects/components/Util/EmptyState.vue'
import TableLoading from '@/projects/components/Util/TableLoading.vue'
import localeMixin from '@/mixins/localeMixin'
import { buildCompactAccessSummary } from '@/projects/utils/analytics'
import { buildActiveResponseRuleBadges, countInputQuestions, isFormOpenForSubmission, isUserAllowedByIndividualAccess, normalizeAllowedEmails } from '@/projects/utils/formPolicy'

export default {
    name: 'UserTables',
    components: { Pagination, FilterTable, EmptyState, TableLoading },
    mixins: [localeMixin],
    props: {
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            searchQuery: '',
            selectedStatus: 'All',
            startDate: '',
            endDate: '',
            activePage: 1,
            itemsPerPage: 5
        }
    },
    async created() {
        this.$store.dispatch('User/getAll');
        this.$store.dispatch('Organizations/getAll');
        if (this.user && this.user._id) {
            this.$store.dispatch('Responses/get', { responder: this.user._id });
        }
    },
    computed: {
        fields() {
            return [
                { key: 'form', label: this.$t('table.questionnaire'), _style: 'width:33%' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:17%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:16%' },
                { key: 'createdBy', label: this.$t('table.createdBy'), _style: 'width:18%' },
                { key: 'action', label: this.$t('table.action'), _style: 'width:16%; text-align:right' }
            ]
        },
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user', 'users']),
        ...mapGetters('Organizations', ['organizations']),
        ...mapGetters('Responses', { allResponses: 'responses' }),

        totalPages() {
            return Math.max(1, Math.ceil(this.tableData.length / this.itemsPerPage))
        },
        startItem() {
            if (this.tableData.length === 0) return 0;
            return (this.activePage - 1) * this.itemsPerPage + 1;
        },
        endItem() {
            return Math.min(this.activePage * this.itemsPerPage, this.tableData.length);
        },
        totalItems() {
            return this.tableData.length;
        },

        baseTableData() {
            // Touch users so creator role/email re-evaluates once User/getAll resolves
            const _reactiveUsers = this.users;
            if (!this.forms || this.forms.length === 0) return [];



            const currentUser = this.user;

            // Determine if current user is Admin
            let isAdmin = false;
            if (currentUser && currentUser.role) {
                const role = currentUser.role;
                if (Array.isArray(role.title)) {
                    isAdmin = role.title.some(t => t && t.value && t.value.toLowerCase().includes('admin'));
                } else if (typeof role.title === 'string') {
                    isAdmin = role.title.toLowerCase().includes('admin');
                }
            }

            const mapped = this.forms.map(f => {
                if (!f) f = {};
                const missingFields = [];

                let title = this.getLang(f.title) || this.$t('common.untitled');
                let description = this.getLang(f.description) || '-';

                // Organization
                let organization = '-';
                if (f.organization) {
                    if (typeof f.organization === 'string' && f.organization.trim()) organization = f.organization;
                    else if (typeof f.organization === 'object') organization = f.organization.name || f.organization.title || '-';
                } else {
                    missingFields.push('organization');
                }

                // Created By (name and email resolved from creator or users lookup)
                const { createdName, createdEmail, createdOrg } = this.resolveCreatorInfo(f.creator || f.createdBy);
                if (!f.creator && !f.createdBy) {
                    missingFields.push('createdBy');
                }

                let timeRange = '-';
                let daysLeft = '';
                let daysLeftCount = null;
                if (f.schedule && (f.schedule.startAt || f.schedule.endAt)) {
                    const locale = this.$i18n.locale === 'th' ? 'th-TH' : 'en-US';
                    const startAt = f.schedule.startAt ? new Date(f.schedule.startAt).toLocaleDateString(locale) : '';
                    const endAt = f.schedule.endAt ? new Date(f.schedule.endAt).toLocaleDateString(locale) : '';
                    timeRange = startAt || endAt ? `${startAt}${endAt ? ' - ' + endAt : ''}` : '-';
                    if (f.schedule.endAt) {
                        const diff = Math.ceil((new Date(f.schedule.endAt) - new Date()) / (1000 * 60 * 60 * 24));
                        daysLeftCount = diff;
                        daysLeft = diff > 0 ? this.$t('table.daysLeft', { count: diff }) : this.$t('table.closed');
                    } else if (f.schedule.startAt) {
                        daysLeft = this.$t('table.openForever');
                    }
                } else if (f.timeRange && typeof f.timeRange === 'string' && f.timeRange.trim()) {
                    timeRange = f.timeRange;
                } else {
                    missingFields.push('timeRange');
                }
                const isClosingSoon = daysLeftCount !== null && daysLeftCount > 0 && daysLeftCount <= 7;

                let totalQuestions = null;
                if (Array.isArray(f.questions)) {
                    totalQuestions = countInputQuestions(f.questions);
                }
                else if (typeof f.questions === 'number') totalQuestions = f.questions;
                else if (Array.isArray(f.questionIds)) totalQuestions = f.questionIds.length;

                const userObj = currentUser || {};
                const currentUserId = (userObj._id || userObj.id || '').toString();

                // Deduplicate user.response and store responses by _id, scoped strictly to currentUserId
                const combinedMap = new Map();
                [...(userObj.response || []), ...(this.allResponses || []), ...(this.responses || [])].forEach(r => {
                    if (!r || !r._id) return;
                    const rResponder = r.responder;
                    const responderId = rResponder ? (typeof rResponder === 'object' ? (rResponder._id || rResponder.id) : rResponder).toString() : '';
                    if (currentUserId && responderId && responderId !== currentUserId) return;
                    combinedMap.set(String(r._id), r);
                });
                const allRelevantResponses = Array.from(combinedMap.values());

                let status = 'Pending';
                let progress = 0;
                let userAnswerCount = 0;

                // Match responses by form ID
                const matchedResponses = allRelevantResponses.filter(r => {
                    if (!r) return false;

                    // Handle both populated objects and ID strings
                    const rForm = r.form;
                    if (!rForm) return false;

                    const resFormId = (typeof rForm === 'object' ? (rForm._id || rForm.id) : rForm).toString();
                    return resFormId === f._id.toString();
                });

                let userResponse = null;
                if (matchedResponses.length > 0) {
                    // Sort to get the most recent response
                    matchedResponses.sort((a, b) => {
                        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                        return dateB - dateA;
                    });
                    userResponse = matchedResponses[0];
                }

                if (userResponse) {
                    // 1. Determine total questions from the form linked in the response
                    const nestedForm = userResponse.form || {};
                    if (Array.isArray(nestedForm.questions)) {
                        totalQuestions = countInputQuestions(nestedForm.questions);
                    } else if (Array.isArray(nestedForm.questionIds)) {
                        totalQuestions = nestedForm.questionIds.length;
                    }

                    // 2. Count valid answers (where response is not null/empty/placeholder)
                    if (Array.isArray(userResponse.answers)) {
                        userAnswerCount = userResponse.answers.filter(a => {
                            if (!a || a.response === null || a.response === undefined) return false;
                            
                            // Check for empty strings, null strings, or empty arrays (stringified or not)
                            const val = a.response;
                            if (typeof val === 'string') {
                                const s = val.trim();
                                return s !== '' && s !== 'null' && s !== 'undefined' && s !== '[]' && s !== '[""]';
                            }
                            if (Array.isArray(val)) {
                                return val.length > 0 && val.some(v => v !== '' && v !== null);
                            }
                            return true;
                        }).length;
                    }

                    if (totalQuestions > 0) {
                        progress = Math.min(100, Math.round((userAnswerCount / totalQuestions) * 100));
                    }

                    const isSubmitted = userResponse.submit === true ||
                        userResponse.submit === 1 ||
                        String(userResponse.submit).toLowerCase() === 'true';

                    if (isSubmitted) {
                        status = 'Completed';
                        progress = 100;
                    } else {
                        status = 'In Progress';
                    }
                }

                const submissionCount = matchedResponses.filter(r =>
                    r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true'
                ).length;

                const rawOrgs = f.organization || [];
                let access = [];

                const orgNames = Array.from(new Set(
                    (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs])
                        .map(o => this.getOrganizationLabel(o))
                        .filter(Boolean)
                ));

                const explicitMode = f.settings && f.settings.accessMode;
                const explicitPublic = explicitMode === 'public';
                const isPublicForm = explicitPublic || (explicitMode !== 'private' && orgNames.some(name => name === 'General' || name === 'ทั่วไป'));
                const allowedEmailList = normalizeAllowedEmails(f.settings && f.settings.allowedEmails);
                const hasAllowedUsers = Boolean(f.settings && Array.isArray(f.settings.allowedUser) && f.settings.allowedUser.length > 0);
                const hasPersonalAccess = !isPublicForm && (hasAllowedUsers || allowedEmailList.length > 0);
                const hasRoleAccess = !isPublicForm && Boolean(f.settings && Array.isArray(f.settings.allowedRoles) && f.settings.allowedRoles.length > 0);

                if (isPublicForm) {
                    access = ['Public'];
                } else if (orgNames.length > 0) {
                    access = [...orgNames];
                } else if (!hasPersonalAccess && !hasRoleAccess) {
                    access = ['Private'];
                }

                const seenPersonalEmails = new Set();
                if (hasPersonalAccess && hasAllowedUsers) {
                    f.settings.allowedUser.forEach(u => {
                        const matched = (typeof u === 'object' && u)
                            ? u
                            : (this.users || []).find(x => x && String(x._id) === String(u));
                        const em = matched && typeof matched.email === 'string' ? matched.email.trim().toLowerCase() : '';
                        if (em) seenPersonalEmails.add(em);
                        access.push('Personal: ' + this.getUserName(u));
                    });
                }
                if (hasPersonalAccess && allowedEmailList.length > 0) {
                    allowedEmailList.forEach(email => {
                        if (!seenPersonalEmails.has(email)) {
                            seenPersonalEmails.add(email);
                            access.push('Personal: ' + email);
                        }
                    });
                }

                if (hasRoleAccess) {
                    f.settings.allowedRoles.forEach(r => {
                        const roleLabel = this.getOrganizationLabel(r) || (typeof r === 'object' ? (r.name || 'Role') : String(r));
                        access.push('Role: ' + roleLabel);
                    });
                }

                const accessSummary = this.buildAccessSummary(access);
                const createdAt = f.updatedAt || f.createdAt || '-';
                const sched = f.schedule || {};
                const startAtParsed = sched.startAt ? new Date(sched.startAt).getTime() : NaN;
                const endAtParsed = sched.endAt ? new Date(sched.endAt).getTime() : NaN;
                const updatedParsed = new Date(f.updatedAt || f.createdAt || 0).getTime();
                const startAtMs = Number.isFinite(startAtParsed) ? startAtParsed : null;
                const endAtMs = Number.isFinite(endAtParsed) ? endAtParsed : null;
                const updatedAtMs = Number.isFinite(updatedParsed) ? updatedParsed : 0;

                // Access Control Logic
                const userOrgId = currentUser?.organization?._id || currentUser?.organization;
                const formOrgIds = (Array.isArray(f.organization) ? f.organization : [f.organization])
                    .filter(Boolean)
                    .map(o => (o?._id || o)?.toString());
                const isPublic = isPublicForm;
                const isMember = userOrgId && formOrgIds.includes(userOrgId.toString());
                const isAllowedIndividual = hasPersonalAccess
                    ? isUserAllowedByIndividualAccess(f.settings, currentUser?._id, currentUser?.email)
                    : false;

                const userRoleId = currentUser?.role?._id || currentUser?.role;
                const formAllowedRoles = (!isPublic && f.settings && Array.isArray(f.settings.allowedRoles)) ? f.settings.allowedRoles : [];
                const hasRoleRestriction = formAllowedRoles.length > 0;
                const isAllowedRole = !hasRoleRestriction || formAllowedRoles.some(r => {
                    const rId = String(typeof r === 'object' ? (r._id || r.value) : r);
                    return userRoleId && rId === String(userRoleId);
                });

                // User is a target respondent if individually invited OR matches organization and bound role (Audience Union)
                const canEnter = isPublic || isAllowedIndividual || Boolean(isMember && isAllowedRole);
                const limitResponse = Boolean(f.settings?.limitResponse);
                const allowEditAfterSubmit = Boolean(f.settings?.allowEditAfterSubmit);
                const activeResponseRules = buildActiveResponseRuleBadges(f.settings || {}, (k, p) => this.$t(k, p));
                const cta = this.buildActionCta({ canEnter, status, limitResponse, allowEditAfterSubmit });

                return {
                    _id: f._id,
                    form: title || '-',
                    title: title || '-',
                    description: description || '-',
                    status: status || '-',
                    timeRange: timeRange || '-',
                    daysLeft: daysLeft || '',
                    isClosingSoon,
                    progress: (typeof progress === 'number') ? progress : 0,
                    totalQuestions,
                    userAnswerCount,
                    organization: organization || '-',
                    createdAt,
                    startAtMs,
                    endAtMs,
                    updatedAtMs,
                    createdBy: createdName || createdEmail || '-',
                    createdName: createdName || '-',
                    createdEmail: createdEmail || '',
                    createdOrg: createdOrg || '',
                    access: access,
                    accessSummary,
                    activeResponseRules,
                    cta,
                    canEnter: canEnter,
                    limitResponse,
                    allowEditAfterSubmit,
                    submissionCount: submissionCount,
                    _raw: f
                };
            });

            const withAccess = mapped.filter(f => {
                // 1. Personal access check
                if (!f.canEnter) return false;

                // 2. Only expose published forms currently open for submission
                const sched = (f._raw && f._raw.schedule) ? f._raw.schedule : {};
                return isFormOpenForSubmission(sched);
            });

            return withAccess;
        },
        tableData() {
            let filtered = this.baseTableData;
            if ((this.startDate && this.startDate.trim() !== '') || (this.endDate && this.endDate.trim() !== '')) {
                const filterStart = this.startDate ? new Date(`${this.startDate}T00:00:00`) : new Date(-8640000000000000);
                const filterEnd = this.endDate ? new Date(`${this.endDate}T23:59:59`) : new Date(8640000000000000);

                filtered = filtered.filter(row => {
                    const raw = row._raw || {};
                    const sched = raw.schedule || {};

                    const s = sched.startAt ? new Date(sched.startAt) : null;
                    const e = sched.endAt ? new Date(sched.endAt) : null;

                    if (!s && !e) return false;

                    const formStart = s || new Date(-8640000000000000);
                    const formEnd = e || new Date(8640000000000000);

                    return (formStart <= filterEnd) && (formEnd >= filterStart);
                });
            }
            if (this.selectedStatus && this.selectedStatus !== 'All') {
                const selected = String(this.selectedStatus).toLowerCase().replace(/\s/g, '');
                filtered = filtered.filter(f => String(f.status || '').toLowerCase().replace(/\s/g, '') === selected);
            }

            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(f => {
                    return f.title && f.title.toString().toLowerCase().includes(q);
                });
            }

            return [...filtered].sort((a, b) => this.compareDefaultOrder(a, b));
        },
        stats() {
            const data = this.baseTableData || [];

            let total = data.length;
            let pending = data.filter(f => f.status === 'Pending').length;
            let completed = data.filter(f => f.status === 'Completed').length;
            let inProgress = data.filter(f => String(f.status || '').toLowerCase().replace(/\s/g, '') === 'inprogress').length;

            return { total, pending, completed, inProgress };
        }
    },
    watch: {
        stats: {
            immediate: true,
            handler(newVal) {
                this.$emit('update-stats', newVal);
            }
        },
        itemsPerPage() {
            this.activePage = 1;
        },
        searchQuery() {
            this.activePage = 1;
        },
        selectedStatus() {
            this.activePage = 1;
        },
        startDate() {
            this.activePage = 1;
        },
        endDate() {
            this.activePage = 1;
        }
    },
    methods: {
        getStatusPriority(status) {
            const s = String(status || '').toLowerCase().replace(/\s/g, '');
            if (s === 'inprogress') return 0;
            if (s === 'pending') return 1;
            if (s === 'completed') return 2;
            return 3;
        },
        compareDefaultOrder(a, b) {
            const aDone = this.getStatusPriority(a.status) >= 2 ? 1 : 0;
            const bDone = this.getStatusPriority(b.status) >= 2 ? 1 : 0;
            if (aDone !== bDone) return aDone - bDone;

            const aEnd = a.endAtMs !== null && a.endAtMs !== undefined ? a.endAtMs : Number.MAX_SAFE_INTEGER;
            const bEnd = b.endAtMs !== null && b.endAtMs !== undefined ? b.endAtMs : Number.MAX_SAFE_INTEGER;
            if (aEnd !== bEnd) return aEnd - bEnd;

            const statusDiff = this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
            if (statusDiff !== 0) return statusDiff;

            const aRefTime = a.updatedAtMs || a.startAtMs || 0;
            const bRefTime = b.updatedAtMs || b.startAtMs || 0;
            if (aRefTime !== bRefTime) return bRefTime - aRefTime;

            const locale = this.$i18n && this.$i18n.locale === 'th' ? 'th' : 'en';
            return String(a.title || '').localeCompare(String(b.title || ''), locale, { sensitivity: 'base' });
        },
        goToFormRecord(item) {
            if (!item || (item.cta && item.cta.disabled)) return;
            this.goToForm(item._id, Boolean(item.cta && item.cta.isNew));
        },
        async goToForm(id, isNew = false) {
            if (!id) return;
            const query = { source: 'internal' };
            if (isNew) query.new = 'true';
            this.$router.push({ name: 'FormFill', params: { id: id }, query: query });
        },
        filterStatus(status) {
            this.selectedStatus = status;
            this.activePage = 1;
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase().replace(/\s/g, '') : '';
            if (s === 'completed') return 'status-completed';
            if (s === 'inprogress') return 'status-inprogress';
            return 'status-pending';
        },
        getVisibilityClass(visibility) {
            if (!visibility) return 'visi-default';
            const v = String(visibility).toLowerCase();
            if (v.includes('public') || v.includes('สาธารณะ') || v === 'general') return 'visi-public';
            if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
            if (v.includes('personal')) return 'visi-personal';
            return 'visi-org';
        },
        isPublic(visibility) {
            if (!visibility) return false;
            const v = String(visibility).toLowerCase();
            return v.includes('public') || v.includes('สาธารณะ') || v === 'general';
        },
        orgAccessOnly(access) {
            if (!Array.isArray(access)) return [];
            return access.filter(acc => !acc.startsWith('Personal: '));
        },
        personalAccessOnly(access) {
            if (!Array.isArray(access)) return [];
            return access.filter(acc => acc.startsWith('Personal: '));
        },
        formatAccessLabel(v) {
            if (!v) return '';
            return v.startsWith('Personal: ') ? v.replace('Personal: ', '') : (this.$te('accessLabel.' + v.toLowerCase()) ? this.$t('accessLabel.' + v.toLowerCase()) : v);
        },
        buildAccessSummary(access) {
            return buildCompactAccessSummary(access, {
                formatLabel: (val) => this.formatAccessLabel(val),
                orgUnit: this.$t('table.orgUnit') || 'Orgs',
                userUnit: this.$t('table.userUnit') || 'Users',
                roleUnit: this.$t('table.roleUnit') || 'Roles'
            });
        },
        buildActionCta({ canEnter, status, limitResponse, allowEditAfterSubmit }) {
            if (!canEnter) {
                return {
                    label: this.$t('table.cta.restricted'),
                    icon: 'cil-lock-locked',
                    btnClass: 'cta-disabled',
                    disabled: true,
                    isNew: false,
                    tooltip: this.$t('form.accessDenied')
                };
            }
            const s = String(status || '').toLowerCase().replace(/\s/g, '');
            if (s === 'completed') {
                if (limitResponse) {
                    if (allowEditAfterSubmit) {
                        return {
                            label: this.$t('table.cta.editAnswer'),
                            icon: 'cil-pencil',
                            btnClass: 'cta-edit',
                            disabled: false,
                            isNew: false,
                            tooltip: this.$t('table.cta.editAnswer')
                        };
                    }
                    return {
                        label: this.$t('table.cta.submitted'),
                        icon: 'cil-check-circle',
                        btnClass: 'cta-done',
                        disabled: true,
                        isNew: false,
                        tooltip: this.$t('table.cta.submitted')
                    };
                }
                return {
                    label: this.$t('table.cta.submitAgain'),
                    icon: 'cil-reload',
                    btnClass: 'cta-again',
                    disabled: false,
                    isNew: true,
                    tooltip: this.$t('table.submitAgain')
                };
            }
            if (s === 'inprogress') {
                return {
                    label: this.$t('table.cta.continue'),
                    icon: 'cil-pencil',
                    btnClass: 'cta-continue',
                    disabled: false,
                    isNew: false,
                    tooltip: this.$t('table.continueForm')
                };
            }
            return {
                label: this.$t('table.cta.start'),
                icon: 'cil-arrow-right',
                btnClass: 'cta-start',
                disabled: false,
                isNew: false,
                tooltip: this.$t('table.startForm')
            };
        },
        getProgressColor(progress) {
            if (progress >= 100) return 'success';
            if (progress >= 40) return 'info';
            if (progress > 0) return 'warning';
            return 'secondary';
        },
        resolveCreatorInfo(creatorRef) {
            if (!creatorRef) {
                return { createdName: '-', createdEmail: '' };
            }
            const userList = Array.isArray(this.users) ? this.users : [];
            if (typeof creatorRef === 'string') {
                const trimmed = creatorRef.trim();
                if (!trimmed) return { createdName: '-', createdEmail: '' };
                const matched = userList.find(u =>
                    u && (String(u._id) === trimmed || (u.email && u.email === trimmed) || (u.name && u.name === trimmed))
                );
                if (matched) {
                    return {
                        createdName: matched.name || matched.fullname || matched.email || trimmed,
                        createdEmail: matched.email || '',
                        createdOrg: this.getOrganizationLabel(matched.organization) || ''
                    };
                }
                const display = /^[0-9a-f]{24}$/i.test(trimmed) ? '-' : trimmed;
                return { createdName: display, createdEmail: '' };
            }
            if (typeof creatorRef === 'object') {
                const creatorId = creatorRef._id ? String(creatorRef._id) : '';
                const matched = userList.find(u =>
                    u && ((creatorId && String(u._id) === creatorId) || (creatorRef.email && u.email === creatorRef.email))
                );
                return {
                    createdName: creatorRef.name || creatorRef.fullname || (matched && (matched.name || matched.email)) || creatorRef.email || '-',
                    createdEmail: creatorRef.email || (matched && matched.email) || '',
                    createdOrg: this.getOrganizationLabel(creatorRef.organization || (matched && matched.organization)) || ''
                };
            }
            return { createdName: '-', createdEmail: '' };
        },
        getUserName(userRef) {
            if (!userRef) return 'Unknown';
            if (typeof userRef === 'object' && userRef.email) return userRef.name || userRef.email;
            if (!this.users) return userRef;
            const u = this.users.find(x => String(x._id) === String(userRef));
            return u ? (u.name || u.email) : userRef;
        },
        getOrganizationLabel(orgRef) {
            if (!orgRef) return null;

            if (typeof orgRef === 'object') {
                if (Array.isArray(orgRef.title)) {
                    return this.getLang(orgRef.title) || null;
                }
                return orgRef.name || orgRef.value || this.getLang(orgRef.title) || (orgRef._id ? String(orgRef._id) : null);
            }

            const orgId = String(orgRef);
            const found = Array.isArray(this.organizations)
                ? this.organizations.find(o => String(o._id) === orgId || String(o.id) === orgId)
                : null;

            if (found) {
                if (Array.isArray(found.title)) {
                    return this.getLang(found.title) || null;
                }
                return found.name || found.value || this.getLang(found.title) || orgId;
            }

            return orgId;
        }
    }
}
</script>

<style scoped>
.tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    padding: 0;
    overflow: hidden;
}

.tables-container.table-empty tbody tr,
.tables-container.table-empty tbody tr:hover,
.tables-container.table-empty tbody td {
    background: transparent !important;
    background-color: transparent !important;
    cursor: default !important;
    pointer-events: none !important;
    user-select: none !important;
}

.tables-container.table-empty thead th {
    cursor: default !important;
    pointer-events: none !important;
    user-select: none !important;
}

.custom-per-page-select {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px !important;
    padding: 4px 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
}

.custom-per-page-select:focus,
.custom-per-page-select:hover {
    border-color: #8c1515;
    box-shadow: 0 0 0 2px rgba(140, 21, 21, 0.1);
}

.empty-state-box {
    padding: 3.5rem 1.5rem;
}

.empty-state-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: #f1f5f9;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-lg {
    font-size: 0.95rem;
}

.text-muted {
    color: #64748b !important;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
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

.status-completed {
    background-color: #d1fae5;
    color: #065f46;
}

.status-completed .status-dot {
    background-color: #059669;
}

.status-pending {
    background-color: #fef9c3;
    color: #854d0e;
}

.status-pending .status-dot {
    background-color: #eab308;
}

.status-inprogress {
    background-color: #e0f2fe;
    color: #0369a1;
}

.status-inprogress .status-dot {
    background-color: #0284c7;
}

.plus-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: white;
    background-color: #ecfdf5;
    border: 1.5px solid #10b981;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.plus-btn:hover .plus-circle {
    border-color: #3C4B64;
    color: #3C4B64;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

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
    background-color: #8c1515 !important;
    /* Red primary brand color */
    color: white !important;
}

.search-input-group {
    background-color: #f8fafc;
    border-radius: 6px;
    overflow: hidden;
}

.search-input-group .input-group-text {
    background-color: #f8fafc !important;
}

.search-input-group input {
    background-color: #f8fafc;
}

.action-icon-btn {
    width: 38px;
    height: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.action-icon-btn:hover {
    background-color: #f1f5f9;
    color: #3c4b64;
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

.visibility-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 1.1rem;
    border-radius: 100px;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.2s ease;
    border: none;
}

.visi-public {
    background-color: #ecfdf5;
    color: #065f46;
}

.visi-private {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fee2e2;
}

.visi-org {
    background-color: #eff6ff;
    color: #1e40af;
}

.visi-personal {
    background-color: #f5f3ff;
    color: #5b21b6;
}

.visi-default {
    background-color: #f1f5f9;
    color: #475569;
}

/* Style the actual dropdown container from CoreUI */
.custom-dropdown ::v-deep .dropdown-menu {
    background: white !important;
    border-radius: 12px !important;
    padding: 0 !important;
    margin-top: 8px !important;
    z-index: 2000 !important;
    border: 1px solid #edf2f7 !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
    max-height: 250px;
    overflow-y: auto;
    min-width: 220px;
}

.custom-dropdown ::v-deep .dropdown-item {
    padding: 0 !important;
}

.custom-dropdown ::v-deep .dropdown-toggle {
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    display: flex !important;
    align-items: center !important;
    outline: none !important;
}

.custom-dropdown ::v-deep .dropdown-toggle::after {
    display: none !important;
}

.dropdown-item-custom {
    transition: background-color 0.2s ease;
    cursor: pointer;
    background: transparent;
    border: none;
    text-align: left;
}

.dropdown-item-custom:hover {
    background-color: #f8fafc;
}

.last-border-0:last-child {
    border-bottom: 0 !important;
}

.cursor-pointer {
    cursor: pointer;
}

.form-row-title {
    font-size: 0.95rem;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.form-row-desc {
    line-height: 1.4;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@media (min-width: 992px) {
    .form-row-title,
    .form-row-desc {
        max-width: 300px;
    }
}

.respondent-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.meta-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
}

.creator-cell {
    max-width: 100%;
    min-width: 0;
}

.creator-name {
    line-height: 1.3;
}

.creator-email {
    font-size: 0.8125rem;
    line-height: 1.25;
}

.response-icons-row {
    gap: 6px;
}

.setting-icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    cursor: default;
    transition: transform 0.15s ease, filter 0.15s ease;
}

.setting-icon-badge:hover {
    transform: translateY(-1px);
    filter: brightness(0.95);
}

.setting-icon-login {
    background-color: #eef2ff;
    color: #4338ca;
}

.setting-icon-limit {
    background-color: #ecfdf5;
    color: #047857;
}

.setting-icon-edit {
    background-color: #fffbeb;
    color: #b45309;
}

.setting-icon-quota {
    background-color: #f3e8ff;
    color: #6b21a8;
}

.setting-icon-email {
    background-color: #eff6ff;
    color: #1d4ed8;
}

.setting-icon-notify {
    background-color: #fef2f2;
    color: #b91c1c;
}

.meta-closing {
    background-color: #fef3c7;
    color: #b45309;
}

.text-truncate-pill {
    max-width: 220px;
    overflow: hidden;
}

.visi-role {
    background-color: #f3e8ff;
    color: #6b21a8;
}

.text-role-accent {
    color: #7e22ce !important;
}

.dropdown-section-header {
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
    background-color: #f8fafc;
    position: sticky;
    top: 0;
    z-index: 1;
}

.dropdown-caret {
    width: 12px !important;
    height: 12px !important;
    opacity: 0.7;
}

.progress-cell-wrap {
    min-width: 96px;
}

.respondent-cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 34px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 9px;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease, filter 0.15s ease, background-color 0.15s ease;
}

.respondent-cta-btn .cta-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
}

.respondent-cta-btn.cta-start {
    background-color: #8c1515;
    color: #ffffff;
}

.respondent-cta-btn.cta-start:hover {
    background-color: #701010;
    transform: translateY(-1px);
}

.respondent-cta-btn.cta-continue {
    background-color: #e0f2fe;
    color: #0369a1;
}

.respondent-cta-btn.cta-continue:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
}

.respondent-cta-btn.cta-edit {
    background-color: #eef2ff;
    color: #4338ca;
}

.respondent-cta-btn.cta-edit:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
}

.respondent-cta-btn.cta-again {
    background-color: #f0fdfa;
    color: #0f766e;
}

.respondent-cta-btn.cta-again:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
}

.respondent-cta-btn.cta-done {
    background-color: #ecfdf5;
    color: #047857;
    cursor: default;
}

.respondent-cta-btn.cta-disabled {
    background-color: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
}

@media (min-width: 992px) {
    .tables-container ::v-deep table {
        table-layout: auto;
        width: 100%;
        margin-bottom: 0;
    }

    .tables-container ::v-deep thead th {
        vertical-align: middle;
        white-space: nowrap;
    }

    .tables-container ::v-deep thead th:last-child {
        padding-right: 1rem !important;
    }

    .tables-container ::v-deep .form-row-title,
    .tables-container ::v-deep .form-row-desc {
        overflow-wrap: anywhere;
        word-break: break-word;
    }
}

@media (max-width: 991.98px) {
    .respondent-cta-btn {
        height: 44px;
        min-height: 44px;
        min-width: 44px;
        padding: 0 16px;
    }

    .progress-cell-wrap {
        width: 100%;
    }
}
</style>
```