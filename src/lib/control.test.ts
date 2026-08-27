import { Controller } from 'jsnes'
import { describe, expect, it, vi } from 'vitest'
import { bindKeyboard, keyToButton } from './control'

describe('keyToButton', () => {
  it('标准预设支持方向键 / WASD 与 Z/X 动作键', () => {
    expect(keyToButton('ArrowUp')).toBe(Controller.BUTTON_UP)
    expect(keyToButton('KeyW')).toBe(Controller.BUTTON_UP)
    expect(keyToButton('KeyS')).toBe(Controller.BUTTON_DOWN)
    expect(keyToButton('KeyA')).toBe(Controller.BUTTON_LEFT)
    expect(keyToButton('KeyD')).toBe(Controller.BUTTON_RIGHT)
    expect(keyToButton('KeyX')).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyZ')).toBe(Controller.BUTTON_B)
  })

  it('经典预设保留方向键与 A/Q、S/O 动作键', () => {
    expect(keyToButton('ArrowLeft', 1, 'classic')).toBe(Controller.BUTTON_LEFT)
    expect(keyToButton('KeyA', 1, 'classic')).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyQ', 1, 'classic')).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyS', 1, 'classic')).toBe(Controller.BUTTON_B)
    expect(keyToButton('KeyO', 1, 'classic')).toBe(Controller.BUTTON_B)
    expect(keyToButton('KeyW', 1, 'classic')).toBeUndefined()
  })

  it('玩家 1 功能键映射正确', () => {
    expect(keyToButton('Space')).toBe(Controller.BUTTON_SELECT)
    expect(keyToButton('Enter')).toBe(Controller.BUTTON_START)
  })

  it('玩家 2 使用 IJKL + GHTY 键位', () => {
    expect(keyToButton('KeyI', 2)).toBe(Controller.BUTTON_UP)
    expect(keyToButton('KeyK', 2)).toBe(Controller.BUTTON_DOWN)
    expect(keyToButton('KeyJ', 2)).toBe(Controller.BUTTON_LEFT)
    expect(keyToButton('KeyL', 2)).toBe(Controller.BUTTON_RIGHT)
    expect(keyToButton('KeyH', 2)).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyG', 2)).toBe(Controller.BUTTON_B)
    expect(keyToButton('KeyT', 2)).toBe(Controller.BUTTON_SELECT)
    expect(keyToButton('KeyY', 2)).toBe(Controller.BUTTON_START)
  })

  it('两个玩家的键位互不干扰', () => {
    expect(keyToButton('KeyI')).toBeUndefined() // 玩家 2 的键对玩家 1 无效
    expect(keyToButton('ArrowUp', 2)).toBeUndefined() // 玩家 1 的键对玩家 2 无效
  })

  it('未映射的按键返回 undefined', () => {
    expect(keyToButton('KeyQ')).toBeUndefined()
    expect(keyToButton('Tab')).toBeUndefined()
    expect(keyToButton('')).toBeUndefined()
  })
})

describe('bindKeyboard', () => {
  function createNesStub() {
    return { buttonDown: vi.fn(), buttonUp: vi.fn() } as any
  }

  it('玩家 1 按下 / 抬起会驱动 nes', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }))
    expect(nes.buttonDown).toHaveBeenCalledWith(1, Controller.BUTTON_UP)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowUp' }))
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_UP)
    unbind()
  })

  it('同方向别名全部抬起后才释放方向', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }))
    expect(nes.buttonDown).toHaveBeenCalledTimes(1)
    expect(nes.buttonUp).not.toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }))
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_LEFT)
    unbind()
  })

  it('相反方向同时按下时互相抵消', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_LEFT)
    expect(nes.buttonDown).not.toHaveBeenCalledWith(1, Controller.BUTTON_RIGHT)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }))
    expect(nes.buttonDown).toHaveBeenCalledWith(1, Controller.BUTTON_RIGHT)
    unbind()
  })

  it('输入控件或模态框激活时不驱动游戏', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)
    const input = document.createElement('input')
    document.body.append(input)

    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))
    expect(nes.buttonDown).not.toHaveBeenCalled()

    const modal = document.createElement('div')
    modal.setAttribute('aria-modal', 'true')
    document.body.append(modal)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))
    expect(nes.buttonDown).not.toHaveBeenCalled()

    input.remove()
    modal.remove()
    unbind()
  })

  it('窗口失焦时释放所有已按下按键', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' }))
    window.dispatchEvent(new Event('blur'))
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_A)
    unbind()
  })

  it('页面可见性变化时释放所有已按下按键', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_B)
    unbind()
  })

  it('只阻止实际消费的游戏按键默认行为', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)
    const mapped = new KeyboardEvent('keydown', { code: 'Space', cancelable: true })
    const unmapped = new KeyboardEvent('keydown', { code: 'Tab', cancelable: true })

    window.dispatchEvent(mapped)
    window.dispatchEvent(unmapped)
    expect(mapped.defaultPrevented).toBe(true)
    expect(unmapped.defaultPrevented).toBe(false)
    unbind()
  })

  it('返回的解绑函数可移除监听', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)
    unbind()

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }))
    expect(nes.buttonDown).not.toHaveBeenCalled()
  })

  it('解绑时先释放仍处于按下状态的按键', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }))
    unbind()
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_START)
  })

  it('忽略未映射的按键', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' }))
    expect(nes.buttonDown).not.toHaveBeenCalled()
    unbind()
  })

  it('玩家 2 用 IJKL / GHTY 键位驱动 nes', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes, 2)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyY' }))
    expect(nes.buttonDown).toHaveBeenCalledWith(2, Controller.BUTTON_START)
    unbind()
  })
})
