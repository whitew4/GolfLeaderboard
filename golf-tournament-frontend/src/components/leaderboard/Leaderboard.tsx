import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getLeaderboard, type LeaderboardRow } from "../../services/leaderboardService";
import { teamService } from "../../services/apiService";
import { formatToPar } from "../../utils/scoring";

type Team = {
  teamId: number;
  teamName: string;
  player1Name?: string;
  player2Name?: string;
};

type TeamDisplay = {
  team: Team;
  totalStrokes: number; // R1 + R2
  totalToPar: number;   // R1 + R2
  r1ToPar: number;
  r2ToPar: number;
  holesEntered: number; // R1 + R2
};

const Leaderboard: React.FC = () => {
  const { tournamentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { teamId: fromStateTeamId } = (location.state ?? {}) as { teamId?: number };

  const [rows, setRows] = React.useState<TeamDisplay[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const hasTid = Boolean(tournamentId);
  const tid = Number(tournamentId);

  const load = React.useCallback(async () => {
    if (!hasTid) return;
    try {
      setRefreshing(true);

      // Fetch teams + both round leaderboards
      const [teams, r1, r2] = await Promise.all([
        teamService.getTeamsByTournament(tid) as Promise<Team[]>,
        getLeaderboard(tid, 1),
        getLeaderboard(tid, 2),
      ]);

      // index by teamId without using Map (ES5-friendly)
      const r1ById: Record<number, LeaderboardRow | undefined> = {};
      const r2ById: Record<number, LeaderboardRow | undefined> = {};
      r1.forEach(x => { r1ById[x.teamId] = x; });
      r2.forEach(x => { r2ById[x.teamId] = x; });

      const displays: TeamDisplay[] = teams.map((t) => {
        const r1row = r1ById[t.teamId];
        const r2row = r2ById[t.teamId];
        const r1ToPar = r1row?.toPar ?? 0;
        const r2ToPar = r2row?.toPar ?? 0;

        return {
          team: {
            teamId: t.teamId,
            teamName: t.teamName || r1row?.teamLabel || r2row?.teamLabel || `Team ${t.teamId}`,
            player1Name: t.player1Name,
            player2Name: t.player2Name,
          },
          totalStrokes: (r1row?.totalStrokes ?? 0) + (r2row?.totalStrokes ?? 0),
          totalToPar: r1ToPar + r2ToPar,
          r1ToPar,
          r2ToPar,
          holesEntered: (r1row?.holesEntered ?? 0) + (r2row?.holesEntered ?? 0),
        };
      });

      // Include any teamIds present in r1/r2 but not in teams API result
      const known: Record<number, true> = {};
      teams.forEach(t => { known[t.teamId] = true; });

      const addIfMissing = (row: LeaderboardRow) => {
        const id = row.teamId;
        if (known[id]) return;
        const r1row = r1ById[id];
        const r2row = r2ById[id];
        const r1ToPar = r1row?.toPar ?? 0;
        const r2ToPar = r2row?.toPar ?? 0;

        displays.push({
          team: { teamId: id, teamName: r1row?.teamLabel || r2row?.teamLabel || `Team ${id}` },
          totalStrokes: (r1row?.totalStrokes ?? 0) + (r2row?.totalStrokes ?? 0),
          totalToPar: r1ToPar + r2ToPar,
          r1ToPar,
          r2ToPar,
          holesEntered: (r1row?.holesEntered ?? 0) + (r2row?.holesEntered ?? 0),
        });
        known[id] = true;
      };

      r1.forEach(addIfMissing);
      r2.forEach(addIfMissing);

      displays.sort((a, b) => {
        if (a.totalToPar !== b.totalToPar) return a.totalToPar - b.totalToPar;
        return a.totalStrokes - b.totalStrokes;
      });

      setRows(displays);
    } finally {
      setRefreshing(false);
    }
  }, [hasTid, tid]);

  React.useEffect(() => {
    if (!hasTid) return;
    setLoading(true);
    const run = async () => { await load(); setLoading(false); };
    run();

    const timer = setInterval(load, 5000); // auto-refresh every 5s
    return () => clearInterval(timer);
  }, [hasTid, load]);

  const goBackToEntry = () => {
    if (tournamentId && fromStateTeamId) {
      navigate(`/tournament/${tournamentId}/enter-scores/${fromStateTeamId}`);
    } else if (tournamentId) {
      navigate(`/tournament/${tournamentId}/select-team`);
    } else {
      navigate(-1);
    }
  };

  if (!hasTid) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h2>Please select a tournament</h2>
        <p>No tournament ID provided in the URL</p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20 }}>Loading leaderboard…</div>;

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>🏆 Tournament #{tournamentId} Leaderboard</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={load}
            disabled={refreshing}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #374151",
              background: "white",
              color: "#111827",
              fontWeight: 600,
              cursor: "pointer",
              opacity: refreshing ? 0.6 : 1,
            }}
            title="Refresh leaderboard"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
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
      </div>

      {rows.length === 0 ? (
        <p>No teams found for this tournament.</p>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                    {row.team.player1Name}
                    {row.team.player1Name && row.team.player2Name && " & "}
                    {row.team.player2Name}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {formatToPar(row.totalToPar)}
                    <span style={{ marginLeft: 8, color: "#6b7280", fontWeight: 500, fontSize: 13 }}>
                      ({row.totalStrokes} strokes)
                    </span>
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                      }}
                      title="Round 1 to par"
                    >
                      R1: {formatToPar(row.r1ToPar)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                      }}
                      title="Round 2 to par"
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

export default Leaderboard;
