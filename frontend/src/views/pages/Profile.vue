<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { QuoteService } from '@/service/QuoteService';
import { UserService } from '@/service/UserService';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import ProgressBar from 'primevue/progressbar';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Chart from 'primevue/chart';
import FileUpload from 'primevue/fileupload';
import InputNumber from 'primevue/inputnumber';
import Tag from 'primevue/tag';

const toast = useToast();
const loading = ref(true);
const user = ref({});
const stats = ref({
  totalQuotes: 0,
  totalBooks: 0,
  totalAuthors: 0,
  totalTags: 0,
  completedProfile: 0
});
const userActivity = ref([]);
const showEditDialog = ref(false);
const editedUser = ref({});
const changePassword = ref(false);
const passwords = ref({
  current: '',
  new: '',
  confirm: ''
});
const activityChartData = ref(null);
const activityChartOptions = ref(null);
const showGoalsDialog = ref(false);
const editedGoals = ref({
  quotes_goal: 0,
  books_goal: 0,
  authors_goal: 0
});

// Predefined gradients for the profile header
const headerGradient = {
  primary: '#4158D0',
  secondary: '#C850C0',
  tertiary: '#FFCC70'
};

// Calculate profile completion percentage
const profileCompletionPercentage = computed(() => {
  if (!user.value) return 0;
  
  let completed = 0;
  let total = 0;
  
  // Count filled fields
  const fields = [
    'username', 'email', 'first_name', 'last_name', 'avatar'
  ];
  
  fields.forEach(field => {
    total++;
    if (user.value[field]) completed++;
  });
  
  return Math.round((completed / total) * 100);
});

// Format date to readable string
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Open edit dialog
const openEditDialog = () => {
  editedUser.value = { 
    ...user.value,
  };
  changePassword.value = false;
  passwords.value = { current: '', new: '', confirm: '' };
  showEditDialog.value = true;
};

// Save profile changes
const saveProfile = async () => {
  try {
    loading.value = true;
    
    // Save profile info
    const updatedUser = await UserService.updateProfile(editedUser.value);
    
    // Change password if requested
    if (changePassword.value) {
      if (passwords.value.new !== passwords.value.confirm) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'New passwords do not match',
          life: 3000
        });
        loading.value = false;
        return;
      }
      
      await UserService.changePassword(
        passwords.value.current,
        passwords.value.new
      );
    }
    
    user.value = updatedUser;
    showEditDialog.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Profile updated successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update profile',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Upload avatar image
const uploadAvatar = async (event) => {
  try {
    let file;
    
    // Handle both direct file and event with files property
    if (event.files && event.files[0]) {
      file = event.files[0]; // PrimeVue FileUpload format
    } else if (event.target && event.target.files && event.target.files[0]) {
      file = event.target.files[0]; // Native input element format
    } else {
      console.error('No valid file found in event:', event);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No file selected',
        life: 3000
      });
      return;
    }
    
    console.log('Uploading file:', file);
    const response = await UserService.uploadAvatar(file);
    
    // Update the displayed avatar immediately
    user.value.avatar = response.avatar_url;
    if (editedUser.value) {
      editedUser.value.avatar = response.avatar_url;
    }
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Avatar uploaded successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to upload avatar',
      life: 3000
    });
  }
};

