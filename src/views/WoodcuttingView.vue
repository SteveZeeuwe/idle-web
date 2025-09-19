<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import Minigame from '../minigames/Minigame.vue'
import { addWood, addFruit } from '../stores/inventory'
import { useTap } from '../composables/useTap'
import InventoryDrawer from '../components/InventoryDrawer.vue'
import { useRoute } from 'vue-router'
import { getField } from '../minigames/woodcutting/fields'

// Base world size and aspect
const BASE_W = 1800
const BASE_H = 1200
const ASPECT = BASE_W / BASE_H // 3:2
const BASE_TREES = 12
const PACKING_FACTOR = 1.15 // slight overhead for spacing/packing

const route = useRoute()
const fieldId = computed(() => route.params.fieldId as string | undefined)
const field = computed(() => getField(fieldId.value))

// Dynamic world size from tree count, min at base size
const treeCount = computed(() => field.value?.tree_amount ?? BASE_TREES)
const areaScale = computed(() => Math.max(1, (treeCount.value / BASE_TREES) * PACKING_FACTOR))
const worldW = computed(() => Math.round(Math.sqrt(BASE_W * BASE_H * areaScale.value * ASPECT)))
const worldH = computed(() => Math.round(worldW.value / ASPECT))

// World dimensions switched to 9:6 (3:2) logical space (now dynamic)
const GAP = 4 // visual gap between crown and stem
const MIN_BASE_DIST = 30 // minimum distance between tree bases
const RECT_MARGIN = 6 // extra margin to avoid visual overlap of crowns
const MIN_FRUIT = 3
const MAX_FRUIT = 7

// Pannable world state
const world = ref<HTMLDivElement | null>(null)
const viewport = ref<HTMLDivElement | null>(null)
const worldOffset = ref({ x: 0, y: 0 })
const viewportSize = ref({ w: 0, h: 0 })
const dragging = ref(false)
let dragStart = { x: 0, y: 0 }
let worldStart = { x: 0, y: 0 }
let ro: ResizeObserver | null = null

function clampOffset(x: number, y: number) {
  const maxX = Math.max(0, (worldW.value - viewportSize.value.w) / 2)
  const maxY = Math.max(0, (worldH.value - viewportSize.value.h) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  }
}

watch([worldW, worldH], () => {
  // Re-clamp when world size changes
  worldOffset.value = clampOffset(worldOffset.value.x, worldOffset.value.y)
})

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  // Start dragging regardless of whether the press began on a tree, to favor navigation
  dragging.value = true
  dragStart = { x: e.clientX, y: e.clientY }
  worldStart = { ...worldOffset.value }
  // No pointer capture to keep tree tap events working while allowing drag
}
function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  const next = clampOffset(worldStart.x + dx, worldStart.y + dy)
  worldOffset.value = next
}
function onPointerUp() {
  dragging.value = false
  // No pointer capture release needed
}

// Trees
type TreeState = 'alive' | 'trunk'
export type TreeProp = 'fruit'
interface Tree {
  id: number
  x: number // base center X within [0, WORLD_W]
  y: number // base Y within [0, WORLD_H]
  state: TreeState
  hits: number
  stemW: number
  stemH: number
  crownW: number
  crownH: number
  sizeFactor: number // 0..1 measure of overall tree size
  props: Set<TreeProp>
  fruits: { x: number; y: number; r: number }[]
}

// Property helpers
function hasProp(t: Tree, key: TreeProp) {
  return t.props.has(key)
}

// Field-driven property chances
const fruitChance = computed(() => field.value?.fruitChance ?? 0.25)

const trees = ref<Tree[]>([])
let nextTreeId = 1

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

// Triangular distribution to favor average sizes
function triangular(min: number, max: number, mode: number) {
  const u = Math.random()
  const c = (mode - min) / (max - min)
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min))
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
}

// Floating +x effects when resources are gained
const fxs = ref<{ id: number; x: number; y: number; amount: number; color: string }[]>([])
function spawnFx(
  x: number,
  y: number,
  amount: number,
  color = 'linear-gradient(90deg, #5a3b1f, #2d1f12)', // default wood swatch
) {
  const id = Date.now() + Math.random()
  fxs.value.push({ id, x, y, amount, color })
  setTimeout(() => {
    const i = fxs.value.findIndex((f) => f.id === id)
    if (i !== -1) fxs.value.splice(i, 1)
  }, 820)
}

// Fruit visuals (variable sizes and spacing)
const FRUIT_DIAM_MIN = 10
const FRUIT_DIAM_MAX = 20
const FRUIT_SPACING = 4
// Removed unused OVERHANG_MAX constant (per-fruit overhang now uses r * 0.25 inline)

