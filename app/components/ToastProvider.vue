<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast"
        :class="`toast-${toast.type}`"
        @click="removeToast(toast.id)"
      >
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  min-width: 300px;
  max-width: 90vw;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  background-color: var(--md-surface);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-bg);
}

.toast-success {
  border-left: 4px solid var(--md-secondary);
}

.toast-error {
  border-left: 4px solid var(--md-error);
}

.toast-info {
  border-left: 4px solid var(--md-primary);
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>
