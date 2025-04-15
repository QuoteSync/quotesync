import { apiClient } from "@/api";
import { BACKEND_URL } from "@/api";
import axios from "axios";

// Get saved user data from localStorage or use default mock data
const getSavedUserData = () => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        try {
            return JSON.parse(savedUserData);
        } catch (e) {
            console.error('Error parsing saved user data:', e);
        }
    }
    return null;
};

// Helper function to ensure avatar URLs are absolute with the backend hostname
const getFullAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    
    // If it's already an absolute URL (starts with http:// or https:// or data:), return it as is
    if (avatarPath.startsWith('http://') || 
        avatarPath.startsWith('https://') ||
        avatarPath.startsWith('data:')) {
        return avatarPath;
    }
    
    // If it's a relative URL (starts with /media), prepend the backend URL
    if (avatarPath.startsWith('/media')) {
        return `${BACKEND_URL}${avatarPath}`;
    }
    
    // Otherwise, just return the original
    return avatarPath;
};

// Default mock data
const DEFAULT_USER = {
    id: 1,
    username: "johndoe",
    email: "john.doe@example.com",
    first_name: "John",
    last_name: "Doe",
    avatar: "https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png",
    is_staff: true,
    date_joined: "2023-01-15T08:30:00Z",
    last_login: "2024-04-14T10:25:12Z"
};

// Initialize mock user with saved data or defaults
const MOCK_USER = getSavedUserData() || DEFAULT_USER;

// Check if we have a saved avatar separately (for backward compatibility)
const savedAvatar = localStorage.getItem('userAvatar');
if (savedAvatar) {
    MOCK_USER.avatar = savedAvatar;
}

// Default goals
const DEFAULT_GOALS = {
    quotes_goal: 100,
    books_goal: 30,
    authors_goal: 20
};

// Get saved goals or use defaults
const getSavedGoals = () => {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
        try {
            return JSON.parse(savedGoals);
        } catch (e) {
            console.error('Error parsing saved goals data:', e);
        }
    }
    return DEFAULT_GOALS;
};

// Initialize mock goals
const MOCK_GOALS = getSavedGoals();

const MOCK_STATS = {
    totalQuotes: 87,
    totalBooks: 24,
    totalAuthors: 18,
    totalTags: 35,
    ...MOCK_GOALS // Include goals in stats
};

const MOCK_ACTIVITY = [
    { date: "2024-04-14", count: 5 },
    { date: "2024-04-13", count: 3 },
    { date: "2024-04-12", count: 7 },
    { date: "2024-04-11", count: 0 },
    { date: "2024-04-10", count: 4 },
    { date: "2024-04-09", count: 2 },
    { date: "2024-04-08", count: 6 }
];

// Save user data to localStorage
const saveUserData = (userData) => {
    // Ensure avatar has a full URL when saving to localStorage
    if (userData && userData.avatar) {
        userData.avatar = getFullAvatarUrl(userData.avatar);
    }
    
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // For backward compatibility, also save avatar separately
    if (userData.avatar) {
        localStorage.setItem('userAvatar', userData.avatar);
    }
};

// Save user goals to localStorage
const saveUserGoals = (goals) => {
    localStorage.setItem('userGoals', JSON.stringify(goals));
};

