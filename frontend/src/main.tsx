import { createRoot } from 'react-dom/client';
import { ThemeController } from './theme/ThemeController';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <ThemeController>
    <App />
  </ThemeController>,
);
