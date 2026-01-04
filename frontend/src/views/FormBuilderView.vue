<script setup>
/**
 * FormBuilderView - หน้าสร้างและแก้ไขฟอร์ม
 * แบ่งเป็น 3 tabs: Questions, Responses, Settings
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { useFormStore } from '@/stores/form'
import { questionsAPI } from '@/services/api'

// Composables
import { useModal, useQuestionManager, useFormSettings, useAutoSave } from '@/composables'

// Icons
import { ArrowLeftIcon, QuestionsIcon, ResponsesIcon, SettingsIcon } from '@/components/icons'

// Tab Components
import { QuestionsTab, ResponsesTab, SettingsTab } from '@/components/tabs'

// Modal
import Modal from '@/components/Modal.vue'


/* ===================================
   Setup & State
   =================================== */
const route = useRoute()
const formStore = useFormStore()

const formId = computed(() => route.params.id)
const activeTab = ref('questions')
const formTitle = ref('Untitled Form')
const formDescription = ref('')
const currentFormStatus = ref('draft') // เก็บ status ปัจจุบันจาก database

const formUrl = computed(() => {
  const baseUrl = window.location.origin
  return formId.value ? `${baseUrl}/form/${formId.value}` : ''
})


/* ===================================
   Composables
   =================================== */
const { modalVisible, modalType, modalTitle, modalMessage, showModal, closeModal } = useModal()

const { 
  questions, 
  expandedQuestionId, 
  toggleQuestion, 
  addQuestion, 
  deleteQuestion, 
  updateQuestion, 
  addOption, 
  removeOption, 
  onQuestionReorder,
  setQuestions 
} = useQuestionManager()

const { 
  settings, 
  addCollaborator, 
  removeCollaborator, 
  loadSettings,
  buildSchedule,
  buildSettingsPayload 
} = useFormSettings()


/* ===================================
   Auto-save
   =================================== */

// แปลง frontend question type เป็น backend type
function mapQuestionType(frontendType) {
  const typeMap = {
    'short-answer': 'short',
    'paragraph': 'paragraph',
    'multiple-choice': 'choices',
    'checkbox': 'checkbox',
    'rating': 'rating',
    'file-upload': 'file',
    'title-description': 'title',
    'image': 'image',
    'section-divider': 'divider'
  }
  return typeMap[frontendType] || frontendType
}

