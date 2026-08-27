import type { ButtonKey, ControllerId, NES } from 'jsnes'
import { Controller } from 'jsnes'

export type KeyboardPreset = 'standard' | 'classic'

const COMMON_PLAYER_ONE_KEYS: Record<string, ButtonKey> = {
  ArrowUp: Controller.BUTTON_UP,
  ArrowDown: Controller.BUTTON_DOWN,
  ArrowLeft: Controller.BUTTON_LEFT,
  ArrowRight: Controller.BUTTON_RIGHT,
  Space: Controller.BUTTON_SELECT,
  Enter: Controller.BUTTON_START,
}

/** 玩家 1 可切换的键位预设，使用 KeyboardEvent.code 表示物理键位。 */
const PLAYER_ONE_PRESETS: Record<KeyboardPreset, Record<string, ButtonKey>> = {
  standard: {
    ...COMMON_PLAYER_ONE_KEYS,
    KeyW: Controller.BUTTON_UP,
    KeyS: Controller.BUTTON_DOWN,
    KeyA: Controller.BUTTON_LEFT,
    KeyD: Controller.BUTTON_RIGHT,
    KeyX: Controller.BUTTON_A,
    KeyZ: Controller.BUTTON_B,
  },
  classic: {
    ...COMMON_PLAYER_ONE_KEYS,
    KeyA: Controller.BUTTON_A,
    KeyQ: Controller.BUTTON_A,
    KeyS: Controller.BUTTON_B,
    KeyO: Controller.BUTTON_B,
  },
}

/** 玩家 2 保持固定键位，避免与玩家 1 的预设切换互相影响。 */
const PLAYER_TWO_KEYS: Record<string, ButtonKey> = {
  KeyI: Controller.BUTTON_UP,
  KeyK: Controller.BUTTON_DOWN,
  KeyJ: Controller.BUTTON_LEFT,
  KeyL: Controller.BUTTON_RIGHT,
  KeyH: Controller.BUTTON_A,
  KeyG: Controller.BUTTON_B,
  KeyT: Controller.BUTTON_SELECT,
  KeyY: Controller.BUTTON_START,
}

const DIRECTION_BUTTONS = new Set<ButtonKey>([
  Controller.BUTTON_UP,
  Controller.BUTTON_DOWN,
  Controller.BUTTON_LEFT,
  Controller.BUTTON_RIGHT,
])

/** 将物理按键解析为 NES 手柄按键。 */
export function keyToButton(
  code: string,
  player: ControllerId = 1,
  preset: KeyboardPreset = 'standard',
): ButtonKey | undefined {
  return player === 1 ? PLAYER_ONE_PRESETS[preset][code] : PLAYER_TWO_KEYS[code]
}

function isGameInputBlocked(event: KeyboardEvent): boolean {
  const target = event.target
  const editableSelector = 'input, textarea, select, button, [contenteditable]:not([contenteditable="false"])'
  if (target instanceof Element && target.closest(editableSelector))
    return true
  return document.querySelector('[aria-modal="true"]') !== null
}

/**
 * 为 NES 实例绑定指定玩家的全局键盘事件。
 *
 * 同一虚拟键可对应多个物理键；所有别名松开后才释放。相反方向同时
 * 按下时互相抵消，避免向游戏发送非法方向组合。
 */
export function bindKeyboard(
  nes: NES,
  player: ControllerId = 1,
  preset: KeyboardPreset = 'standard',
): () => void {
  const pressedCodes = new Map<string, ButtonKey>()
  const buttonCounts = new Map<ButtonKey, number>()
  const emittedButtons = new Set<ButtonKey>()

  function desiredButtons(): Set<ButtonKey> {
    const physicallyPressed = new Set<ButtonKey>()
    for (const [button, count] of buttonCounts) {
      if (count > 0)
        physicallyPressed.add(button)
    }

    const desired = new Set<ButtonKey>(
      [...physicallyPressed].filter(button => !DIRECTION_BUTTONS.has(button)),
    )
    const up = physicallyPressed.has(Controller.BUTTON_UP)
    const down = physicallyPressed.has(Controller.BUTTON_DOWN)
    const left = physicallyPressed.has(Controller.BUTTON_LEFT)
    const right = physicallyPressed.has(Controller.BUTTON_RIGHT)
    if (up !== down)
      desired.add(up ? Controller.BUTTON_UP : Controller.BUTTON_DOWN)
    if (left !== right)
      desired.add(left ? Controller.BUTTON_LEFT : Controller.BUTTON_RIGHT)
    return desired
  }

  function syncButtons() {
    const desired = desiredButtons()
    for (const button of emittedButtons) {
      if (!desired.has(button)) {
        nes.buttonUp(player, button)
        emittedButtons.delete(button)
      }
    }
    for (const button of desired) {
      if (!emittedButtons.has(button)) {
        nes.buttonDown(player, button)
        emittedButtons.add(button)
      }
    }
  }

  function releaseAll() {
    pressedCodes.clear()
    buttonCounts.clear()
    for (const button of emittedButtons)
      nes.buttonUp(player, button)
    emittedButtons.clear()
  }

  function onKeyDown(event: KeyboardEvent) {
    const button = keyToButton(event.code, player, preset)
    if (button === undefined || isGameInputBlocked(event))
      return
    event.preventDefault()
    if (pressedCodes.has(event.code))
      return
    pressedCodes.set(event.code, button)
    buttonCounts.set(button, (buttonCounts.get(button) ?? 0) + 1)
    syncButtons()
  }

  function onKeyUp(event: KeyboardEvent) {
    const button = pressedCodes.get(event.code)
    if (button === undefined)
      return
    event.preventDefault()
    pressedCodes.delete(event.code)
    const nextCount = (buttonCounts.get(button) ?? 1) - 1
    if (nextCount > 0)
      buttonCounts.set(button, nextCount)
    else
      buttonCounts.delete(button)
    syncButtons()
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', releaseAll)
  document.addEventListener('visibilitychange', releaseAll)

  return () => {
    releaseAll()
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', releaseAll)
    document.removeEventListener('visibilitychange', releaseAll)
  }
}
