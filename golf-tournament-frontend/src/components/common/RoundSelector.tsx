// src/components/RoundSelector.tsx
import React, { useEffect, useState } from "react";
import { roundsService, RoundDto } from "../../services/apiService";

type Props = {
  tournamentId: number;
  value: number | null;
  onChange: (roundId: number | null) => void;
  autoSeedIfEmpty?: boolean;
  seedCount?: number;
};

const RoundSelector: React.FC<Props> = ({
  tournamentId,
  value,
  onChange,
  autoSeedIfEmpty = true,
  seedCount = 1,
}) => {
  const [rounds, setRounds] = useState<RoundDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadRounds = async () => {
    setLoading(true);
    setErr(null);
    try {
      let list = await roundsService.getByTournament(tournamentId);

      if (list.length === 0 && autoSeedIfEmpty) {
        await roundsService.seed(tournamentId, seedCount);
        list = await roundsService.getByTournament(tournamentId);
      }

      setRounds(list);
      if (!value && list.length > 0) onChange(list[0].roundId);
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? "Failed to load rounds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) loadRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  if (loading) return <p>Loading rounds…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (rounds.length === 0) return <p>No rounds found for this tournament.</p>;

  return (
    <label className="flex items-center gap-2">
      <span className="min-w-[80px]">Round</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value) || null)}
        className="border rounded px-2 py-1"
      >
        {rounds.map((r) => (
          <option key={r.roundId} value={r.roundId}>
            Round {r.roundNumber} — {new Date(r.date).toLocaleDateString()}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="border rounded px-2 py-1"
        onClick={loadRounds}
        title="Refresh rounds"
      >
        Refresh
      </button>
    </label>
  );
};

export default RoundSelector;
