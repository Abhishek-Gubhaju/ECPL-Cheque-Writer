import { createApp } from 'vue'
import App from './App.vue'
import './styles/global.css'
import { applyPlatformAttribute } from './utils/platform'

// Before mount: html[data-platform="windows"] drives the Windows-only chrome.
applyPlatformAttribute()

const app = createApp(App)
app.mount('#app')
