<template>
  <div class="p-4 border rounded">
    <h3 class="text-lg font-bold mb-4">Color Saver Debug</h3>
    
    <div class="mb-4">
      <div class="flex gap-2 mb-2">
        <label>Book ID:</label>
        <input v-model="bookId" type="number" class="border px-2 py-1 rounded" />
      </div>
      
      <div class="flex gap-2 mb-2">
        <label>Primary Color:</label>
        <input v-model="primaryColor" type="color" class="border rounded" />
      </div>
      
      <div class="flex gap-2 mb-2">
        <label>Secondary Color:</label>
        <input v-model="secondaryColor" type="color" class="border rounded" />
      </div>
    </div>
    
    <div class="h-20 w-full mb-4 rounded" :style="{ background: gradient }"></div>
    
    <div class="flex gap-2">
      <button @click="saveColors" class="px-4 py-2 bg-blue-500 text-white rounded">
        Save Colors
      </button>
      <button @click="checkColors" class="px-4 py-2 bg-green-500 text-white rounded">
        Check Colors
      </button>
    </div>
    
    <div v-if="result" class="mt-4 p-3 border rounded bg-gray-100">
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { BookService } from '@/service/BookService';

const bookId = ref(1);
const primaryColor = ref('#1E3A8A');
const secondaryColor = ref('#3B82F6');
const result = ref(null);

const gradient = computed(() => {
  return `linear-gradient(135deg, ${primaryColor.value}, ${secondaryColor.value})`;
});

const saveColors = async () => {
  try {
    result.value = { status: 'Saving...' };
    
    const response = await BookService.updateBook(
      bookId.value,
      {
        gradient_primary_color: primaryColor.value,
        gradient_secondary_color: secondaryColor.value
      }
    );
    
    result.value = {
      status: 'Success',
      response
    };
    
    // Verify immediately
    await checkColors();
  } catch (error) {
    result.value = {
      status: 'Error',
      error: error.message,
      response: error.response?.data
    };
  }
};

const checkColors = async () => {
  try {
    result.value = { status: 'Checking...' };
    
    const book = await BookService.getBook(bookId.value);
    
    result.value = {
      status: 'Check Result',
      colors: {
        gradient_primary_color: book.gradient_primary_color,
        gradient_secondary_color: book.gradient_secondary_color
      }
    };
  } catch (error) {
    result.value = {
      status: 'Check Error',
      error: error.message
    };
  }
};
</script> 