async function saveForm() {
  if (!formId.value) return
  
  try {
    // แยก questions ที่มี _id (existing) และไม่มี _id (new)
    const existingQuestions = questions.value.filter(q => q && q._id)
    const newQuestions = questions.value.filter(q => q && !q._id)
    
    // อัพเดท existing questions ใน database
    for (const q of existingQuestions) {
      const updateData = {
        _id: q._id,
        title: [{ key: 'en', value: q.title || '' }],
        type: mapQuestionType(q.type),
        required: q.required || false,
        order: questions.value.indexOf(q) + 1,
        config: {
          options: q.options || [],
          maxRating: q.maxRating || 5,
          allowSpecificTypes: q.allowSpecificTypes || false,
          allowedFileTypes: q.allowedFileTypes || [],
          maxFiles: q.maxFiles || 1,
          maxSize: q.maxSize || 10,
          // Image & Video fields
          imageUrl: q.imageUrl || '',
          videoUrl: q.videoUrl || '',
          caption: q.caption || ''
        }
      }
      await questionsAPI.update(updateData)
    }
    
    // สร้าง questions ใหม่ใน database
    const createdQuestionIds = []
    for (const q of newQuestions) {
      const questionData = {
        form: formId.value,
        title: [{ key: 'en', value: q.title || '' }],
        type: mapQuestionType(q.type),
        required: q.required || false,
        order: questions.value.indexOf(q) + 1,
        config: {
          options: q.options || [],
          maxRating: q.maxRating || 5,
          allowSpecificTypes: q.allowSpecificTypes || false,
          allowedFileTypes: q.allowedFileTypes || [],
          maxFiles: q.maxFiles || 1,
          maxSize: q.maxSize || 10,
          // Image & Video fields
          imageUrl: q.imageUrl || '',
          videoUrl: q.videoUrl || '',
          caption: q.caption || ''
        }
      }
      
      const result = await questionsAPI.create(questionData)
      if (result.data && result.data._id) {
        // อัพเดท question ใน local state ด้วย _id ใหม่
        q._id = result.data._id
        createdQuestionIds.push(result.data._id)
      }
    }
    
    // รวม question IDs ทั้งหมด
    const allQuestionIds = [
      ...existingQuestions.map(q => q._id),
      ...createdQuestionIds
    ]
    
    // ใช้ status ใหม่ถ้ามีการเปลี่ยน หรือใช้ status ปัจจุบัน
    const statusToSave = settings.value.formStatus || currentFormStatus.value || 'draft'
    
    console.log('Saving form with:', {
      formId: formId.value,
      questionIds: allQuestionIds,
      status: statusToSave
    })
    
    const result = await formStore.updateForm({
      _id: formId.value,
      title: [{ key: 'en', value: formTitle.value }],
      description: [{ key: 'en', value: formDescription.value }],
      questions: allQuestionIds,
      status: statusToSave,
      schedule: buildSchedule(),
      settings: buildSettingsPayload()
    })
    
    // อัพเดท currentFormStatus หลังจาก save สำเร็จ
    if (result) {
      currentFormStatus.value = result.status
    }
    console.log('บันทึกสำเร็จ')
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึก:', error)
  }
}

const { saving, debounceSave, executeSave, hasPendingSave, initAutoSave } = useAutoSave(saveForm)

// Watch for changes - trigger auto-save
watch(formTitle, () => debounceSave())
watch(formDescription, () => debounceSave())
watch(questions, () => debounceSave(), { deep: true })
watch(settings, () => debounceSave(), { deep: true })

// Save before leaving the page - always save to be safe
onBeforeRouteLeave(async () => {
  await executeSave()
  return true
})


/* ===================================
   Lifecycle
   =================================== */

// แปลง backend question type เป็น frontend type
function mapQuestionTypeFromBackend(backendType) {
  const typeMap = {
    'short': 'short-answer',
    'paragraph': 'paragraph',
    'choices': 'multiple-choice',
    'checkbox': 'checkbox',
    'rating': 'rating',
    'file': 'file-upload',
    'title': 'title-description',
    'image': 'image',
    'divider': 'section-divider'
  }
  return typeMap[backendType] || backendType
}

// แปลง questions จาก API เป็น format ที่ frontend ใช้
function transformQuestionsFromAPI(apiQuestions) {
  return apiQuestions.map(q => ({
    _id: q._id,
    id: q._id,
    type: mapQuestionTypeFromBackend(q.type),
    title: q.title?.[0]?.value || 'Untitled Question',
    required: q.required || false,
    options: q.config?.options || [],
    maxRating: q.config?.maxRating || 5,
    allowSpecificTypes: q.config?.allowSpecificTypes || false,
    allowedFileTypes: q.config?.allowedFileTypes || [],
    maxFiles: q.config?.maxFiles || 1,
    maxSize: q.config?.maxSize || 10,
    // Image & Video fields
    imageUrl: q.config?.imageUrl || '',
    videoUrl: q.config?.videoUrl || '',
    caption: q.config?.caption || ''
  }))
}

onMounted(async () => {
  initAutoSave()
  
  if (formId.value) {
    const form = await formStore.fetchFormById(formId.value)
    if (form) {
      formTitle.value = form.title?.[0]?.value || 'Untitled Form'
      formDescription.value = form.description?.[0]?.value || ''
      currentFormStatus.value = form.status || 'draft' // เก็บ status ปัจจุบัน
      
      if (form.questions?.length > 0) {
        // แปลง questions จาก API format เป็น frontend format
        const transformedQuestions = transformQuestionsFromAPI(form.questions)
        setQuestions(transformedQuestions)
      }
      
      loadSettings(form)
    }
  }
})


