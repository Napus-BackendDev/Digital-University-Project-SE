<template>
  <p class="file-upload-summary">{{ count }} {{ fileType }}(s) uploaded</p>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 0
  },
  fileType: {
    type: String,
    default: 'file'
  }
})
</script>

<style scoped>
.file-upload-summary {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #525252;
  margin: 0;
}
</style>
