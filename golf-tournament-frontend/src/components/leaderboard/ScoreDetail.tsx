import React from 'react';
import { LeaderboardEntry } from '../../types';

interface ScoreDetailProps {
  team: LeaderboardEntry;
  isOpen: boolean;
  onClose: () => void;
}

const ScoreDetail: React.FC<ScoreDetailProps> = ({ team, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '300px',
      height: '100vh',
      background: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.3)',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer'
        }}
      >
        ✕
      </button>

      {/* Team Details */}
      <h2 style={{ marginTop: '0', color: '#333' }}>{team.teamName}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#666', marginBottom: '10px' }}>Tournament Stats</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Position:</span>
            <strong>#{team.position}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Strokes:</span>
            <strong>{team.totalStrokes}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Score to Par:</span>
            <strong style={{ color: team.totalScore > 0 ? '#dc3545' : '#28a745' }}>
              {team.totalScore > 0 ? '+' : ''}{team.totalScore}
            </strong>
          </div>
        </div>
      </div>

      {/* Hole-by-hole Score Placeholder */}
      <div>
        <h3 style={{ color: '#666', marginBottom: '10px' }}>Hole Scores</h3>
        <p style={{ color: '#999', fontStyle: 'italic' }}>
          Hole-by-hole scoring will be implemented in Phase 4
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '15px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
            <div key={hole} style={{
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#666' }}>H{hole}</div>
              <div style={{ fontWeight: 'bold' }}>-</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreDetail;