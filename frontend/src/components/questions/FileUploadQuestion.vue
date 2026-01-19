<script setup>
/**
 * FileUploadQuestion - คำถามแบบอัพโหลดไฟล์
 * รองรับ click to upload
 * มีตัวเลือกจำกัดประเภทไฟล์, จำนวนไฟล์, และขนาดไฟล์
 */
import { ref, computed } from 'vue'

const props = defineProps({
  allowSpecificTypes: { type: Boolean, default: false },
  allowedFileTypes: { type: Array, default: () => [] },
  maxFiles: { type: Number, default: 1 },
  maxSize: { type: Number, default: 10 }
})

const emit = defineEmits([
  'update:allowSpecificTypes',
  'update:allowedFileTypes',
  'update:maxFiles',
  'update:maxSize',
  'file-selected'
])

// File type options
const fileTypeOptions = [
  { id: 'document', label: 'Document' },
  { id: 'spreadsheet', label: 'Spreadsheet' },
  { id: 'pdf', label: 'PDF' },
  { id: 'video', label: 'Video' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'drawing', label: 'Drawing' },
  { id: 'image', label: 'Image' },
  { id: 'audio', label: 'Audio' }
]

// Max files options
const maxFilesOptions = [1, 5, 10]

// Max size options (in MB)
const maxSizeOptions = [1, 10, 100, 1024]

// Toggle file type
function toggleFileType(typeId) {
  const currentTypes = [...props.allowedFileTypes]
  const index = currentTypes.indexOf(typeId)
  if (index > -1) {
    currentTypes.splice(index, 1)
  } else {
    currentTypes.push(typeId)
  }
  emit('update:allowedFileTypes', currentTypes)
}

// Check if file type is selected
function isTypeSelected(typeId) {
  return props.allowedFileTypes.includes(typeId)
}

// Format file size for display
function formatSize(mb) {
  if (mb >= 1024) {
    return `${mb / 1024} GB`
  }
  return `${mb} MB`
}
</script>

<template>
  <div class="file-upload-question">
    <!-- Google Form Style Upload Preview -->
    <div class="gf-upload-preview">
      <p class="gf-upload-info">Upload {{ maxFiles }} supported file{{ maxFiles > 1 ? 's' : '' }}. Max {{ formatSize(maxSize) }}.</p>
      <button type="button" class="gf-add-file-btn">
        <svg class="gf-upload-icon" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2"/>
          <polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2"/>
        </svg>
        Add file
      </button>
    </div>

    <!-- Settings Section -->
    <div class="upload-settings">
      <!-- Allow specific file types toggle -->
      <div class="setting-row">
        <span class="setting-label">Allow only specific file types</span>
        <label class="toggle">
          <input 
            type="checkbox" 
            :checked="allowSpecificTypes"
            @change="emit('update:allowSpecificTypes', $event.target.checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- File type checkboxes (show when toggle is on) -->
      <div v-if="allowSpecificTypes" class="file-types-grid">
        <label 
          v-for="type in fileTypeOptions" 
          :key="type.id"
          class="file-type-checkbox"
        >
          <input 
            type="checkbox"
            :checked="isTypeSelected(type.id)"
            @change="toggleFileType(type.id)"
          />
          <span class="checkbox-box"></span>
          <span class="checkbox-label">{{ type.label }}</span>
        </label>
      </div>

      <!-- Max number of files -->
      <div class="setting-row">
        <span class="setting-label">Maximum number of files</span>
        <select 
          class="setting-select"
          :value="maxFiles"
          @change="emit('update:maxFiles', Number($event.target.value))"
        >
          <option v-for="num in maxFilesOptions" :key="num" :value="num">{{ num }}</option>
        </select>
      </div>

      <!-- Max file size -->
      <div class="setting-row">
        <span class="setting-label">Maximum file size</span>
        <select 
          class="setting-select"
          :value="maxSize"
          @change="emit('update:maxSize', Number($event.target.value))"
        >
          <option v-for="size in maxSizeOptions" :key="size" :value="size">{{ formatSize(size) }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-upload-question {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Google Form Style */
.gf-upload-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.gf-upload-info {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #5f6368;
}

.gf-add-file-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1a73e8;
  cursor: pointer;
  transition: all 0.2s;
}

.gf-add-file-btn:hover {
  background: #f8f9fa;
  border-color: #1a73e8;
}

.gf-upload-icon {
  width: 18px;
  height: 18px;
}

/* Settings */
.upload-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-gray);
  border-radius: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
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
  background-color: var(--border-color);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle input:checked + .toggle-slider {
  background-color: var(--primary);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* File Types Grid */
.file-types-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
  padding: 12px 0;
}

.file-type-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.file-type-checkbox input {
  display: none;
}

.checkbox-box {
  width: 18px;
  height: 18px;
  border: 2px solid #d4d4d4;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-type-checkbox input:checked + .checkbox-box {
  background: var(--primary);
  border-color: var(--primary);
}

.file-type-checkbox input:checked + .checkbox-box::after {
  content: '';
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.checkbox-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
}

/* Select Dropdown */
.setting-select {
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: #fff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 100px;
}

.setting-select:focus {
  outline: none;
  border-color: var(--primary);
}
</style>
