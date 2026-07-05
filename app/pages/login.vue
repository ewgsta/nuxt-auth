<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'nuxt/app'
import { useToast } from '~/composables/useToast'
import { useTranslation } from '~/composables/useTranslation'
import { startAuthentication } from '@simplewebauthn/browser'

const router = useRouter()
const { showSuccess, showError } = useToast()
const { t } = useTranslation()

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const is2faRequired = ref(false)
const twoFactorCode = ref('')
const is2faLoading = ref(false)

const isPasskeySupported = ref(false)
const isPasskeyLoading = ref(false)

onMounted(() => {
  // Check if browser supports passkeys
  if (window.PublicKeyCredential &&
      PublicKeyCredential.isConditionalMediationAvailable) {
    PublicKeyCredential.isConditionalMediationAvailable().then(available => {
      isPasskeySupported.value = available;
    });
  } else if (window.PublicKeyCredential) {
      isPasskeySupported.value = true;
  }
})

const login = async () => {
  isLoading.value = true
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { identifier: identifier.value, password: password.value }
    })

    if (res.require2fa) {
      is2faRequired.value = true
    } else {
      showSuccess(t('login.successMessage'))
      router.push('/dashboard')
    }
  } catch (err) {
    showError(err.data?.statusMessage || t('login.errorMessage'))
  } finally {
    isLoading.value = false
  }
}

const verify2fa = async () => {
    if (!twoFactorCode.value || twoFactorCode.value.length !== 6) {
        return showError("Lütfen 6 haneli kodu eksiksiz girin."); // Or from translation
    }
    
    is2faLoading.value = true;
    try {
        await $fetch('/api/auth/2fa/verify-login', {
            method: 'POST',
            body: { code: twoFactorCode.value }
        });
        showSuccess(t('login.successMessage'))
        router.push('/dashboard')
    } catch (err) {
        showError(err.data?.statusMessage || "Verification failed.")
    } finally {
        is2faLoading.value = false;
    }
}

const loginWithPasskey = async () => {
  isPasskeyLoading.value = true
  try {
    // 1. Get authentication options from server
    const optionsResp = await $fetch('/api/auth/passkey/authentication-options', {
        method: 'POST',
        // Optional: send identifier if you want a flow where user types username first
        body: { identifier: identifier.value || undefined }
    })
    
    // 2. Pass options to browser to prompt user to authenticate
    let asseResp;
    try {
        asseResp = await startAuthentication(optionsResp);
    } catch (error) {
        if (error.name === 'NotAllowedError') {
             return; // User cancelled the prompt
        }
        throw new Error('Passkey authentication failed locally');
    }

    // 3. Send the assertion response back to the server for verification
    const verificationResp = await $fetch('/api/auth/passkey/verify-authentication', {
        method: 'POST',
        body: asseResp
    })
    
    if (verificationResp.success) {
        showSuccess(t('login.successMessage'))
        router.push('/dashboard')
    }

  } catch (err) {
    showError(err.data?.statusMessage || err.message || 'Passkey login failed.')
  } finally {
    isPasskeyLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="card" v-motion :initial="{ opacity: 0, y: 50 }" :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }">
      
      <!-- Normal / Passkey Login Form -->
      <div v-if="!is2faRequired">
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
          
          <div v-if="isPasskeySupported" style="margin-top: 16px;">
             <div style="text-align: center; margin: 12px 0; color: var(--md-on-bg-medium); font-size: 12px; position: relative;">
                <span style="background: var(--md-surface); padding: 0 8px; position: relative; z-index: 1;">OR</span>
                <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.1); z-index: 0;"></div>
             </div>
             <button type="button" class="btn btn-secondary" style="width: 100%" @click="loginWithPasskey" :disabled="isPasskeyLoading">
                <span v-if="!isPasskeyLoading">{{ t('login.passkey.signIn') }}</span>
                <span v-else>...</span>
             </button>
          </div>
          
          <div class="auth-footer">
            <NuxtLink to="/forgot-password" class="btn-text" style="font-size: 12px; padding: 4px;">{{ t('login.forgotPassword') }}</NuxtLink>
            <NuxtLink to="/register" class="btn-text" style="font-size: 12px; padding: 4px;">{{ t('login.createAccount') }}</NuxtLink>
          </div>
        </form>
      </div>

      <!-- 2FA Verification Form -->
      <div v-else>
         <div class="auth-header">
          <h1>{{ t('login.2fa.title') }}</h1>
          <p>{{ t('login.2fa.subtitle') }}</p>
        </div>

        <form @submit.prevent="verify2fa">
          <div class="input-group">
            <input type="text" id="twoFactorCode" v-model="twoFactorCode" placeholder=" " required maxlength="6" />
            <label for="twoFactorCode">{{ t('login.2fa.codeLabel') }}</label>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="is2faLoading">
            <span v-if="!is2faLoading">{{ t('login.2fa.verify') }}</span>
            <span v-else>{{ t('login.2fa.verifying') }}</span>
          </button>

           <div class="auth-footer" style="justify-content: center; margin-top: 16px;">
            <button type="button" @click="is2faRequired = false" class="btn-text" style="font-size: 14px; padding: 4px;">Back</button>
          </div>
        </form>
      </div>

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
