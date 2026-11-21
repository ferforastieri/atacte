import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { Logo } from './Logo';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showLogo?: boolean;
  showThemeToggle?: boolean;
  onThemeToggle?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showSettingsButton?: boolean;
  onSettingsPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  icon,
  showLogo = true,
  showThemeToggle = true,
  onThemeToggle,
  showBackButton = false,
  onBack,
  showRefreshButton = false,
  onRefresh,
  isRefreshing = false,
  showSettingsButton = false,
  onSettingsPress,
}) => {
  const { isDark, colors, toggleTheme } = useTheme();
  const navigation = useNavigation();

  const iconButton = (label: string, ionicon: keyof typeof Ionicons.glyphMap, onPress?: () => void, disabled = false) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: touch.minimum,
        height: touch.minimum,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceMuted,
        opacity: disabled ? 0.45 : 1,
      }}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Ionicons name={ionicon} size={20} color={disabled ? colors.inkSubtle : colors.inkMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <View
        style={{
          minHeight: 64,
          paddingHorizontal: spacing.screen,
          paddingVertical: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {showBackButton ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={{
                width: touch.minimum,
                height: touch.minimum,
                borderRadius: radii.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceMuted,
              }}
              onPress={onBack || (() => navigation.goBack())}
              activeOpacity={0.75}
            >
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            </TouchableOpacity>
          ) : null}

          {icon ? (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primarySoft,
              }}
            >
              {icon}
            </View>
          ) : showLogo ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Ir para o dashboard"
              onPress={() => {
                try {
                  if ('navigate' in navigation && typeof navigation.navigate === 'function') {
                    (navigation as { navigate: (screen: string, params?: { screen: string }) => void }).navigate('Main', { screen: 'Dashboard' });
                  }
                } catch {
                  // The header is also used outside the tab navigator.
                }
              }}
              activeOpacity={0.75}
            >
              <Logo size={38} showText={false} />
            </TouchableOpacity>
          ) : null}

          <View style={{ flex: 1, minWidth: 0 }}>
            {title ? (
              <Text numberOfLines={1} style={{ color: colors.ink, fontSize: typography.title, fontWeight: typography.weights.semibold }}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text numberOfLines={1} style={{ color: colors.inkMuted, fontSize: typography.label, marginTop: 1 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {showSettingsButton ? iconButton('Configurações', 'settings-outline', onSettingsPress) : null}
          {showRefreshButton ? iconButton('Atualizar', 'refresh', onRefresh, isRefreshing) : null}
          {showThemeToggle ? iconButton(isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro', isDark ? 'sunny' : 'moon', onThemeToggle || toggleTheme) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};
