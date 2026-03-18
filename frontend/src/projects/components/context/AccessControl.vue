<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Access Control</h5>

            <CRow class="mb-4">
                <CCol md="6">
                    <h6 class="font-weight-bold mb-2">Who can respond?</h6>
                    <CSelect :options="accessTypeOptions" :value="settings.settings.whoCanRespond"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        @update:value="(val) => { settings.settings.whoCanRespond = val; triggerAutoSave(); }" />
                </CCol>
                <CCol md="6">
                    <h6 class="font-weight-bold mb-2">Vision</h6>
                    <CSelect :options="visionOptions" :value="currentStatusId"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        @update:value="onVisionChange" />
                </CCol>
            </CRow>

            <hr class="my-4" />

            <div class="mb-4">
                <h6 class="font-weight-bold mb-1">Collaborators</h6>
                <p class="text-muted small mb-3">Add people who can help you manage this
                    form</p>
                <CRow>
                    <CCol md="6" class="mb-2 mb-md-0">
                        <CInput placeholder="Email address" v-model="newCollaborator.email"
                            style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;" />
                    </CCol>
                    <CCol md="4" class="mb-2 mb-md-0">
                        <CSelect :options="roleOptions" v-model="newCollaborator.role"
                            style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;" />
                    </CCol>
                    <CCol md="2">
                        <CButton color="primary" block style="height: 45px; border-radius: 8px;"
                            class="font-weight-bold" @click="addCollaborator">
                            Add
                        </CButton>
                    </CCol>
                </CRow>
            </div>

            <div class="bg-light p-3 rounded">
                <div class="mb-1" style="color: #4f4f4f;">
                    <strong class="text-dark">Editor :</strong> Can edit form and view
                    responses
                </div>
                <div style="color: #4f4f4f;">
                    <strong class="text-dark">Viewer :</strong> Can only view form and view
                    responses
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
                role: 'Editor'
            },
            accessTypeOptions: [
                { value: 'anyone', label: 'Anyone with the link' },
                { value: 'specific', label: 'Specific people' }
            ],
            roleOptions: [
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Viewer' }
            ]
        }
    },
    created() {
        this.$store.dispatch('Setting/status/get');
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
            if (!this.newCollaborator.email) {
                alert('Please enter an email address');
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
            this.newCollaborator.role = 'Editor';

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
</style>
