import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, TotpCode } from '../shared';
import { useTheme } from '../../contexts/ThemeContext';
import { totpService } from '../../services/totp/totpService';
import { useToast } from '../../hooks/useToast';
interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
}

interface TotpCardProps {
  password: PasswordEntry;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onCopyPassword: () => void;
  onCopyUsername: () => void;
}

export const TotpCard: React.FC<TotpCardProps> = ({
  password,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyPassword,
  onCopyUsername,
}) => {
  const { isDark } = useTheme();
  const { showSuccess } = useToast();
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [isLoadingTotp, setIsLoadingTotp] = useState(false);

  useEffect(() => {
    if (password.totpEnabled) {
      loadTotpSecret();
    }
  }, [password.totpEnabled, password.id]);

  const loadTotpSecret = async () => {
    if (!password.totpEnabled) return;
    
    setIsLoadingTotp(true);
    try {
      const response = await totpService.getTotpSecret(password.id);
      if (response.success && response.data?.secret) {
        setTotpSecret(response.data.secret);
      }
    } catch (error) {
      console.error('Erro ao carregar secret TOTP:', error);
    } finally {
      setIsLoadingTotp(false);
    }
  };

  const refreshTotpCode = async () => {
    await loadTotpSecret();
  };

  const handleTotpCopy = () => {
    showSuccess('Código TOTP copiado!');
  };

  const styles = StyleSheet.create({
    card: {
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    website: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 2,
    },
    username: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 2,
    },
    folder: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 4,
    },
    icons: {
      flexDirection: 'row',
      gap: 4,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    copyButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    favoriteButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      flex: 1,
    },
    totpContainer: {
      marginTop: 12,
    },
  });

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name}>{password.name}</Text>
            {password.website && (
              <Text style={styles.website}>{password.website}</Text>
            )}
            {password.username && (
              <Text style={styles.username}>@{password.username}</Text>
            )}
            {password.folder && (
              <Text style={styles.folder}>📁 {password.folder}</Text>
            )}
          </View>
          <View style={styles.icons}>
            {password.isFavorite && (
              <Ionicons name="heart" size={16} color="#dc2626" />
            )}
            {password.totpEnabled && (
              <Ionicons name="shield-checkmark" size={16} color="#2563eb" />
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {/* TOTP Code */}
      {password.totpEnabled && totpSecret && (
        <View style={styles.totpContainer}>
          <TotpCode
            secret={totpSecret}
            onRefresh={refreshTotpCode}
            onCopy={handleTotpCopy}
          />
        </View>
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
        {password.username && (
          <TouchableOpacity
            style={styles.copyButton}
            onPress={onCopyUsername}
          >
            <Ionicons name="person-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onToggleFavorite}
        >
          <Ionicons 
            name={password.isFavorite ? "heart" : "heart-outline"} 
            size={16} 
            color={password.isFavorite ? "#dc2626" : (isDark ? '#9ca3af' : '#6b7280')} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={onCopyPassword}
        >
          <View style={{
            backgroundColor: '#16a34a',
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 10,
            alignItems: 'center',
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 13,
              fontWeight: '500',
            }}>
              Copiar Senha
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Card>
  );
};
