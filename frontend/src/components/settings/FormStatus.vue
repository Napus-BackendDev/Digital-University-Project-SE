<script setup>
/**
 * FormStatus - ตั้งค่าสถานะของฟอร์ม
 * มี 4 สถานะ: Draft, Open, Close, Auto
 */
import { defineProps, defineEmits, computed } from 'vue'


/* ===================================
   Props & Emits
   =================================== */
const props = defineProps({
  status: { type: String, default: 'draft' },
  startDate: { type: String, default: '' },
  startTime: { type: String, default: '' },
  endDate: { type: String, default: '' },
  endTime: { type: String, default: '' }
})

const emit = defineEmits([
  'update:status',
  'update:startDate', 
  'update:startTime', 
  'update:endDate', 
  'update:endTime'
])


/* ===================================
   Computed Properties
   =================================== */

// คำอธิบายสถานะแต่ละแบบ
const statusDescription = computed(() => {
  switch (props.status) {
    case 'draft':
      return 'Form is not published yet'
    case 'open':
      return 'Form is live and accepting responses'
    case 'close':
      return 'Form is no longer accepting responses'
    case 'auto':
      return 'Form will open and close automatically based on schedule'
    default:
      return ''
  }
})

<<<<<<< HEAD
// แสดง schedule fields เฉพาะเมื่อเลือก scheduled
=======
// แสดง schedule fields เฉพาะเมื่อเลือก auto
>>>>>>> 3b61180d03418ad7737977b0a2c7aef444ec3d76
const showScheduleFields = computed(() => props.status === 'auto')
</script>

<template>
  <div class="settings-section">
    <h3 class="section-title">Form Status</h3>
    
    <div class="status-group">
      <label class="input-label">Status</label>
      <div class="select-wrapper">
        <select 
          :value="status"
          @change="emit('update:status', $event.target.value)"
          class="status-select"
        >
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="close">Closed</option>
          <option value="auto">Auto (Scheduled)</option>
        </select>
        <svg class="select-arrow" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      <p class="status-description">{{ statusDescription }}</p>
    </div>

    <!-- Schedule fields only shown when status is "scheduled" -->
    <div v-if="showScheduleFields" class="form-status-grid">
      <div class="datetime-group">
        <label class="input-label">Start Date</label>
        <div class="datetime-input-wrapper">
          <input 
            type="date" 
            :value="startDate" 
            @input="emit('update:startDate', $event.target.value)"
            class="datetime-input" 
          />
          <svg class="input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="4" width="16" height="14" rx="2"></rect>
            <path d="M6 2v4M14 2v4M2 8h16"></path>
          </svg>
        </div>
      </div>
      <div class="datetime-group">
        <label class="input-label">Start Time</label>
        <div class="datetime-input-wrapper">
          <input 
            type="time" 
            :value="startTime" 
            @input="emit('update:startTime', $event.target.value)"
            class="datetime-input" 
          />
          <svg class="input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="10" cy="10" r="8"></circle>
            <path d="M10 5v5l3 3"></path>
          </svg>
        </div>
      </div>
      <div class="datetime-group">
        <label class="input-label">End Date</label>
        <div class="datetime-input-wrapper">
          <input 
            type="date" 
            :value="endDate" 
            @input="emit('update:endDate', $event.target.value)"
            class="datetime-input" 
          />
          <svg class="input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="4" width="16" height="14" rx="2"></rect>
            <path d="M6 2v4M14 2v4M2 8h16"></path>
          </svg>
        </div>
      </div>
      <div class="datetime-group">
        <label class="input-label">End Time</label>
        <div class="datetime-input-wrapper">
          <input 
            type="time" 
            :value="endTime" 
            @input="emit('update:endTime', $event.target.value)"
            class="datetime-input" 
          />
          <svg class="input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="10" cy="10" r="8"></circle>
            <path d="M10 5v5l3 3"></path>
          </svg>
        </div>
      </div>
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
  margin: 0 0 20px;
}

.status-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.status-select {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
  appearance: none;
}

.status-select:focus {
  outline: none;
  border-color: #6366f1;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #666;
  pointer-events: none;
}

.status-description {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #666;
  margin: 0;
}

.form-status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.datetime-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.datetime-input-wrapper {
  position: relative;
}

.datetime-input {
  width: 100%;
  padding: 10px 12px;
  padding-right: 40px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
}

.datetime-input:focus {
  outline: none;
  border-color: #6366f1;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #999;
  pointer-events: none;
}

@media (max-width: 640px) {
  .form-status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
