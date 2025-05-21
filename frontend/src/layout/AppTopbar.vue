<script setup>
import { ref, onMounted, computed } from "vue";
import { useLayout } from "@/layout/composables/layout";
import AppConfigurator from "./AppConfigurator.vue";
import { apiClient, getSession, logout } from "@/api";
import SearchButton from "@/components/SearchButton.vue";
import { UserService } from "@/service/UserService";
import Logo from "@/components/Logo.vue";

import router from "@/router";
// import { router } from '@/router';

const username = ref(""); // This will store the authenticated user's username
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const avatarUrl = ref("");

const fetchUserData = async () => {
    try {
        const session = await getSession();
        username.value = session.data.user.username;
        
        // Use UserService to get profile data
        const profileData = await UserService.getProfile();
        
        if (profileData && profileData.avatar) {
            avatarUrl.value = profileData.avatar;
            localStorage.setItem('userAvatar', profileData.avatar);
        } else {
            // Generate a fancy default avatar based on username
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username.value)}&background=random&color=fff&size=128&bold=true`;
            avatarUrl.value = defaultAvatar;
            localStorage.setItem('userAvatar', defaultAvatar);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        // Generate a fancy default avatar based on username
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username.value || 'User')}&background=random&color=fff&size=128&bold=true`;
        avatarUrl.value = defaultAvatar;
        localStorage.setItem('userAvatar', defaultAvatar);
    }
};

// Listen for storage events to update avatar when it changes in another tab/component
const handleStorageChange = (event) => {
    if (event.key === 'userAvatar') {
        avatarUrl.value = event.newValue || `https://ui-avatars.com/api/?name=${encodeURIComponent(username.value || 'User')}&background=random&color=fff&size=128&bold=true`;
    }
};

onMounted(() => {
    fetchUserData();
    
    // Check for avatar changes in localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes made in the same tab
    const intervalId = setInterval(() => {
        const currentAvatar = localStorage.getItem('userAvatar');
        if (currentAvatar && currentAvatar !== avatarUrl.value) {
            avatarUrl.value = currentAvatar;
        }
    }, 3000); // Check every 3 seconds
    
    // Clean up event listener and interval on component unmount
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(intervalId);
    };
});

// Define the profile menu items
const profileMenuItems = [
    {
        label: "Profile",
        icon: "pi pi-user",
        command: () => {
            router.push({ name: "Profile" });
        },
    },
    {
        label: "Settings",
        icon: "pi pi-cog",
        command: () => {
            router.push({ name: "settings" });
        },
    },
    {
        separator: true,
    },
    {
        label: "Logout",
        icon: "pi pi-sign-out",
        command: async () => {
            try {
                await logout();
                // router.push({ name: "login" });
            } catch (error) {
                console.error("Logout error:", error);
            }
            // Redirect to the login page and reload to update state.
            // router.push({ name: "login" });
            // location.reload();
        },
    },
];

const profileMenu = ref(null);

