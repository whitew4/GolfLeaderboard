import axios from "axios";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ??
  process.env.REACT_APP_API_BASE ??
  "https://localhost:7020";

const api = axios.create({ baseURL: `${API_BASE.replace(/\/$/, "")}/api` });

export interface LeaderboardRow {
  teamId: number;
  teamLabel: string;
  roundNumber: number;
  holesEntered: number;
  totalStrokes: number;
  toPar: number;
}

export async function getLeaderboard(tournamentId: number, roundNumber: number): Promise<LeaderboardRow[]> {
  const { data } = await api.get(`/leaderboard/${tournamentId}/round/${roundNumber}`);
  return data as LeaderboardRow[];
}

