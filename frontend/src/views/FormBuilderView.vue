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
        :questions="questionsForResponses"
        :totalResponses="responsesData.totalResponses"
        :responses="responsesData.responses"
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

<script>
/**
 * FormBuilderView - หน้าสร้างและแก้ไขฟอร์ม
 * แบ่งเป็น 3 tabs: Questions, Responses, Settings
 */
import { useFormStore } from '@/stores/form'
import { questionsAPI, responseAPI } from '@/services/api'

// Icons
import { ArrowLeftIcon, QuestionsIcon, ResponsesIcon, SettingsIcon } from '@/components/icons'

// Tab Components
import { QuestionsTab, ResponsesTab, SettingsTab } from '@/components/tabs'

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
    ResponsesTab,
    SettingsTab,
    Modal
  },

  data() {
    return {
      // Form Data
      formTitle: 'Untitled Form',
      formDescription: '',
      currentFormStatus: 'draft',
      activeTab: 'questions',

      // Questions
      questions: [],
      expandedQuestionId: null,

      // Settings
      settings: {
        formStatus: 'draft',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        whoCanRespond: 'anyone',
        collaborators: [
          { id: 1, email: 'tanakrit.a@mfu.ac.th', role: 'Editor' },
          { id: 2, email: 'somchai.w@mfu.ac.th', role: 'Viewer' }
        ],
        collectEmails: false,
        limitResponses: false,
        maxResponses: 100,
        showProgressBar: true,
        confirmationMessage: 'Thank you for completing this survey. Your response has been recorded.'
      },

      // Modal
      modalVisible: false,
      modalType: 'info',
      modalTitle: '',
      modalMessage: '',

      // Responses
      responsesData: {
        totalResponses: 0,
        responses: []
      },
      responseViewMode: 'summary',

      // Auto-save
      saving: false,
      saveTimeout: null
    }
  },

  computed: {
    formId() {
      return this.$route.params.id
    },

    formUrl() {
      const baseUrl = window.location.origin
      return this.formId ? `${baseUrl}/form/${this.formId}/response` : ''
    },

    previewUrl() {
      const baseUrl = window.location.origin
      return this.formId ? `${baseUrl}/form/${this.formId}/preview` : ''
    },

    responseCount() {
      return this.responsesData.totalResponses || 0
    },

    questionsForResponses() {
      const excludedTypes = ['title-description', 'image', 'video', 'section-divider']
      return this.questions.filter(q => !excludedTypes.includes(q.type))
    },

    tabs() {
      return [
        { id: 'questions', label: 'Questions', icon: 'questions' },
        { id: 'responses', label: `Responses (${this.responseCount})`, icon: 'responses' },
        { id: 'settings', label: 'Settings', icon: 'settings' }
      ]
    }
  },

  watch: {
    formTitle() {
      this.debounceSave()
    },
    formDescription() {
      this.debounceSave()
    },
    questions: {
      handler() {
        this.debounceSave()
      },
      deep: true
    },
    settings: {
      handler() {
        this.debounceSave()
      },
      deep: true
    },
    activeTab(newTab) {
      if (this.formId) {
        localStorage.setItem(`formBuilder_${this.formId}_activeTab`, newTab)
      }
    }
  },

  async mounted() {
    // Init active tab from localStorage or query
    this.activeTab = this.$route.query.tab || localStorage.getItem(`formBuilder_${this.$route.params.id}_activeTab`) || 'questions'

    // Init auto-save listener
    window.addEventListener('beforeunload', this.handleBeforeUnload)

    if (this.formId) {
      const formStore = useFormStore()
      const form = await formStore.fetchFormById(this.formId)
      if (form) {
        this.formTitle = form.title?.[0]?.value || 'Untitled Form'
        this.formDescription = form.description?.[0]?.value || ''
        this.currentFormStatus = form.status || 'draft'

        if (form.questions?.length > 0) {
          this.questions = this.transformQuestionsFromAPI(form.questions)
        }

        this.loadSettings(form)
      }

      await this.fetchResponses()
    }
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
  },

  async beforeRouteLeave(to, from, next) {
    await this.executeSave()
    next()
  },

  methods: {
    /* ===================================
       Modal Methods
       =================================== */
    showModal(type, title, message) {
      this.modalType = type
      this.modalTitle = title
      this.modalMessage = message
      this.modalVisible = true
    },

    closeModal() {
      this.modalVisible = false
    },

    /* ===================================
       Question Manager Methods
       =================================== */
    toggleQuestion(questionId) {
      this.expandedQuestionId = this.expandedQuestionId === questionId ? null : questionId
    },

    addQuestion(type) {
      const newQuestion = {
        id: this.questions.length + 1,
        type: type.id,
        title: 'Untitled Question',
        required: false
      }

      if (['multiple-choice', 'checkbox', 'dropdown'].includes(type.id)) {
        newQuestion.options = [{ id: 1, text: 'Option 1' }]
      }

      if (type.id === 'rating') {
        newQuestion.maxRating = 5
      }

      if (type.id === 'file-upload') {
        newQuestion.allowSpecificTypes = false
        newQuestion.allowedFileTypes = []
        newQuestion.maxFiles = 1
        newQuestion.maxSize = 10
      }

      this.questions.push(newQuestion)
    },

    deleteQuestion(questionId) {
      this.questions = this.questions.filter(q => q.id !== questionId)
    },

    updateQuestion(updatedQuestion) {
      const index = this.questions.findIndex(q => q.id === updatedQuestion.id)
      if (index !== -1) {
        this.questions[index] = updatedQuestion
      }
    },

    addOption(question) {
      const newOptionId = question.options.length + 1
      question.options.push({ id: newOptionId, text: `Option ${newOptionId}` })
    },

    removeOption(question, optionId) {
      question.options = question.options.filter(o => o.id !== optionId)
    },

    onQuestionReorder() {
      // Questions reordered - order updated in array
    },

    setQuestions(loadedQuestions) {
      this.questions = loadedQuestions
    },

    /* ===================================
       Settings Methods
       =================================== */
    addCollaborator() {
      const newId = this.settings.collaborators.length + 1
      this.settings.collaborators.push({ id: newId, email: '', role: 'Viewer' })
    },

    removeCollaborator(id) {
      this.settings.collaborators = this.settings.collaborators.filter(c => c.id !== id)
    },

    loadSettings(form) {
      if (form.status) {
        this.settings.formStatus = form.status
      }

      if (form.schedule) {
        if (form.schedule.startAt) {
          const startDate = new Date(form.schedule.startAt)
          this.settings.startDate = startDate.toISOString().split('T')[0]
          this.settings.startTime = startDate.toTimeString().slice(0, 5)
        }
        if (form.schedule.endAt) {
          const endDate = new Date(form.schedule.endAt)
          this.settings.endDate = endDate.toISOString().split('T')[0]
          this.settings.endTime = endDate.toTimeString().slice(0, 5)
        }
      }

      if (form.settings) {
        const s = form.settings
        if (s.whoCanRespond !== undefined) this.settings.whoCanRespond = s.whoCanRespond
        if (s.collectEmails !== undefined) this.settings.collectEmails = s.collectEmails
        if (s.limitResponses !== undefined) this.settings.limitResponses = s.limitResponses
        if (s.maxResponses !== undefined) this.settings.maxResponses = s.maxResponses
        if (s.showProgressBar !== undefined) this.settings.showProgressBar = s.showProgressBar
        if (s.confirmationMessage !== undefined) this.settings.confirmationMessage = s.confirmationMessage
      }
    },

    buildSchedule() {
      const schedule = { startAt: null, endAt: null }
      if (this.settings.formStatus === 'auto') {
        if (this.settings.startDate && this.settings.startTime) {
          schedule.startAt = new Date(`${this.settings.startDate}T${this.settings.startTime}`).toISOString()
        }
        if (this.settings.endDate && this.settings.endTime) {
          schedule.endAt = new Date(`${this.settings.endDate}T${this.settings.endTime}`).toISOString()
        }
      }
      return schedule
    },

    buildSettingsPayload() {
      return {
        whoCanRespond: this.settings.whoCanRespond,
        collectEmails: this.settings.collectEmails,
        limitResponses: this.settings.limitResponses,
        maxResponses: this.settings.maxResponses,
        showProgressBar: this.settings.showProgressBar,
        confirmationMessage: this.settings.confirmationMessage
      }
    },

    handleUpdateSettings(newSettings) {
      Object.assign(this.settings, newSettings)
    },

    /* ===================================
       Auto-save Methods
       =================================== */
    debounceSave(delay = 1000) {
      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      this.saveTimeout = setTimeout(() => {
        this.executeSave()
      }, delay)
    },

    async executeSave() {
      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      this.saveTimeout = null

      this.saving = true
      try {
        await this.saveForm()
      } catch (err) {
        console.error('บันทึกไม่สำเร็จ:', err)
      } finally {
        this.saving = false
      }
    },

    hasPendingSave() {
      return this.saveTimeout !== null
    },

    handleBeforeUnload(e) {
      if (this.saveTimeout) {
        this.executeSave()
        e.preventDefault()
        e.returnValue = ''
      }
    },

    /* ===================================
       Type Mapping Methods
       =================================== */
    mapQuestionType(frontendType) {
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
    },

    mapQuestionTypeFromBackend(backendType) {
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
    },

    transformQuestionsFromAPI(apiQuestions) {
      return apiQuestions.map(q => ({
        _id: q._id,
        id: q._id,
        type: this.mapQuestionTypeFromBackend(q.type),
        title: q.title?.[0]?.value || 'Untitled Question',
        required: q.required || false,
        options: q.config?.options || [],
        maxRating: q.config?.maxRating || 5,
        allowSpecificTypes: q.config?.allowSpecificTypes || false,
        allowedFileTypes: q.config?.allowedFileTypes || [],
        maxFiles: q.config?.maxFiles || 1,
        maxSize: q.config?.maxSize || 10,
        imageUrl: q.config?.imageUrl || '',
        videoUrl: q.config?.videoUrl || '',
        caption: q.config?.caption || ''
      }))
    },

    /* ===================================
       Save Form Method
       =================================== */
    async saveForm() {
      if (!this.formId) return

      const formStore = useFormStore()

      try {
        const existingQuestions = this.questions.filter(q => q && q._id)
        const newQuestions = this.questions.filter(q => q && !q._id)

        for (const q of existingQuestions) {
          const updateData = {
            _id: q._id,
            title: [{ key: 'en', value: q.title || '' }],
            type: this.mapQuestionType(q.type),
            required: q.required || false,
            order: this.questions.indexOf(q) + 1,
            config: {
              options: q.options || [],
              maxRating: q.maxRating || 5,
              allowSpecificTypes: q.allowSpecificTypes || false,
              allowedFileTypes: q.allowedFileTypes || [],
              maxFiles: q.maxFiles || 1,
              maxSize: q.maxSize || 10,
              imageUrl: q.imageUrl || '',
              videoUrl: q.videoUrl || '',
              caption: q.caption || ''
            }
          }
          await questionsAPI.update(updateData)
        }

        const createdQuestionIds = []
        for (const q of newQuestions) {
          if (!q.title || q.title.trim() === '') {
            continue
          }

          const questionData = {
            form: this.formId,
            title: [{ key: 'en', value: q.title }],
            type: this.mapQuestionType(q.type),
            required: q.required || false,
            order: this.questions.indexOf(q) + 1,
            config: {
              options: q.options?.map(opt => ({
                id: opt.id,
                text: opt.text,
                hasFollowUp: opt.hasFollowUp || false,
                followUpQuestion: opt.followUpQuestion || null
              })) || [],
              maxRating: q.maxRating || 5,
              allowSpecificTypes: q.allowSpecificTypes || false,
              allowedFileTypes: q.allowedFileTypes || [],
              maxFiles: q.maxFiles || 1,
              maxSize: q.maxSize || 10,
              imageUrl: q.imageUrl || '',
              videoUrl: q.videoUrl || '',
              caption: q.caption || ''
            }
          }

          const result = await questionsAPI.create(questionData)
          if (result.data && result.data._id) {
            q._id = result.data._id
            createdQuestionIds.push(result.data._id)
          }
        }

        const allQuestionIds = [
          ...existingQuestions.map(q => q._id),
          ...createdQuestionIds
        ]

        const statusToSave = this.settings.formStatus || this.currentFormStatus || 'draft'

        const formData = {
          _id: this.formId,
          title: [{ key: 'en', value: this.formTitle }],
          description: [{ key: 'en', value: this.formDescription }],
          questions: allQuestionIds,
          status: statusToSave,
          schedule: this.buildSchedule(),
          settings: this.buildSettingsPayload()
        }

        const result = await formStore.updateForm(formData)

        if (result) {
          this.currentFormStatus = result.status
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึก:', error)
      }
    },

    /* ===================================
       Responses Methods
       =================================== */
    async fetchResponses() {
      if (!this.formId) return

      try {
        const result = await responseAPI.getByFormId(this.formId)
        if (result && result.data) {
          this.responsesData = {
            totalResponses: result.data.length || 0,
            responses: result.data
          }
        }
      } catch (error) {
        console.error('Error fetching responses:', error)
      }
    },

    /* ===================================
       Actions
       =================================== */
    copyFormUrl() {
      navigator.clipboard.writeText(this.formUrl)
      this.showModal('success', 'Copied!', 'URL copied to clipboard!')
    },

    testForm() {
      window.open(this.previewUrl, '_self')
    },

    handleExport(format) {
      this.showModal('success', 'Export Started', `Exporting responses as ${format.toUpperCase()}`)
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