// Initialize chart data
const setupChartData = (activityData) => {
  try {
    console.log("Setting up chart data with:", activityData);
    
    // Ensure activityData is valid
    if (!activityData || !Array.isArray(activityData) || activityData.length === 0) {
      console.warn("No valid activity data provided");
      activityChartData.value = null;
      activityChartOptions.value = null;
      return;
    }
    
    // Get last 7 days
    const dates = [];
    const quotesData = [];
    const importsData = [];
    const goalLine = [];
    
    // Calculate daily quote goal - use 1/30th of the monthly quotes goal as daily target
    // Default to 3 if quotes_goal is undefined
    const dailyQuoteGoal = Math.round((stats.value.quotes_goal || 100) / 30);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      
      // Find activity count for this date
      const formattedDate = date.toISOString().split('T')[0];
      const activity = activityData.find(a => a.date === formattedDate);
      
      // Handle different API response formats
      if (activity) {
        // Format 1: Backend API with quotes_count and imports_count
        if ('quotes_count' in activity && 'imports_count' in activity) {
          quotesData.push(activity.quotes_count || 0);
          importsData.push(activity.imports_count || 0);
        } 
        // Format 2: Backend API with just total_count 
        else if ('total_count' in activity) {
          // Split total_count - assume 70% quotes, 30% imports
          const quotesCount = Math.round(activity.total_count * 0.7);
          const importsCount = activity.total_count - quotesCount;
          quotesData.push(quotesCount);
          importsData.push(importsCount);
        }
        // Format 3: Old mock data format with just count
        else if ('count' in activity) {
          const quotesCount = Math.round(activity.count * 0.7);
          const importsCount = activity.count - quotesCount;
          quotesData.push(quotesCount);
          importsData.push(importsCount);
        }
        // Default to 0 if no recognized format
        else {
          quotesData.push(0);
          importsData.push(0);
        }
      } else {
        quotesData.push(0);
        importsData.push(0);
      }
      
      // Add goal line
      goalLine.push(dailyQuoteGoal);
    }
    
    activityChartData.value = {
      labels: dates,
      datasets: [
        {
          label: 'Quotes Created',
          data: quotesData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Quotes Imported',
          data: importsData,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Daily Goal',
          data: goalLine,
          backgroundColor: 'transparent',
          borderColor: 'rgba(200, 80, 192, 0.8)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
          fill: false
        }
      ]
    };
    
    activityChartOptions.value = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            footer: (tooltipItems) => {
              const dataIndex = tooltipItems[0].dataIndex;
              
              if (tooltipItems[0].datasetIndex !== 2) { // Not for goal line
                const activity = activityData[6 - dataIndex]; // Reverse index since we're showing oldest to newest
                if (activity && activity.details && activity.details.length > 0) {
                  return `${activity.details.length} activities on this day`;
                }
              }
              return null;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            drawBorder: false
          },
          ticks: {
            callback: function(value) {
              return value;
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    };
    
    console.log("Chart data setup complete:", activityChartData.value);
  } catch (error) {
    console.error('Error setting up chart data:', error);
    activityChartData.value = null;
    activityChartOptions.value = null;
  }
};

// Load user data and stats
onMounted(async () => {
  try {
    loading.value = true;
    
    // Get user profile
    const userData = await UserService.getProfile();
    user.value = userData;
    
    // Get user stats
    const userStats = await UserService.getUserStats();
    stats.value = {
      ...userStats,
      completedProfile: profileCompletionPercentage.value
    };
    
    try {
      // Get activity data in a separate try/catch block
      const activityData = await UserService.getUserActivity();
      userActivity.value = activityData;
      
      // Set up chart data
      setupChartData(activityData);
    } catch (activityError) {
      console.error('Error loading activity data:', activityError);
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Could not load activity data',
        life: 3000
      });
      
      // Set userActivity to an empty array to avoid rendering errors
      userActivity.value = [];
    }
    
  } catch (error) {
    console.error('Error loading profile:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load profile',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
});

