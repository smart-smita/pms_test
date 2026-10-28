import { addToast } from '../components/common/Toast';

export const showSuccess = (message: string) => addToast('success', message);
export const showError = (message: string) => addToast('error', message);
export const showWarning = (message: string) => addToast('warning', message);
export const showInfo = (message: string) => addToast('info', message);
