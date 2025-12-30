<template>
  <div class="datetime-response-list">
    <div 
      v-for="(item, index) in responses" 
      :key="item.id || index"
      class="response-item"
    >
      <span class="response-value">{{ item.value }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * DateTimeResponseList - แสดงคำตอบประเภทวันที่/เวลา
 * แสดงเป็น list ของคำตอบ
 */
defineProps({
  responses: { type: Array, default: () => [] }
})
</script>

<style scoped>
.datetime-response-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-item {
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 12px;
  height: 46px;
  display: flex;
  align-items: center;
}

.response-value {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #333;
}
</style>
