<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import Navbar from './components/Navbar.vue'

const route = useRoute()
const router = useRouter()

// ซ่อน Navbar ในหน้า Login
const showNavbar = computed(() => route.name !== 'login')

const handleLogout = () => {
  // ลบข้อมูล user ออกจาก localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // redirect ไปหน้า login
  router.push('/')
}
</script>

<template>
  <div id="app">
    <Navbar v-if="showNavbar" user-email="user@example.com" @logout="handleLogout" />
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
