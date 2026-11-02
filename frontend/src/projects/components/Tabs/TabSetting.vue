<template>
    <div>
        <div :class="{ 'wizard-spotlight-settings mb-2': isWizardActive && wizardStep === 3 }">
            <div v-if="isWizardActive && wizardStep === 3" class="wizard-spotlight-banner">
                <CIcon name="cil-settings" size="sm" class="mr-2" />
                <span>SPOTLIGHT #3: ระบบสลับเข้า Tab 3: Settings อัตโนมัติ — แสดง 4 กรอบ Component ตั้งค่าแบบสอบถาม (TabSetting.vue)</span>
            </div>

            <div :class="{ 'p-3': isWizardActive && wizardStep === 3 }">
                <CRow v-if="isWizardActive && wizardStep === 3">
                    <CCol xl="6" class="mb-3">
                        <div class="settings-component-box is-blue h-100">
                            <div class="settings-component-tag is-blue">
                                [Component 1: FormStatus.vue — ตั้งเวลาเปิด-ปิดฟอร์ม]
                            </div>
                            <FormStatus :settings="settings" @auto-save="triggerAutoSave" />
                        </div>
                    </CCol>
                    <CCol xl="6" class="mb-3">
                        <div class="settings-component-box is-purple h-100">
                            <div class="settings-component-tag is-purple">
                                [Component 2: OrganizationControl.vue — หน่วยงานและกลุ่มผู้ตอบ]
                            </div>
                            <OrganizationControl :settings="settings" @auto-save="triggerAutoSave" />
                        </div>
                    </CCol>
                    <CCol xl="6" class="mb-3 mb-xl-0">
                        <div class="settings-component-box is-green h-100">
                            <div class="settings-component-tag is-green">
                                [Component 3: ResponseSettings.vue — เงื่อนไขการส่งคำตอบ]
                            </div>
                            <ResponseSettings :settings="settings" @auto-save="triggerAutoSave" />
                        </div>
                    </CCol>
                    <CCol xl="6">
                        <div class="settings-component-box is-amber h-100">
                            <div class="settings-component-tag is-amber">
                                [Component 4: AccessControl.vue — เชิญผู้ร่วมสร้าง/แก้ไขฟอร์ม]
                            </div>
                            <AccessControl :settings="settings" @auto-save="triggerAutoSave" />
                        </div>
                    </CCol>
                </CRow>

                <template v-else>
                    <FormStatus :settings="settings" @auto-save="triggerAutoSave" />
                    <AccessControl :settings="settings" @auto-save="triggerAutoSave" />
                    <OrganizationControl :settings="settings" @auto-save="triggerAutoSave" />
                    <ResponseSettings :settings="settings" @auto-save="triggerAutoSave" />
                </template>
            </div>
        </div>

        <!-- Coachmark Popover #3 -->
        <FormBuilderWizard
            v-if="isWizardActive && wizardStep === 3"
            mode="coachmark"
            :currentStep="3"
            :form="settings"
            @prev-step="$emit('wizard-prev')"
            @skip="$emit('wizard-skip')"
            @next-step="$emit('wizard-next')"
        />
    </div>
</template>

<script>
import OrganizationControl from '../context/OrganizationControl.vue';
import FormStatus from '../context/FormStatus.vue';
import AccessControl from '../context/AccessControl.vue';
import ResponseSettings from '../context/ResponseSettings.vue';
import FormBuilderWizard from '../Wizard/FormBuilderWizard.vue';

export default {
    name: 'TabSetting',
    components: {
        OrganizationControl,
        FormStatus,
        AccessControl,
        ResponseSettings,
        FormBuilderWizard
    },
    props: {
        settings: {
            type: Object,
            required: true
        },
        isWizardActive: {
            type: Boolean,
            default: false
        },
        wizardStep: {
            type: Number,
            default: 1
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        }
    }
}
</script>

<style scoped>
.wizard-spotlight-settings {
    border: 2.5px dashed #f59e0b;
    background-color: #fffbeb;
    border-radius: 16px;
    overflow: hidden;
}

.wizard-spotlight-banner {
    background-color: #fef3c7;
    border-bottom: 1px solid #f59e0b;
    color: #92400e;
    font-weight: 700;
    font-size: 0.88rem;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
}

.settings-component-box {
    background-color: #ffffff;
    border-radius: 14px;
    border: 1.5px solid #cbd5e1;
    overflow: hidden;
}

.settings-component-box >>> .card {
    margin-bottom: 0 !important;
    box-shadow: none !important;
    border: none !important;
}

.settings-component-box.is-blue {
    border-color: #0284c7;
}
.settings-component-box.is-purple {
    border-color: #7c3aed;
}
.settings-component-box.is-green {
    border-color: #16a34a;
}
.settings-component-box.is-amber {
    border-color: #d97706;
}

.settings-component-tag {
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.45rem 0.9rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.settings-component-tag.is-blue {
    background-color: #e0f2fe;
    color: #0369a1;
}
.settings-component-tag.is-purple {
    background-color: #f3e8ff;
    color: #6d28d9;
}
.settings-component-tag.is-green {
    background-color: #dcfce7;
    color: #15803d;
}
.settings-component-tag.is-amber {
    background-color: #fef3c7;
    color: #b45309;
}
</style>