// Generate non-overlapping fruit positions with variable sizes; allow bottom-only protrusion
function genFruitPositions(
  crownW: number,
  crownH: number,
  sizeFactor: number, // 0..1 (bigger tree => closer to 1)
  min = 5,
  max = 10,
) {
  // Bias count towards higher numbers for bigger trees
  const k = 2 - 1.5 * Math.min(1, Math.max(0, sizeFactor))
  const u = Math.random()
  const t = Math.pow(u, k)
  const target = Math.round(min + t * (max - min))
  const count = Math.max(min, Math.min(max, target))

  type Fruit = { x: number; y: number; r: number }
  const fruits: Fruit[] = []

  // Best-candidate sampling per fruit to spread more evenly
  const CANDIDATES = 14
  const MAX_OUTER = 1000
  let placed = 0
  let outer = 0

  const minDistToAll = (x: number, y: number, r: number) =>
    fruits.length === 0
      ? Infinity
      : Math.min(...fruits.map((f) => Math.hypot(f.x - x, f.y - y) - (f.r + r) - FRUIT_SPACING))

  while (placed < count && outer++ < MAX_OUTER) {
    let best: Fruit | null = null
    let bestScore = -Infinity

    for (let c = 0; c < CANDIDATES; c++) {
      const diam = FRUIT_DIAM_MIN + Math.random() * (FRUIT_DIAM_MAX - FRUIT_DIAM_MIN)
      const r = diam / 2
      // X must remain fully inside crown to avoid side protrusion
      const x = r + Math.random() * (crownW - 2 * r)
      // Y can extend below by up to 25% of its own size; no top protrusion
      const yMin = r
      const yMax = crownH + r * 0.25
      const y = yMin + Math.random() * (yMax - yMin)
      const score = minDistToAll(x, y, r)
      if (score > bestScore) {
        bestScore = score
        best = { x, y, r }
      }
    }

    if (best && bestScore > 0) {
      fruits.push(best)
      placed++
    }
  }

  return fruits
}

function genTrees(n = treeCount.value) {
  const arr: Tree[] = []
  const PAD = 8 // padding from the field edges

  type Rect = { x1: number; y1: number; x2: number; y2: number }
  const rects: Rect[] = []
  const intersects = (a: Rect, b: Rect, m = 0) =>
    !(a.x2 + m <= b.x1 || a.x1 >= b.x2 + m || a.y2 + m <= b.y1 || a.y1 >= b.y2 + m)

  for (let i = 0; i < n; i++) {
    let stemW = 0,
      stemH = 0,
      crownW = 0,
      crownH = 0

    // Generate a total height 100..500 with a mode at the midpoint (~300)
    const totalH = Math.round(triangular(100, 500, 300))
    // Allocate ~40-60% to stem, remainder to crown
    stemH = Math.max(24, Math.round(totalH * rand(0.4, 0.6)))
    crownH = Math.max(24, totalH - stemH - GAP)
    // Widths proportional to heights
    stemW = Math.max(12, Math.round(stemH * rand(0.22, 0.32)))
    crownW = Math.max(40, Math.round(crownH * rand(1.2, 1.8)))

    const maxW = Math.max(stemW, crownW)
    const fullH = stemH + crownH + GAP

    // choose a base point fully inside the field accounting for the full bounding box
    const minX = maxW / 2 + PAD
    const maxX = worldW.value - maxW / 2 - PAD
    const minY = fullH + PAD // top of tree >= 0
    const maxY = worldH.value - PAD // base inside bottom

    let x = 0,
      y = 0
    let attempts = 0
    const MAX_ATTEMPTS = Math.max(3000, n * 400)

    // rejection sampling to enforce minimum spacing between bases AND no bounding box overlap
    attemptLoop: do {
      x = rand(minX, maxX)
      y = rand(minY, maxY)
      attempts++
      if (attempts > MAX_ATTEMPTS) break

      // Check base distance spacing first
      for (const t of arr) {
        if (Math.hypot(t.x - x, t.y - y) < MIN_BASE_DIST) continue attemptLoop
      }

      // Compute bounding rect and check against all existing
      const rect: Rect = { x1: x - maxW / 2, y1: y - fullH, x2: x + maxW / 2, y2: y }
      for (const r of rects) {
        if (intersects(rect, r, RECT_MARGIN)) continue attemptLoop
      }

      // If we reach here, placement is valid; store rect and exit loop
      rects.push(rect)
      break
    } while (true)

    if (attempts > MAX_ATTEMPTS) {
      console.warn('Tree placement: exceeded attempts, skipping index', i)
      continue
    }

    // Assign properties using field-driven chances
    const props = new Set<TreeProp>()
    if (Math.random() < fruitChance.value) props.add('fruit')
    const sizeFactor = Math.min(1, Math.max(0, (totalH - 100) / (500 - 100)))
    const fruits = props.has('fruit')
      ? genFruitPositions(crownW, crownH, sizeFactor, MIN_FRUIT, MAX_FRUIT)
      : []

    arr.push({
      id: nextTreeId++,
      x,
      y,
      state: 'alive',
      hits: 0,
      stemW,
      stemH,
      crownW,
      crownH,
      sizeFactor,
      props,
      fruits,
    })
  }
  trees.value = arr
}

