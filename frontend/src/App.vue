<script setup>
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'

const route = useRoute()

const handleLogout = () => {
  console.log('Logout clicked')
  // Add logout logic here
}
</script>

<template>
  <div id="app">
    <Navbar user-email="user@example.com" @logout="handleLogout" />
    <main>
      <RouterView />
    </main>
  </div>
</template>

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
