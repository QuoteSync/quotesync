<script setup>
import { onMounted, ref } from 'vue';
import { StatisticsService } from '@/service/StatisticsService';

const stats = ref({
  totalBooks: 0,
  booksWithoutCovers: 0,
  totalAuthors: 0,
  totalQuotes: 0,
  quoteLists: 0,
  quoteGroups: 0
});

onMounted(async () => {
  try {
    const apiStats = await StatisticsService.getStatistics();
    
    // Map API stats to component state
    stats.value.totalBooks = apiStats.total_books;
    stats.value.booksWithoutCovers = apiStats.books_without_covers;
    stats.value.totalAuthors = apiStats.total_authors;
    stats.value.totalQuotes = apiStats.total_quotes;
    stats.value.quoteLists = apiStats.quote_lists;
    stats.value.quoteGroups = apiStats.quote_groups;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
});
</script>

<template>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Books</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalBooks }}</div>
                </div>
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-book text-blue-500 !text-xl"></i>
                </div>
            </div>
            <span class="text-primary font-medium">{{ stats.booksWithoutCovers }} </span>
            <span class="text-muted-color">without covers</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Authors</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalAuthors }}</div>
                </div>
                <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-user text-orange-500 !text-xl"></i>
                </div>
            </div>
            <span class="text-primary font-medium">{{ Math.round(stats.totalAuthors / Math.max(stats.totalBooks, 1) * 100) }}% </span>
            <span class="text-muted-color">author to book ratio</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Quote Lists</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.quoteLists }}</div>
                </div>
                <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-list text-cyan-500 !text-xl"></i>
                </div>
            </div>
            <span class="text-primary font-medium">{{ stats.quoteGroups }}</span>
            <span class="text-muted-color"> quote groups</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Quotes</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalQuotes }}</div>
                </div>
                <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-comment text-purple-500 !text-xl"></i>
                </div>
            </div>
            <span class="text-primary font-medium">{{ Math.round(stats.totalQuotes / Math.max(stats.totalBooks, 1)) }} </span>
            <span class="text-muted-color">average quotes per book</span>
        </div>
    </div>
</template>
