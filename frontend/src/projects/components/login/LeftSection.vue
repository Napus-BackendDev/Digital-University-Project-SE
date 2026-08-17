<template>
    <!-- Main container with white background and full height -->
    <CContainer fluid class="bg-white min-vh-100 d-flex align-items-center p-3 position-relative">
        <!-- Error alert positioned at top right corner -->
        <CAlert v-if="errorMessage && showAlert" color="danger" closeButton :show.sync="showAlert"
            class="position-absolute shadow-lg"
            style="top: 20px; right: 20px; z-index: 1060; min-width: 300px; max-width: 400px;">
            <strong>Login Failed!</strong><br>
            {{ errorMessage }}
        </CAlert>

        <!-- Login form container with centered layout -->
        <CCardBody class="p-2 p-md-3" style="max-width: 400px; margin: 0 auto;">
            <!-- Welcome header section -->
            <div class="text-center mb-4">
                <h2 class="h3 font-weight-bold mb-2" style="color: #171717;">Welcome back</h2>
                <p class="mb-0" style="color: #171717;">Sign in to your account to continue</p>
            </div>

            <!-- Login form with submit prevention -->
            <CForm @submit.prevent="handleLogin">
                <!-- Email input field section -->
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="font-weight-medium" style="color: #171717;">Email address</span>
                    </div>
                    <!-- Email input with MFU domain placeholder -->
                    <CInput type="email" id="email" v-model="email" placeholder="you@lamduan.mfu.ac.th" size="lg"
                        required />
                </div>

                <!-- Password input field section -->
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="font-weight-medium" style="color: #171717;">Password</span>
                        <!-- Forgot password link -->
                        <CLink href="#" @click.prevent="handleForgotPassword"
                            class="text-decoration-none small font-weight-medium text-danger">
                            Forgot password?
                        </CLink>
                    </div>
                    <!-- Password input with toggle visibility feature -->
                    <div class="position-relative">
                        <CInput :type="showPassword ? 'text' : 'password'" id="password" v-model="password"
                            placeholder="Enter your password" size="lg" required />
                        <!-- Password visibility toggle button -->
                        <CButton type="button" variant="ghost" @click="togglePasswordVisibility"
                            class="position-absolute p-1"
                            style="right: 12px; top: 50%; transform: translateY(-50%); border: none; background: transparent; z-index: 10;">
                            <CIcon :name="showPassword ? 'cilLockUnlocked' : 'cilLockLocked'" style="color: #6c757d;" />
                        </CButton>
                    </div>
                </div>

                <!-- Sign in submit button with loading state -->
                <CButton type="submit" size="lg" class="font-weight-semibold py-2 w-100 mx-auto d-block"
                    :disabled="isLoading" style="background-color: #171717; 
                border-color: #171717; 
                color: white;">
                    <!-- Loading spinner when submitting -->
                    <CSpinner v-if="isLoading" size="sm" class="mr-2" component="span" />
                    {{ isLoading ? 'Signing in...' : 'Sign in' }}
                </CButton>

                <!-- Divider section with 'Or continue with' text -->
                <div class="d-flex align-items-center my-4">
                    <div class="flex-grow-1">
                        <hr class="border-secondary m-0">
                    </div>
                    <span class="px-3" style="color: #6c757d; font-size: 0.875rem; font-weight: 500;">
                        Or continue with
                    </span>
                    <div class="flex-grow-1">
                        <hr class="border-secondary m-0">
                    </div>
                </div>

                <!-- Google login button -->
                <CButton type="button" size="lg" variant="outline"
                    class="d-flex align-items-center justify-content-center py-2 w-50 mx-auto"
                    @click="handleGoogleLogin" :disabled="isLoading"
                    style="background-color: #E5E5E5; border-color: #E5E5E5; color: #171717;">
                    <!-- Google logo icon -->
                    <img src="/google-icon-logo-svgrepo-com.svg" alt="Google Logo" width="18" height="18"
                        class="mr-2" />
                    <span>Google</span>
                </CButton>
            </CForm>
        </CCardBody>
    </CContainer>
</template>

<script>

import {
    CContainer,  
    CCardBody,   
    CForm,       
    CInput,      
    CButton,     
    CLink,       
    CIcon,       
    CSpinner,    
    CAlert       
} from '@coreui/vue'


import { cilLockUnlocked, cilLockLocked } from '@coreui/icons'
import { mockLogin, mockGoogleLogin } from '../../../mock/users'

export default {
    name: 'LeftSection',
    components: {
        CContainer,
        CCardBody,
        CForm,
        CInput,
        CButton,
        CLink,
        CIcon,
        CSpinner,
        CAlert
    },
    data() {
        return {
            email: '',                    
            password: '',                 
            isLoading: false,             
            errorMessage: '',             
            showAlert: false,             
            showPassword: false,          
            cilLockUnlocked,            
            cilLockLocked                
        }
    },
    methods: {
        
        togglePasswordVisibility() {
            this.showPassword = !this.showPassword
        },

        
        async handleLogin() {
            this.isLoading = true
            this.errorMessage = ''
            this.showAlert = false

            try {
                const result = await this.$store.dispatch('User/login', { email: this.email, password: this.password })
                if (!result) throw new Error(this.$t('auth.invalidCredentials'))
                this.$router.push('/forms')

            } catch (error) {
                // Show error notification
                this.errorMessage = error.message
                this.showAlert = true
            } finally {
                this.isLoading = false
            }
        },

        
        handleForgotPassword() {
           
            console.log('Forgot password clicked')
        },

       
        async handleGoogleLogin() {
            this.isLoading = true
            this.errorMessage = ''
            this.showAlert = false
            try {
                const result = await mockGoogleLogin()

                // Store authentication data
                localStorage.setItem('token', result.data.token)
                localStorage.setItem('user', JSON.stringify(result.data.user))

                // Redirect to user dashboard
                this.$router.push('/dashboard/user/dashboard')
            } catch (error) {
                // Show error notification
                this.errorMessage = error.message || 'Google login failed'
                this.showAlert = true
            } finally {
                this.isLoading = false
            }
        }
    }
}
</script>
