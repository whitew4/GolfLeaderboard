// src/components/player/PlayerScoreEntryWrapper.tsx
import React from "react";
import { useParams } from "react-router-dom";
import PlayerScoreEntry from "./PlayerScoreEntry";

const PlayerScoreEntryWrapper: React.FC = () => {
  const { tournamentId, teamId } = useParams();

  if (!tournamentId || !teamId) {
    return <div style={{ padding: 16 }}>Missing tournament or team.</div>;
  }

  return (
    <PlayerScoreEntry
      tournamentId={Number(tournamentId)}
      teamId={Number(teamId)}
    />
  );
};

export default PlayerScoreEntryWrapper;
