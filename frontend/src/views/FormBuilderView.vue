<script setup>
/**
 * FormBuilderView - หน้าสร้างและแก้ไขฟอร์ม
 * แบ่งเป็น 3 tabs: Questions, Responses, Settings
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useFormStore } from '@/stores/form'
import draggable from 'vuedraggable'

// Icon Components
import {
  ArrowLeftIcon,
  SaveIcon,
  QuestionsIcon,
  ResponsesIcon,
  SettingsIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  EditIcon,
  ClockIcon,
  CopyIcon,
  PlayIcon,
  EmptyFormIcon,
  EmptyResponseIcon
} from '@/components/icons'

// Question Components
import QuestionTypeSelector from '@/components/questions/QuestionTypeSelector.vue'
import QuestionCard from '@/components/questions/QuestionCard.vue'

// Settings Components
import FormStatus from '@/components/settings/FormStatus.vue'
import AccessControl from '@/components/settings/AccessControl.vue'
import ResponseSettings from '@/components/settings/ResponseSettings.vue'
import ConfirmationMessage from '@/components/settings/ConfirmationMessage.vue'
import SendForm from '@/components/settings/SendForm.vue'

// Response Components
import ResponsesView from '@/components/responses/ResponsesView.vue'
import ResponseSummaryCard from '@/components/responses/ResponseSummaryCard.vue'
import TextResponseTable from '@/components/responses/TextResponseTable.vue'
import PieChartSummary from '@/components/responses/PieChartSummary.vue'
import BarChartSummary from '@/components/responses/BarChartSummary.vue'
import DateTimeResponseList from '@/components/responses/DateTimeResponseList.vue'
import FileUploadSummary from '@/components/responses/FileUploadSummary.vue'

// Modal Component
import Modal from '@/components/Modal.vue'


/* 
   Setup & State
   =================================== */
const route = useRoute()
const router = useRouter()
const formStore = useFormStore()

// ดึง form ID จาก URL
const formId = computed(() => route.params.id)
const loading = computed(() => formStore.loading)
const saving = ref(false)

// Tab navigation
const activeTab = ref('questions')

// ข้อมูลฟอร์ม
const formTitle = ref('Untitled Form')
const formDescription = ref('')

// สร้าง URL สำหรับแชร์ฟอร์ม
const formUrl = computed(() => {
  const baseUrl = window.location.origin
  return formId.value ? `${baseUrl}/form/${formId.value}` : ''
})

// เก็บ ID คำถามที่กำลังเปิดดู
const expandedQuestionId = ref(null)

// Modal state
const modalVisible = ref(false)
const modalType = ref('info')
const modalTitle = ref('')
const modalMessage = ref('')

function showModal(type, title, message) {
  modalType.value = type
  modalTitle.value = title
  modalMessage.value = message
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
}


/* ===================================
   Lifecycle - โหลดข้อมูลเมื่อเปิดหน้า
   =================================== */
onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  if (formId.value) {
    const form = await formStore.fetchFormById(formId.value)
    if (form) {
      // โหลด title
      formTitle.value = form.title?.[0]?.value || 'Untitled Form'
      formDescription.value = form.description || ''
      
      // โหลด questions
      if (form.questions && form.questions.length > 0) {
        questions.value = form.questions
      }
      
      // โหลด status
      if (form.status) {
        settings.value.formStatus = form.status
      }
      
      // โหลด schedule
      if (form.schedule) {
        if (form.schedule.startAt) {
          const startDate = new Date(form.schedule.startAt)
          settings.value.startDate = startDate.toISOString().split('T')[0]
          settings.value.startTime = startDate.toTimeString().slice(0, 5)
        }
        if (form.schedule.endAt) {
          const endDate = new Date(form.schedule.endAt)
          settings.value.endDate = endDate.toISOString().split('T')[0]
          settings.value.endTime = endDate.toTimeString().slice(0, 5)
        }
      }
      
      // โหลด settings อื่นๆ
      if (form.settings) {
        if (form.settings.whoCanRespond !== undefined) {
          settings.value.whoCanRespond = form.settings.whoCanRespond
        }
        if (form.settings.collectEmails !== undefined) {
          settings.value.collectEmails = form.settings.collectEmails
        }
        if (form.settings.limitResponses !== undefined) {
          settings.value.limitResponses = form.settings.limitResponses
        }
        if (form.settings.maxResponses !== undefined) {
          settings.value.maxResponses = form.settings.maxResponses
        }
        if (form.settings.showProgressBar !== undefined) {
          settings.value.showProgressBar = form.settings.showProgressBar
        }
        if (form.settings.confirmationMessage !== undefined) {
          settings.value.confirmationMessage = form.settings.confirmationMessage
        }
        if (form.settings.showAnotherResponseLink !== undefined) {
          settings.value.showAnotherResponseLink = form.settings.showAnotherResponseLink
        }
      }
    }
  }
})


