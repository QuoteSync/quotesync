<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { QuoteGroupService } from '@/service/QuoteGroupService';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const group = ref(null);
const loading = ref(false);
const showEditDialog = ref(false);
const showAddMemberDialog = ref(false);

const newMemberEmail = ref('');
const memberRole = ref('reader');
const editingGroup = ref({
  name: '',
  description: ''
});

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

onMounted(() => {
  loadGroup();
});
</script>

<template>
  <div v-if="group" class="surface-ground p-4">
    <div class="surface-card p-4 border-round shadow-2">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold m-0">{{ group.name }}</h1>
        <div class="flex gap-2">
          <Button
            icon="pi pi-pencil"
            class="p-button-text"
            @click="showEditDialog = true"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-text p-button-danger"
            @click="deleteGroup"
          />
        </div>
      </div>

      <p class="text-surface-600 dark:text-surface-400 mb-6">{{ group.description }}</p>

      <!-- Members Section -->
      <div class="surface-card p-4 border-round shadow-2">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold m-0">Members</h2>
          <Button
            label="Add Member"
            icon="pi pi-plus"
            severity="success"
            @click="showAddMemberDialog = true"
          />
        </div>

        <DataTable
          :value="group.members"
          :loading="loading"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <Column field="email" header="Email">
            <template #body="slotProps">
              <span class="text-surface-900 dark:text-surface-100">{{ slotProps.data.email }}</span>
            </template>
          </Column>
          <Column field="role" header="Role">
            <template #body="slotProps">
              <span class="px-2 py-1 border-round text-sm" :class="{
                'bg-primary-50 text-primary-700': slotProps.data.role === 'admin',
                'bg-green-50 text-green-700': slotProps.data.role === 'editor',
                'bg-blue-50 text-blue-700': slotProps.data.role === 'reader'
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
                  class="p-button-text p-button-danger p-button-sm"
                  @click="removeMember(slotProps.data.email)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

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
    >
      <div class="p-4">
        <div class="mb-4">
          <label for="memberEmail" class="block mb-2">Email Address</label>
          <InputText
            id="memberEmail"
            v-model="newMemberEmail"
            class="w-full"
            placeholder="Enter member's email"
          />
        </div>
        
        <div class="mb-4">
          <label for="memberRole" class="block mb-2">Role</label>
          <Dropdown
            id="memberRole"
            v-model="memberRole"
            :options="['reader', 'editor', 'admin']"
            class="w-full"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text"
            @click="showAddMemberDialog = false"
          />
          <Button
            label="Add Member"
            :disabled="!newMemberEmail"
            @click="addMember"
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

/* Card styles */
.surface-card {
  @apply bg-surface-0 dark:bg-surface-900;
}

/* Table container styles */
.p-datatable-table-container {
  @apply bg-surface-0 dark:bg-surface-900;
}

/* Empty message styles */
.p-datatable-empty-message {
  @apply text-surface-500 dark:text-surface-400;
}
</style> 