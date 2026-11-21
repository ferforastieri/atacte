import React, { useEffect, useRef } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing } from '../../theme/tokens';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.95, duration: 850, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 850, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.line, opacity },
        style,
      ]}
    />
  );
};

export const SkeletonList: React.FC<{ rows?: number; avatar?: boolean; action?: boolean }> = ({
  rows = 4,
  avatar = true,
  action = false,
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
          }}
        >
          {avatar ? <Skeleton width={44} height={44} borderRadius={radii.lg} /> : null}
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Skeleton width={index % 2 === 0 ? '62%' : '48%'} height={14} />
            <Skeleton width={index % 3 === 0 ? '84%' : '70%'} height={12} />
          </View>
          {action ? <Skeleton width={64} height={32} borderRadius={radii.md} /> : null}
        </View>
      ))}
    </View>
  );
};

export const SkeletonCard: React.FC<{ showSecret?: boolean }> = ({ showSecret = false }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: spacing.xl,
        borderRadius: radii['2xl'],
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        gap: spacing.lg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <Skeleton width={44} height={44} borderRadius={radii.lg} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Skeleton width="58%" height={16} />
          <Skeleton width="76%" height={12} />
          <Skeleton width="44%" height={12} />
        </View>
        <Skeleton width={48} height={22} borderRadius={radii.pill} />
      </View>
      {showSecret ? <Skeleton width="100%" height={104} borderRadius={radii.lg} /> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Skeleton width={44} height={44} borderRadius={radii.lg} />
        <Skeleton width={88} height={44} borderRadius={radii.lg} />
        <Skeleton width="100%" height={44} borderRadius={radii.lg} style={{ flex: 1 }} />
      </View>
    </View>
  );
};

export const SkeletonNoteCard: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: spacing.xl,
        borderRadius: radii['2xl'],
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Skeleton width={44} height={44} borderRadius={radii.lg} />
        <Skeleton width="62%" height={16} />
      </View>
      <Skeleton width="100%" height={12} />
      <Skeleton width="92%" height={12} />
      <Skeleton width="70%" height={12} />
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
        <Skeleton width={86} height={22} borderRadius={radii.pill} />
        <Skeleton width={74} height={22} borderRadius={radii.pill} />
      </View>
    </View>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.line,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: spacing.lg, backgroundColor: colors.surfaceMuted }}>
        <Skeleton width="40%" height={12} />
      </View>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={{
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <Skeleton width={index % 2 === 0 ? '44%' : '52%'} height={14} />
            <Skeleton width={64} height={22} borderRadius={radii.pill} />
          </View>
          <Skeleton width="74%" height={11} />
        </View>
      ))}
    </View>
  );
};

export const SkeletonDetail: React.FC<{ showSecret?: boolean }> = ({ showSecret = true }) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.lg, padding: spacing.screen }}>
      <Skeleton width="42%" height={12} />
      <Skeleton width="64%" height={28} />
      {showSecret ? <Skeleton width="100%" height={98} borderRadius={radii['2xl']} /> : null}
      {[0, 1].map((index) => (
        <View
          key={index}
          style={{
            padding: spacing.xl,
            borderRadius: radii['2xl'],
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
            gap: spacing.md,
          }}
        >
          <Skeleton width="36%" height={16} />
          <Skeleton width="92%" height={12} />
          <Skeleton width="78%" height={12} />
          <Skeleton width="54%" height={12} />
        </View>
      ))}
    </View>
  );
};

export const SkeletonLoader: React.FC<{
  variant?: 'default' | 'dashboard' | 'profile' | 'secureNotes';
}> = ({ variant = 'default' }) => {
  if (variant === 'dashboard') {
    return (
      <View style={{ flex: 1, padding: spacing.screen, gap: spacing.md }}>
        <Skeleton width="100%" height={48} borderRadius={radii.lg} />
        {[0, 1, 2, 3].map((index) => (
          <SkeletonCard key={index} showSecret={index === 1} />
        ))}
      </View>
    );
  }

  if (variant === 'secureNotes') {
    return (
      <View style={{ flex: 1, padding: spacing.screen, gap: spacing.md }}>
        <Skeleton width="100%" height={48} borderRadius={radii.lg} />
        <Skeleton width="100%" height={48} borderRadius={radii.lg} />
        {[0, 1, 2].map((index) => (
          <SkeletonNoteCard key={index} />
        ))}
      </View>
    );
  }

  if (variant === 'profile') {
    return <SkeletonDetail showSecret={false} />;
  }

  return (
    <View style={{ flex: 1, padding: spacing.screen }}>
      <SkeletonList rows={5} />
    </View>
  );
};
