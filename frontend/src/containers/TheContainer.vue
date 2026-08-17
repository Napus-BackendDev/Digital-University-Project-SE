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
    <DialogMessage />
    <transition name="back-to-top-fade">
      <button v-if="showBackToTop" type="button" class="back-to-top" :title="$t('button.backToTop')"
        :aria-label="$t('button.backToTop')" @click="scrollToTop">
        <span aria-hidden="true">↑</span>
      </button>
    </transition>
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
    window.addEventListener('scroll', this.updateBackToTop, { passive: true })
    this.updateBackToTop()
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.updateBackToTop)
  },
  data() {
    return {
      showBackToTop: false,
    }
  },
  methods: {
    updateBackToTop() {
      this.showBackToTop = window.pageYOffset > 300
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  },
  computed: {
    ...mapGetters({
    }),
  },
  watch: {
  }
}
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 28px;
  bottom: 96px;
  z-index: 1030;
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: #8b1f1b;
  color: #fff;
  box-shadow: 0 6px 18px rgba(46, 52, 64, 0.28);
  cursor: pointer;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.back-to-top:hover,
.back-to-top:focus {
  background: #6f1815;
  box-shadow: 0 8px 22px rgba(46, 52, 64, 0.34);
  outline: none;
  transform: translateY(-2px);
}

.back-to-top:focus-visible {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.95), 0 0 0 6px rgba(139, 31, 27, 0.45);
}

.back-to-top-fade-enter-active,
.back-to-top-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.back-to-top-fade-enter,
.back-to-top-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 575.98px) {
  .back-to-top {
    right: 16px;
    bottom: 84px;
    width: 44px;
    height: 44px;
  }
}
</style>
