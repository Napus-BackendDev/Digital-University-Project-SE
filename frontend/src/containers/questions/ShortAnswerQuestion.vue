<script setup>
/**
 * ShortAnswerQuestion - แสดง preview คำถามแบบตอบสั้น
 * ใช้ในหน้า form builder เพื่อแสดงรูปแบบคำถาม
 */
defineProps({
  placeholder: { type: String, default: 'Short answer text' }
})
</script>

<template>
  <div class="question-field">
    <input type="text" :placeholder="placeholder" class="answer-preview" disabled />
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
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-muted);
  background: var(--bg-gray);
}
</style>
