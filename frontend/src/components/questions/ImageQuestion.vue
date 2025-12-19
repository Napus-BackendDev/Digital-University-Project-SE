<script setup>
defineProps({
  imageUrl: { type: String, default: '' },
  caption: { type: String, default: '' }
})

const emit = defineEmits(['update:imageUrl', 'update:caption'])
</script>

<template>
  <div class="question-field media-field">
    <div class="media-url-row">
      <input 
        :value="imageUrl"
        @input="emit('update:imageUrl', $event.target.value)"
        type="text" 
        placeholder="Image URL" 
        class="media-url-input" 
      />
      <button class="btn btn-secondary">Upload</button>
    </div>
    <input 
      :value="caption"
      @input="emit('update:caption', $event.target.value)"
      type="text" 
      placeholder="Caption (optional)" 
      class="caption-input" 
    />
  </div>
</template>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-field {
  gap: 16px;
}

.media-url-row {
  display: flex;
  gap: 8px;
}

.media-url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.media-url-input:focus {
  outline: none;
  border-color: #6366f1;
}

.caption-input {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.caption-input:focus {
  outline: none;
  border-color: #6366f1;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e5e5e5;
}

.btn-secondary:hover {
  background: #eee;
}
</style>
