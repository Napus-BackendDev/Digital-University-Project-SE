<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  formUrl: { type: String, default: '' }
})

const emit = defineEmits(['copy-link', 'send-email', 'save-settings'])

const copyLink = () => {
  navigator.clipboard.writeText(props.formUrl)
  emit('copy-link')
}

const sendViaEmail = () => {
  window.location.href = `mailto:?subject=Form Invitation&body=Please fill out this form: ${props.formUrl}`
  emit('send-email')
}
</script>

<template>
  <div class="send-form-wrapper">
    <div class="settings-section">
      <h3 class="section-title">Send Form</h3>
      <p class="section-description">Share your form with respondents.</p>
      
      <div class="send-form-actions">
        <button class="btn btn-primary" @click="copyLink">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="5" y="5" width="8" height="9" rx="1"></rect>
            <path d="M11 5V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"></path>
          </svg>
          Copy Link
        </button>
        <button class="btn btn-secondary" @click="sendViaEmail">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="3" width="14" height="10" rx="1"></rect>
            <path d="M1 4l7 5 7-5"></path>
          </svg>
          Send via Email
        </button>
      </div>
    </div>
    
    <div class="settings-footer">
      <button class="btn btn-primary btn-large" @click="emit('save-settings')">
        Save Settings
      </button>
    </div>
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

.send-form-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: #5558e3;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e5e5e5;
}

.btn-secondary:hover {
  background: #eee;
}

.btn-large {
  padding: 12px 24px;
  font-size: 15px;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

@media (max-width: 640px) {
  .send-form-actions {
    flex-direction: column;
  }
  
  .send-form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
