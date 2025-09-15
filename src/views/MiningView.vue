<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Minigame from '../minigames/Minigame.vue'
import MiningGrid from '../minigames/mining/MiningGrid.vue'
import InventoryDrawer from '../components/InventoryDrawer.vue'
import { useTap } from '../composables/useTap'
import { getMine } from '../minigames/mining/mines'

const route = useRoute()
const mineId = computed(() => route.params.mineId as string | undefined)
const mine = computed(() => getMine(mineId.value))

const open = ref(false)
const openTap = useTap(
  () => {
    open.value = true
  },
  { trigger: 'down' },
)
</script>

<template>
  <Minigame :back-to="'/'">
    <MiningGrid :mine="mine" />
    <div v-if="!mine" class="missing-mine">Unknown mine.</div>
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
.inventory-btn {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  z-index: 20;
}
.missing-mine {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
}
</style>
