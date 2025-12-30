<script setup>
/**
 * QuestionCard - แสดงคำถามแต่ละข้อในฟอร์ม
 * สามารถแก้ไขหัวข้อ, เปลี่ยนประเภท, ลบคำถามได้
 */

// Import icon components
import { TrashIcon, EditIcon } from '@/components/icons'

// Import question type components
import ShortAnswerQuestion from './ShortAnswerQuestion.vue'
import ParagraphQuestion from './ParagraphQuestion.vue'
import MultipleChoiceQuestion from './MultipleChoiceQuestion.vue'
import CheckboxQuestion from './CheckboxQuestion.vue'
import DropdownQuestion from './DropdownQuestion.vue'
import RatingQuestion from './RatingQuestion.vue'
import DateQuestion from './DateQuestion.vue'
import TimeQuestion from './TimeQuestion.vue'
import FileUploadQuestion from './FileUploadQuestion.vue'
import ImageQuestion from './ImageQuestion.vue'
import VideoQuestion from './VideoQuestion.vue'


/* ===================================
   Props & Emits
   =================================== */
const props = defineProps({
  question: { type: Object, required: true },
  showFooter: { type: Boolean, default: false },
  isExpanded: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:question',
  'delete',
  'add-option',
  'remove-option',
  'toggle'
])


/* ===================================
   Question Type Labels - ชื่อประเภทคำถาม
   =================================== */
const questionTypeLabels = {
  'short-answer': 'Short Answer',
  'paragraph': 'Paragraph',
  'multiple-choice': 'Multiple Choice',
  'checkbox': 'Checkbox',
  'dropdown': 'Dropdown',
  'rating': 'Rating',
  'file-upload': 'File Upload',
  'date': 'Date',
  'time': 'Time',
  'image': 'Image',
  'video': 'Video'
}

function getQuestionTypeLabel(type) {
  return questionTypeLabels[type] || type
}


/* ===================================
   Update Functions - ฟังก์ชันอัพเดทข้อมูล
   =================================== */

// อัพเดทหัวข้อคำถาม
function updateTitle(title) {
  emit('update:question', { ...props.question, title })
}

// เปลี่ยนประเภทคำถาม
function updateType(type) {
  const updated = { ...props.question, type }
  
  // เพิ่ม options ถ้าเปลี่ยนเป็นแบบเลือก
  if (['multiple-choice', 'checkbox', 'dropdown'].includes(type) && !updated.options) {
    updated.options = [{ id: 1, text: 'Option 1' }]
  }
  
  // เพิ่ม maxRating ถ้าเปลี่ยนเป็น rating
  if (type === 'rating' && !updated.maxRating) {
    updated.maxRating = 5
  }
  
  emit('update:question', updated)
}

// อัพเดทว่าจำเป็นต้องตอบหรือไม่
function updateRequired(required) {
  emit('update:question', { ...props.question, required })
}

// อัพเดทตัวเลือก
function updateOptions(options) {
  emit('update:question', { ...props.question, options })
}

// อัพเดท max rating
function updateMaxRating(maxRating) {
  emit('update:question', { ...props.question, maxRating })
}

// อัพเดท file upload settings
function updateAllowSpecificTypes(allowSpecificTypes) {
  emit('update:question', { ...props.question, allowSpecificTypes })
}

function updateAllowedFileTypes(allowedFileTypes) {
  emit('update:question', { ...props.question, allowedFileTypes })
}

function updateMaxFiles(maxFiles) {
  emit('update:question', { ...props.question, maxFiles })
}

function updateMaxSize(maxSize) {
  emit('update:question', { ...props.question, maxSize })
}

// อัพเดท URL รูปภาพ
function updateImageUrl(imageUrl) {
  emit('update:question', { ...props.question, imageUrl })
}

// อัพเดท URL วิดีโอ
function updateVideoUrl(videoUrl) {
  emit('update:question', { ...props.question, videoUrl })
}

// อัพเดท caption
function updateCaption(caption) {
  emit('update:question', { ...props.question, caption })
}
</script>

