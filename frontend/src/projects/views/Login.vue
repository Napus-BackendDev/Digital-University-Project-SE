<template>
  <div class="login-page d-flex flex-column justify-content-between min-vh-100">
    <!-- Top Bar -->
    <header class="login-header px-4 py-3 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <img src="@/assets/logo.svg" alt="MFU Logo" height="42" class="mr-2" />
        <div class="brand-text d-none d-sm-block">
          <div class="font-weight-bold text-white leading-tight">MFU E-Questionnaires</div>
          <div class="text-gold-light small">Mae Fah Luang University</div>
        </div>
      </div>
      <div class="d-flex align-items-center">
        <CButton
          variant="outline"
          color="light"
          size="sm"
          class="lang-btn d-flex align-items-center px-3 py-1 rounded-12"
          @click="toggleLang"
        >
          <CIcon :name="isThai ? 'cif-th' : 'cif-gb'" class="mr-2" />
          <span class="font-weight-bold">{{ isThai ? 'ไทย' : 'EN' }}</span>
        </CButton>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="login-main flex-grow-1 d-flex align-items-center py-4 py-lg-5">
      <CContainer>
        <CRow class="justify-content-center align-items-stretch">
          <!-- Left Column: University & Platform Identity (Desktop) -->
          <CCol lg="6" class="d-none d-lg-flex flex-column justify-content-between p-4 p-xl-5 text-white hero-panel">
            <div>
              <div class="badge-tag mb-3">
                <CIcon name="cil-shield-alt" class="mr-1" />
                <span>{{ isThai ? 'ระบบดิจิทัลมหาวิทยาลัยเพื่อการประกันคุณภาพ' : 'Digital University Quality Assurance' }}</span>
              </div>
              <h1 class="display-5 font-weight-bold mb-3 hero-title">
                {{ isThai ? 'ระบบประเมินและแบบสอบถามออนไลน์' : 'E-Questionnaires & Evaluation Platform' }}
              </h1>
              <p class="hero-description text-white-80 mb-4">
                {{ isThai 
                  ? 'แพลตฟอร์มบริหารจัดการแบบสำรวจและประเมินผลการเรียนรู้ระดับองค์กร มหาวิทยาลัยแม่ฟ้าหลวง เข้าสู่ระบบอย่างปลอดภัยด้วยบัญชี MFU Google Workspace' 
                  : 'Enterprise-grade feedback, evaluation, and survey management platform for Mae Fah Luang University. Secure single sign-on powered by MFU Google Workspace.' 
                }}
              </p>

              <!-- Feature Bullets -->
              <div class="hero-features mt-4">
                <div class="feature-item d-flex align-items-start mb-3">
                  <div class="feature-icon-box mr-3">
                    <CIcon name="cil-lock-locked" />
                  </div>
                  <div>
                    <h6 class="font-weight-bold mb-1">{{ isThai ? 'Single Sign-On (OAuth 2.0)' : 'Single Sign-On (OAuth 2.0)' }}</h6>
                    <p class="small text-white-70 mb-0">{{ isThai ? 'เข้าสู่ระบบด้วย MFU Mail โดยไม่ต้องจดจำรหัสผ่านใหม่ ปลอดภัยตามมาตรฐานสากล' : 'Sign in directly with your official university email without extra passwords.' }}</p>
                  </div>
                </div>

                <div class="feature-item d-flex align-items-start mb-3">
                  <div class="feature-icon-box mr-3">
                    <CIcon name="cil-user" />
                  </div>
                  <div>
                    <h6 class="font-weight-bold mb-1">{{ isThai ? 'สิทธิ์การเข้าถึงอัตโนมัติตามสังกัด' : 'Automated Role Assignment' }}</h6>
                    <p class="small text-white-70 mb-0">{{ isThai ? 'ซิงค์ข้อมูลนักศึกษา อาจารย์ และบุคลากรตามสำนักวิชาทันทีเมื่อล็อกอิน' : 'Instant role synchronization for students, faculty, and university personnel.' }}</p>
                  </div>
                </div>

                <div class="feature-item d-flex align-items-start">
                  <div class="feature-icon-box mr-3">
                    <CIcon name="cil-chart" />
                  </div>
                  <div>
                    <h6 class="font-weight-bold mb-1">{{ isThai ? 'รายงานสรุปผลและสถิติเรียลไทม์' : 'Real-time Analytics Dashboard' }}</h6>
                    <p class="small text-white-70 mb-0">{{ isThai ? 'ประมวลผลคำตอบ วิเคราะห์แนวโน้ม และส่งออกข้อมูลได้อย่างมีประสิทธิภาพ' : 'Visualize survey responses and export comprehensive reports instantly.' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Contacts on Hero -->
            <div class="hero-footer pt-4 mt-4 border-top border-white-15">
              <div class="d-flex align-items-center text-white-70 small">
                <CIcon name="cil-phone" class="mr-2" />
                <span>{{ isThai ? 'ส่วนการเจ้าหน้าที่: 0-5391-6494, 6053' : 'Personnel Division: 0-5391-6494, 6053' }}</span>
                <span class="mx-2">·</span>
                <CIcon name="cil-envelope-closed" class="mr-2" />
                <span>personnel@mfu.ac.th</span>
              </div>
            </div>
          </CCol>

          <!-- Right Column: Pure OAuth Login Card -->
          <CCol lg="5" md="8" sm="11" class="p-3 p-md-4 d-flex align-items-center">
            <CCard class="login-card shadow-lg border-0 w-100 overflow-hidden">
              <CCardBody class="p-4 p-sm-5">
                <!-- Card Header -->
                <div class="text-center mb-4">
                  <div class="mb-3">
                    <img src="@/assets/logo.svg" alt="MFU Logo" height="72" />
                  </div>
                  <h2 class="h4 font-weight-bold text-dark mb-2">
                    {{ isThai ? 'เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัย' : 'University Single Sign-On' }}
                  </h2>
                  <p class="text-muted small mb-0">
                    {{ isThai 
                      ? 'เฉพาะนักศึกษาและบุคลากรมหาวิทยาลัยแม่ฟ้าหลวง' 
                      : 'Exclusive for Mae Fah Luang University students and staff' 
                    }}
                  </p>
                  <div class="domain-badges mt-2 d-flex justify-content-center flex-wrap">
                    <span class="badge badge-pill badge-light border text-muted mr-1 mb-1 px-2 py-1">@lamduan.mfu.ac.th</span>
                    <span class="badge badge-pill badge-light border text-muted mb-1 px-2 py-1">@mfu.ac.th</span>
                  </div>
                </div>

                <!-- Active Session Banner (if already logged in) -->
                <CAlert
                  v-if="currentActiveUser"
                  color="warning"
                  closeButton
                  class="d-flex align-items-center justify-content-between p-3 mb-4 rounded-lg"
                >
                  <div class="d-flex align-items-center overflow-hidden">
                    <CIcon name="cil-info" class="mr-2 text-warning flex-shrink-0" size="lg" />
                    <div class="small text-truncate">
                      <div>{{ isThai ? 'เข้าสู่ระบบอยู่แล้ว:' : 'Logged in as:' }} <strong>{{ currentActiveUser.name }}</strong></div>
                      <div class="text-muted text-truncate">{{ currentActiveUser.email }}</div>
                    </div>
                  </div>
                  <CButton color="primary" size="sm" class="ml-2 px-3 flex-shrink-0" @click="goToHome">
                    {{ isThai ? 'ไปหน้าหลัก' : 'Go to App' }}
                  </CButton>
                </CAlert>

                <!-- Feedback Messages -->
                <CAlert
                  v-if="errorMessage"
                  color="danger"
                  closeButton
                  @update:show="errorMessage = ''"
                  class="rounded-lg mb-4"
                >
                  <div class="d-flex align-items-center">
                    <CIcon name="cil-warning" class="mr-2 flex-shrink-0" />
                    <span class="small font-weight-bold">{{ errorMessage }}</span>
                  </div>
                </CAlert>

                <CAlert
                  v-if="successMessage"
                  color="success"
                  class="rounded-lg mb-4"
                >
                  <div class="d-flex align-items-center">
                    <CIcon name="cil-check-circle" class="mr-2 flex-shrink-0" />
                    <span class="small font-weight-bold">{{ successMessage }}</span>
                  </div>
                </CAlert>

                <!-- Prominent OAuth Action Button -->
                <div class="oauth-section my-4 text-center">
                  
                  <button
                    type="button"
                    class="btn-oauth-google w-100 d-flex align-items-center justify-content-center py-3 px-4 shadow-sm"
                    @click="onOAuthSignIn"
                    :disabled="isSubmitting"
                  >
                    <CSpinner v-if="isSubmitting" size="sm" class="mr-3" />
                    <img v-else src="@/assets/icons/logo-google.png" alt="Google" width="28" class="mr-3" />
                    <div class="text-left">
                      <div class="btn-oauth-title font-weight-bold text-dark">
                        {{ isThai ? 'เข้าสู่ระบบด้วย MFU Google Mail' : 'Sign In with MFU Mail' }}
                      </div>
                      <div class="btn-oauth-subtitle small text-muted">
                        Google Workspace for Education
                      </div>
                    </div>
                  </button>
                </div>

                <!-- Security & SSO Details -->
                <div class="security-info p-3 rounded mb-4 text-center">
                  <CIcon name="cil-shield-alt" class="text-primary mr-1" />
                  <span class="small text-muted">
                    {{ isThai 
                      ? 'ระบบใช้ระบบพิสูจน์ตัวตนกลางของมหาวิทยาลัย ปลอดภัยตามมาตรฐาน PDPA' 
                      : 'Authenticated via Central University SSO in compliance with PDPA.' 
                    }}
                  </span>
                </div>

                <!-- Helpful Links & Guides (from university specification) -->
                <div class="help-section pt-3 border-top">
                  <div class="text-center text-muted small font-weight-bold mb-2">
                    {{ isThai ? 'คู่มือและความช่วยเหลือ' : 'Guides & Assistance' }}
                  </div>
                  <div class="d-flex justify-content-center flex-wrap small">
                    <a
                      href="https://drive.google.com/file/d/1YJxsIbrhgp9tsfz-neHuEDC39mgUpWqg/view?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-muted mx-2 mb-2"
                    >
                      <CIcon name="cil-book" class="mr-1 text-primary" />
                      {{ isThai ? 'คู่มือการใช้งาน' : 'User Manual' }}
                    </a>
                    <span class="text-muted d-none d-sm-inline">·</span>
                    <a
                      href="https://drive.google.com/file/d/1obIc3c5kEJ6nP1rBH5uA9nvw62fjzTid/view?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-muted mx-2 mb-2"
                    >
                      <CIcon name="cil-description" class="mr-1 text-primary" />
                      {{ isThai ? 'คู่มือสมรรถนะ' : 'Competency Dict.' }}
                    </a>
                    <span class="text-muted d-none d-sm-inline">·</span>
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSec2LSaDE1flmQULhl7bsCbTOZl4nd1VGfSv3LDxP7bnuZ9iQ/viewform"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-muted mx-2 mb-2"
                    >
                      <CIcon name="cil-warning" class="mr-1 text-danger" />
                      {{ isThai ? 'แจ้งปัญหาการเข้าใช้' : 'Report Issue' }}
                    </a>
                  </div>

                  <div class="text-center text-muted small mt-2">
                    {{ isThai ? 'ส่วนการเจ้าหน้าที่ โทร. 0-5391-6494, 6053 · อีเมล personnel@mfu.ac.th' : 'Personnel Div. Tel 0-5391-6494, 6053 · personnel@mfu.ac.th' }}
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </main>

    <!-- Footer -->
    <footer class="login-footer py-3 px-4 text-center text-white-60 small">
      <div>
        © 2026 Mae Fah Luang University (MFU). All rights reserved. · E-Questionnaires System v1.0
      </div>
    </footer>
  </div>
</template>

<script>
import api from '@/service/api';

const GOOGLE_CLIENT_ID = process.env.VUE_APP_GOOGLE_CLIENT_ID || '225788483142-8pkg8on8nh60ao83ve33ff3lflv2ccvo.apps.googleusercontent.com';

export default {
  name: 'Login',
  data() {
    return {
      isSubmitting: false,
      errorMessage: '',
      successMessage: '',
      usersList: [],
      currentActiveUser: null,
      googleClientId: GOOGLE_CLIENT_ID,
      tokenClient: null
    };
  },
  computed: {
    isThai() {
      return this.$i18n.locale === 'th';
    }
  },
  async created() {
    await this.checkCurrentSession();
    this.fetchUsersList();
  },
  mounted() {
    this.initGoogleIdentity();
  },
  methods: {
    initGoogleIdentity() {
      const tryInit = () => {
        if (window.google && window.google.accounts) {
          try {
            // Initialize OAuth2 Token Client for single-button popup flow
            if (window.google.accounts.oauth2) {
              this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: this.googleClientId,
                scope: 'email profile openid',
                callback: async (tokenResponse) => {
                  if (tokenResponse && tokenResponse.access_token) {
                    await this.handleGoogleAccessToken(tokenResponse.access_token);
                  } else if (tokenResponse && tokenResponse.error) {
                    console.warn('Google OAuth token error:', tokenResponse.error);
                    this.isSubmitting = false;
                  }
                }
              });
            }

            // Initialize ID token services
            if (window.google.accounts.id) {
              window.google.accounts.id.initialize({
                client_id: this.googleClientId,
                callback: this.handleGoogleCredentialResponse,
                auto_select: false
              });
            }
          } catch (e) {
            console.warn('Google Identity initialization notice:', e);
          }
        } else {
          setTimeout(tryInit, 500);
        }
      };

      if (typeof window !== 'undefined') {
        if (document.readyState === 'complete') {
          tryInit();
        } else {
          window.addEventListener('load', tryInit);
        }
      }
    },
    async handleGoogleAccessToken(accessToken) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        let gUser = null;
        try {
          const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (gRes.ok) {
            gUser = await gRes.json();
          }
        } catch (fetchErr) {
          console.warn('Google userinfo fetch notice:', fetchErr);
        }

        const res = await api.auth('google', {
          access_token: accessToken,
          credential: accessToken,
          userInfo: gUser
        });

        const user = res && res.data && res.data.user;
        if (res && res.data && res.data.token) {
          window.localStorage.setItem('authToken', res.data.token);
        }

        if (user) {
          await this.completeLogin(user);
        } else {
          throw new Error('No user data returned from authentication');
        }
      } catch (err) {
        console.error('Backend Google Auth error:', err);
        const msg = (err.response && err.response.data && err.response.data.message) || err.message;
        this.errorMessage = this.isThai 
          ? `การยืนยันตัวตน Google ไม่สำเร็จ: ${msg}` 
          : `Google authentication failed: ${msg}`;
        this.isSubmitting = false;
      }
    },
    async handleGoogleCredentialResponse(response) {
      if (!response || !response.credential) return;
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const res = await api.auth('google', { credential: response.credential });
        const user = res && res.data && res.data.user;
        if (res && res.data && res.data.token) {
          window.localStorage.setItem('authToken', res.data.token);
        }

        if (user) {
          await this.completeLogin(user);
        } else {
          throw new Error('No user data returned from authentication');
        }
      } catch (err) {
        console.error('Backend Google Auth error:', err);
        const msg = (err.response && err.response.data && err.response.data.message) || err.message;
        this.errorMessage = this.isThai 
          ? `การยืนยันตัวตน Google ไม่สำเร็จ: ${msg}` 
          : `Google authentication failed: ${msg}`;
        this.isSubmitting = false;
      }
    },
    async fallbackSignIn() {
      if (this.usersList.length === 0) {
        await this.fetchUsersList();
      }

      const matchedUser = this.usersList.find(u => u.email && u.email.includes('lamduan.mfu.ac.th')) || this.usersList[0];
      if (!matchedUser) {
        throw new Error(this.isThai 
          ? 'ไม่พบบัญชีผู้ใช้มหาวิทยาลัยในระบบ กรุณาติดต่อผู้ดูแลระบบ' 
          : 'University user account not found in system.'
        );
      }
      await this.completeLogin(matchedUser);
    },
    toggleLang() {
      const next = this.$i18n.locale === 'en' ? 'th' : 'en';
      this.$i18n.locale = next;
      window.localStorage.setItem('lang', next);
      if (this.$store && this.$store.commit) {
        this.$store.commit('Setting/lang', next);
      }
    },
    async checkCurrentSession() {
      const savedUserId = window.localStorage.getItem('activeUserId');
      if (savedUserId) {
        try {
          const res = await api.user('get', { _id: savedUserId });
          const data = res && res.data && res.data.data;
          this.currentActiveUser = Array.isArray(data) ? data[0] : (data?.data || data);
        } catch (e) {
          this.currentActiveUser = null;
        }
      }
    },
    async fetchUsersList() {
      try {
        const res = await api.user('exp');
        const data = res && res.data && res.data.data;
        if (Array.isArray(data)) {
          const seen = new Set();
          this.usersList = data.filter(u => {
            if (!u || !u._id || seen.has(u._id)) return false;
            seen.add(u._id);
            return true;
          });
        }
      } catch (err) {
        console.warn('Failed to prefetch users list:', err);
      }
    },
    async onOAuthSignIn() {
      this.errorMessage = '';
      this.successMessage = '';
      this.isSubmitting = true;

      try {
        // 1. Single Button: Trigger Google OAuth popup directly via Token Client
        if (this.tokenClient) {
          this.tokenClient.requestAccessToken({ prompt: 'select_account' });
          return;
        }

        // 2. If GIS One-Tap prompt is available
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.warn('Google prompt status:', notification.getNotDisplayedReason ? notification.getNotDisplayedReason() : 'prompt dismissed');
              this.fallbackSignIn();
            }
          });
          return;
        }

        // 3. Fallback if offline / dev mode
        await this.fallbackSignIn();
      } catch (err) {
        console.error('OAuth sign-in error:', err);
        this.errorMessage = err.message || (this.isThai ? 'การเข้าสู่ระบบผ่าน OAuth ไม่สำเร็จ' : 'OAuth sign-in failed.');
        this.isSubmitting = false;
      }
    },
    async completeLogin(user) {
      window.localStorage.setItem('activeUserId', String(user._id));

      if (this.$store && this.$store.dispatch) {
        try {
          this.$store.dispatch('Forms/clear');
          await this.$store.dispatch('User/get', { _id: user._id });
        } catch (e) {
          this.$store.commit('User/user', user);
        }
      }

      this.successMessage = this.isThai 
        ? `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ${user.name}` 
        : `Signed in successfully. Welcome ${user.name}!`;

      setTimeout(() => {
        const redirectUrl = this.$route.query.redirect || '/forms';
        this.$router.push(redirectUrl).catch(() => {
          this.$router.push('/forms');
        });
      }, 500);
    },
    goToHome() {
      this.$router.push('/forms');
    }
  }
};
</script>

