import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, typography } from '../../theme/tokens';
import type { PasswordStrengthColorToken } from '../../utils/passwordGenerator';

interface PasswordStrengthProps {
  score?: number;
  label?: string;
  colorToken?: PasswordStrengthColorToken;
  onHero?: boolean;
}

const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Excelente'];

export const passwordScore = (password: string): number | undefined => {
  if (!password) return undefined;
  let score = password.length >= 8 ? 1 : 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 20) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ score, label, colorToken, onHero = false }) => {
  const { colors } = useTheme();
  const bars = score === undefined ? 0 : Math.max(0, Math.min(5, score + 1));
  const barColors = [colors.danger, colors.warning, colors.warning, colors.info, colors.primary];
  const resolvedTokenColor = colorToken ? colors[colorToken] : undefined;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: typography.label,
            fontWeight: typography.weights.medium,
            color: score === undefined ? (onHero ? colors.heroMuted : colors.inkMuted) : (onHero ? colors.heroText : resolvedTokenColor || barColors[Math.max(0, Math.min(4, score))]),
          }}
        >
          {label || (score === undefined ? 'Digite uma senha' : labels[score] || 'Desconhecida')}
        </Text>
        {score !== undefined ? (
          <Text style={{ fontSize: typography.caption, color: onHero ? colors.heroMuted : colors.inkSubtle }}>{score}/4</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3, 4].map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 6,
              borderRadius: radii.pill,
              backgroundColor: index < bars ? barColors[Math.max(0, Math.min(4, score ?? 0))] : (onHero ? colors.heroBar : colors.line),
            }}
          />
        ))}
      </View>
    </View>
  );
};