export const UserService = {
    // Get user profile data
    async getProfile() {
        try {
            // Try to get data from the backend
            const response = await apiClient.get("/users/profile/");
            console.log("Retrieved profile from backend:", response.data);
            
            // Ensure avatar URL is complete before saving
            if (response.data && response.data.avatar) {
                response.data.avatar = getFullAvatarUrl(response.data.avatar);
            }
            
            // Update localStorage with the latest data from backend
            saveUserData(response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile from backend:", error);
            // Fall back to localStorage data on error
            const savedUserData = getSavedUserData();
            if (savedUserData) {
                return Promise.resolve(savedUserData);
            }
            
            // Return mock data if no saved data
            return Promise.resolve(MOCK_USER);
        }
    },
    
    // Update user profile
    async updateProfile(userData) {
        try {
            // Get CSRF token from cookies
            const csrfToken = document.cookie.split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];
                
            // Use fetch API with the direct endpoint
            const response = await fetch(`${BACKEND_URL}/api/profile-update-direct/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || ''
                },
                body: JSON.stringify(userData),
                credentials: 'include' // Include credentials for cross-origin requests
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Profile updated on backend:", data);
            
            // Ensure avatar URL is complete
            if (data && data.avatar) {
                data.avatar = getFullAvatarUrl(data.avatar);
            }
            
            // Update localStorage with backend response
            saveUserData(data);
            
            // Return data from backend
            return data;
        } catch (error) {
            console.error("Error updating profile on backend:", error);
            
            // Fall back to localStorage update if backend fails
            const updatedUser = {
                ...MOCK_USER,
                ...userData
            };
            
            // Save to localStorage for persistence
            saveUserData(updatedUser);
            
            // Update our mock user reference
            Object.assign(MOCK_USER, updatedUser);
            
            console.log('Failed to update profile on backend, saved to localStorage instead:', updatedUser);
            
            // Return updated data
            return Promise.resolve(updatedUser);
        }
    },
    
    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            // Try to change password on the backend
            const response = await apiClient.post("/users/change-password/", {
                current_password: currentPassword,
                new_password: newPassword
            });
            
            console.log("Password changed successfully on backend");
            return response.data;
        } catch (error) {
            console.error("Error changing password on backend:", error);
            
            // Return mock success for development
            return Promise.resolve({ 
                success: true, 
                message: "Password changed successfully (backend unavailable - mock response)" 
            });
        }
    },
    
    // Upload avatar
    async uploadAvatar(file) {
        try {
            // Create a FormData object for file upload
            const formData = new FormData();
            formData.append("avatar", file);
            
            // Get CSRF token from cookies
            const csrfToken = document.cookie.split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];
                
            // Use fetch API instead of axios
            const response = await fetch(`${BACKEND_URL}/api/upload-avatar-direct/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken || ''
                },
                credentials: 'include' // Include credentials for cross-origin requests
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Avatar updated on backend:", data);
            
            // Ensure avatar URL is complete
            if (data && data.avatar_url) {
                data.avatar_url = getFullAvatarUrl(data.avatar_url);
            }
            
            // Update localStorage with the new avatar URL
            const savedUserData = getSavedUserData() || MOCK_USER;
            savedUserData.avatar = data.avatar_url;
            saveUserData(savedUserData);
            
            return data;
        } catch (error) {
            console.error("Error uploading avatar to backend:", error);
            
            // Fall back to localStorage if backend fails
            return new Promise((resolve, reject) => {
                if (file && file instanceof File) {
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const base64String = e.target.result;
                        
                        // Update mock user with new avatar
                        MOCK_USER.avatar = base64String;
                        
                        // Save to localStorage for persistence
                        saveUserData(MOCK_USER);
                        
                        console.log("Failed to upload avatar to backend, saved to localStorage instead");
                        resolve({ 
                            avatar_url: base64String,
                            message: "Avatar uploaded to local storage (backend unavailable)" 
                        });
                    };
                    
                    reader.onerror = (error) => {
                        console.error("Error reading file:", error);
                        reject(error);
                    };
                    
                    // Read file as data URL (base64)
                    reader.readAsDataURL(file);
                } else {
                    console.warn("Invalid file object received:", file);
                    resolve({ 
                        avatar_url: MOCK_USER.avatar,
                        message: "No valid file provided, using existing avatar" 
                    });
                }
            });
        }
    },
    
    // Get user stats
    async getUserStats() {
        try {
            // Try to get stats from the backend
            const response = await apiClient.get("/users/stats/");
            console.log("Retrieved user stats from backend:", response.data);
            
            try {
                // Get goals and merge with stats (in a separate try/catch block)
                const goals = await this.getUserGoals();
                const statsWithGoals = {
                    ...response.data,
                    ...goals
                };
                
                return statsWithGoals;
            } catch (goalError) {
                console.warn("Failed to fetch goals, using stats without goals:", goalError);
                
                // Return stats with default goals if getUserGoals fails
                const defaultGoals = getSavedGoals();
                return {
                    ...response.data,
                    ...defaultGoals
                };
            }
        } catch (error) {
            console.error("Error fetching user stats from backend:", error);
            
            // Return mock stats on error
            return Promise.resolve(MOCK_STATS);
        }
    },
    
    // Get user activity
    async getUserActivity() {
        try {
            // Try to get activity data from the backend
            const response = await apiClient.get("/users/activity/");
            console.log("Retrieved user activity from backend:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching user activity from backend:", error);
            
            // Return enhanced mock activity data with more details
            const enhancedMockActivity = [
                { 
                    date: "2024-04-14", 
                    quotes_count: 3, 
                    imports_count: 2, 
                    total_count: 5,
                    details: [
                        { type: 'upload', time: '09:15', count: 2, description: 'Uploaded quotes from Shakespeare' },
                        { type: 'create', time: '14:30', count: 3, description: 'Added quotes manually' },
                        { type: 'view', time: '16:45', description: 'Viewed your quotes collection' }
                    ]
                },
                { 
                    date: "2024-04-13", 
                    quotes_count: 2, 
                    imports_count: 1, 
                    total_count: 3,
                    details: [
                        { type: 'create', time: '10:20', count: 2, description: 'Created new quotes' },
                        { type: 'upload', time: '15:40', count: 1, description: 'Imported quotes from file' }
                    ]
                },
                { 
                    date: "2024-04-12", 
                    quotes_count: 5, 
                    imports_count: 2, 
                    total_count: 7,
                    details: [
                        { type: 'upload', time: '08:30', count: 2, description: 'Bulk import from Philosophy collection' },
                        { type: 'create', time: '11:15', count: 3, description: 'Added quotes from Marcus Aurelius' },
                        { type: 'create', time: '14:20', count: 2, description: 'Added quotes from Seneca' },
                        { type: 'view', time: '17:30', description: 'Browsed your quotes' }
                    ]
                },
                { 
                    date: "2024-04-11", 
                    quotes_count: 0, 
                    imports_count: 0, 
                    total_count: 0,
                    details: []
                },
                { 
                    date: "2024-04-10", 
                    quotes_count: 3, 
                    imports_count: 1, 
                    total_count: 4,
                    details: [
                        { type: 'create', time: '09:45', count: 3, description: 'Added quotes from Plato' },
                        { type: 'upload', time: '16:15', count: 1, description: 'Imported quotes from Aristotle' }
                    ]
                },
                { 
                    date: "2024-04-09", 
                    quotes_count: 1, 
                    imports_count: 1, 
                    total_count: 2,
                    details: [
                        { type: 'create', time: '10:30', count: 1, description: 'Added quote from Einstein' },
                        { type: 'upload', time: '15:20', count: 1, description: 'Imported quotes from Science collection' }
                    ]
                },
                { 
                    date: "2024-04-08", 
                    quotes_count: 4, 
                    imports_count: 2, 
                    total_count: 6,
                    details: [
                        { type: 'upload', time: '11:15', count: 2, description: 'Imported quotes from Poetry collection' },
                        { type: 'create', time: '13:45', count: 2, description: 'Added quotes from Emily Dickinson' },
                        { type: 'create', time: '16:30', count: 2, description: 'Added quotes from Walt Whitman' },
                        { type: 'view', time: '18:20', description: 'Reviewed your quote collection' }
                    ]
                }
            ];
            
            return Promise.resolve(enhancedMockActivity);
        }
    },
    
    // Get user goals
    async getUserGoals() {
        try {
            // Try to get goals from the backend
            const response = await apiClient.get("/users/goals/");
            console.log("Retrieved user goals from backend:", response.data);
            
            // Save goals to localStorage
            saveUserGoals(response.data);
            
            return response.data;
        } catch (error) {
            // Check if this is a 404 error, which means the endpoint doesn't exist yet
            if (error.response && error.response.status === 404) {
                console.info("The goals endpoint is not yet implemented on the backend. Using default goals.");
            } else {
                console.error("Error fetching user goals from backend:", error);
            }
            
            // Return saved goals or defaults
            const savedGoals = getSavedGoals();
            console.info("Using stored goals from localStorage:", savedGoals);
            return Promise.resolve(savedGoals);
        }
    },
    
    // Update user goals
    async updateUserGoals(goals) {
        try {
            // Try to update goals on the backend
            const response = await apiClient.patch("/users/goals/", goals);
            console.log("Updated user goals on backend:", response.data);
            
            // Save updated goals to localStorage
            saveUserGoals(response.data);
            
            return response.data;
        } catch (error) {
            console.error("Error updating user goals on backend:", error);
            
            // Fall back to localStorage update
            const updatedGoals = {
                ...getSavedGoals(),
                ...goals
            };
            
            // Save to localStorage
            saveUserGoals(updatedGoals);
            
            console.log('Failed to update goals on backend, saved to localStorage instead:', updatedGoals);
            
            return Promise.resolve(updatedGoals);
        }
    }
}; 