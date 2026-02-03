<template>
  <div class="data-responses">
    <ResponsesTab
      :questions="questionsForResponses"
      :totalResponses="responsesStore.totalResponses"
      :responses="responsesStore.responses"
      :viewMode="responsesStore.viewMode"
      @update:viewMode="responsesStore.setViewMode"
      @export="responsesStore.exportResponses"
    />
  </div>
</template>

<script setup>
/**
 * DataResponses - Component สำหรับแสดงข้อมูล Responses
 * ใช้ Pinia Store (dataResponses) จัดการ state
 */
import { computed } from 'vue'

import ResponsesTab from '@/components/tabs/ResponsesTab.vue'

const formStore = useFormBuilderStore()
const responsesStore = useDataResponsesStore()

// Get questions for responses from formBuilder store
const questionsForResponses = computed(() => {
  const excludedTypes = ['title-description', 'image', 'video', 'section-divider']
  return formStore.questions.filter(q => !excludedTypes.includes(q.type))
})
</script>

<style scoped>
.data-responses {
  width: 100%;
}
</style>
