// src/types/round.ts
export interface Round {
  roundId: number;
  tournamentId: number;
  roundNumber: number;
  name: string;
  date: string;
}

export interface RoundDto {
  roundId: number;
  tournamentId: number;
  roundNumber: number;
  name: string;
  date: string;
}