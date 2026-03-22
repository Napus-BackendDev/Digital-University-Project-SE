<template>
  <div class="c-app">
    <TheSidebar v-if="!isPublicForm" />
    <CWrapper>
      <TheHeader v-if="!isPublicForm" />
      <main class="c-main">
        <CContainer fluid>
          <transition name="fade">
            <router-view></router-view>
          </transition>
        </CContainer>
      </main>

    </CWrapper>
    <CenterLoading />
    <SignIn v-if="!isPublicForm" />
    <TwoFA v-if="!isPublicForm" />

  </div>
</template>

<script>
import TheSidebar from './TheSidebar'
import TheHeader from './TheHeader'
import { mapGetters } from "vuex";
import DialogMessage from "@/projects/components/dialog/DialogMessage.vue";
import CenterLoading from "@/projects/components/dialog/CenterLoading.vue";
import SignIn from "@/projects/components/dialog/SignIn.vue";
import TwoFA from "@/projects/components/dialog/TwoFA.vue";

export default {
  name: 'TheContainer',
  components: {
    TwoFA,
    SignIn,
    CenterLoading,
    DialogMessage,
    TheSidebar,
    TheHeader,
  },

  mounted() {
    this.showNotification();
  },
  data() {
    return {
    }
  },
  methods: {
  },
  computed: {
    ...mapGetters({
    }),
    isPublicForm() {
      // Check if we are on the form fill page
      const isFormFillRoute = this.$route.name === 'FormFill';
      
      // Determine if it's an internal view (Preview, Duplicate, or Internal Source)
      const isInternalSource = this.$route.query.source === 'internal';
      const isInternalMode = ['preview', 'duplicate'].includes(this.$route.query.mode);
      const isPublicMode = this.$route.query.mode === 'public';
      
      const isPreviewRoute = this.$route.name === 'Preview';

      // It's a public form if it's the Fill route AND (it's explicitly public mode OR not an internal source/mode)
      return isFormFillRoute && (isPublicMode || (!isInternalSource && !isInternalMode)) && !isPreviewRoute;
    }
  },
  watch: {
  }
}
</script>

<style></style>
