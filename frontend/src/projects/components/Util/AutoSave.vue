<template>
    <span class="text-muted small font-weight-bold mr-3">
        <CIcon v-if="saveStatus === 'Saving...'" name="cil-cloud-upload" class="mr-1" />
        <CIcon v-else-if="saveStatus === 'Saved'" name="cil-check-alt" class="mr-1 text-success" />
        <CIcon v-else name="cil-warning" class="mr-1 text-danger" />
        {{ saveStatus }}
    </span>
</template>

<script>
export default {
    name: 'AutoSave',
    props: {
        saveStatus: {
            type: String,
            default: 'Saving...'
        }
    }
}
</script>