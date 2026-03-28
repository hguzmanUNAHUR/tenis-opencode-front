import { useState } from 'react';
import type { Player, CreatePlayerDto } from '../../../types/backend';

interface Props {
  player?: Player;
  onSubmit: (data: CreatePlayerDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlayerForm({ player, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<CreatePlayerDto>({
    firstName: player?.firstName || '',
    lastName: player?.lastName || '',
    email: player?.email || '',
    dateOfBirth: player?.dateOfBirth || '',
    gender: player?.gender || 'MALE',
    nationality: player?.nationality || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreatePlayerDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Fecha de Nacimiento</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Género</label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
          >
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Nacionalidad</label>
        <input
          type="text"
          value={formData.nationality}
          onChange={(e) => handleChange('nationality', e.target.value)}
          placeholder="ARG, ESP, USA..."
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : player ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}