// Save goals
const saveGoals = async () => {
  try {
    loading.value = true;
    
    // Save goals
    await UserService.updateUserGoals(editedGoals.value);
    
    // Get updated stats
    const updatedStats = await UserService.getUserStats();
    stats.value = {
      ...updatedStats,
      completedProfile: profileCompletionPercentage.value
    };
    
    showGoalsDialog.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Goals updated successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error updating goals:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update goals',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Open goals dialog
const openGoalsDialog = () => {
  // Copy the current goals from stats
  editedGoals.value = {
    quotes_goal: stats.value.quotes_goal || 100,
    books_goal: stats.value.books_goal || 30,
    authors_goal: stats.value.authors_goal || 20
  };
  showGoalsDialog.value = true;
};

// Add these functions in the script setup section, after the formatDate function:
const getSubscriptionLabel = (type) => {
  switch (type) {
    case 'free':
      return 'Free Plan';
    case 'reader':
      return 'Reader Plan';
    case 'scholar':
      return 'Scholar Plan';
    default:
      return 'Free Plan';
  }
};

const getSubscriptionSeverity = (type) => {
  switch (type) {
    case 'free':
      return 'info';
    case 'reader':
      return 'success';
    case 'scholar':
      return 'warning';
    default:
      return 'info';
  }
};
</script>

<template>
  <div class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-900 rounded-3xl">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Profile
          </h1>
          <div class="flex gap-3 justify-center sm:justify-end mt-4 sm:mt-0">
            <Button 
              label="Edit Profile" 
              icon="pi pi-user-edit" 
              class="p-button-rounded p-button-outlined"
              @click="openEditDialog"
            />
            <Button 
              label="Edit Goals" 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-outlined"
              @click="openGoalsDialog"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <div class="grid grid-cols-12 gap-8">
        <!-- Profile Header Card -->
        <div class="col-span-12">
          <div class="card hover:shadow-xl transition-all duration-300">
            <div class="flex flex-col md:flex-row items-center gap-8 p-6">
              <div class="relative">
                <div class="relative w-32 h-32 rounded-full overflow-hidden border-4 border-surface-200 dark:border-surface-700 shadow-lg">
                  <img 
                    :src="user.avatar || '/assets/images/avatar-placeholder.png'" 
                    :alt="user.username"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-700/20"></div>
                </div>
                <Badge v-if="user.is_staff" value="Admin" severity="danger" class="absolute -top-2 -right-2" />
              </div>
              
              <div class="flex-1 text-center md:text-left">
                <h2 class="text-3xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent mb-2">
                  {{ user.first_name }} {{ user.last_name }}
                </h2>
                <p class="text-xl text-surface-600 dark:text-surface-400 mb-4">@{{ user.username }}</p>
                <div class="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-envelope text-primary-500"></i>
                    <span class="text-surface-600 dark:text-surface-400">{{ user.email }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-calendar text-primary-500"></i>
                    <span class="text-surface-600 dark:text-surface-400">Member since {{ formatDate(user.date_joined) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-clock text-primary-500"></i>
                    <span class="text-surface-600 dark:text-surface-400">Last login {{ formatDate(user.last_login) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col items-center gap-4">
                <Badge :value="getSubscriptionLabel(user.subscription_type)" 
                       :severity="getSubscriptionSeverity(user.subscription_type)"
                       class="text-lg" />
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary-500">{{ stats.completedProfile }}%</div>
                  <div class="text-surface-600 dark:text-surface-400">Profile Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
          <div class="card stats-card hover:shadow-xl transition-all duration-300">
            <div class="flex justify-between mb-4">
              <div>
                <span class="block text-muted-color font-medium mb-4">Quote Collection</span>
                <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.totalQuotes }}</div>
              </div>
              <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
                <i class="pi pi-comment text-purple-500 !text-2xl"></i>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Tag :value="`${Math.min(Math.round((stats.totalQuotes / stats.quotes_goal) * 100), 100)}%`" 
                   :severity="stats.totalQuotes >= stats.quotes_goal ? 'success' : 'info'" />
              <span class="text-muted-color text-sm">of {{ stats.quotes_goal }} goal</span>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
          <div class="card stats-card hover:shadow-xl transition-all duration-300">
            <div class="flex justify-between mb-4">
              <div>
                <span class="block text-muted-color font-medium mb-4">Book Collection</span>
                <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.totalBooks }}</div>
              </div>
              <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
                <i class="pi pi-book text-blue-500 !text-2xl"></i>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Tag :value="`${Math.min(Math.round((stats.totalBooks / stats.books_goal) * 100), 100)}%`" 
                   :severity="stats.totalBooks >= stats.books_goal ? 'success' : 'info'" />
              <span class="text-muted-color text-sm">of {{ stats.books_goal }} goal</span>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
          <div class="card stats-card hover:shadow-xl transition-all duration-300">
            <div class="flex justify-between mb-4">
              <div>
                <span class="block text-muted-color font-medium mb-4">Author Collection</span>
                <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.totalAuthors }}</div>
              </div>
              <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
                <i class="pi pi-user text-orange-500 !text-2xl"></i>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Tag :value="`${Math.min(Math.round((stats.totalAuthors / stats.authors_goal) * 100), 100)}%`" 
                   :severity="stats.totalAuthors >= stats.authors_goal ? 'success' : 'info'" />
              <span class="text-muted-color text-sm">of {{ stats.authors_goal }} goal</span>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
          <div class="card stats-card hover:shadow-xl transition-all duration-300">
            <div class="flex justify-between mb-4">
              <div>
                <span class="block text-muted-color font-medium mb-4">Tag Collection</span>
                <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.totalTags }}</div>
              </div>
              <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
                <i class="pi pi-tags text-green-500 !text-2xl"></i>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Tag value="Active" severity="success" />
              <span class="text-muted-color text-sm">tags in use</span>
            </div>
          </div>
        </div>

        <!-- Activity Chart -->
        <div class="col-span-12 lg:col-span-8">
          <div class="card hover:shadow-xl transition-all duration-300">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                Recent Activity
              </h2>
            </div>
            <div v-if="activityChartData" class="activity-chart">
              <Chart type="line" :data="activityChartData" :options="activityChartOptions" class="h-20rem" />
            </div>
            <div v-else class="empty-chart flex align-items-center justify-content-center h-20rem">
              <div class="text-center">
                <i class="pi pi-chart-line text-4xl text-300 mb-3"></i>
                <div class="text-xl font-medium text-600">No activity data available</div>
                <p class="text-500">Start adding quotes to track your activity</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="col-span-12 lg:col-span-4">
          <div class="card hover:shadow-xl transition-all duration-300">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                Activity Timeline
              </h2>
            </div>
            <div v-if="userActivity && userActivity.length" class="activity-timeline">
              <div v-for="(dayActivity, dayIndex) in userActivity" :key="dayIndex" class="day-activity mb-4">
                <div class="day-header mb-2 p-2 surface-100 border-round">
                  <div class="font-medium">{{ formatDate(dayActivity.date) }}</div>
                </div>
                
                <div class="timeline-items pl-3">
                  <div v-for="(detail, detailIndex) in dayActivity.details" :key="`${dayIndex}-${detailIndex}`" 
                       class="timeline-item py-2 flex align-items-start">
                    <div class="timeline-icon mr-3">
                      <i v-if="detail.type === 'create'" class="pi pi-pencil p-2 bg-blue-100 text-blue-700 border-circle"></i>
                      <i v-else-if="detail.type === 'upload'" class="pi pi-upload p-2 bg-purple-100 text-purple-700 border-circle"></i>
                      <i v-else-if="detail.type === 'view'" class="pi pi-eye p-2 bg-teal-100 text-teal-700 border-circle"></i>
                      <i v-else class="pi pi-book p-2 bg-orange-100 text-orange-700 border-circle"></i>
                    </div>
                    <div class="timeline-content flex-1">
                      <div class="flex justify-content-between mb-1">
                        <span class="font-medium">
                          <span v-if="detail.type === 'create'">Created quotes</span>
                          <span v-else-if="detail.type === 'upload'">Uploaded quotes</span>
                          <span v-else-if="detail.type === 'view'">Viewed quotes</span>
                          <span v-else>Quote activity</span>
                        </span>
                        <span class="text-sm text-500">{{ detail.time }}</span>
                      </div>
                      <p class="m-0 text-sm text-700">{{ detail.description }}</p>
                      <div v-if="detail.count" class="mt-1 text-xs inline-flex align-items-center bg-primary-50 text-primary-700 px-2 py-1 border-round">
                        <i class="pi pi-comment mr-1"></i>
                        <span>{{ detail.count }} quote{{ detail.count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-timeline text-center p-4">
              <i class="pi pi-history text-4xl text-300 mb-3"></i>
              <div class="text-xl font-medium text-600">No recent activity</div>
              <p class="text-500">Your activity will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Profile Dialog -->
  <Dialog v-model:visible="showEditDialog" :style="{width: '650px', maxWidth: '95vw'}" 
          header="Edit Profile" :modal="true" class="profile-edit-dialog"
          :transitionOptions="{enterFromClass: 'scale-75', enterActiveClass: 'transition-all duration-200'}"
          :closeOnEscape="true" :dismissableMask="true" closeIcon="pi pi-times">
    <div class="p-fluid profile-edit-form">
      <div class="avatar-upload-section mb-5">
        <div class="flex flex-column align-items-center">
          <div class="avatar-wrapper">
            <Avatar :image="editedUser.avatar || '/assets/images/avatar-placeholder.png'" 
                  size="xlarge" shape="circle" class="edit-avatar" />
            <div class="avatar-overlay">
              <i class="pi pi-camera camera-icon" @click="$refs.fileInput.click()"></i>
            </div>
            <input 
              ref="fileInput" 
              type="file" 
              class="hidden-file-input" 
              accept="image/*" 
              @change="event => uploadAvatar(event)" 
            />
          </div>
          <small class="text-xs text-500 mt-3">Maximum size: 1MB</small>
        </div>
      </div>
      
      <div class="grid formgrid">
        <div class="field col-12 md:col-6">
          <label for="username" class="font-medium">Username</label>
          <div class="p-iconfield">
            <span class="p-inputicon pi pi-user"></span>
            <InputText id="username" v-model="editedUser.username" class="p-inputtext-fluid" placeholder="Enter username" />
          </div>
        </div>
        
        <div class="field col-12 md:col-6">
          <label for="email" class="font-medium">Email</label>
          <div class="p-iconfield">
            <span class="p-inputicon pi pi-envelope"></span>
            <InputText id="email" v-model="editedUser.email" type="email" class="p-inputtext-fluid" placeholder="Enter email" />
          </div>
        </div>
        
        <div class="field col-12 md:col-6">
          <label for="firstName" class="font-medium">First Name</label>
          <div class="p-iconfield">
            <span class="p-inputicon pi pi-user-edit"></span>
            <InputText id="firstName" v-model="editedUser.first_name" class="p-inputtext-fluid" placeholder="Enter first name" />
          </div>
        </div>
        
        <div class="field col-12 md:col-6">
          <label for="lastName" class="font-medium">Last Name</label>
          <div class="p-iconfield">
            <span class="p-inputicon pi pi-user-edit"></span>
            <InputText id="lastName" v-model="editedUser.last_name" class="p-inputtext-fluid" placeholder="Enter last name" />
          </div>
        </div>
      </div>
      
      <div class="field mt-4">
        <div class="password-section">
          <div class="flex align-items-center justify-content-between">
            <Button type="button" :label="changePassword ? 'Cancel' : 'Change Password'" 
                    :icon="changePassword ? 'pi pi-times' : 'pi pi-lock'" 
                    class="p-button-rounded p-button-outlined p-button-sm" 
                    @click="changePassword = !changePassword" />
          </div>
          
          <div v-if="changePassword" class="password-change-fields mt-3 p-4 border-round">
            <div class="field">
              <label for="currentPassword" class="font-medium">Current Password</label>
              <div class="p-iconfield">
                <span class="p-inputicon pi pi-lock"></span>
                <Password id="currentPassword" v-model="passwords.current" 
                        toggleMask :feedback="false" class="p-inputtext-fluid" placeholder="Enter current password" />
              </div>
            </div>
            
            <div class="field">
              <label for="newPassword" class="font-medium">New Password</label>
              <div class="p-iconfield">
                <span class="p-inputicon pi pi-key"></span>
                <Password id="newPassword" v-model="passwords.new" toggleMask 
                        class="p-inputtext-fluid" placeholder="Enter new password" />
              </div>
            </div>
            
            <div class="field">
              <label for="confirmPassword" class="font-medium">Confirm Password</label>
              <div class="p-iconfield">
                <span class="p-inputicon pi pi-check-circle"></span>
                <Password id="confirmPassword" v-model="passwords.confirm" 
                        toggleMask :feedback="false" class="p-inputtext-fluid" placeholder="Confirm new password" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" 
                @click="showEditDialog = false" />
        <Button label="Save Changes" icon="pi pi-check" class="p-button-primary"
                @click="saveProfile" />
      </div>
    </template>
  </Dialog>
  
  <!-- Goals Dialog -->
  <Dialog v-model:visible="showGoalsDialog" :style="{width: '550px', maxWidth: '95vw'}" 
          header="Set Your Learning Goals" :modal="true" class="goals-edit-dialog"
          :transitionOptions="{enterFromClass: 'scale-75', enterActiveClass: 'transition-all duration-200'}"
          :closeOnEscape="true" :dismissableMask="true" closeIcon="pi pi-times">
    <div class="p-fluid goals-edit-form">
      <div class="grid formgrid">
        <div class="field col-12">
          <label for="quotesGoal" class="font-medium">Quotes Goal</label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">
              <i class="pi pi-comment"></i>
            </span>
            <InputNumber id="quotesGoal" v-model="editedGoals.quotes_goal" 
                        showButtons buttonLayout="horizontal" 
                        decrementButtonClass="p-button-secondary" 
                        incrementButtonClass="p-button-secondary"
                        incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" 
                        :min="1" :step="5" />
          </div>
          <small class="text-xs text-500">Target number of quotes to collect</small>
        </div>
        
        <div class="field col-12">
          <label for="booksGoal" class="font-medium">Books Goal</label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">
              <i class="pi pi-book"></i>
            </span>
            <InputNumber id="booksGoal" v-model="editedGoals.books_goal" 
                        showButtons buttonLayout="horizontal" 
                        decrementButtonClass="p-button-secondary" 
                        incrementButtonClass="p-button-secondary"
                        incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" 
                        :min="1" :step="1" />
          </div>
          <small class="text-xs text-500">Target number of books to read</small>
        </div>
        
        <div class="field col-12">
          <label for="authorsGoal" class="font-medium">Authors Goal</label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">
              <i class="pi pi-user"></i>
            </span>
            <InputNumber id="authorsGoal" v-model="editedGoals.authors_goal" 
                        showButtons buttonLayout="horizontal" 
                        decrementButtonClass="p-button-secondary" 
                        incrementButtonClass="p-button-secondary"
                        incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" 
                        :min="1" :step="1" />
          </div>
          <small class="text-xs text-500">Target number of authors to explore</small>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" 
                @click="showGoalsDialog = false" />
        <Button label="Save Goals" icon="pi pi-check" class="p-button-primary"
                @click="saveGoals" />
      </div>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped>
.card {
  background: var(--surface-card);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0px 3px 5px rgba(0,0,0,0.02), 0px 0px 2px rgba(0,0,0,0.05), 0px 1px 4px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--primary-600));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px rgba(0,0,0,0.1);
    
    &::before {
      opacity: 1;
    }
  }
}

