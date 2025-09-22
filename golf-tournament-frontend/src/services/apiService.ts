// src/services/apiService.ts
import { Tournament, CreateTournamentRequest } from '../types/tournament';
import { Score, ScoreRow, CreateScoreRequest } from '../types/score';
import { Round, RoundDto } from '../types/round';
import { Team, CreateTeamRequest } from '../types/team';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7120/api';

// Tournament Service
export const tournamentService = {
  async getTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${API_BASE_URL}/tournaments`);
    if (!response.ok) throw new Error('Failed to fetch tournaments');
    return response.json();
  },

  async getTournament(id: number): Promise<Tournament> {
    const response = await fetch(`${API_BASE_URL}/tournaments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch tournament');
    return response.json();
  },

  // Add alias for backwards compatibility
  async getTournamentById(id: number): Promise<Tournament> {
    return this.getTournament(id);
  },

  async createTournament(tournament: CreateTournamentRequest): Promise<Tournament> {
    const response = await fetch(`${API_BASE_URL}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tournament)
    });
    if (!response.ok) throw new Error('Failed to create tournament');
    return response.json();
  },

  async updateTournament(id: number, tournament: Partial<Tournament>): Promise<Tournament> {
    const response = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tournament)
    });
    if (!response.ok) throw new Error('Failed to update tournament');
    return response.json();
  },

  async deleteTournament(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete tournament');
  }
};

// Team Service
export const teamService = {
  async getTeams(tournamentId?: number): Promise<Team[]> {
    const url = tournamentId 
      ? `${API_BASE_URL}/teams?tournamentId=${tournamentId}`
      : `${API_BASE_URL}/teams`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  // Add alias for backwards compatibility
  async getTeamsByTournament(tournamentId: number): Promise<Team[]> {
    return this.getTeams(tournamentId);
  },

  async getTeam(id: number): Promise<Team> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`);
    if (!response.ok) throw new Error('Failed to fetch team');
    return response.json();
  },

  async createTeam(team: CreateTeamRequest): Promise<Team> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  },

  async updateTeam(id: number, team: Partial<Team>): Promise<Team> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    if (!response.ok) throw new Error('Failed to update team');
    return response.json();
  },

  async deleteTeam(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete team');
  }
};

// Round Service
export const roundService = {
  async getRounds(tournamentId?: number): Promise<Round[]> {
    const url = tournamentId 
      ? `${API_BASE_URL}/rounds?tournamentId=${tournamentId}`
      : `${API_BASE_URL}/rounds`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch rounds');
    return response.json();
  },

  async getRound(id: number): Promise<Round> {
    const response = await fetch(`${API_BASE_URL}/rounds/${id}`);
    if (!response.ok) throw new Error('Failed to fetch round');
    return response.json();
  },

  async createRound(round: Omit<Round, 'roundId'>): Promise<Round> {
    const response = await fetch(`${API_BASE_URL}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(round)
    });
    if (!response.ok) throw new Error('Failed to create round');
    return response.json();
  }
};

// Also export as roundsService for backward compatibility
export const roundsService = roundService;

// Score Service
export const scoreService = {
  async getScores(params?: { 
    teamId?: number; 
    roundId?: number; 
    tournamentId?: number; 
  }): Promise<Score[]> {
    const queryParams = new URLSearchParams();
    if (params?.teamId) queryParams.append('teamId', params.teamId.toString());
    if (params?.roundId) queryParams.append('roundId', params.roundId.toString());
    if (params?.tournamentId) queryParams.append('tournamentId', params.tournamentId.toString());
    
    const url = `${API_BASE_URL}/scores${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch scores');
    return response.json();
  },

  async getTeamRoundScores(teamId: number, roundId: number): Promise<ScoreRow[]> {
    const response = await fetch(`${API_BASE_URL}/scores?teamId=${teamId}&roundId=${roundId}`);
    if (!response.ok) throw new Error('Failed to fetch team round scores');
    return response.json();
  },

  async getScoresByTeamAndRound(teamId: number, roundId: number): Promise<ScoreRow[]> {
    return this.getTeamRoundScores(teamId, roundId);
  },

  async createScore(score: CreateScoreRequest): Promise<Score> {
    const response = await fetch(`${API_BASE_URL}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score)
    });
    if (!response.ok) throw new Error('Failed to create score');
    return response.json();
  },

  async createBulkScores(scores: CreateScoreRequest[]): Promise<Score[]> {
    const response = await fetch(`${API_BASE_URL}/scores/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores)
    });
    if (!response.ok) throw new Error('Failed to create bulk scores');
    return response.json();
  },

  async updateScore(scoreId: number, score: Partial<CreateScoreRequest>): Promise<Score> {
    const response = await fetch(`${API_BASE_URL}/scores/${scoreId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score)
    });
    if (!response.ok) throw new Error('Failed to update score');
    return response.json();
  },

  async deleteScore(scoreId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/scores/${scoreId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete score');
  }
};

// Admin Service
export const adminService = {
  async getStatistics(tournamentId?: number): Promise<any> {
    const url = tournamentId 
      ? `${API_BASE_URL}/admin/statistics?tournamentId=${tournamentId}`
      : `${API_BASE_URL}/admin/statistics`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch statistics');
    return response.json();
  },

  async getTournamentSummary(tournamentId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/tournaments/${tournamentId}/summary`);
    if (!response.ok) throw new Error('Failed to fetch tournament summary');
    return response.json();
  },

  async exportTournamentData(tournamentId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/admin/tournaments/${tournamentId}/export`);
    if (!response.ok) throw new Error('Failed to export tournament data');
    return response.blob();
  },

  // Add missing methods
  async resetTournament(tournamentId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/reset-tournament/${tournamentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to reset tournament');
  },

  async deleteTournament(tournamentId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/reset-tournament/${tournamentId}?deleteTournament=true`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete tournament');
  }
};

// Export all types for backward compatibility
export type { 
  Tournament, 
  CreateTournamentRequest, 
  Score, 
  ScoreRow, 
  CreateScoreRequest, 
  Round, 
  RoundDto,
  Team,
  CreateTeamRequest
};