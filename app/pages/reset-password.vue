<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'nuxt/app'
import { useToast } from '~/composables/useToast'

const router = useRouter()
const route = useRoute()
const { showSuccess, showError } = useToast()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const token = route.query.token

const passwordStrength = computed(() => {
  const p = password.value
  let score = 0
  if (!p) return { score: 0, text: 'Girilmedi', colors: ['var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)'] }
  
  if (p.length > 5) score += 1
  if (p.length > 8) score += 1
  if (/[A-Z]/.test(p)) score += 1
  if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) score += 1
  
  if (score === 1) return { score, text: 'Zayıf', colors: ['var(--md-error)', 'var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)'] }
  if (score === 2) return { score, text: 'Orta', colors: ['#ffb300', '#ffb300', 'var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)'] }
  if (score === 3) return { score, text: 'İyi', colors: ['var(--md-primary)', 'var(--md-primary)', 'var(--md-primary)', 'var(--md-surface-overlay-2)'] }
  if (score === 4) return { score, text: 'Güçlü', colors: ['var(--md-secondary)', 'var(--md-secondary)', 'var(--md-secondary)', 'var(--md-secondary)'] }
  
  return { score: 0, text: 'Çok Zayıf', colors: ['var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)', 'var(--md-surface-overlay-2)'] }
})

const resetPassword = async () => {
  if (!token) {
    return showError("Geçersiz veya eksik token. Lütfen linkinizi kontrol edin.")
  }

  if (password.value !== confirmPassword.value) {
    return showError("Şifreler uyuşmuyor.")
  }

  if (passwordStrength.value.score < 2) {
    return showError("Şifreniz çok zayıf. Lütfen daha güçlü bir şifre seçin.")
  }

  isLoading.value = true

  try {
    const res = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { 
        token: token,
        newPassword: password.value 
      }
    })
    
    showSuccess(res.message || 'Şifreniz başarıyla sıfırlandı!')
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (err) {
    showError(err.data?.statusMessage || 'İşlem başarısız oldu. Linkin süresi dolmuş olabilir.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="card" v-motion :initial="{ opacity: 0, y: 50 }" :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }">
      <div class="auth-header">
        <h1>Yeni Şifre Belirle</h1>
        <p>Lütfen hesabınız için yeni bir şifre girin.</p>
      </div>

      <div v-if="!token" style="color: var(--md-error); text-align: center; margin-bottom: 24px;">
        Geçersiz bağlantı. Eksik token.
      </div>
      
      <form @submit.prevent="resetPassword" v-else>
        <div class="input-group" style="margin-bottom: 12px;">
          <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder=" " required />
          <label for="password">Yeni Şifre</label>
          <button type="button" class="password-toggle" @click="showPassword = !showPassword">
            <span v-if="showPassword">Gizle</span>
            <span v-else>Göster</span>
          </button>
        </div>
        
        <div class="password-strength" v-if="password.length > 0" v-motion :initial="{opacity:0, height:0}" :enter="{opacity:1, height: 'auto'}">
          <div class="strength-bars">
            <div class="strength-bar" :style="{ backgroundColor: passwordStrength.colors[0] }"></div>
            <div class="strength-bar" :style="{ backgroundColor: passwordStrength.colors[1] }"></div>
            <div class="strength-bar" :style="{ backgroundColor: passwordStrength.colors[2] }"></div>
            <div class="strength-bar" :style="{ backgroundColor: passwordStrength.colors[3] }"></div>
          </div>
          <div class="strength-text" :style="{ color: passwordStrength.colors[Math.max(0, passwordStrength.score - 1)] }">
            {{ passwordStrength.text }}
          </div>
        </div>

        <div class="input-group">
          <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder=" " required />
          <label for="confirmPassword">Yeni Şifre (Tekrar)</label>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="isLoading">
          <span v-if="!isLoading">Şifreyi Güncelle</span>
          <span v-else>Güncelleniyor...</span>
        </button>
        
        <div class="auth-footer" style="justify-content: center; margin-top: 16px;">
          <NuxtLink to="/login" class="btn-text" style="font-size: 14px; padding: 4px;">Giriş Sayfasına Dön</NuxtLink>
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
