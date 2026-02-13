import React, { createContext, useContext, ReactNode, useState } from 'react';
import { View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomToast from '../components/shared/CustomToast';
import { useTheme } from './ThemeContext';

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text1: string;
  text2: string;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', text1: string, text2: string) => {
    const id = Date.now().toString();
    const newToast: ToastData = { id, type, text1, text2 };
    
    setToasts(prev => [...prev, newToast]);

    
    setTimeout(() => {
      hideToast(id);
    }, type === 'error' ? 5000 : 4000);
  };

  const showSuccess = (message: string) => {
    showToast('success', 'Sucesso!', message);
  };

  const showError = (message: string) => {
    showToast('error', 'Erro!', message);
  };

  const showInfo = (message: string) => {
    showToast('info', 'Informação', message);
  };

  const showWarning = (message: string) => {
    showToast('warning', 'Atenção!', message);
  };

  const hideToast = (id?: string) => {
    if (id) {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    } else {
      setToasts([]);
    }
  };

  const value: ToastContextType = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast,
  };

  const onGestureEvent = (event: { nativeEvent: { translationX: number; state: number } }, toastId: string) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      if (Math.abs(translationX) > 100) {
        hideToast(toastId);
      }
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, paddingTop: insets.top }}>
        {toasts.map((toast, index) => (
          <PanGestureHandler
            key={toast.id}
            onGestureEvent={(event: { nativeEvent: { translationX: number; state: number } }) => onGestureEvent(event, toast.id)}
            onHandlerStateChange={(event: { nativeEvent: { translationX: number; state: number } }) => onGestureEvent(event, toast.id)}
          >
            <View style={{ marginTop: index === 0 ? 16 : 4 }}>
              <CustomToast
                type={toast.type}
                text1={toast.text1}
                text2={toast.text2}
                onHide={() => hideToast(toast.id)}
              />
            </View>
          </PanGestureHandler>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
