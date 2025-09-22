// src/components/common/RoundSelector.tsx
import React, { useEffect, useState } from "react";
import { roundService, RoundDto } from "../../services/apiService"; // Fixed import

type Props = {
  tournamentId: number;
  selectedRoundId?: number;
  onRoundSelect: (roundId: number) => void;
};

export const RoundSelector: React.FC<Props> = ({ 
  tournamentId, 
  selectedRoundId, 
  onRoundSelect 
}) => {
  const [rounds, setRounds] = useState<RoundDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        setLoading(true);
        const data = await roundService.getRounds(tournamentId);
        setRounds(data);
      } catch (error) {
        console.error('Error fetching rounds:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchRounds();
    }
  }, [tournamentId]);

  if (loading) {
    return <div>Loading rounds...</div>;
  }

  return (
    <div className="round-selector">
      <label htmlFor="round-select">Select Round:</label>
      <select
        id="round-select"
        value={selectedRoundId || ''}
        onChange={(e) => {
          const roundId = parseInt(e.target.value);
          if (!isNaN(roundId)) {
            onRoundSelect(roundId);
          }
        }}
      >
        <option value="">Select a round</option>
        {rounds.map((round) => (
          <option key={round.roundId} value={round.roundId}>
            {round.name} - {new Date(round.date).toLocaleDateString()}
          </option>
        ))}
      </select>
    </div>
  );
};