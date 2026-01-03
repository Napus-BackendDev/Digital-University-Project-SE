/**
 * useModal - จัดการ Modal state
 */
import { ref } from 'vue'

export function useModal() {
  const modalVisible = ref(false)
  const modalType = ref('info')
  const modalTitle = ref('')
  const modalMessage = ref('')

  function showModal(type, title, message) {
    modalType.value = type
    modalTitle.value = title
    modalMessage.value = message
    modalVisible.value = true
  }

  function closeModal() {
    modalVisible.value = false
  }

  return {
    modalVisible,
    modalType,
    modalTitle,
    modalMessage,
    showModal,
    closeModal
  }
}
