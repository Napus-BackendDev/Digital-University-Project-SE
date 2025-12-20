<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link to="/" class="navbar-link">
        <div class="navbar-logo">
          <img 
            src="https://archives.mfu.ac.th/wp-content/uploads/2019/06/Mae-Fah-Luang-University-2-1.png" 
            alt="MFU Logo"
          />
        </div>
        <div class="navbar-brand">
          <div class="brand-text">FormBuilder</div>
          <div class="brand-subtext">มหาวิทยาลัย</div>
        </div>
      </router-link>
      <div class="navbar-user-container">
        <div class="user-text">{{ userEmail }}</div>
        <div class="logout-link" @click="handleLogout">
          <i class="pi pi-sign-out"></i>
          <span>Logout</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userEmail = ref('user@example.com');

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    console.log('Logout');
    router.push('/');
    // TODO: Implement logout functionality
  }
};
</script>

<style scoped>
/* Navbar */
.navbar {
  width: 100%;
  height: 65px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.navbar-container {
  width: 1216px;
  height: 64px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.navbar-link {
  width: 145.05px;
  height: 48px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.navbar-logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-logo img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.navbar-brand {
  width: 93.05px;
  height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0px;
}

.brand-text {
  width: 93.05px;
  height: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.3125px;
  color: #1A1A1A;
}

.brand-subtext {
  width: 93.05px;
  height: 15px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  color: #737373;
}

.navbar-user-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 16px;
  height: 32px;
}

.user-text {
  width: auto;
  max-width: 150px;
  height: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #525252;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 96.03px;
  height: 32px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-link:hover {
  background: rgba(0, 0, 0, 0.05);
}

.logout-link i {
  font-size: 16px;
  color: #333333;
}

.logout-link span {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
}
</style>
