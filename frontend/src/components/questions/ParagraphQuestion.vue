<script setup>
/**
 * ParagraphQuestion - แสดง preview คำถามแบบตอบยาว
 * เป็น textarea สำหรับให้ผู้ตอบพิมพ์คำตอบยาวๆ
 */
defineProps({
  placeholder: { type: String, default: 'Long answer text' }
})
</script>

<template>
  <div class="question-field">
    <textarea :placeholder="placeholder" class="answer-preview textarea" disabled></textarea>
  </div>
</template>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-preview {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #999;
  background: #fafafa;
}

.answer-preview.textarea {
  min-height: 64px;
  resize: none;
}
</style>
