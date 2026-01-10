import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contactService, Contact } from '../services/contacts/contactService';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type ContactDetailRouteProp = RouteProp<{ ContactDetail: { contactId: string } }, 'ContactDetail'>;
type ContactDetailNavigationProp = StackNavigationProp<any>;

export default function ContactDetailScreen() {
  const navigation = useNavigation<ContactDetailNavigationProp>();
  const route = useRoute<ContactDetailRouteProp>();
  const { contactId } = route.params;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const response = await contactService.getContactById(contactId);
      if (response.success && response.data) {
        setContact(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar contato:', error);
      Alert.alert('Erro', 'Não foi possível carregar o contato.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleEdit = () => {
    navigation.navigate('ContactForm', { contactId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Contato',
      `Deseja realmente excluir ${contact?.firstName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await contactService.deleteContact(contactId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o contato.');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!contact) return;
    try {
      await contactService.updateContact(contact.id, {
        isFavorite: !contact.isFavorite,
      });
      loadContact();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  };

  if (loading || !contact) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  const displayName = `${contact.firstName} ${contact.lastName || ''}`.trim();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Ionicons
              name={contact.isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={contact.isFavorite ? '#fbbf24' : '#6b7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          {contact.imageUrl ? (
            <Image source={{ uri: contact.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {contact.firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{displayName}</Text>
          {contact.company && <Text style={styles.company}>{contact.company}</Text>}
          {contact.jobTitle && <Text style={styles.jobTitle}>{contact.jobTitle}</Text>}
        </View>

        {contact.phoneNumbers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Telefones</Text>
            {contact.phoneNumbers.map((phone, index) => (
              <TouchableOpacity
                key={index}
                style={styles.item}
                onPress={() => handleCall(phone.number)}
              >
                <Ionicons name="call-outline" size={20} color="#16a34a" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{phone.label}</Text>
                  <Text style={styles.itemValue}>{phone.number}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {contact.emails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>E-mails</Text>
            {contact.emails.map((email, index) => (
              <TouchableOpacity
                key={index}
                style={styles.item}
                onPress={() => handleEmail(email.email)}
              >
                <Ionicons name="mail-outline" size={20} color="#16a34a" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{email.label}</Text>
                  <Text style={styles.itemValue}>{email.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {contact.addresses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereços</Text>
            {contact.addresses.map((address, index) => (
              <View key={index} style={styles.item}>
                <Ionicons name="location-outline" size={20} color="#16a34a" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{address.label}</Text>
                  <Text style={styles.itemValue}>
                    {[address.street, address.city, address.state, address.postalCode, address.country]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {contact.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{contact.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  company: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  jobTitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  itemValue: {
    fontSize: 16,
    color: '#111827',
    marginTop: 2,
  },
  notesContainer: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

