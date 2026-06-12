import { createRoot } from 'react-dom/client';
import { ThemeController } from './theme/ThemeController';
import { initNamespace } from './api/namespace';
import App from './App';

initNamespace();

createRoot(document.getElementById('root')!).render(
  <ThemeController>
    <App />
  </ThemeController>,
);
