<script setup>
import { ref } from 'vue'
import { useToast } from '~/composables/useToast'

const { showSuccess, showError } = useToast()

const email = ref('')
const isLoading = ref(false)
const isSent = ref(false)
const infoMessage = ref('')

const requestReset = async () => {
  isLoading.value = true
  
  try {
    const res = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })
    
    isSent.value = true
    infoMessage.value = res.message
    showSuccess('Your reset request has been received.')
  } catch (err) {
    showError(err.data?.statusMessage || 'Process failed. Please enter a valid email.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="card" v-motion :initial="{ opacity: 0, x: -50 }" :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }">
      <div class="auth-header">
        <h1>Password Sıfırlama</h1>
        <p v-if="!isSent">Enter your email address, and we'll send you a reset link.</p>
        <p v-else style="color: var(--md-secondary)">Process Completed!</p>
      </div>
      
      <form @submit.prevent="requestReset" v-if="!isSent" v-motion :leave="{opacity: 0, height: 0}">
        <div class="input-group">
          <input type="email" id="email" v-model="email" placeholder=" " required />
          <label for="email">Email Address</label>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="isLoading">
          <span v-if="!isLoading">Send Link</span>
          <span v-else>Sending...</span>
        </button>
      </form>

      <div v-else style="text-align: center; margin-bottom: 24px;">
        <p style="color: var(--md-on-bg-medium); line-height: 1.5; font-size: 14px;">{{ infoMessage }}</p>
      </div>
      
      <div class="auth-footer" style="justify-content: center;">
        <NuxtLink to="/login" class="btn-text">Back to Sign In</NuxtLink>
      </div>
    </div>
  </div>
</template>
