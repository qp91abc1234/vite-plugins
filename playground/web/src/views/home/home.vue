<script setup lang="ts">
import pic from '@/assets/img/6.jpg'
</script>

<template>
  <div>
    <img :src="pic">
    <img src="@/assets/7.jpg">
    <img src="https://md-pic-lib.oss-cn-hangzhou.aliyuncs.com/img/微信图片_20240531212400.png">
    <div class="bg"></div>
  </div>
</template>

<style lang="scss">
.bg {
  width: 200px;
  height: 200px;
  background: url('@/assets/8.jpg');
}
</style>
