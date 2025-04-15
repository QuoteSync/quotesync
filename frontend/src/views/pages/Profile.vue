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
</script>

<template>
  <div class="surface-ground">
    <div v-if="loading" class="flex justify-content-center p-6">
      <ProgressSpinner class="w-6rem h-6rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
    </div>
    
    <div v-else class="grid">
      <!-- Profile Header -->
      <div class="col-12">
        <div class="profile-header" :style="{
          background: `linear-gradient(135deg, ${headerGradient.primary}, ${headerGradient.secondary}, ${headerGradient.tertiary})`
        }">
          <div class="container">
            <div class="flex flex-column md:flex-row align-items-center md:align-items-start">
              <div class="profile-avatar-container">
                <Avatar 
                  :image="user.avatar || '/assets/images/avatar-placeholder.png'" 
                  size="xlarge" 
                  shape="circle" 
                  class="profile-avatar"
                />
                <Badge v-if="user.is_staff" value="Admin" severity="danger" class="profile-badge" />
              </div>
              
              <div class="profile-info ml-0 md:ml-5 mt-4 md:mt-0 text-center md:text-left">
                <h1 class="profile-name m-0">{{ user.first_name }} {{ user.last_name }}</h1>
                <h2 class="profile-username m-0 mb-2">@{{ user.username }}</h2>
                <p class="profile-email mb-3">{{ user.email }}</p>
                
                <div class="profile-actions">
                  <Button 
                    label="Edit Profile" 
                    icon="pi pi-user-edit" 
                    class="p-button-rounded p-button-outlined profile-edit-btn"
                    @click="openEditDialog"
                  />
                </div>
              </div>
              
              <div class="profile-join-date mt-4 md:mt-0 md:ml-auto">
                <span class="text-sm">Member since</span>
                <div class="text-lg font-medium">{{ formatDate(user.date_joined) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats Cards -->
      <div class="col-12 md:col-6 xl:col-3 p-3">
        <div class="card stats-card h-full">
          <div class="flex align-items-center mb-4">
            <div class="stats-icon quotes-icon">
              <i class="pi pi-comment"></i>
            </div>
            <div>
              <div class="text-xl font-semibold">{{ stats.totalQuotes }}</div>
              <div class="text-sm text-600">Quotes</div>
            </div>
          </div>
          <div class="stats-progress">
            <div class="flex justify-content-between mb-2">
              <span>Your goal: {{ stats.quotes_goal }} quotes</span>
              <span>{{ Math.min(Math.round((stats.totalQuotes / stats.quotes_goal) * 100), 100) }}%</span>
            </div>
            <ProgressBar :value="Math.min(Math.round((stats.totalQuotes / stats.quotes_goal) * 100), 100)" class="quotes-progress" />
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-6 xl:col-3 p-3">
        <div class="card stats-card h-full">
          <div class="flex align-items-center mb-4">
            <div class="stats-icon books-icon">
              <i class="pi pi-book"></i>
            </div>
            <div>
              <div class="text-xl font-semibold">{{ stats.totalBooks }}</div>
              <div class="text-sm text-600">Books</div>
            </div>
          </div>
          <div class="stats-progress">
            <div class="flex justify-content-between mb-2">
              <span>Your goal: {{ stats.books_goal }} books</span>
              <span>{{ Math.min(Math.round((stats.totalBooks / stats.books_goal) * 100), 100) }}%</span>
            </div>
            <ProgressBar :value="Math.min(Math.round((stats.totalBooks / stats.books_goal) * 100), 100)" class="books-progress" />
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-6 xl:col-3 p-3">
        <div class="card stats-card h-full">
          <div class="flex align-items-center mb-4">
            <div class="stats-icon authors-icon">
              <i class="pi pi-user"></i>
            </div>
            <div>
              <div class="text-xl font-semibold">{{ stats.totalAuthors }}</div>
              <div class="text-sm text-600">Authors</div>
            </div>
          </div>
          <div class="stats-progress">
            <div class="flex justify-content-between mb-2">
              <span>Your goal: {{ stats.authors_goal }} authors</span>
              <span>{{ Math.min(Math.round((stats.totalAuthors / stats.authors_goal) * 100), 100) }}%</span>
            </div>
            <ProgressBar :value="Math.min(Math.round((stats.totalAuthors / stats.authors_goal) * 100), 100)" class="authors-progress" />
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-6 xl:col-3 p-3">
        <div class="card stats-card h-full">
          <div class="flex align-items-center mb-4">
            <div class="stats-icon profile-icon">
              <i class="pi pi-id-card"></i>
            </div>
            <div>
              <div class="text-xl font-semibold">{{ stats.completedProfile }}%</div>
              <div class="text-sm text-600">Profile completion</div>
            </div>
          </div>
          <div class="stats-progress">
            <div class="flex justify-content-between mb-2">
              <span>Complete your profile</span>
              <span>{{ stats.completedProfile }}%</span>
            </div>
            <ProgressBar :value="stats.completedProfile" class="profile-progress" />
          </div>
        </div>
      </div>
      
      <!-- Goals Edit Button -->
      <div class="col-12 flex justify-content-center mt-3 mb-4">
        <Button label="Edit Your Goals" icon="pi pi-pencil" 
                class="p-button-outlined p-button-rounded" @click="openGoalsDialog" />
      </div>
      
      <!-- Activity Chart -->
      <div class="col-12 xl:col-8 p-3">
        <div class="card">
          <h3 class="text-xl font-medium mb-4">Recent Activity</h3>
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
          
          <!-- Activity Timeline -->
          <div v-if="userActivity && userActivity.length" class="activity-timeline mt-5">
            <h4 class="text-lg font-medium mb-3">Activity Timeline</h4>
            
            <div v-for="(dayActivity, dayIndex) in userActivity" :key="dayIndex" class="day-activity mb-4">
              <!-- Format 1: Enhanced mock data with details -->
              <template v-if="dayActivity.details && dayActivity.details.length">
                <div class="day-header mb-2 p-2 surface-100 border-round">
                  <div class="font-medium">{{ formatDate(dayActivity.date) }}</div>
                </div>
                
                <div class="timeline-items pl-3">
                  <div v-for="(detail, detailIndex) in dayActivity.details" :key="`${dayIndex}-${detailIndex}`" 
                       class="timeline-item py-2 flex align-items-start">
                    <div class="timeline-icon mr-3">
                      <i v-if="detail.type === 'create'" class="pi pi-pencil p-2 bg-blue-100 text-blue-700 border-circle" aria-hidden="true"></i>
                      <i v-else-if="detail.type === 'upload'" class="pi pi-upload p-2 bg-purple-100 text-purple-700 border-circle" aria-hidden="true"></i>
                      <i v-else-if="detail.type === 'view'" class="pi pi-eye p-2 bg-teal-100 text-teal-700 border-circle" aria-hidden="true"></i>
                      <i v-else class="pi pi-book p-2 bg-orange-100 text-orange-700 border-circle" aria-hidden="true"></i>
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
                        <i class="pi pi-comment mr-1" aria-hidden="true"></i>
                        <span>{{ detail.count }} quote{{ detail.count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              
              <!-- Format 2: Backend API format with quotes_count and imports_count -->
              <template v-else-if="dayActivity.quotes_count > 0 || dayActivity.imports_count > 0">
                <div class="day-header mb-2 p-2 surface-100 border-round">
                  <div class="font-medium">{{ formatDate(dayActivity.date) }}</div>
                </div>
                
                <div class="timeline-items pl-3">
                  <div v-if="dayActivity.quotes_count > 0" class="timeline-item py-2 flex align-items-start">
                    <div class="timeline-icon mr-3">
                      <i class="pi pi-pencil p-2 bg-blue-100 text-blue-700 border-circle" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content flex-1">
                      <div class="flex justify-content-between mb-1">
                        <span class="font-medium">Created quotes</span>
                      </div>
                      <p class="m-0 text-sm text-700">Added quotes to your collection</p>
                      <div class="mt-1 text-xs inline-flex align-items-center bg-primary-50 text-primary-700 px-2 py-1 border-round">
                        <i class="pi pi-comment mr-1" aria-hidden="true"></i>
                        <span>{{ dayActivity.quotes_count }} quote{{ dayActivity.quotes_count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="dayActivity.imports_count > 0" class="timeline-item py-2 flex align-items-start">
                    <div class="timeline-icon mr-3">
                      <i class="pi pi-upload p-2 bg-purple-100 text-purple-700 border-circle" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content flex-1">
                      <div class="flex justify-content-between mb-1">
                        <span class="font-medium">Imported quotes</span>
                      </div>
                      <p class="m-0 text-sm text-700">Imported quotes from external sources</p>
                      <div class="mt-1 text-xs inline-flex align-items-center bg-primary-50 text-primary-700 px-2 py-1 border-round">
                        <i class="pi pi-comment mr-1" aria-hidden="true"></i>
                        <span>{{ dayActivity.imports_count }} quote{{ dayActivity.imports_count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              
              <!-- Format 3: Old format with just total_count -->
              <template v-else-if="dayActivity.total_count > 0">
                <div class="day-header mb-2 p-2 surface-100 border-round">
                  <div class="font-medium">{{ formatDate(dayActivity.date) }}</div>
                </div>
                
                <div class="timeline-items pl-3">
                  <div class="timeline-item py-2 flex align-items-start">
                    <div class="timeline-icon mr-3">
                      <i class="pi pi-book p-2 bg-orange-100 text-orange-700 border-circle" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content flex-1">
                      <div class="flex justify-content-between mb-1">
                        <span class="font-medium">Quote activity</span>
                      </div>
                      <p class="m-0 text-sm text-700">Added quotes to your collection</p>
                      <div class="mt-1 text-xs inline-flex align-items-center bg-primary-50 text-primary-700 px-2 py-1 border-round">
                        <i class="pi pi-comment mr-1" aria-hidden="true"></i>
                        <span>{{ dayActivity.total_count }} quote{{ dayActivity.total_count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              
              <!-- Format 4: Legacy mock data with just count -->
              <template v-else-if="'count' in dayActivity && dayActivity.count > 0">
                <div class="day-header mb-2 p-2 surface-100 border-round">
                  <div class="font-medium">{{ formatDate(dayActivity.date) }}</div>
                </div>
                
                <div class="timeline-items pl-3">
                  <div class="timeline-item py-2 flex align-items-start">
                    <div class="timeline-icon mr-3">
                      <i class="pi pi-comment p-2 bg-blue-100 text-blue-700 border-circle" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content flex-1">
                      <div class="flex justify-content-between mb-1">
                        <span class="font-medium">Quote activity</span>
                      </div>
                      <p class="m-0 text-sm text-700">Added or updated quotes</p>
                      <div class="mt-1 text-xs inline-flex align-items-center bg-primary-50 text-primary-700 px-2 py-1 border-round">
                        <i class="pi pi-comment mr-1" aria-hidden="true"></i>
                        <span>{{ dayActivity.count }} quote{{ dayActivity.count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              
              <!-- Empty day with any format -->
              <template v-else>
                <div class="empty-day p-3 text-center surface-50 border-round">
                  <span class="text-500">No activity on {{ formatDate(dayActivity.date) }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Profile Details -->
      <div class="col-12 xl:col-4 p-3">
        <div class="card">
          <h3 class="text-xl font-medium mb-4">Account Details</h3>
          <div class="profile-details">
            <div class="details-item">
              <div class="details-label">Username</div>
              <div class="details-value">{{ user.username }}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Full Name</div>
              <div class="details-value">{{ user.first_name }} {{ user.last_name }}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Email</div>
              <div class="details-value">{{ user.email }}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Account Type</div>
              <div class="details-value">
                <Badge :value="user.is_staff ? 'Administrator' : 'Standard User'" 
                       :severity="user.is_staff ? 'danger' : 'info'" />
              </div>
            </div>
            <div class="details-item">
              <div class="details-label">Last Login</div>
              <div class="details-value">{{ formatDate(user.last_login) }}</div>
            </div>
          </div>
          
          <div class="flex justify-content-center mt-5">
            <Button label="Edit Details" icon="pi pi-pencil" 
                    class="p-button-outlined p-button-rounded" @click="openEditDialog" />
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
  </div>
</template>

<style scoped>
.profile-header {
  color: white;
  padding: 3rem 0;
  margin-bottom: 2rem;
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  z-index: 0;
}

.container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.profile-avatar-container {
  position: relative;
}

.profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.7);
  height: 8rem !important;
  width: 8rem !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.profile-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.profile-username {
  font-size: 1.2rem;
  font-weight: 400;
  opacity: 0.9;
}

.profile-email {
  font-size: 1rem;
  opacity: 0.8;
}

.profile-actions {
  margin-top: 1rem;
}

.profile-edit-btn {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.3s ease;
}

.profile-edit-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.profile-join-date {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  text-align: center;
}

.stats-card {
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.quotes-icon {
  background: linear-gradient(135deg, #4158D0, #C850C0);
}

.books-icon {
  background: linear-gradient(135deg, #0093E9, #80D0C7);
}

.authors-icon {
  background: linear-gradient(135deg, #FF9966, #FF5E62);
}

.profile-icon {
  background: linear-gradient(135deg, #A8BFFF, #884D80);
}

.quotes-progress .p-progressbar-value {
  background: linear-gradient(90deg, #4158D0, #C850C0);
}

.books-progress .p-progressbar-value {
  background: linear-gradient(90deg, #0093E9, #80D0C7);
}

.authors-progress .p-progressbar-value {
  background: linear-gradient(90deg, #FF9966, #FF5E62);
}

.profile-progress .p-progressbar-value {
  background: linear-gradient(90deg, #A8BFFF, #884D80);
}

.profile-details .details-item {
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-details .details-item:first-child {
  padding-top: 0;
}

.profile-details .details-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.profile-details .details-label {
  font-weight: 600;
  color: var(--text-color-secondary);
}

.profile-details .details-value {
  text-align: right;
}

.profile-edit-dialog {
  border-radius: 1rem;
  overflow: hidden;
}

.profile-edit-dialog .p-dialog-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-800));
  color: white;
  padding: 1.5rem;
  font-size: 1.2rem;
  border-bottom: none;
}

.profile-edit-dialog .p-dialog-content {
  padding: 2rem;
}

.profile-edit-dialog .p-dialog-footer {
  border-top: 1px solid var(--surface-200);
  padding: 1.25rem 2rem;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 0.5rem;
  background: linear-gradient(315deg, var(--primary-300), var(--primary-800));
  padding: 0.35rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 
              0 2px 10px rgba(var(--primary-color-rgb), 0.2),
              inset 0 -2px 10px rgba(255, 255, 255, 0.2);
}

.edit-avatar {
  height: 9rem !important;
  width: 9rem !important;
  border: 4px solid rgba(var(--primary-color-rgb), 0.2);
  transition: all 0.3s ease;
  filter: brightness(0.95);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: scale(0.9);
}

.avatar-overlay i {
  color: white;
  font-size: 1.7rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transform: translateY(0);
  opacity: 0;
  transition: all 0.3s ease 0.1s;
}

.avatar-wrapper:hover .edit-avatar {
  filter: brightness(0.8);
  transform: scale(0.95);
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
  transform: scale(1);
}

.avatar-wrapper:hover .avatar-overlay i {
  transform: translateY(0);
  opacity: 1;
}

.avatar-upload-button {
  width: 100%;
  display: flex;
  justify-content: center;
  transform: translateY(5px);
  opacity: 0;
  transition: all 0.3s ease 0.2s;
}

.avatar-wrapper:hover .avatar-upload-button {
  transform: translateY(0);
  opacity: 1;
}

.avatar-upload-button :deep(.p-button) {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 2rem;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.avatar-upload-button :deep(.p-button:hover) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
}

.avatar-upload-button :deep(.p-button .p-button-icon) {
  font-size: 0.9rem;
  margin-right: 0.3rem;
}

.profile-edit-form :deep(.p-inputtext:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px rgba(var(--primary-color-rgb), 0.2);
}

.p-iconfield {
  position: relative;
  display: inline-flex;
  width: 100%;
}

.p-iconfield .p-inputicon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0.75rem;
  color: var(--text-color-secondary);
  z-index: 1;
}

.p-iconfield .p-inputtext,
.p-iconfield .p-password {
  width: 100%;
}

.p-iconfield .p-inputtext,
.p-iconfield :deep(.p-password input) {
  padding-left: 2.5rem !important;
}

.p-iconfield :deep(.p-password-panel) {
  margin-top: 0.25rem;
}

.p-inputtext-fluid {
  width: 100%;
}

.password-section {
  background-color: var(--surface-50);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.password-change-fields {
  background-color: var(--surface-card);
  border: 1px solid var(--surface-300);
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s both;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.camera-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.camera-icon:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.avatar-wrapper:hover .avatar-overlay i {
  transform: translateY(0);
  opacity: 1;
}

.hidden-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
  visibility: hidden;
}

.goals-edit-dialog {
  border-radius: 1rem;
  overflow: hidden;
}

.goals-edit-dialog .p-dialog-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-800));
  color: white;
  padding: 1.5rem;
  font-size: 1.2rem;
  border-bottom: none;
}

.goals-edit-dialog .p-dialog-content {
  padding: 2rem;
}

.goals-edit-dialog .p-dialog-footer {
  border-top: 1px solid var(--surface-200);
  padding: 1.25rem 2rem;
}

.goals-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goals-edit-form .field {
  display: flex;
  flex-direction: column;
}

.goals-edit-form .field label {
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.goals-edit-form .field .p-inputgroup {
  display: flex;
  align-items: center;
}

.goals-edit-form .field .p-inputgroup .p-inputgroup-addon {
  background-color: var(--surface-200);
  border: 1px solid var(--surface-300);
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.goals-edit-form .field .p-inputgroup .p-inputgroup-addon i {
  color: var(--text-color-secondary);
}

.goals-edit-form .field .p-inputgroup .p-inputtext {
  width: 100%;
}

.goals-edit-form .field small {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

/* Activity Timeline Styles */
.activity-timeline {
  padding-top: 1rem;
  border-top: 1px solid var(--surface-200);
}

.day-header {
  background-color: var(--surface-100);
  border-radius: 0.5rem;
}

.timeline-items {
  position: relative;
}

.timeline-items::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 7px;
  width: 2px;
  background-color: var(--surface-200);
  z-index: 0;
}

.timeline-item {
  position: relative;
  z-index: 1;
}

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
}

.timeline-icon i {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
}

.timeline-content {
  background-color: var(--surface-50);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.timeline-content:hover {
  background-color: var(--surface-100);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.empty-day {
  border: 1px dashed var(--surface-300);
}
</style>