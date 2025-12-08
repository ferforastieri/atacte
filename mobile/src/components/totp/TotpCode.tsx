import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../shared/Button';
import * as Clipboard from 'expo-clipboard';
import { TOTPClient, type TOTPCode } from '../../utils/totpClient';

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
  const { isDark } = useTheme();
  const [currentCode, setCurrentCode] = useState<string>('');
  const [currentTimeRemaining, setCurrentTimeRemaining] = useState<number>(30);
  const [currentPeriod, setCurrentPeriod] = useState<number>(30);

  
  const generateTotpCode = () => {
    if (!secret) return;
    
    try {
      const totpData = TOTPClient.generateCurrentCode(secret);
      setCurrentCode(totpData.code);
      setCurrentTimeRemaining(totpData.timeRemaining);
      setCurrentPeriod(totpData.period);
    } catch (error) {
      console.error('Erro ao gerar código TOTP:', error);
      setCurrentCode('------');
    }
  };

  
  const displayCode = currentCode || code || '------';
  const displayTimeRemaining = currentTimeRemaining || timeRemaining || 30;
  const displayPeriod = currentPeriod || period || 30;

  useEffect(() => {
    if (secret) {
      generateTotpCode();
    } else {
      setCurrentTimeRemaining(timeRemaining);
    }
  }, [secret, timeRemaining]);

  useEffect(() => {
    if (secret) {
      
      const timer = setInterval(() => {
        generateTotpCode();
      }, 1000);

      return () => clearInterval(timer);
    } else {
      
      if (displayTimeRemaining <= 0) return;

      const timer = setInterval(() => {
        setCurrentTimeRemaining(prev => {
          if (prev <= 1) {
            onRefresh?.();
            return displayPeriod;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [secret, displayTimeRemaining, displayPeriod, onRefresh]);

  const formattedCode = displayCode ? displayCode.replace(/(.{3})/g, '$1 ').trim() : '------';
  const progress = (displayTimeRemaining / displayPeriod) * 100;

  const handleCopy = async () => {
    if (displayCode && displayCode !== '------') {
      try {
        await Clipboard.setStringAsync(displayCode);
        onCopy?.();
      } catch (error) {
        console.error('Erro ao copiar código:', error);
      }
    }
  };

  const handleRefresh = () => {
    if (secret) {
      
      generateTotpCode();
    } else {
      
      onRefresh?.();
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      padding: 24,
      gap: 16,
    },
    codeWrapper: {
      position: 'relative',
      alignItems: 'center',
    },
    code: {
      fontFamily: 'monospace',
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      backgroundColor: isDark ? '#374151' : '#f9fafb',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      letterSpacing: 4,
      color: isDark ? '#f9fafb' : '#111827',
      opacity: currentTimeRemaining < 5 ? 0.7 : 1,
    },
    timerContainer: {
      position: 'absolute',
      top: -8,
      right: -8,
    },
    timer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 2,
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    timerInner: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerText: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    progressRing: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    actionButton: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.codeWrapper}>
        <Text style={styles.code}>{formattedCode}</Text>
        
        <View style={styles.timerContainer}>
          <View style={styles.timer}>
            <View style={styles.timerInner}>
              <Text style={styles.timerText}>{displayTimeRemaining}s</Text>
            </View>
            {/* Progress ring would go here if needed */}
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Copiar"
          onPress={handleCopy}
          variant="secondary"
          size="sm"
          style={styles.actionButton}
          disabled={!displayCode || displayCode === '------'}
        />
        <Button
          title="Atualizar"
          onPress={handleRefresh}
          variant="secondary"
          size="sm"
          style={styles.actionButton}
        />
      </View>
    </View>
  );
};
