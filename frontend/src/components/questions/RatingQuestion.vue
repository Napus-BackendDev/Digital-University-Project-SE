<script setup>
defineProps({
  maxRating: { type: Number, default: 5 }
})

const emit = defineEmits(['update:maxRating'])
</script>

<template>
  <div class="question-field rating-field">
    <label class="field-label">Max rating:</label>
    <input 
      :value="maxRating"
      @input="emit('update:maxRating', Number($event.target.value))"
      type="number" 
      min="1" 
      max="10" 
      class="rating-input" 
    />
  </div>
</template>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-field {
  flex-direction: row;
  align-items: center;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
}

.rating-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.rating-input:focus {
  outline: none;
  border-color: #6366f1;
}
</style>
