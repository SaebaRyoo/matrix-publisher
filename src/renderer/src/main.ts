import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(ElementPlus)
app.use(router)
app.mount('#app')

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason)
  if (msg && !msg.includes('cancel')) {
    ElMessage.error(msg)
  }
})
