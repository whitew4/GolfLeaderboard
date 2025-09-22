// src/components/EnterScoresPage.tsx
import { useParams } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { ScoreEntry } from "./player/ScoreEntry";
import { roundService } from '../services/apiService';

const EnterScoresPage: React.FC = () => {
  const { tournamentId, teamId } = useParams();
  const [selectedRoundId, setSelectedRoundId] = useState<number>(1);
  const [selectedHole, setSelectedHole] = useState<number>(1);
  const [rounds, setRounds] = useState<any[]>([]);

  useEffect(() => {
    const fetchRounds = async () => {
      if (tournamentId) {
        try {
          const roundsData = await roundService.getRounds(Number(tournamentId));
          setRounds(roundsData);
          if (roundsData.length > 0) {
            setSelectedRoundId(roundsData[0].roundId);
          }
        } catch (error) {
          console.error('Error fetching rounds:', error);
        }
      }
    };

    fetchRounds();
  }, [tournamentId]);

  const handleScoreSubmitted = () => {
    // Optionally move to next hole or show success message
    console.log('Score submitted successfully');
  };

  if (!tournamentId || !teamId) {
    return <div>Missing tournament or team ID</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>
        Enter Scores (Tournament {tournamentId}, Team {teamId})
      </h2>

      {/* Round Selection */}
      {rounds.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Select Round:
          </label>
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            {rounds.map((round) => (
              <option key={round.roundId} value={round.roundId}>
                {round.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hole Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Select Hole:
        </label>
        <select
          value={selectedHole}
          onChange={(e) => setSelectedHole(Number(e.target.value))}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
            <option key={hole} value={hole}>
              Hole {hole}
            </option>
          ))}
        </select>
      </div>

      {/* Score Entry Component with all required props */}
      <ScoreEntry 
        tournamentId={Number(tournamentId)}
        teamId={Number(teamId)}
        roundId={selectedRoundId}
        holeNumber={selectedHole}
        onScoreSubmitted={handleScoreSubmitted}
      />

      {/* Quick Hole Navigation */}
      <div style={{ marginTop: '20px' }}>
        <h3>Quick Hole Selection:</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '10px',
          marginTop: '10px'
        }}>
          {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
            <button
              key={hole}
              onClick={() => setSelectedHole(hole)}
              style={{
                padding: '10px',
                border: selectedHole === hole ? '2px solid #007bff' : '1px solid #ddd',
                borderRadius: '4px',
                background: selectedHole === hole ? '#007bff' : 'white',
                color: selectedHole === hole ? 'white' : 'black',
                cursor: 'pointer'
              }}
            >
              {hole}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnterScoresPage;