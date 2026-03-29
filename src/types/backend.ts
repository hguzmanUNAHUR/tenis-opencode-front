export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

export const PlayerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type PlayerStatus = typeof PlayerStatus[keyof typeof PlayerStatus];

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  status: PlayerStatus;
  rankingPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  status?: PlayerStatus;
  rankingPoints?: number;
}