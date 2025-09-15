import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import MinesOverview from '../minigames/mining/MinesOverview.vue'
import MiningView from '../views/MiningView.vue'
// Woodcutting imports
import FieldsOverview from '../minigames/woodcutting/FieldsOverview.vue'
import WoodcuttingView from '../views/WoodcuttingView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/minigames/mining', name: 'mining', component: MinesOverview },
    { path: '/minigames/mining/:mineId', name: 'mine-play', component: MiningView, props: true },
    // Woodcutting
    { path: '/minigames/woodcutting', name: 'woodcutting', component: FieldsOverview },
    {
      path: '/minigames/woodcutting/:fieldId',
      name: 'field-play',
      component: WoodcuttingView,
      props: true,
    },
  ],
})

export default router
