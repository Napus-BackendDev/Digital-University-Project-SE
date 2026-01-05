<script setup>
/**
 * ResponsesTab - Tab แสดงคำตอบ
 */
import { computed } from 'vue'
import { EmptyResponseIcon } from '@/components/icons'
import ResponsesView from '@/components/responses/ResponsesView.vue'
import ResponseSummaryCard from '@/components/responses/ResponseSummaryCard.vue'
import TextResponseTable from '@/components/responses/TextResponseTable.vue'
import PieChartSummary from '@/components/responses/PieChartSummary.vue'
import BarChartSummary from '@/components/responses/BarChartSummary.vue'
import DateTimeResponseList from '@/components/responses/DateTimeResponseList.vue'
import FileUploadSummary from '@/components/responses/FileUploadSummary.vue'

const props = defineProps({
  questions: { type: Array, required: true },
  totalResponses: { type: Number, default: 0 },
  responses: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'summary' }
})

const emit = defineEmits(['update:viewMode', 'export'])

// ฟังก์ชันประมวลผล responses สำหรับแต่ละ question
function getQuestionResponses(questionId) {
  const responseList = []
  
  props.responses.forEach((resp, index) => {
    const answer = resp.answers?.find(a => a.question === questionId)
    if (answer) {
      responseList.push({
        id: resp._id,
        index: index + 1,
        text: answer.response,
        value: answer.response
      })
    }
  })
  
  return responseList
}

// สร้างข้อมูล chart สำหรับ multiple-choice
function getChoiceChartData(questionId, options) {
  const responses = getQuestionResponses(questionId)
  const counts = {}
  
  // นับจำนวนแต่ละตัวเลือก
  options.forEach(opt => {
    counts[opt.text] = 0
  })
  
  responses.forEach(resp => {
    if (counts[resp.value] !== undefined) {
      counts[resp.value]++
    }
  })
  
  // สีสำหรับ chart
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ]
  
  return Object.entries(counts).map(([label, count], index) => ({
    label,
    count,
    percentage: props.totalResponses > 0 ? Math.round((count / props.totalResponses) * 100) : 0,
    color: colors[index % colors.length]
  }))
}

// สร้างข้อมูล chart สำหรับ rating
function getRatingChartData(questionId, maxRating = 5) {
  const responses = getQuestionResponses(questionId)
  const counts = {}
  
  // สร้าง rating range
  for (let i = 1; i <= maxRating; i++) {
    counts[i] = 0
  }
  
  responses.forEach(resp => {
    const rating = parseInt(resp.value)
    if (counts[rating] !== undefined) {
      counts[rating]++
    }
  })
  
  // สีสำหรับ rating chart (gradient จากแดงไปเขียว)
  const colors = ['#E74C3C', '#E67E22', '#F39C12', '#2ECC71', '#27AE60']
  
  return Object.entries(counts).map(([rating, count], index) => ({
    label: rating.toString(),
    count,
    percentage: props.totalResponses > 0 ? Math.round((count / props.totalResponses) * 100) : 0,
    color: colors[index % colors.length]
  }))
}

</script>

<template>
  <div class="responses-tab">
    <!-- Empty State -->
    <div v-if="totalResponses === 0" class="empty-responses">
      <div class="empty-icon"><EmptyResponseIcon /></div>
      <h3>No responses yet</h3>
      <p>Share your form to start collecting responses. Responses will appear here once people submit the form.</p>
    </div>

    <!-- Responses View -->
    <ResponsesView 
      v-else
      :totalResponses="totalResponses"
      :viewMode="viewMode"
      @update:viewMode="emit('update:viewMode', $event)"
      @export="emit('export', $event)"
    >
      <div v-for="(question, index) in questions" :key="question.id">
        <!-- ไม่แสดง question ที่เป็น title, image, video, divider -->
        <ResponseSummaryCard
          v-if="!['title-description', 'image', 'video', 'section-divider'].includes(question.type)"
          :questionNumber="index + 1"
          :title="question.title"
          :responseCount="totalResponses"
        >
          <template v-if="question.type === 'short-answer' || question.type === 'paragraph'">
            <TextResponseTable :responses="getQuestionResponses(question._id || question.id)" />
          </template>
          <template v-else-if="question.type === 'multiple-choice' || question.type === 'dropdown'">
            <PieChartSummary :chartData="getChoiceChartData(question._id || question.id, question.options || [])" />
          </template>
          <template v-else-if="question.type === 'checkbox'">
            <PieChartSummary :chartData="getChoiceChartData(question._id || question.id, question.options || [])" />
          </template>
          <template v-else-if="question.type === 'rating'">
            <BarChartSummary 
              :chartData="getRatingChartData(question._id || question.id, question.maxRating || 5)" 
              :maxValue="question.maxRating || 5" 
            />
          </template>
          <template v-else-if="question.type === 'date' || question.type === 'time'">
            <DateTimeResponseList :responses="getQuestionResponses(question._id || question.id)" />
          </template>
          <template v-else-if="question.type === 'file-upload'">
            <FileUploadSummary 
              :count="getQuestionResponses(question._id || question.id).length" 
              fileType="file" 
            />
          </template>
        </ResponseSummaryCard>
      </div>
    </ResponsesView>
  </div>
</template>

<style scoped>
.responses-tab {
  max-width: 960px;
  margin: 0 auto;
}

.empty-responses {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e5e5;
}

.empty-responses .empty-icon {
  width: 80px;
  height: 80px;
  color: #ccc;
  margin-bottom: 24px;
}

.empty-responses .empty-icon svg { width: 100%; height: 100%; }
.empty-responses h3 { font-size: 20px; font-weight: 600; color: #333; margin: 0 0 8px; }
.empty-responses p { font-size: 14px; color: #666; margin: 0; max-width: 400px; }
</style>
