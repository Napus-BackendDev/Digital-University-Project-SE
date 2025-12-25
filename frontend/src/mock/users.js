export const mockUsers = [
  {
    email: 'admin@lamduan.mfu.ac.th',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    token: 'mock-admin-token-12345'
  },
  {
    email: 'staff@lamduan.mfu.ac.th',
    password: 'staff123',
    role: 'staff',
    name: 'Staff Member',
    token: 'mock-staff-token-67890'
  },
  {
    email: 'user@lamduan.mfu.ac.th',
    password: 'user123',
    role: 'user',
    name: 'John Doe',
    token: 'mock-user-token-11111'
  }
]

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