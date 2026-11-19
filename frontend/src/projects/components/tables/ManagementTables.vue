<template>
    <div>
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate"
            :endDate.sync="endDate" :managementMode="true" />

        <!-- Table -->
        <CDataTable class="user-tables-container mb-0 mobile-card-table" :class="{ 'table-empty': !loading && tableData.length === 0 }" :items="loading ? [] : tableData" :fields="fields"
            :items-per-page="itemsPerPage" :pagination="false" :loading="loading" :hover="!loading && tableData.length > 0" :activePage.sync="activePage">

            <!-- Loading State Slot -->
            <template #loading>
                <TableLoading borderless />
            </template>

            <!-- Empty State Slot -->
            <template #no-items-view>
                <EmptyState
                    borderless
                    icon="cil-folder-open"
                    :title="$t('table.noItems') || 'ยังไม่มีรายการแบบสอบถามในขณะนี้'"
                    :description="($te && $te('table.noItemsDesc')) ? $t('table.noItemsDesc') : 'สามารถเริ่มต้นสร้างแบบสอบถามใหม่ได้จากปุ่ม \'+ สร้าง\' ด้านบน'"
                />
            </template>

            <!-- Questionnaire (Title & Description) -->
            <template #title="{ item }">
                <td class="align-middle mgmt-title-cell">
                    <div v-if="!item.isEmpty" class="mgmt-title-box">
                        <div class="font-weight-bold text-dark mgmt-form-title line-clamp-2" :title="item.title">{{ item.title }}</div>
                        <div class="small text-muted mt-1 mgmt-form-desc line-clamp-2" v-if="item.description && item.description !== '-'" :title="item.description">{{ item.description }}</div>
                    </div>
                </td>
            </template>

            <!-- Created By (Organization + Name) -->
            <template #createBy="{ item }">
                <td class="align-middle mgmt-creator-cell">
                    <div class="mgmt-creator-box" :title="[item.createdOrg, item.createdName].filter(v => v && v !== '-').join(' · ')">
                        <div class="small text-dark font-weight-bold mgmt-creator-name" :title="item.createdOrg || item.createdName || '-'">{{ item.createdOrg || item.createdName || '-' }}</div>
                        <div class="small text-muted mt-1 mgmt-creator-email" v-if="item.createdOrg && item.createdName && item.createdName !== '-'" :title="item.createdName">{{ item.createdName }}</div>
                    </div>
                </td>
            </template>

            <!-- Collaborators (Single-row grouped summary + dropdown) -->
            <template #collaborators="{ item }">
                <td class="align-middle">
                    <div v-if="!item.isEmpty" class="d-flex align-items-center">
                        <template v-if="item.collaborators && item.collaborators.length === 1">
                            <div class="collaborator-badge text-truncate-pill" :class="getRoleClass(item.collaborators[0].roleKey || item.collaborators[0].role)" :title="`${item.collaborators[0].name} (${item.collaborators[0].role})`">
                                <CIcon name="cil-user" size="sm" class="mr-2 flex-shrink-0" />
                                <span class="text-truncate">{{ item.collaborators[0].name }} ({{ item.collaborators[0].role }})</span>
                            </div>
                        </template>

                        <CDropdown
                            v-else-if="item.collaborators && item.collaborators.length > 1"
                            variant="ghost"
                            size="sm"
                            class="m-0 p-0 custom-dropdown"
                            placement="bottom-start"
                            :customPopperOptions="{ placement: 'bottom-start', strategy: 'fixed', modifiers: [{ name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } }] }"
                            @click.native.stop
                        >
                            <template #toggler-content>
                                <div class="collaborator-badge collab-summary cursor-pointer shadow-sm" :title="item.collaboratorSummary.tooltip">
                                    <CIcon name="cil-people" size="sm" class="mr-2 flex-shrink-0" />
                                    <span class="d-inline-flex align-items-center">
                                        <span v-if="item.collaboratorSummary.editors > 0 && item.collaboratorSummary.viewers > 0">
                                            <span class="text-success-dark">{{ item.collaboratorSummary.editors }}E</span>
                                            <span class="mx-1 text-muted">·</span>
                                            <span class="text-slate-dark">{{ item.collaboratorSummary.viewers }}V</span>
                                        </span>
                                        <span v-else>{{ item.collaboratorSummary.label }}</span>
                                    </span>
                                    <CIcon name="cil-chevron-bottom" size="sm" class="ml-2 dropdown-caret" />
                                </div>
                            </template>
                            <div class="dropdown-menu-scrollable" @click.stop>
                                <div class="dropdown-section-header px-3 py-2 border-bottom">
                                    {{ $t('table.collaborators') }} ({{ item.collaborators.length }})
                                </div>
                                <CDropdownItem v-for="(person, idx) in item.collaborators" :key="'collab-' + idx" class="p-0 border-bottom last-border-0">
                                    <div class="dropdown-item-custom px-3 py-2 d-flex align-items-center justify-content-between w-100" style="min-width: 240px;">
                                        <div class="d-flex align-items-center min-width-0 mr-2">
                                            <div class="avatar-sm mr-2 text-uppercase" :class="getRoleIconClass(person.roleKey || person.role)">
                                                {{ person.name ? person.name.charAt(0) : 'U' }}
                                            </div>
                                            <span class="small font-weight-bold text-dark text-truncate">{{ person.name }}</span>
                                        </div>
                                        <span class="role-mini-pill flex-shrink-0" :class="getRoleClass(person.roleKey || person.role)">{{ person.role }}</span>
                                    </div>
                                </CDropdownItem>
                            </div>
                        </CDropdown>

                        <span v-else class="small text-muted">-</span>
                    </div>
                </td>
            </template>

            <!-- Time Range -->
            <template #timeRange="{ item }">
                <td class="align-middle">
                    <div class="small text-dark font-weight-bold">{{ item.timeRange || '-' }}</div>
                    <div class="small text-muted mt-1">{{ item.daysLeft || '' }}</div>
                </td>
            </template>

            <!-- Status Label -->
            <template #status="{ item }">
                <td class="align-middle">
                    <span v-if="!item.isEmpty" class="status-badge" :class="getStatusClass(item.status)">
                        <span class="status-dot"></span>
                        {{ $t('status.' + item.status.toLowerCase().replace(/\s/g, '')) }}
                    </span>
                </td>
            </template>

            <!-- Access (Unified 1-pill + partitioned dropdown) -->
            <template #access="{ item }">
                <td class="align-middle">
                    <div v-if="!item.isEmpty && item.accessSummary" class="d-flex align-items-center">
                        <div
                            v-if="!item.accessSummary.hasDropdown"
                            class="visibility-badge text-truncate-pill"
                            :class="item.accessSummary.badgeClass"
                            :title="item.accessSummary.label"
                        >
                            <CIcon :name="item.accessSummary.icon" size="sm" class="mr-2 flex-shrink-0" />
                            <span class="text-truncate">{{ item.accessSummary.label }}</span>
                        </div>

                        <CDropdown
                            v-else
                            variant="ghost"
                            size="sm"
                            class="m-0 p-0 custom-dropdown"
                            placement="bottom-start"
                            :customPopperOptions="{ placement: 'bottom-start', strategy: 'fixed', modifiers: [{ name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } }] }"
                            @click.native.stop
                        >
                            <template #toggler-content>
                                <div class="visibility-badge cursor-pointer text-truncate-pill" :class="item.accessSummary.badgeClass" :title="item.accessSummary.tooltip">
                                    <CIcon :name="item.accessSummary.icon" size="sm" class="mr-2 flex-shrink-0" />
                                    <span class="text-truncate">{{ item.accessSummary.label }}</span>
                                    <CIcon name="cil-chevron-bottom" size="sm" class="ml-2 dropdown-caret flex-shrink-0" />
                                </div>
                            </template>
                            <div class="dropdown-menu-scrollable access-grouped-menu" @click.stop>
                                <!-- Organizations Group -->
                                <template v-if="item.accessSummary.orgs.length > 0">
                                    <div class="dropdown-section-header px-3 py-2 border-bottom">
                                        {{ $t('table.accessGroups.orgs') }}
                                    </div>
                                    <CDropdownItem v-for="(acc, i) in item.accessSummary.orgs" :key="'org-' + i" class="p-0 border-bottom">
                                        <div class="dropdown-item-custom px-3 py-2 d-flex align-items-center w-100" style="min-width: 220px;">
                                            <CIcon
                                                :name="(acc === 'Public' || acc === 'Publicly') ? 'cil-globe-alt' : 'cil-bank'"
                                                size="sm"
                                                class="mr-3 flex-shrink-0"
                                                :class="(acc === 'Public' || acc === 'Publicly') ? 'text-success' : 'text-info'"
                                            />
                                            <span class="small font-weight-bold text-dark text-truncate">{{ formatAccessLabel(acc) }}</span>
                                        </div>
                                    </CDropdownItem>
                                </template>

                                <!-- Authorized Users Group -->
                                <template v-if="item.accessSummary.users.length > 0">
                                    <div class="dropdown-section-header px-3 py-2 border-bottom">
                                        {{ $t('table.accessGroups.users') }}
                                    </div>
                                    <CDropdownItem v-for="(userName, i) in item.accessSummary.users" :key="'user-' + i" class="p-0 border-bottom">
                                        <div class="dropdown-item-custom px-3 py-2 d-flex align-items-center w-100" style="min-width: 220px;">
                                            <CIcon name="cil-user" size="sm" class="mr-3 text-primary flex-shrink-0" />
                                            <span class="small font-weight-bold text-dark text-truncate">{{ userName }}</span>
                                        </div>
                                    </CDropdownItem>
                                </template>

                                <!-- Authorized Roles Group -->
                                <template v-if="item.accessSummary.roles.length > 0">
                                    <div class="dropdown-section-header px-3 py-2 border-bottom">
                                        {{ $t('table.accessGroups.roles') }}
                                    </div>
                                    <CDropdownItem v-for="(roleName, i) in item.accessSummary.roles" :key="'role-' + i" class="p-0 border-bottom last-border-0">
                                        <div class="dropdown-item-custom px-3 py-2 d-flex align-items-center w-100" style="min-width: 220px;">
                                            <CIcon name="cil-shield-alt" size="sm" class="mr-3 text-role-accent flex-shrink-0" />
                                            <span class="small font-weight-bold text-dark text-truncate">{{ roleName }}</span>
                                        </div>
                                    </CDropdownItem>
                                </template>
                            </div>
                        </CDropdown>
                    </div>
                </td>
            </template>

            <!-- Responses: show two rows (Completed vs Ongoing) -->
            <template #responses="{ item }">
                <td class="align-middle mgmt-responses-cell">
                    <div v-if="!item.isEmpty" class="d-flex flex-column response-stats-stack">
                        <div class="d-flex align-items-center mb-1 response-stat-line">
                            <div class="icon-wrapper mr-2 chart-color response-icon-badge" style="width: 20px; height: 20px;">
                                <CIcon name="cil-check-alt" size="sm" class="text-success" />
                            </div>
                            <span class="response-count font-weight-bold mr-1">{{ item.completedCount }} / {{ item.targetCount }}</span>
                            <small class="text-muted response-stat-label">{{ $t('table.completedResponse') }}</small>
                        </div>
                        <div class="d-flex align-items-center response-stat-line">
                            <div class="icon-wrapper mr-2 response-icon-badge"
                                style="width: 20px; height: 20px; background-color: #f1f5f9;">
                                <CIcon name="cil-history" size="sm" class="text-info" />
                            </div>
                            <span class="response-count font-weight-bold mr-1">{{ item.ongoingCount }}</span>
                            <small class="text-muted response-stat-label">{{ $t('table.ongoingResponse') }}</small>
                        </div>
                    </div>
                </td>
            </template>

            <!-- Response Settings (Compact active rule icons with hover tooltips) -->
            <template #responseSettings="{ item }">
                <td class="align-middle mgmt-settings-cell">
                    <div v-if="!item.isEmpty" class="response-icons-grid" :class="{ 'is-empty-rules': !item.activeResponseRules || item.activeResponseRules.length === 0 }">
                        <template v-if="item.activeResponseRules && item.activeResponseRules.length > 0">
                            <span
                                v-for="rule in item.activeResponseRules"
                                :key="rule.key"
                                class="setting-icon-badge"
                                :class="rule.iconClass"
                                v-c-tooltip="rule.tooltip"
                                :title="rule.tooltip"
                                :aria-label="rule.tooltip"
                            >
                                <CIcon :name="rule.icon" size="sm" />
                            </span>
                        </template>
                        <span v-else class="small text-muted">-</span>
                    </div>
                </td>
            </template>

            <!-- Actions: compact 3-dot kebab menu -->
            <template #actions="{ item }">
                <td class="align-middle text-right pr-3">
                    <div v-if="!item.isEmpty" class="d-inline-flex align-items-center justify-content-end">
                        <CDropdown
                            variant="ghost"
                            size="sm"
                            class="m-0 p-0 custom-dropdown actions-dropdown"
                            placement="bottom-end"
                            addMenuClasses="dropdown-menu-right"
                            :customPopperOptions="{ placement: 'bottom-end', strategy: 'fixed', modifiers: [{ name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } }] }"
                            @click.native.stop
                        >
                            <template #toggler-content>
                                <button
                                    type="button"
                                    class="action-kebab-btn"
                                    :aria-label="$t('table.actions')"
                                    v-c-tooltip="$t('table.actions')"
                                >
                                    <CIcon name="cil-options" />
                                </button>
                            </template>
                            <div class="actions-menu-list" @click.stop>
                                <CDropdownItem class="p-0 border-bottom" @click.stop="goToPreviewForm(item)">
                                    <div class="dropdown-item-custom actions-item-row d-flex align-items-center w-100">
                                        <CIcon name="cil-eye" class="actions-item-icon text-info" />
                                        <span class="actions-item-label text-dark">{{ $t('button.preview') }}</span>
                                    </div>
                                </CDropdownItem>
                                <template v-if="item.canEdit">
                                    <CDropdownItem class="p-0 border-bottom" @click.stop="goToDuplicationForm(item)">
                                        <div class="dropdown-item-custom actions-item-row d-flex align-items-center w-100">
                                            <CIcon name="cil-copy" class="actions-item-icon text-success" />
                                            <span class="actions-item-label text-dark">{{ $t('table.duplicate') }}</span>
                                        </div>
                                    </CDropdownItem>
                                    <CDropdownItem class="p-0 border-bottom" @click.stop="goToEditForm(item)">
                                        <div class="dropdown-item-custom actions-item-row d-flex align-items-center w-100">
                                            <CIcon name="cil-pencil" class="actions-item-icon text-warning" />
                                            <span class="actions-item-label text-dark">{{ $t('button.edit') }}</span>
                                        </div>
                                    </CDropdownItem>
                                    <CDropdownItem class="p-0" @click.stop="confirmDeleteItem(item)">
                                        <div class="dropdown-item-custom actions-item-row d-flex align-items-center w-100">
                                            <CIcon name="cil-trash" class="actions-item-icon text-danger" />
                                            <span class="actions-item-label text-danger">{{ $t('table.delete') }}</span>
                                        </div>
                                    </CDropdownItem>
                                </template>
                            </div>
                        </CDropdown>
                    </div>
                </td>
            </template>

            <template #empty>
                <tr>
                    <td :colspan="fields.length" class="text-center py-5">
                        <div class="h5 mb-2">{{ $t('table.noForms') }}</div>
                        <div class="text-muted">{{ $t('table.createOne') }}</div>
                    </td>
                </tr>
            </template>
        </CDataTable>

        <!-- Table Footer: Rows per page & Pagination -->
        <div v-if="!loading && tableData.length > 0" class="d-flex justify-content-between align-items-center flex-wrap mt-3 px-2">
            <!-- Left: Items Per Page Selector -->
            <div class="d-flex align-items-center text-muted small font-weight-bold my-1">
                <span class="mr-2">{{ $t('table.showing') || 'แสดง' }}</span>
                <select v-model.number="itemsPerPage" class="custom-per-page-select mr-2">
                    <option :value="5">5</option>
                    <option :value="10">10</option>
                    <option :value="15">15</option>
                    <option :value="20">20</option>
                </select>
                <span class="mr-2">{{ $t('table.itemsPerPage') || 'รายการต่อหน้า' }}</span>
                <span class="text-secondary">({{ tableStartItem }} - {{ tableEndItem }} {{ $t('table.of') || 'จาก' }} {{ tableData.length }} {{ $t('table.items') || 'รายการ' }})</span>
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
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'
import FilterTable from '@/projects/components/Filter/FilterTable.vue'
import EmptyState from '@/projects/components/Util/EmptyState.vue'
import TableLoading from '@/projects/components/Util/TableLoading.vue'
import localeMixin from '@/mixins/localeMixin'
import { buildActiveResponseRuleBadges, getScheduleStatus, normalizeAllowedEmails } from '@/projects/utils/formPolicy'
import { buildCompactAccessSummary } from '@/projects/utils/analytics'

