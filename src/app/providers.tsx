import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlayersPage } from '../features/players/PlayersPage';
import { TournamentsPage } from '../features/tournaments/TournamentsPage';
import { RegistrationsPage } from '../features/registrations/RegistrationsPage';

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
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Navigate to="/players" replace />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/registrations" element={<RegistrationsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}