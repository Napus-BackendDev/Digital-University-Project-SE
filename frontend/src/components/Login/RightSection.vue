<template>
  <div class="right-section">
    <div class="login-form-wrapper">
      <h2 class="welcome-title">Welcome back</h2>
      <p class="welcome-subtitle">Sign in to your account to continue</p>

      <CForm @submit.prevent="handleLogin" class="login-form">
        <CFormInput
          type="email"
          id="email"
          v-model="email"
          label="Email address"
          placeholder="you@lamduan.mfu.ac.th"
          required
        />

        <div class="password-wrapper">
          <div class="password-label-row">
            <label class="form-label">Password</label>
            <a href="#" class="forgot-password" @click.prevent="handleForgotPassword">
              Forgot password?
            </a>
          </div>
          <div class="password-input-wrapper">
            <CFormInput
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              placeholder="Enter your password"
              required
              class="password-input"
            />
            <button 
              type="button" 
              class="password-toggle-btn" 
              @click="togglePasswordVisibility"
              tabindex="-1"
            >
              <EyeIcon v-if="showPassword" />
              <EyeOffIcon v-else />
            </button>
          </div>
        </div>

        <CButton type="submit" color="dark" class="sign-in-button" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </CButton>

        <div class="divider">
          <span>Or continue with</span>
        </div>

        <CButton type="button" color="light" class="google-button" @click="handleGoogleLogin">
          <img src="@/assets/photos/google-icon-logo-svgrepo-com.svg" 
          alt="Google Logo" 
          width="20" 
          height="20" 
          />
          Google
        </CButton>
      </CForm>
      <div>
        <Transition name="slide-fade">
        <CAlert 
          v-if="errorMessage" 
          color="danger" 
          @close="errorMessage = ''"
          class="toast-alert"
        >
          {{ errorMessage }}
        </CAlert>
      </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CForm, CFormInput, CButton, CAlert } from '@coreui/vue'
import { mockLogin, mockGoogleLogin } from '@/mock/users'
import { EyeIcon, EyeOffIcon } from '@/components/icons'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const result = await mockLogin(email.value, password.value)
    
    localStorage.setItem('token', result.data.token)
    localStorage.setItem('user', JSON.stringify(result.data.user))
    
    // Redirect based on role
    if (result.data.user.role === 'editor' || result.data.user.role === 'staff') {
      router.push('/editor')
    } else {
      router.push('/home')
    }
    
  } catch (error) {
    errorMessage.value = error.message
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = () => {
  
}

const handleGoogleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await mockGoogleLogin()
    localStorage.setItem('token', result.data.token)
    localStorage.setItem('user', JSON.stringify(result.data.user))
    router.push('/home')
  } catch (error) {
    errorMessage.value = error.message || 'Google login failed'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    isLoading.value = false
  }
}

</script>


<style scoped>
.right-section {
  flex: 1;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(20px, 5vw, 60px);
  min-height: 0;
  overflow-y: auto;
}

.login-form-wrapper {
  width: 100%;
  max-width: min(440px, 100%);
  padding: 0 8px;
}

.welcome-title {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 40px 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 3vw, 24px);
}

.password-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.password-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.password-label-row .form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.forgot-password {
  font-size: 14px;
  color: #c41e3a;
  text-decoration: none;
  font-weight: 500;
}

.forgot-password:hover {
  text-decoration: underline;
}

/* Style CoreUI form inputs */
:deep(.form-label) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

:deep(.form-control) {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  transition: all 0.2s;
  font-family: inherit;
}

:deep(.form-control:focus) {
  outline: none;
  border-color: #c41e3a;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
}

:deep(.form-control::placeholder) {
  color: #9ca3af;
}

:deep(.sign-in-button) {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  font-family: inherit;
}

:deep(.sign-in-button.btn-dark) {
  color: white !important;
  background-color: #1a1a1a;
  border-color: #1a1a1a;
}

:deep(.sign-in-button.btn-dark:hover:not(:disabled)) {
  color: white !important;
  background-color: #000000;
  border-color: #000000;
}

.divider {
  position: relative;
  text-align: center;
  margin: 8px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background-color: #e5e7eb;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  font-size: 14px;
  color: #6b7280;
  background-color: white;
  padding: 0 16px;
  position: relative;
}

:deep(.google-button) {
  width: 50%;
  margin: 0 auto;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 6px;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

:deep(.google-button.btn-light) {
  color: var(--text-primary);
  background-color: white;
  border: 1px solid #d1d5db;
}

:deep(.google-button.btn-light:hover) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* Toast Alert ลอยขึ้นมา */
.toast-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 300px;
  max-width: 500px;
  background-color: #f8d7da !important;
  border-color: #f5c2c7 !important;
  color: #842029 !important;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Animation เมื่อปรากฏและหายไป */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(100px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100px);
  opacity: 0;
}

/* Password Input with Toggle */
.password-input-wrapper {
  position: relative;
  width: 100%;
}

.password-input-wrapper .password-input {
  padding-right: 45px;
}

.password-toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: color 0.2s;
}

.password-toggle-btn:hover {
  color: #212529;
}

.password-toggle-btn:focus {
  outline: none;
}

.password-toggle-btn :deep(.icon) {
  width: 20px;
  height: 20px;
  display: block;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .right-section {
    flex: 1 1 auto;
    min-height: 60vh;
  }
}

@media (max-width: 768px) {
  .right-section {
    padding: 24px;
    min-height: 70vh;
  }
  
  .welcome-subtitle {
    margin-bottom: 24px;
  }
}

@media (max-width: 480px) {
  .right-section {
    padding: 20px 16px;
  }
  
  .login-form-wrapper {
    padding: 0;
  }
  
  :deep(.google-button) {
    width: 100%;
  }
  
  .divider::before,
  .divider::after {
    width: 30%;
  }
}

@media (max-height: 600px) {
  .right-section {
    align-items: flex-start;
    padding-top: 20px;
  }
  
  .welcome-subtitle {
    margin-bottom: 20px;
  }
  
  .login-form {
    gap: 12px;
  }
}
</style>
