import { createApp } from 'vue'
import DocsPage from './DocsPage.vue'
import '../../shared/style.css'
import { initializeSharedTheme } from '../../shared/theme'

initializeSharedTheme()
createApp(DocsPage).mount('#landing')
