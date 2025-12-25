<template>
  <div class="response">

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
      <div v-if="loading" class="form-container">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading form...</p>
        </div>
      </div>

      <div v-else-if="!formData" class="form-container">
        <p class="error-text">Form not found</p>
      </div>

      <div v-else class="form-container">
        <!-- Form Header -->
        <div class="form-header">
          <h1 class="form-title">{{ formData.title }}</h1>
          <p class="form-description">{{ formData.description }}</p>
        </div>

        <!-- Questions -->
        <div class="questions-container">
          <div v-for="(question, index) in formData.questions" :key="question.id" class="question-block">
            <div class="question-label">
              Question {{ index + 1 }}
            </div>
            
            <div class="question-content">
              <label class="question-title">
                {{ question.label }}
                <span v-if="question.required" class="required">*</span>
              </label>

              <!-- Text Type (short_answer or paragraph) -->
              <input 
                v-if="question.type === 'text' && question.textType === 'short_answer'"
                type="text" 
                class="form-input" 
                placeholder="Your answer"
                :maxlength="question.maxLength"
                v-model="responses[question.id]"
              />

              <textarea 
                v-else-if="question.type === 'text' && question.textType === 'paragraph'"
                class="form-textarea" 
                placeholder="Your answer"
                rows="4"
                :maxlength="question.maxLength"
                v-model="responses[question.id]"
              ></textarea>

              <!-- Choices Type (Radio buttons) -->
              <div v-else-if="question.type === 'choices'" class="radio-group">
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

              <!-- Checkbox Type -->
              <div v-else-if="question.type === 'checkbox'" class="checkbox-group">
                <label v-for="option in question.options" :key="option" class="checkbox-option">
                  <input 
                    type="checkbox" 
                    :value="option"
                    v-model="responses[question.id]"
                  />
                  <span>{{ option }}</span>
                </label>
              </div>

              <!-- Rating Type (Star rating) -->
              <div v-else-if="question.type === 'rating'" class="star-rating">
                <button 
                  class="star-btn" 
                  v-for="i in question.max" 
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
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { formAPI, responseAPI } from '@/services/api';

const router = useRouter();
const route = useRoute();

const responses = reactive({});
const isSubmitting = ref(false);
const showSuccessModal = ref(false);
const loading = ref(true);
const formData = ref(null);

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
    
    console.log('Parsed title:', title);
    console.log('Parsed description:', description);
    
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
        if (q.options && Array.isArray(q.options)) {
          options = q.options.map(opt => {
            if (typeof opt === 'string') return opt;
            // Multilingual option
            const optEn = opt.value || (opt.key === 'en' ? opt.value : null);
            const optTh = opt.key === 'th' ? opt.value : null;
            return optEn || optTh || '';
          });
        }
        
        return {
          id: q._id,
          type: q.type,
          label: label,
          required: q.required || false,
          options: options,
          // Rating specific
          min: q.min || 1,
          max: q.max || 5,
          step: q.step || 1,
          // Text specific
          textType: q.textType || 'short_answer',
          maxLength: q.maxLength || 500
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
    
    console.log('Final formData:', formData.value);
    
    // Initialize checkbox arrays
    questions.forEach(question => {
      if (question.type === 'checkbox' && !responses[question.id]) {
        responses[question.id] = [];
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

const setRating = (questionId, rating) => {
  responses[questionId] = rating;
};

const validateForm = () => {
  if (!formData.value || !formData.value.questions) return false;
  
  const requiredQuestions = formData.value.questions.filter(q => q.required);
  
  for (const question of requiredQuestions) {
    const response = responses[question.id];
    
    if (!response || 
        (Array.isArray(response) && response.length === 0) || 
        response === '') {
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
    // Prepare response data matching backend Response schema
    const responseData = {
      form: formData.value.id, // ObjectId of the form
      answers: Object.keys(responses)
        .filter(questionId => responses[questionId] !== undefined && responses[questionId] !== null)
        .map(questionId => ({
          question: questionId, // ObjectId of the question
          response: responses[questionId] // Answer value (text, number, array, etc.)
        }))
    };
    
    console.log('Submitting response data:', responseData);
    
    // Submit to API
    const result = await responseAPI.createResponse(responseData);
    
    console.log('Form submitted successfully:', result);
    
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
  to { transform: rotate(360deg); }
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

/* ==================== TITLE & DESCRIPTION ==================== */
.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
}

.section-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: -0.4px;
  color: #333333;
  margin: 0;
}

.section-description {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #737373;
  margin: 0;
}

/* ==================== IMAGE ==================== */
.image-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
  object-fit: cover;
}

.image-caption {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #737373;
  margin: 0;
  text-align: center;
}

/* ==================== VIDEO ==================== */
.video-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.question-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-caption {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #737373;
  margin: 0;
  text-align: center;
}

/* ==================== SECTION DIVIDER ==================== */
.section-divider {
  padding: 16px 0;
}

.divider-line {
  width: 100%;
  height: 1px;
  background: #E5E5E5;
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

/* ==================== CHECKBOX ==================== */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-option {
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

.checkbox-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #333333;
}

/* ==================== DROPDOWN ==================== */
.form-select {
  width: fit-content;
  min-width: 200px;
  max-width: 100%;
  height: 36px;
  padding: 4px 32px 4px 12px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #333333;
  background: #FFFFFF;
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

/* ==================== FILE UPLOAD ==================== */
.file-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-upload-label {
  cursor: pointer;
}

.file-input {
  display: none;
}

.file-upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  transition: all 0.2s;
}

.file-upload-button:hover {
  background: rgba(229, 229, 229, 0.5);
  border-color: #333333;
}

.file-hint {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
  margin: 0;
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
  
  .section-title {
    font-size: 20px;
    line-height: 28px;
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
