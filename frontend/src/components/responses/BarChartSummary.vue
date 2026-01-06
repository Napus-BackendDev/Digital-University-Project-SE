<template>
  <div class="bar-chart-container">
    <div class="chart-area">
      <!-- Y-axis labels -->
      <div class="y-axis">
        <span 
          v-for="label in yLabels" 
          :key="label" 
          class="y-label"
        >
          {{ label }}
        </span>
      </div>
      
      <!-- Chart area with grid and bars -->
      <div class="chart-content">
        <!-- Grid lines -->
        <div class="grid-lines">
          <div 
            v-for="n in 5" 
            :key="n" 
            class="grid-line"
          ></div>
        </div>
        
        <!-- Bars -->
        <div class="bars-container">
          <div 
            v-for="(bar, index) in chartData" 
            :key="index"
            class="bar-wrapper"
          >
            <div 
              class="bar"
              :style="{ height: getBarHeight(bar.value) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- X-axis labels -->
    <div class="x-axis">
      <div class="x-axis-spacer"></div>
      <div class="x-labels">
        <span 
          v-for="(bar, index) in chartData" 
          :key="index" 
          class="x-label"
        >
          {{ bar.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * BarChartSummary - แสดงข้อมูลเป็น Bar Chart
 * ใช้สำหรับ Rating และข้อมูลตัวเลข
 */
import { computed } from 'vue'

const props = defineProps({
  chartData: { type: Array, default: () => [] }, // ข้อมูล [{ label, value }]
  maxValue: { type: Number, default: 0 }         // ค่าสูงสุด (0 = คำนวณอัตโนมัติ)
})

// คำนวณค่าสูงสุดสำหรับแกน Y
const calculatedMax = computed(() => {
  if (props.maxValue > 0) return props.maxValue
  const max = Math.max(...props.chartData.map(d => d.value))
  return Math.ceil(max * 1.2) || 5
})

// สร้าง label สำหรับแกน Y (5 ขีด)
const yLabels = computed(() => {
  const labels = []
  const step = calculatedMax.value / 4
  for (let i = 4; i >= 0; i--) {
    labels.push((step * i).toFixed(step < 1 ? 2 : 0))
  }
  return labels
})

// คำนวณความสูงของ bar เป็นเปอร์เซ็นต์
function getBarHeight(value) {
  if (calculatedMax.value === 0) return 0
  return (value / calculatedMax.value) * 100
}
</script>

<style scoped>
.bar-chart-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-area {
  display: flex;
  height: 210px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 8px;
  width: 40px;
  text-align: right;
}

.y-label {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: var(--text-secondary);
}

.chart-content {
  flex: 1;
  position: relative;
  border-left: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.grid-lines {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  width: 100%;
  height: 1px;
  background: #f0f0f0;
}

.bars-container {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  padding: 0 10%;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  height: 100%;
  align-items: flex-end;
}

.bar {
  width: 60%;
  max-width: 80px;
  background: linear-gradient(180deg, #ba0c2f 0%, #8b0922 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.x-axis {
  display: flex;
}

.x-axis-spacer {
  width: 48px;
}

.x-labels {
  flex: 1;
  display: flex;
  justify-content: space-around;
  padding: 0 10%;
}

.x-label {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
</style>
