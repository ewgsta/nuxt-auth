<script setup>
import { useRouter } from 'nuxt/app'
import { ref, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import { useTranslation } from '~/composables/useTranslation'

const router = useRouter()
const { showSuccess, showError } = useToast()
const { t } = useTranslation()

const isMenuOpen = ref(false)
const currentTab = ref('profile') // 'profile' veya 'settings'
const user = ref(null)
const isLoading = ref(true)

// Settings Formları İçin Değişkenler
const currentPassword = ref('')
const newPassword = ref('')
const newEmail = ref('')
const updateType = ref('') // 'password' veya 'email'
const verificationStep = ref(false) // Kod girme adımında mıyız?
const oldEmailCode = ref('')
const newEmailCode = ref('')
const passCode = ref('')
const isActionLoading = ref(false)

const fetchProfile = async () => {
  try {
    const data = await $fetch('/api/auth/me')
    user.value = data.user
  } catch (err) {
    showError(t('dashboard.messages.sessionExpired'))
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

const resetForms = () => {
  currentPassword.value = ''
  newPassword.value = ''
  newEmail.value = ''
  oldEmailCode.value = ''
  newEmailCode.value = ''
  passCode.value = ''
  updateType.value = ''
  verificationStep.value = false
}

  const requestUpdate = async (type) => {
  if (!currentPassword.value) return showError(t('dashboard.messages.enterCurrentPassword'))
  if (type === 'email' && !newEmail.value) return showError(t('dashboard.messages.enterNewEmail'))
  if (type === 'password' && newPassword.value.length < 6) return showError(t('dashboard.messages.passwordLength'))

  isActionLoading.value = true
  try {
    const res = await $fetch('/api/auth/request-update', {
      method: 'POST',
      body: { 
        type, 
        currentPassword: currentPassword.value,
        newEmail: type === 'email' ? newEmail.value : undefined 
      }
    })
    
    updateType.value = type
    verificationStep.value = true
    showSuccess(res.message)
  } catch (err) {
    showError(err.data?.statusMessage || t('dashboard.messages.processFailed'))
  } finally {
    isActionLoading.value = false
  }
}

const confirmUpdate = async () => {
  if (updateType.value === 'password' && passCode.value.length !== 6) return showError(t('dashboard.messages.enter6DigitCode'))
  if (updateType.value === 'email' && (oldEmailCode.value.length !== 6 || newEmailCode.value.length !== 6)) return showError(t('dashboard.messages.enterBothCodes'))

  isActionLoading.value = true
  try {
    const body = { type: updateType.value }
    
    if (updateType.value === 'password') {
      body.code = passCode.value
      body.newPassword = newPassword.value
    } else {
      body.code = oldEmailCode.value
      body.newCode = newEmailCode.value
    }

    const res = await $fetch('/api/auth/confirm-update', {
      method: 'POST',
      body
    })
    
    showSuccess(res.message)
    resetForms()
    fetchProfile() // Bilgileri yeniden çek
  } catch (err) {
    showError(err.data?.statusMessage || t('dashboard.messages.incorrectCode'))
  } finally {
    isActionLoading.value = false
  }
}
</script>

<template>
  <div class="dashboard-layout" v-if="!isLoading && user">
    <aside class="sidebar" :class="{ 'is-open': isMenuOpen }">
      <div class="sidebar-header">
        <h2>{{ t('dashboard.sidebar.title') }}</h2>
      </div>
      <nav class="sidebar-nav">
        <a href="#" :class="{ active: currentTab === 'profile' }" @click.prevent="currentTab = 'profile'; resetForms()">{{ t('dashboard.sidebar.myProfile') }}</a>
        <a href="#" :class="{ active: currentTab === 'settings' }" @click.prevent="currentTab = 'settings'">{{ t('dashboard.sidebar.settings') }}</a>
      </nav>
      <div class="sidebar-footer">
        <button @click="logout" class="btn btn-text" style="color: var(--md-error); width: 100%; text-align: left;">{{ t('dashboard.sidebar.logout') }}</button>
      </div>
    </aside>
    
    <main class="main-content">
      <header class="app-bar">
        <button class="menu-btn" @click="isMenuOpen = !isMenuOpen">
          <span class="menu-icon"></span>
        </button>
        <div class="app-bar-title">{{ currentTab === 'profile' ? t('dashboard.header.dashboard') : t('dashboard.header.settings') }}</div>
        <div class="app-bar-actions">
          <div class="avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
        </div>
      </header>
      
      <div class="content-wrapper">
        <!-- PROFİL SEKME -->
        <div v-if="currentTab === 'profile'">
          <h1 v-motion :initial="{opacity:0, y:-20}" :enter="{opacity:1, y:0, transition: {delay: 100}}">
            {{ t('dashboard.profile.welcome', { name: user.displayName || user.username }) }}
          </h1>
          <p style="color: var(--md-on-bg-medium);" v-motion :initial="{opacity:0, y:-20}" :enter="{opacity:1, y:0, transition: {delay: 200}}">
            {{ t('dashboard.profile.description') }}
          </p>
          
          <div class="stats-grid">
            <div class="stat-card card" v-motion :initial="{opacity:0, scale:0.8}" :enter="{opacity:1, scale:1, transition: {delay: 300, type: 'spring'}}">
              <h3>{{ t('dashboard.profile.username') }}</h3>
              <div class="stat-value" style="font-size: 20px;">@{{ user.username }}</div>
            </div>

            <div class="stat-card card" v-motion :initial="{opacity:0, scale:0.8}" :enter="{opacity:1, scale:1, transition: {delay: 400, type: 'spring'}}">
              <h3>{{ t('dashboard.profile.email') }}</h3>
              <div class="stat-value" style="font-size: 20px;">{{ user.email }}</div>
            </div>

            <div class="stat-card card" v-motion :initial="{opacity:0, scale:0.8}" :enter="{opacity:1, scale:1, transition: {delay: 500, type: 'spring'}}">
              <h3>{{ t('dashboard.profile.accountStatus') }}</h3>
              <div class="stat-value" style="font-size: 20px; color: var(--md-secondary);">{{ t('dashboard.profile.active') }}</div>
            </div>
          </div>
        </div>

        <!-- AYARLAR SEKME -->
        <div v-if="currentTab === 'settings'" v-motion :initial="{opacity:0}" :enter="{opacity:1}">
          <h1>{{ t('dashboard.settings.title') }}</h1>
          <p style="color: var(--md-on-bg-medium); margin-bottom: 32px;">{{ t('dashboard.settings.description') }}</p>
          
          <div class="settings-grid">
            <!-- Password Değiştirme Kartı -->
            <div class="card settings-card">
              <h3>{{ t('dashboard.settings.changePassword') }}</h3>
              
              <div v-if="verificationStep && updateType === 'password'" v-motion :initial="{opacity:0}" :enter="{opacity:1}">
                <p style="font-size: 14px; margin-bottom: 24px; color: var(--md-secondary);">{{ t('dashboard.settings.passwordVerification') }}</p>
                <form @submit.prevent="confirmUpdate">
                  <div class="input-group">
                    <input type="text" id="passCode" v-model="passCode" placeholder=" " maxlength="6" required />
                    <label for="passCode">{{ t('dashboard.settings.verificationCode') }}</label>
                  </div>
                  <div style="display:flex; gap: 12px;">
                    <button type="button" class="btn btn-text" @click="resetForms">{{ t('dashboard.settings.cancel') }}</button>
                    <button type="submit" class="btn btn-primary" style="flex:1" :disabled="isActionLoading">
                      <span v-if="!isActionLoading">{{ t('dashboard.settings.confirm') }}</span>
                      <span v-else>{{ t('dashboard.settings.confirming') }}</span>
                    </button>
                  </div>
                </form>
              </div>

              <form v-else @submit.prevent="requestUpdate('password')" :class="{ 'disabled-form': verificationStep }">
                <div class="input-group">
                  <input type="password" id="curPass" v-model="currentPassword" placeholder=" " required :disabled="verificationStep" />
                  <label for="curPass">{{ t('dashboard.settings.currentPassword') }}</label>
                </div>
                <div class="input-group">
                  <input type="password" id="newPass" v-model="newPassword" placeholder=" " required :disabled="verificationStep" />
                  <label for="newPass">{{ t('dashboard.settings.newPassword') }}</label>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="verificationStep || isActionLoading">{{ t('dashboard.settings.sendCode') }}</button>
              </form>
            </div>

            <!-- Change Emailme Kartı -->
            <div class="card settings-card">
              <h3>{{ t('dashboard.settings.changeEmail') }}</h3>
              
              <div v-if="verificationStep && updateType === 'email'" v-motion :initial="{opacity:0}" :enter="{opacity:1}">
                <p style="font-size: 14px; margin-bottom: 24px; color: var(--md-secondary);">{{ t('dashboard.settings.emailVerification') }}</p>
                <form @submit.prevent="confirmUpdate">
                  <div class="input-group">
                    <input type="text" id="oldEmailCode" v-model="oldEmailCode" placeholder=" " maxlength="6" required />
                    <label for="oldEmailCode">{{ t('dashboard.settings.codeInCurrentEmail') }}</label>
                  </div>
                  <div class="input-group">
                    <input type="text" id="newEmailCode" v-model="newEmailCode" placeholder=" " maxlength="6" required />
                    <label for="newEmailCode">{{ t('dashboard.settings.codeInNewEmail') }}</label>
                  </div>
                  <div style="display:flex; gap: 12px;">
                    <button type="button" class="btn btn-text" @click="resetForms">{{ t('dashboard.settings.cancel') }}</button>
                    <button type="submit" class="btn btn-primary" style="flex:1" :disabled="isActionLoading">
                      <span v-if="!isActionLoading">{{ t('dashboard.settings.confirm') }}</span>
                      <span v-else>{{ t('dashboard.settings.confirming') }}</span>
                    </button>
                  </div>
                </form>
              </div>

              <form v-else @submit.prevent="requestUpdate('email')" :class="{ 'disabled-form': verificationStep }">
                <div class="input-group">
                  <input type="email" id="newEmail" v-model="newEmail" placeholder=" " required :disabled="verificationStep" />
                  <label for="newEmail">{{ t('dashboard.settings.newEmailAddress') }}</label>
                </div>
                <div class="input-group">
                  <input type="password" id="curPassForEmail" v-model="currentPassword" placeholder=" " required :disabled="verificationStep" />
                  <label for="curPassForEmail">{{ t('dashboard.settings.currentPasswordForEmail') }}</label>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="verificationStep || isActionLoading">{{ t('dashboard.settings.sendCode') }}</button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </main>
    
    <div class="overlay" v-if="isMenuOpen" @click="isMenuOpen = false"></div>
  </div>
  
  <div v-else-if="isLoading" class="auth-container" style="display:flex; justify-content:center; align-items:center; height: 100vh;">
    <p>{{ t('dashboard.messages.loading') }}</p>
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

.settings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.settings-card {
  flex: 1;
  min-width: 300px;
  max-width: 450px;
  margin: 0;
}
.settings-card h3 {
  margin-top: 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 12px;
  margin-bottom: 24px;
}

.disabled-form {
  opacity: 0.3;
  pointer-events: none;
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
