<template>
  <div 
    class="table-loading-container text-center"
    :class="[borderless ? 'py-5 px-3 borderless' : 'py-5 px-4 bg-white rounded-12 border shadow-sm my-3']"
  >
    <div class="spinner-box mx-auto mb-3">
      <div class="premium-ring-spinner"></div>
    </div>
    <div class="loading-title font-weight-bold text-dark mb-1">
      {{ text || $t('common.loading') || 'กำลังโหลดข้อมูล...' }}
    </div>
    <div class="loading-sub text-muted small">
      {{ subText || 'โปรดรอสักครู่ ระบบกำลังเตรียมข้อมูลให้คุณ' }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'TableLoading',
  props: {
    borderless: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: ''
    },
    subText: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.table-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 220px;
  animation: fadeIn 0.25s ease-in-out;
}

.table-loading-container:not(.borderless) {
  border: 1px solid #e2e8f0 !important;
  background-color: #ffffff;
}

.table-loading-container.borderless {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.spinner-box {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.premium-ring-spinner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3.5px solid #f1f5f9;
  border-top-color: #8c1515;
  border-right-color: rgba(140, 21, 21, 0.4);
  animation: smoothSpin 0.9s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
  box-shadow: 0 0 12px rgba(140, 21, 21, 0.08);
}

@keyframes smoothSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-title {
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.loading-sub {
  font-size: 0.85rem;
  color: #64748b;
}

.rounded-12 {
  border-radius: 12px !important;
}
</style>
