<template>
  <div class="left-section">
    <div class="header">
      <h1 class="brand-name">FormBuilder</h1>
      <div class="university-logo-container">
        <img 
          src="@/assets/photos/mfu-logo.png" 
          alt="Mae Fah Luang University Logo" 
          class="university-logo"
        />
      </div>
    </div>
    
    <div class="content">
      <h2 class="title">Create Beautiful Forms in Minutes</h2>
      <p class="description">
        Build, share, and analyze forms with powerful features and elegant design. Perfect for surveys, registrations, and feedback collection.
      </p>
      
      <div class="university-container">
        <img 
          src="@/assets/photos/mfu.png" 
          alt="Mae Fah Luang University Campus" 
          class="university-image"
        />
      </div>
    </div>
  </div>
</template>

<script setup>

</script>

<style scoped>
.left-section {
  flex: 1;
  background: linear-gradient(135deg, #c41e3a 0%, #a01729 100%);
  color: white;
  padding: 60px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 80px;
}

.brand-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 24px 0;
  max-width: 500px;
}

.description {
  font-size: 18px;
  line-height: 1.6;
  margin: 0 0 60px 0;
  max-width: 500px;
  opacity: 0.95;
}

.university-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.university-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 8px;
}

.university-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 600px;
}

.university-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  object-fit: cover;
}

.university-image-placeholder {
  width: 100%;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.university-image-placeholder p {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .left-section {
    padding: 40px;
  }
  
  .title {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .left-section {
    min-height: 300px;
    padding: 30px;
  }
  
  .header {
    margin-bottom: 40px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .description {
    font-size: 16px;
    margin-bottom: 30px;
  }
  
 
}
</style>
