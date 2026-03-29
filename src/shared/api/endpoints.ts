import { apiClient } from './client';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from '../../types/backend';

export const playersApi = {
  getAll: () => apiClient.get<Player[]>('/players').then((r) => r.data),
  getById: (id: number) => apiClient.get<Player>(`/players/${id}`).then((r) => r.data),
  create: (data: CreatePlayerDto) => apiClient.post<Player>('/players', data).then((r) => r.data),
  update: (id: number, data: UpdatePlayerDto) => apiClient.patch<Player>(`/players/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete<Player>(`/players/${id}`).then((r) => r.data),
};