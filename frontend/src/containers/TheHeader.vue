<template>
  <CHeader with-subheader class="d-flex justify-content-between px-4 align-items-center">
    <CToggler in-header class="d-md-down-none" @click="$store.commit('toggle', 'sidebarMinimize')" />

    <div class="d-flex align-items-center">
      <!-- User info / Login link -->
      <router-link
        v-if="!currentUser"
        to="/pages/login"
        class="btn btn-outline-primary btn-sm mr-3 d-flex align-items-center font-weight-bold"
      >
        <CIcon name="cil-user" class="mr-1" />
        <span>{{ lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In' }}</span>
      </router-link>
      <div v-else class="mr-3 d-flex align-items-center">
        <span class="badge badge-light border py-1 px-2 text-dark font-weight-bold d-flex align-items-center">
          <CIcon name="cil-user" class="mr-1 text-primary" />
          <span class="text-truncate" style="max-width: 140px;">{{ currentUser.name }}</span>
        </span>
        <button
          type="button"
          class="btn btn-link btn-sm text-danger ml-1 p-1"
          :title="lang === 'th' ? 'ออกจากระบบ' : 'Sign Out'"
          @click="logout"
        >
          <CIcon name="cil-account-logout" />
        </button>
      </div>

      <!-- Language Switcher -->
      <CButton class="d-flex align-items-center" @click="toggleLang">
        <CIcon :name="label === 'EN' ? 'cif-gb' : 'cif-th'" class="mr-2"/>
        <strong>{{ label }}</strong>
      </CButton>
    </div>
  </CHeader>
</template>

<script>
export default {
  name: 'navbar',
  methods: {
    toggleLang() {
      const next = this.$i18n.locale === 'en' ? 'th' : 'en';
      this.$i18n.locale = next;
      localStorage.setItem('lang', next);
      this.$store.commit('Setting/lang', next);
    },
    logout() {
      window.localStorage.removeItem('activeUserId');
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
    }
  }
};
</script>

<style scoped>
</style>
