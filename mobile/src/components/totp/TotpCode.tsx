import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { HeroCard } from '../shared/HeroCard';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';
import { TOTPClient } from '../../utils/totpClient';

interface TotpCodeProps {
  secret?: string;
  code?: string;
  timeRemaining?: number;
  period?: number;
  onRefresh?: () => void;
  onCopy?: () => void;
}

export const TotpCode: React.FC<TotpCodeProps> = ({
  secret,
  code,
  timeRemaining = 0,
  period = 30,
  onRefresh,
  onCopy,
}) => {
  const { colors } = useTheme();
  const [currentCode, setCurrentCode] = useState('');
  const [currentTimeRemaining, setCurrentTimeRemaining] = useState(timeRemaining || 30);
  const [currentPeriod, setCurrentPeriod] = useState(period || 30);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateTotpCode = () => {
    if (!secret) return;
    try {
      const totpData = TOTPClient.generateCurrentCode(secret);
      setCurrentCode(totpData.code);
      setCurrentTimeRemaining(totpData.timeRemaining);
      setCurrentPeriod(totpData.period);
    } catch {
      setCurrentCode('------');
    }
  };

  const displayCode = currentCode || code || '------';
  const displayTimeRemaining = currentTimeRemaining || timeRemaining || 0;
  const displayPeriod = currentPeriod || period || 30;
  const formattedCode = displayCode ? displayCode.replace(/(.{3})/g, '$1 ').trim() : '------';
  const progress = Math.max(0, Math.min(100, (displayTimeRemaining / displayPeriod) * 100));

  useEffect(() => {
    if (secret) {
      generateTotpCode();
      const timer = setInterval(generateTotpCode, 1000);
      return () => clearInterval(timer);
    }

    setCurrentTimeRemaining(timeRemaining);
    if (!timeRemaining) return undefined;

    const timer = setInterval(() => {
      setCurrentTimeRemaining((previous) => {
        if (previous <= 1) {
          onRefresh?.();
          return period || 30;
        }
        return previous - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secret, timeRemaining, period]);

  const handleCopy = async () => {
    if (!displayCode || displayCode === '------' || isCopying) return;
    const cleanCode = displayCode.replace(/\D/g, '').slice(0, 6);
    if (cleanCode.length !== 6) return;

    setIsCopying(true);
    try {
      await Clipboard.setStringAsync(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      onCopy?.();
    } catch {
      // Keep the code visible even if the clipboard is unavailable.
    } finally {
      setIsCopying(false);
    }
  };

  const handleRefresh = () => {
    if (secret) generateTotpCode();
    onRefresh?.();
  };

  return (
    <HeroCard padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text style={{ color: colors.heroMuted, fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.8 }}>
          CÓDIGO ATUAL
        </Text>
        <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: colors.heroBar }}>
          <Text style={{ color: colors.heroText, fontSize: typography.caption, fontWeight: typography.weights.semibold }}>
            {displayTimeRemaining}s
          </Text>
        </View>
      </View>

      <Text
        style={{
          marginTop: spacing.sm,
          color: colors.heroText,
          fontSize: 34,
          lineHeight: 44,
          textAlign: 'center',
          letterSpacing: 4,
          fontFamily: typography.mono,
          fontWeight: typography.weights.bold,
        }}
      >
        {formattedCode}
      </Text>

      <View style={{ height: 6, borderRadius: radii.pill, backgroundColor: colors.heroBar, overflow: 'hidden', marginTop: spacing.md }}>
        <View style={{ width: `${progress}%`, height: '100%', borderRadius: radii.pill, backgroundColor: colors.accent }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Atualizar código TOTP"
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
          }}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={16} color={colors.heroMuted} />
          <Text style={{ color: colors.heroMuted, fontSize: typography.label, fontWeight: typography.weights.medium }}>Atualizar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Copiar código TOTP"
          accessibilityState={{ disabled: displayCode === '------' || isCopying, busy: isCopying }}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            backgroundColor: colors.heroBar,
            opacity: displayCode === '------' ? 0.45 : 1,
          }}
          onPress={handleCopy}
          disabled={displayCode === '------' || isCopying}
        >
          {isCopying ? (
            <ActivityIndicator size="small" color={colors.heroText} />
          ) : (
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? colors.accent : colors.heroText} />
          )}
          <Text style={{ color: colors.heroText, fontSize: typography.label, fontWeight: typography.weights.semibold }}>
            {copied ? 'Copiado' : 'Copiar'}
          </Text>
        </TouchableOpacity>
      </View>
    </HeroCard>
  );
};
