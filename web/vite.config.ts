import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '')
  const apiUrl = 'http://localhost:3001'
  const isLanding = mode === 'landing'
  const flattenHtmlEntry = {
    name: 'flatten-html-entry',
    generateBundle(_options: unknown, bundle: Record<string, { fileName: string }>) {
      const entries = isLanding
        ? [['landing/index.html', 'index.html'], ['landing/docs/index.html', 'docs/index.html'], ['landing/releases/index.html', 'releases/index.html']]
        : [['manager/index.html', 'index.html']]
      for (const [source, target] of entries) {
        const entry = bundle[source]
        if (!entry) continue
        delete bundle[source]
        entry.fileName = target
        bundle[target] = entry
      }
    },
    writeBundle() {
      const outDir = resolve(process.cwd(), isLanding ? 'dist-landing' : 'dist-manager')
      const files = isLanding
        ? [['landing/index.html', 'index.html'], ['landing/docs/index.html', 'docs/index.html'], ['landing/releases/index.html', 'releases/index.html']]
        : [['manager/index.html', 'index.html']]
      for (const [sourceName, targetName] of files) {
        const sourcePath = resolve(outDir, sourceName)
        const targetPath = resolve(outDir, targetName)
        if (existsSync(sourcePath)) {
          mkdirSync(resolve(targetPath, '..'), { recursive: true })
          const html = readFileSync(sourcePath, 'utf8').replaceAll('../assets/', './assets/')
          writeFileSync(targetPath, html)
          if (sourcePath !== targetPath) unlinkSync(sourcePath)
        }
      }
      if (isLanding) {
        const rawVersion = process.env.VITE_BUILD_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'development'
        const version = /^[a-zA-Z0-9._-]{7,64}$/.test(rawVersion) ? rawVersion : 'development'
        writeFileSync(resolve(outDir, 'version.json'), `${JSON.stringify({ version })}\n`)
      }
    }
  }
  
  return {
    base: './',
    plugins: [vue(), flattenHtmlEntry],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./manager/src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        },
        '/health': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    build: {
      outDir: isLanding ? 'dist-landing' : 'dist-manager',
      sourcemap: false,
      rollupOptions: {
        input: isLanding
          ? { landing: 'landing/index.html', docs: 'landing/docs/index.html', releases: 'landing/releases/index.html' }
          : 'manager/index.html'
      }
    }
  }
})
