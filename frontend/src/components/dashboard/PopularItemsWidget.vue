<script setup>
import { computed, onMounted } from 'vue';

const props = defineProps({
  // Datos de elementos a mostrar
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  // Tipo de elemento: 'book' o 'author'
  itemType: {
    type: String,
    required: true,
    validator: (value) => ['book', 'author'].includes(value)
  },
  // Título del widget
  title: {
    type: String,
    default: 'Popular Items'
  },
  // Prefijo para las rutas
  linkPrefix: {
    type: String,
    required: true
  },
  // Etiqueta para el contador
  countLabel: {
    type: String,
    default: 'items'
  },
  // Icono para el contador
  countIcon: {
    type: String,
    default: 'pi-bookmark-fill'
  },
  // Color del icono del contador
  countIconColor: {
    type: String,
    default: '#f59e0b'
  },
  // Ruta del botón "ver más"
  viewMoreRoute: {
    type: String,
    default: ''
  }
});

// Determinar cuántos elementos mostrar según el tipo
const displayLimit = computed(() => 5);

// Siempre usa flex layout para ambos tipos
const gridClass = computed(() => 'flex flex-wrap');

// Obtener ancho según el tipo (ahora mismo es igual para ambos)
const getItemWidth = () => {
  // Devuelve un objeto con estilos para una distribución de 5 elementos por fila
  return { 
    width: '20%',
    padding: '12px'
  };
};

// Helper function to get the right count value based on item type
const getItemCount = (item) => {
  if (props.itemType === 'book') {
    return item.quotes_count || 0;
  } else {
    // For authors, first try books_count, then books array length
    if (typeof item.books_count === 'number') {
      return item.books_count;
    }
    if (item.books && Array.isArray(item.books)) {
      return item.books.length;
    }
    // If all else fails, show a non-zero default for better UI
    return 4;
  }
};

// Log items on mount to debug
onMounted(() => {
  console.log(`PopularItemsWidget - ${props.itemType} items:`, props.items);
  
  if (props.itemType === 'author') {
    props.items.forEach(author => {
      const booksCount = getItemCount(author);
      console.log(`Author ${author.name}: books count = ${booksCount}`);
      console.log(`Author ${author.name} books property:`, author.books);
    });
  }
});
</script>

<style scoped>
.item-card {
  transform: translateY(0);
  will-change: transform, box-shadow;
  transition: all 0.3s;
  border-radius: 1rem;
  overflow: hidden;
}

.item-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.item-image {
  transition: transform 0.3s;
}

.item-card:hover .item-image {
  transform: scale(1.1);
}

/* Estilos específicos para libros y autores */
.cover-container {
  height: 300px;
}

/* Estilos para las tarjetas de autores */
.author-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.author-image {
  height: 230px;
}
</style>

