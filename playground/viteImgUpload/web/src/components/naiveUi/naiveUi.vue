<script setup lang="ts">
import { useDialog, useMessage } from 'naive-ui'
import { createTextVNode, defineComponent } from 'vue'
import naiveui from '@/common/utils/naive-ui'

const Comp = defineComponent({
  setup() {
    naiveui.dialog = useDialog()
    naiveui.message = useMessage()

    return () => createTextVNode()
  },
})
</script>

<template>
  <n-dialog-provider>
    <n-message-provider>
      <Comp />
    </n-message-provider>
  </n-dialog-provider>
</template>
