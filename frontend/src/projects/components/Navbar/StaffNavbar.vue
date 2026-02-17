<template>
  <nav class="staff-navbar">
    <div class="staff-navbar__inner">
      <!-- Logo -->
      <router-link to="/" class="staff-navbar__brand">
        <img src="@/assets/logo.svg" alt="FormBuilder" class="staff-navbar__logo" />
        <div class="staff-navbar__brand-text">
          <span class="staff-navbar__brand-name">FormBuilder</span>
          <span class="staff-navbar__brand-sub">มหาวิทยาลัย</span>
        </div>
      </router-link>

      <!-- Right Section -->
      <div class="staff-navbar__right">
        <!-- Navigation Links -->
        <div class="staff-navbar__nav">
          <router-link
            :to="{ name: 'StaffDashboard' }"
            class="staff-navbar__nav-btn"
            :class="{ 'staff-navbar__nav-btn--active': isActive('Forms') }"
          >
            <CIcon name="cil-description" size="sm" />
            <span>Forms</span>
          </router-link>

          <router-link
            :to="{ name: 'AdminDashboard' }"
            class="staff-navbar__nav-btn"
            :class="{ 'staff-navbar__nav-btn--active': isActive('StaffDashboard') }"
          >
            <CIcon name="cil-chart-pie" size="sm" />
            <span>Staff Dashboard</span>
          </router-link>
        </div>

        <!-- Divider -->
        <div class="staff-navbar__divider"></div>

        <!-- User Info -->
        <div class="staff-navbar__user">
          <div class="staff-navbar__user-info">
            <span class="staff-navbar__user-name">Staff User</span>
            <span class="staff-navbar__user-email">admin@university.ac.th</span>
          </div>
        </div>

        <!-- Logout -->
        <button class="staff-navbar__nav-btn" @click="logout">
          <CIcon name="cil-account-logout" size="sm" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'StaffNavbar',
  props: {
    activePage: {
      type: String,
      default: 'Forms'
    }
  },
  methods: {
    isActive(page) {
      return this.activePage === page;
    },
    logout() {
      this.$router.push('/pages/login');
    }
  }
}
</script>

<style scoped>
.staff-navbar {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0 160px;
}

.staff-navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

/* Brand / Logo */
.staff-navbar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.staff-navbar__logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.staff-navbar__brand-text {
  display: flex;
  flex-direction: column;
}

.staff-navbar__brand-name {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #1a1a1a;
  letter-spacing: -0.31px;
}

.staff-navbar__brand-sub {
  font-family: 'Inter', 'Noto Sans Thai', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  color: #737373;
}

/* Right Section */
.staff-navbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Nav Buttons */
.staff-navbar__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.staff-navbar__nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #333;
  letter-spacing: -0.15px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease;
  white-space: nowrap;
}

.staff-navbar__nav-btn:hover {
  background-color: rgba(229, 229, 229, 0.3);
  text-decoration: none;
  color: #333;
}

.staff-navbar__nav-btn--active {
  background-color: #171717;
  color: #fafafa;
}

.staff-navbar__nav-btn--active:hover {
  background-color: #171717;
  color: #fafafa;
}

/* Divider */
.staff-navbar__divider {
  width: 1px;
  height: 24px;
  background-color: #e5e5e5;
  margin: 0 8px;
}

/* User Info */
.staff-navbar__user {
  display: flex;
  align-items: center;
}

.staff-navbar__user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.staff-navbar__user-name {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #1a1a1a;
  letter-spacing: -0.15px;
}

.staff-navbar__user-email {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
}

/* Responsive */
@media (max-width: 1200px) {
  .staff-navbar {
    padding: 0 40px;
  }
}

@media (max-width: 768px) {
  .staff-navbar {
    padding: 0 16px;
  }

  .staff-navbar__user-info {
    display: none;
  }

  .staff-navbar__divider {
    display: none;
  }
}
</style>