/* ===================================
   Auto-save - บันทึกอัตโนมัติ
   =================================== */
let saveTimeout = null

// เมื่อเปลี่ยนชื่อฟอร์ม รอ 1 วินาทีแล้วบันทึก
watch(formTitle, (newTitle) => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveForm()
  }, 1000)
})

async function saveForm() {
  if (!formId.value) return
  
  saving.value = true
  try {
    // สร้าง schedule object
    let schedule = { startAt: null, endAt: null }
    if (settings.value.formStatus === 'scheduled') {
      if (settings.value.startDate && settings.value.startTime) {
        schedule.startAt = new Date(`${settings.value.startDate}T${settings.value.startTime}`).toISOString()
      }
      if (settings.value.endDate && settings.value.endTime) {
        schedule.endAt = new Date(`${settings.value.endDate}T${settings.value.endTime}`).toISOString()
      }
    }
    
    // บันทึกทั้ง title, questions, status, schedule และ settings ทั้งหมด
    await formStore.updateForm({
      _id: formId.value,
      title: [{ key: 'en', value: formTitle.value }],
      description: formDescription.value,
      questions: questions.value,
      status: settings.value.formStatus,
      schedule: schedule,
      // Settings เพิ่มเติม
      settings: {
        whoCanRespond: settings.value.whoCanRespond,
        collectEmails: settings.value.collectEmails,
        limitResponses: settings.value.limitResponses,
        maxResponses: settings.value.maxResponses,
        showProgressBar: settings.value.showProgressBar,
        confirmationMessage: settings.value.confirmationMessage,
        showAnotherResponseLink: settings.value.showAnotherResponseLink
      }
    })
    
    console.log('บันทึกสำเร็จ:', questions.value.length, 'คำถาม')
  } catch (err) {
    console.error('บันทึกฟอร์มไม่สำเร็จ:', err)
  } finally {
    saving.value = false
  }
}


/* ===================================
   Tab Configuration
   =================================== */
const responseCount = computed(() => responsesData.value.totalResponses || 0)

