<template>
    <CCard :class="embedded ? 'mb-0 border-0 shadow-none bg-transparent' : 'mb-4 border-0 shadow-sm rounded-20'" style="overflow: visible;">
        <CCardBody :class="embedded ? 'px-3 px-md-4 pt-1 pb-3 pb-md-4' : 'p-3 p-md-4'">
            <h5 v-if="!embedded" class="mb-4 font-weight-bold text-dark">{{ $t('editor.settings.organization.title') }}</h5>

            <!-- Top-Level Access Mode Switcher: Private (Restricted Group + Institutional Email) vs Public (Anyone) -->
            <div class="mb-4 pb-3 border-bottom-soft">
                <h6 class="mb-1 font-weight-bold text-dark">{{ $t('editor.settings.organization.accessModeLabel') }}</h6>
                <small class="text-muted d-block mb-3">{{ $t('editor.settings.organization.accessModeDesc') }}</small>

                <div class="access-mode-grid" role="radiogroup" :aria-label="$t('editor.settings.organization.accessModeLabel')">
                    <button
                        type="button"
                        role="radio"
                        data-test="access-mode-private"
                        class="access-mode-card"
                        :class="{ active: isPrivateMode }"
                        :aria-checked="isPrivateMode ? 'true' : 'false'"
                        @click="setAccessMode('private')"
                    >
                        <div class="d-flex align-items-center justify-content-between mb-1" style="gap: 8px;">
                            <span class="access-mode-title">{{ $t('editor.settings.organization.modePrivateTitle') }}</span>
                            <span class="access-mode-badge is-private">{{ $t('editor.settings.organization.modePrivateBadge') }}</span>
                        </div>
                        <small class="text-muted d-block">{{ $t('editor.settings.organization.modePrivateDesc') }}</small>
                    </button>

                    <button
                        type="button"
                        role="radio"
                        data-test="access-mode-public"
                        class="access-mode-card"
                        :class="{ active: !isPrivateMode }"
                        :aria-checked="!isPrivateMode ? 'true' : 'false'"
                        @click="setAccessMode('public')"
                    >
                        <div class="d-flex align-items-center justify-content-between mb-1" style="gap: 8px;">
                            <span class="access-mode-title">{{ $t('editor.settings.organization.modePublicTitle') }}</span>
                            <span class="access-mode-badge is-public">{{ $t('editor.settings.organization.modePublicBadge') }}</span>
                        </div>
                        <small class="text-muted d-block">{{ $t('editor.settings.organization.modePublicDesc') }}</small>
                    </button>
                </div>
            </div>

            <!-- PUBLIC MODE: Anyone can respond (not limited to MFU domain); login & single-response limit live in Response Settings below -->
            <div v-if="!isPrivateMode" data-test="public-access-panel">
                <div data-test="public-open-info" class="info-hint mb-0">
                    <CIcon name="cil-info" size="lg" class="mr-3 text-info flex-shrink-0" />
                    <small class="mb-0 font-weight-medium">
                        {{ $t('editor.settings.organization.publicOpenInfo') }}
                    </small>
                </div>

                <div v-if="preservedPrivateCount > 0" data-test="public-preserved-hint" class="info-hint mt-3 mb-0">
                    <CIcon name="cil-info" size="lg" class="mr-3 text-info flex-shrink-0" />
                    <small class="mb-0 font-weight-medium">
                        {{ $t('editor.settings.organization.publicPreservedHint', { count: preservedPrivateCount }) }}
                    </small>
                </div>
            </div>

            <!-- PRIVATE MODE: Org / Bound Role / Unified User & Email Controls (collectEmail stays enabled automatically) -->
            <div v-else data-test="private-access-panel">
            <!-- Selected Organizations List -->
            <div class="mb-4">
                <label class="mb-3 font-weight-bold ">{{ $t('editor.settings.organization.selectedOrgs') }}</label>
                <div class="org-list">
                    <span v-for="(orgId, index) in settings.organization" :key="index" class="badge-custom">
                        {{ getOrgName(orgId) }}
                        <span class="ml-2 delete-icon-wrapper" @click.stop="removeOrganization(index)" :title="$t('editor.settings.access.remove')">
                            <CIcon name="cil-x" size="sm" class="delete-icon" />
                        </span>
                    </span>
                    <div v-if="!settings.organization || settings.organization.length === 0" class="text-muted small">
                        {{ $t('editor.settings.organization.noOrgs') }}
                    </div>
                </div>
            </div>

            <!-- Organization Selection Section -->
            <div class="mb-4">
                <h6 class="font-weight-bold mb-3">{{ $t('editor.settings.organization.canResponse') }}</h6>

                <CRow>
                    <CCol md="10" class="mb-3">
                        <label class="mb-2 font-weight-bold small">{{ $t('editor.settings.organization.name') }}</label>
                        <v-select 
                            ref="orgSelect"
                            :options="filteredOrganizationOptions" 
                            v-model="selectedOrgId" 
                            multiple
                            :close-on-select="false"
                            :filterable="false"
                            :reduce="org => org.value"
                            :placeholder="$t('editor.settings.organization.selectPlaceholder')"
                            class="form-select-custom"
                            @close="orgSearchQuery = ''"
                        >
                            <template #list-header>
                                <li class="vs-dropdown-search-wrap" @click.stop>
                                    <input
                                        v-model="orgSearchQuery"
                                        type="text"
                                        class="vs-dropdown-search-input"
                                        :placeholder="$t('common.search') || 'Search...'"
                                        @mousedown.stop="keepSelectOpen('orgSelect')"
                                        @keydown.stop
                                    />
                                </li>
                            </template>
                        </v-select>
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 12px;"
                            class="font-weight-bold mt-0 mt-md-4" @click="addOrganization">
                            {{ $t('editor.settings.access.add') }}
                        </CButton>
                    </CCol>
                </CRow>

                <!-- Info Hint -->
                <div class="info-hint mb-3">
                    <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                    <h6 class="mb-0 " v-html="$t('editor.settings.organization.generalHint')"></h6>
                </div>

                <!-- Nested Role / Position Constraint Bound Under Selected Organizations -->
                <div class="org-bound-role-panel mt-3 mb-2" data-test="org-bound-role-panel">
                    <div class="d-flex flex-wrap align-items-center justify-content-between mb-3" style="gap: 8px;">
                        <label class="mb-0 font-weight-bold text-dark">
                            {{ $t('editor.settings.organization.allowedRoles') }}
                        </label>
                        <div v-if="hasSelectedOrganizations" class="d-flex flex-wrap align-items-center" style="gap: 6px;">
                            <span class="small text-muted font-weight-bold">{{ $t('editor.settings.organization.roleScopeActivePrefix') }}</span>
                            <span v-for="(orgLabel, oIdx) in selectedOrganizationNames" :key="'scope-org-' + oIdx" class="role-scope-chip">
                                {{ orgLabel }}
                            </span>
                        </div>
                    </div>

                    <div v-if="!hasSelectedOrganizations" data-test="role-requires-org-hint" class="org-role-locked-hint">
                        <CIcon name="cil-lock-locked" size="lg" class="mr-2 flex-shrink-0 text-muted" />
                        <span class="small text-muted font-weight-bold">
                            {{ $t('editor.settings.organization.roleRequiresOrgHint') }}
                        </span>
                    </div>

                    <template v-else>
                        <div class="org-list bg-white mb-3">
                            <span v-for="(roleRef, index) in (settings.settings ? settings.settings.allowedRoles : [])" :key="'role-' + index" class="badge-custom border" data-test="allowed-role-chip">
                                {{ getRoleTitle(roleRef) }}
                                <span class="ml-2 delete-icon-wrapper" @click.stop="removeRole(index)" :title="$t('editor.settings.access.remove')">
                                    <CIcon name="cil-x" size="sm" class="delete-icon" />
                                </span>
                            </span>
                            <div v-if="!settings.settings || !settings.settings.allowedRoles || settings.settings.allowedRoles.length === 0" class="text-muted small my-auto">
                                {{ $t('editor.settings.organization.noRoles') }}
                            </div>
                        </div>

                        <h6 class="font-weight-bold mb-2">{{ $t('editor.settings.organization.specifyRole') }}</h6>
                        <CRow>
                            <CCol md="10" class="mb-3">
                                <label class="mb-2 font-weight-bold small">{{ $t('editor.settings.organization.rolePlaceholder') }}</label>
                                <v-select
                                    ref="roleSelect"
                                    :options="filteredRoleOptions"
                                    v-model="newRoleId"
                                    multiple
                                    :close-on-select="false"
                                    :filterable="false"
                                    :reduce="role => role.value"
                                    :placeholder="$t('editor.settings.organization.rolePlaceholder')"
                                    class="form-select-custom bg-white"
                                    @close="roleSearchQuery = ''"
                                >
                                    <template #list-header>
                                        <li class="vs-dropdown-search-wrap" @click.stop>
                                            <input
                                                v-model="roleSearchQuery"
                                                type="text"
                                                class="vs-dropdown-search-input"
                                                :placeholder="$t('common.search') || 'Search...'"
                                                @mousedown.stop="keepSelectOpen('roleSelect')"
                                                @keydown.stop
                                            />
                                        </li>
                                    </template>
                                </v-select>
                            </CCol>
                            <CCol md="2" class="mb-3">
                                <CButton color="primary" block style="height: 45px; border-radius: 12px;"
                                    data-test="add-role-btn"
                                    class="font-weight-bold mt-0 mt-md-4" @click="addRole">
                                    {{ $t('editor.settings.access.add') }}
                                </CButton>
                            </CCol>
                        </CRow>

                        <div class="info-hint mb-0">
                            <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                            <h6 class="mb-0" v-html="$t('editor.settings.organization.roleHint')"></h6>
                        </div>
                    </template>
                </div>
            </div>

            <hr class="my-4" />

            <!-- Selected Users & Emails List (Consolidated Internal + External) -->
            <div class="mb-4 mt-4">
                <label class="mb-3 font-weight-bold">{{ $t('editor.settings.organization.allowedEmails') }}</label>
                <div class="org-list">
                    <span v-for="(userRef, index) in (settings.settings ? settings.settings.allowedUser : [])" :key="'user-' + index" class="badge-custom border" data-test="allowed-user-chip">
                        {{ getUserName(userRef) }}
                        <span class="ml-2 delete-icon-wrapper" @click.stop="removeUser(index)" :title="$t('editor.settings.access.remove')">
                            <CIcon name="cil-x" size="sm" class="delete-icon" />
                        </span>
                    </span>
                    <span v-for="(email, index) in allowedEmailList" :key="'ext-email-' + email" class="badge-custom border external-email-chip" data-test="external-email-chip">
                        <CIcon name="cil-envelope-closed" size="sm" class="mr-1 text-primary" />
                        <span>{{ email }}</span>
                        <span class="ml-2 delete-icon-wrapper" @click.stop="removeAllowedEmail(index)" :title="$t('editor.settings.access.remove')">
                            <CIcon name="cil-x" size="sm" class="delete-icon" />
                        </span>
                    </span>
                    <div v-if="(!settings.settings || !settings.settings.allowedUser || settings.settings.allowedUser.length === 0) && allowedEmailList.length === 0" class="text-muted small my-auto">
                        {{ $t('editor.settings.organization.noEmails') }}
                    </div>
                </div>
            </div>

            <!-- Unified University User + External Email Tokenized Input -->
            <div class="mb-4">
                <h6 class="font-weight-bold mb-1">{{ $t('editor.settings.organization.specifyUser') }}</h6>
                <p class="text-muted small mb-3">{{ $t('editor.settings.organization.specifyUserDesc') }}</p>

                <CRow>
                    <CCol md="10" class="mb-3">
                        <label class="mb-2 font-weight-bold small text-muted d-block">{{ $t('editor.settings.organization.emailPlaceholder') }}</label>
                        <UserEmailTokenInput
                            ref="allowedPeopleTokenInput"
                            v-model="pendingAllowedPeople"
                            :users="users"
                            :excluded-user-ids="savedAllowedUserIds"
                            :excluded-emails="savedAllowedUserEmails"
                            :placeholder="$t('editor.settings.organization.peopleFreetextPlaceholder')"
                            :add-more-placeholder="$t('editor.settings.access.addMorePlaceholder')"
                            :error.sync="allowedPeopleError"
                            invalid-error-key="editor.settings.organization.invalidEmailsError"
                            chip-box-test-id="allowed-user-chip-box"
                            pending-chip-test-id="pending-respondent-chip"
                            remove-chip-test-id="remove-pending-respondent-chip"
                            input-test-id="allowed-user-email-input"
                            suggestions-test-id="allowed-user-suggestions"
                            suggestion-item-test-id="allowed-user-suggestion-item"
                            manual-option-test-id="allowed-user-manual-option"
                            already-added-hint-test-id="allowed-user-already-added-hint"
                            no-match-hint-test-id="allowed-user-no-match-hint"
                            error-test-id="allowed-user-email-error"
                            @submit="addAllowedPeople"
                        />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <label class="mb-2 font-weight-bold small d-none d-md-block" aria-hidden="true">&nbsp;</label>
                        <CButton
                            color="primary"
                            block
                            style="height: 45px; border-radius: 12px;"
                            data-test="add-allowed-people-btn"
                            class="font-weight-bold"
                            @click="addAllowedPeople"
                        >
                            {{ $t('editor.settings.access.add') }}
                        </CButton>
                    </CCol>
                </CRow>
            </div>

            <!-- Info Hint -->
            <div class="info-hint mb-2">
                <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                <h6 class="mb-0 " v-html="$t('editor.settings.organization.userHint')"></h6>
            </div>
            </div>

        </CCardBody>
    </CCard>
