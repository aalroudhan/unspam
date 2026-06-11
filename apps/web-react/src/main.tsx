import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import './styles.css';
import { App } from './App';
import { ToastProvider } from './toast';
import { apollo } from './apollo';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apollo}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ApolloProvider>
  </StrictMode>,
);
