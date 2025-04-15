<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getCoverUrl } from '@/service/BookService';

const props = defineProps({
  // Can be either a cover ID or a full URL
  coverId: {
    type: String,
    default: null
  },
  bookTitle: {
    type: String,
    default: 'Book'
  },
  authorName: {
    type: String,
    default: 'Author'
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '100%'
  },
  fallbackGradient: {
    type: String,
    default: 'linear-gradient(135deg, #4158D0, #C850C0)'
  },
  rounded: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '/assets/images/book-placeholder.png'
  }
});

const emit = defineEmits(['loaded', 'error']);

// State
const imageUrl = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const uniqueId = ref(`cover-${Math.random().toString(36).substring(2, 9)}`);

// Computed styles
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.rounded ? '0.5rem' : '0',
  overflow: 'hidden',
  position: 'relative'
}));

const gradientStyle = computed(() => ({
  background: props.fallbackGradient,
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  borderRadius: props.rounded ? '0.5rem' : '0'
}));

// Load cover from cache or fetch it
const loadCover = async () => {
  if (!props.coverId) {
    hasError.value = true;
    isLoading.value = false;
    emit('error');
    return;
  }
  
  try {
    isLoading.value = true;
    hasError.value = false;
    
    // Get the URL, either from cache or by fetching (handled by getCoverUrl)
    imageUrl.value = await getCoverUrl(props.coverId);
    
    // The imageUrl might be a blob URL from cache, or the direct URL if not yet cached
    isLoading.value = false;
    emit('loaded', imageUrl.value);
  } catch (error) {
    console.error('Error loading cover:', error);
    hasError.value = true;
    isLoading.value = false;
    emit('error');
  }
};

// Handle image load error
const handleImageError = () => {
  hasError.value = true;
  isLoading.value = false;
  emit('error');
};

// Handle image load success
const handleImageLoad = () => {
  hasError.value = false;
  isLoading.value = false;
  emit('loaded', imageUrl.value);
};

// Watch for coverId changes
watch(() => props.coverId, (newCoverId) => {
  if (newCoverId) {
    loadCover();
  } else {
    imageUrl.value = null;
    hasError.value = true;
    isLoading.value = false;
  }
});

// Load cover on mount
onMounted(() => {
  if (props.coverId) {
    loadCover();
  } else {
    isLoading.value = false;
    hasError.value = true;
  }
});
</script>

<template>
  <div :style="containerStyle" :id="uniqueId" class="cached-book-cover">
    <!-- Loading state -->
    <div v-if="isLoading" class="cover-loading-state">
      <div class="cover-loading-spinner"></div>
    </div>
    
    <!-- Image if loading succeeded -->
    <img 
      v-if="imageUrl && !hasError" 
      :src="imageUrl"
      :alt="bookTitle"
      class="cover-image"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    
    <!-- Gradient fallback if loading failed or no cover -->
    <div v-if="!imageUrl || hasError" :style="gradientStyle" class="cover-fallback">
      <!-- Book-like cover design -->
      <div class="fallback-content">
        <!-- Light reflection effect -->
        <div class="light-reflection"></div>
        
        <!-- Book title and author -->
        <div class="book-info">
          <span class="book-title">{{ bookTitle.split(' ').slice(0, 8).join(' ') }}{{ bookTitle.split(' ').length > 8 ? '...' : '' }}</span>
          <span class="book-author">by {{ authorName }}</span>
          <div class="image-unavailable">
            <i class="pi pi-image"></i>
            <span>Image unavailable</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cached-book-cover {
  display: block;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.cover-loading-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
}

.cover-loading-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--primary-color, #4158D0);
  animation: spin 1s infinite linear;
}

.fallback-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.light-reflection {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 150%;
  background-color: white;
  opacity: 0.1;
  transform: rotate(30deg) translateX(-10px) translateY(-10px);
}

.book-info {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  text-align: center;
  z-index: 10;
}

.book-title {
  color: white;
  font-weight: bold;
  font-size: 1rem;
  line-height: 1.2;
}

.book-author {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.image-unavailable {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-unavailable i {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

.image-unavailable span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 