import React from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import { IconTile } from './IconTile';
import { radii, shadows, spacing, touch, typography } from '../../theme/tokens';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
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
  subtitle,
  icon,
  children,
  footer,
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const maxHeight = size === 'sm' ? height * 0.6 : size === 'lg' ? height * 0.92 : height * 0.82;
  const isConfirm = type === 'confirm';

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleConfirm = () => {
    if (!loading) onConfirm?.();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View
            style={{
              maxHeight,
              backgroundColor: colors.surfaceRaised,
              borderTopLeftRadius: radii['3xl'],
              borderTopRightRadius: radii['3xl'],
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.line,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              overflow: 'hidden',
              ...shadows.pop,
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
              <View style={{ width: 44, height: 5, borderRadius: radii.pill, backgroundColor: colors.lineStrong }} />
            </View>

            {(title || showCloseButton) ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.lg,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                }}
              >
                {isConfirm ? (
                  <IconTile variant="danger" size={44}>
                    <Ionicons name="alert-circle-outline" size={22} color={colors.dangerText} />
                  </IconTile>
                ) : icon ? (
                  <IconTile size={44}>{icon}</IconTile>
                ) : null}

                <View style={{ flex: 1, minWidth: 0 }}>
                  {title ? (
                    <Text numberOfLines={1} style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink }}>
                      {title}
                    </Text>
                  ) : null}
                  {subtitle ? (
                    <Text style={{ marginTop: 2, fontSize: typography.label, color: colors.inkMuted }}>{subtitle}</Text>
                  ) : null}
                </View>

                {showCloseButton ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                    style={{
                      width: touch.minimum,
                      height: touch.minimum,
                      borderRadius: radii.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surfaceMuted,
                      opacity: loading ? 0.5 : 1,
                    }}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Ionicons name="close" size={20} color={colors.inkMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {isConfirm ? (
              <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
                {message ? (
                  <Text style={{ fontSize: typography.body, lineHeight: 22, color: colors.inkMuted }}>{message}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing['2xl'] }}>
                  <Button title={cancelText} onPress={handleClose} variant="ghost" style={{ flex: 1 }} disabled={loading} />
                  <Button
                    title={confirmText}
                    onPress={handleConfirm}
                    variant={confirmVariant}
                    style={{ flex: 1 }}
                    loading={loading}
                    disabled={loading}
                  />
                </View>
              </View>
            ) : (
              <>
                <ScrollView
                  style={{ flexShrink: 1 }}
                  contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['2xl'] }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {children}
                </ScrollView>
                {footer ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: spacing.md,
                      paddingHorizontal: spacing.xl,
                      paddingVertical: spacing.lg,
                      borderTopWidth: 1,
                      borderTopColor: colors.line,
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    {footer}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};
