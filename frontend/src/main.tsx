/**
 * main.tsx
 * 
 * The entry point of the React application.
 * 
 * Setup order matters here:
 * 1. QueryClientProvider — must wrap everything so React Query can cache
 *    API responses globally across all components.
 * 2. BrowserRouter — enables react-router-dom to manage URL-based navigation.
 * 3. AuthProvider — bridges Zustand store to React Context for legacy components.
 * 
 * WHY React Query (TanStack Query):
 * Without React Query, you'd need to write `useEffect` + `useState` + `isLoading`
 * + `isError` boilerplate in every single component that fetches data.
 * React Query handles all of that automatically. It also caches responses,
 * so if two components ask for the same data, only one network request is made.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './lib/queryClient';
import './styles/index.css';
import './App.css';
import App from './App.tsx';

// Configure the React Query client with sensible defaults
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       // Don't re-fetch data when the user switches browser tabs —
//       // avoids unnecessary API load during a presentation or demo
//       refetchOnWindowFocus: false,
//       // Only retry failed requests once before showing an error
//       retry: 1,
//       // Keep cached data fresh for 5 minutes before background re-fetching
//       staleTime: 5 * 60 * 1000,
//     },
//   },
// });

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
