// filepath: src/minigames/woodcutting/FieldsOverview.vue
<script setup lang="ts">
import Minigame from '../Minigame.vue'
import { fields } from './fields'
</script>

<template>
  <Minigame :back-to="{ name: 'home' }">
    <main class="fields-overview">
      <h1>Fields</h1>
      <section class="cards">
        <RouterLink
          v-for="f in fields"
          :key="f.id"
          class="card"
          :to="{ name: 'field-play', params: { fieldId: f.id } }"
          :aria-label="'Enter ' + f.name"
        >
          <div class="card-head">
            <h2>{{ f.name }}</h2>
            <p class="length">Rows: {{ f.length }}</p>
          </div>
          <div class="stats">
            <div class="stat">
              <span class="swatch" style="background: linear-gradient(90deg, #ff9090, #d71818)" />
              <span class="label">Fruit chance</span>
              <span class="value">{{ (f.fruitChance * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </RouterLink>
      </section>
    </main>
  </Minigame>
</template>

<style scoped>
.fields-overview {
  min-height: 100vh;
  height: 100dvh;
  padding: 60px 16px 16px;
  box-sizing: border-box;
  background: radial-gradient(circle at 30% 20%, #1a2d16, #0e1a0b 60%);
  color: #e7e7e7;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
  background: #162415;
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
.stats {
  display: grid;
  gap: 8px;
}
.stat {
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
.value {
  font-weight: 700;
}
</style>
