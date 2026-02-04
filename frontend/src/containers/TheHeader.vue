<template>
  <Navbar />
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Navbar from '@/components/Navbar.vue';

export default {
  name: 'TheHeader',
  components: {
    Navbar
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'user']),
    userEmail() {
      return this.user?.email || ''
    },
    homePath() {
      if (!this.isAuthenticated) return '/'
      const role = this.user?.role
      if (role === 'admin') return '/admin'
      if (role === 'staff') return '/staff'
      return '/user'
    }
  },
  methods: {
    ...mapActions('auth', ['logout']),
    handleLogout() {
      this.logout()
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #ffffff;
  border-bottom: 1px solid var(--border-color);
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
  color: var(--text-primary);
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
