import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoContacts from 'expo-contacts';
import { contactService, Contact } from '../services/contacts/contactService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header, Card, SearchInput } from '../components/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';

type ContactsNavigationProp = StackNavigationProp<any>;

export default function ContactsScreen() {
  const navigation = useNavigation<ContactsNavigationProp>();
  const { isDark, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadContacts();
    requestContactsPermission();
  }, [showFavoritesOnly]);

  const requestContactsPermission = async () => {
    const { status } = await ExpoContacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        'Precisamos de permissão para acessar seus contatos do dispositivo.'
      );
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await contactService.searchContacts({
        search: search || undefined,
        isFavorite: showFavoritesOnly || undefined,
      });

      if (response.success && response.data) {
        setContacts(response.data);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      showError('Erro ao carregar contatos');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadContacts();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        loadContacts();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, showFavoritesOnly]);

  const handleImportFromDevice = async () => {
    try {
      const { status } = await ExpoContacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para importar contatos.');
        return;
      }

      const { data } = await ExpoContacts.getContactsAsync({
        fields: [
          ExpoContacts.Fields.PhoneNumbers,
          ExpoContacts.Fields.Emails,
          ExpoContacts.Fields.Addresses,
          ExpoContacts.Fields.Birthday,
          ExpoContacts.Fields.Company,
          ExpoContacts.Fields.JobTitle,
          ExpoContacts.Fields.Note,
          ExpoContacts.Fields.Image,
        ],
      });

      if (data.length > 0) {
        Alert.alert(
          'Importar Contatos',
          `Encontramos ${data.length} contatos. Deseja importá-los?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Importar',
              onPress: () => importContacts(data),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao importar contatos:', error);
      Alert.alert('Erro', 'Não foi possível importar os contatos.');
    }
  };

  const importContacts = async (deviceContacts: ExpoContacts.Contact[]) => {
    try {
      setLoading(true);
      let imported = 0;

      for (const contact of deviceContacts) {
        if (!contact.firstName && !contact.name) continue;

        const phoneNumbers = contact.phoneNumbers?.map(p => ({
          label: p.label || 'mobile',
          number: p.number || '',
        })) || [];

        const emails = contact.emails?.map(e => ({
          label: e.label || 'home',
          email: e.email || '',
        })) || [];

        const addresses = contact.addresses?.map(a => ({
          label: a.label || 'home',
          street: a.street,
          city: a.city,
          state: a.region,
          postalCode: a.postalCode,
          country: a.country,
        })) || [];

        const response = await contactService.createContact({
          firstName: contact.firstName || contact.name || 'Sem Nome',
          lastName: contact.lastName,
          company: contact.company,
          jobTitle: contact.jobTitle,
          phoneNumbers,
          emails,
          addresses,
          birthday: contact.birthday?.toISOString(),
          notes: contact.note,
          imageUrl: contact.image?.uri,
        });

        if (response.success) {
          imported++;
        }
      }

      showSuccess(`${imported} contatos importados com sucesso!`);
      await loadContacts();
    } catch (error) {
      console.error('Erro ao importar:', error);
      Alert.alert('Erro', 'Erro ao importar alguns contatos.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (contact: Contact) => {
    try {
      const response = await contactService.updateContact(contact.id, {
        isFavorite: !contact.isFavorite,
      });
      if (response.success) {
        showSuccess(
          contact.isFavorite 
            ? 'Removido dos favoritos!' 
            : 'Adicionado aos favoritos!'
        );
        await loadContacts();
      } else {
        showError(response.message || 'Erro ao atualizar favorito');
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      showError('Erro ao atualizar favorito');
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      'Excluir Contato',
      `Deseja realmente excluir ${contact.firstName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await contactService.deleteContact(contact.id);
              if (response.success) {
                showSuccess('Contato excluído!');
                await loadContacts();
              } else {
                showError(response.message || 'Erro ao excluir contato');
              }
            } catch (error) {
              showError('Erro ao excluir contato');
            }
          },
        },
      ]
    );
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const displayName = `${item.firstName} ${item.lastName || ''}`.trim();
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'Sem telefone';

    return (
      <TouchableOpacity
        style={[styles.contactItem, isDark && styles.contactItemDark]}
        onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.contactAvatar}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactHeader}>
            <Text style={[styles.contactName, isDark && styles.contactNameDark]}>
              {displayName}
            </Text>
            {item.isFavorite && (
              <Ionicons name="star" size={16} color="#fbbf24" />
            )}
          </View>
          <Text style={[styles.contactPhone, isDark && styles.contactPhoneDark]}>
            {phoneNumber}
          </Text>
          {item.company && (
            <Text style={[styles.contactCompany, isDark && styles.contactCompanyDark]}>
              {item.company}
            </Text>
          )}
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity 
            onPress={() => handleToggleFavorite(item)}
            style={styles.actionButton}
          >
            <Ionicons
              name={item.isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={item.isFavorite ? '#fbbf24' : (isDark ? '#9ca3af' : '#6b7280')}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteContact(item)} 
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    searchContainer: {
      paddingTop: 20,
      marginBottom: 20,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: '#f3f4f6',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    filterButtonDark: {
      backgroundColor: '#374151',
      borderColor: '#4b5563',
    },
    filterButtonActive: {
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#6b7280',
    },
    filterButtonTextDark: {
      color: '#9ca3af',
    },
    listContainer: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    contactItemDark: {
      backgroundColor: '#1f2937',
      borderColor: '#374151',
    },
    contactAvatar: {
      marginRight: 12,
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#16a34a',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
    },
    contactInfo: {
      flex: 1,
    },
    contactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
    },
    contactNameDark: {
      color: '#f9fafb',
    },
    contactPhone: {
      fontSize: 14,
      color: '#6b7280',
      marginTop: 2,
    },
    contactPhoneDark: {
      color: '#9ca3af',
    },
    contactCompany: {
      fontSize: 12,
      color: '#9ca3af',
      marginTop: 2,
    },
    contactCompanyDark: {
      color: '#6b7280',
    },
    contactActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      padding: 4,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#16a34a',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 40,
      marginTop: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#6b7280',
      marginTop: 16,
    },
    emptyTitleDark: {
      color: '#f9fafb',
    },
    emptyText: {
      fontSize: 14,
      color: '#6b7280',
      marginTop: 8,
      textAlign: 'center',
    },
    emptyTextDark: {
      color: '#9ca3af',
    },
    importButton: {
      backgroundColor: '#16a34a',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 24,
    },
    importButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderEmpty = () => (
    <Card style={styles.emptyCard}>
      <Ionicons 
        name="people-outline" 
        size={48} 
        color={isDark ? '#6b7280' : '#9ca3af'}
      />
      <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
        {search || showFavoritesOnly ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
      </Text>
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        {search || showFavoritesOnly
          ? 'Tente ajustar os filtros de busca' 
          : 'Crie seu primeiro contato ou importe do dispositivo'}
      </Text>
      {!search && !showFavoritesOnly && (
        <TouchableOpacity style={styles.importButton} onPress={handleImportFromDevice}>
          <Text style={styles.importButtonText}>Importar do Dispositivo</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Header 
        title="Contatos" 
        onThemeToggle={toggleTheme}
        showRefreshButton
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <SearchInput
            placeholder="Buscar contatos..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, showFavoritesOnly && styles.filterButtonActive, isDark && styles.filterButtonDark]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Ionicons
              name={showFavoritesOnly ? 'star' : 'star-outline'}
              size={20}
              color={showFavoritesOnly ? '#fbbf24' : (isDark ? '#9ca3af' : '#6b7280')}
            />
            <Text style={[styles.filterButtonText, isDark && styles.filterButtonTextDark]}>
              Favoritos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, isDark && styles.filterButtonDark]}
            onPress={handleImportFromDevice}
          >
            <Ionicons name="download-outline" size={20} color="#16a34a" />
            <Text style={[styles.filterButtonText, isDark && styles.filterButtonTextDark]}>
              Importar
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ContactForm')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

