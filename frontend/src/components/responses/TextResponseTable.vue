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

<script>
/**
 * TextResponseTable - ตารางแสดงคำตอบแบบข้อความ
 * ใช้สำหรับ Short Answer และ Paragraph
 */
export default {
  name: 'TextResponseTable',
  props: {
    responses: { type: Array, default: () => [] }, // รายการคำตอบ
    currentPage: { type: Number, default: 1 },
    perPage: { type: Number, default: 6 }          // จำนวนต่อหน้า
  },
  methods: {
    // คำนวณเลขแถวตาม page ปัจจุบัน
    getRowNumber(index) {
      return (this.currentPage - 1) * this.perPage + index + 1
    }
  }
}
</script>

<style scoped>
.text-response-table {
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.response-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header-row {
  border-bottom: 1px solid var(--border-color);
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
  border-bottom: 1px solid var(--border-color);
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
  background: var(--bg-gray-light);
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
