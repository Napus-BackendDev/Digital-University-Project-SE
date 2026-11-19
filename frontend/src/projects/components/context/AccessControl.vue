<template>
    <CCard :class="embedded ? 'mb-0 border-0 shadow-none bg-transparent' : 'mb-4 border-0 shadow-sm rounded-20'" style="overflow: visible;">
        <CCardBody :class="embedded ? 'px-3 px-md-4 pt-1 pb-3 pb-md-4' : 'p-3 p-md-4'">
            <h5 v-if="!embedded" class="mb-4 font-weight-bold text-dark">{{ $t('editor.settings.access.title') }}</h5>

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
                        <UserEmailTokenInput
                            ref="collaboratorTokenInput"
                            v-model="pendingCollaborators"
                            :users="users"
                            :excluded-user-ids="savedCollaboratorIds"
                            :excluded-emails="savedCollaboratorEmails"
                            :placeholder="$t('editor.settings.access.emailFreetextPlaceholder')"
                            :add-more-placeholder="$t('editor.settings.access.addMorePlaceholder')"
                            :error.sync="collaboratorEmailError"
                            invalid-error-key="editor.settings.access.invalidCollaboratorEmails"
                            @submit="addCollaborator"
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
                            :searchable="false"
                        />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <label class="mb-2 font-weight-bold small d-none d-md-block" aria-hidden="true">&nbsp;</label>
                        <CButton color="primary" block style="height: 45px; border-radius: 12px;"
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
import UserEmailTokenInput from './UserEmailTokenInput.vue'

