<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import { QuoteGroupService } from '@/service/QuoteGroupService';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  itemType: {
    type: String,
    required: true,
    validator: (value) => ['quote', 'list'].includes(value)
  },
  itemId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update:visible', 'shared']);

const toast = useToast();
const groups = ref([]);
const selectedGroup = ref(null);
const permission = ref('read');
const loading = ref(false);

const loadGroups = async () => {
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
  }
};

const shareWithGroup = async () => {
  if (!selectedGroup.value) return;
  
  loading.value = true;
  try {
    if (props.itemType === 'quote') {
      await QuoteGroupService.shareQuoteWithGroup(
        props.itemId,
        selectedGroup.value.id,
        permission.value
      );
    } else {
      await QuoteGroupService.updateListVisibility(
        props.itemId,
        'group',
        selectedGroup.value.id
      );
    }
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Shared ${props.itemType} with group successfully`,
      life: 3000
    });
    
    emit('shared');
    emit('update:visible', false);
  } catch (error) {
    console.error('Error sharing:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to share item',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadGroups();
});
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="`Share ${itemType}`"
    :style="{ width: '500px' }"
    :modal="true"
  >
    <div class="p-4">
      <!-- Share with Group -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-3">Share with Group</h3>
        <div class="flex flex-col gap-3">
          <Dropdown
            v-model="selectedGroup"
            :options="groups"
            optionLabel="name"
            placeholder="Select a group"
            class="w-full"
          />
          
          <div class="flex items-center gap-2">
            <label class="font-medium">Permission:</label>
            <div class="flex gap-4">
              <div class="flex items-center">
                <RadioButton
                  v-model="permission"
                  value="read"
                  class="mr-2"
                />
                <label>Read</label>
              </div>
              <div class="flex items-center">
                <RadioButton
                  v-model="permission"
                  value="edit"
                  class="mr-2"
                />
                <label>Edit</label>
              </div>
            </div>
          </div>
          
          <Button
            label="Share with Group"
            :loading="loading"
            :disabled="!selectedGroup"
            @click="shareWithGroup"
          />
        </div>
      </div>

      <!-- Public/Private Toggle -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Public Access</h3>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <RadioButton
              v-model="visibility"
              value="private"
              class="mr-2"
            />
            <label>Private</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton
              v-model="visibility"
              value="public"
              class="mr-2"
            />
            <label>Public</label>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.p-dropdown {
  width: 100%;
}
</style> 