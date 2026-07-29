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

                <div class="d-flex justify-content-center">
                    <div ref="googleButton"></div>
                </div>
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
import api from '@/service/api'
import { mockLogin } from '../../../mock/users'

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
    mounted() {
        this.renderGoogleButton()
    },
    methods: {
        loadGoogleIdentityScript() {
            if (window.google && window.google.accounts && window.google.accounts.id) {
                return Promise.resolve()
            }

            return new Promise((resolve, reject) => {
                const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
                if (existingScript) {
                    existingScript.addEventListener('load', resolve, { once: true })
                    existingScript.addEventListener('error', reject, { once: true })
                    return
                }

                const script = document.createElement('script')
                script.src = 'https://accounts.google.com/gsi/client'
                script.async = true
                script.defer = true
                script.onload = resolve
                script.onerror = () => reject(new Error('Could not load Google Sign-In'))
                document.head.appendChild(script)
            })
        },

        async renderGoogleButton() {
            try {
                const clientId = process.env.VUE_APP_GOOGLE_CLIENT_ID
                if (!clientId) {
                    throw new Error('Google client ID is not configured')
                }

                await this.loadGoogleIdentityScript()
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: this.handleGoogleCredential,
                })
                window.google.accounts.id.renderButton(this.$refs.googleButton, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 220,
                })
            } catch (error) {
                this.errorMessage = error.message || 'Google login failed'
                this.showAlert = true
            }
        },
        
        togglePasswordVisibility() {
            this.showPassword = !this.showPassword
        },

        
        async handleLogin() {
            this.isLoading = true
            this.errorMessage = ''
            this.showAlert = false

            try {
                const result = await mockLogin(this.email, this.password)

                // Store authentication data
                localStorage.setItem('token', result.data.token)
                localStorage.setItem('user', JSON.stringify(result.data.user))

                // Role-based redirection
                if (result.data.user.role === 'editor' || result.data.user.role === 'staff') {
                    this.$router.push('/dashboard/editor/dashboard')
                } else if (result.data.user.role === 'admin') {
                    this.$router.push('/dashboard/admin/dashboard')
                } else {
                    this.$router.push('/dashboard/user/dashboard')
                }

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

       
        async handleGoogleCredential(response) {
            this.isLoading = true
            this.errorMessage = ''
            this.showAlert = false
            try {
                const credential = response && response.credential

                if (!credential) {
                    throw new Error('Google did not return an ID token')
                }

                const result = await api.auth('google', { credential })

                // Store authentication data
                localStorage.setItem('user', JSON.stringify(result.data.user))

                // Redirect to the main app after the backend creates the session cookie
                this.$router.push('/forms')
            } catch (error) {
                // Show error notification
                this.errorMessage = error.response?.data?.message || error.message || 'Google login failed'
                this.showAlert = true
            } finally {
                this.isLoading = false
            }
        }
    }
}
</script>