export default {
    name: 'AccessControl',
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
            pendingCollaborators: [],
            collaboratorEmailError: '',
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

        savedCollaboratorIdentifiers() {
            const ids = [];
            const emails = [];
            const usersList = Array.isArray(this.users) ? this.users : [];
            const savedList = (this.settings && Array.isArray(this.settings.collaborator)) ? this.settings.collaborator : [];

            savedList.forEach(c => {
                if (!c) return;
                if (c.email) emails.push(String(c.email).trim().toLowerCase());
                const u = c.user;
                if (!u) return;
                if (typeof u === 'object') {
                    if (u._id) ids.push(String(u._id));
                    if (u.email) emails.push(String(u.email).trim().toLowerCase());
                } else {
                    const uid = String(u);
                    ids.push(uid);
                    const matched = usersList.find(x => x && String(x._id) === uid);
                    if (matched && matched.email) {
                        emails.push(String(matched.email).trim().toLowerCase());
                    }
                }
            });

            return { ids, emails };
        },
        savedCollaboratorIds() {
            return this.savedCollaboratorIdentifiers.ids;
        },
        savedCollaboratorEmails() {
            return this.savedCollaboratorIdentifiers.emails;
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
                label: this.normalizeCollaboratorLabel(this.getLang(item.title))
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
            const uid = typeof userRef === 'object' ? userRef._id : userRef;
            const u = this.users.find(x => String(x._id) === String(uid));
            return u ? (u.name || u.email) : (uid || userRef);
        },
        normalizeCollaboratorLabel(label) {
            const trimmed = String(label || '').trim();
            if (trimmed === 'ผู้ดู' && this.$te && this.$te('editor.settings.access.viewer')) {
                return this.$t('editor.settings.access.viewer');
            }
            return trimmed || (this.$te && this.$te('editor.settings.access.viewer') ? this.$t('editor.settings.access.viewer') : 'Viewer');
        },
        getRoleName(typeRef) {
            if (!typeRef) return '';
            const tid = typeof typeRef === 'object' ? typeRef._id : typeRef;
            const t = this.collaboratorItems ? this.collaboratorItems.find(x => x._id === tid) : null;
            return t ? this.normalizeCollaboratorLabel(this.getLang(t.title)) : this.normalizeCollaboratorLabel('Viewer');
        },
        getRoleClass(typeRef) {
            const name = String(this.getRoleName(typeRef)).toLowerCase();
            return (name.includes('edit') || name.includes('แก้ไข')) ? 'editor' : 'viewer';
        },
        onStatusChange(val) {
            const newId = typeof val === 'object' && val !== null ? val._id : val;
            if (newId && newId !== this.currentStatusId) {
                this.$set(this.settings, 'status', newId);
                this.triggerAutoSave();
            }
        },
        isAlreadySavedCollaborator(candidate) {
            const savedList = (this.settings && Array.isArray(this.settings.collaborator)) ? this.settings.collaborator : [];
            const usersList = Array.isArray(this.users) ? this.users : [];
            return savedList.some(c => {
                if (!c) return false;
                const u = c.user;
                const uId = (u && typeof u === 'object' && u._id) ? String(u._id) : (typeof u !== 'object' ? String(u) : null);
                if (candidate.userId && uId && uId === String(candidate.userId)) {
                    return true;
                }
                const savedEmail = (c.email || (u && typeof u === 'object' ? u.email : '') || '').trim().toLowerCase();
                if (savedEmail && candidate.email && savedEmail === candidate.email) {
                    return true;
                }
                if (uId && candidate.email) {
                    const matched = usersList.find(x => x && String(x._id) === uId);
                    if (matched && matched.email && matched.email.trim().toLowerCase() === candidate.email) {
                        return true;
                    }
                }
                return false;
            });
        },
        addCollaborator() {
            if (!this.newCollaborator.type) return;

            const { candidates, invalidEntries } = this.$refs.collaboratorTokenInput
                ? this.$refs.collaboratorTokenInput.consumeCandidatesForSubmit()
                : { candidates: [...this.pendingCollaborators], invalidEntries: [] };

            if (candidates.length === 0 && invalidEntries.length === 0) {
                this.collaboratorEmailError = '';
                return;
            }

            if (!Array.isArray(this.settings.collaborator)) {
                this.$set(this.settings, 'collaborator', []);
            }

            let addedAny = false;
            candidates.forEach(candidate => {
                if (this.isAlreadySavedCollaborator(candidate)) return;
                if (candidate.userId) {
                    this.settings.collaborator.push({
                        user: candidate.userId,
                        type: this.newCollaborator.type
                    });
                } else if (candidate.email) {
                    this.settings.collaborator.push({
                        user: { email: candidate.email, name: candidate.email },
                        email: candidate.email,
                        type: this.newCollaborator.type
                    });
                }
                addedAny = true;
            });

            if (invalidEntries.length > 0) {
                this.collaboratorEmailError = this.$t('editor.settings.access.invalidCollaboratorEmails', {
                    emails: invalidEntries.join(', ')
                });
            } else {
                this.collaboratorEmailError = '';
            }

            if (addedAny) {
                this.triggerAutoSave();
            }
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
    overflow: visible;
}

.form-select-custom {
    min-height: 45px;
    background-color: transparent !important;
    border-radius: 12px !important;
    border: none !important;
    box-shadow: none !important;
}

.form-select-custom:focus-within {
    box-shadow: none !important;
}

/* v-select custom styling matched cleanly to .collab-chip-box */
.form-select-custom.v-select >>> .vs__dropdown-toggle {
    height: 45px !important;
    min-height: 45px !important;
    background-color: #f8fafc !important;
    border-radius: 12px !important;
    border: 1px solid #cbd5e1 !important;
    padding: 0 10px !important;
    display: flex;
    align-items: center;
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.form-select-custom.v-select >>> .vs__selected-options {
    padding: 0 !important;
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    min-width: 0;
}

.form-select-custom.v-select >>> .vs__actions {
    padding: 0 4px !important;
    display: flex;
    align-items: center;
}

.form-select-custom.v-select >>> .vs__selected {
    background-color: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 2px !important;
    margin: 0 !important;
    font-size: 0.92rem !important;
    font-weight: 500 !important;
    color: #0f172a !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.form-select-custom.v-select >>> .vs__deselect {
    margin-left: 4px !important;
    transform: scale(0.85);
    fill: #94a3b8 !important;
}

.form-select-custom.v-select >>> .vs__search {
    margin: 0;
    padding: 0;
    min-height: 0;
    height: 32px;
    flex-grow: 1;
}

.form-select-custom.v-select.vs--open {
    position: relative;
    z-index: 1050;
}

.form-select-custom.v-select.vs--open >>> .vs__dropdown-toggle {
    border-color: #8c1515 !important;
    background-color: #ffffff !important;
    box-shadow: 0 2px 6px rgba(140, 21, 21, 0.14) !important;
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
    border-radius: 12px;
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
    border: 1px solid #bfdbfe;
    color: #1e40af;
}

.hint-content {
    display: flex;
    flex-direction: column;
}

.role-badge {
    font-weight: 800;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 12px;
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
