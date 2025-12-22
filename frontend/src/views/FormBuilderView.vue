<script setup>
/**
 * FormBuilderView - หน้าสร้างและแก้ไขฟอร์ม
 * แบ่งเป็น 3 tabs: Questions, Responses, Settings
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { useFormStore } from '@/stores/form'

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
async function saveForm() {
  if (!formId.value) return
  
  await formStore.updateForm({
    _id: formId.value,
    title: [{ key: 'en', value: formTitle.value }],
    description: formDescription.value,
    questions: questions.value,
    status: settings.value.formStatus,
    schedule: buildSchedule(),
    settings: buildSettingsPayload()
  })
  console.log('บันทึกสำเร็จ')
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
onMounted(async () => {
  initAutoSave()
  
  if (formId.value) {
    const form = await formStore.fetchFormById(formId.value)
    if (form) {
      formTitle.value = form.title?.[0]?.value || 'Untitled Form'
      formDescription.value = form.description || ''
      
      if (form.questions?.length > 0) {
        setQuestions(form.questions)
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
  window.open(formUrl.value, '_blank')
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
      <router-link to="/" class="action-link">
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
