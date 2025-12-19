<template>
  <div class="response-summary-card">
    <div class="card-header">
      <h3 class="question-title">{{ questionNumber }}. {{ title }}</h3>
      <p class="response-count">{{ responseCount }} responses</p>
    </div>
    
    <div class="card-content">
      <slot></slot>
    </div>
    
    <div v-if="showPagination" class="card-footer">
      <Pagination 
        :currentPage="currentPage" 
        :totalPages="totalPages"
        @page-change="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * ResponseSummaryCard - การ์ดสรุปคำตอบของแต่ละคำถาม
 * รองรับ chart, table, หรือ content อื่นๆ ผ่าน slot
 */
import Pagination from './Pagination.vue'

defineProps({
  questionNumber: { type: Number, required: true },  // ลำดับคำถาม
  title: { type: String, required: true },           // หัวข้อคำถาม
  responseCount: { type: Number, default: 0 },       // จำนวนคำตอบ
  showPagination: { type: Boolean, default: false }, // แสดง pagination หรือไม่
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 }
})

defineEmits(['page-change'])
</script>

<style scoped>
.response-summary-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.08);
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.question-title {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 32px;
  color: #333;
  margin: 0;
}

.response-count {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #525252;
  margin: 0;
}

.card-content {
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: center;
}
</style>
