/**
 * API Service สำหรับเชื่อมต่อกับ Backend
 * ใช้จัดการ HTTP requests ทั้งหมดของแอป
 */

// ดึง API URL จาก environment variable หรือใช้ค่า default
// Backend ใช้ port 8081 (ตาม .env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1'

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
  console.log(url);
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
    return fetchAPI(`/questions?formId=${formId}`)
  },
  
  // สร้างคำถามใหม่ (รองรับทั้ง single และ array)
  async create(questionsData) {
    return fetchAPI('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    })
  },
  
  // สร้างคำถามหลายอันพร้อมกัน
  async createMany(questionsArray) {
    return fetchAPI('/questions', {
      method: 'POST',
      body: JSON.stringify(questionsArray),
    })
  },
  
  // อัพเดทคำถาม
  async update(questionsData) {
    return fetchAPI('/questions', {
      method: 'PUT',
      body: JSON.stringify(questionData),
    })
  },
  
  // ลบคำถาม
  async delete(id) {
    return fetchAPI('/questions', {
      method: 'DELETE',
      body: JSON.stringify({ _id: id }),
    })
  },
  
  // ลบคำถามทั้งหมดของ form
  async deleteByFormId(formId) {
    return fetchAPI(`/questions/byForm`, {
      method: 'DELETE',
      body: JSON.stringify({ formId: formId }),
    })
  },
}


/* ===================================
   Response API - จัดการคำตอบ
   =================================== */
export const responseAPI = {
  // ดึงคำตอบทั้งหมดของฟอร์ม
  async getByFormId(formId) {
    return fetchAPI(`/response/getByFormId?formId=${formId}`)
  },
  
  // ดึงคำตอบตาม User ID
  async getByUserId(userId) {
    return fetchAPI(`/response/getByUserId?userId=${userId}`)
  },
  
  // ดึงคำตอบตาม ID
  async getById(id) {
    return fetchAPI(`/response/getById?_id=${id}`)
  },
  
  // ส่งคำตอบ
  async submit(responseData) {
    return fetchAPI('/response/submit', {
      method: 'POST',
      body: JSON.stringify(responseData),
    })
  },
  
  // อัพเดทคำตอบ
  async update(responseData) {
    return fetchAPI('/response/update', {
      method: 'PATCH',
      body: JSON.stringify(responseData),
    })
  },
  
  // ลบคำตอบ
  async delete(id) {
    return fetchAPI('/response/delete', {
      method: 'DELETE',
      body: JSON.stringify({ _id: id }),
    })
  },
  
  // ลบคำตอบทั้งหมดของฟอร์ม
  async deleteByFormId(formId) {
    return fetchAPI('/response/deleteByFormId', {
      method: 'DELETE',
      body: JSON.stringify({ formId: formId }),
    })
  },
  
  // ดาวน์โหลด JSON ของ user
  async downloadUserJSON(formId, userId) {
    return fetchAPI(`/response/download/${formId}/user/${userId}`)
  },
  
  // ดาวน์โหลด JSON ทั้งหมดของฟอร์ม
  async downloadFormJSON(formId) {
    return fetchAPI(`/response/download/${formId}`)
  },
  
  // สร้าง export link
  async generateExportLink(formId) {
    return fetchAPI('/response/export/link', {
      method: 'POST',
      body: JSON.stringify({ formId: formId }),
    })
  },
}


// Export ทั้งหมดเป็น object เดียว
export default {
  form: formAPI,
  questions: questionsAPI,
  response: responseAPI,
}