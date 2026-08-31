import { createApp } from 'vue'
import LandingPage from './LandingPage.vue'
import '../shared/style.css'
import { initializeSharedTheme } from '../shared/theme'

initializeSharedTheme()
createApp(LandingPage).mount('#landing')
