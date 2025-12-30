/**
 * useQuestionManager - จัดการคำถามในฟอร์ม
 */
import { ref } from 'vue'

export function useQuestionManager() {
  const questions = ref([])
  const expandedQuestionId = ref(null)

  /**
   * สลับการแสดง/ซ่อนรายละเอียดคำถาม
   */
  function toggleQuestion(questionId) {
    expandedQuestionId.value = expandedQuestionId.value === questionId ? null : questionId
  }

  /**
   * เพิ่มคำถามใหม่
   */
  function addQuestion(type) {
    const newQuestion = {
      id: questions.value.length + 1,
      type: type.id,
      title: '',
      required: false
    }

    // เพิ่ม options สำหรับคำถามแบบเลือก
    if (['multiple-choice', 'checkbox', 'dropdown'].includes(type.id)) {
      newQuestion.options = [{ id: 1, text: 'Option 1' }]
    }

    // เพิ่ม maxRating สำหรับ rating
    if (type.id === 'rating') {
      newQuestion.maxRating = 5
    }

    // เพิ่ม file upload settings
    if (type.id === 'file-upload') {
      newQuestion.allowSpecificTypes = false
      newQuestion.allowedFileTypes = []
      newQuestion.maxFiles = 1
      newQuestion.maxSize = 10
    }

    questions.value.push(newQuestion)
  }

  /**
   * ลบคำถาม
   */
  function deleteQuestion(questionId) {
    questions.value = questions.value.filter(q => q.id !== questionId)
  }

  /**
   * อัพเดทคำถาม
   */
  function updateQuestion(updatedQuestion) {
    const index = questions.value.findIndex(q => q.id === updatedQuestion.id)
    if (index !== -1) {
      questions.value[index] = updatedQuestion
    }
  }

  /**
   * เพิ่มตัวเลือกในคำถาม
   */
  function addOption(question) {
    const newOptionId = question.options.length + 1
    question.options.push({ id: newOptionId, text: `Option ${newOptionId}` })
  }

  /**
   * ลบตัวเลือกในคำถาม
   */
  function removeOption(question, optionId) {
    question.options = question.options.filter(o => o.id !== optionId)
  }

  /**
   * เมื่อ drag & drop คำถามเสร็จ
   */
  function onQuestionReorder() {
    console.log('คำถามถูกจัดลำดับใหม่:', questions.value.map(q => q.id))
  }

  /**
   * Set questions จาก form ที่โหลดมา
   */
  function setQuestions(loadedQuestions) {
    questions.value = loadedQuestions
  }

  return {
    questions,
    expandedQuestionId,
    toggleQuestion,
    addQuestion,
    deleteQuestion,
    updateQuestion,
    addOption,
    removeOption,
    onQuestionReorder,
    setQuestions
  }
}
