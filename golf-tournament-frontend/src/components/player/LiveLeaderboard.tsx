// src/components/player/LiveLeaderboard.tsx
import React, { useEffect, useState } from 'react';
import { scoreService, ScoreRow } from '../../services/apiService';

interface Team {
  teamId: number;
  name: string;
  // Add other team properties as needed
}

interface LeaderboardEntry {
  team: Team;
  total: number;
  round1Total: number;
  round2Total: number;
  enteredStrokes: number;
}

interface LiveLeaderboardProps {
  teams: Team[];
  tournamentId: number;
}

// Helper function to build strokes from API data
const buildStrokes36FromApi = (round1Scores: ScoreRow[], round2Scores: ScoreRow[]) => {
  const strokes36: number[] = new Array(36).fill(0);
  
  round1Scores.forEach(score => {
    if (score.holeNumber >= 1 && score.holeNumber <= 18) {
      strokes36[score.holeNumber - 1] = score.strokes;
    }
  });
  
  round2Scores.forEach(score => {
    if (score.holeNumber >= 1 && score.holeNumber <= 18) {
      strokes36[score.holeNumber + 17] = score.strokes;
    }
  });
  
  return strokes36;
};

// Helper functions for computing totals
const computeTournamentTotals = (strokes36: number[]) => {
  return strokes36.reduce((sum, strokes) => sum + strokes, 0);
};

const computeRoundTotals = (strokes36: number[], round: number) => {
  if (round === 1) {
    return strokes36.slice(0, 18).reduce((sum, strokes) => sum + strokes, 0);
  } else if (round === 2) {
    return strokes36.slice(18, 36).reduce((sum, strokes) => sum + strokes, 0);
  }
  return 0;
};

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ teams, tournamentId }) => {
  const [displays, setDisplays] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const newDisplays: LeaderboardEntry[] = [];

        for (const team of teams) {
          try {
            const [r1, r2] = await Promise.all([
              scoreService.getScoresByTeamAndRound(team.teamId, 1),
              scoreService.getScoresByTeamAndRound(team.teamId, 2),
            ]);

            const strokes36 = buildStrokes36FromApi(r1 || [], r2 || []);
            const total = computeTournamentTotals(strokes36);
            const r1t = computeRoundTotals(strokes36, 1);
            const r2t = computeRoundTotals(strokes36, 2);

            const enteredStrokes =
              (r1 || []).reduce((sum: number, s: ScoreRow) => 
                sum + (Number.isFinite(Number(s.strokes)) ? Number(s.strokes) : 0), 0) +
              (r2 || []).reduce((sum: number, s: ScoreRow) => 
                sum + (Number.isFinite(Number(s.strokes)) ? Number(s.strokes) : 0), 0);

            newDisplays.push({
              team,
              total,
              round1Total: r1t,
              round2Total: r2t,
              enteredStrokes
            });
          } catch (teamError) {
            console.error(`Error fetching data for team ${team.teamId}:`, teamError);
            newDisplays.push({
              team,
              total: 0,
              round1Total: 0,
              round2Total: 0,
              enteredStrokes: 0
            });
          }
        }

        // Sort by total score (ascending - lower is better in golf)
        newDisplays.sort((a, b) => a.total - b.total);
        setDisplays(newDisplays);

      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    if (teams.length > 0) {
      fetchLeaderboardData();
    }
  }, [teams, tournamentId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        Loading leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Live Leaderboard</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {displays.map((entry, index) => (
          <div 
            key={entry.team.teamId} 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              gap: '15px'
            }}
          >
            <div style={{
              background: '#007bff',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              #{index + 1}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{entry.team.name}</h3>
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.9em', color: '#666' }}>
                <span>R1: {entry.round1Total}</span>
                <span>R2: {entry.round2Total}</span>
                <span>Total: {entry.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};