<template>
  <div :class="['question-card', { expanded: isExpanded }]">
    <div class="question-content" @click="emit('toggle')">
      <!-- Drag Handle -->
      <button class="drag-handle" @click.stop>
        <svg viewBox="0 0 20 20" fill="currentColor">
          <circle cx="7" cy="5" r="1.5"></circle>
          <circle cx="13" cy="5" r="1.5"></circle>
          <circle cx="7" cy="10" r="1.5"></circle>
          <circle cx="13" cy="10" r="1.5"></circle>
          <circle cx="7" cy="15" r="1.5"></circle>
          <circle cx="13" cy="15" r="1.5"></circle>
        </svg>
      </button>

      <!-- Question Body -->
      <div class="question-body" @click.stop>
        <!-- Question Title -->
        <div class="title-input-wrapper">
          <input
            :value="question.title"
            @input="updateTitle($event.target.value)"
            type="text"
            class="question-title-input"
            :placeholder="getQuestionTypeLabel(question.type) + ' question'"
          />
          <EditIcon class="edit-hint-icon" />
        </div>

        <!-- Dynamic Question Type Component -->
        <ShortAnswerQuestion 
          v-if="question.type === 'short-answer'"
          :placeholder="question.placeholder"
        />

        <ParagraphQuestion 
          v-else-if="question.type === 'paragraph'"
          :placeholder="question.placeholder"
        />

        <MultipleChoiceQuestion 
          v-else-if="question.type === 'multiple-choice'"
          :options="question.options"
          @update:options="updateOptions"
          @add-option="emit('add-option', question)"
          @remove-option="(optionId) => emit('remove-option', question, optionId)"
        />

        <CheckboxQuestion 
          v-else-if="question.type === 'checkbox'"
          :options="question.options"
          @update:options="updateOptions"
          @add-option="emit('add-option', question)"
          @remove-option="(optionId) => emit('remove-option', question, optionId)"
        />

        <DropdownQuestion 
          v-else-if="question.type === 'dropdown'"
          :options="question.options"
          @update:options="updateOptions"
          @add-option="emit('add-option', question)"
          @remove-option="(optionId) => emit('remove-option', question, optionId)"
        />

        <RatingQuestion 
          v-else-if="question.type === 'rating'"
          :maxRating="question.maxRating"
          @update:maxRating="updateMaxRating"
        />

        <DateQuestion 
          v-else-if="question.type === 'date'"
        />

        <TimeQuestion 
          v-else-if="question.type === 'time'"
        />

        <FileUploadQuestion 
          v-else-if="question.type === 'file-upload'"
          :allowSpecificTypes="question.allowSpecificTypes || false"
          :allowedFileTypes="question.allowedFileTypes || []"
          :maxFiles="question.maxFiles || 1"
          :maxSize="question.maxSize || 10"
          @update:allowSpecificTypes="updateAllowSpecificTypes"
          @update:allowedFileTypes="updateAllowedFileTypes"
          @update:maxFiles="updateMaxFiles"
          @update:maxSize="updateMaxSize"
        />

        <ImageQuestion 
          v-else-if="question.type === 'image'"
          :imageUrl="question.imageUrl"
          :caption="question.caption"
          @update:imageUrl="updateImageUrl"
          @update:caption="updateCaption"
        />

        <VideoQuestion 
          v-else-if="question.type === 'video'"
          :videoUrl="question.videoUrl"
          :caption="question.caption"
          @update:videoUrl="updateVideoUrl"
          @update:caption="updateCaption"
        />
      </div>

      <!-- Delete Button -->
      <button class="delete-question-btn" @click.stop="emit('delete', question.id)">
        <TrashIcon />
      </button>
    </div>

    <!-- Question Footer - Only show when expanded -->
    <div v-if="isExpanded" class="question-footer" @click.stop>
      <div class="footer-row">
        <label class="field-label">Question Type</label>
        <select class="type-select" :value="question.type" @change="updateType($event.target.value)">
          <option value="short-answer">Short Answer</option>
          <option value="paragraph">Paragraph</option>
          <option value="multiple-choice">Multiple Choice</option>
          <option value="checkbox">Checkbox</option>
          <option value="dropdown">Dropdown</option>
          <option value="rating">Rating</option>
          <option value="file-upload">File Upload</option>
        </select>
      </div>
      <div class="footer-row">
        <label class="field-label">Required</label>
        <label class="toggle">
          <input 
            type="checkbox" 
            :checked="question.required"
            @change="updateRequired($event.target.checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.question-card:hover {
  border-color: #d0d0d0;
}

.question-card.expanded {
  cursor: default;
  border-color: #6366f1;
  box-shadow: 0 0 0 1px #6366f1;
}

.question-content {
  display: flex;
  padding: 25px;
  gap: 16px;
}

.drag-handle {
  width: 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: grab;
  color: #ccc;
  padding: 0;
  flex-shrink: 0;
}

.drag-handle:hover {
  color: #999;
}

.drag-handle svg {
  width: 20px;
  height: 20px;
}

.question-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.question-title-input {
  width: 100%;
  padding: 8px 28px 8px 0;
  border: none;
  border-bottom: 1px solid transparent;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background: transparent;
}

.question-title-input:focus {
  outline: none;
  border-bottom-color: #6366f1;
}

.question-title-input:focus + .edit-hint-icon {
  opacity: 0;
}

.edit-hint-icon {
  position: absolute;
  right: 0;
  width: 16px;
  height: 16px;
  color: #ccc;
  pointer-events: none;
  transition: opacity 0.2s;
}

.title-input-wrapper:hover .edit-hint-icon {
  color: #999;
}

.delete-question-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
  flex-shrink: 0;
}

.delete-question-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.delete-question-btn svg {
  width: 16px;
  height: 16px;
}

/* Question Footer */
.question-footer {
  display: flex;
  justify-content: space-between;
  padding: 17px 25px;
  border-top: 1px solid #e5e5e5;
  background: #fafafa;
}

.footer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
}

.type-select {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
}

/* Toggle */
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
