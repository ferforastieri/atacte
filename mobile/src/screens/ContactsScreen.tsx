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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoContacts from 'expo-contacts';
import { contactService, Contact } from '../services/contacts/contactService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type ContactsNavigationProp = StackNavigationProp<any>;

export default function ContactsScreen() {
  const navigation = useNavigation<ContactsNavigationProp>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadContacts();
  };

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

      Alert.alert('Sucesso', `${imported} contatos importados com sucesso!`);
      loadContacts();
    } catch (error) {
      console.error('Erro ao importar:', error);
      Alert.alert('Erro', 'Erro ao importar alguns contatos.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (contact: Contact) => {
    try {
      await contactService.updateContact(contact.id, {
        isFavorite: !contact.isFavorite,
      });
      loadContacts();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
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
              await contactService.deleteContact(contact.id);
              loadContacts();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o contato.');
            }
          },
        },
      ]
    );
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const displayName = `${item.firstName} ${item.lastName || ''}`.trim();
    const phoneNumber = item.phoneNumbers[0]?.number || 'Sem telefone';

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}
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
            <Text style={styles.contactName}>{displayName}</Text>
            {item.isFavorite && (
              <Ionicons name="star" size={16} color="#fbbf24" />
            )}
          </View>
          <Text style={styles.contactPhone}>{phoneNumber}</Text>
          {item.company && (
            <Text style={styles.contactCompany}>{item.company}</Text>
          )}
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity onPress={() => handleToggleFavorite(item)}>
            <Ionicons
              name={item.isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={item.isFavorite ? '#fbbf24' : '#9ca3af'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteContact(item)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contatos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Ionicons
              name={showFavoritesOnly ? 'star' : 'star-outline'}
              size={24}
              color={showFavoritesOnly ? '#fbbf24' : '#6b7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleImportFromDevice}>
            <Ionicons name="download-outline" size={24} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ContactForm')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar contatos..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadContacts}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhum contato encontrado</Text>
            <TouchableOpacity style={styles.importButton} onPress={handleImportFromDevice}>
              <Text style={styles.importButtonText}>Importar do Dispositivo</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: '#16a34a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContainer: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  contactCompany: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 24,
  },
  importButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

