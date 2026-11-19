<template>
  <EmailStudio :initial-id="id" />
</template>

<script>
import EmailStudio from './index.vue'

export default {
  name: 'EmailDetail',
  components: {
    EmailStudio
  },
  props: {
    id: {
      type: String,
      required: true
    }
  }
}
</script>
