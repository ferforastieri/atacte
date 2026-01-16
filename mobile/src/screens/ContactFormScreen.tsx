import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contactService, Contact, PhoneNumber, Email } from '../services/contacts/contactService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';

export default function ContactFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { contactId } = (route.params as { contactId?: string }) || {};
  const { isDark, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([{ label: 'Celular', number: '' }]);
  const [emails, setEmails] = useState<Email[]>([{ label: 'Pessoal', email: '' }]);
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (contactId) {
      loadContact();
    }
  }, [contactId]);

  const loadContact = async () => {
    if (!contactId) return;
    try {
      const response = await contactService.getContactById(contactId);
      if (response.success && response.data) {
        const contact = response.data;
        setFirstName(contact.firstName);
        setLastName(contact.lastName || '');
        setNickname(contact.nickname || '');
        setCompany(contact.company || '');
        setJobTitle(contact.jobTitle || '');
        setPhoneNumbers(contact.phoneNumbers.length > 0 ? contact.phoneNumbers : [{ label: 'Celular', number: '' }]);
        setEmails(contact.emails.length > 0 ? contact.emails : [{ label: 'Pessoal', email: '' }]);
        setNotes(contact.notes || '');
        setIsFavorite(contact.isFavorite);
      }
    } catch (error) {
      console.error('Erro ao carregar contato:', error);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      showError('O nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        nickname: nickname.trim() || undefined,
        company: company.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        phoneNumbers: phoneNumbers.filter(p => p.number.trim()),
        emails: emails.filter(e => e.email.trim()),
        notes: notes.trim() || undefined,
        isFavorite,
      };

      let response;
      if (contactId) {
        response = await contactService.updateContact(contactId, data);
      } else {
        response = await contactService.createContact(data);
      }

      if (response.success) {
        showSuccess(contactId ? 'Contato atualizado com sucesso!' : 'Contato criado com sucesso!');
        navigation.goBack();
      } else {
        showError(response.message || 'Erro ao salvar contato');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addPhone = () => {
    setPhoneNumbers([...phoneNumbers, { label: 'Celular', number: '' }]);
  };

  const removePhone = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const updatePhone = (index: number, field: 'label' | 'number', value: string) => {
    const updated = [...phoneNumbers];
    updated[index][field] = value;
    setPhoneNumbers(updated);
  };

  const addEmail = () => {
    setEmails([...emails, { label: 'Pessoal', email: '' }]);
  };

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, field: 'label' | 'email', value: string) => {
    const updated = [...emails];
    updated[index][field] = value;
    setEmails(updated);
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Header
        title={contactId ? 'Editar Contato' : 'Novo Contato'}
        showBackButton
        onBack={() => navigation.goBack()}
        showThemeToggle
        onThemeToggle={toggleTheme}
      />
      
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButtonContainer}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            Salvar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Nome *"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Sobrenome"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Apelido"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={nickname}
            onChangeText={setNickname}
          />
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Empresa"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={company}
            onChangeText={setCompany}
          />
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Cargo"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={jobTitle}
            onChangeText={setJobTitle}
          />
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Telefones</Text>
          {phoneNumbers.map((phone, index) => (
            <View key={index} style={styles.multiFieldRow}>
              <TextInput
                style={[styles.input, styles.multiFieldInput, isDark && styles.inputDark]}
                placeholder="Tipo"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={phone.label}
                onChangeText={(value) => updatePhone(index, 'label', value)}
              />
              <TextInput
                style={[styles.input, styles.multiFieldInput, isDark && styles.inputDark]}
                placeholder="Número"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={phone.number}
                onChangeText={(value) => updatePhone(index, 'number', value)}
                keyboardType="phone-pad"
              />
              <TouchableOpacity onPress={() => removePhone(index)} style={styles.removeButton}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addPhone} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color="#16a34a" />
            <Text style={styles.addButtonText}>Adicionar Telefone</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>E-mails</Text>
          {emails.map((email, index) => (
            <View key={index} style={styles.multiFieldRow}>
              <TextInput
                style={[styles.input, styles.multiFieldInput, isDark && styles.inputDark]}
                placeholder="Tipo"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={email.label}
                onChangeText={(value) => updateEmail(index, 'label', value)}
              />
              <TextInput
                style={[styles.input, styles.multiFieldInput, isDark && styles.inputDark]}
                placeholder="E-mail"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={email.email}
                onChangeText={(value) => updateEmail(index, 'email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => removeEmail(index)} style={styles.removeButton}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addEmail} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color="#16a34a" />
            <Text style={styles.addButtonText}>Adicionar E-mail</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholder="Adicione notas sobre este contato..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.favoriteToggle, isDark && styles.favoriteToggleDark]}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={isFavorite ? '#fbbf24' : '#6b7280'}
          />
          <Text style={[styles.favoriteText, isDark && styles.favoriteTextDark]}>
            Adicionar aos favoritos
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButton: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionDark: {
    backgroundColor: '#1f2937',
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
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  inputDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#f9fafb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  multiFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  multiFieldInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '500',
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
    gap: 12,
    borderRadius: 12,
  },
  favoriteToggleDark: {
    backgroundColor: '#1f2937',
  },
  favoriteText: {
    fontSize: 16,
    color: '#111827',
  },
  favoriteTextDark: {
    color: '#f9fafb',
  },
});

