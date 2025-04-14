<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { QuoteGroupService } from '@/service/QuoteGroupService';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';

const router = useRouter();
const toast = useToast();
const groups = ref([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const selectedGroup = ref(null);
const hoverGroup = ref(null);

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

const newGroup = ref({
  name: '',
  description: ''
});

const editingGroup = ref({
  name: '',
  description: ''
});

const loadGroups = async () => {
  loading.value = true;
  try {
    groups.value = await QuoteGroupService.getGroups();
  } catch (error) {
    console.error('Error loading groups:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load groups',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const createGroup = async () => {
  if (!newGroup.value.name) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter a group name',
      life: 3000
    });
    return;
  }

  try {
    await QuoteGroupService.createGroup(newGroup.value);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Group created successfully',
      life: 3000
    });
    showCreateDialog.value = false;
    newGroup.value = { name: '', description: '' };
    await loadGroups();
  } catch (error) {
    console.error('Error creating group:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create group',
      life: 3000
    });
  }
};

const editGroup = (group) => {
  editingGroup.value = {
    name: group.name,
    description: group.description
  };
  selectedGroup.value = group;
  showEditDialog.value = true;
};

const updateGroup = async () => {
  if (!editingGroup.value.name) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter a group name',
      life: 3000
    });
    return;
  }

  try {
    await QuoteGroupService.updateGroup(selectedGroup.value.id, editingGroup.value);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Group updated successfully',
      life: 3000
    });
    showEditDialog.value = false;
    selectedGroup.value = null;
    await loadGroups();
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

const deleteGroup = async (groupId) => {
  if (!confirm('Are you sure you want to delete this group?')) return;
  
  try {
    await QuoteGroupService.deleteGroup(groupId);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Group deleted successfully',
      life: 3000
    });
    await loadGroups();
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

const setHoverGroup = (groupId) => {
  hoverGroup.value = groupId;
};

const clearHoverGroup = () => {
  hoverGroup.value = null;
};

const navigateToGroup = (groupId) => {
  router.push(`/groups/${groupId}`);
};

onMounted(() => {
  loadGroups();
});
</script>

<template>
  <div class="surface-ground p-4">
    <div class="surface-card p-4 border-round shadow-2">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold m-0">Quote Groups</h1>
        <Button
          label="Create Group"
          icon="pi pi-plus"
          severity="success"
          class="p-button-rounded"
          @click="showCreateDialog = true"
        />
      </div>

      <ProgressSpinner v-if="loading" class="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
      
      <div v-else-if="groups.length > 0" class="grid">
        <div v-for="group in groups" :key="group.id" 
             class="col-12 md:col-6 lg:col-4 p-2">
          <div class="group-card" 
               :class="{ 'hovered': hoverGroup === group.id }"
               :style="{
                 background: `linear-gradient(135deg, ${getGroupGradient(group.id).primary}, ${getGroupGradient(group.id).secondary})`
               }"
               @mouseenter="setHoverGroup(group.id)"
               @mouseleave="clearHoverGroup()">
            <div class="group-info" @click="navigateToGroup(group.id)">
              <div class="group-icon">
                <i class="pi pi-users text-white text-xl"></i>
              </div>
              <div class="group-content">
                <h3 class="group-title">{{ group.name }}</h3>
                <p class="group-description">{{ group.description }}</p>
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
                @click.stop="editGroup(group)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text"
                style="color: white;"
                @click.stop="deleteGroup(group.id)"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <i class="pi pi-users text-4xl text-primary mb-3"></i>
        <span class="text-xl font-medium">No Quote Groups</span>
        <p class="text-color-secondary">Create a group to share quotes with others</p>
        <Button 
          label="Create Group" 
          icon="pi pi-plus" 
          class="p-button-rounded mt-3"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Create Group Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="Create New Group"
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div class="p-4">
        <div class="mb-4">
          <label for="groupName" class="block mb-2">Name</label>
          <InputText
            id="groupName"
            v-model="newGroup.name"
            class="w-full"
            placeholder="Enter group name"
          />
        </div>
        
        <div class="mb-4">
          <label for="groupDescription" class="block mb-2">Description</label>
          <Textarea
            id="groupDescription"
            v-model="newGroup.description"
            class="w-full"
            rows="3"
            placeholder="Enter group description (optional)"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text"
            @click="showCreateDialog = false"
          />
          <Button
            label="Create"
            :disabled="!newGroup.name"
            @click="createGroup"
          />
        </div>
      </div>
    </Dialog>

    <!-- Edit Group Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Edit Group"
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div class="p-4">
        <div class="mb-4">
          <label for="editGroupName" class="block mb-2">Name</label>
          <InputText
            id="editGroupName"
            v-model="editingGroup.name"
            class="w-full"
            placeholder="Enter group name"
          />
        </div>
        
        <div class="mb-4">
          <label for="editGroupDescription" class="block mb-2">Description</label>
          <Textarea
            id="editGroupDescription"
            v-model="editingGroup.description"
            class="w-full"
            rows="3"
            placeholder="Enter group description (optional)"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text"
            @click="showEditDialog = false"
          />
          <Button
            label="Save"
            :disabled="!editingGroup.name"
            @click="updateGroup"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
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
  transition: all 0.3s ease;
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

.group-card.hovered {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.group-card.hovered::before {
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

.group-card.hovered .group-icon {
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

.group-card.hovered .group-actions {
  opacity: 1;
  transform: translateY(0);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 16px;
  border: 1px dashed var(--surface-border);
}

:deep(.p-dialog-header) {
  @apply bg-surface-0 border-b border-surface-200 dark:border-surface-700;
}

:deep(.p-dialog-content) {
  @apply bg-surface-0;
}

:deep(.p-dialog-footer) {
  @apply bg-surface-0 border-t border-surface-200 dark:border-surface-700;
}

:deep(.p-button-text:hover) {
  @apply bg-surface-100 dark:bg-surface-700;
}

:deep(.p-button-text.p-button-danger:hover) {
  @apply bg-red-50 dark:bg-red-900/20;
}
</style> 