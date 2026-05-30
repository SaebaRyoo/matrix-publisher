import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/accounts' },
    { path: '/accounts', component: () => import('../pages/Accounts.vue') },
    { path: '/editor', component: () => import('../pages/Editor.vue') },
    { path: '/queue', component: () => import('../pages/PublishQueue.vue') },
    { path: '/logs', component: () => import('../pages/PublishLogs.vue') },
    { path: '/settings', component: () => import('../pages/Settings.vue') }
  ]
})
