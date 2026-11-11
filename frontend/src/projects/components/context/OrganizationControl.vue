<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">{{ $t('editor.settings.organization.title') }}</h5>

            <!-- <div class="mb-4">
                <h6 class="font-weight-bold mb-3">Organization CanEdit</h6>
                <CRow>
                    <CCol md="5" class="mb-3">
                        <label class="mb-2 font-weight-bold small">Organization Name</label>
                        <CSelect :options="organizationOptions" :value="orgData.name" placeholder="Select organization"
                            class="form-select-custom" @update:value="(val) => { orgData.name = val; triggerAutoSave(); }" />
                    </CCol>
                    <CCol md="5" class="mb-3">
                        <label class="mb-2 font-weight-bold small">Select Department</label>
                        <CSelect :options="departmentOptions" :value="selectedDepartment"
                            placeholder="Choose a department" class="form-select-custom" @update:value="selectDepartment" />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block class="btn-custom font-weight-bold mt-4"
                            @click="addSelectedDepartment">
                            Add
                        </CButton>
                    </CCol>
                </CRow>
            </div>

            <hr class="my-4" /> -->

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
                            :options="organizationOptions" 
                            v-model="selectedOrgId" 
                            multiple
                            :close-on-select="false"
                            :reduce="org => org.value"
                            :placeholder="$t('editor.settings.organization.selectPlaceholder')"
                            class="form-select-custom" 
                        />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 12px;"
                            class="font-weight-bold mt-4" @click="addOrganization">
                            {{ $t('editor.settings.access.add') }}
                        </CButton>
                    </CCol>
                </CRow>

                <!-- Info Hint -->
                <div class="info-hint mb-3">
                    <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                    <h6 class="mb-0 " v-html="$t('editor.settings.organization.generalHint')"></h6>
                </div>
            </div>

            <!-- Selected Emails List -->
            <div class="mb-4 mt-4">
                <label class="mb-3 font-weight-bold">{{ $t('editor.settings.organization.allowedEmails') }}</label>
                <div class="org-list">
                    <span v-for="(userRef, index) in (settings.settings ? settings.settings.allowedUser : [])" :key="'user-' + index" class="badge-custom border">
                        {{ getUserName(userRef) }}
                        <span class="ml-2 delete-icon-wrapper" @click.stop="removeUser(index)" :title="$t('editor.settings.access.remove')">
                            <CIcon name="cil-x" size="sm" class="delete-icon" />
                        </span>
                    </span>
                    <div v-if="!settings.settings || !settings.settings.allowedUser || settings.settings.allowedUser.length === 0" class="text-muted small my-auto">
                        {{ $t('editor.settings.organization.noEmails') }}
                    </div>
                </div>
            </div>

            <!-- Personal Email Selection Section -->
            <div class="mb-4">
                <h6 class="font-weight-bold mb-3">{{ $t('editor.settings.organization.specifyUser') }}</h6>

                <CRow>
                    <CCol md="10" class="mb-3">
                        <label class="mb-2 font-weight-bold small">{{ $t('editor.settings.organization.emailPlaceholder') }}</label>
                        <v-select 
                            :options="userOptions" 
                            v-model="newUserId"
                            multiple
                            :close-on-select="false"
                            :reduce="user => user.value"
                            :placeholder="$t('editor.settings.organization.emailPlaceholder')"
                            class="form-select-custom"
                        />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 12px;"
                            class="font-weight-bold mt-4" @click="addUser">
                            {{ $t('editor.settings.access.add') }}
                        </CButton>
                    </CCol>
                </CRow>
            </div>

            <!-- Info Hint -->
            <div class="info-hint mb-3">
                <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                <h6 class="mb-0 " v-html="$t('editor.settings.organization.userHint')"></h6>
            </div>

            <!-- Selected Roles List -->
            <div class="mb-4 mt-4">
                <label class="mb-3 font-weight-bold">{{ $t('editor.settings.organization.allowedRoles') }}</label>
                <div class="org-list">
                    <span v-for="(roleRef, index) in (settings.settings ? settings.settings.allowedRoles : [])" :key="'role-' + index" class="badge-custom border">
                        <CIcon name="cil-user" size="sm" class="mr-2 text-primary" />
                        {{ getRoleTitle(roleRef) }}
                        <span class="ml-2 delete-icon-wrapper" @click.stop="removeRole(index)" :title="$t('editor.settings.access.remove')">
                            <CIcon name="cil-x" size="sm" class="delete-icon" />
                        </span>
                    </span>
                    <div v-if="!settings.settings || !settings.settings.allowedRoles || settings.settings.allowedRoles.length === 0" class="text-muted small my-auto">
                        {{ $t('editor.settings.organization.noRoles') }}
                    </div>
                </div>
            </div>

            <!-- Role Selection Section -->
            <div class="mb-4">
                <h6 class="font-weight-bold mb-3">{{ $t('editor.settings.organization.specifyRole') }}</h6>

                <CRow>
                    <CCol md="10" class="mb-3">
                        <label class="mb-2 font-weight-bold small">{{ $t('editor.settings.organization.rolePlaceholder') }}</label>
                        <v-select 
                            :options="roleOptions" 
                            v-model="newRoleId"
                            multiple
                            :close-on-select="false"
                            :reduce="role => role.value"
                            :placeholder="$t('editor.settings.organization.rolePlaceholder')"
                            class="form-select-custom"
                        />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 12px;"
                            class="font-weight-bold mt-4" @click="addRole">
                            {{ $t('editor.settings.access.add') }}
                        </CButton>
                    </CCol>
                </CRow>

                <!-- Role Info Hint -->
                <div class="info-hint mb-3">
                    <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                    <h6 class="mb-0 " v-html="$t('editor.settings.organization.roleHint')"></h6>
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

