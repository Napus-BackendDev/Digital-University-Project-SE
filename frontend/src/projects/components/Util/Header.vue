<template>
    <CCard class="header-card mb-4">
        <CCardBody class="p-4">
            <div class="d-flex align-items-center">
                <!-- Decorative icon moved to front -->
                <div class="header-icon-box mr-3 d-none d-sm-flex">
                    <CIcon name="cil-layers" size="xl" />
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-1">
                        <h1 class="header-title mb-0 mr-3">{{ title }}</h1>
                        <transition name="fade" mode="out-in">
                            <div v-if="isSaving" key="saving" class="saving-indicator d-flex align-items-center">
                                <CSpinner size="sm" color="primary" class="mr-2" style="width: 1rem; height: 1rem;" />
                                <span class="text-primary font-weight-bold small">Saving...</span>
                            </div>
                            <div v-else-if="isSaved" key="saved" class="saved-indicator d-flex align-items-center">
                                <CIcon name="cil-check-circle" size="sm" class="mr-2 text-success" />
                                <span class="text-success font-weight-bold small">All changes saved</span>
                            </div>
                        </transition>
                    </div>
                    <p class="header-description mb-0 text-muted-custom">{{ description }}</p>
                </div>
                
                <!-- Actions Slot for Custom Buttons -->
                <div class="header-actions ml-auto d-flex align-items-center">
                    <slot name="actions"></slot>
                    
                    <!-- Explicit Create Button for Management -->
                    <div v-if="showCreateButton" class="ml-3">
                        <CButton 
                            color="primary" 
                            size="lg"
                            class="d-flex align-items-center shadow-sm px-4 py-2"
                            style="border-radius: 8px; font-weight: 600; transition: all 0.2s ease;"
                            @click="createNewForm"
                            :disabled="isCreating"
                        >
                            <CIcon v-if="!isCreating" name="cil-plus" size="sm" class="mr-2" />
                            <CSpinner v-else size="sm" class="mr-2" />
                            {{ $t('button.create') }}
                        </CButton>
                    </div>
                </div>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: "Header",
    props: {
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        showCreateButton: {
            type: Boolean,
            default: false
        },
        isSaving: {
            type: Boolean,
            default: false
        },
        isSaved: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isCreating: false
        }
    },
    methods: {
        async createNewForm() {
            this.isCreating = true
            try {
                const newFormData = {
                    title: [{ key: 'en', value: 'Untitled Form' }],
                    description: [{ key: 'en', value: 'Description' }],
                    questions: [],
                    responses: [],
                    creator: this.user?._id,
                    settings: {
                        startDateTime: '',
                        endDateTime: '',
                        collectEmail: false,
                        limitResponse: false,
                        emailNotifications: false,
                        requireResponse: false,
                        confirmMessage: 'Thank you for completing this survey. Your response has been recorded.',
                        showAnotherResponseLink: true
                    }
                }

                const response = await this.$store.dispatch('Forms/create', newFormData)
                const id = response.data.data._id
                this.$router.push({ name: 'EditorCreateForm', params: { _id: id } })
            } catch (error) {
                console.error('Failed to create form:', error)
            } finally {
                this.isCreating = false
            }
        },
        setLanguage(lang) {
            this.$i18n.locale = lang;
            localStorage.setItem('lang', lang);
            this.$store.commit('Setting/lang', lang);
        }
    },
    computed: {
        ...mapGetters('User', ['user'])
    }
}
</script>

<style scoped>
.header-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    position: relative;
    border-left: 5px solid #8c1515;
}

.header-title {
    color: #1e293b;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.025em;
}

.text-muted-custom {
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 400;
}

.header-icon-box {
    width: 56px;
    height: 56px;
    background: #f1f5f9;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3c4b64;
}

/* Language Switcher Styles */
.lang-switcher-container {
    background: #f1f5f9;
    padding: 4px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 2px;
    border: 1px solid #e2e8f0;
}

.lang-pill {
    border: none;
    background: transparent;
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    cursor: pointer;
    line-height: 1;
}

.lang-pill.active {
    background: #fff;
    color: #8c1515;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.lang-divider {
    width: 1px;
    height: 14px;
    background: #e2e8f0;
    margin: 0 2px;
}

.saving-indicator {
    padding: 3px 10px;
    background: #ebf5ff;
    border-radius: 50px;
}

.saved-indicator {
    padding: 3px 10px;
    background: #ecfdf5;
    border-radius: 50px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Subtle background decoration */
.header-card::after {
    content: "";
    position: absolute;
    top: -20px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: rgba(60, 75, 100, 0.03);
    border-radius: 50%;
    z-index: 0;
}
</style>
