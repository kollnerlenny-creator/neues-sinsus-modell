import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ContentProvider } from './context/ContentContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ContentProvider>
      <App />
    </ContentProvider>
  </ErrorBoundary>,
);
