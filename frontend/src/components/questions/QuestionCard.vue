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

<script>
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

export default {
  name: 'QuestionCard',
  components: {
    TrashIcon,
    EditIcon,
    ShortAnswerQuestion,
    ParagraphQuestion,
    MultipleChoiceQuestion,
    CheckboxQuestion,
    DropdownQuestion,
    RatingQuestion,
    DateQuestion,
    TimeQuestion,
    FileUploadQuestion,
    ImageQuestion,
    VideoQuestion
  },
  props: {
    question: { type: Object, required: true },
    showFooter: { type: Boolean, default: false },
    isExpanded: { type: Boolean, default: false }
  },
  emits: [
    'update:question',
    'delete',
    'add-option',
    'remove-option',
    'toggle'
  ],
  data() {
    return {
      questionTypeLabels: {
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
    }
  },
  methods: {
    getQuestionTypeLabel(type) {
      return this.questionTypeLabels[type] || type
    },
    updateTitle(title) {
      this.$emit('update:question', { ...this.question, title })
    },
    updateType(type) {
      const updated = { ...this.question, type }
      
      if (['multiple-choice', 'checkbox', 'dropdown'].includes(type) && !updated.options) {
        updated.options = [{ id: 1, text: 'Option 1' }]
      }
      
      if (type === 'rating' && !updated.maxRating) {
        updated.maxRating = 5
      }
      
      this.$emit('update:question', updated)
    },
    updateRequired(required) {
      this.$emit('update:question', { ...this.question, required })
    },
    updateOptions(options) {
      this.$emit('update:question', { ...this.question, options })
    },
    updateMaxRating(maxRating) {
      this.$emit('update:question', { ...this.question, maxRating })
    },
    updateAllowSpecificTypes(allowSpecificTypes) {
      this.$emit('update:question', { ...this.question, allowSpecificTypes })
    },
    updateAllowedFileTypes(allowedFileTypes) {
      this.$emit('update:question', { ...this.question, allowedFileTypes })
    },
    updateMaxFiles(maxFiles) {
      this.$emit('update:question', { ...this.question, maxFiles })
    },
    updateMaxSize(maxSize) {
      this.$emit('update:question', { ...this.question, maxSize })
    },
    updateImageUrl(imageUrl) {
      this.$emit('update:question', { ...this.question, imageUrl })
    },
    updateVideoUrl(videoUrl) {
      this.$emit('update:question', { ...this.question, videoUrl })
    },
    updateCaption(caption) {
      this.$emit('update:question', { ...this.question, caption })
    },
    emit(event, ...args) {
      this.$emit(event, ...args)
    }
  }
}
</script>

<style scoped>
.question-card {
  background: #fff;
  border: 1px solid var(--border-color);
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
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
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
  color: var(--text-muted);
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
  color: var(--text-primary);
  background: transparent;
}

.question-title-input:focus {
  outline: none;
  border-bottom-color: var(--primary);
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
  color: var(--text-muted);
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
  color: var(--text-muted);
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
  border-top: 1px solid var(--border-color);
  background: var(--bg-gray);
}

.footer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-secondary);
}

.type-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
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
  background-color: var(--primary);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
</style>
