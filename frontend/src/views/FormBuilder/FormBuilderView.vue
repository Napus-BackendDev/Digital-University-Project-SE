<template>
  <div>
    <!-- Header Card with Back Button -->
    <CCard class="mb-4">
      <CCardHeader>
        <CRow class="align-items-center">
          <CCol sm="6">
            <router-link to="/editor" class="btn btn-ghost-primary btn-sm">
              <CIcon name="cil-arrow-left" class="mr-1" />
              Back to Forms
            </router-link>
          </CCol>
          <CCol sm="6" class="text-right">
            <strong>{{ formTitle }}</strong>
            <CBadge v-if="saving" color="warning" class="ml-2">Saving...</CBadge>
            <CBadge v-else color="success" class="ml-2">Saved</CBadge>
          </CCol>
        </CRow>
      </CCardHeader>
    </CCard>

    <!-- Main Form Builder Card with Tabs -->
    <CCard>
      <CCardBody>
        <CTabs :active-tab.sync="activeTabIndex" add-tab-classes="mt-1">
          <!-- Questions Tab -->
          <CTab>
            <template slot="title">
              <CIcon name="cil-list" class="mr-2" /> Questions
            </template>
            <div class="pt-3">
              <QuestionsTab
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
            </div>
          </CTab>

          <!-- Responses Tab -->
          <CTab>
            <template slot="title">
              <CIcon name="cil-chart-pie" class="mr-2" /> Responses ({{ responseCount }})
            </template>
            <div class="pt-3">
              <ResponsesTab
                :questions="questionsForResponses"
                :totalResponses="responsesData.totalResponses"
                :responses="responsesData.responses"
                :viewMode="responseViewMode"
                @update:viewMode="responseViewMode = $event"
                @export="handleExport"
              />
            </div>
          </CTab>

          <!-- Settings Tab -->
          <CTab>
            <template slot="title">
              <CIcon name="cil-settings" class="mr-2" /> Settings
            </template>
            <div class="pt-3">
              <SettingsTab
                :settings="settings"
                :formUrl="formUrl"
                @update:settings="handleUpdateSettings"
                @add-collaborator="addCollaborator"
                @remove-collaborator="removeCollaborator"
              />
            </div>
          </CTab>
        </CTabs>
      </CCardBody>
    </CCard>

    <!-- Modal -->
    <CModal
      :show.sync="modalVisible"
      :color="modalType === 'success' ? 'success' : modalType === 'error' ? 'danger' : 'info'"
      :title="modalTitle"
    >
      {{ modalMessage }}
      <template #footer>
        <CButton color="secondary" @click="closeModal">Close</CButton>
      </template>
    </CModal>
  </div>
</template>

<script>
// Tab Components
import QuestionsTab from '@/containers/tabs/QuestionsTab.vue'
import ResponsesTab from '@/containers/tabs/ResponsesTab.vue'
import SettingsTab from '@/containers/tabs/SettingsTab.vue'