/* ===================================
   Tab Configuration
   =================================== */
const responsesData = ref({ totalResponses: 0 })
const responseViewMode = ref('summary')
const responseCount = computed(() => responsesData.value.totalResponses || 0)

const tabs = computed(() => [
  { id: 'questions', label: 'Questions', icon: 'questions' },
  { id: 'responses', label: `Responses (${responseCount.value})`, icon: 'responses' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
])


/* ===================================
   Actions
   =================================== */
function copyFormUrl() {
  navigator.clipboard.writeText(formUrl.value)
  showModal('success', 'Copied!', 'URL copied to clipboard!')
}

function testForm() {
  window.open(formUrl.value, '_self')
}

function handleExport(format) {
  showModal('success', 'Export Started', `Exporting responses as ${format.toUpperCase()}`)
}

function handleUpdateSettings(newSettings) {
  Object.assign(settings.value, newSettings)
}
</script>

<template>
  <div class="form-builder">
    <!-- Top Actions -->
    <div class="top-actions">
      <router-link to="/editor" class="action-link">
        <ArrowLeftIcon />
        Back to Forms
      </router-link>
    </div>

    <!-- Main Content -->
    <div class="form-content">
      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <QuestionsIcon v-if="tab.icon === 'questions'" />
          <ResponsesIcon v-else-if="tab.icon === 'responses'" />
          <SettingsIcon v-else-if="tab.icon === 'settings'" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Questions Tab -->
      <QuestionsTab
        v-if="activeTab === 'questions'"
        :questions="questions"
        :formTitle="formTitle"
        :formDescription="formDescription"
        :formUrl="formUrl"
        :formStatus="settings.formStatus"
        :expandedQuestionId="expandedQuestionId"
        @update:questions="questions = $event"
        @update:formTitle="formTitle = $event"
        @update:formDescription="formDescription = $event"
        @copy-url="copyFormUrl"
        @test-form="testForm"
        @add-question="addQuestion"
        @update-question="updateQuestion"
        @delete-question="deleteQuestion"
        @add-option="addOption"
        @remove-option="removeOption"
        @toggle-question="toggleQuestion"
        @reorder-questions="onQuestionReorder"
      />

      
      <!-- Responses Tab -->
      <ResponsesTab
        v-else-if="activeTab === 'responses'"
        :questions="questions"
        :totalResponses="responsesData.totalResponses"
        :viewMode="responseViewMode"
        @update:viewMode="responseViewMode = $event"
        @export="handleExport"
      />

      <!-- Settings Tab -->
      <SettingsTab
        v-else-if="activeTab === 'settings'"
        :settings="settings"
        :formUrl="formUrl"
        @update:settings="handleUpdateSettings"
        @add-collaborator="addCollaborator"
        @remove-collaborator="removeCollaborator"
      />
    </div>

    <!-- Modal -->
    <Modal
      :show="modalVisible"
      :type="modalType"
      :title="modalTitle"
      :message="modalMessage"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.form-builder {
  padding: 24px 288px;
  min-height: 100vh;
  background: #fafafa;
}

.top-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #333;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s;
}

.action-link:hover {
  background-color: #f0f0f0;
}

.action-link svg {
  width: 16px;
  height: 16px;
}

.form-content {
  max-width: 960px;
  margin: 0 auto;
}

/* Tabs */
.tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 3.5px;
  margin-bottom: 32px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  background: #fff;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-btn svg {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 1400px) {
  .form-builder {
    padding: 24px 40px;
  }
}

@media (max-width: 768px) {
  .form-builder {
    padding: 16px;
  }
}
</style>
