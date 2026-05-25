import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@fhenixprotocol/cofhejs': path.resolve(__dirname, './src/shims/fhenix-cofhejs.ts'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
