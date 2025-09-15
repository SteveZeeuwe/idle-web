<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { COLS, randomCell, addToInventory, type CellData } from '../../stores/inventory'
import MiningRow from './MiningRow.vue'
import type { MineDefinition } from './mines'
import { randomCellForMine } from './mines'

const props = defineProps<{ mine?: MineDefinition | null }>()

export type Row = CellData[]

const COL_GAP = 2
const ROW_GAP = 2

const scrollContainer = ref<HTMLElement | null>(null)
const rows = ref<Row[]>([])
const topSpacerPx = ref(0)
const maxRowsInDom = 100
const batchAppend = 40
const bottomThresholdPx = 600

let ro: ResizeObserver | null = null
let rowPx = 0

function recomputeRowHeight() {
  if (!scrollContainer.value) return
  const cw = scrollContainer.value.clientWidth
  const cellW = (cw - (COLS - 1) * COL_GAP) / COLS
  rowPx = cellW + ROW_GAP
}

function makeRows(n: number) {
  for (let i = 0; i < n; i++) {
    if (props.mine && totalRowsGenerated.value >= props.mine.length) return
    const row: Row = Array.from({ length: COLS }, () =>
      props.mine ? randomCellForMine(props.mine) : randomCell(),
    )
    rows.value.push(row)
    totalRowsGenerated.value++
  }
}

const totalRowsGenerated = ref(0)
const reachedBottom = computed(() => !!props.mine && totalRowsGenerated.value >= props.mine.length)

function ensureFilled() {
  const el = scrollContainer.value
  if (!el) return
  if (reachedBottom.value) return
  const nearBottom = el.scrollTop + el.clientHeight > el.scrollHeight - bottomThresholdPx
  if (nearBottom) {
    makeRows(batchAppend)
    trimTopIfNeeded()
  }
}

let fillScheduled = false
function scheduleEnsureFilled() {
  if (fillScheduled) return
  fillScheduled = true
  requestAnimationFrame(() => {
    fillScheduled = false
    ensureFilled()
  })
}

function trimTopIfNeeded() {
  const el = scrollContainer.value
  if (!el || rowPx === 0) return
  if (rows.value.length <= maxRowsInDom) return
  const toRemove = rows.value.length - maxRowsInDom
  rows.value.splice(0, toRemove)
  topSpacerPx.value += toRemove * rowPx
  el.scrollTop -= toRemove * rowPx
}

function mineCell(rIdx: number, cIdx: number) {
  const cell = rows.value[rIdx][cIdx]
  addToInventory(cell)
  rows.value[rIdx][cIdx] = props.mine ? randomCellForMine(props.mine) : randomCell()
}

function onScroll() {
  // Allow free scrolling; just ensure we append more rows when near the bottom
  scheduleEnsureFilled()
}

onMounted(() => {
  recomputeRowHeight()
  const el = scrollContainer.value
  if (el) {
    const vh = el.clientHeight || window.innerHeight
    const cw = el.clientWidth || 0
    const rowGuess = cw ? cw / COLS + ROW_GAP : 64
    const rowsNeeded = Math.ceil(vh / rowGuess) + 30
    makeRows(rowsNeeded)
  } else {
    makeRows(60)
  }

  if (el && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => {
      const prevRowPx = rowPx
      recomputeRowHeight()
      if (prevRowPx > 0 && rowPx > 0) {
        const ratio = rowPx / prevRowPx
        topSpacerPx.value *= ratio
      }
    })
    ro.observe(el)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
})

watch(
  () => props.mine,
  () => {
    // reset when mine changes
    rows.value = []
    topSpacerPx.value = 0
    totalRowsGenerated.value = 0
    makeRows(40)
  },
)
</script>

<template>
  <div
    ref="scrollContainer"
    tabindex="0"
    class="grid-scroll"
    @scroll="onScroll"
    :style="{ '--col-gap': COL_GAP + 'px', '--row-gap': ROW_GAP + 'px' }"
  >
    <div :style="{ height: topSpacerPx + 'px' }" />
    <div class="grid">
      <template v-for="(row, rIdx) in rows" :key="'r' + rIdx">
        <MiningRow :r-idx="rIdx" :row="row" @mine="mineCell" />
      </template>
    </div>
    <div v-if="reachedBottom" class="end-marker">Reached Bottom</div>
    <div v-else class="bottom-spacer" />
  </div>
</template>

<style scoped>
.grid-scroll {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  background: rgb(227, 224, 209);
  /* Allow normal touch scrolling in both directions */
  touch-action: auto;
  -webkit-overflow-scrolling: touch;
  user-select: none;
}

.grid {
  width: 100%;
  display: block;
}

.bottom-spacer {
  height: 24px;
}

.end-marker {
  text-align: center;
  padding: 24px 0 60px;
  font-weight: 700;
  font-family: var(--font-heading);
  color: #222;
}
</style>
