<template>
  <div class="skeleton-wrapper" :class="wrapperClass">
    <!-- TABLE SKELETON (Forms, ManageForms, ResponseTables, Permissions) -->
    <div v-if="type === 'table'" class="skeleton-table-container">
      <!-- Top filter bar skeleton -->
      <div v-if="showFilter" class="skeleton-card mb-4 p-3 p-md-4 rounded-16 bg-white border">
        <div class="d-flex flex-wrap align-items-center justify-content-between" style="gap: 16px;">
          <div class="skeleton-box rounded-12" style="width: 260px; height: 40px;"></div>
          <div class="d-flex align-items-center" style="gap: 12px;">
            <div class="skeleton-box rounded-12" style="width: 140px; height: 40px;"></div>
            <div class="skeleton-box rounded-12 d-none d-md-block" style="width: 180px; height: 40px;"></div>
            <div class="skeleton-box rounded-12" style="width: 100px; height: 40px;"></div>
          </div>
        </div>
      </div>

      <!-- Table Card Skeleton -->
      <div class="skeleton-card p-0 rounded-20 bg-white border overflow-hidden shadow-sm">
        <!-- Table Header Row -->
        <div class="skeleton-table-head p-3 px-4 border-bottom d-flex align-items-center justify-content-between bg-light">
          <div class="skeleton-box rounded-12" style="width: 25%; height: 20px;"></div>
          <div class="skeleton-box rounded-12 d-none d-sm-block" style="width: 15%; height: 20px;"></div>
          <div class="skeleton-box rounded-12 d-none d-md-block" style="width: 18%; height: 20px;"></div>
          <div class="skeleton-box rounded-12" style="width: 14%; height: 20px;"></div>
          <div class="skeleton-box rounded-12" style="width: 12%; height: 20px;"></div>
        </div>

        <!-- Table Body Rows -->
        <div
          v-for="i in rows"
          :key="i"
          class="skeleton-table-row p-3 px-4 border-bottom d-flex align-items-center justify-content-between"
        >
          <div class="d-flex align-items-center" style="width: 25%; gap: 12px;">
            <div class="skeleton-box rounded-12 flex-shrink-0" style="width: 36px; height: 36px;"></div>
            <div class="flex-grow-1">
              <div class="skeleton-box rounded-12 mb-2" style="width: 85%; height: 16px;"></div>
              <div class="skeleton-box rounded-12" style="width: 55%; height: 12px;"></div>
            </div>
          </div>
          <div class="skeleton-box rounded-12 d-none d-sm-block" style="width: 15%; height: 16px;"></div>
          <div class="skeleton-box rounded-12 d-none d-md-block" style="width: 18%; height: 16px;"></div>
          <div class="skeleton-box rounded-12" style="width: 14%; height: 24px; border-radius: 999px !important;"></div>
          <div class="d-flex align-items-center justify-content-end" style="width: 12%; gap: 8px;">
            <div class="skeleton-box rounded-12" style="width: 34px; height: 34px;"></div>
            <div class="skeleton-box rounded-12" style="width: 34px; height: 34px;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- FORM-FILL SKELETON (Questionnaire respondent view) -->
    <div v-else-if="type === 'form-fill'" class="skeleton-formfill-container mx-auto" style="max-width: 760px;">
      <!-- Title & Banner Card Skeleton -->
      <div class="skeleton-card mb-4 rounded-20 bg-white border overflow-hidden shadow-sm">
        <div class="skeleton-box" style="height: 12px; width: 100%; border-radius: 0;"></div>
        <div class="p-4 p-md-5">
          <div class="skeleton-box rounded-12 mb-3" style="width: 60%; height: 32px;"></div>
          <div class="skeleton-box rounded-12 mb-2" style="width: 90%; height: 16px;"></div>
          <div class="skeleton-box rounded-12 mb-4" style="width: 75%; height: 16px;"></div>
          <div class="pt-3 border-top d-flex align-items-center" style="gap: 12px;">
            <div class="skeleton-box rounded-12" style="width: 120px; height: 28px; border-radius: 999px !important;"></div>
            <div class="skeleton-box rounded-12" style="width: 150px; height: 28px; border-radius: 999px !important;"></div>
          </div>
        </div>
      </div>

      <!-- Question Cards Skeleton -->
      <div
        v-for="q in 3"
        :key="q"
        class="skeleton-card mb-4 p-4 p-md-5 rounded-20 bg-white border shadow-sm"
      >
        <div class="d-flex align-items-center mb-4" style="gap: 12px;">
          <div class="skeleton-box rounded-12 flex-shrink-0" style="width: 28px; height: 28px; border-radius: 50% !important;"></div>
          <div class="skeleton-box rounded-12 flex-grow-1" style="max-width: 70%; height: 22px;"></div>
        </div>
        <div class="mb-3">
          <div class="skeleton-box rounded-12 mb-2" style="width: 90%; height: 14px;"></div>
          <div class="skeleton-box rounded-12" style="width: 60%; height: 14px;"></div>
        </div>
        <!-- Simulated input/options -->
        <div class="mt-4 pt-2">
          <div v-if="q === 1" class="d-flex flex-column" style="gap: 12px;">
            <div v-for="opt in 3" :key="opt" class="d-flex align-items-center" style="gap: 12px;">
              <div class="skeleton-box" style="width: 20px; height: 20px; border-radius: 50% !important;"></div>
              <div class="skeleton-box rounded-12" :style="{ width: (40 + opt * 15) + '%', height: '18px' }"></div>
            </div>
          </div>
          <div v-else-if="q === 2" class="skeleton-box rounded-12" style="width: 100%; height: 46px;"></div>
          <div v-else class="skeleton-box rounded-12" style="width: 100%; height: 90px;"></div>
        </div>
      </div>
    </div>

    <!-- CARD SKELETON (General cards / Email / Stats) -->
    <div v-else class="skeleton-cards-container">
      <div class="row">
        <div
          v-for="c in count"
          :key="c"
          :class="colClass"
          class="mb-4"
        >
          <div class="skeleton-card p-4 rounded-20 bg-white border shadow-sm h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div class="skeleton-box rounded-12" style="width: 44px; height: 44px;"></div>
              <div class="skeleton-box rounded-12" style="width: 70px; height: 24px; border-radius: 999px !important;"></div>
            </div>
            <div class="skeleton-box rounded-12 mb-2" style="width: 75%; height: 20px;"></div>
            <div class="skeleton-box rounded-12 mb-3" style="width: 90%; height: 14px;"></div>
            <div class="pt-3 border-top mt-auto d-flex justify-content-between align-items-center">
              <div class="skeleton-box rounded-12" style="width: 80px; height: 14px;"></div>
              <div class="skeleton-box rounded-12" style="width: 60px; height: 28px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    type: {
      type: String,
      default: 'table', // 'table' | 'form-fill' | 'card'
      validator: v => ['table', 'form-fill', 'card'].includes(v)
    },
    rows: {
      type: Number,
      default: 5
    },
    count: {
      type: Number,
      default: 4
    },
    showFilter: {
      type: Boolean,
      default: true
    },
    colClass: {
      type: String,
      default: 'col-12 col-md-6 col-lg-3'
    },
    wrapperClass: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.skeleton-wrapper {
  width: 100%;
}

.skeleton-box {
  background: linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  display: inline-block;
}

.skeleton-card {
  border-color: #e2e8f0 !important;
  position: relative;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.rounded-20 {
  border-radius: 20px !important;
}

.rounded-16 {
  border-radius: 16px !important;
}

.rounded-12 {
  border-radius: 12px !important;
}
</style>
