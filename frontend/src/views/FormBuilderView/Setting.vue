<template>
  <div class="setting">
    <SettingsTab
      :settings="settings"
      :formUrl="formUrl"
      @update:settings="$emit('update:settings', $event)"
      @add-collaborator="$emit('add-collaborator')"
      @remove-collaborator="$emit('remove-collaborator', $event)"
    />
  </div>
</template>

<script>
/**
 * Setting - Component สำหรับตั้งค่าฟอร์ม
 * แยกออกมาจาก FormBuilderView เพื่อให้ maintain ง่ายขึ้น
 */
import SettingsTab from '@/components/tabs/SettingsTab.vue'

export default {
  name: 'Setting',

  components: {
    SettingsTab
  },

  props: {
    settings: {
      type: Object,
      required: true
    },
    formUrl: {
      type: String,
      default: ''
    }
  },

  emits: ['update:settings', 'add-collaborator', 'remove-collaborator']
}
</script>

<style scoped>
.setting {
  width: 100%;
}
</style>
