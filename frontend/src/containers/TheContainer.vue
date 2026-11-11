<template>
  <div class="c-app" :class="{ 'c-app-public': isPublicMode }">
    <TheSidebar v-if="!isPublicMode" />
    <CWrapper :class="{ 'c-wrapper-public': isPublicMode }">
      <TheHeader v-if="!isPublicMode" />
      <main class="c-main" :class="{ 'c-main-public': isPublicMode }">
        <CContainer fluid :class="{ 'c-container-public': isPublicMode }">
          <transition name="fade">
            <router-view></router-view>
          </transition>
        </CContainer>
      </main>

    </CWrapper>
    <CenterLoading />
    <DialogMessage />
    <!-- <SignIn /> -->
    <!-- <TwoFA /> -->

  </div>
</template>

<script>
import TheSidebar from './TheSidebar'
import TheHeader from './TheHeader'
import { mapGetters } from "vuex";
import DialogMessage from "@/projects/components/dialog/DialogMessage.vue";
import CenterLoading from "@/projects/components/dialog/CenterLoading.vue";
// import SignIn from "@/projects/components/dialog/SignIn.vue";
// import TwoFA from "@/projects/components/dialog/TwoFA.vue";

export default {
  name: 'TheContainer',
  components: {
    // TwoFA,
    // SignIn,
    CenterLoading,
    DialogMessage,
    TheSidebar,
    TheHeader,
  },

  mounted() {
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
    isPublicMode() {
      // 1. Explicit public mode in query (e.g. ?mode=public)
      if (this.$route.query && this.$route.query.mode === 'public') {
        return true;
      }
      // 2. Direct respondent FormFill view (not from internal dashboard navigation or duplicate)
      if (this.$route.name === 'FormFill') {
        const query = this.$route.query || {};
        const isInternalMode = ['preview', 'duplicate'].includes(query.mode);
        const isInternalSource = query.source === 'internal';
        return !isInternalMode && !isInternalSource;
      }
      return false;
    }
  },
  watch: {
  }
}
</script>

<style scoped>
.c-app-public {
  background-color: #f0f2f5;
  min-height: 100vh;
}

.c-wrapper-public {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  min-height: 100vh;
}

.c-main-public {
  padding-top: 24px !important;
  padding-bottom: 48px !important;
}

.c-container-public {
  max-width: 860px !important;
  width: 100% !important;
  margin: 0 auto !important;
  padding-left: 16px !important;
  padding-right: 16px !important;
}
</style>