const tabs = computed(() => [
  { id: 'questions', label: 'Questions', icon: 'questions' },
  { id: 'responses', label: `Responses (${responseCount.value})`, icon: 'responses' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
])


/* ===================================
   Settings State - ค่าตั้งค่าทั้งหมด
   =================================== */
const settings = ref({
  // สถานะฟอร์ม
  formStatus: 'draft',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  
  // การเข้าถึง
  whoCanRespond: 'anyone',
  collaborators: [
    { id: 1, email: 'tanakrit.a@mfu.ac.th', role: 'Editor' },
    { id: 2, email: 'somchai.w@mfu.ac.th', role: 'Viewer' }
  ],
  
  // ตั้งค่าการตอบกลับ
  collectEmails: false,
  limitResponses: false,
  maxResponses: 100,
  showProgressBar: true,
  
  // ข้อความยืนยัน
  confirmationMessage: 'Thank you for completing this survey. Your response has been recorded.',
  showAnotherResponseLink: true
})


/* ===================================
   Response Data - ข้อมูลคำตอบ
   =================================== */
const responseViewMode = ref('summary')
const responsesData = ref({
  totalResponses: 0
})


/* ===================================
   Question Management - จัดการคำถาม
   =================================== */
const questions = ref([])

/**
 * สลับการแสดง/ซ่อนรายละเอียดคำถาม
 */
function toggleQuestion(questionId) {
  if (expandedQuestionId.value === questionId) {
    expandedQuestionId.value = null
  } else {
    expandedQuestionId.value = questionId
  }
}

/**
 * เพิ่มคำถามใหม่
 */
function addQuestion(type) {
  const newQuestion = {
    id: questions.value.length + 1,
    type: type.id,
    title: '',
    required: false
  }
  
  // เพิ่ม options สำหรับคำถามแบบเลือก
  if (['multiple-choice', 'checkbox', 'dropdown'].includes(type.id)) {
    newQuestion.options = [{ id: 1, text: 'Option 1' }]
  }
  
  // เพิ่ม maxRating สำหรับ rating
  if (type.id === 'rating') {
    newQuestion.maxRating = 5
  }
  
  // เพิ่ม file upload settings
  if (type.id === 'file-upload') {
    newQuestion.allowSpecificTypes = false
    newQuestion.allowedFileTypes = []
    newQuestion.maxFiles = 1
    newQuestion.maxSize = 10
  }
  
  questions.value.push(newQuestion)
}

/**
 * ลบคำถาม
 */
function deleteQuestion(questionId) {
  questions.value = questions.value.filter(q => q.id !== questionId)
}

/**
 * อัพเดทคำถาม
 */
function updateQuestion(updatedQuestion) {
  const index = questions.value.findIndex(q => q.id === updatedQuestion.id)
  if (index !== -1) {
    questions.value[index] = updatedQuestion
  }
}

/**
 * เพิ่มตัวเลือกในคำถาม
 */
function addOption(question) {
  const newOptionId = question.options.length + 1
  question.options.push({ id: newOptionId, text: `Option ${newOptionId}` })
}

/**
 * ลบตัวเลือกในคำถาม
 */
function removeOption(question, optionId) {
  question.options = question.options.filter(o => o.id !== optionId)
}

/**
 * เมื่อ drag & drop คำถามเสร็จ - บันทึกลำดับใหม่
 */
function onQuestionReorder() {
  console.log('คำถามถูกจัดลำดับใหม่:', questions.value.map(q => q.id))
  // TODO: save to backend if needed
}

/**
 * แปลง type เป็นชื่อที่อ่านง่าย
 */
function getQuestionTypeLabel(type) {
  const labels = {
    'short-answer': 'Short Answer',
    'paragraph': 'Paragraph',
    'multiple-choice': 'Multiple Choice',
    'checkbox': 'Checkbox',
    'dropdown': 'Dropdown',
    'rating': 'Rating',
    'file-upload': 'File Upload',
    'date': 'Date',
    'time': 'Time',
    'image': 'Image',
    'video': 'Video'
  }
  return labels[type] || type
}


/* ===================================
   Actions - ฟังก์ชันอื่นๆ
   =================================== */

/**
 * Copy URL ไปที่ clipboard
 */
function copyFormUrl() {
  navigator.clipboard.writeText(formUrl.value)
  showModal('success', 'Copied!', 'URL copied to clipboard!')
}

/**
 * เปิดฟอร์มในหน้าใหม่เพื่อทดสอบ
 */
function testForm() {
  window.open(formUrl.value, '_blank')
}

/**
 * Export คำตอบ
 */
function handleExport(format) {
  console.log('Exporting as:', format)
  showModal('success', 'Export Started', `Exporting responses as ${format.toUpperCase()}`)
}

/**
 * เพิ่ม collaborator
 */
function addCollaborator() {
  const newId = settings.value.collaborators.length + 1
  settings.value.collaborators.push({ id: newId, email: '', role: 'Viewer' })
}

/**
 * ลบ collaborator
 */
function removeCollaborator(id) {
  settings.value.collaborators = settings.value.collaborators.filter(c => c.id !== id)
}

// Auto-save settings - บันทึกอัตโนมัติเมื่อ settings เปลี่ยน
watch(settings, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveForm()
  }, 1000)
}, { deep: true })