</template>

<script>
import { mapGetters } from 'vuex'
import localeMixin from '@/mixins/localeMixin'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { normalizeAllowedEmails, resolveFormAccessMode } from '@/projects/utils/formPolicy'
import UserEmailTokenInput from './UserEmailTokenInput.vue'

export default {
    name: 'OrganizationControl',
    mixins: [localeMixin],
    components: {
        vSelect,
        UserEmailTokenInput
    },
    props: {
        settings: {
            type: Object,
            required: true
        },
        embedded: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            selectedOrgId: [],
            newRoleId: [],
            pendingAllowedPeople: [],
            allowedPeopleError: '',
            orgSearchQuery: '',
            roleSearchQuery: ''
        }
    },
    computed: {
        ...mapGetters('Organizations', ['organizations']),
        ...mapGetters('User', ['users']),
        ...mapGetters('Roles', ['roles']),
        currentAccessMode() {
            return resolveFormAccessMode(this.settings);
        },
        isPrivateMode() {
            return this.currentAccessMode === 'private';
        },
        preservedPrivateCount() {
            const orgCount = Array.isArray(this.settings && this.settings.organization)
                ? this.settings.organization.filter(Boolean).length
                : 0;
            const s = (this.settings && this.settings.settings) || {};
            const roleCount = orgCount > 0 && Array.isArray(s.allowedRoles) ? s.allowedRoles.filter(Boolean).length : 0;
            const userCount = Array.isArray(s.allowedUser) ? s.allowedUser.filter(Boolean).length : 0;
            const emailCount = normalizeAllowedEmails(s.allowedEmails).length;
            return orgCount + roleCount + userCount + emailCount;
        },
        allowedEmailList() {
            return normalizeAllowedEmails(this.settings.settings && this.settings.settings.allowedEmails);
        },
        hasSelectedOrganizations() {
            return Array.isArray(this.settings.organization) && this.settings.organization.length > 0;
        },
        selectedOrganizationNames() {
            if (!Array.isArray(this.settings.organization)) return [];
            return this.settings.organization.map(orgRef => this.getOrgName(orgRef)).filter(Boolean);
        },
        roleOptions() {
            if (!this.roles || !Array.isArray(this.roles)) return [];
            const addedRoleIds = new Set(((this.settings.settings && this.settings.settings.allowedRoles) || []).map(r => String((r && r._id) || r)));
            return this.roles
                .filter(r => !addedRoleIds.has(String(r._id)))
                .map(r => ({
                    label: this.getLang(r.title) || (r.title && r.title[0] ? r.title[0].value : 'Role'),
                    value: r._id
                }));
        },
        savedAllowedUserIds() {
            const list = (this.settings.settings && Array.isArray(this.settings.settings.allowedUser))
                ? this.settings.settings.allowedUser
                : [];
            return list
                .filter(Boolean)
                .map(u => String(typeof u === 'object' ? (u._id || u.value) : u))
                .filter(Boolean);
        },
        savedAllowedUserEmails() {
            const emails = new Set(this.allowedEmailList);
            const usersList = Array.isArray(this.users) ? this.users : [];
            const list = (this.settings.settings && Array.isArray(this.settings.settings.allowedUser))
                ? this.settings.settings.allowedUser
                : [];
            list.forEach(u => {
                if (!u) return;
                if (typeof u === 'object' && typeof u.email === 'string' && u.email.trim()) {
                    emails.add(u.email.trim().toLowerCase());
                    return;
                }
                const uid = String(typeof u === 'object' ? (u._id || u.value) : u);
                const matched = usersList.find(x => x && String(x._id) === uid);
                if (matched && typeof matched.email === 'string' && matched.email.trim()) {
                    emails.add(matched.email.trim().toLowerCase());
                }
            });
            return Array.from(emails);
        },
        organizationOptions() {
            if (!this.organizations || this.organizations.length === 0) return [];
            const addedOrgIds = new Set((this.settings.organization || []).map(o => String((o && o._id) || o)));
            return this.organizations
                .filter(o => !addedOrgIds.has(String(o._id)))
                .map(o => {
                    return { 
                        label: this.getLang(o.title), 
                        value: o._id 
                    };
                });
        },
        filteredOrganizationOptions() {
            const q = (this.orgSearchQuery || '').trim().toLowerCase();
            if (!q) return this.organizationOptions;
            return this.organizationOptions.filter(o => (o.label || '').toLowerCase().includes(q));
        },
        filteredRoleOptions() {
            const q = (this.roleSearchQuery || '').trim().toLowerCase();
            if (!q) return this.roleOptions;
            return this.roleOptions.filter(o => (o.label || '').toLowerCase().includes(q));
        }
    },
    methods: {
        keepSelectOpen(refName) {
            const sel = this.$refs[refName];
            if (sel) sel.mousedown = true;
        },
        getUserName(userRef) {
            if (!userRef) return 'Unknown';
            if (typeof userRef === 'object' && userRef.email) return userRef.name || userRef.email;
            if (!this.users) return userRef;
            const u = this.users.find(x => String(x._id) === String(userRef));
            return u ? (u.name || u.email) : userRef;
        },
        getOrgName(orgId) {
            if (!orgId) return '...';

            const rawId = (typeof orgId === 'object' && orgId !== null)
                ? (orgId._id || orgId.id || orgId.value || orgId)
                : orgId;

            // Always try to find full org object from organizations list
            let org = null;
            if (this.organizations && Array.isArray(this.organizations)) {
                org = this.organizations.find(o => String(o._id) === String(rawId) || String(o.id) === String(rawId));
            }

            // Fallback to orgId itself if it's already an object with title/name
            if (!org && typeof orgId === 'object' && orgId !== null) {
                org = orgId;
            }

            if (!org) {
                if (typeof rawId === 'string') return rawId;
                return 'Unknown Org';
            }

            // Extract Name based on language/title structure
            const locale = (this.$i18n && this.$i18n.locale) ? this.$i18n.locale.toLowerCase() : 'en';
            if (Array.isArray(org.title)) {
                const match = org.title.find(t => t && t.key && t.key.toLowerCase() === locale);
                if (match && match.value) return match.value;
                const en = org.title.find(t => t && t.key === 'en');
                if (en && en.value) return en.value;
                const th = org.title.find(t => t && t.key === 'th');
                if (th && th.value) return th.value;
                return org.title[0] ? org.title[0].value : 'Unnamed';
            }
            return org.name || org.title || (org._id ? String(org._id) : String(rawId || 'Unnamed'));
        },
        setAccessMode(mode) {
            if (!this.settings.settings) {
                this.$set(this.settings, 'settings', {});
            }
            const target = mode === 'private' ? 'private' : 'public';
            if (this.currentAccessMode === target && this.settings.settings.accessMode === target) {
                return;
            }

            if (target === 'private') {
                this.$set(this.settings.settings, 'accessMode', 'private');
                this.$set(this.settings.settings, 'collectEmail', true);
            } else {
                this.$set(this.settings.settings, 'accessMode', 'public');
                this.$set(this.settings.settings, 'collectEmail', Boolean(this.settings.settings.requireLogin));
            }
            this.triggerAutoSave();
        },
        addOrganization() {
            if (!this.selectedOrgId || this.selectedOrgId.length === 0) return;

            // Initialize settings.organization if it doesn't exist
            if (!this.settings.organization) {
                this.$set(this.settings, 'organization', []);
            }

            this.selectedOrgId.forEach(orgId => {
                if (!this.settings.organization.includes(orgId)) {
                    this.settings.organization.push(orgId);
                }
            });

            this.selectedOrgId = [];
            this.triggerAutoSave();
        },
        removeOrganization(index) {
            this.settings.organization.splice(index, 1);
            if ((!this.settings.organization || this.settings.organization.length === 0) && this.settings.settings) {
                if (Array.isArray(this.settings.settings.allowedRoles) && this.settings.settings.allowedRoles.length > 0) {
                    this.$set(this.settings.settings, 'allowedRoles', []);
                }
                this.newRoleId = [];
            }
            this.triggerAutoSave();
        },
        addAllowedPeople() {
            const { candidates, invalidEntries } = this.$refs.allowedPeopleTokenInput
                ? this.$refs.allowedPeopleTokenInput.consumeCandidatesForSubmit()
                : { candidates: [...this.pendingAllowedPeople], invalidEntries: [] };

            if (candidates.length === 0 && invalidEntries.length === 0) {
                this.allowedPeopleError = '';
                return;
            }

            if (!this.settings.settings) {
                this.$set(this.settings, 'settings', {});
            }
            if (!Array.isArray(this.settings.settings.allowedUser)) {
                this.$set(this.settings.settings, 'allowedUser', []);
            }

            let addedAny = false;
            const currentEmails = normalizeAllowedEmails(this.settings.settings.allowedEmails);
            const emailSet = new Set(currentEmails);

            candidates.forEach(candidate => {
                if (candidate && candidate.userId) {
                    const userId = String(candidate.userId);
                    const exists = this.settings.settings.allowedUser.some(u => {
                        const id = String(typeof u === 'object' ? (u._id || u.value) : u);
                        return id === userId;
                    });
                    if (!exists) {
                        const fullUser = Array.isArray(this.users) ? this.users.find(u => String(u._id) === userId) : null;
                        this.settings.settings.allowedUser.push(fullUser || userId);
                        addedAny = true;
                    }
                } else if (candidate && candidate.email) {
                    const normalized = String(candidate.email).trim().toLowerCase();
                    if (normalized && !emailSet.has(normalized)) {
                        emailSet.add(normalized);
                        currentEmails.push(normalized);
                        addedAny = true;
                    }
                }
            });

            if (addedAny) {
                this.$set(this.settings.settings, 'allowedEmails', normalizeAllowedEmails(currentEmails));
                this.triggerAutoSave();
            }

            if (invalidEntries.length > 0) {
                this.allowedPeopleError = this.$t('editor.settings.organization.invalidEmailsError', {
                    emails: invalidEntries.join(', ')
                });
            } else {
                this.allowedPeopleError = '';
            }
        },
        removeUser(index) {
            if (this.settings.settings && Array.isArray(this.settings.settings.allowedUser)) {
                this.settings.settings.allowedUser.splice(index, 1);
                this.triggerAutoSave();
            }
        },
        removeAllowedEmail(index) {
            const current = this.allowedEmailList.slice();
            if (index < 0 || index >= current.length) return;
            current.splice(index, 1);
            if (!this.settings.settings) {
                this.$set(this.settings, 'settings', {});
            }
            this.$set(this.settings.settings, 'allowedEmails', current);
            this.triggerAutoSave();
        },
        addRole() {
            if (!this.hasSelectedOrganizations || !this.newRoleId || this.newRoleId.length === 0) return;

            if (!this.settings.settings) {
                this.$set(this.settings, 'settings', {});
            }
            if (!this.settings.settings.allowedRoles) {
                this.$set(this.settings.settings, 'allowedRoles', []);
            }

            this.newRoleId.forEach(val => {
                const roleId = String(typeof val === 'object' ? (val.value || val._id) : val);

                const exists = this.settings.settings.allowedRoles.some(r => {
                    const id = String(typeof r === 'object' ? (r._id || r.value) : r);
                    return id === roleId;
                });

                if (!exists) {
                    const fullRole = Array.isArray(this.roles) ? this.roles.find(r => String(r._id) === roleId) : null;
                    this.settings.settings.allowedRoles.push(fullRole || roleId);
                }
            });

            this.newRoleId = [];
            this.triggerAutoSave();
        },
        removeRole(index) {
            if (this.settings.settings && Array.isArray(this.settings.settings.allowedRoles)) {
                this.settings.settings.allowedRoles.splice(index, 1);
                this.triggerAutoSave();
            }
        },
        getRoleTitle(roleRef) {
            if (!roleRef) return 'Unknown';
            if (typeof roleRef === 'object' && roleRef.title) {
                return this.getLang(roleRef.title) || (roleRef.title[0] ? roleRef.title[0].value : 'Role');
            }
            if (!this.roles) return String(roleRef);
            const r = this.roles.find(x => String(x._id) === String(roleRef));
            return r ? (this.getLang(r.title) || (r.title[0] ? r.title[0].value : String(roleRef))) : String(roleRef);
        },
        async triggerAutoSave() {
            this.$emit('auto-save');
        },
        getUserName(userRef) {
            if (!userRef) return 'Unknown';
            if (typeof userRef === 'object') return userRef.name || userRef.fullname || userRef.email || 'Unknown';
            if (!this.users) return userRef;
            const u = this.users.find(x => String(x._id) === String(userRef));
            return u ? (u.name || u.fullname || u.email) : userRef;
        }
    },
    mounted() {
        this.$store.dispatch('Organizations/getAll');
        this.$store.dispatch('User/getAll');
        if (!this.settings.organization) {
            this.$set(this.settings, 'organization', []);
        }
        if (!this.settings.settings) {
            this.$set(this.settings, 'settings', {});
        }
        if (!this.settings.settings.allowedUser) {
            this.$set(this.settings.settings, 'allowedUser', []);
        }
        if (!this.settings.settings.allowedRoles) {
            this.$set(this.settings.settings, 'allowedRoles', []);
        }
        this.$store.dispatch('Roles/getAll');
    }
}
</script>

