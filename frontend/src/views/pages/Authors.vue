<script setup>
import { ref, onMounted } from "vue";
import { AuthorService } from "@/service/AuthorService";

// DataView layout options
const layout = ref("list");
const options = ref(["list", "grid"]);

// Store the list of authors
const authors = ref([]);

onMounted(async () => {
  // Call the API to get authors data
  const data = await AuthorService.getAuthors();
  // Assuming data is an array of authors with image, name, description, and rating properties
  authors.value = data;
});
</script>

<template>
  <div class="flex flex-col">
    <div class="card">
      <div class="font-semibold text-xl">Authors</div>
      <DataView :value="authors" :layout="layout">
        <template #header>
          <div class="flex justify-end">
            <SelectButton v-model="layout" :options="options" :allowEmpty="false">
              <template #option="{ option }">
                <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
              </template>
            </SelectButton>
          </div>
        </template>

        <!-- List Layout -->
        <template #list="slotProps">
          <div class="flex flex-col">
            <div v-for="(author, index) in slotProps.items" :key="index">
              <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                :class="{ 'border-t border-surface': index !== 0 }">
                <div class="md:w-40 relative">
                  <img class="block xl:block mx-auto rounded w-full" :src="author.cover" :alt="author.name" />
                </div>

                <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                  <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                    <span class="text-xl font-semibold">{{ author.name }}</span>
                    <div>
                      <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ author.bio }}</span>
                      <!-- <div class="text-lg font-medium mt-2">{{ author.name }}</div> -->
                    </div>
                  </div>
                  <div class="flex flex-col md:items-end gap-8">
                    <div class="bg-surface-100 p-1" style="border-radius: 30px">
                      <div class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2" style="
                          border-radius: 30px;
                          box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.04),
                            0px 1px 2px 0px rgba(0, 0, 0, 0.06);
                        ">
                        <span class="text-surface-900 font-medium text-sm">5.0</span>
                        <i class="pi pi-star-fill text-yellow-500"></i>
                      </div>
                    </div>
                    <div class="flex flex-row-reverse md:flex-row gap-2">
                      <Button icon="pi pi-heart" outlined></Button>
                      <Button icon="pi pi-shopping-cart" label="Buy Now"
                        class="flex-auto md:flex-initial whitespace-nowrap"></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Grid Layout -->
        <template #grid="slotProps">
          <div class="grid grid-cols-12 gap-4">
            <div v-for="(author, index) in slotProps.items" :key="index"
              class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
              <div
                class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col">
                <div class="bg-surface-50 flex justify-center rounded p-4">
                  <div class="relative mx-auto">
                    <img class="rounded w-full" :src="author.cover" :alt="author.name" style="max-width: 300px" />
                  </div>
                </div>
                <div class="pt-6">
                  <div class="flex flex-row justify-between items-start gap-2">
                    <div>
                      <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ author.bio }}</span>
                      <!-- <div class="text-lg font-medium mt-1">{{ author.name }}</div> -->
                      <span class="text-2xl font-semibold">{{ author.name }}</span>
                    </div>
                    <div class="bg-surface-100 p-1" style="border-radius: 30px">
                      <div class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2" style="
                          border-radius: 30px;
                          box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.04),
                            0px 1px 2px 0px rgba(0, 0, 0, 0.06);
                        ">
                        <span class="text-surface-900 font-medium text-sm">5.0</span>
                        <i class="pi pi-star-fill text-yellow-500"></i>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col gap-6 mt-6">
                    <div class="flex gap-2">
                      <Button icon="pi pi-book" label="Reed More" class="flex-auto whitespace-nowrap"></Button>
                      <Button icon="pi pi-heart" outlined></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </div>
  </div>
</template>
