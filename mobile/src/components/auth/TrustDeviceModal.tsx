import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../shared';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/auth/authService';
import { useAuth } from '../../contexts/AuthContext';

interface TrustDeviceModalProps {
  visible: boolean;
  sessionId: string;
  deviceName: string;
  ipAddress: string;
  onClose: () => void;
  onTrusted: () => void;
}

export default function TrustDeviceModal({
  visible,
  sessionId,
  deviceName,
  ipAddress,
  onClose,
  onTrusted,
}: TrustDeviceModalProps) {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const { logout, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleTrust = async () => {
    if (!sessionId) {
      showError('ID da sessão não encontrado');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.trustDevice(sessionId);
      if (response.success) {
        showSuccess('Dispositivo confiado com sucesso!');
        await refreshUser();
        onTrusted();
      } else {
        showError(response.message || 'Erro ao confiar dispositivo');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao confiar dispositivo';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    if (!isLoading) {
      await logout();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#fef3c7' }]}>
              <Ionicons name="shield-checkmark" size={32} color={isDark ? '#fbbf24' : '#f59e0b'} />
            </View>
            <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Confiar neste Dispositivo?
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Um novo dispositivo está tentando acessar sua conta. Deseja confiar neste dispositivo?
            </Text>
          </View>

          <View style={[styles.infoContainer, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}>
            <View style={styles.infoRow}>
              <Ionicons name="phone-portrait-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.infoText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                {deviceName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.infoText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                {ipAddress}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="Cancelar"
              onPress={handleClose}
              variant="ghost"
              disabled={isLoading}
              style={styles.button}
            />
            <Button
              title="Confiar"
              onPress={handleTrust}
              variant="primary"
              loading={isLoading}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
  },
  infoContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

