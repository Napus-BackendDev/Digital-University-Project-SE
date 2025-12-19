<script setup>
/**
 * NotificationSettings - ตั้งค่าการแจ้งเตือน
 * ส่งอีเมลเมื่อมีคนตอบฟอร์มใหม่
 */
import { defineProps, defineEmits } from 'vue'
import ToggleSetting from './ToggleSetting.vue'

const props = defineProps({
  emailNotifications: { type: Boolean, default: true },
  notificationEmail: { type: String, default: '' }
})

const emit = defineEmits(['update:emailNotifications', 'update:notificationEmail'])
</script>

<template>
  <div class="settings-section">
    <h3 class="section-title">Notifications</h3>
    <p class="section-description">Get notified when new responses are submitted.</p>
    
    <ToggleSetting
      label="Email notifications"
      description="Receive an email for each new response"
      :modelValue="emailNotifications"
      @update:modelValue="emit('update:emailNotifications', $event)"
    />
    
    <div v-if="emailNotifications" class="setting-row">
      <label class="input-label">Notification email</label>
      <input 
        type="email" 
        :value="notificationEmail"
        @input="emit('update:notificationEmail', $event.target.value)"
        placeholder="Enter email address"
        class="text-input"
      />
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

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
}

.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.text-input:focus {
  outline: none;
  border-color: #6366f1;
}
</style>
