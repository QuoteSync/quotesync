<template>
  <div class="layout-menu-container">
    <ul class="layout-menu">
      <li>
        <router-link to="/" class="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-100 transition-colors transition-duration-150">
          <i class="pi pi-home mr-2"></i>
          <span>Home</span>
        </router-link>
      </li>
      <li>
        <router-link to="/quotes" class="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-100 transition-colors transition-duration-150">
          <i class="pi pi-quote-left mr-2"></i>
          <span>Quotes</span>
        </router-link>
      </li>
      <li>
        <router-link to="/books" class="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-100 transition-colors transition-duration-150">
          <i class="pi pi-book mr-2"></i>
          <span>Books</span>
        </router-link>
      </li>
      <li>
        <router-link to="/authors" class="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-100 transition-colors transition-duration-150">
          <i class="pi pi-users mr-2"></i>
          <span>Authors</span>
        </router-link>
      </li>
      <li>
        <router-link to="/tags" class="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-100 transition-colors transition-duration-150">
          <i class="pi pi-tags mr-2"></i>
          <span>Tags</span>
        </router-link>
      </li>
      <li>
        <router-link to="/lists" class="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-100 transition-colors transition-duration-150">
          <i class="pi pi-list mr-2"></i>
          <span>Quote Lists</span>
        </router-link>
      </li>
      <li>
        <router-link to="/documentation" class="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-100 transition-colors transition-duration-150">
          <i class="pi pi-file mr-2"></i>
          <span>Documentation</span>
        </router-link>
      </li>
    </ul>
  </div>
</template> 