// Profile Header Card
.col-span-12 > .card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  
  &::before {
    background: linear-gradient(90deg, var(--primary-color), var(--primary-600));
  }
}

// Stats Cards with different colors
.stats-card {
  &:nth-child(1) {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    
    .stats-icon {
      background: var(--primary-50);
      color: var(--primary-color);
    }
    
    &::before {
      background: linear-gradient(90deg, var(--primary-color), var(--primary-600));
    }
  }
  
  &:nth-child(2) {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    
    .stats-icon {
      background: var(--blue-50);
      color: var(--blue-500);
    }
    
    &::before {
      background: linear-gradient(90deg, var(--blue-500), var(--blue-700));
    }
  }
  
  &:nth-child(3) {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    
    .stats-icon {
      background: var(--orange-50);
      color: var(--orange-500);
    }
    
    &::before {
      background: linear-gradient(90deg, var(--orange-500), var(--orange-700));
    }
  }
  
  &:nth-child(4) {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    
    .stats-icon {
      background: var(--green-50);
      color: var(--green-500);
    }
    
    &::before {
      background: linear-gradient(90deg, var(--green-500), var(--green-700));
    }
  }
  
  .stats-icon {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: rotate(0deg);
      transition: transform 0.6s linear;
    }
    
    &:hover {
      transform: scale(1.15) rotate(5deg);
      
      &::after {
        transform: rotate(180deg);
      }
    }
  }
  
  .stats-value {
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    
    &:hover::after {
      transform: scaleX(1);
    }
  }
}

