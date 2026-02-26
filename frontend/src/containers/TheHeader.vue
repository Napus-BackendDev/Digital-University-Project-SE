<template>
  <CHeader with-subheader class="justify-content-center">
    <div class="d-flex align-items-center w-75 py-2">
      <CToggler in-header class="d-md-down-none">
        <div class="d-flex align-items-center">
          <img src="@/assets/logo.svg" height="48" />
          <div class="d-flex flex-column align-items-start px-3">
            <span class="font-weight-bold header-title">E-Questionaires</span>
            <span class="text-muted">มหาวิทยาลัยแม่ฟ้าหลวง</span>
          </div>
        </div>
      </CToggler>

      <CHeaderNav class="d-flex align-items-center d-md-down-none ml-auto">
        <!-- Language Switch -->
        <!-- <div class="d-flex align-items-center">
          <span class="mr-2 text-muted font-weight-bold" style="font-size: 0.9rem;">TH</span>
          <CSwitch class="mx-1" shape="pill" color="info" variant="opposite" :checked="lang === 'en'"
            @update:checked="onSwitchLang" />
          <span class="ml-2 text-muted font-weight-bold" style="font-size: 0.9rem;">EN</span>
        </div> -->

        <div class="container">
          <div class="row">
            <div @click="forms" :class="['nav-link-item', { 'nav-link-active': isActive('forms') }]">
              <CIcon class="mx-2" name="cil-description" />
              <span class="mx-2">Forms</span>
            </div>
            <div @click="dashboard" :class="['nav-link-item', { 'nav-link-active': isActive('dashboard') }]">
              <CIcon class="mx-2" name="cib-ghost" />
              <span class="mx-2">Dashboard</span>
            </div>
            <div @click="statistic" :class="['nav-link-item', { 'nav-link-active': isActive('statistic') }]">
              <CIcon class="mx-2" name="cil-chart" />
              <span class="mx-2">Statistic</span>
            </div>
          </div>
        </div>
        <div class="d-flex flex-column px-5">
          <span class="font-weight-bold">{{ username }}</span>
          <span class="text-muted">{{ userEmail }}</span>
        </div>
        <div class="d-flex align-items-center" @click="logout" style="cursor: pointer">
          <CIcon name="cil-account-logout" class="text-dark mx-2" />
          <span class="text-dark">Logout</span>
        </div>
      </CHeaderNav>
    </div>
  </CHeader>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: 'navbar',
  components: {
  },

  data() {
    return {
      username: 'John Doe',
      userEmail: 'user@example.com'
    }
  },
  methods: {
    isActive(path) {
      const currentPath = this.$route.path.split('/')
      return currentPath.includes(path)
    },
    forms() {
      this.$router.push('/forms')
    },
    dashboard() {
      this.$router.push('/editor/dashboard')
    },
    statistic() {
      this.$router.push('/admin/statistic')
    },
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

<style>
.nav-link-item {
  display: flex;
  align-items: center;
  padding: 5px;
  transition: background .15s ease, transform .15s ease, color .15s ease;
  border-radius: .25rem;
  cursor: pointer;
}

.nav-link-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.nav-link-active {
  background: rgba(23, 23, 23, 1);
  color: #fff !important;
  border-radius: .5rem;
}
</style>