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
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedCollectEmail"
                    @update:checked="triggerAutoSave" />
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 class="mb-1 font-weight-bold">Limit to one response</h6>
                    <small class="text-muted">Only allow one response per person</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedLimitResponse"
                    @update:checked="triggerAutoSave" />
            </div>

            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1 font-weight-bold">Show progress bar</h6>
                    <small class="text-muted">Display completion progress to
                        respondents</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedProgressBar"
                    @update:checked="triggerAutoSave" />
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
    computed: {
        mappedCollectEmail: {
            get() {
                return !!this.settings.collectEmail;
            },
            set(val) {
                this.$set(this.settings, 'collectEmail', val);
            }
        },
        mappedLimitResponse: {
            get() {
                return !!this.settings.limitResponse;
            },
            set(val) {
                this.$set(this.settings, 'limitResponse', val);
            }
        },
        mappedProgressBar: {
            get() {
                return !!this.settings.progressBar;
            },
            set(val) {
                this.$set(this.settings, 'progressBar', val);
            }
        }
    },
    methods: {
        async triggerAutoSave() {
            this.$emit('auto-save');
        }
    }
}
</script>
