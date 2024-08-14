import { ref, watch } from 'vue'
import * as storage from '@/common/utils/storage'

export function createStorageRef<T>(name, defaultVal: T, cb?: Function) {
  const ret = ref<T>(storage.get(name) ?? defaultVal)
  watch(
    ret,
    (val) => {
      storage.set(name, val)
      cb && cb(val)
    },
    {
      deep: typeof defaultVal === 'object',
    },
  )
  return ret
}
