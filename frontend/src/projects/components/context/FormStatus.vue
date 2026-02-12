<template>
    <CCard class="mb-4 border-0 shadow-sm">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Form Status</h5>
            <CRow class="mb-4 align-items-center">
                <CCol md="3">
                    <label class="mb-0 font-weight-bold text-muted-dark">Start date time</label>
                </CCol>
                <CCol md="9">
                    <CInput 
                        type="datetime-local" 
                        class="mb-0"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        v-model="settings.startDateTime" 
                        @change="triggerAutoSave" 
                    />
                </CCol>
            </CRow>
            <CRow class="align-items-center">
                <CCol md="3">
                    <label class="mb-0 font-weight-bold text-muted-dark">End date time</label>
                </CCol>
                <CCol md="9">
                    <CInput 
                        type="datetime-local" 
                        class="mb-0"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        v-model="settings.endDateTime" 
                        @change="triggerAutoSave" 
                    />
                </CCol>
            </CRow>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: 'FormStatus',
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
