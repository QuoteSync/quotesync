<script setup>
import { onMounted, ref } from 'vue';
import { QuoteGroupService } from '@/service/QuoteGroupService';
import { useRouter } from 'vue-router';

const router = useRouter();
const quoteGroups = ref([]);
const loading = ref(true);
const hoverGroup = ref(null);
const groupStats = ref({}); // Store stats for each group

// Predefined gradient pairs for group cards
const gradients = [
  { primary: '#4158D0', secondary: '#C850C0' },
  { primary: '#0093E9', secondary: '#80D0C7' },
  { primary: '#8EC5FC', secondary: '#E0C3FC' },
  { primary: '#FBAB7E', secondary: '#F7CE68' },
  { primary: '#85FFBD', secondary: '#FFFB7D' },
  { primary: '#FF9A8B', secondary: '#FF6A88' },
  { primary: '#74EBD5', secondary: '#9FACE6' },
  { primary: '#F4D03F', secondary: '#16A085' },
];

// Generate a consistent gradient for a group based on its ID
const getGroupGradient = (groupId) => {
  // Use the last digit of the group ID to select a gradient
  const index = parseInt(groupId.toString().slice(-1)) % gradients.length;
  return gradients[index];
};

// Get quote count for a group - in a real app this would fetch from API
const getQuoteCount = (groupId) => {
  if (groupStats.value[groupId]?.quotes !== undefined) {
    return groupStats.value[groupId].quotes;
  }
  return 0;
};

// Get comment count for a group - in a real app this would fetch from API
const getCommentCount = (groupId) => {
  if (groupStats.value[groupId]?.comments !== undefined) {
    return groupStats.value[groupId].comments;
  }
  return 0;
};

onMounted(async () => {
  try {
    // Fetch quote groups
    quoteGroups.value = await QuoteGroupService.getGroups();
    
    // In a real implementation, you would fetch actual stats from an API
    // For demo purposes, we'll generate reasonable mock data
    quoteGroups.value.forEach(group => {
      // Generate pseudo-random but consistent stats based on group id
      const groupIdSum = group.id.toString().split('').reduce((a, b) => a + parseInt(b || 0), 0);
      const memberCount = group.members?.length || 0;
      
      groupStats.value[group.id] = {
        quotes: Math.max(5, (groupIdSum % 10) * 4 + memberCount * 3),
        comments: Math.max(2, (groupIdSum % 5) * 3 + memberCount)
      };
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
});

const navigateToGroup = (groupId) => {
  router.push(`/groups/${groupId}`);
};

const setHoverGroup = (groupId) => {
  hoverGroup.value = groupId;
};

const clearHoverGroup = () => {
  hoverGroup.value = null;
};
</script>

<template>
  <div>
    <ProgressSpinner v-if="loading" class="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
    
    <div v-else-if="quoteGroups.length > 0" class="grid">
      <div v-for="group in quoteGroups" :key="group.id" 
           class="col-12 md:col-6 p-2 cursor-pointer" 
           @click="navigateToGroup(group.id)"
           @mouseenter="setHoverGroup(group.id)"
           @mouseleave="clearHoverGroup()">
        <div class="group-card" 
          :class="{ 'hovered': hoverGroup === group.id }"
          :style="{
            background: `linear-gradient(135deg, ${getGroupGradient(group.id).primary}, ${getGroupGradient(group.id).secondary})`
          }">
          <div class="group-decoration-dots"></div>
          <div class="group-decoration-circle"></div>
          
          <div class="group-icon">
            <i class="pi pi-users text-white text-xl"></i>
          </div>
          <div class="group-content">
            <h3 class="group-title">{{ group.name }}</h3>
            <p class="group-members">
              <i class="pi pi-user mr-2"></i>
              {{ group.members?.length || 0 }} members
            </p>
            <div class="group-stats">
              <span class="group-stat">
                <i class="pi pi-book mr-1"></i>
                {{ getQuoteCount(group.id) }}
              </span>
              <span class="group-stat">
                <i class="pi pi-comment mr-1"></i>
                {{ getCommentCount(group.id) }}
              </span>
            </div>
            <div class="group-action">
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
      <i class="pi pi-users text-4xl text-primary mb-3"></i>
      <span class="text-xl font-medium">No Quote Groups</span>
      <p class="text-color-secondary">Create a group to share quotes with others</p>
      <Button 
        label="Create Group" 
        icon="pi pi-plus" 
        class="p-button-rounded mt-3"
        @click="router.push('/groups')"
      />
    </div>
  </div>
</template>

<style scoped>
.no-header-padding {
  padding-top: 0;
}

.group-card {
  border-radius: 24px;
  padding: 1.5rem;
  color: white;
  height: 100%;
  min-height: 180px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.group-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  border-radius: 24px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.group-card::after {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
  top: -50%;
  left: -50%;
  opacity: 0;
  transition: opacity 0.5s ease, transform 0.7s ease;
  pointer-events: none;
  transform: translate(100%, 100%);
}

.group-card.hovered {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.group-card.hovered::before {
  opacity: 1;
}

.group-card.hovered::after {
  opacity: 0.8;
  transform: translate(0, 0);
}

.group-content {
  position: relative;
  z-index: 2;
}

.group-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.group-card.hovered .group-icon {
  transform: scale(1.1) rotate(5deg);
  background: rgba(255, 255, 255, 0.3);
}

.group-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.group-card.hovered .group-title {
  transform: translateX(5px);
}

.group-members {
  font-size: 0.95rem;
  opacity: 0.9;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.group-card.hovered .group-members {
  opacity: 1;
  transform: translateX(5px);
}

.group-action {
  position: absolute;
  right: 0;
  bottom: 0;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.group-card.hovered .group-action {
  opacity: 1;
  transform: translateX(0);
}

.group-action .p-button-rounded {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
  width: 3rem;
  height: 3rem;
  transition: all 0.3s ease;
}

.group-card.hovered .group-action .p-button-rounded {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.empty-state:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

.group-decoration-dots {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 4rem;
  height: 4rem;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
  background-size: 8px 8px;
  border-radius: 50%;
  opacity: 0.5;
  transition: all 0.5s ease;
}

.group-decoration-circle {
  position: absolute;
  bottom: -2rem;
  right: -2rem;
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0.3;
  transition: all 0.5s ease;
}

.group-card.hovered .group-decoration-dots {
  transform: rotate(15deg) scale(1.2);
  opacity: 0.7;
}

.group-card.hovered .group-decoration-circle {
  transform: scale(1.1);
  opacity: 0.4;
}

.group-stats {
  display: flex;
  margin-top: 0.5rem;
  gap: 1rem;
}

.group-stat {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.group-card.hovered .group-stat {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}
</style>
