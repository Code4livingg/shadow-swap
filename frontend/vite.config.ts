import { createRequire } from 'module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

const require = createRequire(import.meta.url)
const tfheEntry = require.resolve('tfhe/tfhe.js')
const tfheWorkerHelperStub = '\0tfhe-worker-helper-stub'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'resolve-tfhe-rayon-worker-entry',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source.includes('workerHelpers.js') && importer?.endsWith('/tfhe.js')) {
          return tfheWorkerHelperStub
        }

        if (source.endsWith('/workerHelpers.js') && importer === tfheEntry) {
          return tfheWorkerHelperStub
        }

        if (source === '../../../tfhe.js' && importer?.includes('wasm-bindgen-rayon')) {
          return tfheEntry
        }

        return null
      },
      load(id) {
        if (id === tfheWorkerHelperStub) {
          return 'export async function startWorkers() {}'
        }

        return null
      },
    },
    wasm(),
    topLevelAwait(),
    react(),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
