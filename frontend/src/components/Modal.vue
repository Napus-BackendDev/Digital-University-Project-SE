<script setup>
/**
 * Modal - คอมโพเนนต์ modal สำหรับแสดงข้อความหรือยืนยัน
 */
import { watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // info, success, warning, error
  showCancel: { type: Boolean, default: false },
  confirmText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Cancel' }
})

const emit = defineEmits(['close', 'confirm', 'cancel'])

// ปิด modal เมื่อกด Escape
function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

function handleConfirm() {
  emit('confirm')
  emit('close')
}

function handleCancel() {
  emit('cancel')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-container">
          <!-- Icon -->
          <div :class="['modal-icon', type]">
            <!-- Success Icon -->
            <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12l3 3 5-6"></path>
            </svg>
            <!-- Info Icon -->
            <svg v-else-if="type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4M12 8h.01"></path>
            </svg>
            <!-- Warning Icon -->
            <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <path d="M12 9v4M12 17h.01"></path>
            </svg>
            <!-- Error Icon -->
            <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M15 9l-6 6M9 9l6 6"></path>
            </svg>
          </div>

          <!-- Title -->
          <h3 v-if="title" class="modal-title">{{ title }}</h3>

          <!-- Message -->
          <p class="modal-message">{{ message }}</p>

          <!-- Actions -->
          <div class="modal-actions">
            <button v-if="showCancel" class="btn btn-secondary" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="btn btn-primary" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-icon svg {
  width: 28px;
  height: 28px;
}

.modal-icon.success {
  background: #dcfce7;
  color: #22c55e;
}

.modal-icon.info {
  background: #e0e7ff;
  color: var(--primary);
}

.modal-icon.warning {
  background: #fef3c7;
  color: #f59e0b;
}

.modal-icon.error {
  background: #fee2e2;
  color: #ef4444;
}

.modal-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.modal-message {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:hover {
  background: #5558e3;
}

.btn-secondary {
  background: var(--bg-gray-light);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: #eee;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>
