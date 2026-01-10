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

export default function ContactFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { contactId } = (route.params as { contactId?: string }) || {};

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
      Alert.alert('Erro', 'O nome é obrigatório');
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

      if (contactId) {
        await contactService.updateContact(contactId, data);
        Alert.alert('Sucesso', 'Contato atualizado com sucesso');
      } else {
        await contactService.createContact(data);
        Alert.alert('Sucesso', 'Contato criado com sucesso');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível salvar o contato');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{contactId ? 'Editar Contato' : 'Novo Contato'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            Salvar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Nome *"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Sobrenome"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Apelido"
            value={nickname}
            onChangeText={setNickname}
          />
        </View>

        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Empresa"
            value={company}
            onChangeText={setCompany}
          />
          <TextInput
            style={styles.input}
            placeholder="Cargo"
            value={jobTitle}
            onChangeText={setJobTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Telefones</Text>
          {phoneNumbers.map((phone, index) => (
            <View key={index} style={styles.multiFieldRow}>
              <TextInput
                style={[styles.input, styles.multiFieldInput]}
                placeholder="Tipo"
                value={phone.label}
                onChangeText={(value) => updatePhone(index, 'label', value)}
              />
              <TextInput
                style={[styles.input, styles.multiFieldInput]}
                placeholder="Número"
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>E-mails</Text>
          {emails.map((email, index) => (
            <View key={index} style={styles.multiFieldRow}>
              <TextInput
                style={[styles.input, styles.multiFieldInput]}
                placeholder="Tipo"
                value={email.label}
                onChangeText={(value) => updateEmail(index, 'label', value)}
              />
              <TextInput
                style={[styles.input, styles.multiFieldInput]}
                placeholder="E-mail"
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Adicione notas sobre este contato..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={styles.favoriteToggle}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={isFavorite ? '#fbbf24' : '#6b7280'}
          />
          <Text style={styles.favoriteText}>Adicionar aos favoritos</Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
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
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
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
  },
  favoriteText: {
    fontSize: 16,
    color: '#111827',
  },
});

