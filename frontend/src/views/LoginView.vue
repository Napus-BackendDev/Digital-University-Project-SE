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
  width: 100%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-container > :nth-child(2) {
    order: -1;
  }
}
</style>