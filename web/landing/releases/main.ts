import { createApp } from 'vue'
import ReleasesPage from './ReleasesPage.vue'
import '../../shared/style.css'
import { initializeSharedTheme } from '../../shared/theme'

initializeSharedTheme()
createApp(ReleasesPage).mount('#landing')
