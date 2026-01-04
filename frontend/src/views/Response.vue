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

      <!-- Form Closed Message -->
      <div v-else-if="formStatus === 'close'" class="form-container">
        <div class="form-closed-message">
          <svg class="closed-icon" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#FEE2E2"/>
            <path d="M24 24L40 40M40 24L24 40" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <h2>Form Closed</h2>
          <p>This form is no longer accepting responses.</p>
        </div>
      </div>

      <!-- Form Draft Message -->
      <div v-else-if="formStatus === 'draft'" class="form-container">
        <div class="form-closed-message">
          <svg class="closed-icon" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#FEF3C7"/>
            <path d="M32 20V36M32 44H32.01" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <h2>Form Not Available</h2>
          <p>This form is not published yet.</p>
        </div>
      </div>

      <!-- Already Submitted Message (Limit to one response) -->
      <div v-else-if="hasAlreadySubmitted" class="form-container">
        <div class="form-closed-message">
          <svg class="closed-icon" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="#DBEAFE"/>
            <path d="M20 32L28 40L44 24" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
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
          <input 
            type="email" 
            v-model="respondentEmail"
            class="form-input"
            placeholder="your@email.com"
            required
          />
        </div>

        <!-- Questions (show current section only) -->
        <div class="questions-container">
          <div v-for="question in currentSectionQuestions" :key="question._id" class="question-block">
            <div class="question-label">
              Question {{ getGlobalQuestionIndex(question) }}
            </div>
            
            <div class="question-content">
                            <!-- Date Type -->
                            <input
                              v-if="question.type === 'date'"
                              type="date"
                              class="form-input"
                              v-model="responses[question._id]"
                            />

                            <!-- Dropdown Type -->
                            <select
                              v-else-if="question.type === 'dropdown'"
                              class="form-select"
                              v-model="responses[question._id]"
                            >
                              <option value="" disabled selected>Select an option</option>
                              <option v-for="option in question.options" :key="option" :value="option">{{ option }}</option>
                            </select>

                            <!-- File Upload Type -->
                            <div v-else-if="question.type === 'file'" class="file-upload">
                              <input
                                class="file-input"
                                type="file"
                                :id="'file-' + question._id"
                                @change="e => handleFileChange(e, question._id)"
                              />
                              <label class="file-upload-label" :for="'file-' + question._id">
                                <span class="file-upload-button">Choose file</span>
                              </label>
                              <div v-if="responses[question._id]">
                                <span>Selected: {{ responses[question._id].name }}</span>
                              </div>
                            </div>

                            <!-- Image Type (editor ใส่มาให้ user ดูเท่านั้น) -->
                            <div v-else-if="question.type === 'image'">
                              <img v-if="question.url" :src="question.url" alt="Image" class="question-image" style="max-width:200px;max-height:200px;" />
                              <div v-else style="color:#aaa">No image provided.</div>
                            </div>

                            <!-- Time Type -->
                            <input
                              v-else-if="question.type === 'time'"
                              type="time"
                              class="form-input"
                              v-model="responses[question._id]"
                            />

                            <!-- Video Type (editor ใส่มาให้ user ดูเท่านั้น) -->
                            <div v-else-if="question.type === 'video'">
                              <video v-if="question.url" :src="question.url" controls style="max-width:300px;max-height:200px;"></video>
                              <div v-else style="color:#aaa">No video provided.</div>
                            </div>

                            <!-- Title & Description (Content Block) -->
                            <div v-else-if="question.type === 'title'">
                              <h2 class="section-title">{{ question.label }}</h2>
                              <p class="section-description">{{ question.description }}</p>
                            </div>

                            <!-- Section Divider (Content Block) -->
                            <div v-else-if="question.type === 'section-divider'" class="section-divider">
                              <div class="divider-line"></div>
                            </div>
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
                v-model="responses[question._id]"
              />

              <textarea 
                v-else-if="question.type === 'text' && question.textType === 'paragraph'"
                class="form-textarea" 
                placeholder="Your answer"
                rows="4"
                :maxlength="question.maxLength"
                v-model="responses[question._id]"
              ></textarea>

              <!-- Choices Type (Radio buttons) -->
              <div v-else-if="question.type === 'choices'" class="radio-group">
                <label v-for="option in question.options" :key="option" class="radio-option">
                  <input 
                    type="radio" 
                    :name="`question-${question._id}`"
                    :value="option"
                    v-model="responses[question._id]"
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
                    v-model="responses[question._id]"
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
                  @click="setRating(question._id, i)"
                  :class="{ active: responses[question._id] >= i }"
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
          
          <!-- Navigation Buttons for Multi-section Forms -->
          <div class="navigation-buttons">
            <!-- Previous Button (hidden on first section) -->
            <button 
              v-if="!isFirstSection" 
              class="nav-btn prev-btn" 
              @click="prevSection"
              type="button"
            >
              <svg class="icon-16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Previous
            </button>
            
            <!-- Spacer when no previous button -->
            <div v-else></div>
            
            <!-- Next Button (for non-last sections) -->
            <button 
              v-if="!isLastSection" 
              class="nav-btn next-btn" 
              @click="nextSection"
              type="button"
            >
              Next
              <svg class="icon-16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            
            <!-- Submit Button (only on last section) -->
            <button 
              v-else 
              class="submit-btn" 
              @click="handleSubmit" 
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit' }}
            </button>
          </div>
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
        <p class="modal-message">{{ confirmationMessage }}</p>
        <div class="modal-actions">
          <button class="modal-button" @click="closeModal">Back to Forms</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Handle file upload (generic)
function handleFileChange(e, qid) {
  const file = e.target.files[0];
  responses[qid] = file;
}

// Handle image upload with preview
function handleImageChange(e, qid) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      responses[qid] = { file, preview: ev.target.result };
    };
    reader.readAsDataURL(file);
  } else {
    responses[qid] = null;
  }
}

// Handle video upload with preview
function handleVideoChange(e, qid) {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    responses[qid] = { file, preview: url };
  } else {
    responses[qid] = null;
  }
}
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
          _id: q._id,
          type: q.type,
          label: label,
          required: q.required || false,
          options: options,
          min: q.min || 1,
          max: q.max || 5,
          step: q.step || 1,
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
    
    // เก็บ settings และ status
    formStatus.value = formDataResponse.status || 'draft';
    formSettings.value = formDataResponse.settings || {};
    confirmationMessage.value = formSettings.value.confirmationMessage || 'Thank you for your response!';
    
    // เช็คว่าเคย submit แล้วหรือยัง (ถ้าเปิด limitResponses)
    if (formSettings.value.limitResponses) {
      hasAlreadySubmitted.value = checkIfAlreadySubmitted(formDataResponse._id);
    }
    
    console.log('Form status:', formStatus.value);
    console.log('Form settings:', formSettings.value);
    console.log('Has already submitted:', hasAlreadySubmitted.value);
    console.log('Final formData:', formData.value);
    
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

const setRating = (questionId, rating) => {
  responses[questionId] = rating;
};

const validateForm = () => {
  if (!formData.value || !formData.value.questions) return false;
  const requiredQuestions = formData.value.questions.filter(q => q.required);
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

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
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
  flex-direction: column;
  gap: 16px;
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

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  background: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.prev-btn svg {
  color: #737373;
}

.next-btn {
  background: #6366F1;
  border-color: #6366F1;
  color: #FFFFFF;
}

.next-btn:hover {
  background: #4F46E5;
  border-color: #4F46E5;
}

.next-btn svg {
  color: #FFFFFF;
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
