import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import { IconTile } from './IconTile';
import { radii, spacing, typography } from '../../theme/tokens';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'key-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing['3xl'],
          paddingHorizontal: spacing.xl,
          borderRadius: radii['2xl'],
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.line,
          backgroundColor: colors.surfaceMuted,
        },
        style,
      ]}
    >
      <IconTile variant="muted" size={52}>
        <Ionicons name={icon} size={26} color={colors.inkSubtle} />
      </IconTile>
      <Text
        style={{
          marginTop: spacing.lg,
          fontSize: typography.body,
          fontWeight: typography.weights.semibold,
          color: colors.ink,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            marginTop: spacing.sm,
            maxWidth: 280,
            fontSize: typography.body,
            lineHeight: 20,
            color: colors.inkMuted,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={{ marginTop: spacing.xl, alignSelf: 'center' }}
        />
      ) : null}
    </View>
  );
};
