import { useParams } from "react-router-dom";
// src/pages/EnterScoresPage.tsx
import ScoreEntry from "../components/player/ScoreEntry";



const EnterScoresPage = () => {
  const { tournamentId, teamId } = useParams<{ tournamentId: string; teamId: string }>();

  if (!tournamentId || !teamId) {
    return <p>Missing tournamentId or teamId in URL</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        Enter Scores (Tournament {tournamentId}, Team {teamId})
      </h2>
      <ScoreEntry tournamentId={Number(tournamentId)} teamId={Number(teamId)} />
    </div>
  );
};

export default EnterScoresPage;