<style scoped>
.rounded-20 {
    border-radius: 20px !important;
    overflow: hidden;
}

.form-select-custom {
    min-height: 45px;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
}

/* v-select custom styling to match system */
.form-select-custom.v-select >>> .vs__dropdown-toggle {
    min-height: 45px !important;
    background-color: #f8f9fa !important;
    border-radius: 12px !important;
    border: 1px solid #e2e8f0 !important;
    padding: 2px 0.5rem;
}

.form-select-custom.v-select >>> .vs__selected-options {
    padding: 0;
    max-height: 120px;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px 0;
}

/* Hide scrollbar but keep functionality */
.form-select-custom.v-select >>> .vs__selected-options::-webkit-scrollbar {
    display: none;
}

.form-select-custom.v-select >>> .vs__selected {
    background-color: #f1f5f9 !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    padding: 2px 8px !important;
    margin: 0 !important;
    font-size: 0.85rem !important;
    color: #475569 !important;
    max-width: 250px !important;
    display: inline-flex;
    align-items: center;
}

.form-select-custom.v-select >>> .vs__deselect {
    margin-left: 4px !important;
    transform: scale(0.85);
    fill: #94a3b8 !important;
}

.form-select-custom.v-select >>> .vs__search {
    margin: 0;
    padding: 0 0.25rem;
    min-height: 38px;
    flex-grow: 1;
}

