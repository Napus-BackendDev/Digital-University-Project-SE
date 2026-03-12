<template>
  <div class="p-4">
    <h2 class="mb-3">{{ $t('nav.permissions') }}</h2>
    <p class="text-muted">Manage roles and permissions (placeholder page).</p>
    <div class="mt-4">
      <!-- Placeholder content -->
      <CButton color="primary" @click="$toast && $toast.info('Permissions page coming soon')">{{ $t('common.refresh') }}</CButton>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPermissions'
}
</script>

<style scoped>
.text-muted { color: #6b7280; }
</style>
