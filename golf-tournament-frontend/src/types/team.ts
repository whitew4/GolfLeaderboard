// src/types/team.ts
export interface Team {
  teamId: number;
  name: string;
  teamName: string; // For backwards compatibility
  tournamentId: number;
  player1Name: string;
  player2Name: string;
}

export interface CreateTeamRequest {
  name: string;
  teamName: string;
  tournamentId: number;
  player1Name: string;
  player2Name: string;
}