import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteExternalsPlugin } from 'vite-plugin-externals'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
    viteExternalsPlugin({
      react: 'React',
      'react-dom': 'ReactDOM',
      '@mantine/core': 'MantineCore',
    }),
  ],
  esbuild: {
    jsx: 'preserve',
  },
  build: {
    cssCodeSplit: false,
    manifest: false,
    rollupOptions: {
      preserveEntrySignatures: 'exports-only',
      input: ['./src/PartRiskGraph.tsx'],
      output: {
        dir: '../inventree_partsgraph/static',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@mantine/core': 'MantineCore',
        },
      },
      external: ['react', 'react-dom', '@mantine/core'],
    },
  },
  optimizeDeps: {
    exclude: ['react', 'react-dom', '@mantine/core'],
  },
})
