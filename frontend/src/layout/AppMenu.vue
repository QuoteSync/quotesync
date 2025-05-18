<script setup>
import { ref } from "vue";
import { useLayout } from "@/layout/composables/layout";
import AppConfigurator from "./AppConfigurator.vue";
import AppMenuItem from "./AppMenuItem.vue";

const { toggleDarkMode, isDarkTheme } = useLayout();

const socialItems = [
  {
    label: 'Groups',
    icon: 'pi pi-users',
    to: '/groups'
  },
  {
    label: 'Shared with Me',
    icon: 'pi pi-share-alt',
    to: '/shared'
  }
];

const model = ref([
  {
    label: "Home",
    items: [
      { label: "Dashboard", icon: "pi pi-fw pi-home", to: "/" },
    ],
  },
  {
    label: "Library",
    items: [
      { label: "Books", icon: "pi pi-fw pi-book", to: "/books" },
      { label: "Authors", icon: "pi pi-fw pi-users", to: "/authors" },
      { label: "Quotes", icon: "pi pi-fw pi-comment", to: "/quotes" },
      { label: "Quote Lists", icon: "pi pi-fw pi-list", to: "/lists" },
      { label: "Tags", icon: "pi pi-fw pi-tag", to: "/tags" },
      { label: "Import Quotes", icon: "pi pi-fw pi-download", to: "/import-quotes" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { label: "AI Chat Assistant", icon: "pi pi-fw pi-comments", to: "/ai-chat" },
      { label: "Advanced Search", icon: "pi pi-fw pi-search", to: "/advanced-search" },
      { label: "Auto Tag Quotes", icon: "pi pi-fw pi-tags", to: "/auto-tag-quotes" },
    ],
  },
  {
    label: "Social",
    items: socialItems
  }
]);
</script>

<template>
  <ul class="layout-menu">
    <template v-for="(item, i) in model" :key="item">
      <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
      <li v-if="item.separator" class="menu-separator"></li>
    </template>
    
    <!-- Mobile-only theme settings section -->
    <li class="mobile-only-settings">
      <div class="settings-header">Theme Settings</div>
      <div class="settings-items">
        <button type="button" class="mobile-theme-toggle" @click="toggleDarkMode">
          <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
          <span>{{ isDarkTheme ? 'Dark Mode' : 'Light Mode' }}</span>
        </button>
        
        <div class="mobile-palette-wrapper">
          <button v-styleclass="{
            selector: '@next',
            enterFromClass: 'hidden',
            enterActiveClass: 'animate-scalein',
            leaveToClass: 'hidden',
            leaveActiveClass: 'animate-fadeout',
            hideOnOutsideClick: true,
          }" type="button" class="mobile-palette-button">
            <i class="pi pi-palette"></i>
            <span>Change Theme</span>
          </button>
          <AppConfigurator />
        </div>
      </div>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.mobile-only-settings {
  display: none;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.settings-header {
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 0 1rem;
  color: var(--text-color);
}

.settings-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-theme-toggle,
.mobile-palette-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-size: 1rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--surface-hover);
  }
  
  i {
    font-size: 1.25rem;
  }
}

/* Show mobile settings only on mobile */
@media screen and (max-width: 768px) {
  .mobile-only-settings {
    display: block;
  }
}
</style>