// บันทึกก่อนออกหน้า (route change)
onBeforeRouteLeave(async () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    await saveFormImmediately()
  }
  return true
})

// ลบ event listener เมื่อ unmount
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})

function handleBeforeUnload(e) {
  if (saveTimeout) {
    // บันทึกทันที (sync)
    saveFormImmediately()
    e.preventDefault()
    e.returnValue = ''
  }
}

// บันทึกทันทีไม่ต้องรอ
async function saveFormImmediately() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = null
  await saveForm()
}
</script>

<template>
  <div class="form-builder">
    <!-- Top Actions -->
    <div class="top-actions">
      <router-link to="/" class="action-link">
        <ArrowLeftIcon />
        Back to Forms
      </router-link>
      <!-- Auto-save enabled - no manual save button needed -->
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

      <!-- Tab Panel -->
      <div class="tab-panel" v-if="activeTab === 'questions'">
        <!-- Status Banner - แสดงเฉพาะเมื่อ form เปิดรับ responses -->
        <div v-if="settings.formStatus === 'open'" class="status-banner success">
          <div class="status-icon">
            <CheckCircleIcon />
          </div>
          <div class="status-content">
            <h3>Form is Live & Public</h3>
            <p>Your form is published and accepting responses. Anyone with the link can submit.</p>
            <div class="status-actions">
              <input type="text" :value="formUrl" readonly class="url-input" />
              <button class="btn btn-secondary" @click="copyFormUrl">
                <CopyIcon />
                Copy
              </button>
              <button class="btn btn-secondary" @click="testForm">
                <PlayIcon />
                Preview
              </button>
            </div>
          </div>
        </div>

        <!-- Status Banner - แสดงเมื่อ form ปิดรับ responses -->
        <div v-else-if="settings.formStatus === 'closed'" class="status-banner warning">
          <div class="status-icon">
            <CloseCircleIcon />
          </div>
          <div class="status-content">
            <h3>Form is Closed</h3>
            <p>This form is no longer accepting responses.</p>
          </div>
        </div>

        <!-- Status Banner - แสดงเมื่อ form เป็น draft -->
        <div v-else-if="settings.formStatus === 'draft'" class="status-banner draft">
          <div class="status-icon">
            <EditIcon />
          </div>
          <div class="status-content">
            <h3>Draft Mode</h3>
            <p>This form is not published yet. Change status to "Open" to start collecting responses.</p>
            <div class="status-actions">
              <button class="btn btn-secondary" @click="testForm">
                <PlayIcon />
                Preview
              </button>
            </div>
          </div>
        </div>

        <!-- Status Banner - แสดงเมื่อ form เป็น scheduled -->
        <div v-else-if="settings.formStatus === 'scheduled'" class="status-banner scheduled">
          <div class="status-icon">
            <ClockIcon />
          </div>
          <div class="status-content">
            <h3>Scheduled</h3>
            <p>This form will automatically open and close based on the schedule in settings.</p>
            <div class="status-actions">
              <input type="text" :value="formUrl" readonly class="url-input" />
              <button class="btn btn-secondary" @click="copyFormUrl">
                <CopyIcon />
                Copy
              </button>
              <button class="btn btn-secondary" @click="testForm">
                <PlayIcon />
                Preview
              </button>
            </div>
          </div>
        </div>

        <!-- Form Title & Description -->
        <div class="form-header-section">
          <div class="title-input-wrapper">
            <input
              v-model="formTitle"
              type="text"
              class="form-title-input"
              placeholder="Form title"
            />
            <EditIcon class="edit-hint-icon" />
          </div>
          <div class="description-input-wrapper">
            <textarea
              v-model="formDescription"
              class="form-description-input"
              placeholder="Form description"
              rows="2"
            ></textarea>
            <EditIcon class="edit-hint-icon description-edit" />
          </div>
        </div>

        <!-- Questions Section -->
        <div class="questions-section">
          <div class="questions-list">
            <!-- Empty State when no questions -->
            <div v-if="questions.length === 0" class="empty-questions">
              <div class="empty-icon">
                <EmptyFormIcon />
              </div>
              <h3>No questions yet</h3>
              <p>Add your first question from the sidebar</p>
            </div>

            <!-- Question Cards with Drag & Drop -->
            <draggable
              v-model="questions"
              item-key="id"
              handle=".drag-handle"
              ghost-class="ghost-card"
              animation="200"
              class="draggable-list"
              @end="onQuestionReorder"
            >
              <template #item="{ element: question }">
                <QuestionCard
                  :question="question"
                  :isExpanded="expandedQuestionId === question.id"
                  @update:question="updateQuestion"
                  @delete="deleteQuestion"
                  @add-option="addOption"
                  @remove-option="removeOption"
                  @toggle="toggleQuestion(question.id)"
                />
              </template>
            </draggable>
          </div>

          <!-- Question Type Selector (Sidebar) -->
          <div class="sidebar">
            <QuestionTypeSelector @add-question="addQuestion" />
          </div>
        </div>
      </div>

      <!-- Responses Tab -->
      <div class="tab-panel responses-panel" v-else-if="activeTab === 'responses'">
        <!-- Empty State when no responses -->
        <div v-if="responsesData.totalResponses === 0" class="empty-responses">
          <div class="empty-icon">
            <EmptyResponseIcon />
          </div>
          <h3>No responses yet</h3>
          <p>Share your form to start collecting responses. Responses will appear here once people submit the form.</p>
        </div>

        <!-- Responses View when there are responses -->
        <ResponsesView 
          v-else
          :totalResponses="responsesData.totalResponses"
          :viewMode="responseViewMode"
          @update:viewMode="responseViewMode = $event"
          @export="handleExport"
        >
          <!-- Dynamic response cards will be rendered based on questions -->
          <div v-for="(question, index) in questions" :key="question.id">
            <ResponseSummaryCard
              :questionNumber="index + 1"
              :title="question.title"
              :responseCount="responsesData.totalResponses"
            >
              <!-- Content varies by question type -->
              <template v-if="question.type === 'short-answer' || question.type === 'paragraph'">
                <TextResponseTable :responses="[]" />
              </template>
              <template v-else-if="question.type === 'multiple-choice' || question.type === 'dropdown'">
                <PieChartSummary :chartData="[]" />
              </template>
              <template v-else-if="question.type === 'rating'">
                <BarChartSummary :chartData="[]" :maxValue="5" />
              </template>
              <template v-else-if="question.type === 'date' || question.type === 'time'">
                <DateTimeResponseList :responses="[]" />
              </template>
              <template v-else-if="question.type === 'file-upload'">
                <FileUploadSummary :count="0" fileType="file" />
              </template>
            </ResponseSummaryCard>
          </div>
        </ResponsesView>
      </div>

      <!-- Settings Tab -->
      <div class="tab-panel settings-panel" v-else-if="activeTab === 'settings'">
        <div class="settings-container">
          <FormStatus
            :status="settings.formStatus"
            :startDate="settings.startDate"
            :startTime="settings.startTime"
            :endDate="settings.endDate"
            :endTime="settings.endTime"
            @update:status="settings.formStatus = $event"
            @update:startDate="settings.startDate = $event"
            @update:startTime="settings.startTime = $event"
            @update:endDate="settings.endDate = $event"
            @update:endTime="settings.endTime = $event"
          />

          <AccessControl
            :whoCanRespond="settings.whoCanRespond"
            :collaborators="settings.collaborators"
            @update:whoCanRespond="settings.whoCanRespond = $event"
            @update:collaborators="settings.collaborators = $event"
            @add-collaborator="addCollaborator"
            @remove-collaborator="removeCollaborator"
          />

          <ResponseSettings
            :collectEmails="settings.collectEmails"
            :limitResponses="settings.limitResponses"
            :showProgressBar="settings.showProgressBar"
            @update:collectEmails="settings.collectEmails = $event"
            @update:limitResponses="settings.limitResponses = $event"
            @update:showProgressBar="settings.showProgressBar = $event"
          />

          <ConfirmationMessage
            :confirmationMessage="settings.confirmationMessage"
            :showAnotherResponseLink="settings.showAnotherResponseLink"
            @update:confirmationMessage="settings.confirmationMessage = $event"
            @update:showAnotherResponseLink="settings.showAnotherResponseLink = $event"
          />

          <SendForm
            :formUrl="formUrl"
          />
        </div>
      </div>
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

