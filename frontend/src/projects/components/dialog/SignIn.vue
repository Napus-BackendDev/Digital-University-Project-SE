<template>
  <div>
    <CModal add-content-classes="bg-login" :show="true" :centered="true" :close-on-backdrop="true">
      <template #header-wrapper>
        <div class="mb-5"></div>
      </template>
      <template #body-wrapper>
        <CRow class="justify-content-center ">
          <CCol col="8">
            <CForm>
              <CRow>
                <CCol class="text-center">
                  <img src="@/assets/logo.svg" height="150px" />
                </CCol>
              </CRow>

              <CRow class=" mt-2">
                <CCol>
                  <p class="font-weight-bold">1 Contact</p>
                  <p>ส่วนการเจ้าหน้าที่ (Personnel Division) Tel 0-5391-6494 , 6053 E-mail: personnel@mfu.ac.th</p>


                  <p class="font-weight-bold">2. คู่มือสมรรถนะ (Competency Dictionary) </p>
                  <span>Thai Version "Click Here" <a class="font-weight-bold" target="_blank"
                      href="https://drive.google.com/file/d/1obIc3c5kEJ6nP1rBH5uA9nvw62fjzTid/view?usp=sharing ">"Click
                      Here"</a></span> <br>
                  <span> English Version "Click Here"<a class="font-weight-bold" target="_blank"
                      href="https://drive.google.com/file/d/1Ds3wv_QlPoA_M10i2snrzrh5Ri_Qi9wQ/view?usp=sharing ">"Click
                      Here"</a></span>

                  <p class="font-weight-bold mt-4">3. คู่มือการใช้งานระบบ (User Manual) </p>
                  <span>Thai Version "Click Here" <a class="font-weight-bold" target="_blank"
                      href="https://drive.google.com/file/d/1YJxsIbrhgp9tsfz-neHuEDC39mgUpWqg/view?usp=sharing">"Click
                      Here"</a></span> <br>
                  <span> English Version "Click Here" <a class="font-weight-bold" target="_blank"
                      href="https://drive.google.com/file/d/1dGYb9s9X1WVuPwEWW3xaScCUEsODxwkA/view?usp=sharing">"Click
                      Here"</a></span>


                  <p class="font-weight-bold mt-4">4.แจ้งปัญหาการเข้าใช้ระบบ Usage Issue Reporting Form <a
                      class="font-weight-bold" target="_blank"
                      href="https://docs.google.com/forms/d/e/1FAIpQLSec2LSaDE1flmQULhl7bsCbTOZl4nd1VGfSv3LDxP7bnuZ9iQ/viewform ">"Click
                      Here"</a></p>

                </CCol>
              </CRow>

              <CRow>
                <CCol>
                  <CDropdownDivider class="mt-2" />
                </CCol>
                <label class="text-dark font-weight-bold"> SIGN IN WITH SOCIAL </label>
                <CCol>
                  <CDropdownDivider class="mt-2" />
                </CCol>
              </CRow>
              <CRow>
                <CCol class="text-center">
                  <div style="cursor: pointer">
                    <img class="zoom" @click="onAuthenGoogle" src="@/assets/icons/logo-google.png" width="50px" />
                    <!-- Hidden container for standard Google button fallback -->
                    <div id="google-btn" class="mt-3 d-flex justify-content-center"></div>
                  </div>
                </CCol>
              </CRow>
            </CForm>
          </CCol>
        </CRow>
      </template>
      <template #footer-wrapper>
        <div class="mb-5"></div>
      </template>
    </CModal>
  </div>
</template>

<script>

import { mapGetters } from 'vuex'

export default {
  name: 'SignIn',
  data: function () {
    return {
      oAuth2: true,

      typePassword: "password",
      onOpenForgotPassword: true,
      username: "",
      password: "",
      email: ""
    }
  },
  mounted() {
    this.initGoogleGIS();
  },

  created() {
  },

  beforeDestroy() {

  },

  methods: {

    onViewPassword() {
      if (this.typePassword == "password") {
        this.typePassword = "text";
      } else {
        this.typePassword = "password";
      }
    },

    onOpenForgotPasswords() {

      this.onOpenForgotPassword = !this.onOpenForgotPassword;
    },

    onForgotPassword() {

    },
    onOpenSignIn() {
      var body = {}
      body.username = this.username;
      body.password = this.password;
      this.$store.dispatch("auth/onLogin", body);
    },

    initGoogleGIS() {
      if (typeof google !== 'undefined') {
        const clientId = process.env.VUE_APP_CLIENTID;
        console.log("Initializing GIS with Client ID:", clientId);
        
        google.accounts.id.initialize({
          client_id: clientId,
          callback: this.handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true
        });

        // Render the standard button as a fallback/alternative
        google.accounts.id.renderButton(
          document.getElementById("google-btn"),
          { theme: "outline", size: "large", text: "signin_with", shape: "pill" }
        );
      } else {
        // Retry if script not loaded yet
        setTimeout(this.initGoogleGIS, 500);
      }
    },

    handleCredentialResponse(response) {
      if (response.credential) {
        console.log("Google Auth Success");
        const body = {
          token: response.credential
        };
        this.$store.dispatch("auth/singin", body);
      } else {
        console.error("No credential returned from Google");
      }
    },

    async onAuthenGoogle() {
      try {
        console.log("onAuthenGoogle (GIS)");
        // Prompt the user to select a Google account
        // Note: For a custom button like this, google.accounts.id.prompt() 
        // will show the One Tap / Selection prompt.
        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log("Prompt not displayed or skipped:", notification.getNotDisplayedReason() || notification.getSkippedReason());
            // Fallback: If prompt is blocked, we might need the standard button
            // but for now we'll log it.
          }
        });
      } catch (err) {
        console.error('Google sign-in error:', err);
        this.$toast?.error('Google Sign-In failed. Please try again.');
      }
    },

    onOpenSignUp() {
      this.$store.commit("auth/isSignIn", false);
    },

    handleOnComplete(value) {
      console.log('OTP completed: ', value);
    },
    handleOnChange(value) {
      console.log('OTP changed: ', value);
    },
    handleClearInput() {
      this.$refs.otpInput.clearInput();
    },

  },

  computed: {
    ...mapGetters({
      isAuthe: 'auth/isSignIn'
    })
  },

  watch: {


    // isAuthe: function (value) {
    //   this.onOpenForgotPassword =true;
    //   this.$store.commit("auth/isSignIn", value)
    // },
  }
}
</script>

<style></style>
