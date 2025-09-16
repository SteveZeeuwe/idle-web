<script setup lang="ts">
import { mines, stoneChance } from './mines'
import { gemColors } from '../../stores/inventory'
import Minigame from '../Minigame.vue'
import { addMine } from './mines'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

function gemEntries(mine: (typeof mines)[number]) {
  return gemColors.filter((gc) => mine.gemRates[gc.name as keyof typeof mine.gemRates] != null)
}
function gemRate(mine: (typeof mines)[number], name: string) {
  return mine.gemRates[name as keyof typeof mine.gemRates] ?? 0
}

const creating = ref(false)
const form = ref({
  name: '',
  length: 200,
  rates: Object.fromEntries(gemColors.map((g) => [g.name, 0])) as Record<string, number>,
})
const router = useRouter()

function startCreate() {
  creating.value = true
}
function cancelCreate() {
  creating.value = false
}
function submitCreate() {
  const gemRates: Record<string, number> = {}
  for (const g of gemColors) {
    const v = Number(form.value.rates[g.name]) || 0
    if (v > 0) gemRates[g.name] = v / 100
  }
  const mine = addMine({
    name: form.value.name || 'Custom Mine',
    length: Math.max(1, Number(form.value.length) || 200),
    gemRates,
  })
  creating.value = false
  router.push({ name: 'mine-play', params: { mineId: mine.id } })
}
</script>

<template>
  <Minigame :back-to="{ name: 'home' }">
    <main class="mines-overview">
      <h1>Mines</h1>
      <section class="cards">
        <!-- Create card -->
        <div class="card create-card">
          <template v-if="!creating">
            <button class="create-btn" @click="startCreate" aria-label="Create new mine">
              + Create Mine
            </button>
          </template>
          <template v-else>
            <div class="form-row">
              <label>Name</label>
              <input v-model="form.name" placeholder="Custom Mine" />
            </div>
            <div class="form-row">
              <label>Rows</label>
              <input v-model.number="form.length" type="number" min="1" step="1" />
            </div>
            <div class="form-grid">
              <div v-for="g in gemColors" :key="g.name" class="form-row">
                <label
                  ><span class="swatch" :style="{ backgroundColor: g.color }" />
                  {{ g.name }} %</label
                >
                <input
                  v-model.number="form.rates[g.name]"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn" @click="submitCreate">Add</button>
              <button class="btn" @click="cancelCreate">Cancel</button>
            </div>
          </template>
        </div>

        <RouterLink
          v-for="m in mines"
          :key="m.id"
          class="card"
          :to="{ name: 'mine-play', params: { mineId: m.id } }"
          :aria-label="'Enter ' + m.name"
        >
          <div class="card-head">
            <h2>{{ m.name }}</h2>
            <p class="length">Rows: {{ m.length }}</p>
          </div>
          <div class="resources">
            <template v-if="gemEntries(m).length">
              <div v-for="g in gemEntries(m)" :key="g.name" class="res">
                <span class="swatch" :style="{ backgroundColor: g.color }" />
                <span class="r-name">{{ g.name }}</span>
                <span class="r-rate">{{ (gemRate(m, g.name) * 100).toFixed(1) }}%</span>
              </div>
            </template>
            <div v-else class="empty">No gems reported.</div>
            <!-- Stone chance -->
            <div class="res">
              <span class="swatch" :style="{ background: 'linear-gradient(90deg,#bbb,#666)' }" />
              <span class="r-name">Stone</span>
              <span class="r-rate">{{ (stoneChance(m) * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </RouterLink>
      </section>
    </main>
  </Minigame>
</template>

<style scoped>
.mines-overview {
  min-height: 100vh;
  padding: 60px 16px 16px;
  background: radial-gradient(circle at 30% 20%, #16181d, #0f1116 60%);
  color: #e7e7e7;
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding-bottom: 16px;
}

.card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  background: #1a1d22;
  border-radius: 12px;
  padding: 12px 14px 14px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.card:hover {
  filter: brightness(1.05);
}

.card:active {
  transform: scale(0.995);
}

.card-head {
  margin: 0 0 8px;
}

.card-head h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
}

.card-head .length {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.75;
}

.resources {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 10px;
}

.res {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
}
.r-rate {
  font-weight: 600;
}
.empty {
  font-size: 0.9rem;
  opacity: 0.7;
}

.create-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  justify-content: center;
}
.create-btn {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: #2a2f39;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
}
.form-row label {
  opacity: 0.85;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}
.form-actions {
  display: flex;
  gap: 8px;
}
.swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
}
</style>
