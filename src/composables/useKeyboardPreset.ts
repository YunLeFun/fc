import type { KeyboardPreset } from '../lib/control'
import { readonly, shallowRef } from 'vue'

const PRESET_STORAGE_KEY = 'fc:keyboard-preset:v1'
const NOTICE_STORAGE_KEY = 'fc:keyboard-preset-notice:v1'

function loadPreset(): KeyboardPreset {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY)
    return stored === 'classic' || stored === 'standard' ? stored : 'standard'
  }
  catch {
    return 'standard'
  }
}

const currentPreset = shallowRef<KeyboardPreset>(loadPreset())
let migrationNoticeConsumed = false

/** 玩家 1 键盘预设的全局响应式偏好。 */
export function useKeyboardPreset() {
  function setPreset(preset: KeyboardPreset) {
    currentPreset.value = preset
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, preset)
    }
    catch {
      // 隐私模式或禁用存储时，仍保留当前会话内的选择。
    }
  }

  function consumeMigrationNotice(): boolean {
    if (migrationNoticeConsumed)
      return false
    try {
      if (localStorage.getItem(NOTICE_STORAGE_KEY) === 'seen') {
        migrationNoticeConsumed = true
        return false
      }
      localStorage.setItem(NOTICE_STORAGE_KEY, 'seen')
    }
    catch {
      // 存储不可用时仅在当前会话提示一次。
    }
    migrationNoticeConsumed = true
    return true
  }

  return {
    preset: readonly(currentPreset),
    setPreset,
    consumeMigrationNotice,
  }
}
