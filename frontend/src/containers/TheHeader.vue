<template>
  <header class="app-header">
    <div class="app-header__inner">
      <!-- Left: Logo -->
      <router-link to="/editor/dashboard" class="app-header__brand">
        <img src="@/assets/logo.svg" class="app-header__logo" alt="FormBuilder" />
        <div class="app-header__brand-text">
          <span class="app-header__brand-name">FormBuilder</span>
          <span class="app-header__brand-sub">มหาวิทยาลัย</span>
        </div>
      </router-link>

      <!-- Center: Navigation -->
      <nav class="app-header__nav">
        <router-link to="/editor/dashboard" class="app-header__nav-link" :class="{ 'app-header__nav-link--active': $route.path.startsWith('/editor') || $route.path.startsWith('/user') }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Forms</span>
        </router-link>
        <router-link to="/admin/dashboard" class="app-header__nav-link" :class="{ 'app-header__nav-link--active': $route.path.startsWith('/admin') }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Staff Dashboard</span>
        </router-link>
      </nav>

      <!-- Right: User Info & Actions -->
      <div class="app-header__right">
        <!-- Language Switch -->
        <div class="app-header__lang-switch">
          <span class="app-header__lang-label" :class="{ 'app-header__lang-label--active': lang === 'th' }">TH</span>
          <CSwitch class="mx-1" shape="pill" color="info" variant="opposite" size="sm" :checked="lang === 'en'"
            @update:checked="onSwitchLang" />
          <span class="app-header__lang-label" :class="{ 'app-header__lang-label--active': lang === 'en' }">EN</span>
        </div>

        <div class="app-header__divider"></div>

        <div class="app-header__user">
          <span class="app-header__user-name">Staff User</span>
          <span class="app-header__user-email">{{ userEmail }}</span>
        </div>

        <button class="app-header__logout" @click="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: 'TheHeader',
  data() {
    return {
      userEmail: 'admin@university.ac.th'
    }
  },
  methods: {
    logout() {
      this.$router.push('/pages/login')
    },
    onSwitchLang() {
      switch (this.lang) {
        case "th":
          this.$store.commit("setting/lang", "en")
          break;
        case "en":
          this.$store.commit("setting/lang", "th")
          break;
      }
    }
  },
  computed: {
    ...mapGetters({
      lang: "setting/lang",
    })
  },
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0 160px;
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.app-header__brand:hover {
  text-decoration: none;
}

.app-header__logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.app-header__brand-text {
  display: flex;
  flex-direction: column;
}

.app-header__brand-name {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: -0.3125px;
  color: #1a1a1a;
}

.app-header__brand-sub {
  font-family: 'Inter', 'Noto Sans Thai', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  color: #737373;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header__nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.1504px;
  color: #333333;
  text-decoration: none;
  transition: all 0.2s ease;
}

.app-header__nav-link:hover {
  background-color: #f5f5f5;
  text-decoration: none;
  color: #333333;
}

.app-header__nav-link--active {
  background-color: #171717;
  color: #fafafa;
}

.app-header__nav-link--active:hover {
  background-color: #171717;
  color: #fafafa;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-header__lang-switch {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-header__lang-label {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #a3a3a3;
}

.app-header__lang-label--active {
  color: #333333;
}

.app-header__divider {
  width: 1px;
  height: 24px;
  background-color: #e5e5e5;
}

.app-header__user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.app-header__user-name {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.1504px;
  color: #1a1a1a;
}

.app-header__user-email {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
}

.app-header__logout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 12px;
  border: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.1504px;
  color: #333333;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.app-header__logout:hover {
  background-color: #f5f5f5;
}

@media (max-width: 1200px) {
  .app-header {
    padding: 0 40px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }

  .app-header__nav {
    display: none;
  }

  .app-header__lang-switch {
    display: none;
  }

  .app-header__user {
    display: none;
  }

  .app-header__divider {
    display: none;
  }
}
</style>
