// Shared inventory/state and helpers for mining game
import { reactive } from 'vue'

export const COLS = 6

export const stoneGreys = [
  'hsl(0, 0%, 80%)',
  'hsl(0, 0%, 70%)',
  'hsl(0, 0%, 60%)',
  'hsl(0, 0%, 50%)',
  'hsl(0, 0%, 40%)',
]

export type GemName = 'Ruby' | 'Topaz' | 'Opal' | 'Jade' | 'Sapphire' | 'Emerald' | 'Diamond'

export const gemColors: { name: GemName; color: string }[] = [
  { name: 'Ruby', color: 'hsl(0, 80%, 55%)' },
  { name: 'Topaz', color: 'hsl(45, 90%, 60%)' },
  { name: 'Opal', color: 'hsl(200, 80%, 85%)' },
  { name: 'Jade', color: 'hsl(140, 50%, 50%)' },
  { name: 'Sapphire', color: 'hsl(220, 80%, 60%)' },
  { name: 'Emerald', color: 'hsl(160, 70%, 55%)' },
  { name: 'Diamond', color: 'hsl(190, 30%, 95%)' },
]

let nextId = 1

export type CellKind = 'stone' | 'gem'
export interface CellData {
  id: number
  kind: CellKind
  color: string
  name?: GemName
  // New: how many more times this block can be mined before disabling
  remaining: number // 2..5
  disabled?: boolean
}

function randomRemaining() {
  return 2 + Math.floor(Math.random() * 4) // 2..5
}

export function randomCell(gemChance = 0.15): CellData {
  if (Math.random() < gemChance) {
    const g = gemColors[(Math.random() * gemColors.length) | 0]
    return {
      id: nextId++,
      kind: 'gem',
      color: g.color,
      name: g.name,
      remaining: randomRemaining(),
      disabled: false,
    }
  } else {
    const grey = stoneGreys[(Math.random() * stoneGreys.length) | 0]
    return {
      id: nextId++,
      kind: 'stone',
      color: grey,
      remaining: randomRemaining(),
      disabled: false,
    }
  }
}

type GemCounts = Record<GemName, number>
const emptyGemCounts: GemCounts = {
  Ruby: 0,
  Topaz: 0,
  Opal: 0,
  Jade: 0,
  Sapphire: 0,
  Emerald: 0,
  Diamond: 0,
}

export const inventory = reactive({
  stone: 0,
  wood: 0, // new: wood gathered from woodcutting
  fruit: 0, // new: fruit from fruit-bearing trees
  gems: { ...emptyGemCounts } as GemCounts,
})

export function addToInventory(cell: CellData) {
  if (cell.kind === 'stone') {
    inventory.stone++
  } else if (cell.name) {
    inventory.gems[cell.name]++
  }
}

// New helper for woodcutting minigame
export function addWood(count = 1) {
  inventory.wood += count
}

// New helper for fruit collection
export function addFruit(count = 1) {
  inventory.fruit += count
}

// Allow tests or future features to reset inventory counts
export function resetInventory() {
  inventory.stone = 0
  inventory.wood = 0
  inventory.fruit = 0
  ;(Object.keys(inventory.gems) as (keyof typeof inventory.gems)[]).forEach((k) => {
    inventory.gems[k] = 0
  })
}
