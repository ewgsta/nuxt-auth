<script setup>
import { navigateTo } from 'nuxt/app'

definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/login')
    }
  ]
})
</script>
<template>
  <div>Yönlendiriliyor...</div>
</template>
