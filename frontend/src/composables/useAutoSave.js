/**
 * useAutoSave - จัดการ Auto-save
 */
import { ref, onUnmounted } from 'vue'

export function useAutoSave(saveFn) {
  const saving = ref(false)
  let saveTimeout = null

  /**
   * Debounce save - รอก่อนบันทึก
   */
  function debounceSave(delay = 1000) {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      executeSave()
    }, delay)
  }

  /**
   * บันทึกทันที
   */
  async function executeSave() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = null
    
    saving.value = true
    try {
      await saveFn()
    } catch (err) {
      console.error('บันทึกไม่สำเร็จ:', err)
    } finally {
      saving.value = false
    }
  }

  /**
   * ตรวจสอบว่ามี pending save หรือไม่
   */
  function hasPendingSave() {
    return saveTimeout !== null
  }

  /**
   * Handler สำหรับ beforeunload
   */
  function handleBeforeUnload(e) {
    if (saveTimeout) {
      executeSave()
      e.preventDefault()
      e.returnValue = ''
    }
  }

  /**
   * เริ่ม listeners
   */
  function initAutoSave() {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  /**
   * Cleanup
   */
  function cleanup() {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    if (saveTimeout) clearTimeout(saveTimeout)
  }

  // Auto cleanup on unmount
  onUnmounted(cleanup)

  return {
    saving,
    debounceSave,
    executeSave,
    hasPendingSave,
    initAutoSave,
    cleanup
  }
}
