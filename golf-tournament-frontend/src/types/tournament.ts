// src/types/tournament.ts
export interface Tournament {
  tournamentId: number;
  name: string;
  location?: string; // Add location property
  startDate: string;
  endDate: string;
  status: string;
  courseId?: number;
}

export interface CreateTournamentRequest {
  name: string;
  location?: string; // Add location property
  startDate: string;
  endDate: string;
  courseId?: number;
}