<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { QuoteGroupService } from '@/service/QuoteGroupService';
import { QuoteListService } from '@/service/QuoteListService';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Select from 'primevue/select';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const group = ref(null);
const loading = ref(false);
const showEditDialog = ref(false);
const showAddMemberDialog = ref(false);
const showAddListDialog = ref(false);

// Predefined gradient pairs for group cards
const gradients = [
  { primary: '#4158D0', secondary: '#C850C0' },
  { primary: '#0093E9', secondary: '#80D0C7' },
  { primary: '#8EC5FC', secondary: '#E0C3FC' },
  { primary: '#FBAB7E', secondary: '#F7CE68' },
  { primary: '#85FFBD', secondary: '#FFFB7D' },
  { primary: '#FF9A8B', secondary: '#FF6A88' },
  { primary: '#74EBD5', secondary: '#9FACE6' },
  { primary: '#F4D03F', secondary: '#16A085' },
];

// Generate a consistent gradient for a group based on its ID
const getGroupGradient = (groupId) => {
  // Use the last digit of the group ID to select a gradient
  const index = parseInt(groupId.toString().slice(-1)) % gradients.length;
  return gradients[index];
};

// Predefined gradient pairs for list cards
const listGradients = [
  { primary: '#4158D0', secondary: '#C850C0' },
  { primary: '#0093E9', secondary: '#80D0C7' },
  { primary: '#8EC5FC', secondary: '#E0C3FC' },
  { primary: '#FBAB7E', secondary: '#F7CE68' },
  { primary: '#85FFBD', secondary: '#FFFB7D' },
  { primary: '#FF9A8B', secondary: '#FF6A88' },
  { primary: '#74EBD5', secondary: '#9FACE6' },
  { primary: '#F4D03F', secondary: '#16A085' },
];

// Generate a consistent gradient for a list based on its ID
const getListGradient = (listId) => {
  // Use the last digit of the list ID to select a gradient
  const index = parseInt(listId.toString().slice(-1)) % listGradients.length;
  return listGradients[index];
};

const newMemberEmail = ref('');
const memberRole = ref('reader');
const editingGroup = ref({
  name: '',
  description: ''
});

const lists = ref([]);
const loadingLists = ref(false);
const selectedLists = ref([]);
const availableLists = ref([]);
const selectedList = ref(null);

const loadGroup = async () => {
  loading.value = true;
  try {
    const groups = await QuoteGroupService.getGroups();
    const foundGroup = groups.find(g => g.id === parseInt(route.params.id));
    if (!foundGroup) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Group not found',
        life: 3000
      });
      router.push('/groups');
      return;
    }
    
    console.log('Found group:', foundGroup);
    
    // Transform member data to match the table structure
    group.value = {
      ...foundGroup,
      members: foundGroup.members?.map(membership => {
        console.log('Processing membership:', membership);
        return {
          id: membership.id,
          email: membership.user.email,
          role: membership.role
        };
      }) || []
    };
    
    console.log('Transformed group:', group.value);
  } catch (error) {
    console.error('Error loading group:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load group details',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const editGroup = async () => {
  try {
    await QuoteGroupService.updateGroup(group.value.id, editingGroup.value);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Group updated successfully',
      life: 3000
    });
    showEditDialog.value = false;
    await loadGroup();
  } catch (error) {
    console.error('Error updating group:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update group',
      life: 3000
    });
  }
};

const openEditDialog = () => {
  editingGroup.value = {
    name: group.value.name,
    description: group.value.description
  };
  showEditDialog.value = true;
};

const addMember = async () => {
  if (!newMemberEmail.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter an email address',
      life: 3000
    });
    return;
  }

  try {
    console.log('Adding member:', {
      groupId: group.value.id,
      email: newMemberEmail.value,
      role: memberRole.value
    });
    
    const response = await QuoteGroupService.addMember(
      group.value.id, 
      newMemberEmail.value, 
      memberRole.value
    );
    
    console.log('Add member response:', response);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Member added successfully',
      life: 3000
    });
    
    newMemberEmail.value = '';
    memberRole.value = 'reader';
    showAddMemberDialog.value = false;
    
    // Reload the group data
    await loadGroup();
  } catch (error) {
    console.error('Error adding member:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to add member',
      life: 3000
    });
  }
};

const removeMember = async (email) => {
  try {
    await QuoteGroupService.removeMember(group.value.id, email);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Member removed successfully',
      life: 3000
    });
    await loadGroup();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to remove member',
      life: 3000
    });
  }
};

