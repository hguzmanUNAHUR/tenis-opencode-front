import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayersPage } from '../features/players/PlayersPage';
import { TournamentsPage } from '../features/tournaments/TournamentsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PlayersPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}