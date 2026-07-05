<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'nuxt/app'

const router = useRouter()
const username = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const acceptTerms = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)

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

const errorMsg = ref('')
const successMsg = ref('')

const register = async () => {
  if (!acceptTerms.value) return alert("Şartları kabul etmelisiniz.")
  if (passwordStrength.value.score < 2) return alert("Şifreniz çok zayıf. Lütfen daha güçlü bir şifre seçin.")
  
  isLoading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { 
        username: username.value, 
        email: email.value, 
        password: password.value,
        displayName: displayName.value 
      }
    })
    
    // Doğrulama maili gönderildi uyarısı gösterilecek, doğrudan yönlendirilmeyecek.
    successMsg.value = res.message || 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.'
    
    // Kullanıcıya emaili okuması için süre tanıyıp login'e yönlendirebiliriz
    setTimeout(() => {
      router.push('/login')
    }, 4000)

  } catch (err) {
    errorMsg.value = err.data?.statusMessage || err.data?.data?.issues?.[0]?.message || 'Kayıt işlemi başarısız oldu.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="card" v-motion :initial="{ opacity: 0, scale: 0.95 }" :enter="{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 25 } }">
      <div class="auth-header">
        <h1>Nuxt Auth</h1>
        <p>Yeni bir hesap oluşturun</p>
      </div>
      
      <div v-if="errorMsg" style="color: var(--md-error); font-size: 14px; text-align: center; margin-bottom: 16px;">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="register">
        <div class="input-group">
          <input type="text" id="displayName" v-model="displayName" placeholder=" " />
          <label for="displayName">Görünen İsim (Opsiyonel)</label>
        </div>

        <div class="input-group">
          <input type="text" id="username" v-model="username" placeholder=" " required />
          <label for="username">Kullanıcı Adı</label>
        </div>

        
        <div class="input-group">
          <input type="email" id="email" v-model="email" placeholder=" " required />
          <label for="email">E-posta Adresi</label>
        </div>
        
        <div class="input-group" style="margin-bottom: 12px;">
          <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder=" " required />
          <label for="password">Şifre</label>
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
        
        <label class="checkbox-group">
          <input type="checkbox" v-model="acceptTerms" required />
          <div class="checkmark"></div>
          <span>Kullanım şartlarını kabul ediyorum</span>
        </label>
        
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="isLoading">
          <span v-if="!isLoading">Kayıt Ol</span>
          <span v-else>Oluşturuluyor...</span>
        </button>
        
        <div class="auth-footer" style="justify-content: center; margin-top: 16px;">
          <span style="color: var(--md-on-bg-medium); margin-right: 8px;">Zaten hesabın var mı?</span>
          <NuxtLink to="/login" class="btn-text" style="font-size: 14px; padding: 4px;">Giriş Yap</NuxtLink>
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
