export interface Tournament {
  tournamentId: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  courseId: number;
}

export interface Team {
  teamId: number;
  tournamentId: number;
  teamName: string;
  player1Name: string;
  player2Name: string;
}

export interface Score {
  scoreId: number;
  teamId: number;
  roundId: number;
  holeNumber: number;
  strokes: number;
  par: number;
}

export interface LeaderboardEntry {
  teamId: number;
  teamName: string;
  totalStrokes: number;
  totalScore: number;
  position: number;
}