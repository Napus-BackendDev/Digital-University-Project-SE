<template>
    <CCard class="mb-4 border-0 shadow-sm">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Access Control</h5>

            <div class="mb-4">
                <h6 class="font-weight-bold mb-2">Who can respond?</h6>
                <CSelect 
                    :options="accessTypeOptions" 
                    v-model="settings.accessType"
                    style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                    @change="triggerAutoSave" 
                />
            </div>

            <hr class="my-4" />

            <div class="mb-4">
                <h6 class="font-weight-bold mb-1">Collaborators</h6>
                <p class="text-muted small mb-3">Add people who can help you manage this
                    form</p>
                <CRow>
                    <CCol md="6" class="mb-2 mb-md-0">
                        <CInput 
                            placeholder="Email address" 
                            v-model="newCollaborator.email"
                            style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        />
                    </CCol>
                    <CCol md="4" class="mb-2 mb-md-0">
                        <CSelect 
                            :options="roleOptions" 
                            v-model="newCollaborator.role"
                            style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        />
                    </CCol>
                    <CCol md="2">
                        <CButton 
                            color="primary" 
                            block 
                            style="height: 45px; border-radius: 8px;"
                            class="font-weight-bold"
                            @click="addCollaborator"
                        >
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
    methods: {
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
            try {
                await this.$store.dispatch('Forms/update', this.settings);
                console.log('AccessControl settings updated successfully', this.settings);
            } catch (error) {
                console.error('Error updating AccessControl settings:', error);
            }
        }
    }
}
</script>
