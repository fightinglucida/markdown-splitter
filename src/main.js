import { createApp } from 'vue'
import App from './App.vue'
import { createWebApi } from './webApi'
import '../local-client/src/styles.css'

window.localCardApi = createWebApi()
createApp(App).mount('#app')
