<template>
    <div>
        <div class="mb-2">Upload file</div>
        <input type="file" class="form-control-file" />
        <small class="form-text text-muted">PDF, DOC, DOCX or Image up to 10MB</small>
    </div>
</template>

<script>
export default {
    name: 'FileUpload',
    props: { question: { type: Object, required: true } }
}
</script>

<style scoped></style>