// Toggle the profile menu when the avatar area is clicked
const toggleProfileMenu = (event) => {
    if (profileMenu.value) {
        profileMenu.value.toggle(event);
    }
};
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <Logo />
                <span>QuoteSync</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <SearchButton />
            
            <div class="layout-config-menu hide-on-mobile">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button v-styleclass="{
                        selector: '@next',
                        enterFromClass: 'hidden',
                        enterActiveClass: 'animate-scalein',
                        leaveToClass: 'hidden',
                        leaveActiveClass: 'animate-fadeout',
                        hideOnOutsideClick: true,
                    }" type="button" class="layout-topbar-action layout-topbar-action-highlight">
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <!-- <button type="button" class="layout-topbar-action">
                <i class="pi pi-calendar"></i>
                <span>Calendar</span>
            </button>
            <button type="button" class="layout-topbar-action">
                <i class="pi pi-inbox"></i>
                <span>Messages</span>
            </button> -->
            <Chip :label="username || 'user'"
                :image="avatarUrl"
                class="user-avatar mr-2 mb-2 cursor-pointer" 
                @click="toggleProfileMenu" />
            <!-- <Avatar label="AA" class="mr-2" size="large" :style="{ 'background-color': '#2196F3', color: '#ffffff' }" shape="circle"></Avatar> -->
            <TieredMenu :model="profileMenuItems" ref="profileMenu" popup />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.layout-topbar {
    position: fixed;
    height: 5rem;
    z-index: 997;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0 2rem;
    background: linear-gradient(to right, var(--surface-card), var(--surface-ground));
    transition: transform 0.2s, left 0.2s;
    box-shadow: 0px 3px 5px rgba(0,0,0,0.02), 0px 0px 2px rgba(0,0,0,0.05), 0px 1px 4px rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .layout-topbar-logo-container {
        display: flex;
        align-items: center;
        color: var(--surface-900);
        font-size: 1.5rem;
        font-weight: 500;
        border-radius: 12px;
        transition: background-color 0.2s;

        &:hover {
            background-color: var(--surface-hover);
        }

        .layout-topbar-logo {
            display: flex;
            align-items: center;
            color: var(--primary-color);
            font-size: 1.5rem;
            font-weight: 500;
            text-decoration: none;
            margin: 0 0 0 0.5rem;
            transition: transform 0.2s;

            &:hover {
                transform: scale(1.05);
            }

            svg {
                height: 2.5rem;
                margin-right: 0.5rem;
            }
        }

        .layout-menu-button {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            position: relative;
            color: var(--text-color-secondary);
            border-radius: 50%;
            width: 3rem;
            height: 3rem;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
                color: var(--text-color);
                background-color: var(--surface-hover);
            }

            i {
                font-size: 1.5rem;
            }
        }
    }

    .layout-topbar-actions {
        display: flex;
        align-items: center;
        gap: 1rem;

        .layout-topbar-action {
            position: relative;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            color: var(--text-color-secondary);
            border-radius: 50%;
            width: 3rem;
            height: 3rem;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                color: var(--text-color);
                background-color: var(--surface-hover);
                transform: translateY(-2px);
            }

            i {
                font-size: 1.5rem;
            }

            &.layout-topbar-action-highlight {
                background-color: var(--primary-color);
                color: var(--primary-color-text);

                &:hover {
                    background-color: var(--primary-600);
                }
            }
        }

        .layout-config-menu {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    }
}

/* Mobile responsive styles */
@media screen and (max-width: 768px) {
    .layout-topbar {
        padding: 0 1rem;
    }

    .hide-on-mobile {
        display: none !important;
    }
    
    .layout-topbar-actions {
        gap: 0.5rem;
    }

    .layout-topbar-logo-container {
        .layout-topbar-logo {
            span {
                display: none;
            }
        }
    }

    .user-avatar {
        height: 2.5rem;
        
        .p-chip-image {
            width: 2rem;
            height: 2rem;
        }
    }
}

/* Dark mode adjustments */
:root.dark {
    .layout-topbar {
        background: linear-gradient(to right, var(--surface-card), var(--surface-ground));
        box-shadow: 0px 3px 5px rgba(0,0,0,0.1), 0px 0px 2px rgba(0,0,0,0.15), 0px 1px 4px rgba(0,0,0,0.2);
    }
}

.user-avatar {
    transition: all 0.3s ease;
    border: 2px solid transparent;
    background: var(--surface-card);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    height: 3rem;
    margin: 0 0.5rem;
    
    &:hover {
        transform: translateY(-2px) scale(1.05);
        border-color: var(--primary-color);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .p-chip-image {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--surface-ground);
        transition: all 0.3s ease;
        margin: 0;
    }

    .p-chip-label {
        font-weight: 500;
        color: var(--text-color);
        margin-left: 0.5rem;
        line-height: 1;
    }
}

/* Dark mode adjustments */
:root.dark {
    .user-avatar {
        background: var(--surface-card);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        
        &:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
    }
}
</style>

