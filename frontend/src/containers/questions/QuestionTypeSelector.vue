<script setup>
/**
 * QuestionTypeSelector - Sidebar เลือกประเภทคำถาม
 * แบ่งเป็น 2 หมวด: Question Types และ Content Elements
 */

// รายการประเภทคำถาม
const questionTypes = [
  { id: 'short-answer', name: 'Short Answer', icon: 'short-text' },
  { id: 'paragraph', name: 'Paragraph', icon: 'paragraph' },
  { id: 'multiple-choice', name: 'Multiple Choice', icon: 'radio' },
  { id: 'checkbox', name: 'Checkbox', icon: 'checkbox' },
  { id: 'rating', name: 'Rating', icon: 'star' },
  { id: 'file-upload', name: 'File Upload', icon: 'upload' }
]

// รายการ Content Elements (ไม่ใช่คำถาม)
const contentElements = [
  { id: 'title-description', name: 'Title & Description', icon: 'title' },
  { id: 'image', name: 'Image', icon: 'image' },
  { id: 'section-divider', name: 'Section Divider', icon: 'divider' }
]

const emit = defineEmits(['add-question'])

// เพิ่มคำถามใหม่ตามประเภทที่เลือก
function addQuestion(type) {
  emit('add-question', type)
}
</script>

<template>
  <div class="question-type-selector">
    <!-- Question Types Section -->
    <h4 class="selector-title">Question Types</h4>
    <div class="question-types-list">
      <button
        v-for="type in questionTypes"
        :key="type.id"
        class="question-type-btn"
        @click="addQuestion(type)"
      >
        <span class="type-icon">
          <!-- Short Text Icon -->
          <svg v-if="type.icon === 'short-text'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="3" y1="10" x2="17" y2="10"></line>
            <line x1="3" y1="6" x2="12" y2="6"></line>
          </svg>
          <!-- Paragraph Icon -->
          <svg v-else-if="type.icon === 'paragraph'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="3" y1="5" x2="17" y2="5"></line>
            <line x1="3" y1="10" x2="17" y2="10"></line>
            <line x1="3" y1="15" x2="12" y2="15"></line>
          </svg>
          <!-- Radio Icon -->
          <svg v-else-if="type.icon === 'radio'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="10" cy="10" r="7"></circle>
            <circle cx="10" cy="10" r="3" fill="currentColor"></circle>
          </svg>
          <!-- Checkbox Icon -->
          <svg v-else-if="type.icon === 'checkbox'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="14" height="14" rx="2"></rect>
            <path d="M6 10l3 3 5-6"></path>
          </svg>
          <!-- Dropdown Icon -->
          <svg v-else-if="type.icon === 'dropdown'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="14" height="12" rx="2"></rect>
            <path d="M7 10l3 3 3-3"></path>
          </svg>
          <!-- Star Icon -->
          <svg v-else-if="type.icon === 'star'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="10,2 12.5,7.5 18,8 14,12 15,17.5 10,15 5,17.5 6,12 2,8 7.5,7.5"></polygon>
          </svg>
          <!-- Upload Icon -->
          <svg v-else-if="type.icon === 'upload'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 14v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"></path>
            <polyline points="10 3 10 14"></polyline>
            <polyline points="6 7 10 3 14 7"></polyline>
          </svg>
          <!-- Title Icon -->
          <svg v-else-if="type.icon === 'title'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <text x="3" y="14" font-size="12" font-weight="bold" fill="currentColor">T</text>
            <line x1="10" y1="8" x2="17" y2="8"></line>
            <line x1="10" y1="12" x2="17" y2="12"></line>
          </svg>
          <!-- Image Icon -->
          <svg v-else-if="type.icon === 'image'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="16" height="14" rx="2"></rect>
            <circle cx="7" cy="8" r="2"></circle>
            <path d="M18 14l-4-4-6 6"></path>
          </svg>
          <!-- Video Icon -->
          <svg v-else-if="type.icon === 'video'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="4" width="12" height="12" rx="2"></rect>
            <path d="M14 8l4-2v8l-4-2"></path>
          </svg>
          <!-- Divider Icon -->
          <svg v-else-if="type.icon === 'divider'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="2" y1="10" x2="8" y2="10"></line>
            <line x1="12" y1="10" x2="18" y2="10"></line>
            <rect x="8" y="7" width="4" height="6" rx="1" fill="currentColor" opacity="0.3"></rect>
          </svg>
        </span>
        <span class="type-name">{{ type.name }}</span>
      </button>
    </div>

    <!-- Divider -->
    <div class="section-divider"></div>

    <!-- Content Elements Section -->
    <h4 class="selector-title">Content Elements</h4>
    <div class="question-types-list">
      <button
        v-for="element in contentElements"
        :key="element.id"
        class="question-type-btn"
        @click="addQuestion(element)"
      >
        <span class="type-icon">
          <!-- Title Icon -->
          <svg v-if="element.icon === 'title'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <text x="3" y="14" font-size="12" font-weight="bold" fill="currentColor">T</text>
            <line x1="10" y1="8" x2="17" y2="8"></line>
            <line x1="10" y1="12" x2="17" y2="12"></line>
          </svg>
          <!-- Image Icon -->
          <svg v-else-if="element.icon === 'image'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="16" height="14" rx="2"></rect>
            <circle cx="7" cy="8" r="2"></circle>
            <path d="M18 14l-4-4-6 6"></path>
          </svg>
          <!-- Video Icon -->
          <svg v-else-if="element.icon === 'video'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="4" width="12" height="12" rx="2"></rect>
            <path d="M14 8l4-2v8l-4-2"></path>
          </svg>
          <!-- Divider Icon -->
          <svg v-else-if="element.icon === 'divider'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="2" y1="10" x2="8" y2="10"></line>
            <line x1="12" y1="10" x2="18" y2="10"></line>
            <rect x="8" y="7" width="4" height="6" rx="1" fill="currentColor" opacity="0.3"></rect>
          </svg>
        </span>
        <span class="type-name">{{ element.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.question-type-selector {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 17px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
}

.section-divider {
  height: 1px;
  background: var(--border-color);
  margin: 16px 0;
}

.selector-title {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 28px;
  color: var(--text-primary);
  margin: 0 0 16px 12px;
  letter-spacing: -0.45px;
}

.question-types-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-type-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.question-type-btn:hover {
  background-color: #f5f5f5;
}

.type-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.type-icon svg {
  width: 100%;
  height: 100%;
}

.type-name {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
  letter-spacing: -0.15px;
}

/* Tablet & Mobile: Horizontal toolbar fixed at bottom */
@media (max-width: 1024px) {
  .question-type-selector {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    border-radius: 16px 16px 0 0;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  }

  .section-divider {
    display: none;
  }

  .selector-title {
    display: none;
  }

  .question-types-list {
    display: flex;
    flex-direction: row;
    gap: 4px;
    flex-shrink: 0;
  }

  .question-type-btn {
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    min-width: 50px;
    border-radius: 12px;
    background: var(--bg-gray-light);
  }

  .question-type-btn:hover,
  .question-type-btn:active {
    background-color: #e8e8e8;
  }

  .type-icon {
    width: 24px;
    height: 24px;
    color: #555;
  }

  .type-name {
    display: none;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .question-type-selector {
    padding: 10px 12px;
    gap: 6px;
  }

  .question-type-btn {
    padding: 10px;
    min-width: 44px;
  }

  .type-icon {
    width: 22px;
    height: 22px;
  }
}
</style>
