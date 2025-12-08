<template>
  <div class="login-container">
    <LeftSection />
    <RightSection />
  </div>
</template>

<script setup>
import LeftSection from './LeftSection.vue'
import RightSection from './RightSection.vue'
</script>

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
}
</style>
