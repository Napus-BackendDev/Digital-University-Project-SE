<template>
  <p class="file-upload-summary">{{ count }} {{ fileType }}(s) uploaded</p>
</template>

<script setup>
/**
 * FileUploadSummary - สรุปจำนวนไฟล์ที่อัพโหลด
 * แสดงจำนวนและประเภทไฟล์
 */
defineProps({
  count: { type: Number, default: 0 },     // จำนวนไฟล์
  fileType: { type: String, default: 'file' } // ประเภทไฟล์
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
