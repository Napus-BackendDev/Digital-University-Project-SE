<template>
  <div class="settings-section">
    <h3 class="section-title">Response Settings</h3>
    <p class="section-description">Configure how responses are collected and managed.</p>
    
    <ToggleSetting
      label="Collect email addresses"
      description="Require respondents to sign in with their email"
      :modelValue="collectEmails"
      @update:modelValue="emit('update:collectEmails', $event)"
    />
    
    <ToggleSetting
      label="Limit to one response"
      description="Each respondent can only submit once"
      :modelValue="limitResponses"
      @update:modelValue="emit('update:limitResponses', $event)"
    />
    
    <ToggleSetting
      label="Show progress bar"
      description="Display form completion progress to respondents"
      :modelValue="showProgressBar"
      @update:modelValue="emit('update:showProgressBar', $event)"
    />
  </div>
</template>

<script>
/**
 * ResponseSettings - ตั้งค่าการรับ response
 */
import ToggleSetting from './ToggleSetting.vue'

export default {
  name: 'ResponseSettings',
  components: {
    ToggleSetting
  },
  props: {
    collectEmails: { type: Boolean, default: false },
    limitResponses: { type: Boolean, default: false },
    showProgressBar: { type: Boolean, default: true }
  },
  emits: [
    'update:collectEmails',
    'update:limitResponses', 
    'update:showProgressBar'
  ],
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
</style>
