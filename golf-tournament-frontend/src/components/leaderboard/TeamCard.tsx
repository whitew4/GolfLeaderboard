import React, { useState } from 'react';
import { LeaderboardEntry } from '../../types';
import ScoreDetail from './ScoreDetail'; // ← ADD THIS

interface TeamCardProps {
  team: LeaderboardEntry;
  position: number;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, position }) => {
  const [showDetail, setShowDetail] = useState(false); // ← ADD STATE

  const getPositionColor = (pos: number) => {
    switch(pos) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';  
      case 3: return '#CD7F32';
      default: return '#f8f9fa';
    }
  };

  return (
    <>
      <div 
        onClick={() => setShowDetail(true)} // ← ADD CLICK HANDLER
        style={{
          padding: '16px',
          margin: '10px 0',
          border: '1px solid #ddd',
          borderRadius: '12px',
          backgroundColor: getPositionColor(position),
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer' // ← ADD CURSOR
        }}
      >
        {/* ... rest of TeamCard code ... */}
      </div>
      
      <ScoreDetail 
        team={team} 
        isOpen={showDetail} 
        onClose={() => setShowDetail(false)} 
      />
    </>
  );
};

export default TeamCard;