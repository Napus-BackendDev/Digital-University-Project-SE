<script setup>
defineProps({
  value: { type: String, default: '' }
})

const emit = defineEmits(['update:value'])
</script>

<template>
  <div class="question-field">
    <div class="time-picker-preview">
      <svg class="time-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="10" cy="10" r="8"></circle>
        <path d="M10 5v5l3 3"></path>
      </svg>
      <span>Time picker</span>
    </div>
  </div>
</template>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-picker-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed #e5e5e5;
  border-radius: 8px;
  color: #999;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.time-icon {
  width: 20px;
  height: 20px;
}
</style>
