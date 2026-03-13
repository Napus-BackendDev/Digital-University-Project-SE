<template>
  <div class="c-app">
    <CWrapper>
      <TheHeader v-if="!isPublicForm" />
      <main class="c-main">
        <CContainer class="d-flex justify-content-center w-75" fluid>
          <transition name="fade">
            <router-view></router-view>
          </transition>
        </CContainer>
      </main>
      <TheFooter v-if="!isPublicForm" />

    </CWrapper>
    <CenterLoading />
    <!--    <DialogMessage/>-->
    <SignIn />
    <TwoFA />

  </div>
</template>

<script>
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
    TheHeader,
  },

  mounted() {

    // this.notifyUser();
    this.showNotification();




    //     const socket = io("127.0.0.1:8082",{
    //       transports: ["websocket", "polling"],
    //       withCredentials: true,
    //       extraHeaders: {
    //         "my-custom-header": "abcd"
    //       }
    //     });
    //     socket.on("connect", () => {
    //       socket.emit('campus',{"sos":1122});
    //
    //       socket.on("campus", (reason) => {
    //       })
    //
    //
    //     });
    //
    //
    //
    // // กรณีการเชื่อมต่อถูกตัดขาด
    //     socket.on("disconnect", (reason) => {
    //     });
    // // กรณีการเชื่อมต่อเกิดความผิดพลาด
    //     socket.on("connect_error", (error) => {
    //       console.error("[connect error]: ", error);
    //     });


    // localStorage.setItem('test','123444')

    // socket.on("connect", () => {
    // });
    //
    // socket.on("disconnect", () => {
    // });
  },

  methods: {
    notifyUser() {
      // Check if the browser supports notifications
      if (!('Notification' in window)) {
        alert('This browser does not support desktop notifications');
        return;
      }

      // Check whether notification permissions have already been granted
      if (Notification.permission === 'granted') {
        // If it's okay let's create a notification
        this.showNotification();
      } else if (Notification.permission !== 'denied') {
        // Otherwise, we need to ask the user for permission
        Notification.requestPermission().then(permission => {
          // If the user accepts, let's create a notification
          if (permission === 'granted') {
            this.showNotification();
          }
        });
      }
    },
    showNotification() {
      const title = 'Hello from Vue.js!';
      const options = {
        body: 'This is a simple notification example.',
        icon: 'https://via.placeholder.com/100', // Optional: Path to icon image
        vibrate: [200, 100, 200], // Optional: Vibration pattern
      };

      new Notification(title, options);
    }
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
