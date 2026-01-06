<template>
  <div class="page-container">
    <h1 class="page-heading">{{ title }}</h1>
    <p class="page-paragraph">{{ subtitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 1216px;
  height: 72px;
}

.page-heading {
  width: 1216px;
  height: 40px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.530859px;
  color: var(--text-primary);
  margin: 0;
}

.page-paragraph {
  width: 1216px;
  height: 24px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.3125px;
  color: #525252;
  margin: 0;
}
</style>
