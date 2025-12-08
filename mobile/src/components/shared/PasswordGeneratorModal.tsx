import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PasswordGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onPasswordGenerated: (password: string) => void;
  initialPassword?: string;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  visible,
  onClose,
  onPasswordGenerated,
  initialPassword = '',
}) => {
  const { isDark } = useTheme();
  const { showSuccess } = useToast();
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [length, setLength] = useState('16');
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  
  React.useEffect(() => {
    if (initialPassword && visible) {
      setPassword(initialPassword);
    }
  }, [initialPassword, visible]);

  const generatePassword = () => {
    setIsGenerating(true);
    
    const lengthNum = parseInt(length, 10);
    if (isNaN(lengthNum) || lengthNum < 1 || lengthNum > 128) {
      showSuccess('Comprimento deve ser entre 1 e 128');
      setIsGenerating(false);
      return;
    }
    
    
    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*';
    
    if (charset.length === 0) {
      showSuccess('Selecione pelo menos um tipo de caractere');
      setIsGenerating(false);
      return;
    }
    
    
    let newPassword = '';
    for (let i = 0; i < lengthNum; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setPassword(newPassword);
    setShowPassword(true);
    setIsGenerating(false);
  };

  const handleUsePassword = () => {
    if (password) {
      onPasswordGenerated(password);
      onClose();
      showSuccess('Senha aplicada!');
    }
  };

  const handleCopyPassword = async () => {
    if (password) {
      try {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(password);
        showSuccess('Senha copiada!');
      } catch (error) {
        console.error('Erro ao copiar senha:', error);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      gap: 16,
      flex: 1,
    },
    passwordSection: {
      gap: 12,
    },
    passwordDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    passwordInput: {
      flex: 1,
    },
    copyButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      height: 48, 
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsSection: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    optionLabel: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 1,
    },
    lengthInput: {
      width: 80,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Gerador de Senha"
      size="lg"
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 20
        }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Senha Gerada */}
        <View style={styles.passwordSection}>
          <Text style={styles.sectionTitle}>Senha Gerada</Text>
          
          <View style={styles.passwordDisplay}>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Senha será gerada aqui..."
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isDark ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              }
            />
            <TouchableOpacity onPress={handleCopyPassword} style={styles.copyButton}>
              <Ionicons
                name="copy-outline"
                size={20}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Opções de Geração */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Opções de Geração</Text>

          {/* Comprimento */}
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Comprimento</Text>
            <Input
              value={length}
              onChangeText={setLength}
              keyboardType="numeric"
              style={styles.lengthInput}
            />
          </View>

          {/* Tipos de Caracteres */}
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Maiúsculas (A-Z)</Text>
            <Switch
              value={includeUppercase}
              onValueChange={setIncludeUppercase}
              trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
              thumbColor={includeUppercase ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Minúsculas (a-z)</Text>
            <Switch
              value={includeLowercase}
              onValueChange={setIncludeLowercase}
              trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
              thumbColor={includeLowercase ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Números (0-9)</Text>
            <Switch
              value={includeNumbers}
              onValueChange={setIncludeNumbers}
              trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
              thumbColor={includeNumbers ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Símbolos (!@#$...)</Text>
            <Switch
              value={includeSymbols}
              onValueChange={setIncludeSymbols}
              trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
              thumbColor={includeSymbols ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actions}>
          <Button
            title="Gerar"
            onPress={generatePassword}
            loading={isGenerating}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="Usar"
            onPress={handleUsePassword}
            disabled={!password}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};
