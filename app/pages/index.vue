<script setup>
import { navigateTo } from 'nuxt/app'
import { useTranslation } from '~/composables/useTranslation'

const { t } = useTranslation()

definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/login')
    }
  ]
})
</script>
<template>
  <div>{{ t('index.redirecting') }}</div>
</template>