// Activity Chart Card
.col-span-12.lg\:col-span-8 > .card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  
  &::before {
    background: linear-gradient(90deg, var(--surface-600), var(--surface-700));
  }
}

// Activity Timeline Card
.col-span-12.lg\:col-span-4 > .card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  
  &::before {
    background: linear-gradient(90deg, var(--primary-color), var(--primary-600));
  }
}

.activity-timeline {
  .timeline-items {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 7px;
      width: 2px;
      background: linear-gradient(to bottom, 
        var(--primary-color) 0%,
        var(--primary-600) 50%,
        var(--primary-color) 100%
      );
      z-index: 0;
      opacity: 0.5;
    }
  }
  
  .timeline-item {
    position: relative;
    z-index: 1;
    
    .timeline-icon {
      width: 2.2rem;
      height: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--surface-card);
      box-shadow: 0 0 0 3px var(--surface-card);
      z-index: 2;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover {
        transform: scale(1.2) rotate(5deg);
        
        &::before {
          opacity: 1;
        }
      }
    }
    
    .timeline-content {
      background-color: var(--surface-ground);
      border-radius: 1rem;
      padding: 1rem 1.25rem;
      box-shadow: 0px 3px 5px rgba(0,0,0,0.02), 0px 0px 2px rgba(0,0,0,0.05), 0px 1px 4px rgba(0,0,0,0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent);
        transform: translateX(-100%);
        transition: transform 0.6s ease;
      }
      
      &:hover {
        background-color: var(--surface-hover);
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        
        &::before {
          transform: translateX(100%);
        }
      }
    }
  }
}

