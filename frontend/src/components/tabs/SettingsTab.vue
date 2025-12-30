<script setup>
/**
 * SettingsTab - Tab ตั้งค่าฟอร์ม
 */
import FormStatus from '@/components/settings/FormStatus.vue'
import AccessControl from '@/components/settings/AccessControl.vue'
import ResponseSettings from '@/components/settings/ResponseSettings.vue'
import ConfirmationMessage from '@/components/settings/ConfirmationMessage.vue'
import SendForm from '@/components/settings/SendForm.vue'

const props = defineProps({
  settings: { type: Object, required: true },
  formUrl: { type: String, default: '' }
})

const emit = defineEmits([
  'update:settings',
  'add-collaborator',
  'remove-collaborator'
])

// Helper to update nested settings
function updateSetting(key, value) {
  emit('update:settings', { ...props.settings, [key]: value })
}
</script>

<template>
  <div class="settings-tab">
    <div class="settings-container">
      <FormStatus
        :status="settings.formStatus"
        :startDate="settings.startDate"
        :startTime="settings.startTime"
        :endDate="settings.endDate"
        :endTime="settings.endTime"
        @update:status="updateSetting('formStatus', $event)"
        @update:startDate="updateSetting('startDate', $event)"
        @update:startTime="updateSetting('startTime', $event)"
        @update:endDate="updateSetting('endDate', $event)"
        @update:endTime="updateSetting('endTime', $event)"
      />

      <AccessControl
        :whoCanRespond="settings.whoCanRespond"
        :collaborators="settings.collaborators"
        @update:whoCanRespond="updateSetting('whoCanRespond', $event)"
        @update:collaborators="updateSetting('collaborators', $event)"
        @add-collaborator="emit('add-collaborator')"
        @remove-collaborator="emit('remove-collaborator', $event)"
      />

      <ResponseSettings
        :collectEmails="settings.collectEmails"
        :limitResponses="settings.limitResponses"
        :showProgressBar="settings.showProgressBar"
        @update:collectEmails="updateSetting('collectEmails', $event)"
        @update:limitResponses="updateSetting('limitResponses', $event)"
        @update:showProgressBar="updateSetting('showProgressBar', $event)"
      />

      <ConfirmationMessage
        :confirmationMessage="settings.confirmationMessage"
        :showAnotherResponseLink="settings.showAnotherResponseLink"
        @update:confirmationMessage="updateSetting('confirmationMessage', $event)"
        @update:showAnotherResponseLink="updateSetting('showAnotherResponseLink', $event)"
      />

      <SendForm :formUrl="formUrl" />
    </div>
  </div>
</template>

<style scoped>
.settings-tab {
  background: transparent;
}

.settings-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
