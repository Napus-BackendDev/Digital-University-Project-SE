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
                        <CSelect :options="organizationOptions" :value="selectedOrgId" :placeholder="$t('editor.settings.organization.selectPlaceholder')"
                            class="form-select-custom" @update:value="(val) => { selectedOrgId = val; }" />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 8px;"
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
                        <CSelect 
                            :options="userOptions" 
                            :value="newUserId"
                            @update:value="(val) => { newUserId = val }"
                            :placeholder="$t('editor.settings.organization.emailPlaceholder')"
                            class="form-select-custom"
                        />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 8px;"
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

        </CCardBody>
    </CCard>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    name: 'OrganizationControl',
    props: {
        settings: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            selectedOrgId: null,
            newUserId: null
        }
    },
    computed: {
        ...mapGetters('Organizations', ['organizations']),
        ...mapGetters('User', ['users']),
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
                // Extract English title
                let label = 'Unknown Org';
                if (Array.isArray(o.title)) {
                    const en = o.title.find(t => t && t.key === 'en');
                    label = en ? en.value : (o.title[0] ? o.title[0].value : 'Unnamed');
                }
                return { label: label, value: o._id };
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

            // Check if orgId is already an object (populated by backend)
            let org = null;
            if (typeof orgId === 'object' && orgId !== null) {
                org = orgId;
            } else if (this.organizations) {
                // If it's an ID string/ObjectId, find it in the cached list
                org = this.organizations.find(o => (o._id === orgId || o.id === orgId));
            }

            // Fallback: If not found in memory but it's an object, return name or title
            if (!org) {
                if (typeof orgId === 'string') return orgId;
                return 'Unknown Org';
            }

            // Extract Name based on language/title structure
            if (Array.isArray(org.title)) {
                // Try to find English title first, or any first title available
                const en = org.title.find(t => t && t.key === 'en');
                if (en && en.value) return en.value;
                const th = org.title.find(t => t && t.key === 'th');
                if (th && th.value) return th.value;
                return org.title[0] ? org.title[0].value : 'Unnamed';
            }
            return org.name || org.title || (org._id ? String(org._id) : 'Unnamed');
        },
        addOrganization() {
            if (!this.selectedOrgId) return;

            // Initialize settings.organization if it doesn't exist
            if (!this.settings.organization) {
                this.$set(this.settings, 'organization', []);
            }

            if (this.settings.organization.includes(this.selectedOrgId)) {
                return;
            }
            this.settings.organization.push(this.selectedOrgId);
            this.selectedOrgId = null;
            this.triggerAutoSave();
        },
        removeOrganization(index) {
            this.settings.organization.splice(index, 1);
            this.triggerAutoSave();
        },
        addUser() {
            if (!this.newUserId) return;
            const userId = String(typeof this.newUserId === 'object' ? (this.newUserId.value || this.newUserId._id) : this.newUserId);

            if (!this.settings.settings) {
                this.$set(this.settings, 'settings', {});
            }
            if (!this.settings.settings.allowedUser) {
                this.$set(this.settings.settings, 'allowedUser', []);
            }

            const exists = this.settings.settings.allowedUser.some(u => {
                const id = String(typeof u === 'object' ? (u._id || u.value) : u);
                return id === userId;
            });
            if (exists) {
                this.newUserId = null;
                return;
            }

            const fullUser = Array.isArray(this.users) ? this.users.find(u => String(u._id) === userId) : null;
            this.settings.settings.allowedUser.push(fullUser || userId);
            this.newUserId = null;
            this.triggerAutoSave();
        },
        removeUser(index) {
            if (this.settings.settings && Array.isArray(this.settings.settings.allowedUser)) {
                this.settings.settings.allowedUser.splice(index, 1);
                this.triggerAutoSave();
            }
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
        this.$store.dispatch('User/getAll');
    }
}
</script>

<style scoped>
.rounded-20 {
    border-radius: 20px !important;
    overflow: hidden;
}

.form-select-custom {
    height: 45px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
}

.form-select-custom:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn-custom {
    height: 45px;
    border-radius: 8px;
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
    border-radius: 10px;
    border-left: 4px solid #3b82f6;
    color: #1e40af;
}

.badge-custom {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
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
