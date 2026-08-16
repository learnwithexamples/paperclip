import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` emits relative asset URLs, so the same build works at
// https://<user>.github.io/<repo>/ , at a custom domain root, or from `file://`
// — no repo name hard-coded anywhere. Routing is hash-based for the same
// reason: GitHub Pages has no rewrite rules, so deep links must not need any.
export default defineConfig({
  base: './',
  plugins: [react()],
})
