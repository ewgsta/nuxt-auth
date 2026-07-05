<script setup>
import { useRouter } from 'nuxt/app'
import { ref, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'

const router = useRouter()
const { showError } = useToast()

const isMenuOpen = ref(false)
const user = ref(null)
const isLoading = ref(true)

const fetchProfile = async () => {
  try {
    const data = await $fetch('/api/auth/me')
    user.value = data.user
  } catch (err) {
    showError('Oturum süreniz dolmuş olabilir, lütfen tekrar giriş yapın.')
    router.push('/login')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  } catch (error) {
    console.error('Logout error', error)
  }
}
</script>

<template>
  <div class="dashboard-layout" v-if="!isLoading && user">
    <aside class="sidebar" :class="{ 'is-open': isMenuOpen }">
      <div class="sidebar-header">
        <h2>Nuxt Auth</h2>
      </div>
      <nav class="sidebar-nav">
        <a href="#" class="active">Profilim</a>
        <a href="#">Ayarlar (Pek Yakında)</a>
      </nav>
      <div class="sidebar-footer">
        <button @click="logout" class="btn btn-text" style="color: var(--md-error); width: 100%; text-align: left;">Çıkış Yap</button>
      </div>
    </aside>
    
    <main class="main-content">
      <header class="app-bar">
        <button class="menu-btn" @click="isMenuOpen = !isMenuOpen">
          <span class="menu-icon"></span>
        </button>
        <div class="app-bar-title">Kontrol Paneli</div>
        <div class="app-bar-actions">
          <div class="avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
        </div>
      </header>
      
      <div class="content-wrapper">
        <h1 v-motion :initial="{opacity:0, y:-20}" :enter="{opacity:1, y:0, transition: {delay: 100}}">
          Hoş Geldin, {{ user.displayName || user.username }}!
        </h1>
        <p style="color: var(--md-on-bg-medium);" v-motion :initial="{opacity:0, y:-20}" :enter="{opacity:1, y:0, transition: {delay: 200}}">
          Profil bilgilerinizi aşağıdan görüntüleyebilirsiniz.
        </p>
        
        <div class="stats-grid">
          <div 
            class="stat-card card" 
            v-motion
            :initial="{opacity:0, scale:0.8}"
            :enter="{opacity:1, scale:1, transition: {delay: 300, type: 'spring'}}"
          >
            <h3>Kullanıcı Adı</h3>
            <div class="stat-value" style="font-size: 20px;">@{{ user.username }}</div>
          </div>

          <div 
            class="stat-card card" 
            v-motion
            :initial="{opacity:0, scale:0.8}"
            :enter="{opacity:1, scale:1, transition: {delay: 400, type: 'spring'}}"
          >
            <h3>E-posta Adresi</h3>
            <div class="stat-value" style="font-size: 20px;">{{ user.email }}</div>
          </div>

          <div 
            class="stat-card card" 
            v-motion
            :initial="{opacity:0, scale:0.8}"
            :enter="{opacity:1, scale:1, transition: {delay: 500, type: 'spring'}}"
          >
            <h3>Hesap Durumu</h3>
            <div class="stat-value" style="font-size: 20px; color: var(--md-secondary);">
              Aktif
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <div class="overlay" v-if="isMenuOpen" @click="isMenuOpen = false"></div>
  </div>
  <div v-else-if="isLoading" class="auth-container" style="display:flex; justify-content:center; align-items:center; height: 100vh;">
    <p>Yükleniyor...</p>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 256px;
  background-color: var(--md-surface);
  border-right: 1px solid rgba(255,255,255,0.12);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.sidebar-header {
  padding: 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--md-primary);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
}
.sidebar-nav a {
  padding: 12px 24px;
  color: var(--md-on-bg);
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
}
.sidebar-nav a:hover, .sidebar-nav a.active {
  background-color: rgba(187, 134, 252, 0.12);
  color: var(--md-primary);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.app-bar {
  height: 64px;
  background-color: var(--md-surface);
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12);
  z-index: 10;
}

.menu-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 12px;
  margin-right: 16px;
  display: none;
}
.menu-icon {
  display: block;
  width: 24px;
  height: 2px;
  background-color: var(--md-on-bg);
  position: relative;
}
.menu-icon::before, .menu-icon::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background-color: var(--md-on-bg);
  left: 0;
}
.menu-icon::before { top: -6px; }
.menu-icon::after { top: 6px; }

.app-bar-title {
  font-size: 20px;
  font-weight: 500;
  flex: 1;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--md-secondary);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.content-wrapper {
  padding: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.stat-card {
  margin: 0;
  max-width: none;
}
.stat-card h3 {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--md-on-bg-medium);
  font-weight: 500;
}
.stat-value {
  font-weight: 300;
  color: var(--md-primary);
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
  }
  .sidebar.is-open {
    transform: translateX(0);
  }
  .menu-btn {
    display: block;
  }
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 50;
  }
}
</style>
