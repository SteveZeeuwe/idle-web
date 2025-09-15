import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import Home from '../views/Home.vue'
import MiningView from '../views/MiningView.vue'
import { inventory, resetInventory } from '../stores/inventory'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/minigames/mining', component: MiningView },
  ],
})

describe('Mining integration', () => {
  beforeEach(() => {
    resetInventory()
  })

  it('mining a cell increments inventory stone or gem', async () => {
    router.push('/minigames/mining')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    // Wait a tick for rows to populate
    await new Promise((r) => setTimeout(r, 20))
    const firstCell = wrapper.find('button.cell')
    expect(firstCell.exists()).toBe(true)
    const prevStone = inventory.stone
    const prevGemTotal = Object.values(inventory.gems).reduce((a, b) => a + b, 0)
    await firstCell.trigger('pointerdown')
    await firstCell.trigger('pointerup')
    const newStone = inventory.stone
    const newGemTotal = Object.values(inventory.gems).reduce((a, b) => a + b, 0)
    expect(newStone > prevStone || newGemTotal > prevGemTotal).toBe(true)
  })

  it('can open and close inventory drawer', async () => {
    router.push('/minigames/mining')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await new Promise((r) => setTimeout(r, 20))
    const invBtn = wrapper.find('button.inventory-btn')
    expect(invBtn.exists()).toBe(true)
    await invBtn.trigger('pointerdown')
    await invBtn.trigger('pointerup')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.sheet.open').exists()).toBe(true)
    const closeBtn = wrapper.find('.sheet.open button.close')
    await closeBtn.trigger('pointerdown')
    await closeBtn.trigger('pointerup')
    await wrapper.vm.$nextTick()
    // allow transition end; we just test class removal
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.sheet.open').exists()).toBe(false)
  })

  it('back button returns to home', async () => {
    router.push('/minigames/mining')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await new Promise((r) => setTimeout(r, 20))
    const backBtn = wrapper.find('button.back-btn')
    expect(backBtn.exists()).toBe(true)
    await backBtn.trigger('pointerdown')
    await backBtn.trigger('pointerup')
    await router.isReady()
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Minigames')
  })
})
