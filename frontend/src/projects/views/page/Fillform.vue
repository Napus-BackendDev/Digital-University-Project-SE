<template>
    <div class="flex-grow-1">

        <ButtonBack />

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
                </CCardBody>
            </CCard>

            <!-- Question Cards -->
            <CCard v-for="(question, index) in form.questions" :key="question._id || index"
                :id="'question-card-' + question._id" class="mb-3"
                :class="{ 'card-error': errorIds.has(question._id) }">
                <CCardBody class="p-4">
                    <p v-if="!isType(question, 'title_description', 'image')" class="question-index">Question {{ index +
                        1 }}</p>
                    <p v-if="!isType(question, 'title_description', 'image')" class="question-title mb-1">
                        {{ getTitle(question.title) }}
                        <span v-if="question.isRequired" class="text-danger ml-1">*</span>
                    </p>
                    <p v-if="!isType(question, 'title_description', 'image') && question.description && question.description.length && getTitle(question.description)"
                        class="text-muted small mb-3">
                        {{ getTitle(question.description) }}
                    </p>

                    <!-- Short Answer -->
                    <CInput v-if="isType(question, 'short', 'short_answer')" v-model="answers[question._id]"
                        placeholder="Your answer" class="mb-0" @input="clearError(question._id)" />

                    <!-- Paragraph -->
                    <CTextarea v-else-if="isType(question, 'paragraph')" v-model="answers[question._id]"
                        placeholder="Your answer" rows="4" class="mb-0" @input="clearError(question._id)" />

                    <!-- Multiple Choice / Checkboxes -->
                    <div v-else-if="isType(question, 'multiple_choice', 'checkboxes', 'checkbox')"
                        class="options-container">
                        <label v-for="(opt, oIdx) in (question.config && question.config.choices || [])" :key="oIdx"
                            class="option-row">
                            <input
                                :type="(question.config && question.config.allowMultipleSelect) ? 'checkbox' : 'radio'"
                                :name="'q_' + question._id" :value="getOptionLabel(opt)" v-model="answers[question._id]"
                                class="option-input" @change="clearError(question._id)" />
                            <span>{{ getOptionLabel(opt) }}</span>
                        </label>
                    </div>

                    <!-- Rating -->
                    <div v-else-if="isType(question, 'rating')">
                        <div class="rating-container">
                            <button v-for="n in (question.config && question.config.maxRating || 5)" :key="n"
                                class="star-btn" :class="{ 'star-active': answers[question._id] >= n }"
                                @click="answers[question._id] = n; clearError(question._id)" type="button">★</button>
                        </div>
                        <small v-if="answers[question._id]" class="d-block text-center text-muted mt-1">
                            {{ answers[question._id] }} / {{ question.config && question.config.maxRating || 5 }}
                        </small>
                    </div>

                    <!-- File Upload -->
                    <div v-else-if="isType(question, 'file_upload')">
                        <input type="file" :multiple="question.config && question.config.maxFiles > 1"
                            class="text-muted"
                            @change="e => { handleFileChange(question._id, e.target.files); clearError(question._id); }" />
                    </div>

                    <!-- Title & Description -->
                    <div v-else-if="isType(question, 'title_description')">
                        <h2 class="section-display-title">{{ getTitle(question.title) }}</h2>
                        <p v-if="question.config && question.config.description && question.config.description.length"
                            class="section-display-desc mb-0">{{ getTitle(question.config.description) }}</p>
                    </div>

                    <!-- Image -->
                    <img v-else-if="isType(question, 'image') && question.config && question.config.image"
                        :src="question.config.image" class="question-full-image" alt="" />

                    <!-- Fallback -->
                    <CInput v-else v-model="answers[question._id]" placeholder="Your answer" class="mb-0" />
                </CCardBody>
            </CCard>

            <!-- Submit -->
            <div class="p-3 d-flex justify-content-end">
                <CButton color="primary" @click="submitForm" :disabled="submitting" class="px-5">
                    <CSpinner v-if="submitting" size="sm" class="mr-1" />
                    {{ submitting ? 'Submitting' : 'Submit' }}
                </CButton>
            </div>

        </div>
    </div>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue'

export default {
    name: 'Fillform',
    components: {
        ButtonBack
    },
    props: {
        formId: { type: String, required: true },
    },
    data() {
        return {
            form: null,
            answers: {},
            loading: false,
            submitting: false,
            error: null,
            errorIds: new Set()
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
                    if (this.isType(q, 'title_description', 'image')) return;
                    const isMulti = (this.isType(q, 'checkboxes', 'checkbox')) ||
                        (this.isType(q, 'multiple_choice') && q.config && q.config.allowMultipleSelect);
                    init[q._id] = isMulti ? [] : null;
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
            if (!opt || !opt.lang || !opt.lang.length) return '';
            const lang = (navigator.language || 'en').substring(0, 2).toUpperCase();
            const match = opt.lang.find(l => l.key && l.key.toUpperCase() === lang);
            return (match || opt.lang[0]).value || '';
        },

        handleFileChange(questionId, files) {
            this.$set(this.answers, questionId, Array.from(files));
        },

        clearError(questionId) {
            if (this.errorIds.has(questionId)) {
                const next = new Set(this.errorIds);
                next.delete(questionId);
                this.errorIds = next;
            }
        },

        async submitForm() {
            const missing = (this.form.questions || []).filter(q => {
                if (!q.isRequired) return false;
                const a = this.answers[q._id];
                return Array.isArray(a) ? a.length === 0 : (a === null || a === '' || a === undefined);
            });
            if (missing.length) {
                this.errorIds = new Set(missing.map(q => q._id));
                this.$nextTick(() => {
                    const el = document.getElementById('question-card-' + missing[0]._id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                return;
            }
            this.errorIds = new Set();

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
                        response: Array.isArray(response) ? response : (response ?? '')
                    }))
                };
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

/* Options (multiple choice / checkboxes) */
.options-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.option-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin: 0;
    font-weight: normal;
    width: 100%;
}

.option-input {
    width: 18px;
    height: 18px;
    accent-color: #1a73e8;
    cursor: pointer;
    flex-shrink: 0;
}

/* Rating stars */
.rating-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.star-btn {
    background: none;
    border: none;
    font-size: 1.9rem;
    cursor: pointer;
    color: #dadce0;
    padding: 0;
    line-height: 1;
    flex: 1;
    text-align: center;
    transition: color 0.15s, transform 0.1s;
}

.star-btn:hover,
.star-btn.star-active {
    color: #f9ab00;
}

.star-btn:hover {
    transform: scale(1.15);
}

/* Title & Description display */
.section-display-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #1f1f1f;
    line-height: 1.3;
    margin-bottom: 6px;
}

.section-display-desc {
    font-size: 0.95rem;
    color: #5f6368;
}

/* Image */
.question-full-image {
    display: block;
    width: 100%;
    border-radius: 4px;
}

/* Error state */
.card-error {
    border: 1.5px solid #e55353 !important;
    border-radius: 8px;
}
</style>