import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

// Global state for toasts
let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toasts: ToastMessage[] = [];

const notifyListeners = () => {
  toastListeners.forEach(listener => listener(toasts));
};

export const addToast = (type: ToastMessage['type'], message: string) => {
  const id = Math.random().toString(36).substr(2, 9);
  toasts = [...toasts, { id, type, message }];
  notifyListeners();

  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  }, 4000);
};

export const ToastContainer: React.FC = () => {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (newToasts: ToastMessage[]) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    }}>
      {currentToasts.map(toast => {
        const getColors = () => {
          switch (toast.type) {
            case 'success': return { bg: '#121929', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', icon: '✓' };
            case 'error': return { bg: '#121929', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', icon: '✕' };
            case 'warning': return { bg: '#121929', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', icon: '⚠️' };
            case 'info': return { bg: '#121929', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)', icon: 'ℹ️' };
          }
        };
        const colors = getColors();

        return (
          <div key={toast.id} style={{
            background: colors.bg,
            color: colors.color,
            border: colors.border,
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
            animation: 'slideIn 0.3s ease-out forwards',
            pointerEvents: 'auto',
          }}>
            <span style={{ fontSize: '1rem' }}>{colors.icon}</span>
            {toast.message}
          </div>
        );
      })}
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};
