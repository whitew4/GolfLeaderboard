// src/contexts/TournamentContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Tournament, Team, LeaderboardEntry } from '../types';
import { tournamentService } from '../services/apiService';

interface TournamentContextType {
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament | null) => void;
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  const [currentTournament, _setCurrentTournament] = useState<Tournament | null>(null);
  const [teams, _setTeams] = useState<Team[]>([]);
  const [leaderboard, _setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // ---- Setters that also sync to localStorage ----
  const setCurrentTournament = (tournament: Tournament | null) => {
    _setCurrentTournament(tournament);
    if (tournament) {
      localStorage.setItem('currentTournament', JSON.stringify(tournament));
    } else {
      localStorage.removeItem('currentTournament');
    }
  };

  const setTeams = (newTeams: Team[]) => {
    _setTeams(newTeams);
    localStorage.setItem('teams', JSON.stringify(newTeams));
  };

  const setLeaderboard = (newLeaderboard: LeaderboardEntry[]) => {
    _setLeaderboard(newLeaderboard);
    localStorage.setItem('leaderboard', JSON.stringify(newLeaderboard));
  };

  // ---- Load saved state on mount ----
  useEffect(() => {
    const savedTournament = localStorage.getItem('currentTournament');
    if (savedTournament) {
      try {
        _setCurrentTournament(JSON.parse(savedTournament));
      } catch {
        localStorage.removeItem('currentTournament');
      }
    }

    const savedTeams = localStorage.getItem('teams');
    if (savedTeams) {
      try {
        _setTeams(JSON.parse(savedTeams));
      } catch {
        localStorage.removeItem('teams');
      }
    }

    const savedLeaderboard = localStorage.getItem('leaderboard');
    if (savedLeaderboard) {
      try {
        _setLeaderboard(JSON.parse(savedLeaderboard));
      } catch {
        localStorage.removeItem('leaderboard');
      }
    }
  }, []);

  // ---- Validate that the stored currentTournament still exists on the server ----
  useEffect(() => {
    let alive = true;

    const validateTournament = async () => {
      if (!currentTournament) return;
      try {
        // returns a plain Tournament
        const t = await tournamentService.getTournamentById(currentTournament.tournamentId);
        if (!alive) return;

        // if for some reason no tournament came back, treat as deleted
        if (!t || !t.tournamentId) {
          setCurrentTournament(null);
          _setTeams([]);
          _setLeaderboard([]);
        }
      } catch {
        // 404 or network -> treat as deleted for safety
        if (!alive) return;
        setCurrentTournament(null);
        _setTeams([]);
        _setLeaderboard([]);
      }
    };

    // run once immediately
    validateTournament();

    // optional: keep in sync with periodic validation
    const id = setInterval(validateTournament, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [currentTournament]); // intentionally only depends on currentTournament

  return (
    <TournamentContext.Provider
      value={{
        currentTournament,
        setCurrentTournament,
        teams,
        setTeams,
        leaderboard,
        setLeaderboard,
        loading,
        setLoading,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};
