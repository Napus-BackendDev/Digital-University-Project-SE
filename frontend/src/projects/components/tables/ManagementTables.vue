<template>
    <div>
        <FilterTable :searchQuery.sync="searchQuery" :selectedStatus.sync="selectedStatus" :startDate.sync="startDate"
            :endDate.sync="endDate" :managementMode="true" />

        <!-- Table -->
        <CDataTable class="user-tables-container mb-0" :items="tableData" :fields="fields"
            :items-per-page="itemsPerPage" :pagination="false" hover :activePage.sync="activePage"
            :no-items-view="{ noItems: $t('table.noItems') }">

            <!-- Questionnaire (Title & Description) -->
            <template #title="{ item }">
                <td class="align-middle">
                    <template v-if="!item.isEmpty">
                        <div class="font-weight-bold text-dark" style="font-size: 0.95rem;">{{ item.title }}</div>
                        <div class="small text-muted mt-1" v-if="item.description">{{ item.description }}</div>
                    </template>
                </td>
            </template>

            <!-- Created By (Name + Email) -->
            <template #createBy="{ item }">
                <td class="align-middle ">
                    <div class="small text-dark font-weight-bold">{{ item.createdName || '-' }}</div>
                    <div class="small text-muted mt-1" v-if="item.createdEmail">{{ item.createdEmail }}</div>
                </td>
            </template>

            <!-- Collaborators (Editors / Viewers) -->
            <template #collaborators="{ item }">
                <td class="align-middle">
                    <div v-if="!item.isEmpty">
                        <div v-if="item.collaborators && item.collaborators.length > 0" class="collab-stack">
                            <div v-for="(collab, i) in item.collaborators" :key="i"
                                class="d-flex align-items-center mb-1">
                                <span class="small font-weight-bold text-dark text-truncate mr-2"
                                    style="max-width: 100px;">{{ collab.name }}</span>
                                <span class="badge"
                                    :class="collab.role.toLowerCase().includes('edit') ? 'badge-info' : 'badge-secondary'"
                                    style="font-size: 0.65rem;">{{ collab.role }}</span>
                            </div>
                        </div>
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

            <!-- Access -->
            <template #access="{ item }">
                <td class="align-middle">
                    <div v-if="!item.isEmpty" class="access-stack">
                        <span v-for="(acc, i) in (Array.isArray(item.access) ? item.access : [item.access])" :key="i"
                            class="visibility-badge" :class="getVisibilityClass(acc)">
                            {{ acc.startsWith('Personal: ') ? acc.replace('Personal: ', '') : ($te('accessLabel.' +
                                acc.toLowerCase()) ? $t('accessLabel.' + acc.toLowerCase()) : acc) }}
                        </span>
                    </div>
                </td>
            </template>

            <!-- Responses: show two rows (Completed vs Ongoing) -->
            <template #responses="{ item }">
                <td class="align-middle">
                    <div v-if="!item.isEmpty" class="d-flex flex-column">
                        <div class="d-flex align-items-center mb-1">
                            <div class="icon-wrapper mr-2 chart-color" style="width: 20px; height: 20px;">
                                <CIcon name="cil-check-alt" size="sm" class="text-success" />
                            </div>
                            <span class="response-count font-weight-bold mr-1">{{ getCompletedCount(item.responses)
                                }}</span>
                            <small class="text-muted">{{ $t('table.completedResponse') }}</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="icon-wrapper mr-2"
                                style="width: 20px; height: 20px; background-color: #f1f5f9;">
                                <CIcon name="cil-history" size="sm" class="text-info" />
                            </div>
                            <span class="response-count font-weight-bold mr-1">{{ getOngoingCount(item.responses)
                                }}</span>
                            <small class="text-muted">{{ $t('table.ongoingResponse') }}</small>
                        </div>
                    </div>
                </td>
            </template>

            <!-- Actions: individual icon buttons like FormTables -->
            <template #actions="{ item }">
                <td class="align-middle text-right pr-4">
                    <div class="d-flex align-items-center justify-content-end">
                        <CButton size="sm" color="info" variant="ghost" class="p-2 mr-2 action-icon-btn"
                            @click.stop="goToPreviewForm(item)" v-c-tooltip="$t('button.preview')" aria-label="Preview">
                            <CIcon name="cil-magnifying-glass" />
                        </CButton>
                        <template v-if="item.canEdit">
                            <CButton size="sm" color="primary" variant="ghost" class="p-2 mr-2 action-icon-btn"
                                @click.stop="goToDuplicationForm(item)" v-c-tooltip="$t('table.duplicate')"
                                aria-label="Duplicate">
                                <CIcon name="cil-copy" />
                            </CButton>
                            <CButton size="sm" color="warning" variant="ghost" class="p-2 mr-2 action-icon-btn"
                                @click.stop="goToEditForm(item)" v-c-tooltip="$t('button.edit')" aria-label="Edit">
                                <CIcon name="cil-pencil" />
                            </CButton>
                            <CButton size="sm" color="danger" variant="ghost" class="p-2 action-icon-btn"
                                @click.stop="confirmDeleteItem(item)" v-c-tooltip="$t('table.delete')"
                                aria-label="Delete">
                                <CIcon name="cil-trash" />
                            </CButton>
                        </template>
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

        <!-- Pagination -->
        <Pagination :activePage.sync="activePage" :pages="totalPages" />
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'
import FilterTable from '@/projects/components/Filter/FilterTable.vue'
import localeMixin from '@/mixins/localeMixin'