const open = ref(false)
const openTap = useTap(() => (open.value = true), { trigger: 'down' })

// Bigger trees should have a higher chance to drop the higher fruit amounts
function fruitGainFor(t: Tree) {
  // scale 0..1 — larger trees skew towards +3
  const s = Math.min(1, Math.max(0, t.sizeFactor))
  const p3 = 0.2 + 0.5 * s // 20%..70%
  const p2 = 0.55 - 0.25 * s // 55%..30%
  const r = Math.random()
  if (r < p3) return 3
  if (r < p3 + p2) return 2
  return 1
}

function tapTree(t: Tree) {
  if (t.state === 'trunk') return
  t.hits++
  // Shake via CSS class toggle
  const el = document.getElementById('tree-' + t.id)
  if (el) {
    el.classList.remove('shake')
    // force reflow
    void el.clientWidth
    el.classList.add('shake')
  }
  if (t.hits >= 5) {
    t.state = 'trunk'
    addWood(3)
    // Visualize wood gain
    spawnFx(t.x, t.y - (t.stemH + t.crownH), 3, 'linear-gradient(90deg, #5a3b1f, #2d1f12)')
    // Grant and visualize fruit if the tree has the fruit property
    if (hasProp(t, 'fruit')) {
      const fruitGain = fruitGainFor(t)
      addFruit(fruitGain)
      // Slight offset so wood/fruit FX don't overlap
      spawnFx(t.x + 16, t.y - (t.stemH + t.crownH) + 8, fruitGain, '#b50606')
    }
  }
}

// Map of per-tree tap handlers so state persists across events
const tapMap = new Map<number, ReturnType<typeof useTap>>()
function getTreeTap(t: Tree) {
  let h = tapMap.get(t.id)
  if (!h) {
    h = useTap(() => tapTree(t), {
      trigger: 'up',
      // Ensure the same logical target/state from down->up
      getToken: () => `${t.id}:${t.hits}:${t.state}`,
      tolerancePx: 12,
    })
    tapMap.set(t.id, h)
  }
  return h
}

// init
if (trees.value.length === 0) genTrees(treeCount.value)

// Re-generate trees when fieldId changes (deep link or in-app nav)
watch(
  () => fieldId.value,
  () => {
    trees.value = []
    nextTreeId = 1
    genTrees(treeCount.value)
  },
)

onMounted(() => {
  if (viewport.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => {
      const el = viewport.value as HTMLDivElement
      viewportSize.value = { w: el.clientWidth, h: el.clientHeight }
      // keep current offset within bounds when size changes
      worldOffset.value = clampOffset(worldOffset.value.x, worldOffset.value.y)
    })
    ro.observe(viewport.value)
    // initialize size immediately
    const el = viewport.value as HTMLDivElement
    viewportSize.value = { w: el.clientWidth, h: el.clientHeight }
    worldOffset.value = clampOffset(worldOffset.value.x, worldOffset.value.y)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
})
</script>

