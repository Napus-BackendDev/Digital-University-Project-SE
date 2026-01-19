<template>
  <div class="question-field">
    <textarea :placeholder="placeholder" class="answer-preview textarea" disabled></textarea>
  </div>
</template>

<script>
/**
 * ParagraphQuestion - แสดง preview คำถามแบบตอบยาว
 * เป็น textarea สำหรับให้ผู้ตอบพิมพ์คำตอบยาวๆ
 */
export default {
  name: 'ParagraphQuestion',
  props: {
    placeholder: { type: String, default: 'Long answer text' }
  }
}
</script>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-preview {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-muted);
  background: var(--bg-gray);
}

.answer-preview.textarea {
  min-height: 64px;
  resize: none;
}
</style>
