// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Generic fetch wrapper
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  const response = await fetch(url, { ...defaultOptions, ...options })
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed')
  }
  
  return data
}

// Form API
export const formAPI = {
  // Get all forms
  async getAll() {
    return fetchAPI('/form')
  },
  
  // Get single form by ID
  async getById(id) {
    return fetchAPI(`/form/id?_id=${id}`)
  },
  
  // Create new form
  async create(formData) {
    return fetchAPI('/form', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
  },
  
  // Update form
  async update(formData) {
    return fetchAPI('/form', {
      method: 'PUT',
      body: JSON.stringify(formData),
    })
  },
  
  // Delete form
  async delete(id) {
    return fetchAPI('/form', {
      method: 'DELETE',
      body: JSON.stringify({ _id: id }),
    })
  },
  
  // Duplicate form
  async duplicate(id) {
    return fetchAPI('/form/duplicate', {
      method: 'POST',
      body: JSON.stringify({ _id: id }),
    })
  },
}

// Questions API
export const questionsAPI = {
  // Get all questions for a form
  async getByFormId(formId) {
    return fetchAPI(`/question?formId=${formId}`)
  },
  
  // Create question
  async create(questionData) {
    return fetchAPI('/question', {
      method: 'POST',
      body: JSON.stringify(questionData),
    })
  },
  
  // Update question
  async update(questionData) {
    return fetchAPI('/question', {
      method: 'PUT',
      body: JSON.stringify(questionData),
    })
  },
  
  // Delete question
  async delete(id) {
    return fetchAPI('/question', {
      method: 'DELETE',
      body: JSON.stringify({ _id: id }),
    })
  },
}

// Response API
export const responseAPI = {
  // Get all responses for a form
  async getByFormId(formId) {
    return fetchAPI(`/response?formId=${formId}`)
  },
  
  // Submit response
  async submit(responseData) {
    return fetchAPI('/response', {
      method: 'POST',
      body: JSON.stringify(responseData),
    })
  },
}

export default {
  form: formAPI,
  questions: questionsAPI,
  response: responseAPI,
}
