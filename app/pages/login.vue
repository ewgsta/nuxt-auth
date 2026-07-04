<script setup>
import { ref } from 'vue'
import { useRouter } from 'nuxt/app'

const router = useRouter()
const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const login = async () => {
  isLoading.value = true
  await new Promise(r => setTimeout(r, 1200)) // Animasyonlu fake API beklemesi
  isLoading.value = false
  router.push('/dashboard')
}
</script>

<template>
  <div class="auth-container">
    <div class="card" v-motion :initial="{ opacity: 0, y: 50 }" :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }">
      <div class="auth-header">
        <h1>Nuxt Auth</h1>
        <p>Hesabınıza giriş yapın</p>
      </div>
      
      <form @submit.prevent="login">
        <div class="input-group">
          <input type="text" id="identifier" v-model="identifier" placeholder=" " required />
          <label for="identifier">Kullanıcı Adı veya E-posta</label>
        </div>
        
        <div class="input-group">
          <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder=" " required />
          <label for="password">Şifre</label>
          <button type="button" class="password-toggle" @click="showPassword = !showPassword">
            <span v-if="showPassword">Gizle</span>
            <span v-else>Göster</span>
          </button>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="isLoading">
          <span v-if="!isLoading">Giriş Yap</span>
          <span v-else>Giriş Yapılıyor...</span>
        </button>
        
        <div class="auth-footer">
          <NuxtLink to="/forgot-password" class="btn-text" style="font-size: 12px; padding: 4px;">Şifremi Unuttum</NuxtLink>
          <NuxtLink to="/register" class="btn-text" style="font-size: 12px; padding: 4px;">Hesap Oluştur</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.password-toggle {
  position: absolute;
  right: 8px;
  top: 16px;
  background: none;
  border: none;
  color: var(--md-on-bg-medium);
  cursor: pointer;
  font-size: 12px;
}
.password-toggle:hover {
  color: var(--md-primary);
}
</style>
