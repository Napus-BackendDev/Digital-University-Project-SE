<script setup>
/**
 * ImageQuestion - เพิ่มรูปภาพในคำถาม
 * สามารถใส่ URL หรืออัพโหลดรูปจากเครื่อง พร้อม caption
 */
import { ref } from 'vue'

const props = defineProps({
  imageUrl: { type: String, default: '' },
  caption: { type: String, default: '' }
})

const emit = defineEmits(['update:imageUrl', 'update:caption', 'error'])

// Reference สำหรับ hidden file input
const fileInput = ref(null)

// Preview URL เมื่ออัพโหลดจากเครื่อง
const previewUrl = ref('')

// Error state
const errorMessage = ref('')

/**
 * เปิด file picker
 */
function triggerFileUpload() {
  fileInput.value?.click()
}

/**
 * จัดการไฟล์ที่เลือก - สร้าง preview และส่ง data URL
 */
function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // ตรวจสอบว่าเป็นไฟล์รูปภาพ
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please select an image file only'
    emit('error', 'Please select an image file only')
    return
  }
  errorMessage.value = ''

  // สร้าง preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
    emit('update:imageUrl', e.target.result)
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="question-field media-field">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- Preview รูปภาพที่อัพโหลด -->
    <div v-if="previewUrl || imageUrl" class="media-preview">
      <img :src="previewUrl || imageUrl" alt="Preview" class="preview-image" />
      <button class="remove-preview" @click="previewUrl = ''; emit('update:imageUrl', '')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
    </div>

    <div class="media-url-row">
      <input 
        :value="imageUrl"
        @input="emit('update:imageUrl', $event.target.value)"
        type="text" 
        placeholder="Image URL หรือคลิกอัพโหลด" 
        class="media-url-input" 
      />
      <button class="btn btn-secondary" @click="triggerFileUpload">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Upload
      </button>
    </div>
    <input 
      :value="caption"
      @input="emit('update:caption', $event.target.value)"
      type="text" 
      placeholder="Caption (optional)" 
      class="caption-input" 
    />
  </div>
</template>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-field {
  gap: 16px;
}

.media-url-row {
  display: flex;
  gap: 8px;
}

.media-url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.media-url-input:focus {
  outline: none;
  border-color: #6366f1;
}

.caption-input {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.caption-input:focus {
  outline: none;
  border-color: #6366f1;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e5e5e5;
}

.btn-secondary:hover {
  background: #eee;
}

/* Preview styles */
.media-preview {
  position: relative;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.remove-preview {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-preview:hover {
  background: rgba(0, 0, 0, 0.8);
}

.remove-preview svg {
  width: 14px;
  height: 14px;
  color: white;
}
</style>
