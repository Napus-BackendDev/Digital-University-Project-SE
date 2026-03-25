<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Access Control</h5>



            <div class="mb-4">
                <h6 class="font-weight-bold mb-1">Collaborators</h6>
                <p class="text-muted small mb-3">Add people who can help you manage this
                    form</p>
                <CRow>
                    <CCol md="6" class="mb-2 mb-md-0">
                        <input type="email" placeholder="Email address" v-model="newCollaborator.email" class="form-control px-3"
                               style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;" @keyup.enter="addCollaborator" />
                    </CCol>
                    <CCol md="4" class="mb-2 mb-md-0">
                        <select v-model="newCollaborator.role" class="form-control px-3"
                                style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </CCol>
                    <CCol md="2">
                        <CButton color="primary" block style="height: 45px; border-radius: 8px;"
                            class="font-weight-bold" @click="addCollaborator">
                            Add
                        </CButton>
                    </CCol>
                </CRow>

                <!-- Selected Collaborators List -->
                <div class="mt-4">
                    <label class="mb-2 font-weight-bold small text-muted">Selected Collaborators</label>
                    <div class="org-list">
                        <span v-for="(collab, index) in settings.collaborators" :key="index" class="badge-custom border d-inline-flex align-items-center mb-2">
                            <span class="mr-2">{{ collab.email || collab.name }}</span>
                            <span class="role-badge" :class="collab.role ? collab.role.toLowerCase() : ''" style="text-transform: capitalize;">{{ collab.role }}</span>
                            <span class="ml-2 delete-icon-wrapper" @click.stop="removeCollaborator(index)" title="Remove">
                                <CIcon name="cil-x" size="sm" class="delete-icon" />
                            </span>
                        </span>
                        <div v-if="!settings.collaborators || settings.collaborators.length === 0" class="text-muted small my-auto">
                            No collaborators added.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Permission Info Hint -->
            <div class="info-hint">
                <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                <div class="hint-content">
                    <div class="mb-1">
                        <span class="role-badge editor">Editor</span>
                        <span class="role-desc">: Can edit form and view responses</span>
                    </div>
                    <div>
                        <span class="role-badge viewer">Viewer</span>
                        <span class="role-desc">: Can only view form and view responses</span>
                    </div>
                </div>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'AccessControl',
    props: {
        settings: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            newCollaborator: {
                email: '',
                role: 'editor'
            },
            roleOptions: [
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Viewer' }
            ]
        }
    },
    created() {
        this.$store.dispatch('Setting/status/get');
        if (!this.settings.collaborators) {
            this.$set(this.settings, 'collaborators', []);
        }
    },
    computed: {
        ...mapGetters('Setting', ['visionOptions']),
        ...mapGetters('Setting/status', { statusItems: 'item' }),

        visionOptions() {
            if (!this.statusItems || !Array.isArray(this.statusItems)) return [];
            return this.statusItems.map(item => ({
                value: item._id,
                label: this.getLang(item.title)
            }));
        },
        currentStatusId() {
            if (!this.settings || !this.settings.status) return '';
            const status = this.settings.status;
            return typeof status === 'object' ? status._id : status;
        }
    },
    methods: {
        onVisionChange(val) {
            // Handle both object and string value cases from initial fetch
            const newId = typeof val === 'object' && val !== null ? val._id : val;
            
            // Only trigger update if the value actually changed
            if (newId && newId !== this.currentStatusId) {
                this.$set(this.settings, 'status', newId);
                this.triggerAutoSave();
            }
        },
        addCollaborator() {
            if (!this.newCollaborator.email || !this.newCollaborator.email.includes('@')) {
                return;
            }

            if (!this.settings.collaborators) {
                this.$set(this.settings, 'collaborators', []);
            }

            this.settings.collaborators.push({
                email: this.newCollaborator.email,
                role: this.newCollaborator.role
            });

            this.newCollaborator.email = '';
            this.newCollaborator.role = 'editor';

            this.triggerAutoSave();
        },
        removeCollaborator(index) {
            this.settings.collaborators.splice(index, 1);
            this.triggerAutoSave();
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
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    background-color: #ffffff;
    color: #475569;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s ease;
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