export default {
    name: 'OrganizationControl',
    mixins: [localeMixin],
    components: {
        vSelect
    },
    props: {
        settings: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            selectedOrgId: [],
            newUserId: [],
            newRoleId: []
        }
    },
    computed: {
        ...mapGetters('Organizations', ['organizations']),
        ...mapGetters('User', ['users']),
        ...mapGetters('Roles', ['roles']),
        roleOptions() {
            if (!this.roles || !Array.isArray(this.roles)) return [];
            return this.roles.map(r => ({
                label: this.getLang(r.title) || (r.title && r.title[0] ? r.title[0].value : 'Role'),
                value: r._id
            }));
        },
        userOptions() {
            if (!this.users || !Array.isArray(this.users)) return [];
            return this.users.map(u => ({
                label: `${u.name || u.fullname || u.email || 'Unknown'} <${u.email}>`,
                value: u._id
            }));
        },
        organizationOptions() {
            if (!this.organizations || this.organizations.length === 0) return [];
            return this.organizations.map(o => {
                return { 
                    label: this.getLang(o.title), 
                    value: o._id 
                };
            });
        }
    },
    methods: {
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
            this.triggerAutoSave();
        },
        addUser() {
            if (!this.newUserId || this.newUserId.length === 0) return;

            if (!this.settings.settings) {
                this.$set(this.settings, 'settings', {});
            }
            if (!this.settings.settings.allowedUser) {
                this.$set(this.settings.settings, 'allowedUser', []);
            }

            this.newUserId.forEach(val => {
                const userId = String(typeof val === 'object' ? (val.value || val._id) : val);

                const exists = this.settings.settings.allowedUser.some(u => {
                    const id = String(typeof u === 'object' ? (u._id || u.value) : u);
                    return id === userId;
                });

                if (!exists) {
                    const fullUser = Array.isArray(this.users) ? this.users.find(u => String(u._id) === userId) : null;
                    this.settings.settings.allowedUser.push(fullUser || userId);
                }
            });

            this.newUserId = [];
            this.triggerAutoSave();
        },
        removeUser(index) {
            if (this.settings.settings && Array.isArray(this.settings.settings.allowedUser)) {
                this.settings.settings.allowedUser.splice(index, 1);
                this.triggerAutoSave();
            }
        },
        addRole() {
            if (!this.newRoleId || this.newRoleId.length === 0) return;

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

.form-select-custom.v-select.vs--open >>> .vs__dropdown-toggle {
    border-color: #6366f1 !important;
    background-color: #fff !important;
}

.form-select-custom:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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
    border-left: 4px solid #3b82f6;
    color: #1e40af;
}

.badge-custom {
    display: inline-flex;
    align-items: center;
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
</style>
