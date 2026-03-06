<template>
    <div class="flex-grow-1">

        <CButton variant="ghost" color="dark" class="back-btn" @click="$router.back()">
            <CIcon name="cil-arrow-left" class="mr-2" />
            Back to Edit
        </CButton>

        <!-- Loading -->
        <div v-if="loading" class="fillform-center text-muted">
            <CSpinner color="secondary" />
            <p class="mt-3">Loading...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="fillform-center text-danger">
            <p>{{ error }}</p>
        </div>

        <!-- Content -->
        <div v-else-if="form" class="fillform-body">

            <!-- Header Card -->
            <CCard class="mb-3 header-card">
                <CCardBody class="p-4">
                    <h1 class="form-main-title">{{ getTitle(form.title) }}</h1>
                    <p v-if="getTitle(form.description)" class="form-main-desc mb-0">
                        {{ getTitle(form.description) }}
                    </p>
                    <hr class="form-divider" />
                    <p v-if="form.questions && form.questions.length" class="question-label-hint mb-0">
                        Question 1
                    </p>
                </CCardBody>
            </CCard>

            <!-- Question Cards -->
            <CCard v-for="(question, index) in form.questions" :key="question._id || index" class="mb-3">
                <CCardBody class="p-4">
                    <p class="question-index">Question {{ index + 1 }}</p>
                    <p class="question-title mb-1">
                        {{ getTitle(question.title) }}
                        <span v-if="question.isRequired" class="text-danger ml-1">*</span>
                    </p>
                    <p v-if="question.description && question.description.length && getTitle(question.description)"
                        class="text-muted small mb-3">
                        {{ getTitle(question.description) }}
                    </p>

                    <!-- Short Answer -->
                    <CInput v-if="isType(question, 'short', 'short_answer')" v-model="answers[question._id]"
                        placeholder="Your answer" class="mb-0" />

                    <!-- Paragraph -->
                    <CTextarea v-else-if="isType(question, 'paragraph')" v-model="answers[question._id]"
                        placeholder="Your answer" rows="4" class="mb-0" />

                    <!-- Multiple Choice -->
                    <div v-else-if="isType(question, 'multiple_choice')">
                        <div v-for="(opt, oIdx) in (question.config && question.config.options || [])" :key="oIdx"
                            class="d-flex align-items-center mb-2">
                            <input type="radio" :name="question._id" :value="getOptionLabel(opt)"
                                v-model="answers[question._id]" class="mr-2"
                                style="width:18px;height:18px;accent-color:#1a73e8;cursor:pointer;" />
                            <span>{{ getOptionLabel(opt) }}</span>
                        </div>
                    </div>

                    <!-- Checkboxes -->
                    <div v-else-if="isType(question, 'checkboxes')">
                        <div v-for="(opt, oIdx) in (question.config && question.config.options || [])" :key="oIdx"
                            class="d-flex align-items-center mb-2">
                            <input type="checkbox" :value="getOptionLabel(opt)" v-model="answers[question._id]"
                                class="mr-2" style="width:18px;height:18px;accent-color:#1a73e8;cursor:pointer;" />
                            <span>{{ getOptionLabel(opt) }}</span>
                        </div>
                    </div>

                    <!-- Rating -->
                    <div v-else-if="isType(question, 'rating')" class="d-flex align-items-center flex-wrap">
                        <button v-for="n in (question.config && question.config.maxRate || 5)" :key="n" class="star-btn"
                            :class="{ 'star-active': answers[question._id] >= n }" @click="answers[question._id] = n"
                            type="button">★</button>
                        <small v-if="answers[question._id]" class="ml-2 text-muted">
                            {{ answers[question._id] }} / {{ question.config && question.config.maxRate || 5 }}
                        </small>
                    </div>

                    <!-- File Upload -->
                    <div v-else-if="isType(question, 'file_upload')">
                        <input type="file" :multiple="question.config && question.config.maxFiles > 1"
                            class="text-muted" @change="e => handleFileChange(question._id, e.target.files)" />
                    </div>

                    <!-- Fallback -->
                    <CInput v-else v-model="answers[question._id]" placeholder="Your answer" class="mb-0" />
                </CCardBody>
            </CCard>

            <!-- Submit -->
            <CCard class="mb-4">
                <CCardBody class="p-3 d-flex justify-content-end">
                    <CButton color="primary" @click="submitForm" :disabled="submitting" class="px-5">
                        <CSpinner v-if="submitting" size="sm" class="mr-1" />
                        {{ submitting ? (isDuplicate ? 'Duplicating...' : 'Submitting...') : (isDuplicate ? 'Duplicate'
                            : 'Submit') }}
                    </CButton>
                </CCardBody>
            </CCard>

        </div>
    </div>
