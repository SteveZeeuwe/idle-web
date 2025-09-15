// Definitions for different mines with their own length and gem distribution
import { gemColors, type GemName, type CellData } from '../../stores/inventory'

export interface MineDefinition {
  id: string
  name: string
  length: number
  gemRates: Partial<Record<GemName, number>>
  description?: string
}

export const mines: MineDefinition[] = [
  {
    id: 'shallow',
    name: 'Shallow Vein',
    length: 150,
    gemRates: {
      Ruby: 0.04,
      Topaz: 0.03,
      Jade: 0.02,
      Sapphire: 0.01,
      Emerald: 0.015,
      Diamond: 0.005,
    },
    description: 'A modest shaft with a few bright surprises.',
  },
  {
    id: 'balanced',
    name: 'Gem Garden',
    length: 200,
    gemRates: {
      Ruby: 0.12,
      Topaz: 0.12,
      Opal: 0.12,
      Jade: 0.12,
      Sapphire: 0.12,
      Emerald: 0.12,
      Diamond: 0.12,
    },
    description: 'Even distribution — every gem appears with equal rarity.',
  },
  {
    id: 'deep-crystal',
    name: 'Deep Crystal Pit',
    length: 250,
    gemRates: {
      Ruby: 0.03,
      Topaz: 0.025,
      Opal: 0.015,
      Jade: 0.02,
      Sapphire: 0.025,
      Emerald: 0.02,
      Diamond: 0.05,
    },
    description: 'Long descent; richer Diamond pockets reported.',
  },
  {
    id: 'no-ruby',
    name: 'Azure Hollow',
    length: 200,
    gemRates: {
      Topaz: 0.03,
      Opal: 0.035,
      Jade: 0.025,
      Sapphire: 0.04,
      Emerald: 0.03,
      Diamond: 0.01,
    },
    description: 'Ruby is absent; blues and greens dominate.',
  },
]

export function getMine(id: string | undefined): MineDefinition | undefined {
  return mines.find((m) => m.id === id)
}

export function totalGemChance(mine: MineDefinition) {
  return Object.values(mine.gemRates).reduce((s, v) => s + (v ?? 0), 0)
}

// Validate configs (dev aid)
for (const m of mines) {
  const t = totalGemChance(m)
  if (t > 1) {
    console.warn(
      `[mine-config] Total gem chance > 100% in '${m.id}' (${(t * 100).toFixed(2)}%) — values will overflow; adjust.`,
    )
  }
}

// The gemRates are ABSOLUTE probabilities (not normalized). A value of 0.05 means
// every cell independently has a 5% chance to be that gem. Outcomes are mutually
// exclusive; the first matched cumulative interval wins. Stone fills the remainder.
export function randomCellForMine(mine: MineDefinition): CellData {
  const entries = Object.entries(mine.gemRates) as [GemName, number][]
  // Stable order: sort by name (optional) to avoid relying on object insertion
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  const r = Math.random()
  let acc = 0
  for (const [gName, p] of entries) {
    if (p <= 0) continue
    const nextAcc = acc + p
    if (r < nextAcc) {
      const g = gemColors.find((g) => g.name === gName)!
      return { id: Date.now() + Math.random(), kind: 'gem', color: g.color, name: g.name }
    }
    acc = nextAcc
  }
  // Stone fallback
  const greyShades = [
    'hsl(0,0%,80%)',
    'hsl(0,0%,70%)',
    'hsl(0,0%,60%)',
    'hsl(0,0%,50%)',
    'hsl(0,0%,40%)',
  ]
  const grey = greyShades[(Math.random() * greyShades.length) | 0]
  return { id: Date.now() + Math.random(), kind: 'stone', color: grey }
}

export function stoneChance(mine: MineDefinition) {
  const t = totalGemChance(mine)
  return t >= 1 ? 0 : 1 - t
}
