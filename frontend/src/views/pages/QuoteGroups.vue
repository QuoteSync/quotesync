<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { QuoteGroupService } from '@/service/QuoteGroupService';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const toast = useToast();
const groups = ref([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const selectedGroup = ref(null);

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

const editGroup = async (group) => {
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
          @click="showCreateDialog = true"
        />
      </div>

      <DataTable
        :value="groups"
        :loading="loading"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column field="name" header="Name">
          <template #body="slotProps">
            <div 
              class="flex align-items-center gap-2 cursor-pointer hover:text-primary transition-colors duration-200"
              @click="router.push(`/groups/${slotProps.data.id}`)"
            >
              <i class="pi pi-users text-primary"></i>
              <span>{{ slotProps.data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="description" header="Description"></Column>
        <Column field="created" header="Created">
          <template #body="slotProps">
            {{ new Date(slotProps.data.created).toLocaleDateString() }}
          </template>
        </Column>
        <Column header="Members">
          <template #body="slotProps">
            <span class="px-2 py-1 border-round bg-primary-50 text-primary-700 text-sm">
              {{ slotProps.data.members?.length || 0 }} members
            </span>
          </template>
        </Column>
        <Column header="Actions">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                class="p-button-text p-button-sm"
                @click.stop="editGroup(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-text p-button-danger p-button-sm"
                @click.stop="deleteGroup(slotProps.data.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
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
.p-datatable {
  @apply shadow-sm;
}

.p-datatable .p-datatable-header {
  @apply bg-surface-0 border-b border-surface-200 dark:border-surface-700;
}

.p-datatable .p-datatable-thead > tr > th {
  @apply bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200;
}

.p-datatable .p-datatable-tbody > tr > td {
  @apply border-b border-surface-200 dark:border-surface-700;
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