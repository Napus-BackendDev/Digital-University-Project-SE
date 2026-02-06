// Mock user data and authentication functions
export const mockUsers = [
    {
        id: 1,
        email: 'admin@lamduan.mfu.ac.th',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        avatar: null
    },
    {
        id: 2,
        email: 'editor@lamduan.mfu.ac.th',
        password: 'editor123',
        name: 'Editor User',
        role: 'editor',
        avatar: null
    },
    {
        id: 3,
        email: 'user@lamduan.mfu.ac.th',
        password: 'user123',
        name: 'Regular User',
        role: 'user',
        avatar: null
    }
]

// Mock login function
export const mockLogin = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Find user by email
    const user = mockUsers.find(u => u.email === email)

    if (!user) {
        throw new Error('User not found')
    }

    if (user.password !== password) {
        throw new Error('Invalid password')
    }

    // Generate mock token
    const token = btoa(`${user.id}:${Date.now()}`)

    return {
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar
            },
            token: token
        }
    }
}

// Mock Google login function
export const mockGoogleLogin = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock Google user data
    const googleUser = {
        id: 999,
        email: 'google.user@gmail.com',
        name: 'Google User',
        role: 'user',
        avatar: 'https://lh3.googleusercontent.com/a/default-user'
    }

    // Generate mock token
    const token = btoa(`${googleUser.id}:${Date.now()}:google`)

    return {
        success: true,
        data: {
            user: googleUser,
            token: token
        }
    }
}

// Mock logout function
export const mockLogout = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Clear local storage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    return {
        success: true,
        message: 'Logged out successfully'
    }
}

// Mock user profile function
export const mockGetUserProfile = async (token) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    if (!token) {
        throw new Error('No token provided')
    }

    try {
        // Decode token to get user info
        const decodedToken = atob(token)
        const [userId] = decodedToken.split(':')

        // Find user by ID
        const user = mockUsers.find(u => u.id === parseInt(userId))

        if (!user) {
            throw new Error('User not found')
        }

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar
                }
            }
        }
    } catch (error) {
        throw new Error('Invalid token')
    }
}

// Mock password reset function
export const mockResetPassword = async (email) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200))

    // Check if user exists
    const user = mockUsers.find(u => u.email === email)

    if (!user) {
        throw new Error('Email not found')
    }

    return {
        success: true,
        message: 'Password reset link sent to your email'
    }
}

export default {
    mockUsers,
    mockLogin,
    mockGoogleLogin,
    mockLogout,
    mockGetUserProfile,
    mockResetPassword
}