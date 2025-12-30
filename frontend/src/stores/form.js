/**
 * Form Store - จัดการ state ของฟอร์มทั้งหมด
 * ใช้ Pinia เป็น state management
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formAPI, questionsAPI } from '@/services/api'

export const useFormStore = defineStore('form', () => {
  
  /* ===================================
     State - ข้อมูลที่เก็บใน store
     =================================== */
  const forms = ref([])           // รายการฟอร์มทั้งหมด
  const currentForm = ref(null)   // ฟอร์มที่กำลังทำงานอยู่
  const loading = ref(false)      // สถานะกำลังโหลด
  const error = ref(null)         // ข้อความ error ถ้ามี


  /* ===================================
     Getters - ดึงข้อมูลแบบกรอง
     =================================== */
  // ฟอร์มที่ยังเป็นแบบร่าง
  const draftForms = computed(() => forms.value.filter(f => f.status === 'draft'))
  
  // ฟอร์มที่เปิดใช้งาน
  const openForms = computed(() => forms.value.filter(f => f.status === 'open'))
  
  // ฟอร์มที่ปิดแล้ว
  const closedForms = computed(() => forms.value.filter(f => f.status === 'close'))


  /* ===================================
     Actions - ฟังก์ชันจัดการข้อมูล
     =================================== */
  
  /**
   * ดึงฟอร์มทั้งหมดจาก API
   */
  async function fetchForms() {
    loading.value = true
    error.value = null
    
    try {
      const response = await formAPI.getAll()
      forms.value = response.data || []
    } catch (err) {
      error.value = err.message
      console.error('โหลดฟอร์มไม่สำเร็จ:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * ดึงฟอร์มตาม ID
   * @param {string} id - ID ของฟอร์ม
   */
  async function fetchFormById(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await formAPI.getById(id)
      currentForm.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('ดึงข้อมูลฟอร์มไม่สำเร็จ:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * สร้างฟอร์มใหม่
   * @param {object} formData - ข้อมูลฟอร์ม (title)
   */
  async function createForm(formData = {}) {
    loading.value = true
    error.value = null
    
    try {
      // เตรียมข้อมูลฟอร์มใหม่
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
      
      // เพิ่มฟอร์มใหม่ไว้ด้านบนสุดของ list
      forms.value.unshift(createdForm)
      return createdForm
    } catch (err) {
      error.value = err.message
      console.error('สร้างฟอร์มไม่สำเร็จ:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * อัพเดทฟอร์ม
   * @param {object} formData - ข้อมูลฟอร์มที่จะอัพเดท
   */
  async function updateForm(formData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await formAPI.update(formData)
      
      // อัพเดทใน list
      const index = forms.value.findIndex(f => f._id === formData._id)
      if (index !== -1) {
        forms.value[index] = response.data
      }
      
      // อัพเดท currentForm ถ้าตรงกัน
      if (currentForm.value?._id === formData._id) {
        currentForm.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('อัพเดทฟอร์มไม่สำเร็จ:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * ลบฟอร์ม
   * @param {string} id - ID ของฟอร์มที่จะลบ
   */
  async function deleteForm(id) {
    loading.value = true
    error.value = null
    
    try {
      await formAPI.delete(id)
      
      // ลบออกจาก list
      forms.value = forms.value.filter(f => f._id !== id)
      
      // ล้าง currentForm ถ้าตรงกัน
      if (currentForm.value?._id === id) {
        currentForm.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('ลบฟอร์มไม่สำเร็จ:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * ทำสำเนาฟอร์ม
   * @param {string} id - ID ของฟอร์มที่จะ duplicate
   */
  async function duplicateForm(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await formAPI.duplicate(id)
      
      // เพิ่มฟอร์มที่ duplicate ไว้ด้านบน
      forms.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('ทำสำเนาฟอร์มไม่สำเร็จ:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * ตั้งค่าฟอร์มปัจจุบัน
   */
  function setCurrentForm(form) {
    currentForm.value = form
  }

  /**
   * ล้าง error message
   */
  function clearError() {
    error.value = null
  }


  /* ===================================
     Return - สิ่งที่ให้ component เข้าถึงได้
     =================================== */
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
