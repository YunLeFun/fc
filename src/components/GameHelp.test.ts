import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { useKeyboardPreset } from '../composables/useKeyboardPreset'
import GameHelp from './GameHelp.vue'

function mountHelp() {
  return mount(GameHelp, {
    global: {
      stubs: { Teleport: true, Transition: false },
    },
  })
}

describe('gameHelp', () => {
  beforeEach(() => {
    useKeyboardPreset().setPreset('standard')
  })

  it('打开帮助时展示标准预设的完整键位', async () => {
    const wrapper = mountHelp()
    await wrapper.find('[aria-label="操作帮助"]').trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.find('[data-preset="standard"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('方向键 / W A S D')
    expect(wrapper.text()).toContain('X')
    expect(wrapper.text()).toContain('Z')
  })

  it('用户切换到经典预设后立即更新按键表', async () => {
    const wrapper = mountHelp()
    await wrapper.find('[aria-label="操作帮助"]').trigger('click')
    await wrapper.find('[data-preset="classic"]').trigger('click')

    expect(wrapper.find('[data-preset="classic"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('A / Q')
    expect(wrapper.text()).toContain('S / O')
    expect(wrapper.text()).not.toContain('方向键 / W A S D')
  })
})
