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
  padding: 0;
  gap: 8px;
  width: 100%;
  max-width: 1216px;
  min-height: 72px;
}

.page-heading {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 1.2;
  letter-spacing: -0.530859px;
  color: #333333;
  margin: 0;
}

.page-paragraph {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.3125px;
  color: #525252;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-container {
    gap: 6px;
  }

  .page-heading {
    font-size: 28px;
  }

  .page-paragraph {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .page-container {
    gap: 4px;
  }

  .page-heading {
    font-size: 24px;
  }

  .page-paragraph {
    font-size: 14px;
  }
}
</style>
