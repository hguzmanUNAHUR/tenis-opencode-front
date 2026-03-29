import { apiClient } from './client';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from '../../types/backend';
import type { Tournament, CreateTournamentDto, UpdateTournamentDto } from '../../types/backend';

export const playersApi = {
  getAll: () => apiClient.get<Player[]>('/players').then((r) => r.data),
  getById: (id: number) => apiClient.get<Player>(`/players/${id}`).then((r) => r.data),
  create: (data: CreatePlayerDto) => apiClient.post<Player>('/players', data).then((r) => r.data),
  update: (id: number, data: UpdatePlayerDto) => apiClient.patch<Player>(`/players/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete<Player>(`/players/${id}`).then((r) => r.data),
};

export const tournamentsApi = {
  getAll: (status?: string) => {
    const params = status ? { status } : {};
    return apiClient.get<Tournament[]>('/tournaments', { params }).then((r) => r.data);
  },
  getById: (id: number) => apiClient.get<Tournament>(`/tournaments/${id}`).then((r) => r.data),
  create: (data: CreateTournamentDto) => apiClient.post<Tournament>('/tournaments', data).then((r) => r.data),
  update: (id: number, data: UpdateTournamentDto) => apiClient.patch<Tournament>(`/tournaments/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete<Tournament>(`/tournaments/${id}`).then((r) => r.data),
};