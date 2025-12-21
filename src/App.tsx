import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './global.css';
import './base.css';

// Import kiosk page
// Note: Will be imported after fixing paths
// import KioskPage from './pages/kiosk';

/**
 * React Query Client Configuration
 * Optimized for Android Tablet POS
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - products don't change often
      gcTime: 10 * 60 * 1000, // 10 minutes cache
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Disable for kiosk mode
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        <h1>Alwon POS - Android Tablet</h1>
        <p>Migration in progress...</p>
        <p>Professional modular architecture activated ✅</p>

        {/* Kiosk will be loaded here after fixing imports */}
        {/* <KioskPage /> */}
      </div>

      {/* React Query DevTools - only in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
