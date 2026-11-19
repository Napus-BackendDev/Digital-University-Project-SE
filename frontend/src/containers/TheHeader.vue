<template>
  <CHeader with-subheader class="d-flex justify-content-between px-2 px-sm-3 px-md-4 align-items-center app-header">
    <div class="d-flex align-items-center flex-shrink-0">
      <CToggler in-header class="d-lg-none" @click="$store.commit('toggleSidebarMobile')" />
      <CToggler in-header class="d-md-down-none" @click="$store.commit('toggle', 'sidebarMinimize')" />
    </div>

    <div class="d-flex align-items-center header-right-controls">
      <!-- User info / Login link -->
      <router-link
        v-if="!currentUser"
        to="/pages/login"
        class="btn btn-outline-primary btn-sm mr-2 mr-sm-3 d-flex align-items-center font-weight-bold rounded-12 flex-shrink-0"
      >
        <CIcon name="cil-user" class="mr-1" />
        <span>{{ lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In' }}</span>
      </router-link>
      <div v-else class="mr-1 mr-sm-3 d-flex align-items-center header-user-cluster">
        <span class="badge badge-light border py-1 px-2 text-dark font-weight-bold d-flex align-items-center rounded-12">
          <img
            v-if="userPicture"
            :src="userPicture"
            alt="Avatar"
            class="rounded-circle mr-1 border flex-shrink-0"
            style="width: 22px; height: 22px; object-fit: cover;"
            referrerpolicy="no-referrer"
          />
          <CIcon v-else name="cil-user" class="mr-1 text-primary flex-shrink-0" />
          <span class="text-truncate header-user-name">{{ currentUser.name }}</span>
        </span>
        <button
          type="button"
          class="btn btn-outline-danger btn-sm ml-1 ml-sm-2 px-2 py-1 d-flex align-items-center justify-content-center font-weight-bold rounded-12 header-logout-btn flex-shrink-0"
          :title="lang === 'th' ? 'ออกจากระบบ' : 'Sign Out'"
          :aria-label="lang === 'th' ? 'ออกจากระบบ' : 'Sign Out'"
          @click="logout"
        >
          <CIcon name="cil-account-logout" />
          <span class="d-none d-sm-inline ml-1">{{ lang === 'th' ? 'ออกจากระบบ' : 'Sign Out' }}</span>
        </button>
      </div>

      <!-- Language Switcher -->
      <CButton class="d-flex align-items-center rounded-12 flex-shrink-0 px-2 px-sm-3" @click="toggleLang">
        <CIcon :name="label === 'EN' ? 'cif-gb' : 'cif-th'" class="mr-1 mr-sm-2"/>
        <strong>{{ label }}</strong>
      </CButton>
    </div>
  </CHeader>
</template>

<script>
import api from '@/service/api';
import { clearClientSession } from '@/projects/utils/authSession';

export default {
  name: 'navbar',
  methods: {
    toggleLang() {
      const next = this.$i18n.locale === 'en' ? 'th' : 'en';
      this.$i18n.locale = next;
      localStorage.setItem('lang', next);
      this.$store.commit('Setting/lang', next);
    },
    async logout() {
      try {
        await api.auth('logout');
      } catch (e) {
        // Proceed with local session teardown even if logout endpoint fails
      }
      clearClientSession(this.$store);
      this.$router.push('/pages/login');
    }
  },
  computed: {
    lang() {
      return this.$i18n.locale;
    },
    label() {
      return this.lang === 'th' ? 'ไทย' : 'EN';
    },
    currentUser() {
      return this.$store.state.User ? this.$store.state.User.user : null;
    },
    userPicture() {
      return (this.currentUser && this.currentUser.picture) || null;
    }
  }
};
</script>

<style scoped>
.app-header {
  max-width: 100%;
}

.header-right-controls,
.header-user-cluster {
  min-width: 0;
}

.header-user-name {
  max-width: 96px;
}

.header-logout-btn {
  min-height: 44px;
  min-width: 44px;
}

::v-deep .c-header-toggler,
.c-header-toggler {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 576px) {
  .header-user-name {
    max-width: 140px;
  }
}
</style>
