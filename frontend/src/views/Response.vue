<template>
  <div class="response">

    <!-- Main Content -->
    <main class="main-content">
      <!-- Back Button -->
      <button class="back-btn" @click="goBack">
        <svg class="icon-16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="#333333" stroke-width="1.33333" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <span>Back to Forms</span>
      </button>

      <!-- Form Container -->
      <div v-if="loading" class="form-container">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading form...</p>
        </div>
      </div>

      <div v-else-if="!formData" class="form-container">
        <p class="error-text">Form not found</p>
      </div>

      <!-- Form Closed Message -->
      <div v-else-if="formStatus === 'close'" class="form-container">
        <div class="form-closed-message">
          <svg class="closed-icon" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#FEE2E2" />
            <path d="M24 24L40 40M40 24L24 40" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
          </svg>
          <h2>Form Closed</h2>
          <p>This form is no longer accepting responses.</p>
        </div>
      </div>

      <!-- Form Draft Message -->
      <div v-else-if="formStatus === 'draft'" class="form-container">
        <div class="form-closed-message">
          <svg class="closed-icon" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#FEF3C7" />
            <path d="M32 20V36M32 44H32.01" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" />
          </svg>
          <h2>Form Not Available</h2>
          <p>This form is not published yet.</p>
        </div>
      </div>

      <!-- Already Submitted Message (Limit to one response) -->
      <div v-else-if="hasAlreadySubmitted" class="form-container">
        <div class="form-closed-message">
          <svg class="closed-icon" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#DBEAFE" />
            <path d="M20 32L28 40L44 24" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          <h2>Already Submitted</h2>
          <p>You have already submitted a response to this form.</p>
        </div>
      </div>

      <div v-else class="form-container">
        <!-- Progress Bar -->
        <div v-if="formSettings?.showProgressBar" class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="progress-text">
            <template v-if="totalSections > 1">
              Section {{ currentSection + 1 }} of {{ totalSections }}
            </template>
            <template v-else>
              {{ progressPercent }}% completed
            </template>
          </span>
        </div>

        <!-- Section Indicator (always show if multi-page) -->
        <div v-if="totalSections > 1 && !formSettings?.showProgressBar" class="section-indicator">
          Section {{ currentSection + 1 }} of {{ totalSections }}
        </div>

        <!-- Form Header (show on first section only or single section) -->
        <div v-if="isFirstSection" class="form-header">
          <h1 class="form-title">{{ formData.title }}</h1>
          <p class="form-description">{{ formData.description }}</p>
        </div>

        <!-- Email Collection (show on first section only) -->
        <div v-if="formSettings?.collectEmails && isFirstSection" class="email-section">
          <label class="email-label">
            Email Address <span class="required">*</span>
          </label>
          <input type="email" v-model="respondentEmail" class="form-input" placeholder="your@email.com" required />
        </div>

        <!-- Questionsfill Component -->
        <Questionsfill :formTitle="''" :formDescription="''" :formStatus="formStatus" :questions="transformedQuestions"
          :responses="responses" :isResponseMode="true" :currentSection="currentSection" :totalSections="totalSections"
          :isSubmitting="isSubmitting" @submit="handleSubmit" @next="nextSection" @prev="prevSection" />
      </div>
    </main>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="success-icon">
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#00BC7D" opacity="0.1" />
            <circle cx="32" cy="32" r="24" fill="#00BC7D" />
            <path d="M20 32L28 40L44 24" stroke="white" stroke-width="3" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
        <h2 class="modal-title">Response Submitted!</h2>
        <p class="modal-message">{{ confirmationMessage }}</p>
        <div class="modal-actions">
          <button class="modal-button" @click="closeModal">Back to Forms</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast v-model="toastVisible" :message="toastMessage" :type="toastType" />
  </div>
</template>

<script>

import Questionsfill from '@/components/formfill/Questionsfill.vue';
import Toast from '@/components/Toast.vue';

