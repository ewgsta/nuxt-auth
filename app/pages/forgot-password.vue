<script setup>
import { ref } from 'vue'

const email = ref('')
const isLoading = ref(false)
const isSent = ref(false)

const resetPassword = async () => {
  isLoading.value = true
  await new Promise(r => setTimeout(r, 1200))
  isLoading.value = false
  isSent.value = true
}
</script>

<template>
  <div class="auth-container">
    <div class="card" v-motion :initial="{ opacity: 0, x: -50 }" :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }">
      <div class="auth-header">
        <h1>Şifre Sıfırlama</h1>
        <p v-if="!isSent">E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.</p>
        <p v-else style="color: var(--md-secondary)">Sıfırlama bağlantısı e-posta adresinize gönderildi!</p>
      </div>
      
      <form @submit.prevent="resetPassword" v-if="!isSent" v-motion :leave="{opacity: 0, height: 0}">
        <div class="input-group">
          <input type="email" id="email" v-model="email" placeholder=" " required />
          <label for="email">E-posta Adresi</label>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="isLoading">
          <span v-if="!isLoading">Bağlantı Gönder</span>
          <span v-else>Gönderiliyor...</span>
        </button>
      </form>
      
      <div class="auth-footer" style="justify-content: center;">
        <NuxtLink to="/login" class="btn-text">Giriş Ekranına Dön</NuxtLink>
      </div>
    </div>
  </div>
</template>
