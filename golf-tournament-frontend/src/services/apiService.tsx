// src/services/apiService.tsx
import axios from 'axios';

/** ===== Auth helpers for request headers ===== */
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// If your backend is on HTTPS dev certs, keep https; otherwise switch to http
const API_BASE_URL = 'https://localhost:7020/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token + role header on every request
api.interceptors.request.use((config: any) => {
  const headers = { ...(config.headers ?? {}) } as Record<string, string>;

  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Include role for local admin gating
  const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  if (role) headers['X-User-Role'] = role; // e.g., 'admin'

  config.headers = headers;
  return config;
});

/** ===== Types ===== */
export interface Tournament {
  tournamentId: number;
  name: string;
  startDate: string;   // ISO date string
  endDate: string;     // ISO date string
  location?: string;
  status?: string;
}

export interface CreateTournamentRequest {
  name: string;
  startDate: string;   // ISO date string (yyyy-mm-dd)
  endDate: string;     // ISO date string
  location?: string;
  status?: string;
}

export interface UpdateTournamentRequest extends Partial<CreateTournamentRequest> {}

export interface Team {
  teamId: number;
  tournamentId: number;
  teamName: string;
  player1Name: string;
  player2Name: string;
}

export interface Score {
  scoreId?: number;
  teamId: number;
  roundId: number;       // use real DB id from /rounds/by-tournament
  holeNumber: number;    // 1..18
  strokes: number;       // >0
  par: number;           // 3..6
  tournamentId?: number; // optional; server may infer from round
}

export interface RoundDto {
  roundId: number;
  tournamentId: number;
  roundNumber: number;
  date: string; // ISO
}

/** ===== Services ===== */

// --- Tournaments ---
export const tournamentService = {
  getTournaments: async (): Promise<Tournament[]> => {
    const res = await api.get<Tournament[]>('/tournaments');
    return res.data;
  },

  getTournamentById: async (id: number): Promise<Tournament> => {
    const res = await api.get<Tournament>(`/tournaments/${id}`);
    return res.data;
  },

  createTournament: async (payload: CreateTournamentRequest): Promise<Tournament> => {
    const res = await api.post<Tournament>('/tournaments', payload);
    return res.data;
  },

  updateTournament: async (id: number, payload: UpdateTournamentRequest): Promise<Tournament> => {
    const res = await api.put<Tournament>(`/tournaments/${id}`, payload);
    return res.data;
  },

  deleteTournament: async (id: number): Promise<void> => {
    await api.delete<void>(`/tournaments/${id}`);
  },
  // NOTE: reset/delete for admin lives in adminService below
};

// --- Teams ---
export const teamService = {
  getTeams: async (): Promise<Team[]> => {
    const res = await api.get<Team[]>('/teams');
    return res.data;
  },

  getTeamsByTournament: async (tournamentId: number): Promise<Team[]> => {
    const res = await api.get<Team[]>(`/teams/tournament/${tournamentId}`);
    return res.data;
  },

  createTeam: async (team: Partial<Team>): Promise<Team> => {
    const res = await api.post<Team>('/teams', team);
    return res.data;
  },

  updateTeam: async (id: number, team: Partial<Team>): Promise<Team> => {
    const res = await api.put<Team>(`/teams/${id}`, team);
    return res.data;
  },

  deleteTeam: async (id: number): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },
};

// --- Rounds ---
export const roundsService = {
  getByTournament: async (tournamentId: number): Promise<RoundDto[]> => {
    const res = await api.get<RoundDto[]>(`/rounds/by-tournament/${tournamentId}`);
    return res.data;
  },

  create: async (payload: { tournamentId: number; roundNumber: number; date?: string }): Promise<RoundDto> => {
    const res = await api.post<RoundDto>('/rounds', payload);
    return res.data;
  },

  seed: async (tournamentId: number, count = 1): Promise<any> => {
    const res = await api.post(`/rounds/seed/${tournamentId}?count=${count}`);
    return res.data;
  },
};

// --- Scores ---
export const scoreService = {
  getScores: async (): Promise<Score[]> => {
    const res = await api.get<Score[]>('/scores');
    return res.data;
  },

  getScoresByTeamAndRound: async (teamId: number, roundId: number): Promise<Score[]> => {
    const res = await api.get<Score[]>(`/scores/team/${teamId}/round/${roundId}`);
    return res.data;
  },

  // Note: tournamentId is optional; server may infer from the Round
  createScore: async (score: Omit<Score, 'scoreId'>): Promise<any> => {
    const res = await api.post('/scores', score);
    return res.data;
  },
};

// --- Leaderboard ---
export const leaderboardService = {
  getLeaderboard: async (tournamentId: number) => {
    const res = await api.get(`/leaderboard/tournament/${tournamentId}`);
    return res.data;
  },
};

// --- Admin ---
export const adminService = {
  // ✅ RESET ONLY — clears teams/rounds/scores but keeps the tournament row
  resetTournament(tournamentId: number) {
    // Your AdminController ResetTournament action is mapped to DELETE
    return api.delete(`/admin/reset-tournament/${tournamentId}`);
  },

  // ✅ HARD DELETE — removes tournament row (and related)
  deleteTournament(tournamentId: number) {
    return api.delete(`/admin/reset-tournament/${tournamentId}`, {
      params: { deleteTournament: true },
    });
  },

  // Demo seeding endpoint
  seedDemo(tTeams = 6, withScores = true, tName?: string) {
    return api.post('/admin/seed-demo', null, {
      params: { tTeams, withScores, tName },
    });
  },
};

// --- Simple auth helpers ---
export const authService = {
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  },
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },
};
