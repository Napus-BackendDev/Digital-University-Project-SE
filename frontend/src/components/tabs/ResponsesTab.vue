<script setup>
/**
 * ResponsesTab - Tab แสดงคำตอบ
 */
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
  viewMode: { type: String, default: 'summary' }
})

const emit = defineEmits(['update:viewMode', 'export'])
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
        <ResponseSummaryCard
          :questionNumber="index + 1"
          :title="question.title"
          :responseCount="totalResponses"
        >
          <template v-if="question.type === 'short-answer' || question.type === 'paragraph'">
            <TextResponseTable :responses="[]" />
          </template>
          <template v-else-if="question.type === 'multiple-choice' || question.type === 'dropdown'">
            <PieChartSummary :chartData="[]" />
          </template>
          <template v-else-if="question.type === 'rating'">
            <BarChartSummary :chartData="[]" :maxValue="5" />
          </template>
          <template v-else-if="question.type === 'date' || question.type === 'time'">
            <DateTimeResponseList :responses="[]" />
          </template>
          <template v-else-if="question.type === 'file-upload'">
            <FileUploadSummary :count="0" fileType="file" />
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
