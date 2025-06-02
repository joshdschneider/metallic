import * as ToastPrimitive from '@radix-ui/react-toast';
import { Button, Portal, Text, Theme } from '@radix-ui/themes';
import { FC, ReactNode, createContext, useCallback, useEffect, useRef, useState } from 'react';
import styles from './toast-provider.module.css';

interface ToastContextProps {
  toast: (toast: ToastProps) => void;
  updateToast: (id: string, updates: Partial<ToastProps>) => void;
}

export interface ToastProps {
  id: string;
  title: string;
  description: string;
  color?: 'red' | 'jade' | 'yellow';
  open?: boolean;
}

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);

  const toast = useCallback(({ id, color, title, description }: ToastProps) => {
    const newToast: ToastProps = { id, color, title, description, open: true };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastProps>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  useEffect(() => {
    containerRef.current = document.body;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, updateToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <Portal container={containerRef.current}>
          <Theme accentColor="blue" data-is-root-theme="false">
            <ToastPrimitive.Viewport className={styles.ToastViewport}>
              {toasts.map((t) => (
                <ToastPrimitive.Root
                  key={t.id}
                  data-color={t.color}
                  className={styles.ToastRoot}
                  duration={4000}
                  open={t.open}
                  onOpenChange={(open) =>
                    setToasts((prev) => prev.map((toast) => (toast.id === t.id ? { ...toast, open } : toast)))
                  }
                >
                  <ToastPrimitive.Title className={styles.ToastTitle} asChild>
                    <Text color={t.color}>{t.title}</Text>
                  </ToastPrimitive.Title>
                  <ToastPrimitive.Description className={styles.ToastDescription} asChild>
                    <Text color={t.color || 'gray'} size="2">
                      {t.description}
                    </Text>
                  </ToastPrimitive.Description>
                  <ToastPrimitive.Action asChild altText="Dismiss">
                    <Button
                      color={t.color || 'gray'}
                      highContrast={!t.color}
                      variant="surface"
                      style={{ gridArea: 'action' }}
                    >
                      Dismiss
                    </Button>
                  </ToastPrimitive.Action>
                </ToastPrimitive.Root>
              ))}
            </ToastPrimitive.Viewport>
          </Theme>
        </Portal>
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};
