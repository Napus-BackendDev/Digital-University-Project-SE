<template>
  <div class="pie-chart-container">
    <div class="chart-wrapper" ref="chartWrapper">
      <svg viewBox="0 0 200 200" class="pie-chart">
        <g transform="translate(100, 100)">
          <!-- Donut slices -->
          <path 
            v-for="(slice, index) in slices" 
            :key="index"
            :d="slice.path"
            :fill="slice.color"
            :class="['pie-slice', { active: hoveredIndex === index }]"
            @mouseenter="handleMouseEnter(index, $event)"
            @mousemove="handleMouseMove($event)"
            @mouseleave="handleMouseLeave"
          />
          <!-- Center hole for donut effect -->
          <circle cx="0" cy="0" r="50" fill="white" style="pointer-events: none;" />
        </g>
      </svg>
      
      <!-- Tooltip -->
      <transition name="fade">
        <div 
          v-if="hoveredIndex !== null && tooltipVisible" 
          class="chart-tooltip"
          :style="tooltipStyle"
        >
          <span class="tooltip-label">{{ tooltipData.label }}</span>
          <span class="tooltip-count">{{ tooltipData.count }}</span>
        </div>
      </transition>
    </div>
    
    <div class="legend">
      <div 
        v-for="(item, index) in chartData" 
        :key="index" 
        :class="['legend-item', { active: hoveredIndex === index }]"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
      >
        <div 
          class="legend-color" 
          :style="{ backgroundColor: item.color }"
        ></div>
        <div class="legend-content">
          <div class="legend-row">
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-value">{{ item.count }}</span>
          </div>
          <div class="legend-bar-bg">
            <div 
              class="legend-bar" 
              :style="{ 
                width: getBarWidth(item.count) + '%',
                backgroundColor: item.color 
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * PieChartSummary - แสดงผลคำตอบเป็น Donut Chart
 * มี tooltip แสดงเมื่อ hover และ legend ด้านข้าง
 */
export default {
  name: 'PieChartSummary',
  props: {
    chartData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      hoveredIndex: null,
      tooltipVisible: false,
      tooltipPos: { x: 0, y: 0 }
    }
  },
  computed: {
    // ข้อมูลใน tooltip
    tooltipData() {
      if (this.hoveredIndex === null || !this.chartData[this.hoveredIndex]) {
        return { label: '', count: 0 }
      }
      const item = this.chartData[this.hoveredIndex]
      return { label: item.label, count: item.count }
    },
    // ตำแหน่ง tooltip
    tooltipStyle() {
      return {
        left: `${this.tooltipPos.x}px`,
        top: `${this.tooltipPos.y}px`
      }
    },
    // รวมจำนวนทั้งหมด
    total() {
      return this.chartData.reduce((sum, item) => sum + item.count, 0)
    },
    // หาค่ามากสุดสำหรับ legend bar
    maxCount() {
      return Math.max(...this.chartData.map(d => d.count))
    },
    /**
     * คำนวณ path สำหรับ donut slices
     * ใช้ SVG arc เพื่อวาดแต่ละส่วน
     */
    slices() {
      // ป้องกันการคำนวณถ้า total เป็น 0 หรือไม่มีข้อมูล
      if (!this.total || this.total === 0 || !this.chartData.length) {
        return []
      }
      
      const result = []
      let currentAngle = -90 // เริ่มจากด้านบน
      
      const outerRadius = 85
      const innerRadius = 50
      
      this.chartData.forEach((item) => {
        // ข้ามถ้า count เป็น 0 (ไม่วาด slice)
        if (item.count === 0) {
          return
        }
        
        const percentage = item.count / this.total
        const angle = percentage * 360
        
        // เพิ่ม gap เล็กๆ ระหว่าง slices
        const gapAngle = 2
        const startAngle = currentAngle + gapAngle / 2
        const endAngle = currentAngle + angle - gapAngle / 2
        
        // แปลงเป็น radians
        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180
        
        // จุดบน arc ด้านนอก
        const x1 = Math.cos(startRad) * outerRadius
        const y1 = Math.sin(startRad) * outerRadius
        const x2 = Math.cos(endRad) * outerRadius
        const y2 = Math.sin(endRad) * outerRadius
        
        // จุดบน arc ด้านใน
        const x3 = Math.cos(endRad) * innerRadius
        const y3 = Math.sin(endRad) * innerRadius
        const x4 = Math.cos(startRad) * innerRadius
        const y4 = Math.sin(startRad) * innerRadius
        
        const largeArc = angle > 180 ? 1 : 0
        
        // สร้าง SVG path สำหรับ donut slice
        const path = `
          M ${x1} ${y1}
          A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
          Z
        `
        
        result.push({
          path,
          color: item.color
        })
        
        currentAngle = currentAngle + angle
      })
      
      return result
    }
  },
  methods: {
    handleMouseEnter(index, event) {
      this.hoveredIndex = index
      this.tooltipVisible = true
      this.updateTooltipPos(event)
    },
    handleMouseMove(event) {
      this.updateTooltipPos(event)
    },
    handleMouseLeave() {
      this.hoveredIndex = null
      this.tooltipVisible = false
    },
    // อัพเดทตำแหน่ง tooltip ตาม mouse
    updateTooltipPos(event) {
      if (!this.$refs.chartWrapper) return
      const rect = this.$refs.chartWrapper.getBoundingClientRect()
      this.tooltipPos.x = event.clientX - rect.left + 12
      this.tooltipPos.y = event.clientY - rect.top - 35
    },
    // คำนวณความกว้าง bar ใน legend
    getBarWidth(count) {
      if (this.maxCount === 0) return 0
      return (count / this.maxCount) * 100
    }
  }
}
</script>

<style scoped>
.pie-chart-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.chart-wrapper {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  position: relative;
}

.pie-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.pie-slice {
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  transform-origin: center;
}

.pie-slice:hover,
.pie-slice.active {
  filter: brightness(1.1) saturate(1.1);
  transform: scale(1.02);
}

.chart-tooltip {
  position: absolute;
  background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
  border: 1px solid #fbc02d;
  border-radius: 8px;
  padding: 8px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  gap: 8px;
  align-items: center;
}

.tooltip-label {
  font-weight: 500;
  color: #424242;
}

.tooltip-count {
  font-weight: 700;
  color: #1976d2;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 6px 8px;
  margin: -6px -8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.legend-item:hover,
.legend-item.active {
  background-color: rgba(0, 0, 0, 0.04);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-label {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
}

.legend-value {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
}

.legend-bar-bg {
  width: 100%;
  height: 6px;
  background: var(--bg-gray-light);
  border-radius: 9999px;
  overflow: hidden;
}

.legend-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}
</style>
