<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">{{ $t('editor.settings.access.title') }}</h5>

            <!-- Selected Collaborators List -->
            <div class="mb-4">
                <label class="mb-3 font-weight-bold">{{ $t('editor.settings.access.selectedCollaborators') }}</label>
                <div class="org-list">
                    <span v-for="(collab, index) in settings.collaborator" :key="'collab-' + index" class="badge-custom border d-inline-flex align-items-center mb-2">
                        <span class="mr-2">{{ getUserName(collab.user) }}</span>
                        <span class="role-badge" :class="getRoleClass(collab.type)" style="text-transform: capitalize; margin: 0 5px;">{{ getRoleName(collab.type) }}</span>
                        <span class="ml-2 delete-icon-wrapper" @click.stop="removeCollaborator(index)" :title="$t('editor.settings.access.remove')">
                            <CIcon name="cil-x" size="sm" class="delete-icon" />
                        </span>
                    </span>
                    <div v-if="!settings.collaborator || !settings.collaborator.length" class="text-muted small my-auto">
                        {{ $t('editor.settings.access.noCollaborators') }}
                    </div>
                </div>
            </div>

            <!-- Collaborators Selection Section -->
            <div class="mb-4">
                <h6 class="font-weight-bold mb-3">{{ $t('editor.settings.access.collaborators') }}</h6>
                <p class="text-muted small mb-3">{{ $t('editor.settings.access.collaboratorsDesc') }}</p>

                <CRow>
                    <CCol md="6" class="mb-3">
                        <label class="mb-2 font-weight-bold small text-muted d-block">{{ $t('editor.settings.access.emailPlaceholder') }}</label>
                        <v-select 
                            :options="userOptions" 
                            v-model="selectedUser"
                            multiple
                            :close-on-select="false"
                            :reduce="user => user.value"
                            :placeholder="$t('editor.settings.access.emailPlaceholder')"
                            class="form-select-custom"
                        />
                    </CCol>
                    <CCol md="4" class="mb-3">
                        <label class="mb-2 font-weight-bold small text-muted d-block">{{ $t('editor.settings.access.role') || 'Role' }}</label>
                        <v-select 
                            :options="collaboratorOptions" 
                            v-model="newCollaborator.type"
                            :reduce="role => role.value"
                            class="form-select-custom"
                            :clearable="false"
                        />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <label class="mb-2 d-none d-md-block">&nbsp;</label>
                        <CButton color="primary" block style="height: 45px; border-radius: 8px;"
                            class="font-weight-bold" @click="addCollaborator">
                            {{ $t('editor.settings.access.add') }}
                        </CButton>
                    </CCol>
                </CRow>

                <!-- Permission Info Hint -->
                <div class="info-hint mt-3">
                    <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                    <div class="hint-content">
                        <div class="mb-1">
                            <span class="role-badge editor">{{ $t('editor.settings.access.editor') }}</span>
                            <span class="role-desc">: {{ $t('editor.settings.access.editorDesc') }}</span>
                        </div>
                        <div>
                            <span class="role-badge viewer">{{ $t('editor.settings.access.viewer') }}</span>
                            <span class="role-desc">: {{ $t('editor.settings.access.viewerDesc') }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
import { mapGetters } from 'vuex';
import localeMixin from '@/mixins/localeMixin'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

export default {
    name: 'AccessControl',
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
            selectedUser: [],
            newCollaborator: {
                type: null
            }
        }
    },
    watch: {
        collaboratorOptions: {
            handler(val) {
                if (val && val.length > 0 && !this.newCollaborator.type) {
                    this.newCollaborator.type = val[0].value;
                }
            },
            immediate: true
        }
    },
    created() {
        this.$store.dispatch('Setting/status/get');
        this.$store.dispatch('Setting/collaborator/get');
        this.$store.dispatch('User/getAll');

        if (!Array.isArray(this.settings.collaborator)) {
            this.$set(this.settings, 'collaborator', []);
        }
    },
    computed: {
        ...mapGetters('Setting/status', { statusItems: 'item' }),
        ...mapGetters('Setting/collaborator', { collaboratorItems: 'item' }),
        ...mapGetters('User', ['users']),


        userOptions() {
            if (!this.users || !Array.isArray(this.users)) return [];
            return this.users.map(u => ({
                label: `${u.name || u.fullname || u.email || 'Unknown'} <${u.email}>`,
                value: u.email,
                name: u.name || u.fullname || u.email
            }));
        },

        visionOptions() {
            if (!this.statusItems || !Array.isArray(this.statusItems)) return [];
            return this.statusItems.map(item => ({
                value: item._id,
                label: this.getLang(item.title)
            }));
        },
        collaboratorOptions() {
            if (!this.collaboratorItems || !Array.isArray(this.collaboratorItems)) return [];
            return this.collaboratorItems.map(item => ({
                value: item._id,
                label: this.getLang(item.title)
            }));
        },
        selectedControllId() {
            if (!this.settings || !this.settings.collaborator) return '';
            const type = this.settings.collaborator.type;
            return typeof type === 'object' && type !== null ? type._id : type;
        },
        currentStatusId() {
            if (!this.settings || !this.settings.status) return '';
            const status = this.settings.status;
            return typeof status === 'object' ? status._id : status;
        }
    },
    methods: {
        getUserName(userRef) {
            if (!userRef) return 'Unknown';
            if (typeof userRef === 'object' && userRef.email) return userRef.name || userRef.email;
            if (!this.users) return userRef;
            const u = this.users.find(x => x._id === userRef);
            return u ? (u.name || u.email) : userRef;
        },
        getRoleName(typeRef) {
            if (!typeRef) return '';
            const tid = typeof typeRef === 'object' ? typeRef._id : typeRef;
            const t = this.collaboratorItems ? this.collaboratorItems.find(x => x._id === tid) : null;
            return t ? this.getLang(t.title) : 'Viewer';
        },
        getRoleClass(typeRef) {
            const name = String(this.getRoleName(typeRef)).toLowerCase();
            return name.includes('edit') ? 'editor' : 'viewer';
        },
        onStatusChange(val) {
            const newId = typeof val === 'object' && val !== null ? val._id : val;
            if (newId && newId !== this.currentStatusId) {
                this.$set(this.settings, 'status', newId);
                this.triggerAutoSave();
            }
        },
        addCollaborator() {
            if (!this.selectedUser || this.selectedUser.length === 0 || !this.newCollaborator.type) return;

            if (!Array.isArray(this.settings.collaborator)) {
                this.$set(this.settings, 'collaborator', []);
            }

            this.selectedUser.forEach(email => {
                const userObj = this.users ? this.users.find(u => u.email === email) : null;
                if (!userObj) return;

                const exists = this.settings.collaborator.find(c => {
                    let uId = (c.user && c.user._id) ? c.user._id : c.user;
                    return String(uId) === String(userObj._id);
                });

                if (!exists) {
                    this.settings.collaborator.push({
                        user: userObj._id,
                        type: this.newCollaborator.type
                    });
                }
            });

            this.selectedUser = [];
            this.triggerAutoSave();
        },
        removeCollaborator(index) {
            if (Array.isArray(this.settings.collaborator)) {
                this.settings.collaborator.splice(index, 1);
                this.triggerAutoSave();
            }
        },
        async triggerAutoSave() {
            this.$emit('auto-save');
        }
    }
}
</script>

