<template>
  <div class="preview">
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
                disabled 
              />

              <!-- Radio Options -->
              <div v-else-if="question.type === 'radio'" class="radio-group">
                <label v-for="option in question.options" :key="option" class="radio-option">
                  <input type="radio" :name="`question-${question.id}`" disabled />
                  <span>{{ option }}</span>
                </label>
              </div>

              <!-- Star Rating -->
              <div v-else-if="question.type === 'rating'" class="star-rating">
                <button class="star-btn" v-for="i in 5" :key="i" disabled>
                  <svg class="star-icon" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4L19.5 13.5L29 16L19.5 18.5L16 28L12.5 18.5L3 16L12.5 13.5L16 4Z" stroke="#D4D4D4" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>

              <!-- Textarea -->
              <textarea 
                v-else-if="question.type === 'textarea'"
                class="form-textarea" 
                placeholder="Your answer" 
                disabled
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
          <button class="submit-btn" disabled>Submit (Preview Mode)</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Navbar from '@/components/Navbar.vue';

const router = useRouter();
const route = useRoute();

const userEmail = ref('user@example.com');

// Mock data - ในอนาคตจะดึงจาก API หรือ store
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
    description: "Register for our upcoming webinar on December 15th",
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
        label: "Which session are you interested in?",
        type: "radio",
        required: true,
        options: ["Morning Session (9:00 AM)", "Afternoon Session (2:00 PM)", "Both Sessions"]
      },
      {
        id: 4,
        label: "Any dietary restrictions?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 3,
    title: "Employee Feedback Q4 2024",
    description: "Internal feedback survey for team members",
    questions: [
      {
        id: 1,
        label: "Employee ID",
        type: "text",
        required: true
      },
      {
        id: 2,
        label: "How would you rate the work environment?",
        type: "rating",
        required: true
      },
      {
        id: 3,
        label: "What improvements would you suggest?",
        type: "textarea",
        required: true
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
    console.log('Logging out...');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.preview {
  min-height: 100vh;
  background: #F5F5F5;
  font-family: 'Inter', sans-serif;
  padding-top: 65px;
}

/* ==================== MAIN CONTENT ==================== */
.main-content {
  position: relative;
  width: 1551px;
  height: 2493px;
  margin: 0 auto;
  padding: 0;
}

.back-btn {
  position: absolute;
  width: 150.69px;
  height: 36px;
  left: 159px;
  top: 92px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter';
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #F5F5F5;
}

/* ==================== FORM CONTAINER ==================== */
.form-container {
  position: absolute;
  width: 704px;
  left: 416px;
  top: 92px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 33px 33px 1px;
  gap: 32px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
}

.form-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px 0px 24px;
  gap: 8px;
  width: 638px;
  border-bottom: 1px solid #E5E5E5;
}

.form-title {
  width: 638px;
  font-family: 'Inter';
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.530859px;
  color: #333333;
  margin: 0;
}

.form-description {
  width: 638px;
  font-family: 'Inter';
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.3125px;
  color: #525252;
  margin: 0;
}

/* ==================== QUESTIONS ==================== */
.questions-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 32px;
  width: 638px;
}

.question-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px 0px 1px;
  gap: 8px;
  width: 638px;
  border-bottom: 1px solid #F5F5F5;
}

.question-label {
  width: 638px;
  height: 20px;
  font-family: 'Inter';
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #737373;
}

.question-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  width: 638px;
}

.question-title {
  width: 638px;
  height: 20px;
  font-family: 'Inter';
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: #DC2626;
  font-weight: 500;
}

.form-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 12px;
  width: 638px;
  height: 36px;
  background: rgba(229, 229, 229, 0.3);
  opacity: 0.5;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter';
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
}

.radio-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  width: 638px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  cursor: not-allowed;
}

.radio-option input[type="radio"] {
  width: 16px;
  height: 16px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
  opacity: 0.5;
  cursor: not-allowed;
}

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
  cursor: not-allowed;
}

.star-icon {
  width: 32px;
  height: 32px;
}

.form-textarea {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 8px 12px;
  width: 638px;
  height: 98px;
  background: rgba(229, 229, 229, 0.3);
  opacity: 0.5;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter';
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  resize: none;
}

/* ==================== FORM FOOTER ==================== */
.form-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 336.28px;
  width: 638px;
  height: 65px;
  border-top: 1px solid #E5E5E5;
}

.required-note {
  display: flex;
  gap: 4px;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #737373;
}

.submit-btn {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 24px;
  gap: 8px;
  width: 202.16px;
  height: 40px;
  background: #171717;
  opacity: 0.5;
  border: none;
  border-radius: 12px;
  font-family: 'Inter';
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  letter-spacing: -0.150391px;
  color: #FAFAFA;
  cursor: not-allowed;
}

/* ==================== UTILITIES ==================== */
.icon-16 {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 20px;
  }

  .main-content {
    padding: 97px 20px 40px 20px;
  }

  .form-container {
    width: 100%;
  }

  .navbar-user-email {
    display: none;
  }
}

@media (max-width: 480px) {
  .form-container {
    padding: 24px 20px 1px;
  }

  .form-title {
    font-size: 28px;
    line-height: 36px;
  }
}
</style>