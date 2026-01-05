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
        <Questionsfill 
          :formTitle="''"
          :formDescription="''"
          :formStatus="formStatus"
          :questions="transformedQuestions"
          :responses="responses"
          :isResponseMode="true"
          :currentSection="currentSection"
          :totalSections="totalSections"
          :isSubmitting="isSubmitting"
          @submit="handleSubmit"
          @next="nextSection"
          @prev="prevSection"
        />
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
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { formAPI, responseAPI } from '@/services/api';
import Questionsfill from '@/components/formfill/Questionsfill.vue';

const router = useRouter();
const route = useRoute();

const responses = reactive({});
const isSubmitting = ref(false);
const showSuccessModal = ref(false);
const loading = ref(true);
const formData = ref(null);
const formSettings = ref(null);
const formStatus = ref(null);
const respondentEmail = ref('');
const confirmationMessage = ref('Thank you for your response!');
const hasAlreadySubmitted = ref(false);

// ===== Section Navigation (Multi-page forms like Google Forms) =====
const currentSection = ref(0);

// แบ่ง questions เป็น sections โดยใช้ divider เป็นจุดแบ่ง
const sections = computed(() => {
  if (!formData.value?.questions?.length) return [[]];

  const result = [];
  let currentSectionQuestions = [];

  for (const question of formData.value.questions) {
    if (question.type === 'divider') {
      // เจอ divider = จบ section ปัจจุบัน เริ่ม section ใหม่
      if (currentSectionQuestions.length > 0) {
        result.push(currentSectionQuestions);
      }
      currentSectionQuestions = [];
    } else {
      currentSectionQuestions.push(question);
    }
  }

  // อย่าลืม section สุดท้าย
  if (currentSectionQuestions.length > 0) {
    result.push(currentSectionQuestions);
  }

  return result.length > 0 ? result : [[]];
});

// จำนวน sections ทั้งหมด
const totalSections = computed(() => sections.value.length);

// Questions ที่ต้องแสดงใน section ปัจจุบัน
const currentSectionQuestions = computed(() => sections.value[currentSection.value] || []);

