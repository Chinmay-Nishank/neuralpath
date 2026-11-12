'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  pushToast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const pushToast = React.useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {toasts.map((item) => {
          const Icon =
            item.variant === 'success'
              ? CheckCircle2
              : item.variant === 'error'
              ? AlertCircle
              : Info;
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 rounded-md border bg-elevated p-3.5 text-sm shadow-lg',
                item.variant === 'success' && 'border-success/40',
                item.variant === 'error' && 'border-danger/40',
                (!item.variant || item.variant === 'info') && 'border-hairline'
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  item.variant === 'success' && 'text-success',
                  item.variant === 'error' && 'text-danger',
                  (!item.variant || item.variant === 'info') && 'text-accent'
                )}
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-medium text-primary">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-primary-secondary">{item.description}</p>
                )}
                {item.action && (
                  <button
                    type="button"
                    onClick={() => {
                      item.action?.onClick();
                      dismiss(item.id);
                    }}
                    className="mt-2 inline-flex min-h-[32px] items-center rounded-sm border border-strong bg-surface px-2.5 py-1 text-xs font-medium text-accent hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="rounded-sm p-1 text-primary-muted hover:bg-subtle hover:text-primary"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

