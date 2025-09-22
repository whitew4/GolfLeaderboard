// src/components/player/ScoreEntry.tsx
import React, { useState } from 'react';
import { scoreService, CreateScoreRequest } from '../../services/apiService';

interface ScoreEntryProps {
  teamId: number;
  roundId: number;
  holeNumber: number;
  tournamentId?: number; // Optional prop
  onScoreSubmitted?: () => void;
}

const ScoreEntry: React.FC<ScoreEntryProps> = ({ 
  teamId, 
  roundId, 
  holeNumber, 
  tournamentId, // Accept but don't use - for backwards compatibility
  onScoreSubmitted 
}) => {
  const [strokes, setStrokes] = useState<number>(0);
  const [msg, setMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (strokes <= 0) {
      setMsg('Please enter a valid number of strokes');
      return;
    }

    try {
      setIsSubmitting(true);
      const scoreData: CreateScoreRequest = {
        teamId,
        roundId,
        holeNumber,
        strokes
      };

      await scoreService.createScore(scoreData);
      
      setMsg("Score submitted successfully.");
      setStrokes(0);
      
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err: any) {
      const text =
        err?.response?.data?.error ??
        err?.message ??
        'Error submitting score';
      setMsg(`Error: ${text}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '15px'
    }}>
      <h3 style={{ marginTop: 0, color: '#333' }}>Hole {holeNumber}</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            color: '#555'
          }}>
            Strokes:
          </label>
          <input
            type="number"
            value={strokes || ''}
            onChange={(e) => setStrokes(parseInt(e.target.value) || 0)}
            min="1"
            max="15"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting || strokes <= 0}
          style={{
            background: (isSubmitting || strokes <= 0) ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: (isSubmitting || strokes <= 0) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Score'}
        </button>
      </form>
      {msg && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          background: msg.includes('Error') ? '#f8d7da' : '#d4edda',
          color: msg.includes('Error') ? '#721c24' : '#155724',
          border: msg.includes('Error') ? '1px solid #f5c6cb' : '1px solid #c3e6cb'
        }}>
          {msg}
        </div>
      )}
    </div>
  );
};

// Named export
export { ScoreEntry };

// Default export
export default ScoreEntry;