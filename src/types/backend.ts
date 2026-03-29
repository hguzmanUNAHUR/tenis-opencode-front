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

export const TournamentType = {
  SINGLES: 'SINGLES',
  DOUBLES: 'DOUBLES',
  MIXED_DOUBLES: 'MIXED_DOUBLES',
} as const;
export type TournamentType = typeof TournamentType[keyof typeof TournamentType];

export const TournamentCategory = {
  FUTURES: 'FUTURES',
  CHALLENGER: 'CHALLENGER',
  ATP_250: 'ATP_250',
  ATP_500: 'ATP_500',
  GRAND_SLAM: 'GRAND_SLAM',
} as const;
export type TournamentCategory = typeof TournamentCategory[keyof typeof TournamentCategory];

export const TournamentStatus = {
  DRAFT: 'DRAFT',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TournamentStatus = typeof TournamentStatus[keyof typeof TournamentStatus];

export interface Tournament {
  id: number;
  name: string;
  type: TournamentType;
  category: TournamentCategory;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  maxParticipants: number;
  genderRestriction?: 'MALE' | 'FEMALE' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentDto {
  name: string;
  type: TournamentType;
  category: TournamentCategory;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  genderRestriction?: 'MALE' | 'FEMALE';
}

export interface UpdateTournamentDto {
  name?: string;
  type?: TournamentType;
  category?: TournamentCategory;
  startDate?: string;
  endDate?: string;
  status?: TournamentStatus;
  maxParticipants?: number;
  genderRestriction?: 'MALE' | 'FEMALE' | null;
}