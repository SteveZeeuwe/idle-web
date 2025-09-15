<script lang="ts">
export default { name: 'HomeView' }
</script>

<script setup lang="ts">
// Home page for listing minigames
</script>

<template>
  <main class="home">
    <h1>Minigames</h1>
    <section class="cards">
      <RouterLink class="card" to="/minigames/mining" aria-label="Open Mining game">
        <div class="card-thumb" aria-hidden="true" />
        <div class="card-body">
          <h2>Mining</h2>
          <p>Mine gems and stone in an infinite scrolling shaft.</p>
        </div>
      </RouterLink>
      <!-- New Woodcutting card -->
      <RouterLink class="card" to="/minigames/woodcutting" aria-label="Open Woodcutting game">
        <div
          class="card-thumb"
          aria-hidden="true"
          style="background: linear-gradient(135deg, #1d2a1b, #2c4a2a)"
        />
        <div class="card-body">
          <h2>Woodcutting</h2>
          <p>Chop trees across diverse fields. Mobile-first tap controls.</p>
        </div>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 16px;
  background: radial-gradient(circle at 30% 20%, #16181d, #0f1116 60%);
  color: #e7e7e7;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.card {
  display: grid;
  grid-template-rows: 120px auto;
  text-decoration: none;
  color: inherit;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1d22;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}
.card:hover {
  filter: brightness(1.05);
}
.card:active {
  transform: scale(0.995);
}

.card-thumb {
  background: linear-gradient(135deg, #2d2f31, #3a3d43);
}

.card-body {
  padding: 12px 14px 14px;
  font-size: 1rem;
}
</style>