const deleteGroup = async () => {
  if (!confirm('Are you sure you want to delete this group?')) return;
  
  try {
    await QuoteGroupService.deleteGroup(group.value.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Group deleted successfully',
      life: 3000
    });
    router.push('/groups');
  } catch (error) {
    console.error('Error deleting group:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete group',
      life: 3000
    });
  }
};

const loadLists = async () => {
  loadingLists.value = true;
  try {
    const response = await QuoteGroupService.getSharedLists();
    lists.value = response;
    // Marcar las listas que ya están compartidas con este grupo
    selectedLists.value = lists.value
      .filter(list => list.group === group.value.id)
      .map(list => list.id);
  } catch (error) {
    console.error('Error loading lists:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load lists',
      life: 3000
    });
  } finally {
    loadingLists.value = false;
  }
};

const toggleListShare = async (listId) => {
  try {
    if (selectedLists.value.includes(listId)) {
      // Compartir con el grupo
      await QuoteGroupService.updateListVisibility(listId, 'group', group.value.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'List shared with group successfully',
        life: 3000
      });
    } else {
      // Quitar del grupo
      await QuoteGroupService.updateListVisibility(listId, 'private');
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'List removed from group successfully',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error toggling list share:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update list sharing',
      life: 3000
    });
  }
};

const loadAvailableLists = async () => {
  try {
    // Usar QuoteListService para obtener todas las listas
    const response = await QuoteListService.getQuoteLists();
    // Filtrar las listas que no están ya en el grupo
    availableLists.value = response.filter(list => !lists.value.some(groupList => groupList.id === list.id));
  } catch (error) {
    console.error('Error loading available lists:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load available lists',
      life: 3000
    });
  }
};

const addListToGroup = async () => {
  if (!selectedList.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please select a list',
      life: 3000
    });
    return;
  }

  try {
    await QuoteGroupService.updateListVisibility(selectedList.value.id, 'group', group.value.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'List added to group successfully',
      life: 3000
    });
    showAddListDialog.value = false;
    selectedList.value = null;
    await loadLists();
  } catch (error) {
    console.error('Error adding list to group:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add list to group',
      life: 3000
    });
  }
};

onMounted(async () => {
  await loadGroup();
  await loadLists();
  await loadAvailableLists();
});
</script>

