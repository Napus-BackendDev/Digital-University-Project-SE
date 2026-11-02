<template>
    <div class="page-header-card mb-4">
        <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between p-4">
            <!-- Left: Icon & Titles -->
            <div class="d-flex align-items-center mb-3 mb-md-0">
                <div class="header-icon-box mr-3 d-flex align-items-center justify-content-center">
                    <CIcon :name="headerIcon" size="xl" />
                </div>
                <div>
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <h1 class="header-title mb-0">{{ title }}</h1>
                        <transition name="fade" mode="out-in">
                            <div v-if="isSaving" key="saving" class="saving-indicator d-inline-flex align-items-center ml-2">
                                <CSpinner size="sm" color="primary" class="mr-1" style="width: 0.85rem; height: 0.85rem;" />
                                <span class="text-primary font-weight-bold small">กำลังบันทึก...</span>
                            </div>
                            <div v-else-if="isSaved" key="saved" class="saved-indicator d-inline-flex align-items-center ml-2">
                                <CIcon name="cil-check-circle" size="sm" class="mr-1 text-success" />
                                <span class="text-success font-weight-bold small">บันทึกเรียบร้อย</span>
                            </div>
                        </transition>
                    </div>
                    <p v-if="description" class="header-description mb-0 mt-1">{{ description }}</p>
                </div>
            </div>

            <!-- Right: Actions Slot & Create Form Button -->
            <div class="header-actions d-flex align-items-center ml-md-auto flex-wrap gap-2">
                <slot name="actions"></slot>

                <!-- Create Form Button -->
                <div v-if="showCreateButton" class="ml-2">
                    <button
                        type="button"
                        class="btn btn-create-form d-flex align-items-center px-4 py-2 shadow-sm"
                        @click="createNewForm"
                        :disabled="isCreating"
                    >
                        <CIcon v-if="!isCreating" name="cil-plus" size="sm" class="mr-2" />
                        <CSpinner v-else size="sm" class="mr-2" />
                        <span class="font-weight-bold">{{ $t('button.create') || 'สร้างแบบสอบถาม' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
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
    computed: {
        ...mapGetters('User', ['user']),
        headerIcon() {
            const t = (this.title || '').toLowerCase();
            if (t.includes('ฟอร์ม') || t.includes('form')) return 'cil-description';
            if (t.includes('จัด') || t.includes('manage')) return 'cil-folder';
            if (t.includes('วิเคราะห์') || t.includes('analytic')) return 'cil-chart-line';
            if (t.includes('สิทธิ์') || t.includes('permission')) return 'cil-shield-alt';
            if (t.includes('อีเมล') || t.includes('email')) return 'cil-envelope-closed';
            return 'cil-layers';
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
                this.$router.push({ name: 'EditorCreateForm', params: { _id: id }, query: { wizard: '1' } })
            } catch (error) {
                console.error('Failed to create form:', error)
            } finally {
                this.isCreating = false
            }
        }
    }
}
</script>

<style scoped>
.page-header-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.01);
    position: relative;
    overflow: hidden;
}

.header-icon-box {
    width: 48px;
    height: 48px;
    min-width: 48px;
    background: #fdf2f2;
    border: 1px solid #fce8e8;
    border-radius: 12px;
    color: #8c1515;
}

.header-title {
    color: #0f172a;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.25;
}

.header-description {
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.4;
}

.btn-create-form {
    background-color: #8c1515;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.btn-create-form:hover {
    background-color: #701111;
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(140, 21, 21, 0.25) !important;
}

.btn-create-form:active {
    transform: translateY(0);
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
    transition: opacity 0.25s ease;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
</style>
