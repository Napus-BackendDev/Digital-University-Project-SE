<template>
  <CHeader with-subheader class="d-flex justify-content-between px-4">
    <CToggler in-header class="d-md-down-none" @click="$store.commit('toggle', 'sidebarMinimize')" />

    <div class="d-flex align-items-center">
      <CButton
        color="light"
        class="d-flex align-items-center px-3"
        :aria-label="languageButtonLabel"
        @click="toggleLanguage"
      >
        <CIcon :name="lang === 'en' ? 'cif-gb' : 'cif-th'" class="mr-2" />
        <strong>{{ label }}</strong>
      </CButton>
    </div>
  </CHeader>
</template>

<script>

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
    toggleLanguage() {
      const nextLanguage = this.lang === 'th' ? 'en' : 'th'
      this.$i18n.locale = nextLanguage
      this.$store.commit('Setting/lang', nextLanguage)
      document.documentElement.setAttribute('lang', nextLanguage)
    },
  },
  computed: {
    lang() {
      return this.$i18n.locale
    },
    label() {
      return this.lang === 'th' ? 'ไทย' : 'EN'
    },
    languageButtonLabel() {
      return this.lang === 'th' ? 'เปลี่ยนภาษาเป็นอังกฤษ' : 'Switch language to Thai'
    },
  },
}
</script>

<style scoped>
</style>