export default {
    name: 'ManagementTables',
    components: { Pagination, FilterTable },
    mixins: [localeMixin],
    props: {
        items: {
            type: Array,
            default: () => []
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
    },
    computed: {
        fields() {
            return [
                { key: 'title', label: this.$t('table.questionnaire'), _style: 'width:18%' },
                { key: 'access', label: this.$t('table.access'), _style: 'width:10%' },
                { key: 'timeRange', label: this.$t('table.timeRange'), _style: 'width:15%' },
                { key: 'status', label: this.$t('table.status'), _style: 'width:10%' },
                { key: 'responses', label: this.$t('table.responses'), _style: 'width:15%' },
                { key: 'createBy', label: this.$t('table.createdBy'), _style: 'width:10%' },
                { key: 'collaborators', label: 'Collaborators', _style: 'width:12%' },
                { key: 'actions', label: this.$t('table.actions'), _style: 'width:10%; text-align:right' }
            ]
        },
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user', 'users']),
        ...mapGetters('Organizations', ['organizations']),
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
            const raw = this.items || [];
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

            // Normalize items into display rows
            const mapped = raw.map(f => {
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

                // Created By / Organization (extract name + email)
                let createdBy = '-';
                let createdName = '-';
                let createdEmail = '';
                if (f.creator) {
                    if (typeof f.creator === 'string') {
                        createdBy = f.creator;
                        createdName = f.creator;
                    } else if (typeof f.creator === 'object') {
                        createdName = f.creator.name || f.creator.fullname || f.creator.email || '-';
                        createdEmail = f.creator.email || '';
                        createdBy = createdName || createdEmail || '-';
                    }
                } else if (f.createdBy) {
                    if (typeof f.createdBy === 'string') {
                        createdBy = f.createdBy;
                        createdName = f.createdBy;
                    } else if (typeof f.createdBy === 'object') {
                        createdName = f.createdBy.name || f.createdBy.email || '-';
                        createdEmail = f.createdBy.email || '';
                        createdBy = createdName || createdEmail || '-';
                    }
                }
                let organization = '-';
                if (f.organization) {
                    if (typeof f.organization === 'string') organization = f.organization;
                    else if (typeof f.organization === 'object') organization = f.organization.name || f.organization.title || '-';
                }

                let timeRange = '-';
                let daysLeft = '';
                if (f.schedule && (f.schedule.startAt || f.schedule.endAt)) {
                    const localFormat = locale === 'th' ? 'th-TH' : 'en-GB';
                    const startAt = f.schedule.startAt ? new Date(f.schedule.startAt).toLocaleDateString(localFormat) : '';
                    const endAt = f.schedule.endAt ? new Date(f.schedule.endAt).toLocaleDateString(localFormat) : '';
                    timeRange = startAt || endAt ? `${startAt}${endAt ? ' - ' + endAt : ''}` : '-';
                    if (f.schedule.endAt) {
                        const diff = Math.ceil((new Date(f.schedule.endAt) - new Date()) / (1000 * 60 * 60 * 24));
                        daysLeft = diff > 0 ? this.$t('table.daysLeft', { count: diff }) : this.$t('table.closed');
                    }
                } else if (f.timeRange && typeof f.timeRange === 'string') {
                    timeRange = f.timeRange;
                }

                // Status: derive from schedule if available (Pending / Active / Closed)
                let status = 'Pending';
                const now = new Date();
                const hasStart = f.schedule && f.schedule.startAt;
                const hasEnd = f.schedule && f.schedule.endAt;
                if (hasStart || hasEnd) {
                    const start = hasStart ? new Date(f.schedule.startAt) : null;
                    const end = hasEnd ? new Date(f.schedule.endAt) : null;

                    // If current time is outside the set range, it's Closed
                    if ((start && now < start) || (end && now > end)) {
                        status = 'Closed';
                    } else {
                        status = 'Active';
                    }
                } else if (f.status) {
                    // fallback to existing status field if schedule not present
                    if (typeof f.status === 'string') status = f.status;
                    else if (typeof f.status === 'object') status = f.status.type || f.status.name || 'Pending';
                }
                else {
                    // no schedule or explicit status -> default to Pending
                    status = 'Pending';
                }

                // Extract Collaborators
                let collaborators = [];
                console.log(f)
                if (Array.isArray(f.collaborator) && f.collaborator.length > 0) {
                    f.collaborator.forEach(c => {
                        let name = this.getUserName(c.user);
                        let role = 'Viewer';
                        if (c.type) {
                            role = this.getLang(c.type.title) || 'Viewer';
                        }
                        collaborators.push({ name, role });
                    });
                }

                // Access/Visibility Logic (Based on Organization)
                let access = [];
                const rawOrgs = f.organization || [];
                const orgNames = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => this.getOrganizationLabel(o, locale)).filter(Boolean);

                const hasPersonalAccess = f.settings && Array.isArray(f.settings.allowedUser) && f.settings.allowedUser.length > 0;

                // Tooltip logic
                let allowedUserList = '';
                if (hasPersonalAccess) {
                    allowedUserList = f.settings.allowedUser.map(u => {
                        if (typeof u === 'object') return u.name || u.fullname || u.email || 'User';
                        return this.getUserName(u);
                    }).join(', ');
                }

                if (orgNames.includes('General') || orgNames.includes('ทั่วไป')) {
                    access = ['Public'];
                } else if (orgNames.length > 0) {
                    access = orgNames;
                } else {
                    access = ['Private'];
                }

                if (hasPersonalAccess) {
                    f.settings.allowedUser.forEach(u => {
                        access.push('Personal: ' + this.getUserName(u));
                    });
                }

                // Responses array
                const responses = Array.isArray(f.responses) ? f.responses : [];

                return {
                    _id: f._id,
                    title,
                    description,
                    createdBy,
                    createdName: createdName || createdBy || '-',
                    createdEmail: createdEmail || '',
                    organization,
                    timeRange,
                    daysLeft,
                    access,
                    status,
                    responses,
                    collaborators,
                    allowedUserList,
                    canEdit,
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
                filtered = filtered.filter(f => f.status === this.selectedStatus);
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
        getCompletedCount(responses) {
            if (!Array.isArray(responses)) return 0;
            return responses.filter(r => r.submit === true).length;
        },
        getOngoingCount(responses) {
            if (!Array.isArray(responses)) return 0;
            return responses.filter(r => r.submit !== true).length;
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
        }
    },
    watch: {
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
    background-color: #fff7ed;
    color: #8c1515;
}

.visi-personal {
    background-color: #f5f3ff;
    color: #7c3aed;
}

.visi-default {
    background-color: #f1f5f9;
    color: #64748b;
}

.response-badge {
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
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
}

.action-icon-btn:hover {
    background-color: #f1f5f9 !important;
    color: #3c4b64 !important;
    transform: translateY(-1px);
}
</style>