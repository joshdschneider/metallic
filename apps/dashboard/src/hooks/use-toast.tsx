import { useContext } from 'react';
import { ToastContext } from '../providers/toast-provider';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = context.toast;
  const updateToast = context.updateToast;

  function toastError(message?: string) {
    const toastId = Math.random().toString(36).substring(2, 9);
    toast({
      id: toastId,
      color: 'red',
      title: 'Error',
      description: message || 'Something went wrong'
    });
  }

  function toastSuccess(message: string) {
    const toastId = Math.random().toString(36).substring(2, 9);
    toast({
      id: toastId,
      color: 'jade',
      title: 'Success',
      description: message
    });
  }

  function toastWarning(message: string) {
    const toastId = Math.random().toString(36).substring(2, 9);
    toast({
      id: toastId,
      color: 'yellow',
      title: 'Warning',
      description: message
    });
  }

  return { toast, updateToast, toastSuccess, toastError, toastWarning };
}
