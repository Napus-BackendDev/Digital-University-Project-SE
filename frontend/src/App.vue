<template>
  <div id="app">
    <Navbar v-if="showNavbar" user-email="user@example.com" @logout="handleLogout" />
    <main>
      <RouterView />
    </main>
  </div>
</template>


<script>
export default {
  name: 'App',
  computed: {
    showNavbar() {
      return this.$route.name !== 'login'
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/')
    }
  }
}
</script>


<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  background: #fafafa;
}
</style>