</template>

<script>
export default {
    name: 'Fillform',
    props: {
        formId: { type: String, required: true },
        isDuplicate: { type: Boolean, default: false }
    },
    data() {
        return {
            form: null,
            answers: {},
            loading: false,
            submitting: false,
            error: null
        };
    },
    created() {
        this.onInit();
    },
    methods: {
        async onInit() {
            this.loading = true;
            this.error = null;
            try {
                const data = await this.$store.dispatch('Forms/getById', { _id: this.formId });
                if (!data) throw new Error('Form not found');
                this.form = data;
                const init = {};
                (data.questions || []).forEach(q => {
                    init[q._id] = this.isType(q, 'checkboxes') ? [] : null;
                });
                this.answers = init;
            } catch (err) {
                this.error = err.message || 'Failed to load form.';
            } finally {
                this.loading = false;
            }
        },

        getTitle(arr) {
            if (!arr || !arr.length) return '';
            const lang = (navigator.language || 'en').substring(0, 2).toUpperCase();
            const match = arr.find(t => t.key && t.key.toUpperCase() === lang);
            return match ? match.value : arr[0].value;
        },

        getType(q) {
            const t = q.type;
            if (!t) return '';
            return (typeof t === 'object' ? (t.type || '') : t).toLowerCase();
        },

        isType(q, ...types) {
            return types.includes(this.getType(q));
        },

        getOptionLabel(opt) {
            if (!opt) return '';
            try { return opt.lang[0].choice[0].value || ''; } catch { return ''; }
        },

        handleFileChange(questionId, files) {
            this.$set(this.answers, questionId, Array.from(files));
        },

        async submitForm() {
            if (this.isDuplicate) {
                this.submitting = true;
                try {
                    console.log(this.form);

                } finally {
                    this.submitting = false;
                }
                return;
            }

            const missing = (this.form.questions || []).filter(q => {
                if (!q.isRequired) return false;
                const a = this.answers[q._id];
                return Array.isArray(a) ? a.length === 0 : (a === null || a === '' || a === undefined);
            });
            if (missing.length) {
                alert(`Please answer all required questions (${missing.length} remaining).`);
                return;
            }

            // Get current user ID from Vuex or localStorage
            const responder = '69a50fcc5f1adf15e09b2d86'
            if (!responder) {
                alert('You must be logged in to submit this form.');
                return;
            }

            this.submitting = true;
            try {
                const payload = {
                    responder,
                    form: this.form._id,
                    answers: Object.entries(this.answers).map(([question, response]) => ({
                        question,
                        response
                    }))
                };
                console.log(payload);
                await this.$store.dispatch('Responses/create', payload);
                alert('Form submitted successfully!');
            } catch (err) {
                alert('Submission failed. Please try again.');
                console.error('submitForm error:', err);
            } finally {
                this.submitting = false;
            }
        }
    }
}
</script>

<style scoped>
.back-btn {
    font-weight: 500;
}

/* Body */
.fillform-body {
    margin: 28px auto;
    padding: 0 16px 60px;
}

.fillform-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
}

/* Header card */
.header-card {
    border-top: 8px solid #1a73e8;
    border-radius: 12px !important;
}

.form-main-title {
    font-size: 1.9rem;
    font-weight: 700;
    color: #1f1f1f;
    line-height: 1.3;
    margin-bottom: 8px;
}

.form-main-desc {
    font-size: 0.95rem;
    color: #5f6368;
}

.form-divider {
    border: none;
    border-top: 1px solid #e8eaed;
    margin: 20px 0 14px;
}

.question-label-hint {
    font-size: 0.82rem;
    color: #9aa0a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Question */
.question-index {
    font-size: 0.78rem;
    color: #9aa0a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}

.question-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f1f1f;
}

/* Rating stars */
.star-btn {
    background: none;
    border: none;
    font-size: 1.9rem;
    cursor: pointer;
    color: #dadce0;
    padding: 0 2px;
    line-height: 1;
    transition: color 0.15s, transform 0.1s;
}

.star-btn:hover,
.star-btn.star-active {
    color: #f9ab00;
}

.star-btn:hover {
    transform: scale(1.15);
}
</style>