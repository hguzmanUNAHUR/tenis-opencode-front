import type { Player, PlayerStatus } from '../../../types/backend';

interface Props {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  isLoading?: boolean;
}

const statusColors: Record<PlayerStatus, string> = {
  ACTIVE: '#16a34a',
  INACTIVE: '#6b7280',
  SUSPENDED: '#dc2626',
};

export function PlayersList({ players, onEdit, onDelete, isLoading }: Props) {
  if (isLoading) {
    return <div className="loading">Cargando jugadores...</div>;
  }

  if (players.length === 0) {
    return <div className="empty">No hay jugadores registrados</div>;
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Nacionalidad</th>
            <th>Género</th>
            <th>Puntos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td>{player.firstName} {player.lastName}</td>
              <td>{player.email}</td>
              <td>{player.nationality}</td>
              <td>{player.gender === 'MALE' ? '♂' : '♀'}</td>
              <td>{player.rankingPoints}</td>
              <td>
                <span
                  className="badge"
                  style={{ backgroundColor: statusColors[player.status] }}
                >
                  {player.status}
                </span>
              </td>
              <td className="actions">
                <button className="btn-icon" onClick={() => onEdit(player)}>
                  ✏️
                </button>
                <button className="btn-icon" onClick={() => onDelete(player)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}