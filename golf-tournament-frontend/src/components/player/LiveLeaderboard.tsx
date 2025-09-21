// src/components/leaderboard/LiveLeaderboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { teamService, scoreService } from "../../services/apiService";
import {
  ensureStrokes36,
  getHoleGlobalIndex,
  computeTournamentTotals,
  computeRoundTotals,
  formatToPar,
  HOLES_PER_ROUND,
} from "../../utils/scoring";

type Team = {
  teamId: number;
  teamName: string;
  player1Name?: string;
  player2Name?: string;
};

type ScoreRow = {
  holeNumber: number; // 1..18
  strokes: number;
  // other fields allowed, but unused here
};

type TeamDisplay = {
  team: Team;
  totalStrokes: number; // continuous strokes across entered holes
  totalToPar: number;   // continuous ±
  r1ToPar: number;      // per-round ± for Round 1 (entered holes)
  r2ToPar: number;      // per-round ± for Round 2 (entered holes)
};

const LiveLeaderboard: React.FC = () => {
  const { tournamentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // optional: passed from PlayerScoreEntry via navigate(..., { state: { tournamentId, teamId } })
  const { teamId: fromStateTeamId } = (location.state ?? {}) as {
    teamId?: number;
  };

  const [teams, setTeams] = useState<Team[]>([]);
  const [rows, setRows] = useState<TeamDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tournamentName] = useState<string>(""); // hook left for future

  const buildStrokes36FromApi = (r1: ScoreRow[], r2: ScoreRow[]) => {
    const strokes36 = ensureStrokes36([]);
    // Round 1
    r1?.forEach((s) => {
      if (s && s.holeNumber >= 1 && s.holeNumber <= 18 && Number.isFinite(Number(s.strokes))) {
        const idx = getHoleGlobalIndex(1, s.holeNumber);
        strokes36[idx] = Number(s.strokes);
      }
    });
    // Round 2
    r2?.forEach((s) => {
      if (s && s.holeNumber >= 1 && s.holeNumber <= 18 && Number.isFinite(Number(s.strokes))) {
        const idx = getHoleGlobalIndex(2, s.holeNumber);
        strokes36[idx] = Number(s.strokes);
      }
    });
    return strokes36;
  };

  const fetchData = async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // 1) Teams for tournament
      const tournamentTeams: Team[] = await teamService.getTeamsByTournament(
        Number(tournamentId)
      );
      setTeams(tournamentTeams);

      // 2) For each team, fetch both rounds and compute totals
      const displays: TeamDisplay[] = [];
      for (const team of tournamentTeams) {
        try {
          const [r1, r2] = await Promise.all<ScoreRow[]>([
            scoreService.getScoresByTeamAndRound(team.teamId, 1),
            scoreService.getScoresByTeamAndRound(team.teamId, 2),
          ]);

          const strokes36 = buildStrokes36FromApi(r1 ?? [], r2 ?? []);
          const total = computeTournamentTotals(strokes36);
          const r1t = computeRoundTotals(strokes36, 1);
          const r2t = computeRoundTotals(strokes36, 2);

          // We’ll also compute a simple “entered strokes” sum for display (only for entered holes)
          const enteredStrokes =
            (r1 ?? []).reduce((sum, s) => sum + (Number.isFinite(Number(s.strokes)) ? Number(s.strokes) : 0), 0) +
            (r2 ?? []).reduce((sum, s) => sum + (Number.isFinite(Number(s.strokes)) ? Number(s.strokes) : 0), 0);

          displays.push({
            team,
            totalStrokes: enteredStrokes,
            totalToPar: total.toPar,
            r1ToPar: r1t.toPar,
            r2ToPar: r2t.toPar,
          });
        } catch (teamErr) {
          // If score fetch fails for this team, still show team with zeros
          displays.push({
            team,
            totalStrokes: 0,
            totalToPar: 0,
            r1ToPar: 0,
            r2ToPar: 0,
          });
        }
      }

      // 3) Sort by continuous ± to par (lowest is better). Ties -> lower strokes.
      displays.sort((a, b) => {
        if (a.totalToPar !== b.totalToPar) return a.totalToPar - b.totalToPar;
        return a.totalStrokes - b.totalStrokes;
      });

      setRows(displays);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, [tournamentId]);

  const goBackToEntry = () => {
    if (tournamentId && fromStateTeamId) {
      navigate(`/tournaments/${tournamentId}/enter-scores?teamId=${fromStateTeamId}`);
    } else if (tournamentId) {
      // If we don't know the team, at least take them back to the entry route
      navigate(`/tournaments/${tournamentId}/enter-scores`);
    } else {
      navigate(-1); // generic fallback
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading leaderboard...</div>;

  if (!tournamentId) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h2>Please select a tournament</h2>
        <p>No tournament ID provided in the URL</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>🏆 Tournament #{tournamentId} Leaderboard</h2>
          {tournamentName && <h3 style={{ margin: "4px 0 0 0" }}>{tournamentName}</h3>}
          <p style={{ color: "#666", fontSize: 13, marginTop: 6 }}>Auto-updating every 5 seconds…</p>
        </div>
        <button
          onClick={goBackToEntry}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #1d4ed8",
            background: "#1d4ed8",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to Enter Scores
        </button>
      </div>

      {rows.length === 0 ? (
        <p>No teams found for tournament #{tournamentId}</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((row, idx) => (
            <div
              key={row.team.teamId}
              style={{
                padding: "12px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "#111827",
                        color: "white",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: 16 }}>{row.team.teamName}</strong>
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    {row.team.player1Name} {row.team.player1Name && row.team.player2Name && " & "} {row.team.player2Name}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  {/* Continuous tournament ± to par */}
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {formatToPar(row.totalToPar)}
                    <span style={{ marginLeft: 8, color: "#6b7280", fontWeight: 500, fontSize: 13 }}>
                      ({row.totalStrokes} strokes)
                    </span>
                  </div>

                  {/* Per-round ± chips */}
                  <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <span
                      title="Round 1 to par"
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                      }}
                    >
                      R1: {formatToPar(row.r1ToPar)}
                    </span>
                    <span
                      title="Round 2 to par"
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                      }}
                    >
                      R2: {formatToPar(row.r2ToPar)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveLeaderboard;
