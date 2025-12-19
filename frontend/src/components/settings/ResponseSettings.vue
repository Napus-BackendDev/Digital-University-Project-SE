<script setup>
import { defineProps, defineEmits } from 'vue'
import ToggleSetting from './ToggleSetting.vue'

const props = defineProps({
  collectEmails: { type: Boolean, default: false },
  limitResponses: { type: Boolean, default: false },
  allowEditing: { type: Boolean, default: false },
  showProgressBar: { type: Boolean, default: true },
  shuffleQuestions: { type: Boolean, default: false },
  exportFormat: { type: String, default: 'xlsx' },
  exportUrl: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:collectEmails',
  'update:limitResponses', 
  'update:allowEditing',
  'update:showProgressBar',
  'update:shuffleQuestions',
  'update:exportFormat',
  'update:exportUrl',
  'export'
])

const handleExport = () => {
  emit('export', props.exportFormat)
}
</script>

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
      label="Allow response editing"
      description="Respondents can edit their responses after submission"
      :modelValue="allowEditing"
      @update:modelValue="emit('update:allowEditing', $event)"
    />
    
    <ToggleSetting
      label="Show progress bar"
      description="Display form completion progress to respondents"
      :modelValue="showProgressBar"
      @update:modelValue="emit('update:showProgressBar', $event)"
    />
    
    <ToggleSetting
      label="Shuffle question order"
      description="Randomize question order for each respondent"
      :modelValue="shuffleQuestions"
      @update:modelValue="emit('update:shuffleQuestions', $event)"
    />
    
    <div class="setting-row inline">
      <label class="input-label">Export format</label>
      <select 
        :value="exportFormat"
        @change="emit('update:exportFormat', $event.target.value)"
        class="select-input small"
      >
        <option value="xlsx">Excel (.xlsx)</option>
        <option value="csv">CSV (.csv)</option>
        <option value="json">JSON (.json)</option>
        <option value="pdf">PDF</option>
      </select>
      <button class="export-btn" @click="handleExport">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v9M5 8l3 3 3-3" />
        </svg>
        Export
      </button>
    </div>
    
    <ToggleSetting
      label="Export URL"
      description="Include a shareable export URL in responses"
      :modelValue="exportUrl"
      @update:modelValue="emit('update:exportUrl', $event)"
    />
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
  margin-bottom: 16px;
}

.setting-row.inline {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.select-input {
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.select-input.small {
  width: auto;
  min-width: 140px;
}

.select-input:focus {
  outline: none;
  border-color: #6366f1;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.export-btn:hover {
  background: #4f46e5;
}

.export-btn svg {
  width: 16px;
  height: 16px;
}
</style>
