<template>
    <CContainer fluid class="bg-white min-vh-100 d-flex align-items-center p-3">
        <CCardBody class="p-2 p-md-3" style="max-width: 400px; margin: 0 auto;">
            <div class="text-center mb-4">
                <h2 class="h3 font-weight-bold mb-2" style="color: #171717;">Welcome back</h2>
                <p class="mb-0" style="color: #171717;">Sign in to your account to continue</p>
            </div>

            <CForm @submit.prevent="handleLogin">
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="font-weight-medium" style="color: #171717;">Email address</span>
                    </div>
                    <CInput
                    type="email" 
                    id="email" 
                    v-model="email" 
                    placeholder="you@lamduan.mfu.ac.th" 
                    size="lg"
                    required />
                </div>

                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="font-weight-medium" style="color: #171717;">Password</span>
                        <CLink href="#" @click.prevent="handleForgotPassword"
                            class="text-decoration-none small font-weight-medium text-danger">
                            Forgot password?
                        </CLink>
                    </div>
                    <div class="position-relative">
                        <CInput :type="showPassword ? 'text' : 'password'" id="password" v-model="password"
                            placeholder="Enter your password" size="lg" required />
                        <CButton type="button" variant="ghost" @click="togglePasswordVisibility"
                            class="position-absolute p-1"
                            style="right: 12px; top: 50%; transform: translateY(-50%); border: none; background: transparent; z-index: 10;">
                            <CIcon :name="showPassword ? 'cilLockUnlocked' : 'cilLockLocked'" style="color: #6c757d;" />
                        </CButton>
                    </div>
                </div>

                <CButton type="submit" size="lg" class="font-weight-semibold py-2 w-100 mx-auto d-block"
                    :disabled="isLoading" style="background-color: #171717; 
                border-color: #171717; 
                color: white;">

                    <CSpinner v-if="isLoading" size="sm" class="mr-2" component="span" />
                    {{ isLoading ? 'Signing in...' : 'Sign in' }}
                </CButton>

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

                <CButton type="button" size="lg" variant="outline"
                    class="d-flex align-items-center justify-content-center py-2 w-50 mx-auto"
                    @click="handleGoogleLogin" :disabled="isLoading"
                    style="background-color: #E5E5E5; border-color: #E5E5E5; color: #171717;">
                    <img src="/google-icon-logo-svgrepo-com.svg" alt="Google Logo" width="18" height="18"
                        class="mr-2" />
                    <span>Google</span>
                </CButton>
            </CForm>
        </CCardBody>

        <!-- Toast for errors -->
        <CToaster placement="top-end">
            <CToast v-if="errorMessage" :visible="!!errorMessage" color="danger" @close="errorMessage = ''" autohide
                :delay="3000" class="shadow">
                <div class="toast-body font-weight-medium">{{ errorMessage }}</div>
            </CToast>
        </CToaster>
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
    CToaster,
    CToast
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
        CToaster,
        CToast
    },
    data() {
        return {
            email: '',
            password: '',
            isLoading: false,
            errorMessage: '',
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

            try {
                const result = await mockLogin(this.email, this.password)

                localStorage.setItem('token', result.data.token)
                localStorage.setItem('user', JSON.stringify(result.data.user))

                // Redirect based on role
                if (result.data.user.role === 'editor' || result.data.user.role === 'staff') {
                    this.$router.push('/dashboard/editor/dashboard')
                } else if (result.data.user.role === 'admin') {
                    this.$router.push('/dashboard/admin/dashboard')
                } else {
                    this.$router.push('/dashboard/user/dashboard')
                }

            } catch (error) {
                this.errorMessage = error.message
            } finally {
                this.isLoading = false
            }
        },

        handleForgotPassword() {
            // TODO: Implement forgot password functionality
            console.log('Forgot password clicked')
        },

        async handleGoogleLogin() {
            this.isLoading = true
            this.errorMessage = ''
            try {
                const result = await mockGoogleLogin()
                localStorage.setItem('token', result.data.token)
                localStorage.setItem('user', JSON.stringify(result.data.user))
                this.$router.push('/dashboard/user/dashboard')
            } catch (error) {
                this.errorMessage = error.message || 'Google login failed'
            } finally {
                this.isLoading = false
            }
        }
    }
}
</script>