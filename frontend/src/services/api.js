/**
 * API Service สำหรับเชื่อมต่อกับ Backend
 * ใช้จัดการ HTTP requests ทั้งหมดของแอป
 */

// ดึง API URL จาก environment variable หรือใช้ค่า default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * ฟังก์ชันหลักสำหรับเรียก API
 * รองรับ GET, POST, PUT, DELETE
 * 
 * @param {string} endpoint - path ของ API เช่น '/form'
 * @param {object} options - ตัวเลือกเพิ่มเติม (method, body, headers)
 * @returns {Promise} ข้อมูลที่ได้จาก API
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  // กำหนด headers เริ่มต้น
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  // เรียก API
  const response = await fetch(url, { ...defaultOptions, ...options })
  const data = await response.json()
  
  // ถ้า response ไม่ ok ให้ throw error
  if (!response.ok) {
    throw new Error(data.message || 'API request failed')
  }
  
  return data
}


/* ===================================
   Form API - จัดการฟอร์ม
   =================================== */
export const formAPI = {
  // ดึงฟอร์มทั้งหมด
  async getAll() {
    return fetchAPI('/form')
  },
  
  // ดึงฟอร์มตาม ID
  async getById(id) {
    return fetchAPI(`/form/id?_id=${id}`)
  },
  
  // สร้างฟอร์มใหม่
  async create(formData) {
    return fetchAPI('/form', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
  },
  
  // อัพเดทฟอร์ม
  async update(formData) {
    return fetchAPI('/form', {
      method: 'PUT',
      body: JSON.stringify(formData),
    })
  },
  
  // ลบฟอร์ม
  async delete(id) {
    return fetchAPI('/form', {
      method: 'DELETE',
      body: JSON.stringify({ _id: id }),
    })
  },
  
  // ทำสำเนาฟอร์ม
  async duplicate(id) {
    return fetchAPI('/form/duplicate', {
      method: 'POST',
      body: JSON.stringify({ _id: id }),
    })
  },
}


/* ===================================
   Questions API - จัดการคำถาม
   =================================== */
export const questionsAPI = {
  // ดึงคำถามทั้งหมดของฟอร์ม
  async getByFormId(formId) {
    return fetchAPI(`/question?formId=${formId}`)
  },
  
  // สร้างคำถามใหม่
  async create(questionData) {
    return fetchAPI('/question', {
      method: 'POST',
      body: JSON.stringify(questionData),
    })
  },
  
  // อัพเดทคำถาม
  async update(questionData) {
    return fetchAPI('/question', {
      method: 'PUT',
      body: JSON.stringify(questionData),
    })
  },
  
  // ลบคำถาม
  async delete(id) {
    return fetchAPI('/question', {
      method: 'DELETE',
      body: JSON.stringify({ _id: id }),
    })
  },
}


/* ===================================
   Response API - จัดการคำตอบ
   =================================== */
export const responseAPI = {
  // ดึงคำตอบทั้งหมดของฟอร์ม
  async getByFormId(formId) {
    return fetchAPI(`/response?formId=${formId}`)
  },
  
  // ส่งคำตอบ
  async submit(responseData) {
    return fetchAPI('/response', {
      method: 'POST',
      body: JSON.stringify(responseData),
    })
  },
}


// Export ทั้งหมดเป็น object เดียว
export default {
  form: formAPI,
  questions: questionsAPI,
  response: responseAPI,
}
