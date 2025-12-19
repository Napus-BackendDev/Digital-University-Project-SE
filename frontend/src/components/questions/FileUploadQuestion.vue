<script setup>
defineProps({
  acceptedTypes: { type: Array, default: () => [] },
  maxSize: { type: Number, default: 10 } // MB
})

const emit = defineEmits(['file-selected'])
</script>

<template>
  <div class="question-field">
    <div class="file-upload-area">
      <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span>File upload area</span>
      <span class="upload-hint">Drag & drop or click to upload</span>
    </div>
  </div>
</template>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 18px;
  border: 2px dashed #e5e5e5;
  border-radius: 8px;
  color: #999;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: #6366f1;
  background: #fafaff;
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: #ccc;
}

.upload-hint {
  font-size: 12px;
  color: #bbb;
}
</style>