// Transform questions from backend format to frontend format
const transformedQuestions = computed(() => {
  if (!currentSectionQuestions.value || currentSectionQuestions.value.length === 0) {
    return [];
  }

  return currentSectionQuestions.value.map(q => {
    // Map backend type to frontend type
    let frontendType = q.type;
    
    // Priority 1: Check specific backend types first (most reliable)
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
    // Priority 2: For paragraph (can have type 'paragraph' or textType 'paragraph')
    else if (q.type === 'paragraph' || q.textType === 'paragraph') {
      frontendType = 'paragraph';
    }
    // Priority 3: For short/text questions - check textType or default to short-answer
    else if (q.type === 'short' || q.type === 'text' || q.textType === 'short_answer') {
      frontendType = 'short-answer';
    }

    // Transform options to have id and text (preserve followUp structure)
    const transformedOptions = q.options ? q.options.map((opt, idx) => {
      if (typeof opt === 'string') {
        return {
          id: `${q._id}-opt-${idx}`,
          text: opt
        };
      }
      // Option is an object with followUp
      return {
        id: opt.id || `${q._id}-opt-${idx}`,
        text: opt.text || opt,
        hasFollowUp: opt.hasFollowUp || false,
        followUpQuestion: opt.followUpQuestion || null
      };
    }) : [];

    // Transform follow-up questions if they exist
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
});

// เช็คว่าเป็น section แรกหรือไม่
const isFirstSection = computed(() => currentSection.value === 0);

// เช็คว่าเป็น section สุดท้ายหรือไม่
const isLastSection = computed(() => currentSection.value === totalSections.value - 1);

// Validate เฉพาะ section ปัจจุบัน
const validateCurrentSection = () => {
  const requiredQuestions = currentSectionQuestions.value.filter(q => q.required);
  for (const question of requiredQuestions) {
    const response = responses[question._id];
    if (!response ||
      (Array.isArray(response) && response.length === 0) ||
      response === '') {
      alert(`Please answer the required question: ${question.label}`);
      return false;
    }
  }
  return true;
};

// ไปหน้าถัดไป
const nextSection = () => {
  if (!validateCurrentSection()) return;

  if (currentSection.value < totalSections.value - 1) {
    currentSection.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// กลับหน้าก่อนหน้า
const prevSection = () => {
  if (currentSection.value > 0) {
    currentSection.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Get global question index (across all sections, excluding dividers)
const getGlobalQuestionIndex = (question) => {
  if (!formData.value?.questions) return 1;
  const nonDividerQuestions = formData.value.questions.filter(q => q.type !== 'divider');
  const index = nonDividerQuestions.findIndex(q => q._id === question._id);
  return index >= 0 ? index + 1 : 1;
};

// เช็คว่า user เคย submit form นี้แล้วหรือยัง (ใช้ localStorage)
const checkIfAlreadySubmitted = (formId) => {
  const submittedForms = JSON.parse(localStorage.getItem('submittedForms') || '[]');
  return submittedForms.includes(formId);
};

// บันทึกว่า user submit form นี้แล้ว
const markAsSubmitted = (formId) => {
  const submittedForms = JSON.parse(localStorage.getItem('submittedForms') || '[]');
  if (!submittedForms.includes(formId)) {
    submittedForms.push(formId);
    localStorage.setItem('submittedForms', JSON.stringify(submittedForms));
  }
};

// คำนวณ progress percent (based on sections if multi-page, otherwise based on answers)
const progressPercent = computed(() => {
  // ถ้ามีหลาย section ใช้ section-based progress
  if (totalSections.value > 1) {
    return Math.round((currentSection.value / totalSections.value) * 100);
  }

  // ถ้ามี section เดียว ใช้ answer-based progress
  if (!formData.value?.questions?.length) return 0;
  const totalQuestions = formData.value.questions.filter(q =>
    !['title', 'divider', 'image'].includes(q.type)
  ).length;
  if (totalQuestions === 0) return 100;

  const answeredQuestions = Object.keys(responses).filter(key => {
    const value = responses[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  }).length;

  return Math.round((answeredQuestions / totalQuestions) * 100);
});

// Fetch form data from API
const fetchFormData = async () => {
  loading.value = true;
  try {
    const formId = route.params.id;
    console.log('Fetching form ID:', formId);

    const response = await formAPI.getById(formId);
    console.log('API Response:', response.data);

    // Handle nested data structure
    const formDataResponse = response.data.data || response.data;
    console.log('Form data:', formDataResponse);

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
      console.log('Using questions array:', formDataResponse.questions);
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
    } else {
      console.warn('No questions found in response. Available properties:', Object.keys(formDataResponse));
    }

    console.log('Parsed questions:', questions);

    formData.value = {
      id: formDataResponse._id,
      title: title,
      description: description,
      questions: questions
    };

    // เก็บ settings และ status
    formStatus.value = formDataResponse.status || 'draft';
    formSettings.value = formDataResponse.settings || {};
    confirmationMessage.value = formSettings.value.confirmationMessage || 'Thank you for your response!';

    // เช็คว่าเคย submit แล้วหรือยัง (ถ้าเปิด limitResponses)
    if (formSettings.value.limitResponses) {
      hasAlreadySubmitted.value = checkIfAlreadySubmitted(formDataResponse._id);
    }

    // Initialize checkbox arrays
    questions.forEach(question => {
      if (question.type === 'checkbox' && !responses[question._id]) {
        responses[question._id] = [];
      }
    });

  } catch (error) {
    console.error('Error fetching form:', error);
    console.error('Error details:', error.response?.data || error.message);
    alert('Failed to load form. Please try again.');
    router.push('/');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFormData();
});

const goBack = () => {
  router.push('/');
};

const handleSubmit = async () => {
  // Validate current section before submit
  if (!validateCurrentSection()) {
    return;
  }
  
  // Final validation: check all required questions across all sections
  const allRequiredQuestions = formData.value.questions.filter(q => q.required);
  for (const question of allRequiredQuestions) {
    const response = responses[question._id];
    if (!response ||
      (Array.isArray(response) && response.length === 0) ||
      response === '') {
      alert(`Please answer all required questions before submitting.`);
      return;
    }
  }
  isSubmitting.value = true;
  try {
    // Prepare response data matching backend Response schema
    const answers = formData.value.questions.map(q => ({
      question: q._id,
      response: responses[q._id]
    }));
    const responseData = {
      form: formData.value.id, // ObjectId of the form
      answers
    };
    console.log('Submitting response data:', responseData);
    // Submit to API
    const result = await responseAPI.submit(responseData);
    console.log('Form submitted successfully:', result);

    // บันทึกว่า user submit แล้ว (สำหรับ limitResponses)
    if (formSettings.value?.limitResponses) {
      markAsSubmitted(formData.value.id);
    }

    // Show success modal
    showSuccessModal.value = true;
  } catch (error) {
    console.error('Error submitting form:', error);
    console.error('Error response:', error.response?.data);
    const errorMsg = error.response?.data?.message || 'Failed to submit form. Please try again.';
    alert(errorMsg);
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  showSuccessModal.value = false;
  router.push('/');
};

// Submit another response - reset form and close modal
const submitAnotherResponse = () => {
  // Clear all responses
  Object.keys(responses).forEach(key => {
    if (Array.isArray(responses[key])) {
      responses[key] = [];
    } else {
      responses[key] = null;
    }
  });
  respondentEmail.value = '';
  currentSection.value = 0; // Reset to first section
  showSuccessModal.value = false;
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  border: 3px solid #E5E5E5;
  border-top-color: #333333;
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
  color: #333333;
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
  color: #6366F1;
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
  color: #6366F1;
  border: 1px solid #6366F1;
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
  background: #E5E5E5;
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
  color: #666;
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
  color: #333;
  margin: 0 0 12px 0;
}

.form-closed-message p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* ==================== EMAIL SECTION ==================== */
.email-section {
  background: #F9FAFB;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.email-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

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
