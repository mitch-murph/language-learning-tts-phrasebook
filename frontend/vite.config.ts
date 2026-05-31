import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/language-learning-tts-phrasebook/',
  server: {
    host: true, // expose to local network so mobile can connect
  },
});
