// src/types/score.ts
export interface Score {
  scoreId?: number;
  teamId: number;
  roundId: number;
  holeNumber: number;
  strokes: number;
  // Removed message property - it doesn't exist in API responses
}

export interface ScoreRow {
  scoreId?: number;
  teamId: number;
  roundId: number;
  holeNumber: number;
  strokes: number;
}

export interface CreateScoreRequest {
  teamId: number;
  roundId: number;
  holeNumber: number;
  strokes: number;
}