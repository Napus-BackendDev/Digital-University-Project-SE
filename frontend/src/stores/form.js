import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formAPI, questionsAPI } from '@/services/api'

export const useFormStore = defineStore('form', () => {
  // State
  const forms = ref([])
  const currentForm = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const draftForms = computed(() => forms.value.filter(f => f.status === 'draft'))
  const openForms = computed(() => forms.value.filter(f => f.status === 'open'))
  const closedForms = computed(() => forms.value.filter(f => f.status === 'close'))

  // Actions
  async function fetchForms() {
    loading.value = true
    error.value = null
    try {
      const response = await formAPI.getAll()
      forms.value = response.data || []
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch forms:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchFormById(id) {
    loading.value = true
    error.value = null
    try {
      const response = await formAPI.getById(id)
      currentForm.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch form:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createForm(formData = {}) {
    loading.value = true
    error.value = null
    try {
      const newForm = {
        title: [{ key: 'en', value: formData.title || 'Untitled Form' }],
        status: 'draft',
        can_duplicate: true,
        questions: [],
        schedule: {
          startAt: null,
          endAt: null
        }
      }
      const response = await formAPI.create(newForm)
      const createdForm = response.data
      forms.value.unshift(createdForm)
      return createdForm
    } catch (err) {
      error.value = err.message
      console.error('Failed to create form:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateForm(formData) {
    loading.value = true
    error.value = null
    try {
      const response = await formAPI.update(formData)
      const index = forms.value.findIndex(f => f._id === formData._id)
      if (index !== -1) {
        forms.value[index] = response.data
      }
      if (currentForm.value?._id === formData._id) {
        currentForm.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Failed to update form:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteForm(id) {
    loading.value = true
    error.value = null
    try {
      await formAPI.delete(id)
      forms.value = forms.value.filter(f => f._id !== id)
      if (currentForm.value?._id === id) {
        currentForm.value = null
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete form:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function duplicateForm(id) {
    loading.value = true
    error.value = null
    try {
      const response = await formAPI.duplicate(id)
      forms.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Failed to duplicate form:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  function setCurrentForm(form) {
    currentForm.value = form
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    forms,
    currentForm,
    loading,
    error,
    // Getters
    draftForms,
    openForms,
    closedForms,
    // Actions
    fetchForms,
    fetchFormById,
    createForm,
    updateForm,
    deleteForm,
    duplicateForm,
    setCurrentForm,
    clearError,
  }
})
