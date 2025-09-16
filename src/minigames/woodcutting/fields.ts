// filepath: src/minigames/woodcutting/fields.ts
export interface FieldDefinition {
  id: string
  name: string
  tree_amount: number // number of trees to spawn in the field
  fruitChance: number // 0..1 chance that a tree has the 'fruit' property
}

// Sample fields
export const fields: FieldDefinition[] = [
  { id: 'grove', name: 'Quiet Grove', tree_amount: 12, fruitChance: 0.25 },
  { id: 'savannah', name: "Savannah's Edge", tree_amount: 14, fruitChance: 0.35 },
  { id: 'highland', name: 'Northern Highlands', tree_amount: 16, fruitChance: 0.2 },
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

// Create a new field at runtime. Generates a unique id from the name and pushes to the list.
export function addField(input: {
  name: string
  tree_amount: number
  fruitChance: number
}): FieldDefinition {
  const base =
    (input.name || 'field')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'field'
  let id = base
  let i = 1
  while (fields.some((f) => f.id === id)) id = `${base}-${i++}`
  const field: FieldDefinition = { id, ...input }
  field.fruitChance = Math.max(
    0,
    Math.min(1, Number.isFinite(field.fruitChance) ? field.fruitChance : 0),
  )
  field.tree_amount = Math.max(
    1,
    Math.floor(Number.isFinite(field.tree_amount) ? field.tree_amount : 1),
  )
  fields.push(field)
  return field
}
