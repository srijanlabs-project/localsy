import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-icons';
              return 'vendor';
            }

            if (id.includes('/src/components/admin/')) return 'admin-workspaces';
            if (id.includes('/src/components/WebPortal') || id.includes('/src/components/webportal/')) return 'public-directory';
            if (id.includes('/src/components/ux/')) return 'ux-previews';
            if (id.includes('/src/components/GoogleLocationPicker')) return 'maps-media';
            if (id.includes('/src/utils/businessImage') || id.includes('/src/utils/mediaUrl')) return 'media-utils';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
