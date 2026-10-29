import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { AlertTriangle, HelpCircle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmationOptions {
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  /** If provided, renders an input field prompting the user to type before confirming */
  promptInput?: {
    placeholder?: string;
    defaultValue?: string;
    minLength?: number;
    required?: boolean;
    label?: string;
  };
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions | string) => Promise<boolean>;
  promptModal: (options: ConfirmationOptions) => Promise<string | null>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string | ReactNode;
    confirmText: string;
    cancelText: string;
    type: ConfirmationType;
    isPrompt: boolean;
    promptInputConfig?: ConfirmationOptions['promptInput'];
    inputValue: string;
    errorText?: string;
    resolve: (value: any) => void;
  } | null>(null);

  const confirm = (options: ConfirmationOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ConfirmationOptions = typeof options === 'string' ? { message: options } : options;
      setModalState({
        isOpen: true,
        title: opts.title || (opts.type === 'danger' ? 'Confirm Action' : 'Confirmation'),
        message: opts.message,
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        type: opts.type || 'info',
        isPrompt: false,
        inputValue: '',
        resolve,
      });
    });
  };

  const promptModal = (options: ConfirmationOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'Input Required',
        message: options.message,
        confirmText: options.confirmText || 'Submit',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'info',
        isPrompt: true,
        promptInputConfig: options.promptInput || {},
        inputValue: options.promptInput?.defaultValue || '',
        resolve,
      });
    });
  };

  const handleClose = () => {
    if (modalState) {
      modalState.resolve(modalState.isPrompt ? null : false);
    }
    setModalState(null);
  };

  const handleConfirm = () => {
    if (!modalState) return;

    if (modalState.isPrompt) {
      const minLength = modalState.promptInputConfig?.minLength || (modalState.promptInputConfig?.required ? 1 : 0);
      const val = modalState.inputValue.trim();
      if (minLength > 0 && val.length < minLength) {
        setModalState(prev => prev ? {
          ...prev,
          errorText: `Please enter at least ${minLength} characters.`
        } : null);
        return;
      }
      modalState.resolve(val);
      setModalState(null);
      return;
    }

    modalState.resolve(true);
    setModalState(null);
  };

  const getTheme = (type: ConfirmationType) => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle size={36} color="#ef4444" />,
          iconBg: 'rgba(239, 68, 68, 0.12)',
          buttonVariant: 'primary' as const,
          btnBg: '#ef4444',
          btnBorder: '#ef4444',
        };
      case 'warning':
        return {
          icon: <ShieldAlert size={36} color="#f59e0b" />,
          iconBg: 'rgba(245, 158, 11, 0.12)',
          buttonVariant: 'primary' as const,
          btnBg: '#f59e0b',
          btnBorder: '#f59e0b',
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={36} color="#10b981" />,
          iconBg: 'rgba(16, 185, 129, 0.12)',
          buttonVariant: 'primary' as const,
          btnBg: '#10b981',
          btnBorder: '#10b981',
        };
      case 'info':
      default:
        return {
          icon: <HelpCircle size={36} color="var(--primary-color, #4f46e5)" />,
          iconBg: 'rgba(79, 70, 229, 0.12)',
          buttonVariant: 'primary' as const,
          btnBg: 'var(--primary-color, #4f46e5)',
          btnBorder: 'var(--primary-color, #4f46e5)',
        };
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, promptModal }}>
      {children}
      {modalState && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={handleClose}
          title={modalState.title}
          size="sm"
        >
          <div style={{ padding: '0.5rem 0 1rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                background: getTheme(modalState.type).iconBg,
                padding: '1rem',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {getTheme(modalState.type).icon}
              </div>
            </div>

            <div style={{
              color: 'var(--text-primary)',
              fontSize: '1rem',
              lineHeight: '1.5',
              marginBottom: modalState.isPrompt ? '1rem' : '1.75rem',
              wordBreak: 'break-word',
            }}>
              {modalState.message}
            </div>

            {modalState.isPrompt && (
              <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                {modalState.promptInputConfig?.label && (
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    {modalState.promptInputConfig.label}
                  </label>
                )}
                <textarea
                  autoFocus
                  rows={3}
                  value={modalState.inputValue}
                  onChange={(e) => setModalState(prev => prev ? { ...prev, inputValue: e.target.value, errorText: undefined } : null)}
                  placeholder={modalState.promptInputConfig?.placeholder || 'Enter details...'}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: modalState.errorText ? '1px solid #ef4444' : '1px solid var(--border-color, #374151)',
                    background: 'var(--bg-secondary, #1f2937)',
                    color: 'var(--text-primary, #f9fafb)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
                {modalState.errorText && (
                  <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    {modalState.errorText}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
              <Button
                variant="secondary"
                onClick={handleClose}
                style={{ padding: '0.65rem 1.5rem', minWidth: '100px' }}
              >
                {modalState.cancelText}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                style={{
                  padding: '0.65rem 1.5rem',
                  minWidth: '100px',
                  background: getTheme(modalState.type).btnBg,
                  borderColor: getTheme(modalState.type).btnBorder,
                }}
              >
                {modalState.confirmText}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmationProvider');
  }
  return context;
};
