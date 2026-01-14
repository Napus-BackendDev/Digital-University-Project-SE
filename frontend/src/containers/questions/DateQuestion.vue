<script setup>
/**
 * DateQuestion - คำถามแบบเลือกวันที่
 * แสดง date picker ให้ผู้ตอบเลือกวันที่
 */
defineProps({
  value: { type: String, default: '' }
})

const emit = defineEmits(['update:value'])
</script>

<template>
  <div class="question-field">
    <div class="date-picker-preview">
      <svg class="date-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="4" width="16" height="14" rx="2"></rect>
        <path d="M6 2v4M14 2v4M2 8h16"></path>
      </svg>
      <span>Date picker</span>
    </div>
  </div>
</template>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-picker-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-muted);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.date-icon {
  width: 20px;
  height: 20px;
}
</style>