.form-select-custom.v-select.vs--open {
    position: relative;
    z-index: 1050;
}

.form-select-custom.v-select.vs--open >>> .vs__dropdown-toggle {
    border-color: #6366f1 !important;
    background-color: #fff !important;
}

.form-select-custom.v-select >>> .vs__dropdown-menu {
    max-height: 225px !important;
    overflow-y: auto !important;
}

.form-select-custom.v-select >>> .vs-dropdown-search-wrap {
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
    background-color: #fff;
    position: sticky;
    top: 0;
    z-index: 2;
}

.form-select-custom.v-select >>> .vs-dropdown-search-input {
    width: 100%;
    height: 34px;
    padding: 4px 10px;
    font-size: 0.875rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background-color: #f8fafc;
    outline: none;
}

.form-select-custom.v-select >>> .vs-dropdown-search-input:focus {
    border-color: #8c1515;
    background-color: #fff;
}

.form-select-custom:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.external-email-chip {
    background-color: #eff6ff;
    border-color: #bfdbfe !important;
    color: #1e3a8a;
}

.org-bound-role-panel {
    margin-left: 8px;
    padding: 18px 20px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #8c1515;
    background-color: #f8fafc;
}

.role-scope-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #8c1515;
    font-size: 0.8125rem;
    font-weight: 600;
}

