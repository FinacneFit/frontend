<template>
  <div class="auth-bg">
    <div class="auth-card-wrapper">
      <div class="auth-card">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-bg {
  min-height: 100vh;
  background: linear-gradient(to right, #1b78fd, #2adbc6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card-wrapper {
  padding: 40px 16px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  width: 512px;
  max-width: 100%;
  box-shadow: 0px 25px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
</style>
