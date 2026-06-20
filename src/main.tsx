import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/index.css';
import App from '@/App';
import { AuthProvider } from '@/context/AuthContext';
import { CountryProvider } from '@/context/CountryContext';
import { PermissionProvider } from '@/context/PermissionContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CountryProvider>
        <PermissionProvider>
          <App />
        </PermissionProvider>
      </CountryProvider>
    </AuthProvider>
  </StrictMode>,
);
