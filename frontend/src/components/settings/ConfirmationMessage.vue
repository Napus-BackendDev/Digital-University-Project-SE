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
  </div>
</template>

<script>
/**
 * ConfirmationMessage - ตั้งค่าข้อความหลังส่งฟอร์ม
 * แสดงเมื่อผู้ตอบกด submit สำเร็จ
 */
export default {
  name: 'ConfirmationMessage',
  props: {
    confirmationMessage: { type: String, default: '' }
  },
  emits: ['update:confirmationMessage'],
  methods: {
    emit(event, payload) {
      this.$emit(event, payload)
    }
  }
}
</script>

<style scoped>
.settings-section {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.section-description {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-secondary);
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
  color: var(--text-primary);
}

.textarea-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  resize: vertical;
  min-height: 80px;
}

.textarea-input:focus {
  outline: none;
  border-color: var(--primary);
}
</style>