export default {
    name: 'ManagementTables',
    components: { Pagination, FilterTable, EmptyState, TableLoading },
    mixins: [localeMixin],
    props: {
        items: {
            type: Array,
            default: () => []
        },
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
            itemsPerPage: 5,
            deleteItem: null,
        }
    },
    async created() {
        this.$store.dispatch('User/getAll');
        this.$store.dispatch('Organizations/getAll');
        this.$store.dispatch(
            'Responses/exp',
            this.user && this.user._id ? { params: { userId: this.user._id } } : undefined
        );
    },
    computed: {
        fields() {
            return [
                { key: 'title', label: this.$t('table.questionnaire'), _style: 'width:20%; min-width:190px' },
                { key: 'access', label: this.$t('table.access'), _style: 'width:11%; white-space:nowrap' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:12%; min-width:110px' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:8%; white-space:nowrap' },
                { key: 'responses', label: this.$t('table.responses'), _style: 'width:13%; min-width:132px; white-space:nowrap' },
                { key: 'createBy', label: this.$t('table.createdBy'), _style: 'width:12%; min-width:140px' },
                { key: 'collaborators', label: this.$t('table.collaborators'), _style: 'width:10%; white-space:nowrap' },
                { key: 'responseSettings', label: this.$t('table.responseSettings'), _style: 'width:9%; min-width:112px; white-space:nowrap' },
                { key: 'actions', label: this.$t('table.actions'), _style: 'width:5%; min-width:68px; white-space:nowrap; text-align:right' }
            ]
        },
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user', 'users']),
        ...mapGetters('Organizations', ['organizations']),
        ...mapGetters('Responses', ['responses']),
        ...mapGetters('dialog', ['isCode']),

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
            // Touch reactive dependencies so tableData recalculates when users or responses arrive
            const _reactiveUsers = this.users;
            const _reactiveResponses = this.responses;

            const raw = Array.isArray(this.items) ? this.items : [];

            const locale = this.$i18n.locale.toLowerCase();
            const currentUserId = this.user ? this.user._id : null;

            // Determine if current user is Admin (still needed for 'canEdit')
            let isAdmin = false;
            if (this.user && this.user.role) {
                const role = this.user.role;
                if (Array.isArray(role.title)) {
                    isAdmin = role.title.some(t => t && t.value && t.value.toLowerCase().includes('admin'));
                } else if (typeof role.title === 'string') {
                    isAdmin = role.title.toLowerCase().includes('admin');
                }
            }

            // Defense in depth: Non-admin users only process forms where they are creator or collaborator
            const safeItems = (!isAdmin && currentUserId) ? raw.filter(f => {
                if (!f) return false;
                const creatorId = f.creator && typeof f.creator === 'object' ? (f.creator._id || f.creator.id) : f.creator;
                if (String(creatorId) === String(currentUserId)) return true;
                if (Array.isArray(f.collaborator)) {
                    return f.collaborator.some(c => {
                        const collabUserId = c.user && typeof c.user === 'object' ? (c.user._id || c.user.id) : c.user;
                        return String(collabUserId) === String(currentUserId);
                    });
                }
                return false;
            }) : raw;

            // Normalize items into display rows
            const mapped = safeItems.map(f => {
                if (!f) return { isEmpty: true };

                // Permission Logic (for button visibility)
                let canEdit = isAdmin;
                const creatorId = f.creator && typeof f.creator === 'object' ? f.creator._id : f.creator;
                const isCreator = String(creatorId) === String(currentUserId);
                if (isCreator) canEdit = true;

                if (!canEdit && Array.isArray(f.collaborator)) {
                    // Check if user is an Editor collaborator
                    const collab = f.collaborator.find(c => {
                        const collabUserId = c.user && typeof c.user === 'object' ? c.user._id : c.user;
                        return String(collabUserId) === String(currentUserId);
                    });
                    if (collab && collab.type) {
                        const roleTitle = this.getLang(collab.type.title) || '';
                        if (roleTitle.toLowerCase().includes('edit')) canEdit = true;
                    }
                }

                let title = this.getLang(f.title) || this.$t('common.untitled');
                let description = this.getLang(f.description) || '-';

                // Created By / Organization (resolve org + name + email)
                const { createdName, createdEmail, createdOrg } = this.resolveCreatorInfo(f.creator || f.createdBy, locale);
                let createdBy = createdName || createdEmail || '-';
                let organization = '-';
                if (f.organization) {
                    if (typeof f.organization === 'string') organization = f.organization;
                    else if (typeof f.organization === 'object') organization = f.organization.name || f.organization.title || '-';
                }

                const schedStatus = getScheduleStatus(f.schedule);
                let timeRange = '-';
                let daysLeft = '';
                if (f.schedule && (f.schedule.startAt || f.schedule.endAt)) {
                    const localFormat = locale === 'th' ? 'th-TH' : 'en-GB';
                    const startAt = f.schedule.startAt ? new Date(f.schedule.startAt).toLocaleDateString(localFormat) : '';
                    const endAt = f.schedule.endAt ? new Date(f.schedule.endAt).toLocaleDateString(localFormat) : '';
                    if (startAt && endAt) {
                        timeRange = `${startAt} - ${endAt}`;
                    } else if (startAt) {
                        timeRange = startAt;
                    } else if (endAt) {
                        timeRange = `→ ${endAt}`;
                    }
                    if (schedStatus === 'draft') {
                        daysLeft = this.$t('status.draft');
                    } else if (schedStatus === 'scheduled' && f.schedule.startAt) {
                        const diffStart = Math.ceil((new Date(f.schedule.startAt) - new Date()) / (1000 * 60 * 60 * 24));
                        daysLeft = diffStart > 0 ? this.$t('table.startsInDays', { count: diffStart }) : this.$t('status.scheduled');
                    } else if (f.schedule.endAt) {
                        const diff = Math.ceil((new Date(f.schedule.endAt) - new Date()) / (1000 * 60 * 60 * 24));
                        daysLeft = diff > 0 ? this.$t('table.daysLeft', { count: diff }) : this.$t('table.closed');
                    } else if (schedStatus === 'open_forever') {
                        daysLeft = this.$t('table.openForever');
                    }
                } else if (f.timeRange && typeof f.timeRange === 'string') {
                    timeRange = f.timeRange;
                }

                // Status: derive consistently from shared schedule policy (respects Draft vs Published)
                let status = 'Draft';
                if (schedStatus === 'open' || schedStatus === 'open_forever') {
                    status = 'Active';
                } else if (schedStatus === 'scheduled') {
                    status = 'Scheduled';
                } else if (schedStatus === 'closed' || schedStatus === 'closed_forever') {
                    status = 'Closed';
                } else if (!f.schedule && f.status) {
                    if (typeof f.status === 'string') {
                        status = f.status === 'Pending' ? 'Draft' : f.status;
                    } else if (typeof f.status === 'object') {
                        status = f.status.type || f.status.name || 'Draft';
                    }
                }

                // Extract Collaborators
                let collaborators = [];

                if (Array.isArray(f.collaborator) && f.collaborator.length > 0) {
                    f.collaborator.forEach(c => {
                        let name = this.getUserName(c.user);
                        const roleKey = this.classifyRawCollaboratorRole(c && c.type);
                        const viewerLabel = this.$t('editor.settings.access.viewer');
                        const editorLabel = this.$t('editor.settings.access.editor');
                        let role = viewerLabel;
                        if (roleKey === 'editor') {
                            const rawRole = c && c.type ? this.getLang(c.type.title) : '';
                            role = rawRole || editorLabel;
                        } else if (roleKey === 'viewer') {
                            const rawRole = c && c.type ? this.getLang(c.type.title) : '';
                            role = (!rawRole || rawRole === 'ผู้ดู' || rawRole === 'Viewer') ? viewerLabel : rawRole;
                        } else if (c && c.type) {
                            role = this.getLang(c.type.title) || viewerLabel;
                        }
                        collaborators.push({ name, role, roleKey });
                    });
                }

                // Access/Visibility Logic (Explicit Public vs Private)
                let access = [];
                const explicitMode = f.settings && f.settings.accessMode;
                const explicitPublic = explicitMode === 'public';
                const rawOrgs = f.organization || [];
                const orgNames = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => this.getOrganizationLabel(o, locale)).filter(Boolean);

                const allowedEmailList = normalizeAllowedEmails(f.settings && f.settings.allowedEmails);
                const hasAllowedUsers = Boolean(f.settings && Array.isArray(f.settings.allowedUser) && f.settings.allowedUser.length > 0);
                const hasPersonalAccess = !explicitPublic && (hasAllowedUsers || allowedEmailList.length > 0);
                const hasRoleAccess = !explicitPublic && Boolean(f.settings && Array.isArray(f.settings.allowedRoles) && f.settings.allowedRoles.length > 0);

                if (explicitPublic || (explicitMode !== 'private' && (orgNames.includes('General') || orgNames.includes('ทั่วไป')))) {
                    access = ['Public'];
                } else if (orgNames.length > 0) {
                    access = orgNames;
                } else if (!hasPersonalAccess && !hasRoleAccess) {
                    access = ['Private'];
                }

                const seenPersonalEmails = new Set();
                const allowedUserLabels = [];
                if (hasPersonalAccess && hasAllowedUsers) {
                    f.settings.allowedUser.forEach(u => {
                        const matched = (typeof u === 'object' && u)
                            ? u
                            : (this.users || []).find(x => x && String(x._id) === String(u));
                        const em = matched && typeof matched.email === 'string' ? matched.email.trim().toLowerCase() : '';
                        if (em) seenPersonalEmails.add(em);
                        const label = this.getUserName(u);
                        allowedUserLabels.push(label);
                        access.push('Personal: ' + label);
                    });
                }
                if (hasPersonalAccess && allowedEmailList.length > 0) {
                    allowedEmailList.forEach(email => {
                        if (!seenPersonalEmails.has(email)) {
                            seenPersonalEmails.add(email);
                            allowedUserLabels.push(email);
                            access.push('Personal: ' + email);
                        }
                    });
                }
                const allowedUserList = allowedUserLabels.join(', ');

                if (hasRoleAccess) {
                    f.settings.allowedRoles.forEach(r => {
                        const roleLabel = this.getOrganizationLabel(r, locale) || (typeof r === 'object' ? (r.name || 'Role') : String(r));
                        access.push('Role: ' + roleLabel);
                    });
                }

                // Responses array
                const responses = Array.isArray(f.responses) ? f.responses : [];

                const formTarget = { ...f, access, _raw: f };
                const targetCount = this.getTargetCount(formTarget);
                const completedCount = this.getCompletedCount(f);
                const ongoingCount = this.getOngoingCount(f);

                // Unified summaries for compact table cells
                const accessSummary = this.buildAccessSummary(access);
                const collaboratorSummary = this.buildCollaboratorSummary(collaborators);

                const activeResponseRules = this.buildActiveResponseRules(f.settings || {});

                return {
                    _id: f._id,
                    title,
                    description,
                    createdBy,
                    createdName: createdName || createdBy || '-',
                    createdEmail: createdEmail || '',
                    createdOrg: createdOrg || '',
                    organization,
                    timeRange,
                    daysLeft,
                    access,
                    accessSummary,
                    status,
                    responses,
                    collaborators,
                    collaboratorSummary,
                    activeResponseRules,
                    allowedUserList,
                    canEdit,
                    targetCount,
                    completedCount,
                    ongoingCount,
                    isEmpty: false,
                    _raw: f
                };
            });

            // apply Quick Range / From-To date filtering if provided (based on schedule overlap)
            let filtered = mapped;
            if ((this.startDate && this.startDate.trim() !== '') || (this.endDate && this.endDate.trim() !== '')) {
                // Parse filter dates strictly as local start (00:00) and end (23:59)
                const filterStart = this.startDate ? new Date(`${this.startDate}T00:00:00`) : new Date(-8640000000000000);
                const filterEnd = this.endDate ? new Date(`${this.endDate}T23:59:59`) : new Date(8640000000000000);

                // Safety check: ensure we didn't get "Invalid Date"
                if (!isNaN(filterStart.getTime()) && !isNaN(filterEnd.getTime())) {
                    filtered = filtered.filter(f => {
                        const rawSched = f._raw && f._raw.schedule ? f._raw.schedule : {};
                        const s = rawSched.startAt ? new Date(rawSched.startAt) : null;
                        const e = rawSched.endAt ? new Date(rawSched.endAt) : null;

                        // Hide forms without any schedule if a filter is active
                        if (!s && !e) return false;

                        // Boundaries (handle open-ended)
                        const formStart = s || new Date(-8640000000000000);
                        const formEnd = e || new Date(8640000000000000);

                        return (formStart <= filterEnd) && (formEnd >= filterStart);
                    });
                }
            }

            // apply status filter
            if (this.selectedStatus && this.selectedStatus !== 'All') {
                const targetStatus = this.selectedStatus === 'Pending' ? 'Draft' : this.selectedStatus;
                filtered = filtered.filter(f => f.status === targetStatus);
            }

            // search (title only)
            if (this.searchQuery && this.searchQuery.trim() !== '') {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(f => {
                    const titleText = f.title ? String(f.title).toLowerCase() : '';
                    return titleText.includes(q);
                });
            }

            return filtered;
        }
    },
    methods: {
        getTargetCount(item) {
            const form = item._raw || item;
            if (!form) return 0;

            const allUsers = this.users || [];
            if (!allUsers.length) return 0;

            const explicitMode = form.settings && form.settings.accessMode;
            const explicitPublic = explicitMode === 'public';
            const rawOrgs = form.organization || [];
            const formOrgIds = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs])
                .filter(Boolean)
                .map(o => (o && typeof o === 'object' ? (o._id || o.id) : o)?.toString());

            const isPublicForm = explicitPublic || (explicitMode !== 'private' && (formOrgIds.includes('6a0b51af2dbf6e77c4df73fe') ||
                (Array.isArray(item.access) && item.access.some(name => name === 'General' || name === 'ทั่วไป' || name === 'Public'))));

            // Allowed Roles restriction (if specified)
            const allowedRoles = (!explicitPublic && form.settings && Array.isArray(form.settings.allowedRoles)) ? form.settings.allowedRoles : [];
            const allowedRoleIds = allowedRoles.map(r => (r && typeof r === 'object' ? (r._id || r.id) : r)?.toString()).filter(Boolean);
            const hasRoleFilter = allowedRoleIds.length > 0;

            // 1. Gather users matching organizations and allowed roles
            const targetUserIds = new Set();

            allUsers.forEach(u => {
                if (!u || !u._id) return;
                const uId = u._id.toString();
                const uOrgId = (u.organization && typeof u.organization === 'object' ? (u.organization._id || u.organization.id) : u.organization)?.toString();
                const uRoleId = (u.role && typeof u.role === 'object' ? (u.role._id || u.role.id) : u.role)?.toString();

                const roleMatches = !hasRoleFilter || (uRoleId && allowedRoleIds.includes(uRoleId));

                if (isPublicForm) {
                    if (roleMatches) targetUserIds.add(uId);
                } else if (uOrgId && formOrgIds.includes(uOrgId)) {
                    if (roleMatches) targetUserIds.add(uId);
                }
            });

            if (!explicitPublic) {
                // 2. Union explicitly allowed users (settings.allowedUser) & external emails (settings.allowedEmails)
                const allowedUsers = (form.settings && Array.isArray(form.settings.allowedUser)) ? form.settings.allowedUser : [];
                allowedUsers.forEach(u => {
                    if (!u) return;
                    const id = (typeof u === 'object' ? (u._id || u.id || u.value) : u)?.toString();
                    if (id) targetUserIds.add(id);
                });

                const allowedEmails = normalizeAllowedEmails(form.settings && form.settings.allowedEmails);
                if (allowedEmails.length > 0) {
                    const emailToUser = new Map();
                    allUsers.forEach(u => {
                        if (u && u._id && typeof u.email === 'string') {
                            emailToUser.set(u.email.trim().toLowerCase(), u._id.toString());
                        }
                    });
                    allowedEmails.forEach(email => {
                        const matchedId = emailToUser.get(email);
                        targetUserIds.add(matchedId || `email:${email}`);
                    });
                }
            }

            return targetUserIds.size;
        },
        getCompletedCount(item) {
            const formId = item._id ? item._id.toString() : null;
            if (!formId) return 0;
            
            const allResponses = (this.responses && Array.isArray(this.responses)) ? this.responses : (item.responses || []);
            const formResponses = allResponses.filter(r => {
                const rFormId = r.form && typeof r.form === 'object' ? (r.form._id || r.form.id) : r.form;
                return String(rFormId) === formId;
            });

            const completedResponders = new Set();
            formResponses.forEach(r => {
                const isSubmitted = r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true';
                if (isSubmitted) {
                    const responderId = (r.responder && typeof r.responder === 'object' ? (r.responder._id || r.responder.id) : r.responder) || r.guestSessionId || r._id;
                    completedResponders.add(String(responderId));
                }
            });

            return completedResponders.size;
        },
        getOngoingCount(item) {
            const formId = item._id ? item._id.toString() : null;
            if (!formId) return 0;

            const allResponses = (this.responses && Array.isArray(this.responses)) ? this.responses : (item.responses || []);
            const formResponses = allResponses.filter(r => {
                const rFormId = r.form && typeof r.form === 'object' ? (r.form._id || r.form.id) : r.form;
                return String(rFormId) === formId;
            });

            // Responders who have submitted
            const completedResponders = new Set();
            formResponses.forEach(r => {
                const isSubmitted = r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true';
                if (isSubmitted) {
                    const responderId = (r.responder && typeof r.responder === 'object' ? (r.responder._id || r.responder.id) : r.responder) || r.guestSessionId || r._id;
                    completedResponders.add(String(responderId));
                }
            });

            // Responders with ongoing draft (submit: false) who have not submitted yet
            const ongoingResponders = new Set();
            formResponses.forEach(r => {
                const isSubmitted = r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true';
                if (!isSubmitted) {
                    const responderId = (r.responder && typeof r.responder === 'object' ? (r.responder._id || r.responder.id) : r.responder) || r.guestSessionId || r._id;
                    const rIdStr = String(responderId);
                    if (!completedResponders.has(rIdStr)) {
                        ongoingResponders.add(rIdStr);
                    }
                }
            });

            return ongoingResponders.size;
        },
        formatAccessLabel(v) {
            if (!v) return '';
            return v.startsWith('Personal: ') ? v.replace('Personal: ', '') : (this.$te('accessLabel.' + v.toLowerCase()) ? this.$t('accessLabel.' + v.toLowerCase()) : v);
        },
        calculateDaysLeft(endAt) {
            try {
                const end = new Date(endAt);
                const now = new Date();
                const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                return diff > 0 ? this.$t('table.daysLeft', { count: diff }) : this.$t('table.closed');
            } catch (e) {
                return '';
            }
        },
        confirmDeleteItem(item) {
            this.deleteItem = item;
            const options = {
                title: this.$t('modal.deleteTitle'),
                message: this.$t('modal.deleteMessage'),
                button: [
                    { label: this.$t('modal.cancel'), icon: 'cil-ban', color: 'secondary', code: 'cancel' },
                    { label: this.$t('modal.confirm'), icon: 'cil-check', color: 'danger', code: 'confirm' }
                ]
            };
            this.$store.dispatch('dialog/open', options);
        },
        filterStatus(status) {
            this.selectedStatus = status;
            this.activePage = 1; // Reset pagination when filter changes
        },
        getStatusClass(status) {
            const s = status ? status.toLowerCase() : '';
            if (s === 'active') return 'status-active';
            if (s === 'closed') return 'status-closed';
            if (s === 'draft') return 'status-draft';
            return 'status-pending';
        },
        getVisibilityClass(acc) {
            if (!acc) return 'visi-private';
            const v = acc.toLowerCase();
            if (v.includes('public')) return 'visi-public';
            if (v.includes('private')) return 'visi-private';
            if (v.includes('personal')) return 'visi-personal';
            return 'visi-org';
        },
        resolveCreatorInfo(creatorRef, locale) {
            if (!creatorRef) {
                return { createdName: '-', createdEmail: '', createdOrg: '' };
            }
            const userList = Array.isArray(this.users) ? this.users : [];
            if (typeof creatorRef === 'string') {
                const trimmed = creatorRef.trim();
                if (!trimmed) return { createdName: '-', createdEmail: '', createdOrg: '' };
                const matched = userList.find(u =>
                    u && (String(u._id) === trimmed || (u.email && u.email === trimmed) || (u.name && u.name === trimmed))
                );
                if (matched) {
                    return {
                        createdName: matched.name || matched.fullname || matched.email || trimmed,
                        createdEmail: matched.email || '',
                        createdOrg: this.getOrganizationLabel(matched.organization, locale) || ''
                    };
                }
                const display = /^[0-9a-f]{24}$/i.test(trimmed) ? '-' : trimmed;
                return { createdName: display, createdEmail: '', createdOrg: '' };
            }
            if (typeof creatorRef === 'object') {
                const creatorId = creatorRef._id ? String(creatorRef._id) : '';
                const matched = userList.find(u =>
                    u && ((creatorId && String(u._id) === creatorId) || (creatorRef.email && u.email === creatorRef.email))
                );
                return {
                    createdName: creatorRef.name || creatorRef.fullname || (matched && (matched.name || matched.email)) || creatorRef.email || '-',
                    createdEmail: creatorRef.email || (matched && matched.email) || '',
                    createdOrg: this.getOrganizationLabel(creatorRef.organization || (matched && matched.organization), locale) || ''
                };
            }
            return { createdName: '-', createdEmail: '', createdOrg: '' };
        },
        getOrganizationLabel(orgRef, locale) {
            if (!orgRef) return null;

            if (typeof orgRef === 'object') {
                if (Array.isArray(orgRef.title)) {
                    const localOrgTitle = orgRef.title.find(t => t && t.key && t.key.toLowerCase() === locale);
                    return localOrgTitle ? localOrgTitle.value : (orgRef.title[0] ? orgRef.title[0].value : null);
                }
                return orgRef.name || orgRef.title || orgRef.value || (orgRef._id ? String(orgRef._id) : null);
            }

            const orgId = String(orgRef);
            const found = Array.isArray(this.organizations)
                ? this.organizations.find(o => String(o._id) === orgId || String(o.id) === orgId)
                : null;

            if (found) {
                if (Array.isArray(found.title)) {
                    const localOrgTitle = found.title.find(t => t && t.key && t.key.toLowerCase() === locale);
                    return localOrgTitle ? localOrgTitle.value : (found.title[0] ? found.title[0].value : null);
                }
                return found.name || found.title || found.value || orgId;
            }

            return orgId;
        },
        getUserName(userRef) {
            if (!userRef) return 'Unknown';
            if (typeof userRef === 'object' && userRef.email) return userRef.name || userRef.email;
            if (!this.users) return userRef;
            const u = this.users.find(x => String(x._id) === String(userRef));
            return u ? (u.name || u.email) : userRef;
        },
        goToEditForm(item) {
            this.$router.push({ name: 'EditorCreateForm', params: { _id: item._id } });
        },
        goToDuplicationForm(item) {
            this.$router.push({ name: 'FormFill', params: { id: item._id }, query: { mode: 'duplicate', source: 'internal' } });
        },
        goToPreviewForm(item) {
            this.$router.push({ name: 'FormFill', params: { id: item._id }, query: { mode: 'preview', source: 'internal' } });
        },
        async deleteForm(item) {
            try {
                const formId = item._id || (item._raw ? item._raw._id : null) || item.id;
                if (!formId) {
                    console.error("Could not find a valid ID to delete the form.");
                    return;
                }
                await this.$store.dispatch('Forms/delete', { _id: formId });
            } catch (error) {
                console.error("Failed to delete form:", error);
            }
        },
        // Helper to filter organization/public access
        orgAccessOnly(access) {
            if (!Array.isArray(access)) return [];
            return access.filter(acc => !acc.startsWith('Personal: ') && !acc.startsWith('Role: '));
        },
        // Helper to filter personal access
        personalAccessOnly(access) {
            if (!Array.isArray(access)) return [];
            return access.filter(acc => acc.startsWith('Personal: '));
        },
        // Helper to filter role access
        roleAccessOnly(access) {
            if (!Array.isArray(access)) return [];
            return access.filter(acc => acc.startsWith('Role: '));
        },
        // Helper to filter out public from organization count
        realOrgAccessOnly(access) {
            if (!Array.isArray(access)) return [];
            return access.filter(acc => !acc.startsWith('Personal: ') && !acc.startsWith('Role: ') && acc !== 'Public' && acc !== 'Publicly');
        },
        // Helper to group collaborators by their role
        groupCollaboratorsByRole(collaborators) {
            if (!collaborators || !Array.isArray(collaborators)) return {};
            return collaborators.reduce((acc, curr) => {
                const role = curr.role || 'Contributor';
                if (!acc[role]) acc[role] = [];
                acc[role].push(curr);
                return acc;
            }, {});
        },
        // Build unified 1-pill access summary with grouped dropdown targets
        buildAccessSummary(access) {
            return buildCompactAccessSummary(access, {
                formatLabel: (val) => this.formatAccessLabel(val),
                orgUnit: this.$t('table.orgUnit') || 'Orgs',
                userUnit: this.$t('table.userUnit') || 'Users',
                roleUnit: this.$t('table.roleUnit') || 'Roles'
            });
        },
        classifyRawCollaboratorRole(typeRef) {
            if (!typeRef) return 'viewer';
            const rawTokens = [];
            if (typeof typeRef === 'string') {
                rawTokens.push(typeRef);
            } else if (typeof typeRef === 'object') {
                if (typeRef._id) rawTokens.push(String(typeRef._id));
                if (typeRef.id) rawTokens.push(String(typeRef.id));
                if (typeRef.name) rawTokens.push(String(typeRef.name));
                if (typeRef.value) rawTokens.push(String(typeRef.value));
                if (Array.isArray(typeRef.title)) {
                    typeRef.title.forEach(t => {
                        if (t && t.value) rawTokens.push(String(t.value));
                    });
                } else if (typeof typeRef.title === 'string') {
                    rawTokens.push(typeRef.title);
                }
            }
            const combined = rawTokens.join(' ').toLowerCase();
            if (!combined.trim()) return 'viewer';
            if (combined.includes('edit') || combined.includes('แก้ไข')) return 'editor';
            if (combined.includes('view') || combined.includes('inspect') || combined.includes('ดู')) return 'viewer';
            return 'other';
        },
        // Build unified single-row collaborator count summary
        buildCollaboratorSummary(collaborators) {
            if (!Array.isArray(collaborators) || collaborators.length === 0) {
                return { editors: 0, viewers: 0, others: 0, label: '', tooltip: '' };
            }
            let editors = 0;
            let viewers = 0;
            let others = 0;
            collaborators.forEach(c => {
                const roleKey = c && c.roleKey ? c.roleKey : this.classifyRawCollaboratorRole(c && (c.type || c.role));
                if (roleKey === 'editor') editors += 1;
                else if (roleKey === 'viewer') viewers += 1;
                else others += 1;
            });

            const parts = [];
            if (editors > 0) {
                const key = editors === 1 ? 'table.collaboratorCount.editorOne' : 'table.collaboratorCount.editorMany';
                parts.push(this.$t(key, { count: editors }));
            }
            if (viewers > 0) {
                const key = viewers === 1 ? 'table.collaboratorCount.viewerOne' : 'table.collaboratorCount.viewerMany';
                parts.push(this.$t(key, { count: viewers }));
            }
            if (others > 0) {
                const key = others === 1 ? 'table.collaboratorCount.otherOne' : 'table.collaboratorCount.otherMany';
                parts.push(this.$t(key, { count: others }));
            }

            return {
                editors,
                viewers,
                others,
                label: parts.join(' · '),
                tooltip: collaborators.map(c => `${c.name} (${c.role})`).join(', ')
            };
        },
        // Build compact list of active response setting icons + tooltips
        buildActiveResponseRules(rawSettings = {}) {
            return buildActiveResponseRuleBadges(rawSettings, (key, params) => this.$t(key, params));
        },
        // Get CSS class based on role for color coding
        getRoleClass(role) {
            if (!role) return 'role-default';
            const r = role.toLowerCase();
            if (r.includes('owner') || r.includes('เจ้าของ')) return 'role-owner';
            if (r.includes('edit') || r.includes('แก้ไข')) return 'role-editor';
            if (r.includes('view') || r.includes('inspect') || r.includes('ดู')) return 'role-viewer';
            return 'role-default';
        },
        // Get icon color class based on role
        getRoleIconClass(role) {
            if (!role) return 'text-primary';
            const r = role.toLowerCase();
            if (r.includes('owner') || r.includes('เจ้าของ')) return 'text-warning';
            if (r.includes('edit') || r.includes('แก้ไข')) return 'text-success';
            if (r.includes('view') || r.includes('inspect') || r.includes('ดู')) return 'text-secondary';
            return 'text-primary';
        }
    },
    watch: {
        itemsPerPage() {
            this.activePage = 1;
        },
        isCode(val) {
            if (val === 'confirm' && this.deleteItem) {
                this.deleteForm(this.deleteItem);
                this.deleteItem = null;
            }
        }
    }
}
</script>

