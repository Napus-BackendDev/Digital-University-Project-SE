<template>
  <CHeader with-subheader>
    <CToggler in-header class="ml-3 d-md-down-none mb-2">
      <div class="d-flex align-items-center ml-2">
        <img src="@/assets/logo.svg" height="48" />
        <div class="ml-3 d-flex flex-column justify-content-center">
          <h3 class="font-weight-bold mb-0 mt-2">FormBuilder</h3>
          <span class="text-muted">มหาวิทยาลัยแม่ฟ้าหลวง</span>
        </div>
      </div>
    </CToggler>

    <CHeaderNav class="d-md-down-none ml-auto mr-4">
      <div class="d-flex align-items-center">
        <span class="mr-3 text-muted">{{ userEmail }}</span>
        <div class="d-flex align-items-center" @click="logout" style="cursor: pointer">
          <CIcon name="cil-account-logout" class="mr-2 text-dark" />
          <span class="text-dark">Logout</span>
        </div>
      </div>
    </CHeaderNav>
  </CHeader>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: 'TheHeader',
  components: {
  },

  data() {
    return {
      userEmail: 'user@example.com'
    }
  },
  methods: {
    logout() {
      // Implement logout logic here, e.g., clear token and redirect
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
