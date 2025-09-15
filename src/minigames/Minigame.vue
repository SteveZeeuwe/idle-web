<script setup lang="ts">
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { useTap } from '../composables/useTap'

defineOptions({ name: 'MiniGameWrapper' })

const props = defineProps<{ backTo?: RouteLocationRaw }>()

const router = useRouter()
const goBack = () => {
  if (props.backTo) router.push(props.backTo)
  else router.push('/')
}
const tap = useTap(() => goBack())
</script>

<template>
  <div class="minigame">
    <button
      class="btn back-btn"
      aria-label="Back"
      @pointerdown="tap.onPointerDown"
      @pointerup="tap.onPointerUp"
      @pointercancel="tap.onPointerCancel"
      @pointerleave="tap.onPointerLeave"
      @click="tap.onClick"
    >
      ← Back
    </button>

    <slot />
  </div>
</template>

<style scoped>
.minigame {
  position: relative;
  min-height: 100vh;
  padding-top: 0;

  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
}

.minigame * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
}

.back-btn {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  left: calc(env(safe-area-inset-left, 0px) + 8px);
  z-index: 50;
}
</style>
