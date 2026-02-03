<template>
  <div class="setting">
    <SettingsTab
      :settings="settingStore.settings"
      :formUrl="formStore.formUrl"
      @update:settings="handleUpdateSettings"
      @add-collaborator="settingStore.addCollaborator"
      @remove-collaborator="settingStore.removeCollaborator"
    />
  </div>
</template>

<script setup>

import SettingsTab from '@/components/tabs/SettingsTab.vue'

const formStore = useFormBuilderStore()
const settingStore = useSettingStore()

// Update settings and mark form as dirty
function handleUpdateSettings(newSettings) {
  settingStore.updateSettings(newSettings)
  formStore.markDirty()
}
</script>

<style scoped>
.setting {
  width: 100%;
}
</style>
