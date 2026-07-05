<script setup>
import { ref } from 'vue'
import { useRouter } from 'nuxt/app'
import { useToast } from '~/composables/useToast'
import { useTranslation } from '~/composables/useTranslation'

const router = useRouter()
const { showSuccess, showError } = useToast()
const { t } = useTranslation()

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const login = async () => {
  isLoading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { identifier: identifier.value, password: password.value }
    })
    
    showSuccess(t('login.successMessage'))
    router.push('/dashboard')
  } catch (err) {
    showError(err.data?.statusMessage || t('login.errorMessage'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="card" v-motion :initial="{ opacity: 0, y: 50 }" :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }">
      <div class="auth-header">
        <h1>{{ t('login.title') }}</h1>
        <p>{{ t('login.subtitle') }}</p>
      </div>

      <form @submit.prevent="login">
        <div class="input-group">
          <input type="text" id="identifier" v-model="identifier" placeholder=" " required />
          <label for="identifier">{{ t('login.identifierLabel') }}</label>
        </div>
        
        <div class="input-group">
          <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder=" " required />
          <label for="password">{{ t('login.passwordLabel') }}</label>
          <button type="button" class="password-toggle" @click="showPassword = !showPassword">
            <span v-if="showPassword">{{ t('login.hide') }}</span>
            <span v-else>{{ t('login.show') }}</span>
          </button>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="isLoading">
          <span v-if="!isLoading">{{ t('login.signIn') }}</span>
          <span v-else>{{ t('login.signingIn') }}</span>
        </button>
        
        <div class="auth-footer">
          <NuxtLink to="/forgot-password" class="btn-text" style="font-size: 12px; padding: 4px;">{{ t('login.forgotPassword') }}</NuxtLink>
          <NuxtLink to="/register" class="btn-text" style="font-size: 12px; padding: 4px;">{{ t('login.createAccount') }}</NuxtLink>
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
