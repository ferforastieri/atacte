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
import { Header, Card } from '../components/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';

type ContactDetailRouteProp = RouteProp<{ ContactDetail: { contactId: string } }, 'ContactDetail'>;
type ContactDetailNavigationProp = StackNavigationProp<any>;

export default function ContactDetailScreen() {
  const navigation = useNavigation<ContactDetailNavigationProp>();
  const route = useRoute<ContactDetailRouteProp>();
  const { contactId } = route.params;
  const { isDark, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();

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
              const response = await contactService.deleteContact(contactId);
              if (response.success) {
                showSuccess('Contato excluído!');
                navigation.goBack();
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

  const handleToggleFavorite = async () => {
    if (!contact) return;
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
        await loadContact();
      } else {
        showError(response.message || 'Erro ao atualizar favorito');
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      showError('Erro ao atualizar favorito');
    }
  };

  if (loading || !contact) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Header
          title="Contato"
          showBackButton
          onBack={() => navigation.goBack()}
          showThemeToggle
          onThemeToggle={toggleTheme}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Carregando...
          </Text>
        </View>
      </View>
    );
  }

  const displayName = `${contact.firstName} ${contact.lastName || ''}`.trim();

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Header
        title={displayName}
        showBackButton
        onBack={() => navigation.goBack()}
        showThemeToggle
        onThemeToggle={toggleTheme}
      />
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={contact.isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={contact.isFavorite ? '#fbbf24' : (isDark ? '#9ca3af' : '#6b7280')}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={24} color="#16a34a" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.profileSection}>
          {contact.imageUrl ? (
            <Image source={{ uri: contact.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {contact.firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.name, isDark && styles.nameDark]}>{displayName}</Text>
          {contact.company && (
            <Text style={[styles.company, isDark && styles.companyDark]}>
              {contact.company}
            </Text>
          )}
          {contact.jobTitle && (
            <Text style={[styles.jobTitle, isDark && styles.jobTitleDark]}>
              {contact.jobTitle}
            </Text>
          )}
        </Card>

        {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Telefones
            </Text>
            {contact.phoneNumbers.map((phone, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.item, isDark && styles.itemDark]}
                onPress={() => handleCall(phone.number)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={20} color="#16a34a" />
                <View style={styles.itemContent}>
                  <Text style={[styles.itemLabel, isDark && styles.itemLabelDark]}>
                    {phone.label}
                  </Text>
                  <Text style={[styles.itemValue, isDark && styles.itemValueDark]}>
                    {phone.number}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDark ? '#6b7280' : '#9ca3af'} 
                />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {contact.emails && contact.emails.length > 0 && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              E-mails
            </Text>
            {contact.emails.map((email, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.item, isDark && styles.itemDark]}
                onPress={() => handleEmail(email.email)}
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={20} color="#16a34a" />
                <View style={styles.itemContent}>
                  <Text style={[styles.itemLabel, isDark && styles.itemLabelDark]}>
                    {email.label}
                  </Text>
                  <Text style={[styles.itemValue, isDark && styles.itemValueDark]}>
                    {email.email}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDark ? '#6b7280' : '#9ca3af'} 
                />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {contact.addresses && contact.addresses.length > 0 && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Endereços
            </Text>
            {contact.addresses.map((address, index) => (
              <View key={index} style={[styles.item, isDark && styles.itemDark]}>
                <Ionicons name="location-outline" size={20} color="#16a34a" />
                <View style={styles.itemContent}>
                  <Text style={[styles.itemLabel, isDark && styles.itemLabelDark]}>
                    {address.label}
                  </Text>
                  <Text style={[styles.itemValue, isDark && styles.itemValueDark]}>
                    {[address.street, address.city, address.state, address.postalCode, address.country]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {contact.notes && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Notas
            </Text>
            <View style={[styles.notesContainer, isDark && styles.notesContainerDark]}>
              <Text style={[styles.notesText, isDark && styles.notesTextDark]}>
                {contact.notes}
              </Text>
            </View>
          </Card>
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
  containerDark: {
    backgroundColor: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  loadingTextDark: {
    color: '#9ca3af',
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
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
  nameDark: {
    color: '#f9fafb',
  },
  company: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  companyDark: {
    color: '#9ca3af',
  },
  jobTitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  jobTitleDark: {
    color: '#6b7280',
  },
  section: {
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#9ca3af',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemDark: {
    borderBottomColor: '#374151',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  itemLabelDark: {
    color: '#6b7280',
  },
  itemValue: {
    fontSize: 16,
    color: '#111827',
    marginTop: 2,
  },
  itemValueDark: {
    color: '#f9fafb',
  },
  notesContainer: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  notesContainerDark: {
    backgroundColor: '#374151',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  notesTextDark: {
    color: '#d1d5db',
  },
});

