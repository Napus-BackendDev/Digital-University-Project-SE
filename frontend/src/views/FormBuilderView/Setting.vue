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
/**
 * Setting - Component สำหรับตั้งค่าฟอร์ม
 * ใช้ Pinia Store (setting) จัดการ state
 */
import { useFormBuilderStore } from '@/stores/formBuilder'
import { useSettingStore } from '@/stores/setting'
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
