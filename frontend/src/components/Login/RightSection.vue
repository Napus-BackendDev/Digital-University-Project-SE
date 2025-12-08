<template>
  <div class="right-section">
    <div class="login-form-wrapper">
      <h2 class="welcome-title">Welcome back</h2>
      <p class="welcome-subtitle">Sign in to your account to continue</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email address</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="you@example.com"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <div class="password-label-row">
            <label for="password">Password</label>
            <a href="#" class="forgot-password" @click.prevent="handleForgotPassword">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="Enter your password"
            required
            class="form-input"
          />
        </div>

        <button type="submit" class="sign-in-button" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>

        <div class="divider">
          <span>Or continue with</span>
        </div>

        <button type="button" class="google-button" @click="handleGoogleLogin">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          Google
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  try {
    // TODO: Implement actual login logic
    console.log('Login attempt:', { email: email.value, password: password.value })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Navigate to home or dashboard after successful login
    // router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = () => {
  // TODO: Implement forgot password logic
  console.log('Forgot password clicked')
}

const handleGoogleLogin = () => {
  // TODO: Implement Google OAuth login
  console.log('Google login clicked')
}
</script>

<style scoped>
.right-section {
  flex: 1;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 440px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.welcome-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0 0 40px 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.password-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
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

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #c41e3a;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.sign-in-button {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background-color: #1a1a1a;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: inherit;
}

.sign-in-button:hover:not(:disabled) {
  background-color: #000000;
}

.sign-in-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  width: 42%;
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

.google-button {
  width: 100%;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.google-button:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .right-section {
    padding: 40px;
  }
}

@media (max-width: 768px) {
  .right-section {
    padding: 30px;
  }
  
  .welcome-title {
    font-size: 28px;
  }
}
</style>
