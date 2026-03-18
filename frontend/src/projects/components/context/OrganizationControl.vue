<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Organization Control</h5>

            <!-- Organization Info Section -->
            <div class="mb-4">
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

            <hr class="my-4" />

            <!-- Department Management Section -->
            <div class="mb-4">
                <h6 class="font-weight-bold mb-3">Organization CanRespone</h6>
                <CRow>
                    <CCol md="5" class="mb-3">
                        <label class="mb-2 font-weight-bold small">Organization Name</label>
                        <CSelect :options="organizationOptions" :value="orgData.name" placeholder="Select organization"
                            class="form-select-custom" @update:value="(val) => { orgData.name = val; triggerAutoSave(); }" />
                    </CCol>
                    <CCol md="5" class="mb-3">
                        <label class="mb-2 font-weight-bold small">Departments</label>
                        <CSelect :options="departmentOptions" :value="selectedDepartment"
                            placeholder="Choose a department" class="form-select-custom" @update:value="selectDepartment" />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 8px;"
                            class="font-weight-bold mt-4" @click="addDepartment">
                            Add
                        </CButton>
                    </CCol>
                </CRow>
            </div>

        </CCardBody>
    </CCard>
</template>

<script>
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
            selectedDepartment: null,
            organizationOptions: [
                { label: 'Digital University', value: 'Digital University' },
                { label: 'Academic Affairs', value: 'Academic Affairs' },
                { label: 'Student Services', value: 'Student Services' },
                { label: 'Administration', value: 'Administration' }
            ],
            departmentOptions: [
                { label: 'Engineering', value: 'Engineering' },
                { label: 'Product Management', value: 'Product Management' },
                { label: 'Design', value: 'Design' },
                { label: 'Quality Assurance', value: 'Quality Assurance' },
                { label: 'Marketing', value: 'Marketing' },
                { label: 'Human Resources', value: 'Human Resources' }
            ],
            orgData: {
                name: 'Digital University',
                code: 'DU-2024',
                description: 'A comprehensive digital learning platform for managing forms and surveys',
                status: 'active',
                createdDate: '2024-01-15',
                departments: [
                    'Engineering',
                    'Product Management',
                    'Design',
                    'Quality Assurance'
                ],
                allowMultipleForms: true,
                requireApproval: false,
                enableAnalytics: true
            }
        }
    },
    methods: {
        selectDepartment(value) {
            this.selectedDepartment = value;
        },
        addSelectedDepartment() {
            if (!this.selectedDepartment) {
                alert('Please select a department');
                return;
            }

            if (this.orgData.departments.includes(this.selectedDepartment)) {
                alert('This department is already assigned');
                return;
            }

            this.orgData.departments.push(this.selectedDepartment);
            this.selectedDepartment = null;
            this.triggerAutoSave();
        },
        removeDepartment(index) {
            this.orgData.departments.splice(index, 1);
            this.triggerAutoSave();
        },
        updateMultipleForms(val) {
            this.$set(this.orgData, 'allowMultipleForms', val);
            this.triggerAutoSave();
        },
        updateRequireApproval(val) {
            this.$set(this.orgData, 'requireApproval', val);
            this.triggerAutoSave();
        },
        updateEnableAnalytics(val) {
            this.$set(this.orgData, 'enableAnalytics', val);
            this.triggerAutoSave();
        },
        async triggerAutoSave() {
            this.$emit('auto-save');
        }
    },
    mounted() {
        console.log('OrganizationControl component mounted', this.orgData);
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

.dept-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    min-height: 50px;
}

.badge-custom {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: default;
    transition: all 0.2s ease;
}

.badge-custom:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.list-group-item {
    transition: all 0.3s ease;
}

.list-group-item:hover {
    background-color: #e8eef5 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