.action-link .icon {
  width: 16px;
  height: 16px;
}

.top-actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Save Button */
.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background: #4f46e5;
}

.save-btn:disabled {
  background: #a5a6f6;
  cursor: not-allowed;
}

.save-btn .icon {
  width: 16px;
  height: 16px;
}

.saving-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.tab-icon {
  width: 16px;
  height: 16px;
}

/* Status Banner */
.status-banner {
  display: flex;
  gap: 12px;
  padding: 25px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  margin-bottom: 24px;
}

.status-banner.success {
  border-left: 4px solid #22c55e;
}

.status-banner.success .status-icon {
  background: #dcfce7;
  color: #22c55e;
}

/* Status: Warning (Closed) */
.status-banner.warning {
  border-left: 4px solid #f59e0b;
}

.status-banner.warning .status-icon {
  background: #fef3c7;
  color: #f59e0b;
}

/* Status: Draft */
.status-banner.draft {
  border-left: 4px solid #6b7280;
}

.status-banner.draft .status-icon {
  background: #f3f4f6;
  color: #6b7280;
}

/* Status: Scheduled */
.status-banner.scheduled {
  border-left: 4px solid #6366f1;
}

.status-banner.scheduled .status-icon {
  background: #e0e7ff;
  color: #6366f1;
}

