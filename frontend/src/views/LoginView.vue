<script setup>
import LeftSection from '@/components/Login/LeftSection.vue'
import RightSection from '@/components/Login/RightSection.vue'
</script>

<template>
  <div class="login-container">
    <LeftSection />
    <RightSection />
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  width: 100%;
  overflow-x: hidden;
}

/* Tablet - stack vertically */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
  }
}

/* Mobile - login form first */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-container > :nth-child(2) {
    order: -1;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .login-container {
    min-height: 100svh; /* Small viewport height */
  }
}
</style>