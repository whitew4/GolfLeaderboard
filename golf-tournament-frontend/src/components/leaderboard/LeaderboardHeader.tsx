import React from 'react';
import { useTournament } from '../../contexts/TournamentContext';

const LeaderboardHeader: React.FC = () => {
  const { currentTournament } = useTournament();

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '15px 20px',
      zIndex: 100,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
        {currentTournament?.name || 'Golf Tournament'}
      </h2>
      <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
        {currentTournament 
          ? `${new Date(currentTournament.startDate).toLocaleDateString()} - ${new Date(currentTournament.endDate).toLocaleDateString()}`
          : 'Live Leaderboard'
        }
      </p>
    </div>
  );
};

export default LeaderboardHeader;