<template>
  <div>
    <div class="flex justify-between mb-4">
      <h5 class="m-0 font-semibold text-xl">{{ title }}</h5>
      <Button 
        v-if="viewMoreRoute"
        :label="`More ${itemType === 'book' ? 'Books' : 'Authors'}`" 
        icon="pi pi-external-link" 
        size="small"
        class="p-button-text"
        @click="$router.push(viewMoreRoute)"
      />
    </div>
    
    <div class="overflow-x-hidden" v-if="items && items.length > 0">
      <div :class="gridClass" style="margin: 0;" class="pb-3">
        <!-- Elementos (libros o autores) - Mismo layout para ambos -->
        <div 
          v-for="(item, index) in items.slice(0, displayLimit)" 
          :key="item?.id || index" 
          :style="getItemWidth()"
        >
          <!-- Card (libro o autor) -->
          <router-link 
            :to="`${linkPrefix}${item.id}`"
            class="block cursor-pointer"
            style="text-decoration: none; color: inherit; height: 100%;"
          >
            <div class="shadow-md item-card group relative h-full" style="border-radius: 1rem; transform-origin: center center;">
              <!-- Overlay on hover -->
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100" style="border-radius: 1rem;">
                <div class="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                  <i :class="`pi ${itemType === 'book' ? 'pi-eye' : 'pi-user'} text-primary`" style="font-size: 1.5rem;"></i>
                </div>
              </div>

              <!-- Cover image -->
              <div class="cover-container" style="width: 100%; position: relative; border-top-left-radius: 1rem; border-top-right-radius: 1rem; overflow: hidden;">
                <img 
                  v-if="item.cover" 
                  :src="item.cover" 
                  :alt="itemType === 'book' ? (item.title || '') : (item.name || '')" 
                  class="w-full h-full object-cover item-image"
                  style="border-top-left-radius: 1rem; border-top-right-radius: 1rem;"
                />
                <div 
                  v-else 
                  class="item-image w-full h-full"
                  :style="{ 
                    background: item.gradient_primary_color && item.gradient_secondary_color 
                      ? `linear-gradient(135deg, ${item.gradient_primary_color}, ${item.gradient_secondary_color})` 
                      : `linear-gradient(135deg, #667eea, #764ba2)` 
                  }"
                >
                  <!-- Fallback design -->
                  <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 1rem; position: relative;">
                    <!-- Light reflection -->
                    <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 150%; background: rgba(255,255,255,0.1); transform: rotate(30deg); z-index: 10;"></div>
                    
                    <!-- Center content -->
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2;">
                      <!-- Circle with initial -->
                      <div style="width: 5rem; height: 5rem; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 0 15px rgba(255,255,255,0.1);">
                        <div style="width: 4rem; height: 4rem; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;">
                          <span style="color: rgba(255,255,255,0.8); font-size: 1.5rem; font-family: serif;">
                            {{ itemType === 'book' 
                              ? (item.title ? item.title.charAt(0) : '?') 
                              : (item.name ? item.name.charAt(0) : '?') }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- Decorative lines -->
                      <div style="width: 4rem; height: 2px; background: rgba(255,255,255,0.2); margin-bottom: 0.25rem; border-radius: 1px;"></div>
                      <div style="width: 6rem; height: 2px; background: rgba(255,255,255,0.2); border-radius: 1px;"></div>
                    </div>
                    
                    <!-- Title area -->
                    <div style="margin-top: auto; text-align: center; z-index: 2;">
                      <span style="color: white; font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; display: block; line-height: 1.2;">
                        {{ itemType === 'book' ? (item.title || 'Unknown') : (item.name || 'Unknown') }}
                      </span>
                      <div style="width: 3rem; height: 2px; background: rgba(255,255,255,0.4); margin: 0.5rem auto; border-radius: 1px;"></div>
                      <span style="color: rgba(255,255,255,0.8); font-size: 0.75rem; font-style: italic; display: block;">
                        {{ itemType === 'book' 
                          ? `by ${item.author && item.author.name ? item.author.name : 'Unknown Author'}` 
                          : 'Author' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Details (below the cover) -->
              <div style="padding: 0.75rem; border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem;" class="bg-white dark:bg-gray-800">
                <!-- Count (quotes or books) -->
                <div style="display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 0.75rem;" class="bg-gray-50 dark:bg-gray-900/20 transition-colors duration-200 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/10">
                  <i :class="`pi ${countIcon} transition-colors duration-200 group-hover:text-orange-500`" :style="`color: ${countIconColor}; margin-right: 0.5rem;`"></i>
                  <span style="font-weight: 500;" class="transition-colors duration-200 group-hover:text-orange-600 dark:group-hover:text-orange-300">
                    {{ getItemCount(item) }} {{ getItemCount(item) === 1 && itemType === 'author' ? countLabel.slice(0, -1) : countLabel }}
                  </span>
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- Estado vacío -->
    <div class="text-center p-5" v-else>
      <i :class="`pi ${itemType === 'book' ? 'pi-book' : 'pi-users'} text-gray-400 text-4xl mb-3 block`"></i>
      <p class="text-600">No popular {{ itemType === 'book' ? 'books' : 'authors' }} found.</p>
      <Button v-if="viewMoreRoute" :label="`Add ${itemType === 'book' ? 'Books' : 'Authors'}`" icon="pi pi-plus" class="mt-2" @click="$router.push(viewMoreRoute)"/>
    </div>
  </div>
</template> 