import { defineConfig } from 'vite'

export default defineConfig({
  // Ensure PDF.js worker is properly handled
  assetsInclude: ['**/*.pdf'],
  
  // Configure build to handle PDF.js dependencies
  build: {
    rollupOptions: {
      output: {
        // Handle PDF.js worker files
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.includes('pdf.worker')) {
            return 'assets/pdf.worker.[hash].js'
          }
          return 'assets/[name].[hash][extname]'
        }
      }
    }
  },
  
  // Configure optimizeDeps for PDF.js
  optimizeDeps: {
    include: ['pdfjs-dist']
  },

  // Configure server for development
  server: {
    port: 5173,
    open: true
  }
})
