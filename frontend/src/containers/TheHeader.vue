<template>
  <CHeader with-subheader class="d-flex justify-content-between px-4">
    <CToggler in-header class="d-md-down-none" @click="$store.commit('toggle', 'sidebarMinimize')" />

    <div class="d-flex align-items-center">
      <CButton  class="d-flex align-items-center" @click="toggleLang">
        <CIcon :name="label === 'EN' ? 'cif-gb' : 'cif-th'" class="mr-2"/>
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
    toggleLang() {
      const next = this.$i18n.locale === 'en' ? 'th' : 'en'
      this.$i18n.locale = next
      localStorage.setItem('lang', next)
      this.$store.commit('Setting/lang', next)
    },
  },
  computed: {
    lang() {
      return this.$i18n.locale
    },
    label() {
      return this.lang === 'th' ? 'ไทย' : 'EN'
    },
  },
}
</script>

<style scoped>
</style>