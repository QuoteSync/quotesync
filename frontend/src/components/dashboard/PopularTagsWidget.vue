<script setup>
import { onMounted, ref } from 'vue';
import { TagService } from '@/service/TagService';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';

const router = useRouter();
const tags = ref([]);
const loading = ref(true);
const hoverTag = ref(null);
const isMobile = ref(false);
const isTablet = ref(false);

// Check screen size
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 640; // Small screens (phones)
  isTablet.value = window.innerWidth >= 640 && window.innerWidth < 1024; // Medium screens (tablets)
};

// Predefined gradient pairs for tag cards
const gradients = [
  { primary: '#6DD5FA', secondary: '#2980B9' },
  { primary: '#FF9966', secondary: '#FF5E62' },
  { primary: '#A8BFFF', secondary: '#884D80' },
  { primary: '#00CDAC', secondary: '#02AAB0' },
  { primary: '#FBD786', secondary: '#f7797d' },
  { primary: '#66A6FF', secondary: '#89F7FE' },
  { primary: '#DA4453', secondary: '#89216B' },
  { primary: '#654EA3', secondary: '#EAAFC8' },
];

// Get gradient for a tag
const getTagGradient = (tag) => {
  if (tag.gradient_primary_color && tag.gradient_secondary_color) {
    return {
      primary: tag.gradient_primary_color,
      secondary: tag.gradient_secondary_color
    };
  }
  
  // Use the tag's id to select a gradient
  const hash = tag.id.toString().split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const index = hash % gradients.length;
  return gradients[index];
};

// Determine the number of tags to display based on screen size
const displayLimit = () => {
  if (isMobile.value) return 3; // Show fewer on small screens
  if (isTablet.value) return 4;
  return 5; // Show all on large screens
};

const setHoverTag = (tagId) => {
  hoverTag.value = tagId;
};

const clearHoverTag = () => {
  hoverTag.value = null;
};

const navigateToTag = (tagId) => {
  router.push(`/tags/${tagId}`);
};

onMounted(async () => {
  try {
    loading.value = true;
    
    // Initialize screen size check
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    const allTags = await TagService.getTags();
    
    // Sort tags by number of quotes (highest to lowest)
    const sortedTags = allTags.sort((a, b) => {
      const quotesA = a.quotes_count || 0;
      const quotesB = b.quotes_count || 0;
      return quotesB - quotesA;
    });
    
    // Take the top tags based on screen size
    tags.value = sortedTags.slice(0, displayLimit());
    
  } catch (error) {
    console.error('Error fetching tags:', error);
    tags.value = [];
  } finally {
    loading.value = false;
  }
  
  return () => {
    window.removeEventListener('resize', checkScreenSize);
  };
});
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-content-center p-4">
      <ProgressSpinner class="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
    </div>
    
    <div v-else-if="tags.length > 0" class="grid">
      <div v-for="tag in tags" :key="tag.id" 
           class="col-12 sm:col-6 lg:col-3 p-2" 
           @mouseenter="setHoverTag(tag.id)"
           @mouseleave="clearHoverTag()">
        <div class="tag-card" 
             :class="{ 'hovered': hoverTag === tag.id }"
             :style="{
               background: `linear-gradient(135deg, ${getTagGradient(tag).primary}, ${getTagGradient(tag).secondary})`
             }"
             @click="navigateToTag(tag.id)">
          <div class="tag-content">
            <div class="tag-icon">
              <i class="pi pi-tag text-white text-xl"></i>
            </div>
            <h3 class="tag-title">{{ tag.title }}</h3>
            <p class="tag-description" v-if="tag.description">{{ tag.description }}</p>
            
            <div class="tag-stats">
              <div class="stats-item">
                <i class="pi pi-comment mr-2"></i>
                <span>{{ tag.quotes_count || 0 }} quotes</span>
              </div>
              <div class="tag-favorite" v-if="tag.is_favorite">
                <i class="pi pi-heart-fill"></i>
              </div>
            </div>
            
            <div class="tag-action">
              <Button 
                icon="pi pi-arrow-right" 
                class="p-button-rounded p-button-text" 
                style="color: white;" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <i class="pi pi-tags text-4xl text-primary mb-3"></i>
      <span class="text-xl font-medium">No Tags Found</span>
      <p class="text-color-secondary">Create tags to organize your quotes</p>
      <Button 
        label="Create Tag" 
        icon="pi pi-plus" 
        class="p-button-rounded mt-3"
        @click="router.push('/tags')"
      />
    </div>
  </div>
</template>

<style scoped>
.tag-card {
  border-radius: 24px;
  padding: 1.5rem;
  color: white;
  height: 100%;
  min-height: 180px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tag-card::before {
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

.tag-card.hovered {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.tag-card.hovered::before {
  opacity: 1;
}

.tag-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tag-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 3rem;
  height: 3rem;
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease;
}

.tag-card.hovered .tag-icon {
  transform: scale(1.1);
}

.tag-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  line-height: 1.3;
}

.tag-description {
  font-size: 0.95rem;
  opacity: 0.9;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-stats {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.stats-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  opacity: 0.9;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-favorite {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-left: 8px;
  flex-shrink: 0;
}

.tag-action {
  position: absolute;
  right: 0;
  bottom: 0;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.tag-card.hovered .tag-action {
  opacity: 1;
  transform: translateX(0);
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

/* Responsive styles for mobile */
@media screen and (max-width: 639px) {
  .tag-card {
    padding: 1rem;
    min-height: 160px;
  }
  
  .tag-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 1.25rem;
    margin-bottom: 0.75rem;
  }
  
  .tag-title {
    font-size: 1.1rem;
    margin-bottom: 0.3rem;
  }
  
  .tag-description {
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
  
  .stats-item {
    font-size: 0.8rem;
  }
  
  .tag-favorite {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.75rem;
  }
}
</style> 