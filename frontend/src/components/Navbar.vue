<script setup>
defineProps({
  userEmail: {
    type: String,
    default: 'user@example.com'
  }
})

const emit = defineEmits(['logout'])

const handleLogout = () => {
  emit('logout')
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo Section -->
      <router-link to="/" class="navbar-brand">
        <div class="logo-icon">
          <img src="/MFU-Logo.png" alt="Logo" class="logo-image" />
        </div>
        <div class="brand-text">
          <span class="brand-name">FormBuilder</span>
          <span class="brand-subtitle">มหาวิทยาลัย</span>
        </div>
      </router-link>

      <!-- User Section -->
      <div class="user-section">
        <span class="user-email">{{ userEmail }}</span>
        <button class="logout-btn" @click="handleLogout">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0 160px;
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  max-width: 1216px;
  margin: 0 auto;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

.brand-subtitle {
  font-family: 'Inter', 'Noto Sans Thai', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  color: #737373;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-email {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #525252;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #f5f5f5;
}

.logout-btn .icon {
  width: 16px;
  height: 16px;
}

@media (max-width: 1200px) {
  .navbar {
    padding: 0 40px;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 20px;
  }

  .user-email {
    display: none;
  }
}
</style>
