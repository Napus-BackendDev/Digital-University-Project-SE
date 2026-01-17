<template>
  <div class="data-responses">
    <ResponsesTab
      :questions="questions"
      :totalResponses="totalResponses"
      :responses="responses"
      :viewMode="viewMode"
      @update:viewMode="$emit('update:viewMode', $event)"
      @export="$emit('export', $event)"
    />
  </div>
</template>

<script>
/**
 * DataResponses - Component สำหรับแสดงข้อมูล Responses
 * แยกออกมาจาก FormBuilderView เพื่อให้ maintain ง่ายขึ้น
 */
import ResponsesTab from '@/components/tabs/ResponsesTab.vue'

export default {
  name: 'DataResponses',

  components: {
    ResponsesTab
  },

  props: {
    questions: {
      type: Array,
      required: true
    },
    totalResponses: {
      type: Number,
      default: 0
    },
    responses: {
      type: Array,
      default: () => []
    },
    viewMode: {
      type: String,
      default: 'summary'
    }
  },

  emits: ['update:viewMode', 'export']
}
</script>

<style scoped>
.data-responses {
  width: 100%;
}
</style>
