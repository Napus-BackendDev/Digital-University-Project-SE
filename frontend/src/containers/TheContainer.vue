<template>
  <div class="c-app">
    <TheSidebar />
    <CWrapper>
      <TheHeader />
      <main class="c-main">
        <CContainer fluid>
          <transition name="fade">
            <router-view></router-view>
          </transition>
        </CContainer>
      </main>

    </CWrapper>
    <CenterLoading />
    <SignIn />
    <TwoFA />

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
      const isFormFillRoute = this.$route.name === 'FormFill';
      const isInternalSource = this.$route.query.source === 'internal';
      const isInternalMode = ['preview', 'duplicate'].includes(this.$route.query.mode);
      const isPreviewRoute = this.$route.name === 'Preview';

      return isFormFillRoute && !isInternalSource && !isInternalMode && !isPreviewRoute;
    }
  },
  watch: {
  }
}
</script>

<style></style>
