<script setup lang="ts">
import type { KeyboardPreset } from '../lib/control'
import { computed, shallowRef } from 'vue'
import { useKeyboardPreset } from '../composables/useKeyboardPreset'

const open = shallowRef(false)
const { preset, setPreset } = useKeyboardPreset()

const keyboardRows = computed(() => [
  {
    label: '方向',
    playerOne: preset.value === 'standard' ? '方向键 / W A S D' : '方向键',
    playerTwo: 'I K J L',
  },
  {
    label: 'A',
    playerOne: preset.value === 'standard' ? 'X' : 'A / Q',
    playerTwo: 'H',
  },
  {
    label: 'B',
    playerOne: preset.value === 'standard' ? 'Z' : 'S / O',
    playerTwo: 'G',
  },
  { label: 'SELECT', playerOne: 'Space', playerTwo: 'T' },
  { label: 'START', playerOne: 'Enter', playerTwo: 'Y' },
])

function selectPreset(value: KeyboardPreset) {
  setPreset(value)
}
</script>

<template>
  <button class="help-trigger" type="button" aria-label="操作帮助" @click="open = true">
    <i-mdi-help />
  </button>

  <Teleport to="body">
    <Transition name="help">
      <div v-if="open" class="help-overlay" @click.self="open = false">
        <div class="help-dialog" role="dialog" aria-modal="true" aria-label="操作说明">
          <h2 class="help-title">
            操作说明
          </h2>
          <div class="help-presets" role="group" aria-label="玩家 1 键位预设">
            <button
              class="help-preset"
              data-preset="standard"
              type="button"
              :aria-pressed="preset === 'standard'"
              @click="selectPreset('standard')"
            >
              标准
            </button>
            <button
              class="help-preset"
              data-preset="classic"
              type="button"
              :aria-pressed="preset === 'classic'"
              @click="selectPreset('classic')"
            >
              经典
            </button>
          </div>
          <p class="help-preset-note">
            标准支持 WASD；经典保留原 A/S 动作键。
          </p>
          <table class="help-table">
            <thead>
              <tr>
                <th>按键</th>
                <th>玩家 1</th>
                <th>玩家 2</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in keyboardRows" :key="row.label">
                <td>{{ row.label }}</td>
                <td>{{ row.playerOne }}</td>
                <td>{{ row.playerTwo }}</td>
              </tr>
            </tbody>
          </table>
          <ul class="help-notes">
            <li>移动端直接触摸手柄；橙色「连 A / 连 B」为连发键。</li>
            <li>功能栏：静音 · 存档 · 读档 · 重置 · 全屏。</li>
            <li>存档按游戏分别保存在浏览器本地，下次打开仍可读取。</li>
          </ul>
          <button class="help-close" type="button" @click="open = false">
            知道了
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.help-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 5px;
  color: var(--panel);
  background: var(--btn);
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: var(--case-red);
    color: #fff;
  }
}

.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
}

.help-dialog {
  width: 100%;
  max-width: 360px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(165deg, #fbf6e2, #ece2c2);
  box-shadow: 0 0 0 4px var(--case-red), 0 16px 40px rgba(0, 0, 0, 0.5);
  color: #1e1b16;
}

.help-title {
  margin: 0 0 14px;
  font-family: var(--font-pixel);
  font-size: 13px;
  color: var(--case-red);
  text-align: center;
}

.help-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.1);
}

.help-preset {
  padding: 7px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  font-size: 13px;
  cursor: pointer;

  &[aria-pressed="true"] {
    background: var(--case-red);
    color: #fff;
  }
}

.help-preset-note {
  margin: 7px 0 10px;
  color: #64748b;
  font-size: 11px;
  text-align: center;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    padding: 5px 6px;
    text-align: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }

  th {
    color: #474f51;
  }
}

.help-notes {
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.7;
  color: #475569;
}

.help-close {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: var(--case-red);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.help-enter-active,
.help-leave-active {
  transition: opacity 0.2s ease;
}

.help-enter-from,
.help-leave-to {
  opacity: 0;
}
</style>
