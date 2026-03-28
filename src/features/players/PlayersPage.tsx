import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersApi } from '../../shared/api/endpoints';
import { PlayerForm } from './components/PlayerForm';
import { PlayersList } from './components/PlayersList';
import type { Player, CreatePlayerDto } from '../../types/backend';

export function PlayersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: playersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: playersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreatePlayerDto }) =>
      playersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setEditingPlayer(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: playersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const filteredPlayers = players.filter(
    (p) =>
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (data: CreatePlayerDto) => {
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDelete = (player: Player) => {
    if (confirm(`¿Eliminar a ${player.firstName} ${player.lastName}?`)) {
      deleteMutation.mutate(player.id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlayer(null);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Jugadores</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          + Nuevo Jugador
        </button>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="content">
        {showForm && (
          <div className="card form-card">
            <h2>{editingPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}</h2>
            <PlayerForm
              player={editingPlayer || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        )}

        <PlayersList
          players={filteredPlayers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}