<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Contatos</h1>
        <div class="flex items-center gap-2">
          <button
            @click="toggleFavorites"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors border',
              showFavoritesOnly
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            <i :class="showFavoritesOnly ? 'fas fa-star' : 'far fa-star'"></i>
            <span class="ml-2">Favoritos</span>
          </button>
          <button
            @click="openCreateModal"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="fas fa-plus"></i>
            Novo Contato
          </button>
        </div>
      </div>

      <div class="mb-6">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar contatos..."
            class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600"
            @input="handleSearch"
          />
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-primary-600 dark:text-primary-400"></i>
      </div>

      <div v-else-if="contacts.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
        <i class="fas fa-address-book text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-500 dark:text-gray-400 mb-4">Nenhum contato encontrado</p>
        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Criar Primeiro Contato
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="contact in contacts"
          :key="contact.id"
          class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
          @click="editContact(contact)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div v-if="contact.imageUrl" class="w-12 h-12 rounded-full overflow-hidden">
                <img :src="contact.imageUrl" :alt="contact.firstName" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {{ contact.firstName.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {{ contact.firstName }} {{ contact.lastName || '' }}
                </h3>
              </div>
            </div>
            <button
              @click.stop="toggleFavorite(contact)"
              class="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
            >
              <i :class="contact.isFavorite ? 'fas fa-star' : 'far fa-star'"></i>
            </button>
          </div>

          <div class="space-y-2">
            <p v-if="contact.phoneNumbers.length > 0" class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <i class="fas fa-phone w-4"></i>
              <span>{{ contact.phoneNumbers[0].number }}</span>
            </p>
            <p v-if="contact.emails.length > 0" class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
              <i class="fas fa-envelope w-4"></i>
              <span class="truncate">{{ contact.emails[0].email }}</span>
            </p>
            <p v-if="contact.company" class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
              <i class="fas fa-building w-4"></i>
              <span class="truncate">{{ contact.company }}</span>
            </p>
          </div>

          <div class="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              @click.stop="editContact(contact)"
              class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <i class="fas fa-edit"></i> Editar
            </button>
            <button
              @click.stop="deleteContact(contact)"
              class="flex-1 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
            >
              <i class="fas fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity" @click="closeModal"></div>
        
        <div class="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {{ editingContact ? 'Editar Contato' : 'Novo Contato' }}
            </h2>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <form @submit.prevent="saveContact" class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                <input
                  v-model="formData.firstName"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sobrenome</label>
                <input
                  v-model="formData.lastName"
                  type="text"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                <input
                  v-model="formData.company"
                  type="text"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo</label>
                <input
                  v-model="formData.jobTitle"
                  type="text"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefones</label>
                <button type="button" @click="addPhone" class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  <i class="fas fa-plus"></i> Adicionar
                </button>
              </div>
              <div v-for="(phone, index) in formData.phoneNumbers" :key="index" class="flex gap-2 mb-2">
                <input
                  v-model="phone.label"
                  type="text"
                  placeholder="Tipo"
                  class="w-1/3 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  v-model="phone.number"
                  type="tel"
                  placeholder="Número"
                  class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="button" @click="removePhone(index)" class="px-3 text-red-600 dark:text-red-400 hover:text-red-700">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mails</label>
                <button type="button" @click="addEmail" class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  <i class="fas fa-plus"></i> Adicionar
                </button>
              </div>
              <div v-for="(email, index) in formData.emails" :key="index" class="flex gap-2 mb-2">
                <input
                  v-model="email.label"
                  type="text"
                  placeholder="Tipo"
                  class="w-1/3 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  v-model="email.email"
                  type="email"
                  placeholder="E-mail"
                  class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="button" @click="removeEmail(index)" class="px-3 text-red-600 dark:text-red-400 hover:text-red-700">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
              <textarea
                v-model="formData.notes"
                rows="3"
                class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              ></textarea>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="formData.isFavorite"
                type="checkbox"
                id="favorite"
                class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
              />
              <label for="favorite" class="text-sm text-gray-700 dark:text-gray-300">Adicionar aos favoritos</label>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                {{ editingContact ? 'Salvar' : 'Criar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { contactsApi, Contact, CreateContactRequest } from '../api/contacts';
import { AppHeader } from '@/components/layout';

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
