<template>
  <div class="response">
    <!-- Navbar -->
    <Navbar />

    <!-- Main Content -->
    <main class="main-content">
      <!-- Back Button -->
      <button class="back-btn" @click="goBack">
        <svg class="icon-16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="#333333" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Back to Forms</span>
      </button>

      <!-- Form Container -->
      <div class="form-container">
        <!-- Form Header -->
        <div class="form-header">
          <h1 class="form-title">{{ formData.title }}</h1>
          <p class="form-description">{{ formData.description }}</p>
        </div>

        <!-- Questions -->
        <div class="questions-container">
          <div v-for="(question, index) in formData.questions" :key="question.id" class="question-block">
            <div class="question-label">Question {{ index + 1 }}</div>
            <div class="question-content">
              <label class="question-title">
                {{ question.label }}
                <span v-if="question.required" class="required">*</span>
              </label>

              <!-- Text Input -->
              <input 
                v-if="question.type === 'text'"
                type="text" 
                class="form-input" 
                placeholder="Your answer"
                v-model="responses[question.id]"
              />

              <!-- Radio Options -->
              <div v-else-if="question.type === 'radio'" class="radio-group">
                <label v-for="option in question.options" :key="option" class="radio-option">
                  <input 
                    type="radio" 
                    :name="`question-${question.id}`"
                    :value="option"
                    v-model="responses[question.id]"
                  />
                  <span>{{ option }}</span>
                </label>
              </div>

              <!-- Star Rating -->
              <div v-else-if="question.type === 'rating'" class="star-rating">
                <button 
                  class="star-btn" 
                  v-for="i in 5" 
                  :key="i"
                  type="button"
                  @click="setRating(question.id, i)"
                  :class="{ active: responses[question.id] >= i }"
                >
                  <svg class="star-icon" viewBox="0 0 32 32" fill="none">
                    <path 
                      d="M16 4L19.5 13.5L29 16L19.5 18.5L16 28L12.5 18.5L3 16L12.5 13.5L16 4Z" 
                      :stroke="responses[question.id] >= i ? '#FCD34D' : '#D4D4D4'" 
                      :fill="responses[question.id] >= i ? '#FCD34D' : 'none'"
                      stroke-width="2.66667" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <!-- Textarea -->
              <textarea 
                v-else-if="question.type === 'textarea'"
                class="form-textarea" 
                placeholder="Your answer"
                v-model="responses[question.id]"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Form Footer -->
        <div class="form-footer">
          <div class="required-note">
            <span class="required">*</span>
            <span>Required field</span>
          </div>
          <button class="submit-btn" @click="handleSubmit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </div>
    </main>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="success-icon">
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#00BC7D" opacity="0.1"/>
            <circle cx="32" cy="32" r="24" fill="#00BC7D"/>
            <path d="M20 32L28 40L44 24" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="modal-title">Response Submitted!</h2>
        <p class="modal-message">Thank you for your response. Your answers have been recorded successfully.</p>
        <button class="modal-button" @click="closeModal">Back to Forms</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Navbar from '@/components/Navbar.vue';

const router = useRouter();
const route = useRoute();

const userEmail = ref('user@example.com');
const responses = reactive({});
const isSubmitting = ref(false);
const showSuccessModal = ref(false);

// Mock data
const formsData = [
  {
    id: 1,
    title: "Customer Satisfaction Survey",
    description: "Help us improve our services by sharing your feedback",
    questions: [
      {
        id: 1,
        label: "What is your name?",
        type: "text",
        required: true
      },
      {
        id: 2,
        label: "How satisfied are you with our service?",
        type: "radio",
        required: true,
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
      },
      {
        id: 3,
        label: "Rate your overall experience",
        type: "rating",
        required: true
      },
      {
        id: 4,
        label: "What can we do to improve?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 2,
    title: "Event Registration Form",
    description: "Register for our upcoming event",
    questions: [
      {
        id: 1,
        label: "Full Name",
        type: "text",
        required: true
      },
      {
        id: 2,
        label: "Email Address",
        type: "text",
        required: true
      },
      {
        id: 3,
        label: "Will you attend the networking session?",
        type: "radio",
        required: true,
        options: ["Yes", "No", "Maybe"]
      },
      {
        id: 4,
        label: "Additional comments",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 3,
    title: "Employee Feedback Q4 2024",
    description: "Share your feedback about the workplace",
    questions: [
      {
        id: 1,
        label: "Employee ID",
        type: "text",
        required: true
      },
      {
        id: 2,
        label: "Rate your work-life balance",
        type: "rating",
        required: true
      },
      {
        id: 3,
        label: "What improvements would you suggest?",
        type: "textarea",
        required: false
      }
    ]
  }
];

const formData = computed(() => {
  const formId = parseInt(route.params.id);
  return formsData.find(form => form.id === formId) || formsData[0];
});

const goBack = () => {
  router.push('/');
};

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    router.push('/');
  }
};

const setRating = (questionId, rating) => {
  responses[questionId] = rating;
};

const validateForm = () => {
  const requiredQuestions = formData.value.questions.filter(q => q.required);
  
  for (const question of requiredQuestions) {
    if (!responses[question.id] || responses[question.id] === '') {
      alert(`Please answer the required question: ${question.label}`);
      return false;
    }
  }
  
  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Form submitted with responses:', responses);
    
    // Show success modal
    showSuccessModal.value = true;
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Failed to submit form. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  showSuccessModal.value = false;
  router.push('/');
};
</script>

<style scoped>
.response {
  min-height: 100vh;
  background: #F5F5F5;
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
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.back-btn:hover {
  background: #F5F5F5;
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
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-sizing: border-box;
  align-self: center;
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
  border-bottom: 1px solid #E5E5E5;
}

.form-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.53px;
  color: #333333;
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

/* ==================== QUESTIONS ==================== */
.questions-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.question-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 32px;
  border-bottom: 1px solid #F5F5F5;
}

.question-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.question-label {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #737373;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-title {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: #DC2626;
  font-weight: 500;
}

/* ==================== INPUT FIELDS ==================== */
.form-input {
  width: 100%;
  height: 36px;
  padding: 4px 12px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  box-sizing: border-box;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #333333;
  background: #FFFFFF;
}

.form-input::placeholder {
  color: #A3A3A3;
}

.form-textarea {
  width: 100%;
  min-height: 98px;
  padding: 8px 12px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  resize: vertical;
  box-sizing: border-box;
  transition: all 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #333333;
  background: #FFFFFF;
}

.form-textarea::placeholder {
  color: #A3A3A3;
}

/* ==================== RADIO OPTIONS ==================== */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
}

.radio-option input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #333333;
}

/* ==================== STAR RATING ==================== */
.star-rating {
  display: flex;
  gap: 8px;
}

.star-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.star-btn:hover {
  transform: scale(1.1);
}

.star-icon {
  width: 32px;
  height: 32px;
}

/* ==================== FORM FOOTER ==================== */
.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #E5E5E5;
}

.required-note {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #737373;
}

.submit-btn {
  min-width: 140px;
  height: 40px;
  padding: 0 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #171717;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #FAFAFA;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #404040;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  color: #333333;
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
}

.modal-button:hover {
  background: #404040;
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
  
  .form-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .submit-btn {
    width: 100%;
  }
}
</style>
