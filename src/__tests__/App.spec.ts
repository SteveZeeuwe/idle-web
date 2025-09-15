import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import Home from '../views/Home.vue'
import MiningView from '../views/MiningView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/minigames/mining', component: MiningView },
  ],
})

describe('App', () => {
  it('renders Home route', async () => {
    router.push('/')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [router] },
    })
    expect(wrapper.html()).toContain('Minigames')
  })
})
