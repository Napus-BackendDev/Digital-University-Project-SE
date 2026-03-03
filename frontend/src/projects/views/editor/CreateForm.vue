<template>
    <div class="flex-grow-1">
        <CRow class="mb-4">
            <CCol col="12" class="d-flex justify-content-between align-items-center">
                <ButtonBack path="/editor/dashboard" />
                <div class="d-flex align-items-center">
                    <ButtonPreview />
                </div>
            </CCol>
        </CRow>

        <CRow>
            <CCol col="12" class="mb-4">
                <Tab :form="formData" @auto-save="triggerAutoSave" />
            </CCol>
        </CRow>
    </div>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue'
import ButtonPreview from '../../components/Button/ButtonPreview.vue'
import Tab from '../../components/Tabs/Tab.vue';

export default {
    name: "CreateForm",
    components: {
        ButtonBack,
        ButtonPreview,
        Tab
    },
    data() {
        return {
            formData: {}
        };
    },
    created() {
        this.onInit();
    },
    methods: {
        async onInit() {
            const formId = this.$route.params._id;
            try {
                this.formData = await this.$store.dispatch('Forms/getFormById', { _id: formId });
            } catch (error) {
                console.error("Error fetching form:", error);
            }
        },
    },
    computed: {
    }
}
</script>

<style lang="scss">
.form-title-input input {
    font-size: 2rem !important;
    padding: 0px !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-weight: bold;
    color: #1a202c;
    height: auto !important;
}

.form-title-input input:focus {
    border-bottom: 2px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.form-desc-input textarea {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    resize: none;
    padding: 0px !important;
    color: #64748b;
    font-size: 1rem;
}

.form-desc-input textarea:focus {
    border-bottom: 1px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.sticky-sidebar {
    position: sticky;
    top: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>