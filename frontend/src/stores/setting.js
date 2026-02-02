/**
 * Setting Store - จัดการ state ของ Settings Tab
 * สำหรับการตั้งค่าฟอร์ม
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingStore = defineStore('setting', () => {
  
  /* ===================================
     State
     =================================== */
  
  const settings = ref({
    // Form Status
    formStatus: 'draft', // 'draft' | 'open' | 'close' | 'auto'
    
    // Schedule (for auto status)
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    
    // Access Control
    whoCanRespond: 'anyone', // 'anyone' | 'organization' | 'specific'
    collaborators: [],
    
    // Response Settings
    collectEmails: false,
    limitResponses: false,
    maxResponses: 100,
    showProgressBar: true,
    
    // Confirmation
    confirmationMessage: 'Thank you for completing this survey. Your response has been recorded.'
  })
  
  const loading = ref(false)
  const error = ref(null)


  /* ===================================
     Getters
     =================================== */
  
  const isScheduled = computed(() => settings.value.formStatus === 'auto')
  
  const hasSchedule = computed(() => {
    return settings.value.startDate && settings.value.startTime
  })
  
  const collaboratorCount = computed(() => settings.value.collaborators.length)
  
  const isFormOpen = computed(() => {
    if (settings.value.formStatus === 'open') return true
    if (settings.value.formStatus === 'close') return false
    if (settings.value.formStatus === 'draft') return false
    
    // Auto status - check schedule
    if (settings.value.formStatus === 'auto') {
      const now = new Date()
      
      if (settings.value.startDate && settings.value.startTime) {
        const startAt = new Date(`${settings.value.startDate}T${settings.value.startTime}`)
        if (now < startAt) return false
      }
      
      if (settings.value.endDate && settings.value.endTime) {
        const endAt = new Date(`${settings.value.endDate}T${settings.value.endTime}`)
        if (now > endAt) return false
      }
      
      return true
    }
    
    return false
  })


  /* ===================================
     Actions
     =================================== */
  
  /**
   * Load settings from form data
   */
  function loadFromForm(form) {
    if (form.status) {
      settings.value.formStatus = form.status
    }
    
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
    
    if (form.settings) {
      const s = form.settings
      if (s.whoCanRespond !== undefined) settings.value.whoCanRespond = s.whoCanRespond
      if (s.collectEmails !== undefined) settings.value.collectEmails = s.collectEmails
      if (s.limitResponses !== undefined) settings.value.limitResponses = s.limitResponses
      if (s.maxResponses !== undefined) settings.value.maxResponses = s.maxResponses
      if (s.showProgressBar !== undefined) settings.value.showProgressBar = s.showProgressBar
      if (s.confirmationMessage !== undefined) settings.value.confirmationMessage = s.confirmationMessage
    }
    
    if (form.collaborators) {
      settings.value.collaborators = form.collaborators
    }
  }
  
  /**
   * Update settings
   */
  function updateSettings(newSettings) {
    Object.assign(settings.value, newSettings)
  }
  
  /**
   * Update single setting
   */
  function updateSetting(key, value) {
    settings.value[key] = value
  }
  
  /**
   * Set form status
   */
  function setFormStatus(status) {
    settings.value.formStatus = status
  }
  
  /**
   * Set schedule
   */
  function setSchedule(startDate, startTime, endDate, endTime) {
    settings.value.startDate = startDate
    settings.value.startTime = startTime
    settings.value.endDate = endDate
    settings.value.endTime = endTime
  }
  
  /**
   * Add collaborator
   */
  function addCollaborator() {
    const newId = settings.value.collaborators.length + 1
    settings.value.collaborators.push({ 
      id: newId, 
      email: '', 
      role: 'Viewer' 
    })
  }
  
  /**
   * Update collaborator
   */
  function updateCollaborator(id, data) {
    const index = settings.value.collaborators.findIndex(c => c.id === id)
    if (index !== -1) {
      Object.assign(settings.value.collaborators[index], data)
    }
  }
  
  /**
   * Remove collaborator
   */
  function removeCollaborator(id) {
    settings.value.collaborators = settings.value.collaborators.filter(c => c.id !== id)
  }
  
  /**
   * Set confirmation message
   */
  function setConfirmationMessage(message) {
    settings.value.confirmationMessage = message
  }
  
  /**
   * Build schedule payload for API
   */
  function buildSchedule() {
    const schedule = { startAt: null, endAt: null }
    
    if (settings.value.formStatus === 'auto') {
      if (settings.value.startDate && settings.value.startTime) {
        schedule.startAt = new Date(`${settings.value.startDate}T${settings.value.startTime}`).toISOString()
      }
      if (settings.value.endDate && settings.value.endTime) {
        schedule.endAt = new Date(`${settings.value.endDate}T${settings.value.endTime}`).toISOString()
      }
    }
    
    return schedule
  }
  
  /**
   * Build settings payload for API
   */
  function buildSettingsPayload() {
    return {
      whoCanRespond: settings.value.whoCanRespond,
      collectEmails: settings.value.collectEmails,
      limitResponses: settings.value.limitResponses,
      maxResponses: settings.value.maxResponses,
      showProgressBar: settings.value.showProgressBar,
      confirmationMessage: settings.value.confirmationMessage
    }
  }
  
  /**
   * Reset settings to default
   */
  function resetSettings() {
    settings.value = {
      formStatus: 'draft',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      whoCanRespond: 'anyone',
      collaborators: [],
      collectEmails: false,
      limitResponses: false,
      maxResponses: 100,
      showProgressBar: true,
      confirmationMessage: 'Thank you for completing this survey. Your response has been recorded.'
    }
    error.value = null
  }


  /* ===================================
     Return Public API
     =================================== */
  return {
    // State
    settings,
    loading,
    error,
    
    // Getters
    isScheduled,
    hasSchedule,
    collaboratorCount,
    isFormOpen,
    
    // Actions
    loadFromForm,
    updateSettings,
    updateSetting,
    setFormStatus,
    setSchedule,
    addCollaborator,
    updateCollaborator,
    removeCollaborator,
    setConfirmationMessage,
    buildSchedule,
    buildSettingsPayload,
    resetSettings
  }
})
