import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const publicDirectory = resolve(import.meta.dirname, '../../public')

describe('yunLeFun icon assets', () => {
  it('provides a transparent FC mark and an unmasked full-square app icon', async () => {
    const [mark, appIcon] = await Promise.all([
      readFile(resolve(publicDirectory, 'fc-mark.svg'), 'utf8'),
      readFile(resolve(publicDirectory, 'icon.svg'), 'utf8'),
    ])

    expect(mark).toContain('viewBox="0 0 64 64"')
    expect(mark).toContain('#da4a4a')
    expect(mark).not.toContain('<rect')

    expect(appIcon).toContain('viewBox="0 0 64 64"')
    expect(appIcon).toMatch(/<rect[^>]*width="64"[^>]*height="64"[^>]*fill="#da4a4a"/)
    expect(appIcon).toContain('fill="#fff"')
    expect(appIcon).not.toMatch(/<rect[^>]*\srx=/)
  })
})
