<script setup>
import { onMounted, ref } from 'vue';
import { QuoteService } from '@/service/QuoteService';

const quotes = ref([]);

onMounted(async () => {
  try {
    const data = await QuoteService.getQuotes();
    // Sort by newest and limit to 5
    quotes.value = data.sort((a, b) => new Date(b.created_at || b.date_added) - new Date(a.created_at || a.date_added)).slice(0, 5);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    quotes.value = [];
  }
});
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Recent Quotes</div>
    <DataTable :value="quotes" responsiveLayout="scroll" class="p-datatable-sm">
      <Column field="title" header="Title" style="width: 35%">
        <template #body="slotProps">
          <span class="font-medium">{{ slotProps.data.title }}</span>
        </template>
      </Column>
      <Column field="book.title" header="Book" style="width: 30%">
        <template #body="slotProps">
          {{ slotProps.data.book?.title || 'Unknown' }}
        </template>
      </Column>
      <Column field="author.name" header="Author" style="width: 20%">
        <template #body="slotProps">
          {{ slotProps.data.book?.author?.name || 'Unknown' }}
        </template>
      </Column>
      <Column style="width: 15%" header="View">
        <template #body="slotProps">
          <Button icon="pi pi-search" type="button" class="p-button-text p-button-sm" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
