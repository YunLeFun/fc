import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useKeyboardPreset', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('没有已保存设置时使用标准预设', async () => {
    const { useKeyboardPreset } = await import('./useKeyboardPreset')
    expect(useKeyboardPreset().preset.value).toBe('standard')
  })

  it('切换预设后立即更新并在重新加载后恢复', async () => {
    const firstModule = await import('./useKeyboardPreset')
    firstModule.useKeyboardPreset().setPreset('classic')
    expect(firstModule.useKeyboardPreset().preset.value).toBe('classic')

    vi.resetModules()
    const reloadedModule = await import('./useKeyboardPreset')
    expect(reloadedModule.useKeyboardPreset().preset.value).toBe('classic')
  })

  it('存储不可用时仍更新当前会话状态', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    const { useKeyboardPreset } = await import('./useKeyboardPreset')
    const { preset, setPreset } = useKeyboardPreset()

    setPreset('classic')
    expect(preset.value).toBe('classic')
  })

  it('迁移提示在当前浏览器只消费一次', async () => {
    const firstModule = await import('./useKeyboardPreset')
    expect(firstModule.useKeyboardPreset().consumeMigrationNotice()).toBe(true)
    expect(firstModule.useKeyboardPreset().consumeMigrationNotice()).toBe(false)

    vi.resetModules()
    const reloadedModule = await import('./useKeyboardPreset')
    expect(reloadedModule.useKeyboardPreset().consumeMigrationNotice()).toBe(false)
  })
})
