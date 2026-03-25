<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Response Settings</h5>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 class="mb-1 font-weight-bold">Collect email addresses</h6>
                    <small class="text-muted">Require respondents to enter their
                        email</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedCollectEmail"
                    @update:checked="val => { mappedCollectEmail = val; triggerAutoSave(); }" />
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 class="mb-1 font-weight-bold">Email Notifications</h6>
                    <small class="text-muted">Send email notifications to respondents after submission</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedEmailNotifications"
                    @update:checked="val => { mappedEmailNotifications = val; triggerAutoSave(); }" />
            </div>

            <div v-if="mappedEmailNotifications" class="mb-4 pl-3" style="border-left: 3px solid #e2e8f0; animation: fadeIn 0.3s ease;">
                <label class="font-weight-bold small mb-2">Email Message</label>
                <textarea 
                    v-model="mappedEmailMessage" 
                    placeholder="Write the message that will be sent to respondents" 
                    rows="4" 
                    class="form-control p-3" 
                    style="border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8f9fa; resize: vertical;"
                    @change="triggerAutoSave" 
                ></textarea>
                <small class="text-muted mt-2 d-inline-block">Tip: You can use <code v-pre>{{ User.name }}</code> or <code v-pre>{{ User.email }}</code> to personalize the message.</small>
            </div>


            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 class="mb-1 font-weight-bold">Limit to one response</h6>
                    <small class="text-muted">Only allow one response per person</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedLimitResponse"
                    @update:checked="val => { mappedLimitResponse = val; triggerAutoSave(); }" />
            </div>

            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1 font-weight-bold">Require Response</h6>
                    <small class="text-muted">Ensure all questions have a response before submission</small>
                </div>
                <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite" :checked="mappedRequireResponse"
                    @update:checked="val => { mappedRequireResponse = val; triggerAutoSave(); }" />
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
                return !!(this.settings.settings && this.settings.settings.collectEmail);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'collectEmail', val);
            }
        },
        mappedLimitResponse: {
            get() {
                return !!(this.settings.settings && this.settings.settings.limitResponse);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'limitResponse', val);
            }
        },
        mappedEmailNotifications: {
            get() {
                return !!(this.settings.settings && this.settings.settings.emailNotifications);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'emailNotifications', val);
            }
        },
        mappedEmailMessage: {
            get() {
                return (this.settings.settings && this.settings.settings.emailMessage) || '';
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'emailMessage', val);
            }
        },
        mappedRequireResponse: {
            get() {
                return !!(this.settings.settings && this.settings.settings.requireResponse);
            },
            set(val) {
                if (!this.settings.settings) this.$set(this.settings, 'settings', {});
                this.$set(this.settings.settings, 'requireResponse', val);
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

<style scoped>
.rounded-20 {
    border-radius: 20px !important;
    overflow: hidden;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

.form-control:focus {
    border-color: #007bff !important;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
}
</style>
