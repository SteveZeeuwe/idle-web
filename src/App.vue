<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

let removeGlobalZoomGuards: (() => void) | null = null

onMounted(() => {
  const onWheel = (e: WheelEvent) => {
    // Prevent browser zoom via ctrl/cmd + wheel
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
    }
  }
  const onGesture = (e: Event) => {
    // iOS Safari pinch gesture events
    e.preventDefault()
  }
  let lastTouchEnd = 0
  const onTouchEnd = (e: TouchEvent) => {
    // Prevent double-tap to zoom on iOS
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      e.preventDefault()
    }
    lastTouchEnd = now
  }

  document.addEventListener('wheel', onWheel, { passive: false })
  document.addEventListener('gesturestart', onGesture as EventListener)
  document.addEventListener('gesturechange', onGesture as EventListener)
  document.addEventListener('gestureend', onGesture as EventListener)
  document.addEventListener('touchend', onTouchEnd, { passive: false })

  removeGlobalZoomGuards = () => {
    document.removeEventListener('wheel', onWheel)
    document.removeEventListener('gesturestart', onGesture as EventListener)
    document.removeEventListener('gesturechange', onGesture as EventListener)
    document.removeEventListener('gestureend', onGesture as EventListener)
    document.removeEventListener('touchend', onTouchEnd)
  }
})

onBeforeUnmount(() => {
  removeGlobalZoomGuards?.()
})
</script>

<template>
  <RouterView />
</template>

<style>
html,
body,
#app {
  margin: 0;
  height: 100%;
}

/* Increase root font-size for better mobile readability */
html {
  font-size: 18px;
}

:root {
  --font-heading: 'Cinzel', serif;
  --font-body: 'Cormorant Garamond', serif;
  --heading-weight: 600;
  --body-weight: 500;
  --body-font-size: 1rem; /* follow root size */
}

body {
  font-family: var(--font-body);
  font-weight: var(--body-weight);
  font-size: var(--body-font-size);
  letter-spacing: 0.2px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  letter-spacing: 0.5px;
}

h1 {
  margin: 0 0 12px;
  font-size: 1.4rem;
}

h2 {
  margin: 0 0 6px;
  font-size: 1rem;
}

p {
  margin: 0;
  opacity: 0.85;
  font-size: 1rem;
}

button,
input,
select,
textarea {
  font: inherit;
}

.btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  background: rgba(29, 31, 35, 0.9);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.btn:active {
  transform: scale(0.98);
}
</style>
