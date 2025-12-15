import React from 'react';
import { View, Text, TouchableOpacity, Modal as RNModal, StyleSheet, ScrollView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
  
  type?: 'default' | 'confirm';
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmVariant?: 'primary' | 'danger' | 'secondary' | 'ghost';
  loading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  type = 'default',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  confirmVariant = 'primary',
  loading = false,
}) => {
  const { isDark } = useTheme();
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  const getModalStyle = () => {
    const baseStyle = {
      ...styles.modal,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    };
    
    
    const availableHeight = screenHeight - insets.top - insets.bottom - 40; 
    const maxHeight = Math.min(availableHeight, screenHeight * 0.9);
    
    switch (size) {
      case 'sm':
        return [baseStyle, { 
          ...styles.modalSm, 
          maxHeight: Math.min(maxHeight, screenHeight * 0.6),
          maxWidth: Math.min(screenWidth - 32, 400)
        }];
      case 'lg':
        return [baseStyle, { 
          ...styles.modalLg, 
          maxHeight: Math.min(maxHeight, screenHeight * 0.9),
          maxWidth: Math.min(screenWidth - 32, 600)
        }];
      default:
        return [baseStyle, { 
          ...styles.modalMd, 
          maxHeight: Math.min(maxHeight, screenHeight * 0.8),
          maxWidth: Math.min(screenWidth - 32, 500)
        }];
    }
  };

  const getHeaderStyle = () => ({
    ...styles.header,
    borderBottomColor: isDark ? '#374151' : '#e5e7eb',
  });

  const getTitleStyle = () => ({
    ...styles.title,
    color: isDark ? '#f9fafb' : '#111827',
  });

  const getMessageStyle = () => ({
    ...styles.message,
    color: isDark ? '#f9fafb' : '#111827',
  });

  const handleConfirm = () => {
    if (!loading) {
      onConfirm?.();
    }
  };

  const renderContent = () => {
    if (type === 'confirm') {
      return (
        <View style={styles.confirmContent}>
          {message && <Text style={getMessageStyle()}>{message}</Text>}
          <View style={styles.confirmActions}>
            <Button
              title={cancelText}
              onPress={onClose}
              variant="ghost"
              style={styles.confirmButton}
            />
            <Button
              title={confirmText}
              onPress={handleConfirm}
              variant={confirmVariant}
              style={styles.confirmButton}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 20
        }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        nestedScrollEnabled={true}
      >
        {children}
      </ScrollView>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.overlayContent}>
            <View style={getModalStyle()}>
              {(title || showCloseButton) && type === 'default' && (
                <View style={getHeaderStyle()}>
                  {title && <Text style={getTitleStyle()}>{title}</Text>}
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {type === 'confirm' && title && (
                <View style={getHeaderStyle()}>
                  <Text style={getTitleStyle()}>{title}</Text>
                </View>
              )}
              
              {renderContent()}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modal: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modalSm: {
    width: '100%',
  },
  modalMd: {
    width: '100%',
  },
  modalLg: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
    flexGrow: 1,
  },
  confirmContent: {
    padding: 24,
    paddingBottom: 30,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
  },
});