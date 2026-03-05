<template>
    <CRow>
        <CCol col="12" class="mb-4">
            <CTabs variant="pills" :active-tab="0" class="custom-tabs-wrapper">
                <CTab>
                    <template slot="title">
                        <span class="d-flex align-items-center">
                            <CIcon name="cil-description" class="mr-2" />
                            Questions
                        </span>
                    </template>
                    <TabQuestion :form="form" @auto-save="triggerAutoSave" />
                </CTab>
                <CTab>
                    <template slot="title">
                        <span class="d-flex align-items-center">
                            <CIcon name="cil-chart-pie" class="mr-2" />
                            Responses
                            <CBadge color="secondary" shape="pill" class="ml-2">6</CBadge>
                        </span>
                    </template>
                    <TabResponses :responses="form" @auto-save="triggerAutoSave" />
                </CTab>
                <CTab>
                    <template slot="title">
                        <span class="d-flex align-items-center">
                            <CIcon name="cil-settings" class="mr-2" />
                            Settings
                        </span>
                    </template>
                    <TabSetting :settings="form" @auto-save="triggerAutoSave" />
                </CTab>
            </CTabs>
        </CCol>
    </CRow>
</template>

<script>
import TabQuestion from './TabQuestion.vue';
import TabResponses from './TabResponses.vue';
import TabSetting from './TabSetting.vue';

export default {
    name: 'Tab',
    components: {
        TabQuestion,
        TabResponses,
        TabSetting
    },
    props: {
        form: {
            type: Object,
            default: () => ({})
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        }
    }
}
</script>

<style lang="scss">
.custom-tabs-wrapper {
    width: 100%;
}

.custom-tabs-wrapper .tab-content {
    width: 100%;
}

/* Add min-height to the white content boxes */
.custom-tabs-wrapper .tab-content .active {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
}

.custom-tabs-wrapper .nav-pills {
    background-color: #f1f5f9;
    padding: 4px;
    border-radius: 50px;
    display: flex;
    /* Changed from inline-flex to flex for full width */
    width: 100%;
    /* Force full width */
    border: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
    /* Add spacing below tabs */
}

.custom-tabs-wrapper .nav-item {
    margin-right: 0 !important;
    flex: 1;
    /* Distribute space equally */
    text-align: center;
}

.custom-tabs-wrapper .nav-link {
    border-radius: 50px !important;
    color: #64748b !important;
    padding: 10px 0 !important;
    /* Adjust padding */
    font-weight: 500;
    transition: all 0.2s ease;
    border: none !important;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}


.custom-tabs-wrapper .nav-link:hover {
    color: #334155 !important;
}

.custom-tabs-wrapper .nav-link.active {
    background-color: white !important;
    color: #0f172a !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 600;
}
</style>
