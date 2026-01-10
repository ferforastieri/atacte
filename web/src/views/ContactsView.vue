<template>
  <div class="contacts-view">
    <div class="header">
      <h1>Contatos</h1>
      <div class="header-actions">
        <button
          class="icon-button"
          :class="{ active: showFavoritesOnly }"
          @click="toggleFavorites"
          title="Mostrar favoritos"
        >
          <i :class="showFavoritesOnly ? 'fas fa-star' : 'far fa-star'"></i>
        </button>
        <button class="btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i>
          Novo Contato
        </button>
      </div>
    </div>

    <div class="search-container">
      <i class="fas fa-search search-icon"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar contatos..."
        class="search-input"
        @input="handleSearch"
      />
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      Carregando...
    </div>

    <div v-else-if="contacts.length === 0" class="empty-state">
      <i class="fas fa-address-book"></i>
      <p>Nenhum contato encontrado</p>
      <button class="btn-primary" @click="openCreateModal">
        Criar Primeiro Contato
      </button>
    </div>

    <div v-else class="contacts-grid">
      <div
        v-for="contact in contacts"
        :key="contact.id"
        class="contact-card"
        @click="viewContact(contact)"
      >
        <div class="contact-header">
          <div class="contact-avatar">
            <img v-if="contact.imageUrl" :src="contact.imageUrl" :alt="contact.firstName" />
            <div v-else class="avatar-placeholder">
              {{ contact.firstName.charAt(0).toUpperCase() }}
            </div>
          </div>
          <button
            class="favorite-button"
            @click.stop="toggleFavorite(contact)"
            :title="contact.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
          >
            <i :class="contact.isFavorite ? 'fas fa-star' : 'far fa-star'"></i>
          </button>
        </div>

        <div class="contact-info">
          <h3>{{ contact.firstName }} {{ contact.lastName || '' }}</h3>
          <p v-if="contact.phoneNumbers.length > 0" class="contact-phone">
            <i class="fas fa-phone"></i>
            {{ contact.phoneNumbers[0].number }}
          </p>
          <p v-if="contact.emails.length > 0" class="contact-email">
            <i class="fas fa-envelope"></i>
            {{ contact.emails[0].email }}
          </p>
          <p v-if="contact.company" class="contact-company">
            <i class="fas fa-building"></i>
            {{ contact.company }}
          </p>
        </div>

        <div class="contact-actions">
          <button class="btn-icon" @click.stop="editContact(contact)" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon danger" @click.stop="deleteContact(contact)" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Criação/Edição -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingContact ? 'Editar Contato' : 'Novo Contato' }}</h2>
          <button class="close-button" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="saveContact" class="contact-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nome *</label>
              <input v-model="formData.firstName" type="text" required />
            </div>
            <div class="form-group">
              <label>Sobrenome</label>
              <input v-model="formData.lastName" type="text" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Apelido</label>
              <input v-model="formData.nickname" type="text" />
            </div>
            <div class="form-group">
              <label>Empresa</label>
              <input v-model="formData.company" type="text" />
            </div>
          </div>

          <div class="form-group">
            <label>Cargo</label>
            <input v-model="formData.jobTitle" type="text" />
          </div>

          <div class="form-section">
            <h3>Telefones</h3>
            <div v-for="(phone, index) in formData.phoneNumbers" :key="index" class="form-row">
              <div class="form-group">
                <input v-model="phone.label" type="text" placeholder="Tipo (ex: Celular)" />
              </div>
              <div class="form-group">
                <input v-model="phone.number" type="tel" placeholder="Número" />
              </div>
              <button type="button" class="btn-icon danger" @click="removePhone(index)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <button type="button" class="btn-secondary" @click="addPhone">
              <i class="fas fa-plus"></i>
              Adicionar Telefone
            </button>
          </div>

          <div class="form-section">
            <h3>E-mails</h3>
            <div v-for="(email, index) in formData.emails" :key="index" class="form-row">
              <div class="form-group">
                <input v-model="email.label" type="text" placeholder="Tipo (ex: Pessoal)" />
              </div>
              <div class="form-group">
                <input v-model="email.email" type="email" placeholder="E-mail" />
              </div>
              <button type="button" class="btn-icon danger" @click="removeEmail(index)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <button type="button" class="btn-secondary" @click="addEmail">
              <i class="fas fa-plus"></i>
              Adicionar E-mail
            </button>
          </div>

          <div class="form-group">
            <label>Notas</label>
            <textarea v-model="formData.notes" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="formData.isFavorite" type="checkbox" />
              Adicionar aos favoritos
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              {{ editingContact ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { contactsApi, Contact, CreateContactRequest } from '../api/contacts';

const contacts = ref<Contact[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const showFavoritesOnly = ref(false);
const showModal = ref(false);
const editingContact = ref<Contact | null>(null);

const formData = ref<CreateContactRequest>({
  firstName: '',
  lastName: '',
  nickname: '',
  company: '',
  jobTitle: '',
  phoneNumbers: [],
  emails: [],
  addresses: [],
  notes: '',
  isFavorite: false,
});

onMounted(() => {
  loadContacts();
});

const loadContacts = async () => {
  try {
    loading.value = true;
    const response = await contactsApi.searchContacts({
      search: searchQuery.value || undefined,
      isFavorite: showFavoritesOnly.value || undefined,
    });

    if (response.success) {
      contacts.value = response.data;
    }
  } catch (error) {
    console.error('Erro ao carregar contatos:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadContacts();
};

const toggleFavorites = () => {
  showFavoritesOnly.value = !showFavoritesOnly.value;
  loadContacts();
};

const toggleFavorite = async (contact: Contact) => {
  try {
    await contactsApi.updateContact(contact.id, {
      isFavorite: !contact.isFavorite,
    });
    loadContacts();
  } catch (error) {
    console.error('Erro ao favoritar:', error);
  }
};

const openCreateModal = () => {
  editingContact.value = null;
  formData.value = {
    firstName: '',
    lastName: '',
    nickname: '',
    company: '',
    jobTitle: '',
    phoneNumbers: [],
    emails: [],
    addresses: [],
    notes: '',
    isFavorite: false,
  };
  showModal.value = true;
};

const editContact = (contact: Contact) => {
  editingContact.value = contact;
  formData.value = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    nickname: contact.nickname,
    company: contact.company,
    jobTitle: contact.jobTitle,
    phoneNumbers: [...contact.phoneNumbers],
    emails: [...contact.emails],
    addresses: [...contact.addresses],
    notes: contact.notes,
    isFavorite: contact.isFavorite,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingContact.value = null;
};

const saveContact = async () => {
  try {
    if (editingContact.value) {
      await contactsApi.updateContact(editingContact.value.id, formData.value);
    } else {
      await contactsApi.createContact(formData.value);
    }
    closeModal();
    loadContacts();
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
  }
};

const deleteContact = async (contact: Contact) => {
  if (!confirm(`Deseja realmente excluir ${contact.firstName}?`)) return;

  try {
    await contactsApi.deleteContact(contact.id);
    loadContacts();
  } catch (error) {
    console.error('Erro ao excluir contato:', error);
  }
};

const viewContact = (contact: Contact) => {
  editContact(contact);
};

const addPhone = () => {
  formData.value.phoneNumbers = formData.value.phoneNumbers || [];
  formData.value.phoneNumbers.push({ label: 'Celular', number: '' });
};

const removePhone = (index: number) => {
  formData.value.phoneNumbers?.splice(index, 1);
};

const addEmail = () => {
  formData.value.emails = formData.value.emails || [];
  formData.value.emails.push({ label: 'Pessoal', email: '' });
};

const removeEmail = (index: number) => {
  formData.value.emails?.splice(index, 1);
};
</script>

<style scoped>
.contacts-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.icon-button {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #f9fafb;
}

.icon-button.active {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #f59e0b;
}

.search-container {
  position: relative;
  margin-bottom: 24px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 48px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
}

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.contact-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.contact-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.contact-avatar {
  width: 56px;
  height: 56px;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #16a34a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.favorite-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #fbbf24;
  font-size: 20px;
}

.contact-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.contact-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.btn-icon {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f9fafb;
}

.btn-icon.danger {
  color: #ef4444;
}

.btn-icon.danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.contact-form {
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.form-section {
  margin: 24px 0;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.form-section h3 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #16a34a;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #15803d;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.loading,
.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: #9ca3af;
}

.loading i,
.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>

