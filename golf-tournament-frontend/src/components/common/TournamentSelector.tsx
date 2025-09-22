// src/components/common/TournamentSelector.tsx
import React, { useEffect, useState } from 'react';
import { tournamentService, Tournament } from '../../services/apiService';

type Props = {
  selectedTournamentId?: number;
  onTournamentSelect: (tournamentId: number) => void;
};

const TournamentSelector: React.FC<Props> = ({ 
  selectedTournamentId, 
  onTournamentSelect 
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const data = await tournamentService.getTournaments();
        setTournaments(data);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return <div className="loading">Loading tournaments...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="tournament-selector">
      <h2>Select Tournament</h2>
      {tournaments.length === 0 ? (
        <p>No tournaments available</p>
      ) : (
        <div className="tournaments-list">
          {tournaments.map((tournament) => (
            <div 
              key={tournament.tournamentId} 
              className={`tournament-item ${
                selectedTournamentId === tournament.tournamentId ? 'selected' : ''
              }`}
              onClick={() => onTournamentSelect(tournament.tournamentId)}
              style={{
                background: selectedTournamentId === tournament.tournamentId ? '#f8f9ff' : 'white',
                border: selectedTournamentId === tournament.tournamentId ? '2px solid #007bff' : '2px solid #e9ecef',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedTournamentId === tournament.tournamentId 
                  ? '0 2px 8px rgba(0,123,255,0.2)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '15px'
              }}
              onMouseEnter={(e) => {
                if (selectedTournamentId !== tournament.tournamentId) {
                  e.currentTarget.style.borderColor = '#007bff';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTournamentId !== tournament.tournamentId) {
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#007bff' }}>{tournament.name}</h3>
                {tournament.location && (
                  <p style={{ margin: '4px 0', color: '#444' }}>📍 {tournament.location}</p>
                )}
                <p style={{ margin: '4px 0', color: '#666' }}>
                  📅 {new Date(tournament.startDate).toLocaleDateString()} —{' '}
                  {new Date(tournament.endDate).toLocaleDateString()}
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#888' }}>
                  Status: {tournament.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Named export
export { TournamentSelector };

// Default export
export default TournamentSelector;