.status-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dcfce7;
  border-radius: 10px;
  color: #22c55e;
}

.status-icon svg {
  width: 20px;
  height: 20px;
}

.status-content {
  flex: 1;
}

.status-content h3 {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.status-content p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 12px;
}

.status-actions {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  background: #f9f9f9;
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e5e5e5;
}

.btn-secondary:hover {
  background: #eee;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Form Header */
.form-header-section {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 33px;
  margin-bottom: 24px;
}

.title-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.description-input-wrapper {
  position: relative;
}

.form-title-input {
  width: 100%;
  padding: 8px 32px 8px 0;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  background: transparent;
}

.form-title-input:focus {
  outline: none;
  border-bottom-color: #6366f1;
}

.form-title-input:focus + .edit-hint-icon {
  opacity: 0;
}

.form-description-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  resize: vertical;
}

.form-description-input:focus {
  outline: none;
  border-color: #6366f1;
}

.form-description-input:focus + .edit-hint-icon {
  opacity: 0;
}

.edit-hint-icon {
  position: absolute;
  right: 8px;
  width: 18px;
  height: 18px;
  color: #ccc;
  pointer-events: none;
  transition: opacity 0.2s;
}

.edit-hint-icon.description-edit {
  top: 10px;
}

.title-input-wrapper:hover .edit-hint-icon,
.description-input-wrapper:hover .edit-hint-icon {
  color: #999;
}

/* Questions Section */
.questions-section {
  display: flex;
  gap: 24px;
}

.questions-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Draggable list - ให้มีระยะห่างระหว่าง Question Cards */
.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar {
  width: 256px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
  height: fit-content;
}

/* Question Card */
.question-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  overflow: hidden;
}

.question-content {
  display: flex;
  padding: 25px;
  gap: 16px;
}

