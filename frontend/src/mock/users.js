export const mockUsers = [
  {
    email: 'staff@lamduan.mfu.ac.th',
    password: 'staff123',
    role: 'staff',
    name: 'Staff Member',
    token: 'mock-staff-token-67890'
  },
]


export const mockGoogleLogin = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          token: 'mock-google-token-12345',
          user: {
            email: 'mockuser@gmail.com',
            name: 'Mock Google User',
            role: 'user',
            provider: 'google'
          }
        }
      })
    }, 800)
  })
}


export const mockLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(
        u => u.email === email && u.password === password
      )
      
      if (user) {
        resolve({
          success: true,
          data: {
            token: user.token,
            user: {
              email: user.email,
              name: user.name,
              role: user.role
            }
          }
        })
      } else {
        reject({
          success: false,
          message: 'Invalid email or password'
        })
      }
    }, 800)
  })
}