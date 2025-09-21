// src/components/ScoreEntry.tsx
import React, { useState } from "react";
// ScoreEntry.tsx (inside src/components/player)
import RoundSelector from "../common/RoundSelector";
import { scoreService } from "../../services/apiService";


type Props = {
  tournamentId: number;
  teamId: number;
};

const ScoreEntryForm: React.FC<Props> = ({ tournamentId, teamId }) => {
  const [roundId, setRoundId] = useState<number | null>(null);
  const [holeNumber, setHoleNumber] = useState<number>(1);
  const [strokes, setStrokes] = useState<number>(4);
  const [par, setPar] = useState<number>(4);
  const [msg, setMsg] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      if (!roundId) throw new Error("Please select a round.");
      if (holeNumber < 1 || holeNumber > 18) throw new Error("Hole must be 1–18.");
      if (strokes <= 0) throw new Error("Strokes must be positive.");

      const res = await scoreService.createScore({
        teamId,
        roundId,
        holeNumber,
        strokes,
        par,
      });

      setMsg(res?.message ?? "Score submitted successfully.");
    } catch (err: any) {
      const text =
        err?.response?.data?.error ??
        err?.response?.data ??
        err?.message ??
        "Error submitting score.";
      setMsg(text);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 max-w-sm p-4 border rounded">
      <RoundSelector
        tournamentId={tournamentId}
        value={roundId}
        onChange={setRoundId}
        autoSeedIfEmpty={true}
        seedCount={2} // e.g. 2 days → 2 rounds
      />

      <label>
        Hole Number
        <input
          type="number"
          value={holeNumber}
          min={1}
          max={18}
          onChange={(e) => setHoleNumber(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </label>

      <label>
        Strokes
        <input
          type="number"
          value={strokes}
          min={1}
          onChange={(e) => setStrokes(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </label>

      <label>
        Par
        <input
          type="number"
          value={par}
          min={3}
          max={6}
          onChange={(e) => setPar(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </label>

      <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
        Submit Score
      </button>

      {msg && <p className="text-sm mt-2">{msg}</p>}
    </form>
  );
};

export default ScoreEntryForm;