<style scoped>
.user-tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    padding: 0;
    overflow: hidden;
}

@media (min-width: 992px) {
    .user-tables-container /deep/ .table-responsive {
        overflow-x: auto;
        margin-bottom: 0;
    }

    .mgmt-title-cell {
        min-width: 190px;
        max-width: 260px;
    }

    .mgmt-title-box {
        max-width: 260px;
    }

    .mgmt-creator-cell {
        min-width: 140px;
        max-width: 200px;
    }

    .mgmt-creator-box {
        max-width: 195px;
    }

    .mgmt-settings-cell {
        min-width: 112px;
    }
}

.user-tables-container /deep/ table.table {
    margin-bottom: 0;
}

.user-tables-container /deep/ thead th {
    white-space: nowrap;
}

.mgmt-form-title {
    font-size: 0.95rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.mgmt-form-desc {
    line-height: 1.4;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.mgmt-creator-name,
.mgmt-creator-email {
    overflow-wrap: anywhere;
    word-break: break-word;
}

.mgmt-responses-cell {
    min-width: 132px;
    white-space: nowrap;
}

.response-stat-line {
    white-space: nowrap;
    flex-wrap: nowrap;
}

.response-icon-badge {
    flex-shrink: 0;
}

.response-count,
.response-stat-label {
    white-space: nowrap;
}

.user-tables-container.table-empty tbody tr,
.user-tables-container.table-empty tbody tr:hover,
.user-tables-container.table-empty tbody td {
    background: transparent !important;
    background-color: transparent !important;
    cursor: default !important;
    pointer-events: none !important;
    user-select: none !important;
}

.user-tables-container.table-empty thead th {
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

.text-muted {
    color: #64748b !important;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35em 0.8em;
    border-radius: 50rem;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
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

.status-draft {
    background-color: #f1f5f9;
    color: #475569;
}

.status-draft .status-dot {
    background-color: #94a3b8;
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

.collab-stack {
    max-height: 85px;
    overflow-y: auto;
    padding-right: 4px;
}

.collab-stack::-webkit-scrollbar {
    width: 3px;
}

.collab-stack::-webkit-scrollbar-track {
    background: transparent;
}

.collab-stack::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}

.visibility-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 1.1rem;
    border-radius: 100px; /* Pill shape like image */
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.2s ease;
    border: none;
}

.visi-public {
    background-color: #ecfdf5; /* Mint green background */
    color: #065f46; /* Dark teal text */
}

.visi-private {
    background-color: #fef2f2; /* Light red/rose */
    color: #b91c1c; /* Vibrant red text */
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

/* Role Specific Colors */
.role-editor {
    background-color: #ecfdf5; /* Green */
    color: #065f46;
}

.role-viewer {
    background-color: #f1f5f9; /* Gray/Slate */
    color: #475569;
}

.role-owner {
    background-color: #fffbeb; /* Amber/Gold */
    color: #92400e;
}

.role-default {
    background-color: #eff6ff; /* Blue */
    color: #1e40af;
}

.response-badge {
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8125rem;
}

.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background-color: #f1f5f9;
    color: #475569;
}

.delete-modal>>>.modal-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background-color: #ffffff;
    border: 1px solid #dc2626;
    color: #dc2626;
}

.delete-modal>>>.modal-icon-wrapper .c-icon {
    font-size: 20px;
}

.delete-modal .btn-cancel {
    background-color: #f1f5f9 !important;
    border: 1px solid #cbd5e1 !important;
    color: #475569 !important;
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
}

.delete-modal .btn-confirm {
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
}

.action-icon-btn {
    width: 38px;
    height: 38px;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    border-radius: 50% !important;
    transition: all 0.2s ease;
    border: none !important;
    background: transparent;
}

/* 1. Preview: Sky Blue / Info (#0284c7) - สำรวจ/ดูข้อมูล */
.action-icon-btn.btn-preview {
    color: #0284c7 !important;
}
.action-icon-btn.btn-preview:hover {
    background-color: #e0f2fe !important;
    color: #0369a1 !important;
    transform: translateY(-1px);
}

/* 2. Duplicate: Emerald Green / Success (#10b981) - โคลน/สร้างใหม่เชิงบวก */
.action-icon-btn.btn-duplicate {
    color: #10b981 !important;
}
.action-icon-btn.btn-duplicate:hover {
    background-color: #d1fae5 !important;
    color: #059669 !important;
    transform: translateY(-1px);
}

/* 3. Edit: Amber Orange / Warning (#f59e0b) - แก้ไข ปรับปรุงข้อมูล */
.action-icon-btn.btn-edit {
    color: #f59e0b !important;
}
.action-icon-btn.btn-edit:hover {
    background-color: #fef3c7 !important;
    color: #d97706 !important;
    transform: translateY(-1px);
}

/* 4. Delete: Crimson Red / Danger (#ef4444) - ลบ/อันตราย */
.action-icon-btn.btn-delete {
    color: #ef4444 !important;
}
.action-icon-btn.btn-delete:hover {
    background-color: #fee2e2 !important;
    color: #dc2626 !important;
    transform: translateY(-1px);
}

.dropdown-item-custom:hover {
    background-color: #f8fafc;
}

.avatar-sm {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8125rem;
    font-weight: 700;
    color: #475569;
    flex-shrink: 0;
}

.collaborator-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.9rem;
    border-radius: 100px;
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.2s ease;
    border: none;
}

.collaborator-badge:hover {
    filter: brightness(0.95);
}
/* Style the actual dropdown container from CoreUI */
.custom-dropdown /deep/ .dropdown-menu {
    background: white !important;
    border-radius: 12px !important;
    padding: 0 !important;
    margin-top: 8px !important;
    z-index: 2000 !important; /* Extremely high for fixed positioning */
    border: 1px solid #edf2f7 !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
    max-height: 250px;
    overflow-y: auto;
    min-width: 220px;
}
/* Reset CoreUI specific dropdown item padding */
.custom-dropdown /deep/ .dropdown-item {
    padding: 0 !important;
}
.custom-dropdown /deep/ .dropdown-toggle, 
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

.custom-dropdown /deep/ .dropdown-toggle::after,
.custom-dropdown ::v-deep .dropdown-toggle::after {
    display: none !important;
}
.last-border-0:last-child {
    border-bottom: 0 !important;
}
.cursor-pointer {
    cursor: pointer;
}
.gap-1 {
    gap: 0.25rem;
}
.min-width-0 {
    min-width: 0;
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
.collab-summary {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
}
.text-success-dark {
    color: #065f46;
}
.text-slate-dark {
    color: #475569;
}
.role-mini-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.55rem;
    border-radius: 100px;
    font-size: 0.8125rem;
    font-weight: 600;
}
.response-icons-grid {
    display: inline-grid;
    grid-template-columns: repeat(3, 28px);
    gap: 6px;
    align-items: center;
}
.response-icons-grid.is-empty-rules {
    display: inline-flex;
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
.action-kebab-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid transparent;
    background-color: transparent;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
}
.action-kebab-btn:hover,
.action-kebab-btn:focus {
    background-color: #f1f5f9;
    color: #1e293b;
    border-color: #e2e8f0;
    outline: none;
}
.actions-dropdown /deep/ .dropdown-menu,
.actions-dropdown ::v-deep .dropdown-menu {
    min-width: 220px !important;
    max-height: none !important;
    border-radius: 14px !important;
}
.actions-item-row {
    padding: 0.72rem 1.15rem;
    gap: 12px;
    min-width: 220px;
}
.actions-item-icon {
    width: 18px !important;
    height: 18px !important;
    flex-shrink: 0;
}
.actions-item-label {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.4;
}
</style>