export default {
  name: 'Response',
  components: {
    Questionsfill,
    Toast
  },
  data() {
    return {
      responses: {},
      isSubmitting: false,
      showSuccessModal: false,
      loading: true,
      toastVisible: false,
      toastMessage: '',
      toastType: 'info',
      formData: null,
      formSettings: null,
      formStatus: null,
      respondentEmail: '',
      confirmationMessage: 'Thank you for your response!',
      hasAlreadySubmitted: false,
      currentSection: 0
    }
  },

  mounted() {
    // Already handled by created -> onInit
  },

  created() {
    this.onInit();
  },

  beforeDestroy() {

  },

  methods: {
    onInit() {
      this.fetchFormData();
    },

    showToast(message, type = 'info') {
      this.toastMessage = message;
      this.toastType = type;
      this.toastVisible = true;
    },

    async fetchFormData() {
      this.loading = true;
      try {
        const formId = this.$route.params.id;


        // Handle nested data structure
        const formDataResponse = response.data.data || response.data;

        // Extract title and description
        const titleObj = formDataResponse.title?.find(t => t.key === 'en');
        const titleThObj = formDataResponse.title?.find(t => t.key === 'th');
        const title = titleObj?.value || titleThObj?.value || 'Untitled Form';

        const descObj = formDataResponse.description?.find(d => d.key === 'en');
        const descThObj = formDataResponse.description?.find(d => d.key === 'th');
        const description = descObj?.value || descThObj?.value || '';

        // Check if questions exist and map them
        let questions = [];

        if (formDataResponse.questions && Array.isArray(formDataResponse.questions)) {
          questions = formDataResponse.questions.map(q => {
            // Extract question title from multilingual array
            const titleObj = q.title?.find(t => t.key === 'en') || q.questionTitle?.find(t => t.key === 'en');
            const titleThObj = q.title?.find(t => t.key === 'th') || q.questionTitle?.find(t => t.key === 'th');
            const label = titleObj?.value || titleThObj?.value || '';
            // Parse options for checkbox and choices types
            let options = [];
            const optionsArray = q.config?.options || q.options;
            if (optionsArray && Array.isArray(optionsArray)) {
              options = optionsArray.map(opt => {
                if (typeof opt === 'string') return opt;

                // If option is an object with text and followUp
                if (opt.text) {
                  return {
                    id: opt.id,
                    text: opt.text,
                    hasFollowUp: opt.hasFollowUp || false,
                    followUpQuestion: opt.followUpQuestion || null
                  };
                }

                if (opt.label) return opt.label;
                if (opt.value) return opt.value;

                // Array of multilingual objects
                if (Array.isArray(opt)) {
                  const enOpt = opt.find(o => o.key === 'en');
                  const thOpt = opt.find(o => o.key === 'th');
                  return enOpt?.value || thOpt?.value || '';
                }

                // Single multilingual object
                const optEn = opt.key === 'en' ? opt.value : null;
                const optTh = opt.key === 'th' ? opt.value : null;
                return optEn || optTh || '';
              });
            }
            return {
              _id: q._id,
              type: q.type,
              label: label,
              required: q.required || false,
              options: options,
              min: q.min || 1,
              max: q.max || 5,
              step: q.step || 1,
              textType: q.textType || 'short_answer',
              maxLength: q.maxLength || 500,
              url: q.config?.imageUrl || q.config?.videoUrl || q.url || '',
              caption: q.config?.caption || q.caption || ''
            };
          });
        }

        this.formData = {
          id: formDataResponse._id,
          title: title,
          description: description,
          questions: questions
        };

        // เก็บ settings และ status
        this.formStatus = formDataResponse.status || 'draft';
        this.formSettings = formDataResponse.settings || {};
        this.confirmationMessage = this.formSettings.confirmationMessage || 'Thank you for your response!';

        // เช็คว่าเคย submit แล้วหรือยัง (ถ้าเปิด limitResponses)
        if (this.formSettings.limitResponses) {
          this.hasAlreadySubmitted = this.checkIfAlreadySubmitted(formDataResponse._id);
        }

        // Initialize checkbox arrays
        questions.forEach(question => {
          if (question.type === 'checkbox' && !this.responses[question._id]) {
            this.responses[question._id] = [];
          }
        });

      } catch (error) {
        this.showToast('Failed to load form. Please try again.', 'error');
        this.$router.push('/');
      } finally {
        this.loading = false;
      }
    },

    goBack() {
      this.$router.push('/home');
    },

    checkIfAlreadySubmitted(formId) {
      const submittedForms = JSON.parse(localStorage.getItem('submittedForms') || '[]');
      return submittedForms.includes(formId);
    },

    markAsSubmitted(formId) {
      const submittedForms = JSON.parse(localStorage.getItem('submittedForms') || '[]');
      if (!submittedForms.includes(formId)) {
        submittedForms.push(formId);
        localStorage.setItem('submittedForms', JSON.stringify(submittedForms));
      }
    },

    validateCurrentSection() {
      const requiredQuestions = this.currentSectionQuestions.filter(q => q.required);
      for (const question of requiredQuestions) {
        const response = this.responses[question._id];
        if (!response ||
          (Array.isArray(response) && response.length === 0) ||
          response === '') {
          this.showToast(`Please answer the required question: ${question.label}`, 'warning');
          return false;
        }
      }
      return true;
    },

    nextSection() {
      if (!this.validateCurrentSection()) return;

      if (this.currentSection < this.totalSections - 1) {
        this.currentSection++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    prevSection() {
      if (this.currentSection > 0) {
        this.currentSection--;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    buildNestedResponsePath(questionId, options) {
      const paths = [];
      const mainValue = this.responses[questionId];

      if (!mainValue) return paths;

      // Add main selection
      paths.push(mainValue);

      // Recursively find selected follow-ups and build path
      const findSelectedPath = (opts, prefix, currentPath) => {
        if (!opts || !Array.isArray(opts)) return;

        opts.forEach(opt => {
          const key = `${prefix}-${opt.id}`;
          const value = this.responses[key];

          if (value) {
            const newPath = `${currentPath}.${value}`;
            paths.push(newPath);

            // Continue recursively for nested follow-ups
            if (opt.hasFollowUp && opt.followUpQuestion?.options) {
              findSelectedPath(opt.followUpQuestion.options, key, newPath);
            }
          }
        });
      };

      if (options && Array.isArray(options)) {
        findSelectedPath(options, questionId, mainValue);
      }

      return paths;
    },

    async handleSubmit() {
      if (!this.validateCurrentSection()) {
        return;
      }

      const allRequiredQuestions = this.formData.questions.filter(q => q.required);
      for (const question of allRequiredQuestions) {
        const response = this.responses[question._id];
        if (!response ||
          (Array.isArray(response) && response.length === 0) ||
          response === '') {
          this.showToast('Please answer all required questions before submitting.', 'warning');
          return;
        }
      }
      this.isSubmitting = true;
      try {
        const answers = this.formData.questions
          .filter(q => {
            return !['title', 'image', 'video', 'divider', 'section-divider', 'title-description', 'section'].includes(q.type);
          })
          .map(q => {
            let response = this.responses[q._id];

            if ((q.type === 'choices' || q.type === 'choice') && q.options) {
              const nestedPaths = this.buildNestedResponsePath(q._id, q.options);
              if (nestedPaths.length > 0) {
                response = nestedPaths;
              }
            }

            if (q.type === 'file' && Array.isArray(response)) {
              response = response.filter(item => item instanceof File);
              if (response.length === 0) {
                response = undefined;
              }
            }

            return {
              question: q._id,
              response: response
            };
          })
          .filter(answer => {
            if (answer.response === undefined || answer.response === null) return false;
            if (answer.response === '') return false;
            if (Array.isArray(answer.response) && answer.response.length === 0) return false;
            return true;
          });

        const responseData = {
          form: this.formData.id,
          answers
        };

        const result = await responseAPI.submit(responseData);

        if (this.formSettings?.limitResponses) {
          this.markAsSubmitted(this.formData.id);
        }

        this.showSuccessModal = true;
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to submit form. Please try again.';
        this.showToast(errorMsg, 'error');
      } finally {
        this.isSubmitting = false;
      }
    },

    closeModal() {
      this.showSuccessModal = false;
      this.$router.push('/home');
    }
  },

  computed: {
    sections() {
      if (!this.formData?.questions?.length) return [[]];

      const result = [];
      let currentSectionQuestions = [];

      for (const question of this.formData.questions) {
        if (question.type === 'divider') {
          if (currentSectionQuestions.length > 0) {
            result.push(currentSectionQuestions);
          }
          currentSectionQuestions = [];
        } else {
          currentSectionQuestions.push(question);
        }
      }

      if (currentSectionQuestions.length > 0) {
        result.push(currentSectionQuestions);
      }

      return result.length > 0 ? result : [[]];
    },

    totalSections() {
      return this.sections.length;
    },

    currentSectionQuestions() {
      return this.sections[this.currentSection] || [];
    },

    transformedQuestions() {
      if (!this.currentSectionQuestions || this.currentSectionQuestions.length === 0) {
        return [];
      }

      return this.currentSectionQuestions.map(q => {
        let frontendType = q.type;

        if (q.type === 'checkbox') {
          frontendType = 'checkbox';
        }
        else if (q.type === 'choices' || q.type === 'choice') {
          frontendType = 'multiple-choice';
        }
        else if (q.type === 'dropdown') {
          frontendType = 'dropdown';
        }
        else if (q.type === 'rating') {
          frontendType = 'rating';
        }
        else if (q.type === 'file') {
          frontendType = 'file-upload';
        }
        else if (q.type === 'image') {
          frontendType = 'image';
        }
        else if (q.type === 'video') {
          frontendType = 'video';
        }
        else if (q.type === 'title') {
          frontendType = 'title';
        }
        else if (q.type === 'date') {
          frontendType = 'date';
        }
        else if (q.type === 'time') {
          frontendType = 'time';
        }
        else if (q.type === 'paragraph' || q.textType === 'paragraph') {
          frontendType = 'paragraph';
        }
        else if (q.type === 'short' || q.type === 'text' || q.textType === 'short_answer') {
          frontendType = 'short-answer';
        }

        const transformedOptions = q.options ? q.options.map((opt, idx) => {
          if (typeof opt === 'string') {
            return {
              id: `${q._id}-opt-${idx}`,
              text: opt
            };
          }
          return {
            id: opt.id || `${q._id}-opt-${idx}`,
            text: opt.text || opt,
            hasFollowUp: opt.hasFollowUp || false,
            followUpQuestion: opt.followUpQuestion || null
          };
        }) : [];

        const followUpData = q.config?.followUp || q.followUp;

        const transformed = {
          id: q._id,
          _id: q._id,
          type: frontendType,
          title: q.label || '',
          required: q.required || false,
          options: transformedOptions,
          followUp: followUpData || {},
          maxRating: q.max || 5,
          maxFiles: 1,
          imageUrl: q.url || '',
          videoUrl: q.url || '',
          caption: q.caption || '',
          placeholder: 'Your answer',
          maxLength: q.maxLength || 500
        };


        return transformed;
      });
    },

    isFirstSection() {
      return this.currentSection === 0;
    },

    isLastSection() {
      return this.currentSection === this.totalSections - 1;
    },

    progressPercent() {
      if (this.totalSections > 1) {
        return Math.round((this.currentSection / this.totalSections) * 100);
      }

      if (!this.formData?.questions?.length) return 0;
      const totalQuestions = this.formData.questions.filter(q =>
        !['title', 'divider', 'image'].includes(q.type)
      ).length;
      if (totalQuestions === 0) return 100;

      const answeredQuestions = Object.keys(this.responses).filter(key => {
        const value = this.responses[key];
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined && value !== '';
      }).length;

      return Math.round((answeredQuestions / totalQuestions) * 100);
    }
  },

  watch: {

  }
}
</script>

<style scoped>
.response {
  min-height: 100vh;
  background: var(--bg-gray-light);
  font-family: 'Inter', sans-serif;
  padding-top: 65px;
}

/* ==================== MAIN CONTENT ==================== */
.main-content {
  width: 100%;
  min-height: calc(100vh - 65px);
  max-width: 1216px;
  margin: 0 auto;
  padding: 32px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.icon-16 {
  width: 16px;
  height: 16px;
}

/* ==================== BACK BUTTON ==================== */
.back-btn {
  width: 151px;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.back-btn:hover {
  background: var(--bg-gray-light);
}

/* ==================== FORM CONTAINER ==================== */
.form-container {
  width: 100%;
  max-width: 704px;
  display: flex;
  flex-direction: column;
  padding: 33px;
  gap: 32px;
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-sizing: border-box;
  align-self: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: var(--text-primary);
  margin-top: 16px;
}

.error-text {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #DC2626;
  text-align: center;
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.form-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.53px;
  color: var(--text-primary);
  margin: 0;
}

.form-description {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.31px;
  color: #525252;
  margin: 0;
}

.required {
  color: #DC2626;
  font-weight: 500;
}

/* ==================== SECTION INDICATOR ==================== */
.section-indicator {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: var(--primary);
  text-align: center;
  padding: 12px;
  background: #EEF2FF;
  border-radius: 8px;
  margin-bottom: 8px;
}

/* ==================== SUCCESS MODAL ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 40px;
  max-width: 400px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0px 20px 60px rgba(0, 0, 0, 0.3);
}

.success-icon {
  width: 64px;
  height: 64px;
}

.modal-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
  text-align: center;
  color: var(--text-primary);
  margin: 0;
}

.modal-message {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  color: #525252;
  margin: 0;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.modal-button {
  padding: 12px 32px;
  background: #171717;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #FAFAFA;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.modal-button:hover {
  background: #404040;
}

.modal-button.secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.modal-button.secondary:hover {
  background: #EEF2FF;
}

/* ==================== PROGRESS BAR ==================== */
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22C55E, #16A34A);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ==================== FORM CLOSED MESSAGE ==================== */
.form-closed-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
}

.closed-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
}

.form-closed-message h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.form-closed-message p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

/* ==================== EMAIL SECTION ==================== */
.email-section {
  background: #F9FAFB;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.email-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 4px 12px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: var(--text-primary);
  box-sizing: border-box;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--text-primary);
  background: #FFFFFF;
}

.form-input::placeholder {
  color: #A3A3A3;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .main-content {
    padding: 20px 16px;
  }

  .form-container {
    padding: 24px 20px;
  }

  .form-title {
    font-size: 28px;
    line-height: 36px;
  }

  .progress-bar-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .progress-text {
    text-align: center;
  }
}
</style>
