<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Organization Control</h5>

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
                <label class="mb-3 font-weight-bold ">Selected Organizations</label>
                <div class="org-list">
                    <span v-for="(org, index) in settings.organization" :key="index" class="badge-custom">
                        {{ org }}
                        <span class="ml-2 delete-icon-wrapper" @click.stop="removeOrganization(index)" title="Remove">
                            <CIcon name="cil-x" size="sm" class="delete-icon" />
                        </span>
                    </span>
                </div>
            </div>

            <!-- Organization Selection Section -->
            <div class="mb-4">
                <h6 class="font-weight-bold mb-3">Organization Can Response</h6>

                <CRow>
                    <CCol md="10" class="mb-3">
                        <label class="mb-2 font-weight-bold small">Organization Name</label>
                        <CSelect :options="organizationOptions" :value="selectedOrg" placeholder="Select organization"
                            class="form-select-custom" @update:value="(val) => { selectedOrg = val; }" />
                    </CCol>
                    <CCol md="2" class="mb-3">
                        <CButton color="primary" block style="height: 45px; border-radius: 8px;"
                            class="font-weight-bold mt-4" @click="addOrganization">
                            Add
                        </CButton>
                    </CCol>
                </CRow>

                <!-- Info Hint -->
                <div class="info-hint mb-3">
                    <CIcon name="cil-info" size="xl" class="mr-3 text-info" />
                    <h5 class="mb-0 ">ถ้าคุณเลือก <strong>General</strong> หน่วยงานจะสามารถ ทำ ฟอร์ม ได้</h5>
                </div>
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
            selectedOrg: 'Digital University',
            organizationOptions: [
                { label: 'Digital University', value: 'Digital University' },
                { label: 'Academic Affairs', value: 'Academic Affairs' },
                { label: 'Student Services', value: 'Student Services' },
                { label: 'Administration', value: 'Administration' },
                { label: 'General', value: 'General' }
            ]
        }
    },
    methods: {
        addOrganization() {
            if (!this.selectedOrg) return;
            
            // Initialize settings.organization if it doesn't exist
            if (!this.settings.organization) {
                this.$set(this.settings, 'organization', []);
            }

            if (this.settings.organization.includes(this.selectedOrg)) {
                return;
            }

            this.settings.organization.push(this.selectedOrg);
            this.triggerAutoSave();
        },
        removeOrganization(index) {
            this.settings.organization.splice(index, 1);
            this.triggerAutoSave();
        },
        async triggerAutoSave() {
            this.$emit('auto-save');
        }
    },
    mounted() {
        // Ensure organization array exists
        if (!this.settings.organization) {
            this.$set(this.settings, 'organization', []);
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