<template>
  <div v-if="group" class="flex h-screen overflow-hidden">
    <!-- Group Info Panel (1/4) -->
    <div class="w-1/4 p-4 md:p-2 flex flex-col items-center sticky top-4">
      <div class="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full">
        <div class="group-card" 
             :style="{ background: `linear-gradient(135deg, ${getGroupGradient(group.id).primary}, ${getGroupGradient(group.id).secondary})` }">
          <div class="group-info">
            <div class="group-icon">
              <i class="pi pi-users text-white text-xl"></i>
            </div>
            <div class="group-content">
              <h3 class="group-title">{{ group.name }}</h3>
              <p class="group-description">{{ group.description || 'No description' }}</p>
              <div class="flex items-center mt-2">
                <span class="group-members">{{ group.members?.length || 0 }} members</span>
                <span class="group-date ml-auto">{{ new Date(group.created).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
          <div class="group-actions">
          <Button
            icon="pi pi-pencil"
              class="p-button-rounded p-button-text"
              style="color: white;"
            @click="showEditDialog = true"
          />
          <Button
            icon="pi pi-trash"
              class="p-button-rounded p-button-text"
              style="color: white;"
            @click="deleteGroup"
          />
          </div>
        </div>
        </div>
      </div>

    <!-- Content Panel (3/4) -->
    <div class="w-3/4 h-screen overflow-y-auto pl-8 animate-slide-in">
      <div class="max-w-6xl mx-auto p-8 space-y-12">
      <!-- Members Section -->
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-3xl transform -rotate-0.25"></div>
          <div class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-3xl hover:shadow-xl transition-all duration-300 relative">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Members</h2>
          <Button
            label="Add Member"
            icon="pi pi-plus"
            severity="success"
                class="p-button-rounded"
            @click="showAddMemberDialog = true"
          />
        </div>

        <DataTable
          :value="group.members"
          :loading="loading"
          responsiveLayout="scroll"
              class="p-datatable-sm fancy-table"
        >
          <Column field="email" header="Email">
            <template #body="slotProps">
              <span class="text-surface-900 dark:text-surface-100">{{ slotProps.data.email }}</span>
            </template>
          </Column>
          <Column field="role" header="Role">
            <template #body="slotProps">
                  <span class="px-3 py-1 border-round-full text-sm font-medium" :class="{
                    'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300': slotProps.data.role === 'admin',
                    'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300': slotProps.data.role === 'editor',
                    'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300': slotProps.data.role === 'reader'
              }">
                {{ slotProps.data.role }}
              </span>
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-trash"
                      class="p-button-rounded p-button-text p-button-danger p-button-sm"
                  @click="removeMember(slotProps.data.email)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
        </div>

        <!-- Lists Section -->
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-3xl transform -rotate-0.25"></div>
          <div class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-3xl hover:shadow-xl transition-all duration-300 relative">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Shared Lists</h2>
              <Button
                label="Add List"
                icon="pi pi-plus"
                class="p-button-rounded"
                @click="showAddListDialog = true"
              />
        </div>

            <div v-if="loadingLists" class="flex justify-center p-8">
              <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
        </div>

            <div v-else-if="lists.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <div v-for="list in lists" :key="list.id" 
                class="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
                @click="router.push(`/lists/${list.id}`)"
              >
                <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border-2 border-primary-200 dark:border-primary-800">
                  <!-- List Cover -->
                  <div class="relative aspect-[21/9] overflow-hidden">
                    <!-- List Cover Background -->
                    <div 
                      class="absolute inset-0 flex items-center justify-center overflow-hidden"
                      :style="{ background: `linear-gradient(135deg, ${getListGradient(list.id).primary}, ${getListGradient(list.id).secondary})` }"
                    >
                      <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
                        <!-- Light reflection effect -->
                        <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
                        
                        <!-- List name -->
                        <div class="relative z-10 text-center w-full px-4">
                          <span class="text-white font-bold text-2xl fancy-font whitespace-normal break-words">{{ list.title }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Share badge -->
                    <div class="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30">
                      <i class="pi pi-share-alt text-white"></i>
                    </div>

                    <!-- Simple hover overlay -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <!-- List Info -->
                  <div class="p-3 flex-1 flex flex-col">
                    <!-- Stats -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                        <i class="pi pi-comment text-primary-500"></i>
                        <span class="text-sm font-medium">{{ list.quotes?.length || 0 }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <i class="pi pi-user"></i>
                        <span>{{ list.owner?.username }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12 bg-surface-0 dark:bg-surface-800 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700">
              <i class="pi pi-share-alt text-4xl text-primary-500 mb-4"></i>
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">No Shared Lists</h3>
              <p class="text-surface-600 dark:text-surface-400">No lists have been shared with this group yet</p>
              <Button 
                label="Add List" 
                icon="pi pi-plus" 
                class="p-button-rounded mt-3"
                @click="showAddListDialog = true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Group Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Edit Group"
      :style="{ width: '500px' }"
      :modal="true"
      class="fancy-dialog"
    >
      <div class="p-4">
        <div class="mb-4">
          <label for="editGroupName" class="block mb-2 fancy-label">Name</label>
          <InputText
            id="editGroupName"
            v-model="editingGroup.name"
            class="w-full fancy-input"
            placeholder="Enter group name"
          />
        </div>
        
        <div class="mb-4">
          <label for="editGroupDescription" class="block mb-2 fancy-label">Description</label>
          <Textarea
            id="editGroupDescription"
            v-model="editingGroup.description"
            class="w-full fancy-textarea"
            rows="3"
            placeholder="Enter group description (optional)"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text fancy-cancel-button"
            @click="showEditDialog = false"
          />
          <Button
            label="Save"
            class="fancy-create-button"
            :disabled="!editingGroup.name"
            @click="editGroup"
          />
        </div>
      </div>
    </Dialog>

    <!-- Add Member Dialog -->
    <Dialog
      v-model:visible="showAddMemberDialog"
      header="Add Member"
      :style="{ width: '500px' }"
      :modal="true"
      class="fancy-dialog"
    >
      <div class="p-4">
        <div class="mb-4">
          <label for="memberEmail" class="block mb-2 fancy-label">Email Address</label>
          <InputText
            id="memberEmail"
            v-model="newMemberEmail"
            class="w-full fancy-input"
            placeholder="Enter member's email"
          />
        </div>
        
        <div class="mb-4">
          <label for="memberRole" class="block mb-2 fancy-label">Role</label>
          <Dropdown
            id="memberRole"
            v-model="memberRole"
            :options="['reader', 'editor', 'admin']"
            class="w-full fancy-input"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text fancy-cancel-button"
            @click="showAddMemberDialog = false"
          />
          <Button
            label="Add Member"
            class="fancy-create-button"
            :disabled="!newMemberEmail"
            @click="addMember"
          />
        </div>
      </div>
    </Dialog>

    <!-- Add List Dialog -->
    <Dialog
      v-model:visible="showAddListDialog"
      header="Add List to Group"
      :style="{ width: '500px' }"
      :modal="true"
      class="fancy-dialog"
    >
      <div class="p-4">
        <div class="mb-4">
          <label for="listSelect" class="block mb-2 fancy-label">Select List</label>
          <Select
            id="listSelect"
            v-model="selectedList"
            :options="availableLists"
            optionLabel="title"
            placeholder="Select a list"
            class="w-full fancy-input"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text"
            @click="showAddListDialog = false"
          />
          <Button
            label="Add List"
            :disabled="!selectedList"
            @click="addListToGroup"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* Add these new styles */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add transition for the content panel */
.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Layout styles */
.h-screen {
  height: 100vh;
  max-height: 100vh;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

/* Custom scrollbar for the content panel */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--surface-600);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}

/* Fancy table styles */
.fancy-table {
  @apply shadow-sm rounded-xl overflow-hidden;
}

.fancy-table .p-datatable-header {
  @apply bg-surface-0 border-b border-surface-200 dark:border-surface-700;
}

.fancy-table .p-datatable-thead > tr > th {
  @apply bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-semibold;
}

.fancy-table .p-datatable-tbody > tr > td {
  @apply border-b border-surface-200 dark:border-surface-700;
}

.fancy-table .p-datatable-tbody > tr {
  @apply transition-colors duration-200;
}

.fancy-table .p-datatable-tbody > tr:hover {
  @apply bg-surface-50 dark:bg-surface-800;
}

/* Dialog styles */
:deep(.fancy-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.fancy-dialog .p-dialog-header) {
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  border-bottom: 1px solid var(--surface-border);
}

:deep(.fancy-dialog .p-dialog-content) {
  background: var(--surface-card);
}

/* Input styles */
:deep(.fancy-input),
:deep(.fancy-textarea) {
  border-radius: 12px;
  border: 2px solid var(--surface-border);
  transition: all 0.3s ease;
  background: var(--surface-ground);
}

:deep(.fancy-input:hover),
:deep(.fancy-textarea:hover) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px rgba(var(--primary-500-rgb), 0.1);
}

:deep(.fancy-input:focus),
:deep(.fancy-textarea:focus) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(var(--primary-500-rgb), 0.2);
}

/* Label styles */
.fancy-label {
  color: var(--text-color-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.fancy-input:focus) + .fancy-label,
:deep(.fancy-textarea:focus) + .fancy-label {
  color: var(--primary-500);
}

/* Button styles */
:deep(.fancy-cancel-button) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.fancy-cancel-button:hover) {
  background: rgba(var(--surface-500-rgb), 0.1);
  transform: translateY(-2px);
}

:deep(.fancy-create-button) {
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
  border: none;
  transition: all 0.3s ease;
}

:deep(.fancy-create-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.3);
}