.drag-handle {
  width: 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: grab;
  color: #ccc;
  padding: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle:hover {
  color: #999;
}

.drag-handle svg {
  width: 20px;
  height: 20px;
}

/* Ghost card style - เมื่อกำลังลากคำถาม */
.ghost-card {
  opacity: 0.5;
  background: #f0f4ff;
  border: 2px dashed #4285f4;
}

.question-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-title-input {
  width: 100%;
  padding: 8px 0;
  border: none;
  border-bottom: 1px solid transparent;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background: transparent;
}

.question-title-input:focus {
  outline: none;
  border-bottom-color: #6366f1;
}

.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-preview {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #999;
  background: #fafafa;
}

.answer-preview.textarea {
  min-height: 64px;
  resize: none;
}

/* Options */
.options-field {
  gap: 8px;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  flex-shrink: 0;
}

.checkbox-square {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 4px;
  flex-shrink: 0;
}

.dropdown-number {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.option-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.option-input:focus {
  outline: none;
  border-color: #6366f1;
}

.badge {
  padding: 3px 9px;
  background: #f0f9ff;
  color: #0369a1;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
}

.option-delete-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}

.option-delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.option-delete-btn svg {
  width: 16px;
  height: 16px;
}

.add-followup-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  margin-left: 28px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6366f1;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-followup-btn:hover {
  background: #f0f0ff;
}

.add-followup-btn svg {
  width: 16px;
  height: 16px;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-option-btn:hover {
  background: #f5f5f5;
}

.add-option-btn svg {
  width: 16px;
  height: 16px;
}

/* Rating */
.rating-field {
  flex-direction: row;
  align-items: center;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
}

.rating-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

/* File Upload */
.file-upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border: 2px dashed #e5e5e5;
  border-radius: 8px;
  color: #999;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

/* Media Fields */
.media-field {
  gap: 16px;
}

.media-url-row {
  display: flex;
  gap: 8px;
}

.media-url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.caption-input {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

/* Delete Question Button */
.delete-question-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
  flex-shrink: 0;
}

.delete-question-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.delete-question-btn svg {
  width: 16px;
  height: 16px;
}

/* Question Footer */
.question-footer {
  display: flex;
  justify-content: space-between;
  padding: 17px 25px;
  border-top: 1px solid #e5e5e5;
  background: #fafafa;
}

.footer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-select {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
}

/* Toggle */
.toggle {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 18px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 1px;
  bottom: 1px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: #6366f1;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(14px);
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  color: #999;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 1400px) {
  .form-builder {
    padding: 24px 40px;
  }
}

@media (max-width: 1024px) {
  .questions-section {
    flex-direction: column-reverse;
  }

  .sidebar {
    width: 100%;
    position: static;
  }
}

@media (max-width: 768px) {
  .form-builder {
    padding: 16px;
  }

  .status-actions {
    flex-direction: column;
  }

  .url-input {
    width: 100%;
  }
}

/* Settings Panel Styles */
.settings-panel {
  background: transparent;
}

.settings-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Responses Panel Styles */
.responses-panel {
  background: transparent;
  max-width: 960px;
  margin: 0 auto;
}

/* Empty Responses State */
.empty-responses {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e5e5;
}

.empty-responses .empty-icon {
  width: 80px;
  height: 80px;
  color: #ccc;
  margin-bottom: 24px;
}

.empty-responses .empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-responses h3 {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.empty-responses p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
  max-width: 400px;
}

.btn-share {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-share:hover {
  background: #5558e3;
}

.btn-share svg {
  width: 16px;
  height: 16px;
}

/* Empty Questions State */
.empty-questions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  background: #fff;
  border: 2px dashed #e5e5e5;
  border-radius: 16px;
}

.empty-questions .empty-icon {
  width: 64px;
  height: 64px;
  color: #ccc;
  margin-bottom: 16px;
}

.empty-questions .empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-questions h3 {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  margin: 0 0 4px;
}

.empty-questions p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #999;
  margin: 0;
}
</style>
