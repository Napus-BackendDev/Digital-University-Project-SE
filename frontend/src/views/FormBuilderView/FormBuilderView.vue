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
          v-for="tab in store.tabs"
          :key="tab.id"
          :class="['tab-btn', { active: store.activeTab === tab.id }]"
          @click="store.setActiveTab(tab.id)"
        >
          <QuestionsIcon v-if="tab.icon === 'questions'" />
          <ResponsesIcon v-else-if="tab.icon === 'responses'" />
          <SettingsIcon v-else-if="tab.icon === 'settings'" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Questions Tab -->
      <QuestionsTab
        v-if="store.activeTab === 'questions'"
        :questions="store.questions"
        :formTitle="store.formTitle"
        :formDescription="store.formDescription"
        :formUrl="store.formUrl"
        :formStatus="settingStore.settings.formStatus"
        :expandedQuestionId="store.expandedQuestionId"
        @update:questions="handleQuestionsUpdate"
        @update:formTitle="store.setFormTitle"
        @update:formDescription="store.setFormDescription"
        @copy-url="store.copyFormUrl"
        @test-form="store.openPreview"
        @add-question="store.addQuestion"
        @update-question="store.updateQuestion"
        @delete-question="store.deleteQuestion"
        @add-option="store.addOption"
        @remove-option="handleRemoveOption"
        @toggle-question="store.toggleQuestion"
        @reorder-questions="handleReorder"
      />

      <!-- Responses Tab -->
      <DataResponses v-else-if="store.activeTab === 'responses'" />

      <!-- Settings Tab -->
      <Setting v-else-if="store.activeTab === 'settings'" />
    </div>

    <!-- Modal -->
    <Modal
      :show="store.modal.visible"
      :type="store.modal.type"
      :title="store.modal.title"
      :message="store.modal.message"
      @close="store.closeModal"
    />
  </div>
</template>

<script setup>
/**
 * FormBuilderView - หน้าสร้างและแก้ไขฟอร์ม
 * ใช้ Pinia Store (formBuilder) จัดการ state ทั้งหมด
 * แบ่งเป็น 3 tabs: Questions, Responses, Settings
 */
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFormBuilderStore } from '@/stores/formBuilder'
import { useSettingStore } from '@/stores/setting'

// Icons
import { ArrowLeftIcon, QuestionsIcon, ResponsesIcon, SettingsIcon } from '@/components/icons'

// Tab Components
import { QuestionsTab } from '@/components/tabs'

// Local Components
import DataResponses from './DataResponses.vue'
import Setting from './Setting.vue'

// Modal
import Modal from '@/components/Modal.vue'

// Store & Route
const store = useFormBuilderStore()
const settingStore = useSettingStore()
const route = useRoute()

// Auto-save variables
let saveTimeout = null

/* ===================================
   Lifecycle Hooks
   =================================== */

onMounted(async () => {
  const formId = route.params.id
  
  // Restore active tab from localStorage or query
  const savedTab = route.query.tab || localStorage.getItem(`formBuilder_${formId}_activeTab`)
  if (savedTab) {
    store.setActiveTab(savedTab)
  }
  
  // Load form data
  if (formId) {
    await store.loadForm(formId)
  }
  
  // Add beforeunload listener
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (saveTimeout) clearTimeout(saveTimeout)
  
  // Save before leaving
  if (store.hasPendingChanges) {
    store.saveForm()
  }
})

/* ===================================
   Watchers
   =================================== */

// Watch for dirty state and trigger auto-save
watch(() => store.isDirty, (isDirty) => {
  if (isDirty) {
    triggerAutoSave()
  }
})

/* ===================================
   Event Handlers
   =================================== */

function handleQuestionsUpdate(newQuestions) {
  store.reorderQuestions(newQuestions)
}

function handleRemoveOption(question, optionId) {
  store.removeOption(question, optionId)
}

function handleReorder() {
  store.markDirty()
}

function handleBeforeUnload(e) {
  if (store.hasPendingChanges) {
    store.saveForm()
    e.preventDefault()
    e.returnValue = ''
  }
}

/* ===================================
   Auto-save Functions
   =================================== */

function triggerAutoSave(delay = 500) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    await store.saveForm()
  }, delay)
}

/* ===================================
   Navigation Guard (Composition API style)
   =================================== */
// Note: For beforeRouteLeave, use in-component guard or router.beforeEach
</script>

<style scoped>
.form-builder {
  padding: 24px 288px;
  min-height: 100vh;
  background: var(--bg-gray);
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
  color: var(--text-primary);
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
  background: var(--bg-gray-light);
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
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: #fff;
  color: var(--text-primary);
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
