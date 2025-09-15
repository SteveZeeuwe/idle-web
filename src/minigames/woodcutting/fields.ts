// filepath: src/minigames/woodcutting/fields.ts
export interface FieldDefinition {
  id: string
  name: string
  length: number // number of rows (finite)
  fruitChance: number // 0..1 chance that a tree has the 'fruit' property
}

// Sample fields
export const fields: FieldDefinition[] = [
  { id: 'grove', name: 'Quiet Grove', length: 300, fruitChance: 0.25 },
  { id: 'savannah', name: "Savannah's Edge", length: 240, fruitChance: 0.35 },
  { id: 'highland', name: 'Northern Highlands', length: 360, fruitChance: 0.2 },
]

export function getField(id?: string) {
  return fields.find((f) => f.id === id)
}

export function validateField(field: FieldDefinition) {
  if (field.fruitChance < 0 || field.fruitChance > 1) {
    console.warn(`Field ${field.name} has invalid fruitChance ${field.fruitChance}; expected 0..1.`)
  }
}

fields.forEach(validateField)
