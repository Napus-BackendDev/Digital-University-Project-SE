# Login Page Implementation

หน้า Login ถูกสร้างเรียบร้อยแล้วตามดีไซน์ที่ต้องการ

## คุณสมบัติ

- **หน้าแบ่ง 2 ส่วน**:
  - **ซ้าย**: พื้นหลังสีแดง (university brand color) พร้อมข้อความและรูปมหาวิทยาลัย
  - **ขวา**: ฟอร์ม Login ที่สะอาดตา

- **ฟอร์ม Login** ประกอบด้วย:
  - Email input field
  - Password input field
  - ลิงก์ "Forgot password?"
  - ปุ่ม "Sign in" สีดำ
  - ปุ่ม "Continue with Google" พร้อมไอคอน

- **Responsive Design**: รองรับทั้ง Desktop, Tablet และ Mobile

## วิธีเพิ่มรูปมหาวิทยาลัย

1. เตรียมรูปภาพมหาวิทยาลัย (แนะนำ: 1200x800px หรือขนาดใกล้เคียง)
2. บันทึกไฟล์รูปชื่อ `university.jpg` 
3. สร้างโฟลเดอร์ `photos` ใน `frontend/src/assets/` ถ้ายังไม่มี
4. วางไฟล์รูปใน: `frontend/src/assets/photos/university.jpg`
5. แก้ไขไฟล์ `LoginForm.vue` โดยเปลี่ยนจาก placeholder เป็น:

```vue
<div class="image-container">
  <img 
    src="@/assets/photos/university.jpg" 
    alt="University Campus" 
    class="university-image"
  />
</div>
```

## ไฟล์ที่สร้าง

- `frontend/src/components/Login/LoginForm.vue` - Component หลักของหน้า Login
- `frontend/src/views/LoginView.vue` - View wrapper สำหรับ Login
- อัปเดต `frontend/src/router/index.js` - เพิ่ม route สำหรับหน้า login
- อัปเดต `frontend/src/App.vue` - ลบ template เริ่มต้น
- อัปเดต `frontend/src/assets/main.css` - ปรับ global styles

## วิธีรัน

```bash
cd frontend
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ที่ http://localhost:5173

## การเชื่อมต่อกับ Backend

ในไฟล์ `LoginForm.vue` มี function `handleLogin()` ที่พร้อมสำหรับเชื่อมต่อกับ API:

```javascript
const handleLogin = async () => {
  isLoading.value = true
  try {
    // TODO: เรียก API login ของคุณที่นี่
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: email.value, password: password.value })
    // })
    
    // ถ้า login สำเร็จ ให้ navigate ไปหน้าอื่น
    // router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
```

## สิ่งที่ต้องทำต่อ (TODO)

- [ ] เพิ่มรูปมหาวิทยาลัย
- [ ] เชื่อมต่อกับ Backend API สำหรับ Login
- [ ] เพิ่ม error handling และแสดง error messages
- [ ] Implement forgot password functionality
- [ ] Implement Google OAuth login
- [ ] เพิ่ม form validation
- [ ] เพิ่ม loading state animations
