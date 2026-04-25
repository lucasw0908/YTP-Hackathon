import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // 允許來自 Docker 外部的連線 (必須)
    port: 5173,           // 確保 port 正確
    watch: {
      usePolling: true    // 如果是在 Windows 透過 WSL/Docker Desktop，建議開啟
    },
    hmr: {
      // 如果你的 Nginx 讓前端在 localhost:80 顯示，就寫 80
      // 如果是用 8080 port 看前端，就寫 8080
      clientPort: 80,
    }
  }
})
