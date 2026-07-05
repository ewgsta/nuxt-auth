import { ref } from 'vue';

const toasts = ref<Array<{ id: number; message: string; type: 'success' | 'error' | 'info'; duration: number }>>([]);
let nextId = 0;

export const useToast = () => {
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) => {
    const id = nextId++;
    toasts.value.push({ id, message, type, duration });
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const showSuccess = (message: string, duration = 4000) => addToast(message, 'success', duration);
  const showError = (message: string, duration = 4000) => addToast(message, 'error', duration);
  const showInfo = (message: string, duration = 4000) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo
  };
};
