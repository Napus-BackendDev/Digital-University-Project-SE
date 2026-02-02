/**
 * DataResponses Store - จัดการ state ของ Responses Tab
 * สำหรับข้อมูลคำตอบทั้งหมด
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { responseAPI } from '@/services/api'

export const useDataResponsesStore = defineStore('dataResponses', () => {
  
  /* ===================================
     State
     =================================== */
  
  const responses = ref([])
  const totalResponses = ref(0)
  const viewMode = ref('summary') // 'summary' | 'individual'
  const loading = ref(false)
  const error = ref(null)
  
  // For individual view
  const selectedResponseId = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const searchQuery = ref('')


  /* ===================================
     Getters
     =================================== */
  
  // Questions for responses (exclude non-answerable types)
  const questionsForResponses = computed(() => {
    // This will be populated from formBuilder store
    return []
  })
  
  // Filtered responses based on search
  const filteredResponses = computed(() => {
    if (!searchQuery.value) return responses.value
    
    const query = searchQuery.value.toLowerCase()
    return responses.value.filter(resp => {
      const email = resp.responder?.email?.toLowerCase() || ''
      return email.includes(query)
    })
  })
  
  // Paginated responses
  const paginatedResponses = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredResponses.value.slice(start, end)
  })
  
  // Total pages
  const totalPages = computed(() => {
    return Math.ceil(filteredResponses.value.length / pageSize.value)
  })
  
  // Selected response
  const selectedResponse = computed(() => {
    if (!selectedResponseId.value) return null
    return responses.value.find(r => r._id === selectedResponseId.value)
  })


  /* ===================================
     Actions
     =================================== */
  
  /**
   * โหลด responses จาก API
   */
  async function fetchResponses(formId) {
    if (!formId) return
    
    loading.value = true
    error.value = null
    
    try {
      const result = await responseAPI.getByFormId(formId)
      if (result?.data) {
        responses.value = result.data
        totalResponses.value = result.data.length || 0
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching responses:', err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Set view mode
   */
  function setViewMode(mode) {
    viewMode.value = mode
  }
  
  /**
   * Select a response for individual view
   */
  function selectResponse(responseId) {
    selectedResponseId.value = responseId
    viewMode.value = 'individual'
  }
  
  /**
   * Clear selected response
   */
  function clearSelectedResponse() {
    selectedResponseId.value = null
  }
  
  /**
   * Navigate to next response
   */
  function nextResponse() {
    const currentIndex = responses.value.findIndex(r => r._id === selectedResponseId.value)
    if (currentIndex < responses.value.length - 1) {
      selectedResponseId.value = responses.value[currentIndex + 1]._id
    }
  }
  
  /**
   * Navigate to previous response
   */
  function previousResponse() {
    const currentIndex = responses.value.findIndex(r => r._id === selectedResponseId.value)
    if (currentIndex > 0) {
      selectedResponseId.value = responses.value[currentIndex - 1]._id
    }
  }
  
  /**
   * Set search query
   */
  function setSearchQuery(query) {
    searchQuery.value = query
    currentPage.value = 1 // Reset to first page on search
  }
  
  /**
   * Set current page
   */
  function setCurrentPage(page) {
    currentPage.value = page
  }
  
  /**
   * Export responses
   */
  function exportResponses(format) {
    // TODO: Implement actual export
    console.log(`Exporting responses as ${format}`)
    return { success: true, format }
  }
  
  /**
   * Delete a response
   */
  async function deleteResponse(responseId) {
    try {
      await responseAPI.delete(responseId)
      responses.value = responses.value.filter(r => r._id !== responseId)
      totalResponses.value = responses.value.length
      
      if (selectedResponseId.value === responseId) {
        selectedResponseId.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error deleting response:', err)
      return false
    }
  }
  
  /**
   * Reset responses state
   */
  function resetResponses() {
    responses.value = []
    totalResponses.value = 0
    viewMode.value = 'summary'
    selectedResponseId.value = null
    currentPage.value = 1
    searchQuery.value = ''
    error.value = null
  }


  /* ===================================
     Return Public API
     =================================== */
  return {
    // State
    responses,
    totalResponses,
    viewMode,
    loading,
    error,
    selectedResponseId,
    currentPage,
    pageSize,
    searchQuery,
    
    // Getters
    questionsForResponses,
    filteredResponses,
    paginatedResponses,
    totalPages,
    selectedResponse,
    
    // Actions
    fetchResponses,
    setViewMode,
    selectResponse,
    clearSelectedResponse,
    nextResponse,
    previousResponse,
    setSearchQuery,
    setCurrentPage,
    exportResponses,
    deleteResponse,
    resetResponses
  }
})
