import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Expose the dev server on the LAN so players can open it from their phones
  // (e.g. http://<laptop-ip>:5173). Run `npm run dev` and use the "Network" URL.
  server: { host: true },
})