/* Dark mode adjustments */
:root.dark {
  :deep(.fancy-dialog) {
    background: var(--surface-ground);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  }

  :deep(.fancy-dialog .p-dialog-header) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.15),
      rgba(var(--primary-400-rgb), 0.05)
    );
  }

  :deep(.fancy-input),
  :deep(.fancy-textarea) {
    background: var(--surface-ground);
    border-color: var(--surface-border);
  }

  :deep(.fancy-input:hover),
  :deep(.fancy-textarea:hover) {
    border-color: var(--primary-400);
  }

  :deep(.fancy-input:focus),
  :deep(.fancy-textarea:focus) {
    border-color: var(--primary-400);
    box-shadow: 0 0 0 3px rgba(var(--primary-400-rgb), 0.2);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Group card styles from QuoteGroups.vue */
.group-card {
  border-radius: 24px;
  padding: 1.5rem;
  color: white;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.group-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.group-card:hover::before {
  opacity: 1;
}

.group-info {
  cursor: pointer;
  flex: 1;
}

.group-content {
  position: relative;
  z-index: 2;
}

.group-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease;
}

.group-card:hover .group-icon {
  transform: scale(1.1);
}

.group-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.group-description {
  font-size: 0.95rem;
  opacity: 0.9;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-members, .group-date {
  font-size: 0.85rem;
  opacity: 0.8;
}

.group-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(10px);
}

.group-card:hover .group-actions {
  opacity: 1;
  transform: translateY(0);
}

/* List card styles */
.list-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.list-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.list-card:hover::before {
  opacity: 1;
}

.list-card-content {
  display: flex;
  gap: 1rem;
}

.list-icon {
  background: rgba(var(--primary-500-rgb), 0.1);
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.list-card:hover .list-icon {
  transform: scale(1.1);
}

.list-info {
  flex: 1;
}

.list-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.list-description {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.list-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.list-card:hover .list-actions {
  opacity: 1;
  transform: translateY(0);
}

/* Fancy button styles */
.fancy-button {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
  border: none;
  transition: all 0.3s ease;
}

.fancy-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.3);
}
</style> 