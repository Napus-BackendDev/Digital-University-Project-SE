<script setup>
/**
 * ToggleSetting - คอมโพเนนต์สำหรับตั้งค่าแบบ on/off
 * ใช้ซ้ำในหลายที่ใน settings
 */
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  label: { type: String, required: true },       // หัวข้อ setting
  description: { type: String, default: '' },   // คำอธิบาย
  modelValue: { type: Boolean, default: false } // ค่า on/off
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="toggle-setting">
    <div class="toggle-info">
      <span class="toggle-label">{{ label }}</span>
      <span v-if="description" class="toggle-description">{{ description }}</span>
    </div>
    <label class="toggle">
      <input 
        type="checkbox" 
        :checked="modelValue"
        @change="emit('update:modelValue', $event.target.checked)"
      />
      <span class="toggle-slider"></span>
    </label>
  </div>
</template>

<style scoped>
.toggle-setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.toggle-setting:last-child {
  border-bottom: none;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.toggle-description {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #888;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: #6366f1;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
</style>