.org-role-locked-hint {
    display: flex;
    align-items: center;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px dashed #cbd5e1;
    background-color: #ffffff;
}

.btn-custom {
    height: 45px;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.btn-custom:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.org-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    min-height: 50px;
}

.info-hint {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #f0f7ff;
    border-radius: 12px;
    border: 1px solid #bfdbfe;
    color: #1e40af;
}

.badge-custom {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    overflow-wrap: anywhere;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    background-color: #f1f5f9;
    color: #475569;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
}

.badge-custom:hover {
    background-color: #e2e8f0;
    color: #1e293b;
}

.delete-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.delete-icon-wrapper:hover {
    background-color: #fee2e2;
    color: #ef4444;
    transform: scale(1.1);
}

.delete-icon {
    font-size: 10px;
}

.list-group-item {
    transition: all 0.3s ease;
}

.list-group-item:hover {
    background-color: #e8eef5 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.border-bottom-soft {
    border-bottom: 1px solid #f1f5f9;
}

.access-mode-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

@media (max-width: 767.98px) {
    .access-mode-grid {
        grid-template-columns: 1fr;
    }
}

.access-mode-card {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    text-align: left;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1.5px solid #e2e8f0;
    background-color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
}

.access-mode-card:hover {
    border-color: #cbd5e1;
    background-color: #f8fafc;
}

.access-mode-card.active {
    border-color: #8c1515;
    background-color: #fff5f5;
    box-shadow: 0 0 0 1px rgba(140, 21, 21, 0.14);
}

.access-mode-title {
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1.35;
    color: #1e293b;
}

.access-mode-card.active .access-mode-title {
    color: #8c1515;
}

.access-mode-badge {
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
    background-color: #f1f5f9;
    color: #475569;
    white-space: nowrap;
}

.access-mode-badge.is-public {
    background-color: #eff6ff;
    color: #1d4ed8;
}

.access-mode-badge.is-private,
.access-mode-card.active .access-mode-badge {
    background-color: #fee2e2;
    color: #8c1515;
}
</style>