<style scoped>
.rounded-20 {
    border-radius: 20px !important;
    overflow: hidden;
}

.form-select-custom {
    min-height: 45px !important;
    background-color: #f8f9fa !important;
    border-radius: 8px !important;
    border: 1px solid #e2e8f0 !important;
    transition: all 0.3s ease;
    box-shadow: none !important;
}

.form-select-custom:focus-within {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
}

/* v-select custom styling to match system */
.form-select-custom.v-select >>> .vs__dropdown-toggle {
    min-height: 45px !important;
    background-color: #f8f9fa !important;
    border-radius: 8px !important;
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
    border-radius: 6px !important;
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

.badge-custom {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    background-color: #ffffff;
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
    width: 24px;
    height: 24px;
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

.info-hint {
    display: flex;
    align-items: flex-start;
    padding: 1rem 1.25rem;
    background-color: #f0f7ff;
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
    color: #1e40af;
}

.hint-content {
    display: flex;
    flex-direction: column;
}

.role-badge {
    font-weight: 800;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 6px;
    margin-right: 4px;
}

.role-badge.editor {
    background-color: #dbeafe;
    color: #1e40af;
}

.role-badge.viewer {
    background-color: #f1f5f9;
    color: #475569;
}

.role-desc {
    font-size: 0.875rem;
    font-weight: 500;
    color: #334155;
}
</style>
