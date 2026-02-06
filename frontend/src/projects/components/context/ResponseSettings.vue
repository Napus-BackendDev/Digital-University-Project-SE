<template>
    <CCard class="mb-4 border-0 shadow-sm">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Response Settings</h5>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 class="mb-1 font-weight-bold">Collect email addresses</h6>
                    <small class="text-muted">Require respondents to enter their
                        email</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite"
                    :checked.sync="settings.collectEmails" @update:checked="triggerAutoSave" />
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 class="mb-1 font-weight-bold">Limit to one response</h6>
                    <small class="text-muted">Only allow one response per person</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite"
                    :checked.sync="settings.limitOneResponse" @update:checked="triggerAutoSave" />
            </div>

            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1 font-weight-bold">Show progress bar</h6>
                    <small class="text-muted">Display completion progress to
                        respondents</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite"
                    :checked.sync="settings.showProgressBar" @update:checked="triggerAutoSave" />
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: 'ResponseSettings',
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
