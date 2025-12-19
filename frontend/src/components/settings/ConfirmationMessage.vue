<script setup>
import { defineProps, defineEmits } from 'vue'
import ToggleSetting from './ToggleSetting.vue'

const props = defineProps({
  confirmationMessage: { type: String, default: '' },
  showAnotherResponseLink: { type: Boolean, default: true }
})

const emit = defineEmits(['update:confirmationMessage', 'update:showAnotherResponseLink'])
</script>

<template>
  <div class="settings-section">
    <h3 class="section-title">Confirmation Message</h3>
    <p class="section-description">Customize the message shown after form submission.</p>
    
    <div class="setting-row">
      <label class="input-label">Message</label>
      <textarea 
        :value="confirmationMessage"
        @input="emit('update:confirmationMessage', $event.target.value)"
        class="textarea-input"
        rows="3"
        placeholder="Enter confirmation message"
      ></textarea>
    </div>
    
    <ToggleSetting
      label='Show "Submit another response" link'
      description="Allow respondents to submit multiple responses"
      :modelValue="showAnotherResponseLink"
      @update:modelValue="emit('update:showAnotherResponseLink', $event)"
    />
  </div>
</template>

<style scoped>
.settings-section {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.section-description {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 20px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.textarea-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  resize: vertical;
  min-height: 80px;
}

.textarea-input:focus {
  outline: none;
  border-color: #6366f1;
}
</style>