export default {
  name: 'FormBuilderView',
  
  components: {
    QuestionsTab,
    ResponsesTab,
    SettingsTab
  },
  
  data() {
    return {
      // Tab state
      activeTabIndex: 0,
      tabIds: ['questions', 'responses', 'settings'],
      
      // Form state
      formTitle: 'Untitled Form',
      formDescription: '',
      currentFormStatus: 'draft',
      
      // Questions state
      questions: [],
      expandedQuestionId: null,
      
      // Settings state
      settings: {
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
        confirmationMessage: 'Thank you for completing this survey. Your response has been recorded.'
      },
      
      // Responses state
      responsesData: {
        totalResponses: 0,
        responses: []
      },
      responseViewMode: 'summary',
      
      // Auto-save state
      saving: false,
      saveTimeout: null,
      hasPendingSave: false,
      
      // Modal state
      modalVisible: false,
      modalType: 'info',
      modalTitle: '',
      modalMessage: ''
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
    
    activeTab() {
      return this.tabIds[this.activeTabIndex]
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
    activeTabIndex(newIndex) {
      if (this.formId) {
        localStorage.setItem(`formBuilder_${this.formId}_activeTab`, this.tabIds[newIndex])
      }
    }
  },
  
  async mounted() {
    // Initialize auto-save listeners
    this.initAutoSave()
    
    // Restore active tab from localStorage
    if (this.formId) {
      const savedTab = this.$route.query.tab || localStorage.getItem(`formBuilder_${this.formId}_activeTab`)
      if (savedTab) {
        const index = this.tabIds.indexOf(savedTab)
        if (index !== -1) {
          this.activeTabIndex = index
        }
      }
    }
    
    await this.loadFormData()
    await this.fetchResponses()
  },
  
  beforeDestroy() {
    // Cleanup auto-save listeners
    this.cleanupAutoSave()
  },
  
  beforeRouteLeave(to, from, next) {
    this.executeSave().then(() => {
      next()
    })
  },
  
  methods: {
    /* ===================================
       Type Mapping
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
       Data Loading
       =================================== */
    async loadFormData() {
      if (!this.formId) return
      
      try {
        const response = await this.$http.get(`/form/${this.formId}`)
        const form = response.data?.data
        
        if (form) {
          this.formTitle = form.title?.[0]?.value || 'Untitled Form'
          this.formDescription = form.description?.[0]?.value || ''
          this.currentFormStatus = form.status || 'draft'
          
          if (form.questions?.length > 0) {
            this.questions = this.transformQuestionsFromAPI(form.questions)
          }
          
          this.loadSettings(form)
        }
      } catch (error) {
        console.error('Error loading form:', error)
        this.showModal('error', 'Error', 'Failed to load form data')
      }
    },
    
    loadSettings(form) {
      if (form.status) {
        this.settings.formStatus = form.status
      }

      // โหลด schedule
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

      // โหลด settings อื่นๆ
      if (form.settings) {
        const s = form.settings
        if (s.whoCanRespond !== undefined) this.settings.whoCanRespond = s.whoCanRespond
        if (s.collectEmails !== undefined) this.settings.collectEmails = s.collectEmails
        if (s.limitResponses !== undefined) this.settings.limitResponses = s.limitResponses
        if (s.maxResponses !== undefined) this.settings.maxResponses = s.maxResponses
        if (s.showProgressBar !== undefined) this.settings.showProgressBar = s.showProgressBar
        if (s.confirmationMessage !== undefined) this.settings.confirmationMessage = s.confirmationMessage
      }

      // โหลด collaborators
      if (form.collaborators && form.collaborators.length > 0) {
        this.settings.collaborators = form.collaborators
      }
    },
    
    async fetchResponses() {
      if (!this.formId) return
      
      try {
        const response = await this.$http.get(`/response/form/${this.formId}`)
        if (response.data?.data) {
          this.responsesData = {
            totalResponses: response.data.data.length || 0,
            responses: response.data.data
          }
        }
      } catch (error) {
        console.error('Error fetching responses:', error)
      }
    },
    
    /* ===================================
       Auto-save
       =================================== */
    initAutoSave() {
      window.addEventListener('beforeunload', this.handleBeforeUnload)
    },
    
    cleanupAutoSave() {
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout)
      }
    },
    
    handleBeforeUnload(e) {
      if (this.saveTimeout) {
        this.executeSave()
        e.preventDefault()
        e.returnValue = ''
      }
    },
    
    debounceSave(delay = 1000) {
      this.hasPendingSave = true
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout)
      }
      this.saveTimeout = setTimeout(() => {
        this.executeSave()
      }, delay)
    },
    
    async executeSave() {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout)
        this.saveTimeout = null
      }
      
      if (!this.hasPendingSave || !this.formId) return
      
      this.saving = true
      this.hasPendingSave = false
      
      try {
        // Update existing questions
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
          await this.$http.put(`/question/${q._id}`, updateData)
        }
        
        // Create new questions
        const createdQuestionIds = []
        for (const q of newQuestions) {
          if (!q.title || q.title.trim() === '') continue
          
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
          
          const result = await this.$http.post('/question', questionData)
          if (result.data?.data?._id) {
            q._id = result.data.data._id
            createdQuestionIds.push(result.data.data._id)
          }
        }
        
        // Update form
        const allQuestionIds = [
          ...existingQuestions.map(q => q._id),
          ...createdQuestionIds
        ]
        
        const formData = {
          _id: this.formId,
          title: [{ key: 'en', value: this.formTitle }],
          description: [{ key: 'en', value: this.formDescription }],
          questions: allQuestionIds,
          status: this.settings.formStatus || this.currentFormStatus || 'draft',
          schedule: this.buildSchedule(),
          settings: this.buildSettingsPayload()
        }
        
        const result = await this.$http.put(`/form/${this.formId}`, formData)
        if (result.data) {
          this.currentFormStatus = result.data.status
        }
      } catch (error) {
        console.error('บันทึกไม่สำเร็จ:', error)
        this.showModal('error', 'Error', 'Failed to save form')
      } finally {
        this.saving = false
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
    
    /* ===================================
       Question Management
       =================================== */
    toggleQuestion(questionId) {
      this.expandedQuestionId = this.expandedQuestionId === questionId ? null : questionId
    },
    
    addQuestion(type = 'short-answer') {
      // รองรับทั้ง string และ object format
      const typeId = typeof type === 'object' ? type.id : type
      
      const newQuestion = {
        id: `temp_${Date.now()}`,
        type: typeId,
        title: 'Untitled Question',
        required: false
      }

      // เพิ่ม options สำหรับคำถามแบบเลือก
      if (['multiple-choice', 'checkbox', 'dropdown'].includes(typeId)) {
        newQuestion.options = [{ id: 1, text: 'Option 1' }]
      }

      // เพิ่ม maxRating สำหรับ rating
      if (typeId === 'rating') {
        newQuestion.maxRating = 5
      }

      // เพิ่ม file upload settings
      if (typeId === 'file-upload') {
        newQuestion.allowSpecificTypes = false
        newQuestion.allowedFileTypes = []
        newQuestion.maxFiles = 1
        newQuestion.maxSize = 10
      }

      // เพิ่ม image/video fields
      newQuestion.imageUrl = ''
      newQuestion.videoUrl = ''
      newQuestion.caption = ''

      this.questions.push(newQuestion)
      this.expandedQuestionId = newQuestion.id
    },
    
    updateQuestion({ questionId, field, value }) {
      const question = this.questions.find(q => q.id === questionId || q._id === questionId)
      if (question) {
        question[field] = value
      }
    },
    
    deleteQuestion(questionId) {
      const index = this.questions.findIndex(q => q.id === questionId || q._id === questionId)
      if (index !== -1) {
        this.questions.splice(index, 1)
      }
    },
    
    addOption(questionId) {
      const question = this.questions.find(q => q.id === questionId || q._id === questionId)
      if (question && question.options) {
        const newId = Math.max(...question.options.map(o => o.id), 0) + 1
        question.options.push({ id: newId, text: `Option ${newId}` })
      }
    },
    
    removeOption({ questionId, optionId }) {
      const question = this.questions.find(q => q.id === questionId || q._id === questionId)
      if (question && question.options) {
        const index = question.options.findIndex(o => o.id === optionId)
        if (index !== -1) {
          question.options.splice(index, 1)
        }
      }
    },
    
    onQuestionReorder(newOrder) {
      this.questions = newOrder
    },
    
    /* ===================================
       Settings Management
       =================================== */
    handleUpdateSettings(newSettings) {
      Object.assign(this.settings, newSettings)
    },
    
    addCollaborator(collaboratorData) {
      // รองรับทั้ง string (email) และ object format
      if (typeof collaboratorData === 'string') {
        const email = collaboratorData
        if (email && !this.settings.collaborators.find(c => c.email === email)) {
          const newId = this.settings.collaborators.length + 1
          this.settings.collaborators.push({ id: newId, email, role: 'Viewer' })
        }
      } else {
        // Object format
        const newId = this.settings.collaborators.length + 1
        this.settings.collaborators.push({ 
          id: newId, 
          email: collaboratorData.email || '', 
          role: collaboratorData.role || 'Viewer' 
        })
      }
    },
    
    removeCollaborator(idOrEmail) {
      // รองรับทั้ง id (number) และ email (string)
      if (typeof idOrEmail === 'number') {
        this.settings.collaborators = this.settings.collaborators.filter(c => c.id !== idOrEmail)
      } else {
        this.settings.collaborators = this.settings.collaborators.filter(c => c.email !== idOrEmail)
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
    },
    
    /* ===================================
       Modal
       =================================== */
    showModal(type, title, message) {
      this.modalType = type
      this.modalTitle = title
      this.modalMessage = message
      this.modalVisible = true
    },
    
    closeModal() {
      this.modalVisible = false
    }
  }
}
</script>

<style scoped>
/* CoreUI Tab customization */
::v-deep .nav-tabs {
  border-bottom: 2px solid #e4e7ea;
}

::v-deep .nav-tabs .nav-link {
  font-weight: 500;
  color: #768192;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 0.75rem 1.25rem;
  transition: all 0.2s ease;
}

::v-deep .nav-tabs .nav-link:hover {
  color: #321fdb;
  border-color: transparent;
}

::v-deep .nav-tabs .nav-link.active {
  color: #321fdb;
  background-color: transparent;
  border-bottom-color: #321fdb;
}

/* Tab content spacing */
::v-deep .tab-content {
  padding-top: 1rem;
}
</style>
