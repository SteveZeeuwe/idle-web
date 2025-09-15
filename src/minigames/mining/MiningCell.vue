<script setup lang="ts">
import { ref } from 'vue'
import type { CellData } from '../../stores/inventory'
import { useTap } from '../../composables/useTap'

const props = defineProps<{ rIdx: number; cIdx: number; cell: CellData }>()
const emit = defineEmits<{ (e: 'mine', rIdx: number, cIdx: number, cell: CellData): void }>()

// +1 FX
const fxs = ref<{ id: number; color: string }[]>([])
function spawnFx(color: string) {
  const id = Date.now() + Math.random()
  fxs.value.push({ id, color })
  setTimeout(() => {
    const i = fxs.value.findIndex((f) => f.id === id)
    if (i !== -1) fxs.value.splice(i, 1)
  }, 820)
}

const tap = useTap(
  () => {
    spawnFx(props.cell.color)
    emit('mine', props.rIdx, props.cIdx, props.cell)
  },
  {
    trigger: 'up',
    getToken: () => props.cell.id,
    tolerancePx: 12,
  },
)
</script>

<template>
  <button
    class="cell"
    :style="{ backgroundColor: props.cell.color }"
    aria-label="Mine block"
    @pointerdown="tap.onPointerDown"
    @pointerup="tap.onPointerUp"
    @pointercancel="tap.onPointerCancel"
    @pointerleave="tap.onPointerLeave"
    @click="tap.onClick"
  >
    <div class="cell-fx-wrap">
      <div v-for="f in fxs" :key="f.id" class="cell-fx">
        <span class="fx-text">+1</span>
        <span class="fx-swatch" :style="{ backgroundColor: f.color }" />
      </div>
    </div>
  </button>
</template>

<style scoped>
.cell {
  position: relative; /* anchor in-cell FX */
  appearance: none;
  border: none;
  width: 100%;
  aspect-ratio: 1 / 1; /* perfect squares */
  padding: 0;
  margin: 0;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  transition:
    transform 60ms ease,
    filter 120ms ease;
  border-radius: 4px; /* rounded corners */
  touch-action: manipulation; /* faster taps on mobile */
  -webkit-tap-highlight-color: transparent;
}
.cell:active {
  transform: scale(0.97);
  filter: brightness(0.95);
}

/* In-cell FX anchored to top-right */
.cell-fx-wrap {
  pointer-events: none;
  position: absolute;
  inset: 0;
}
@keyframes fx-popfade {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-16px);
    opacity: 0;
  }
}
.cell-fx {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  animation: fx-popfade 800ms ease-out forwards;
}
.fx-text {
  opacity: 0.95;
}
.fx-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
}
</style>
