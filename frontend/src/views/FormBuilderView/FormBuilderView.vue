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
        <button v-for="tab in store.tabs" :key="tab.id" :class="['tab-btn', { active: store.activeTab === tab.id }]"
          @click="store.setActiveTab(tab.id)">
          <QuestionsIcon v-if="tab.icon === 'questions'" />
          <ResponsesIcon v-else-if="tab.icon === 'responses'" />
          <SettingsIcon v-else-if="tab.icon === 'settings'" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Questions Tab -->
      <QuestionsTab v-if="store.activeTab === 'questions'" :questions="store.questions" :formTitle="store.formTitle"
        :formDescription="store.formDescription" :formUrl="store.formUrl" :formStatus="settingStore.settings.formStatus"
        :expandedQuestionId="store.expandedQuestionId" @update:questions="handleQuestionsUpdate"
        @update:formTitle="store.setFormTitle" @update:formDescription="store.setFormDescription"
        @copy-url="store.copyFormUrl" @test-form="store.openPreview" @add-question="store.addQuestion"
        @update-question="store.updateQuestion" @delete-question="store.deleteQuestion" @add-option="store.addOption"
        @remove-option="handleRemoveOption" @toggle-question="store.toggleQuestion"
        @reorder-questions="handleReorder" />

      <!-- Responses Tab -->
      <DataResponses v-else-if="store.activeTab === 'responses'" />

      <!-- Settings Tab -->
      <Setting v-else-if="store.activeTab === 'settings'" />
    </div>

    <!-- Modal -->
    <Modal :show="store.modal.visible" :type="store.modal.type" :title="store.modal.title"
      :message="store.modal.message" @close="store.closeModal" />
  </div>
</template>

<script>

// Icons
import { ArrowLeftIcon, QuestionsIcon, ResponsesIcon, SettingsIcon } from '@/components/icons'

// Tab Components
import { QuestionsTab } from '@/components/tabs'

// Local Components
import DataResponses from './DataResponses.vue'
import Setting from './Setting.vue'

// Modal
import Modal from '@/components/Modal.vue'

export default {
  name: 'FormBuilderView',
  components: {
    ArrowLeftIcon,
    QuestionsIcon,
    ResponsesIcon,
    SettingsIcon,
    QuestionsTab,
    DataResponses,
    Setting,
    Modal
  },
  data() {
    return {
      saveTimeout: null
    }
  },
  computed: {
    store() {
      return useFormBuilderStore()
    },
    settingStore() {
      return useSettingStore()
    },
    isDirty() {
      return this.store.isDirty
    }
  },
  watch: {
    isDirty(newVal) {
      if (newVal) {
        this.triggerAutoSave()
      }
    }
  },
  created() {
    this.onInit()
  },
  mounted() {
    // Moved logic to onInit to follow template pattern, but route params access typically happens here or created.
    // However, onMounted is async in original code.
  },
  beforeDestroy() { // equivalent to onBeforeUnmount in Vue 2 or comp API, user requested beforeDestroy in template
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    if (this.saveTimeout) clearTimeout(this.saveTimeout)

    // Save before leaving
    if (this.store.hasPendingChanges) {
      this.store.saveForm()
    }
  },
  methods: {
    async onInit() {
      const formId = this.$route.params.id

      // Restore active tab from localStorage or query
      const savedTab = this.$route.query.tab || localStorage.getItem(`formBuilder_${formId}_activeTab`)
      if (savedTab) {
        this.store.setActiveTab(savedTab)
      }

      // Load form data
      if (formId) {
        await this.store.loadForm(formId)
      }

      // Add beforeunload listener
      window.addEventListener('beforeunload', this.handleBeforeUnload)
    },

    handleQuestionsUpdate(newQuestions) {
      this.store.reorderQuestions(newQuestions)
    },

    handleRemoveOption(question, optionId) {
      this.store.removeOption(question, optionId)
    },

    handleReorder() {
      this.store.markDirty()
    },

    handleBeforeUnload(e) {
      if (this.store.hasPendingChanges) {
        this.store.saveForm()
        e.preventDefault()
        e.returnValue = ''
      }
    },

    triggerAutoSave(delay = 500) {
      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      this.saveTimeout = setTimeout(async () => {
        await this.store.saveForm()
      }, delay)
    }
  }
}
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
