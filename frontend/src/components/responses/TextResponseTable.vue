<template>
  <div class="text-response-table">
    <table class="response-table">
      <thead>
        <tr class="table-header-row">
          <th class="table-head number-col">#</th>
          <th class="table-head response-col">Response</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="(response, index) in responses" 
          :key="response.id || index"
          class="table-row"
        >
          <td class="table-cell number-col">
            <div class="row-number">
              {{ getRowNumber(index) }}
            </div>
          </td>
          <td class="table-cell response-col">
            <p class="response-text">{{ response.text }}</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * TextResponseTable - ตารางแสดงคำตอบแบบข้อความ
 * ใช้สำหรับ Short Answer และ Paragraph
 */
const props = defineProps({
  responses: { type: Array, default: () => [] }, // รายการคำตอบ
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 6 }          // จำนวนต่อหน้า
})

// คำนวณเลขแถวตาม page ปัจจุบัน
function getRowNumber(index) {
  return (props.currentPage - 1) * props.perPage + index + 1
}
</script>

<style scoped>
.text-response-table {
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  overflow: hidden;
}

.response-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header-row {
  border-bottom: 1px solid #e5e5e5;
}

.table-head {
  padding: 10px 8px;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #0a0a0a;
}

.table-row {
  border-bottom: 1px solid #e5e5e5;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 17px 8px;
  vertical-align: top;
}

.number-col {
  width: 60px;
}

.response-col {
  flex: 1;
}

.row-number {
  width: 32px;
  height: 32px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #404040;
}

.response-text {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #1a1a1a;
  margin: 0;
}
</style>
