<script setup lang="ts">
import { RouterView } from 'vue-router'
import { darkTheme } from 'naive-ui'
import NaiveUi from './components/naiveUi/naiveUi.vue'
</script>

<template>
  <n-config-provider class="page" :theme="darkTheme">
    <NaiveUi />
    <RouterView />
  </n-config-provider>
</template>

<style lang="scss">
@import '@/common/scss/normalize.css';
@import '@/common/scss/common.scss';
</style>
