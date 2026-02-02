/**
 * FormBuilder Store - จัดการ state หลักของ Form Builder
 * สำหรับข้อมูลฟอร์มและคำถาม (Questions Tab)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formAPI, questionsAPI } from '@/services/api'
import { useDataResponsesStore } from './dataResponses'
import { useSettingStore } from './setting'

export const useFormBuilderStore = defineStore('formBuilder', () => {
  
  /* ===================================
     State
     =================================== */
  
  // Form Info
  const formId = ref(null)
  const formTitle = ref('Untitled Form')
  const formDescription = ref('')
  const formStatus = ref('draft')
  
  // Active Tab
  const activeTab = ref('questions')
  
  // Questions
  const questions = ref([])
  const expandedQuestionId = ref(null)
  
  // UI State
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)
  const isDirty = ref(false)
  
  // Modal
  const modal = ref({
    visible: false,
    type: 'info',
    title: '',
    message: ''
  })


  /* ===================================
     Getters
     =================================== */
  
  const formUrl = computed(() => {
    const baseUrl = window.location.origin
    return formId.value ? `${baseUrl}/form/${formId.value}/response` : ''
  })
  
  const previewUrl = computed(() => {
    const baseUrl = window.location.origin
    return formId.value ? `${baseUrl}/form/${formId.value}/preview` : ''
  })
  
  const hasPendingChanges = computed(() => isDirty.value)
  
  // Tabs with response count (uses dataResponses store)
  const tabs = computed(() => {
    const dataResponsesStore = useDataResponsesStore()
    return [
      { id: 'questions', label: 'Questions', icon: 'questions' },
      { id: 'responses', label: `Responses (${dataResponsesStore.totalResponses})`, icon: 'responses' },
      { id: 'settings', label: 'Settings', icon: 'settings' }
    ]
  })


  /* ===================================
     Actions - Form
     =================================== */
  
  async function loadForm(id) {
    if (!id) return null
    
    loading.value = true
    error.value = null
    formId.value = id
    
    const settingStore = useSettingStore()
    const dataResponsesStore = useDataResponsesStore()
    
    try {
      const response = await formAPI.getById(id)
      const form = response.data?.data || response.data
      
      if (form) {
        formTitle.value = form.title?.[0]?.value || 'Untitled Form'
        formDescription.value = form.description?.[0]?.value || ''
        formStatus.value = form.status || 'draft'
        
        // Load questions - reset to empty array if no questions
        if (form.questions?.length > 0) {
          questions.value = transformQuestionsFromAPI(form.questions)
        } else {
          questions.value = []
        }
        
        // Load settings (delegate to setting store)
        settingStore.loadFromForm(form)
        
        // Load responses (delegate to dataResponses store)
        await dataResponsesStore.fetchResponses(id)
        
        isDirty.value = false
        return form
      }
      
      return null
    } catch (err) {
      error.value = err.message
      console.error('โหลดฟอร์มไม่สำเร็จ:', err)
      return null
    } finally {
      loading.value = false
    }
  }
  
  async function saveForm() {
    if (!formId.value || !isDirty.value) return
    
    saving.value = true
    const settingStore = useSettingStore()
    
    try {
      // Save existing questions
      const existingQuestions = questions.value.filter(q => q._id)
      const newQuestions = questions.value.filter(q => !q._id)
      
      // Update existing questions
      for (const q of existingQuestions) {
        await questionsAPI.update(buildQuestionPayload(q, true))
      }
      
      // Create new questions
      const createdIds = []
      for (const q of newQuestions) {
        if (!q.title?.trim()) continue
        
        const result = await questionsAPI.create(buildQuestionPayload(q, false))
        const created = result?.data?.data || result?.data
        if (created?._id) {
          q._id = created._id
          createdIds.push(created._id)
        }
      }
      
      // Update form
      const allQuestionIds = [
        ...existingQuestions.map(q => q._id),
        ...createdIds
      ]
      
      const formData = {
        _id: formId.value,
        title: [{ key: 'en', value: formTitle.value }],
        description: [{ key: 'en', value: formDescription.value }],
        questions: allQuestionIds,
        status: settingStore.settings.formStatus || formStatus.value,
        schedule: settingStore.buildSchedule(),
        settings: settingStore.buildSettingsPayload()
      }
      
      await formAPI.update(formData)
      
      isDirty.value = false
      formStatus.value = settingStore.settings.formStatus
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('บันทึกไม่สำเร็จ:', err)
      return false
    } finally {
      saving.value = false
    }
  }
  
  function resetStore() {
    formId.value = null
    formTitle.value = 'Untitled Form'
    formDescription.value = ''
    formStatus.value = 'draft'
    activeTab.value = 'questions'
    questions.value = []
    expandedQuestionId.value = null
    isDirty.value = false
    error.value = null
    
    // Reset other stores
    const settingStore = useSettingStore()
    const dataResponsesStore = useDataResponsesStore()
    settingStore.resetSettings()
    dataResponsesStore.resetResponses()
  }


  /* ===================================
     Actions - Questions
     =================================== */
  
  function addQuestion(type) {
    const newQuestion = {
      id: Date.now(),
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
    
    questions.value.push(newQuestion)
    markDirty()
  }
  
  function updateQuestion(updatedQuestion) {
    const index = questions.value.findIndex(q => q.id === updatedQuestion.id)
    if (index !== -1) {
      questions.value[index] = updatedQuestion
      markDirty()
    }
  }
  
  function deleteQuestion(questionId) {
    questions.value = questions.value.filter(q => q.id !== questionId)
    markDirty()
  }
  
  function toggleQuestion(questionId) {
    expandedQuestionId.value = expandedQuestionId.value === questionId ? null : questionId
  }
  
  function addOption(question) {
    const newOptionId = question.options.length + 1
    question.options.push({ id: newOptionId, text: `Option ${newOptionId}` })
    markDirty()
  }
  
  function removeOption(question, optionId) {
    question.options = question.options.filter(o => o.id !== optionId)
    markDirty()
  }
  
  function reorderQuestions(newOrder) {
    questions.value = newOrder
    markDirty()
  }
  
  function setFormTitle(title) {
    formTitle.value = title
    markDirty()
  }
  
  function setFormDescription(description) {
    formDescription.value = description
    markDirty()
  }


  /* ===================================
     Actions - Modal
     =================================== */
  
  function showModal(type, title, message) {
    modal.value = { visible: true, type, title, message }
  }
  
  function closeModal() {
    modal.value.visible = false
  }


  /* ===================================
     Actions - Utility
     =================================== */
  
  function markDirty() {
    isDirty.value = true
  }
  
  function setActiveTab(tab) {
    activeTab.value = tab
    if (formId.value) {
      localStorage.setItem(`formBuilder_${formId.value}_activeTab`, tab)
    }
  }
  
  function copyFormUrl() {
    navigator.clipboard.writeText(formUrl.value)
    showModal('success', 'Copied!', 'URL copied to clipboard!')
  }
  
  function openPreview() {
    window.open(previewUrl.value, '_self')
  }


  /* ===================================
     Helper Functions
     =================================== */
  
  function buildQuestionPayload(q, isUpdate) {
    const payload = {
      title: [{ key: 'en', value: q.title || '' }],
      type: mapQuestionType(q.type),
      required: q.required || false,
      order: questions.value.indexOf(q) + 1,
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
    
    if (isUpdate) {
      payload._id = q._id
    } else {
      payload.form = formId.value
    }
    
    return payload
  }
  
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
      imageUrl: q.config?.imageUrl || '',
      videoUrl: q.config?.videoUrl || '',
      caption: q.config?.caption || ''
    }))
  }


  /* ===================================
     Return Public API
     =================================== */
  return {
    // State
    formId,
    formTitle,
    formDescription,
    formStatus,
    activeTab,
    questions,
    expandedQuestionId,
    loading,
    saving,
    error,
    isDirty,
    modal,
    
    // Getters
    formUrl,
    previewUrl,
    hasPendingChanges,
    tabs,
    
    // Form Actions
    loadForm,
    saveForm,
    resetStore,
    
    // Questions Actions
    addQuestion,
    updateQuestion,
    deleteQuestion,
    toggleQuestion,
    addOption,
    removeOption,
    reorderQuestions,
    setFormTitle,
    setFormDescription,
    
    // Modal Actions
    showModal,
    closeModal,
    
    // Utility Actions
    markDirty,
    setActiveTab,
    copyFormUrl,
    openPreview
  }
})
