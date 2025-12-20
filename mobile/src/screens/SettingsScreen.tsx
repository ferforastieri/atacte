import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, BackHandler, Image } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Header, Modal } from '../components/shared';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { userService } from '../services/users/userService';
import { useToast } from '../hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import axios from '../lib/axios';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDark, toggleTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const { showError, showSuccess } = useToast();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  const handleBack = () => {
    if ('jumpTo' in navigation) {
      (navigation as { jumpTo: (screen: string) => void }).jumpTo('Profile');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await userService.getUserProfile();
      if (response.success && response.data) {
        const profileData = response.data;
        setName(profileData.name || '');
        setPhoneNumber(profileData.phoneNumber || '');
        setProfilePicture(profileData.profilePicture || '');
      }
    } catch (error) {
      showError('Erro ao carregar dados do perfil');
      if (user) {
        setName(user.name || '');
        setPhoneNumber(user.phoneNumber || '');
        setProfilePicture(user.profilePicture || '');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showError('Nome é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const response = await userService.updateUserProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        profilePicture: profilePicture.trim() || undefined,
      });

      if (response.success) {
        showSuccess('Perfil atualizado com sucesso!');
        await refreshUser();
      } else {
        showError(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error: unknown) {
      showError('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const requestImagePickerPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Precisamos de permissão para acessar suas fotos.');
      return false;
    }
    return true;
  };

  const handlePickImage = () => {
    setShowImagePickerModal(true);
  };

  const handleCameraPick = async () => {
    setShowImagePickerModal(false);
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      showError('Precisamos de permissão para acessar a câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  };

  const handleGalleryPick = async () => {
    setShowImagePickerModal(false);
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setIsUploadingImage(true);
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        showError('Arquivo de imagem não encontrado');
        setIsUploadingImage(false);
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      const extension = uri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') {
        mimeType = 'image/png';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      } else if (extension === 'webp') {
        mimeType = 'image/webp';
      }
      
      const base64data = `data:${mimeType};base64,${base64}`;
      setProfilePicture(base64data);
      setIsUploadingImage(false);
      showSuccess('Imagem selecionada com sucesso');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao processar imagem:', error);
      showError(`Erro ao processar imagem: ${errorMessage}`);
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setProfilePicture('');
  };

  const settingsSections = [
    {
      title: 'Perfil',
      items: [
        {
          label: 'Nome',
          type: 'input',
          value: name,
          onChangeText: setName,
          placeholder: 'Digite seu nome',
        },
        {
          label: 'Telefone',
          type: 'input',
          value: phoneNumber,
          onChangeText: setPhoneNumber,
          placeholder: 'Digite seu telefone',
          keyboardType: 'phone-pad',
        },
        {
          label: 'Foto de Perfil',
          type: 'image',
          value: profilePicture,
          onPickImage: handlePickImage,
          onRemoveImage: handleRemoveImage,
          isUploading: isUploadingImage,
        },
        {
          label: 'Salvar',
          type: 'button',
          onPress: handleSaveProfile,
          isLoading: isLoading,
        },
      ],
    },
    {
      title: 'Aparência',
      items: [
        {
          label: 'Modo Escuro',
          type: 'switch',
          value: isDark,
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'Sobre',
      items: [
        {
          label: 'Versão do App',
          type: 'text',
          value: Constants.expoConfig?.version || Constants.expoConfig?.runtimeVersion || 'N/A',
        },
      ],
    },
  ];

  interface SettingItem {
    label: string;
    type: 'switch' | 'text' | 'input' | 'image' | 'button';
    value?: boolean | string;
    onChangeText?: (text: string) => void;
    onToggle?: (value: boolean) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'phone-pad';
    onPickImage?: () => void;
    onRemoveImage?: () => void;
    isUploading?: boolean;
    onPress?: () => void;
    isLoading?: boolean;
    isDestructive?: boolean;
  }

  const renderSettingItem = (item: SettingItem, index: number, sectionItems: SettingItem[]) => {
    const isLastItem = index === sectionItems.length - 1;
    return (
      <View key={index} style={[
        styles.settingItem, 
        isDark && styles.settingItemDark,
        isLastItem && styles.settingItemLast,
        item.type === 'image' && styles.settingItemImage
      ]}>
        {item.type !== 'image' && (
          <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>
            {item.label}
          </Text>
        )}
        
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ 
              false: isDark ? '#374151' : '#d1d5db', 
              true: isDark ? '#22c55e' : '#22c55e' 
            }}
            thumbColor={item.value ? '#ffffff' : isDark ? '#6b7280' : '#ffffff'}
            ios_backgroundColor={isDark ? '#374151' : '#d1d5db'}
          />
        )}
        
        {item.type === 'text' && (
          <Text style={[styles.settingValue, isDark && styles.settingValueDark]}>
            {item.value}
          </Text>
        )}
        
        {item.type === 'input' && (
          <TextInput
            style={[
              styles.input,
              isDark && styles.inputDark,
            ]}
            value={item.value}
            onChangeText={item.onChangeText}
            placeholder={item.placeholder}
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            keyboardType={item.keyboardType || 'default'}
            editable={true}
          />
        )}
        
        {item.type === 'image' && (
          <View style={styles.imageRow}>
            <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>
              {item.label}
            </Text>
            <View style={styles.imageContainer}>
              {item.value ? (
                <TouchableOpacity 
                  onPress={item.onPickImage}
                  disabled={item.isUploading}
                  activeOpacity={0.7}
                >
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: item.value }} 
                      style={styles.imagePreview}
                    />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={24} color="#ffffff" />
                      <Text style={styles.imageOverlayText}>Trocar foto</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        item.onRemoveImage();
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[
                    styles.imagePickerButton,
                    isDark && styles.imagePickerButtonDark,
                    item.isUploading && styles.imagePickerButtonDisabled
                  ]}
                  onPress={item.onPickImage}
                  disabled={item.isUploading}
                >
                  {item.isUploading ? (
                    <Text style={[styles.imagePickerButtonText, isDark && styles.imagePickerButtonTextDark]}>
                      Processando...
                    </Text>
                  ) : (
                    <>
                      <Ionicons 
                        name="camera-outline" 
                        size={24} 
                        color={isDark ? '#9ca3af' : '#6b7280'} 
                      />
                      <Text style={[styles.imagePickerButtonText, isDark && styles.imagePickerButtonTextDark]}>
                        Selecionar Foto
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        {item.type === 'button' && (
          <TouchableOpacity 
            onPress={item.onPress}
            disabled={item.isLoading}
            style={[
              styles.button,
              item.isDestructive && styles.buttonDestructive,
              item.isLoading && styles.buttonDisabled
            ]}
          >
            <Text style={[
              styles.buttonText,
              isDark && styles.buttonTextDark,
              item.isDestructive && styles.buttonTextDestructive,
              item.isLoading && styles.buttonTextDisabled
            ]}>
              {item.isLoading ? 'Salvando...' : item.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Header 
        title="Configurações" 
        showBackButton={true}
        onBack={handleBack}
        showThemeToggle={true}
        onThemeToggle={toggleTheme}
      />
      
      <ScrollView style={styles.scrollView}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {section.title}
            </Text>
            
            <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex, section.items))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showImagePickerModal}
        onClose={() => setShowImagePickerModal(false)}
        type="default"
        title="Selecionar Foto"
        size="sm"
      >
        <View style={styles.imagePickerModalContent}>
          <TouchableOpacity 
            style={[styles.imagePickerOption, isDark && styles.imagePickerOptionDark]}
            onPress={handleCameraPick}
          >
            <Ionicons name="camera-outline" size={24} color={isDark ? '#22c55e' : '#22c55e'} />
            <Text style={[styles.imagePickerOptionText, isDark && styles.imagePickerOptionTextDark]}>
              Câmera
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.imagePickerOption, isDark && styles.imagePickerOptionDark]}
            onPress={handleGalleryPick}
          >
            <Ionicons name="images-outline" size={24} color={isDark ? '#22c55e' : '#22c55e'} />
            <Text style={[styles.imagePickerOptionText, isDark && styles.imagePickerOptionTextDark]}>
              Galeria
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionContentDark: {
    backgroundColor: '#1f2937',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingItemDark: {
    borderBottomColor: '#374151',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  settingLabelDark: {
    color: '#f9fafb',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  settingValueDark: {
    color: '#9ca3af',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputDark: {
    color: '#f9fafb',
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#fff',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
  buttonTextDisabled: {
    color: '#fff',
  },
  settingItemImage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageContainer: {
    alignItems: 'flex-end',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    zIndex: 10,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  imagePickerButtonDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  imagePickerButtonDisabled: {
    opacity: 0.5,
  },
  imagePickerButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  imagePickerButtonTextDark: {
    color: '#9ca3af',
  },
  imagePickerModalContent: {
    gap: 12,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  imagePickerOptionDark: {
    backgroundColor: '#374151',
  },
  imagePickerOptionText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  imagePickerOptionTextDark: {
    color: '#f9fafb',
  },
});

export default SettingsScreen;