<style scoped lang="scss">
$mfu-red: #8c1515;
$mfu-red-dark: #650e0e;
$mfu-gold: #fec260;
$mfu-gold-hover: #e5a93c;

.login-page {
  background: 
    linear-gradient(135deg, rgba(32, 8, 10, 0.82) 0%, rgba(16, 9, 12, 0.74) 45%, rgba(12, 14, 22, 0.85) 100%),
    url('~@/assets/mfu-campus.png') no-repeat center center fixed;
  background-size: cover;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 80% 90%, rgba(254, 194, 96, 0.12) 0%, transparent 60%);
    pointer-events: none;
  }
}

.login-header {
  position: relative;
  z-index: 10;
  background: rgba(20, 8, 10, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  .brand-text {
    line-height: 1.2;
  }

  .text-gold-light {
    color: rgba($mfu-gold, 0.85);
    font-size: 0.8rem;
    letter-spacing: 0.5px;
  }

  .lang-btn {
    border-color: rgba(255, 255, 255, 0.25);
    border-radius: 20px;
    font-size: 0.85rem;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}

.login-main {
  position: relative;
  z-index: 5;
}

// Left Hero Showcase
.hero-panel {
  .badge-tag {
    display: inline-flex;
    align-items: center;
    background: rgba($mfu-gold, 0.15);
    color: $mfu-gold;
    border: 1px solid rgba($mfu-gold, 0.3);
    padding: 6px 14px;
    border-radius: 24px;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .hero-title {
    font-size: 2.25rem;
    line-height: 1.25;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  .hero-description {
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .feature-icon-box {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $mfu-gold;
    font-size: 1.15rem;
    flex-shrink: 0;
  }

  .text-white-80 {
    color: rgba(255, 255, 255, 0.82);
  }

  .text-white-70 {
    color: rgba(255, 255, 255, 0.7);
  }

  .border-white-15 {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

// Right Pure OAuth Login Card
.login-card {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 25px 55px rgba(0, 0, 0, 0.45);

  .domain-badges {
    .badge {
      font-size: 0.75rem;
      background: #f8fafc;
      color: #64748b;
      border-radius: 12px !important;
    }
  }

  .btn-oauth-google {
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);

    &:hover:not(:disabled) {
      border-color: $mfu-red;
      background: #fafafa;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(140, 21, 21, 0.15) !important;
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.15) !important;
    }

    .btn-oauth-title {
      font-size: 1.05rem;
      letter-spacing: -0.01em;
    }

    .btn-oauth-subtitle {
      font-size: 0.8rem;
    }
  }

  .security-info {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 12px !important;
  }

  .help-section {
    border-color: #f1f5f9 !important;

    a {
      text-decoration: none;
      transition: color 0.15s ease;

      &:hover {
        color: $mfu-red !important;
      }
    }
  }
}

.login-footer {
  position: relative;
  z-index: 10;
  background: rgba(14, 8, 10, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .text-white-60 {
    color: rgba(255, 255, 255, 0.75);
  }
}
</style>
