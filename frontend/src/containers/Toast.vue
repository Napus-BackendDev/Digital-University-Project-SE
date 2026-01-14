<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" :class="['toast', `toast-${type}`]" @click="close">
        <div class="toast-icon">
          <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
          <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v4M12 17h.01"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <span class="toast-message">{{ message }}</span>
        <button class="toast-close" @click.stop="close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // success, error, warning, info
  duration: { type: Number, default: 4000 },
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
let timer = null

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.duration > 0) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      close()
    }, props.duration)
  }
})

function close() {
  visible.value = false
  emit('update:modelValue', false)
  clearTimeout(timer)
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  max-width: 400px;
  cursor: pointer;
}

.toast-success {
  border-left: 4px solid #22C55E;
}

.toast-success .toast-icon {
  color: #22C55E;
}

.toast-error {
  border-left: 4px solid #EF4444;
}

.toast-error .toast-icon {
  color: #EF4444;
}

.toast-warning {
  border-left: 4px solid #F59E0B;
}

.toast-warning .toast-icon {
  color: #F59E0B;
}

.toast-info {
  border-left: 4px solid #3B82F6;
}

.toast-info .toast-icon {
  color: #3B82F6;
}

.toast-icon {
  flex-shrink: 0;
}

.toast-icon svg {
  width: 20px;
  height: 20px;
}

.toast-message {
  flex: 1;
  color: var(--text-primary);
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9CA3AF;
  transition: color 0.2s;
}

.toast-close:hover {
  color: var(--text-primary);
}

.toast-close svg {
  width: 16px;
  height: 16px;
}

/* Animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
