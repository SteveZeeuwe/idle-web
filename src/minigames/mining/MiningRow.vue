<script setup lang="ts">
import MiningCell from './MiningCell.vue'
import type { CellData } from '../../stores/inventory'

const props = defineProps<{
  rIdx: number
  row: CellData[]
}>()

const emit = defineEmits<{
  (e: 'mine', rIdx: number, cIdx: number): void
}>()
</script>

<template>
  <div class="row">
    <MiningCell
      v-for="(cell, cIdx) in props.row"
      :key="'c-' + props.rIdx + '-' + cIdx"
      :r-idx="props.rIdx"
      :c-idx="cIdx"
      :cell="cell"
      @mine="() => emit('mine', props.rIdx, cIdx)"
    />
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--col-gap, 2px);
  margin-bottom: var(--row-gap, 2px);
}
</style>
