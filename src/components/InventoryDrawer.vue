<script setup lang="ts">
import { computed } from 'vue'
import { inventory, gemColors } from '../stores/inventory'
import { useTap } from '../composables/useTap'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const gemList = computed(() =>
  gemColors
    .map((g) => ({ name: g.name, color: g.color, count: inventory.gems[g.name] }))
    .filter((g) => g.count > 0),
)

const closeTap = useTap(() => emit('close'), { trigger: 'down' })
</script>

<template>
  <div class="sheet" :class="{ open: props.open }" role="dialog" aria-modal="true">
    <header class="sheet-header">
      <h3>Inventory</h3>
      <button
        class="close"
        aria-label="Close"
        @pointerdown="closeTap.onPointerDown"
        @pointerup="closeTap.onPointerUp"
        @pointercancel="closeTap.onPointerCancel"
        @pointerleave="closeTap.onPointerLeave"
        @click="closeTap.onClick"
      >
        ✕
      </button>
    </header>

    <div class="content">
      <div class="stat" v-if="inventory.stone > 0">
        <div class="swatch" :style="{ background: 'linear-gradient(90deg, #bbb, #666)' }" />
        <div class="name">Stone</div>
        <div class="count">{{ inventory.stone }}</div>
      </div>
      <div class="stat" v-if="inventory.wood > 0">
        <div class="swatch" :style="{ background: 'linear-gradient(90deg, #5a3b1f, #2d1f12)' }" />
        <div class="name">Wood</div>
        <div class="count">{{ inventory.wood }}</div>
      </div>
      <div class="stat" v-if="inventory.fruit > 0">
        <div class="swatch" :style="{ background: 'linear-gradient(90deg, #ff9090, #d71818)' }" />
        <div class="name">Fruit</div>
        <div class="count">{{ inventory.fruit }}</div>
      </div>

      <div
        class="divider"
        v-if="gemList.length && (inventory.stone > 0 || inventory.wood > 0 || inventory.fruit > 0)"
      ></div>

      <div class="gems" v-if="gemList.length">
        <div v-for="g in gemList" :key="g.name" class="stat">
          <div class="swatch" :style="{ backgroundColor: g.color }" />
          <div class="name">{{ g.name }}</div>
          <div class="count">{{ g.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  transform: translateY(100%);
  transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
  background: #1a1d22;
  color: #e7e7e7;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.35);
  z-index: 30;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  will-change: transform;
}
.sheet.open {
  transform: translateY(0);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.sheet-header h3 {
  margin: 0;
}
.close {
  background: transparent;
  border: none;
  color: #e7e7e7;
  cursor: pointer;
}

.content {
  padding: 12px 14px 20px;
  overflow: auto;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 8px 0 12px;
}

.gems {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.stat {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.name {
  opacity: 0.9;
}

.count {
  font-weight: 700;
}
</style>
