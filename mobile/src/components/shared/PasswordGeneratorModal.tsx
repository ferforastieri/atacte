import React, { useEffect, useMemo, useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { secureRandomInt } from '../../utils/secureRandom';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { HeroCard } from './HeroCard';
import { PasswordStrength } from './PasswordStrength';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface PasswordGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onPasswordGenerated: (password: string) => void;
  initialPassword?: string;
}

type OptionKey = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  visible,
  onClose,
  onPasswordGenerated,
  initialPassword = '',
}) => {
  const { colors } = useTheme();
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [length, setLength] = useState('16');
  const [options, setOptions] = useState<Record<OptionKey, boolean>>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const strengthScore = useMemo(() => {
    if (!password) return undefined;
    let score = 0;
    if (password.length >= 12) score += 1;
    if (password.length >= 20) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(4, score);
  }, [password]);

  const generatePassword = () => {
    const lengthNum = Math.min(64, Math.max(8, parseInt(length, 10) || 16));
    setLength(String(lengthNum));

    const charsetMap: Record<OptionKey, string> = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*',
    };
    const selected = (Object.keys(options) as OptionKey[]).filter((key) => options[key]);
    if (selected.length === 0) {
      setPassword('');
      return;
    }

    const required = selected.map((key) => charsetMap[key].charAt(secureRandomInt(charsetMap[key].length)));
    const charset = selected.map((key) => charsetMap[key]).join('');
    const rest = Array.from({ length: Math.max(0, lengthNum - required.length) }, () => charset.charAt(secureRandomInt(charset.length)));
    const all = [...required, ...rest];
    for (let index = all.length - 1; index > 0; index -= 1) {
      const swap = secureRandomInt(index + 1);
      [all[index], all[swap]] = [all[swap], all[index]];
    }
    setPassword(all.join(''));
    setShowPassword(true);
    setCopied(false);
  };

  useEffect(() => {
    if (!visible) return;
    setShowPassword(false);
    if (initialPassword) {
      setPassword(initialPassword);
    } else {
      generatePassword();
    }
  }, [visible, initialPassword]);

  const handleCopy = async () => {
    if (!password || isCopying) return;
    setIsCopying(true);
    try {
      await Clipboard.setStringAsync(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } finally {
      setIsCopying(false);
    }
  };

  const handleUse = () => {
    if (password) {
      onPasswordGenerated(password);
      onClose();
    }
  };

  const optionRows: Array<{ key: OptionKey; label: string; description: string; sample: string }> = [
    { key: 'uppercase', label: 'Maiúsculas', description: 'A-Z', sample: 'A' },
    { key: 'lowercase', label: 'Minúsculas', description: 'a-z', sample: 'a' },
    { key: 'numbers', label: 'Números', description: '0-9', sample: '7' },
    { key: 'symbols', label: 'Símbolos', description: '!@#$%^&*', sample: '#' },
  ];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Gerador de Senha"
      subtitle="Crie uma senha forte e única em segundos"
      icon={<Ionicons name="sparkles-outline" size={22} color={colors.primarySoftText} />}
      size="lg"
      footer={(
        <>
          <Button title="Cancelar" onPress={onClose} variant="ghost" style={{ flex: 1, minWidth: 96 }} />
          <Button title="Gerar outra" onPress={generatePassword} variant="secondary" style={{ flex: 1, minWidth: 96 }} />
          <Button title="Usar senha" onPress={handleUse} disabled={!password} style={{ flex: 1, minWidth: 96 }} />
        </>
      )}
    >
      <HeroCard padding="md" style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Text
            numberOfLines={3}
            style={{
              flex: 1,
              minHeight: 56,
              color: colors.heroText,
              fontFamily: typography.mono,
              fontSize: 18,
              lineHeight: 27,
              letterSpacing: 1,
            }}
          >
            {password ? (showPassword ? password : '•'.repeat(Math.min(password.length, 28))) : 'Clique em gerar...'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            style={{ width: touch.minimum, height: touch.minimum, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setShowPassword((current) => !current)}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.heroMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Copiar senha"
            accessibilityState={{ busy: isCopying, disabled: !password || isCopying }}
            style={{ width: touch.minimum, height: touch.minimum, alignItems: 'center', justifyContent: 'center' }}
            onPress={handleCopy}
            disabled={!password || isCopying}
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? colors.accent : colors.heroMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <PasswordStrength score={strengthScore} onHero />
        </View>
      </HeroCard>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Comprimento"
            value={length}
            onChangeText={setLength}
            keyboardType="numeric"
            style={{ marginBottom: 0 }}
          />
        </View>
        <Text style={{ marginBottom: 14, color: colors.inkMuted, fontSize: typography.label }}>8 a 64</Text>
      </View>

      <Text style={{ fontSize: typography.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.sm }}>
        Incluir caracteres
      </Text>

      <View style={{ gap: spacing.sm }}>
        {optionRows.map((option) => {
          const active = options[option.key];
          return (
            <TouchableOpacity
              key={option.key}
              accessibilityRole="switch"
              accessibilityState={{ checked: active }}
              style={{
                minHeight: 60,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.line,
                backgroundColor: active ? colors.primarySoft : colors.surface,
              }}
              onPress={() => setOptions((current) => ({ ...current, [option.key]: !current[option.key] }))}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? colors.primary : colors.surfaceMuted,
                  }}
                >
                  <Text style={{ fontFamily: typography.mono, fontSize: typography.body, fontWeight: typography.weights.bold, color: active ? colors.onPrimary : colors.inkMuted }}>
                    {option.sample}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: typography.body, fontWeight: typography.weights.medium, color: colors.ink }}>{option.label}</Text>
                  <Text style={{ fontSize: typography.label, color: colors.inkMuted }}>{option.description}</Text>
                </View>
              </View>
              <Switch
                value={active}
                onValueChange={(value) => setOptions((current) => ({ ...current, [option.key]: value }))}
                trackColor={{ false: colors.lineStrong, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
};
