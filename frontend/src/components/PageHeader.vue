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
  width: 100%;
  max-width: 1216px;
  min-width: 0;
  box-sizing: border-box;
}

.page-heading {
  width: 100%;
  max-width: 1216px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.530859px;
  color: #333333;
  margin: 0;
  word-break: break-word;
}

.page-paragraph {
  width: 100%;
  max-width: 1216px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.3125px;
  color: #525252;
  margin: 0;
  word-break: break-word;
}

@media (max-width: 900px) {
  .page-container {
    max-width: 100%;
    padding: 0 8px;
  }
  .page-heading {
    font-size: 24px;
    line-height: 32px;
  }
  .page-paragraph {
    font-size: 14px;
    line-height: 20px;
  }
}

@media (max-width: 600px) {
  .page-container {
    padding: 0 2px;
    gap: 4px;
  }
  .page-heading {
    font-size: 18px;
    line-height: 24px;
  }
  .page-paragraph {
    font-size: 12px;
    line-height: 16px;
  }
}
</style>