<template>
  <Minigame :back-to="{ name: 'woodcutting' }">
    <div
      ref="viewport"
      class="wc-viewport"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        ref="world"
        class="wc-world"
        :style="{
          transform: `translate(${-worldW / 2 + worldOffset.x}px, ${-worldH / 2 + worldOffset.y}px)`,
          width: worldW + 'px',
          height: worldH + 'px',
        }"
      >
        <!-- 9:6 background ground -->
        <div class="ground" />
        <!-- trees -->
        <button
          v-for="t in trees"
          :key="t.id"
          :id="'tree-' + t.id"
          class="tree"
          :class="{ trunk: t.state === 'trunk' }"
          :style="
            {
              left: `${t.x}px`,
              top: `${t.y}px`,
              '--stem-w': t.stemW + 'px',
              '--stem-h': t.stemH + 'px',
              '--crown-w': t.crownW + 'px',
              '--crown-h': t.crownH + 'px',
            } as any
          "
          @pointerdown="getTreeTap(t).onPointerDown"
          @pointerup="getTreeTap(t).onPointerUp"
          @pointercancel="getTreeTap(t).onPointerCancel"
          @pointerleave="getTreeTap(t).onPointerLeave"
          @click="getTreeTap(t).onClick"
          @keydown="getTreeTap(t).onKeyDown"
        >
          <!-- crown above trunk -->
          <span class="crown">
            <span
              v-for="(f, i) in t.fruits"
              :key="t.id + '-fruit-' + i"
              class="fruit"
              :style="{
                left: f.x - f.r + 'px',
                top: f.y - f.r + 'px',
                width: 2 * f.r + 'px',
                height: 2 * f.r + 'px',
              }"
              aria-hidden="true"
            />
          </span>
          <span class="stem" />
        </button>

        <!-- floating +x effects -->
        <div
          v-for="f in fxs"
          :key="f.id"
          class="wc-fx"
          :style="{ left: f.x + 'px', top: f.y + 'px' }"
        >
          <span class="fx-text">+{{ f.amount }}</span>
          <span class="fx-swatch" :style="{ background: f.color }" />
        </div>
      </div>
    </div>

    <button
      class="btn inventory-btn"
      aria-label="Open inventory"
      @pointerdown="openTap.onPointerDown"
      @pointerup="openTap.onPointerUp"
      @pointercancel="openTap.onPointerCancel"
      @pointerleave="openTap.onPointerLeave"
      @click="openTap.onClick"
    >
      Inventory
    </button>
    <InventoryDrawer :open="open" @close="open = false" />
  </Minigame>
</template>

<style scoped>
.wc-viewport {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden; /* we pan the inner world */
  touch-action: none; /* allow free panning */
  background: radial-gradient(circle at 30% 20%, #1a2d16, #0e1a0b 60%);
}
.wc-world {
  position: absolute;
  left: 50%;
  top: 50%;
  will-change: transform;
}
.ground {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 600px at 30% 30%, rgba(255, 255, 255, 0.04), transparent 60%),
    linear-gradient(0deg, rgba(20, 60, 24, 0.6), rgba(20, 60, 24, 0.6)),
    repeating-linear-gradient(45deg, rgba(32, 78, 34, 0.3) 0 6px, rgba(28, 66, 30, 0.3) 6px 12px),
    radial-gradient(circle at 50% 50%, #214d2a, #15351b 70%);
  border-radius: 24px;
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.15);
}
.tree {
  position: absolute;
  transform: translate(-50%, -100%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  padding: 0;
}
.tree .stem {
  width: var(--stem-w, 18px);
  height: var(--stem-h, 40px);
  background: #6d4428;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}
.tree .crown {
  width: var(--crown-w, 56px);
  height: var(--crown-h, 24px);
  background: #2c7a39;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: visible; /* allow bottom-only protrusion */
}
.tree.trunk .crown {
  display: none;
}
.tree.trunk .stem {
  height: 28px;
}

/* shake animation */
.tree.shake {
  animation: shake 120ms ease-in-out;
}
@keyframes shake {
  0% {
    transform: translate(-50%, -100%) rotate(0deg);
  }
  25% {
    transform: translate(-50%, -100%) rotate(-4deg);
  }
  50% {
    transform: translate(-50%, -100%) rotate(4deg);
  }
  75% {
    transform: translate(-50%, -100%) rotate(-2deg);
  }
  100% {
    transform: translate(-50%, -100%) rotate(0deg);
  }
}

/* Floating +x effect, similar to mining */
@keyframes fx-popfade {
  0% {
    transform: translate(-50%, -100%) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -100%) translateY(-16px);
    opacity: 0;
  }
}
.wc-fx {
  position: absolute;
  transform: translate(-50%, -100%);
  top: 0;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem; /* was 6px */
  padding: 0.25rem 0.5rem; /* was 2px 6px */
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  line-height: 1;
  font-size: 1.2rem; /* explicit and larger for visibility */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  animation: fx-popfade 800ms ease-out forwards;
}
.fx-text {
  opacity: 0.95;
}
.fx-swatch {
  width: 0.7rem; /* was 10px */
  height: 0.7rem; /* was 10px */
  border-radius: 2px;
  /* background set inline per FX */
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
}

.fruit {
  position: absolute;
  border-radius: 50%;
  background: #b50606; /* solid color */
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
}

.inventory-btn {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  z-index: 20;
}
</style>