.empty-timeline, .empty-chart {
  background: var(--surface-ground);
  border-radius: 1rem;
  margin-top: 1rem;
  padding: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent);
    animation: shimmer 2s infinite;
  }
  
  i {
    font-size: 3rem;
    color: var(--primary-color);
    opacity: 0.5;
    margin-bottom: 1rem;
    display: inline-block;
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// Dark mode adjustments
:root.dark {
  .col-span-12 > .card,
  .stats-card,
  .col-span-12.lg\:col-span-8 > .card,
  .col-span-12.lg\:col-span-4 > .card {
    background: var(--surface-card);
    border-color: var(--surface-border);
  }
  
  .stats-card {
    &:nth-child(1) .stats-icon {
      background: var(--primary-900);
      color: var(--primary-400);
    }
    
    &:nth-child(2) .stats-icon {
      background: var(--blue-900);
      color: var(--blue-400);
    }
    
    &:nth-child(3) .stats-icon {
      background: var(--orange-900);
      color: var(--orange-400);
    }
    
    &:nth-child(4) .stats-icon {
      background: var(--green-900);
      color: var(--green-400);
    }
  }
}

// Responsive adjustments
@media screen and (max-width: 768px) {
  .card {
    padding: 1.5rem;
    border-radius: 1rem;
  }
  
  .stats-card .stats-icon:hover {
    transform: scale(1.1) rotate(3deg);
  }
  
  .timeline-item .timeline-icon:hover {
    transform: scale(1.1) rotate(3deg);
  }
}

// Add fancy font styles
.fancy-font {
  font-family: 'Poppins', sans-serif;
  // letter-spacing: -0.5px;
  // background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
  // -webkit-background-clip: text;
  // background-clip: text;
  // -webkit-text-fill-color: transparent;
  // text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

// Add loading animation
.loading-skeleton {
  background: linear-gradient(90deg, 
    var(--surface-ground) 25%, 
    var(--surface-hover) 50%, 
    var(--surface-ground) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>