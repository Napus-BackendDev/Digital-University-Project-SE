<template>
    <CCard class="mb-4 border-0 shadow-sm">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Access Control</h5>

            <div class="mb-4">
                <h6 class="font-weight-bold mb-2">Who can respond?</h6>
                <CSelect 
                    :options="['Anyone with the link']" 
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
                            v-model="settings.newCollaborator.email"
                            style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                            @change="triggerAutoSave" 
                        />
                    </CCol>
                    <CCol md="4" class="mb-2 mb-md-0">
                        <CSelect 
                            :options="['Editor', 'Viewer']" 
                            v-model="settings.newCollaborator.role"
                            style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                            @change="triggerAutoSave" 
                        />
                    </CCol>
                    <CCol md="2">
                        <CButton 
                            color="primary" 
                            block 
                            style="height: 45px; border-radius: 8px;"
                            class="font-weight-bold"
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
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        }
    }
}
</script>
