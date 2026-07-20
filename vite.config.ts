import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // iztro / lunar-lite / dayjs 均为 CJS，强制预构建成 ESM，避免浏览器里 require is not defined
    include: ['iztro', 'lunar-lite', 'dayjs', 'html2canvas'],
  },
  build: {
    commonjsOptions: {
      include: [/iztro/, /lunar-lite/, /dayjs/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
})
