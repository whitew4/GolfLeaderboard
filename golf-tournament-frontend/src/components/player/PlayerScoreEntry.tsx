// src/components/player/PlayerScoreEntry.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { scoreService } from "../../services/apiService";
import {
  ensureStrokes36,
  getRoundHoleMeta,
  getHoleGlobalIndex,
  setStroke,
  computeTournamentTotals,
  computeRoundTotals,
  formatToPar,
  getCourseName,
  HOLES_PER_ROUND,
  holeResultLabel,
} from "../../utils/scoring";
import "./player-score-entry.css";

type PlayerScoreEntryProps = { tournamentId: number; teamId: number; };
type Strokes36 = ReturnType<typeof ensureStrokes36>;

const storageKey = (tournamentId: number, teamId: number) =>
  `golf:strokes36:t${tournamentId}:team${teamId}`;
const roundKey = (tournamentId: number, teamId: number) =>
  `golf:selectedRound:t${tournamentId}:team${teamId}`;

const PlayerScoreEntry: React.FC<PlayerScoreEntryProps> = ({ tournamentId, teamId }) => {
  const navigate = useNavigate();

  // Persisted round
  const [selectedRound, setSelectedRound] = useState<1 | 2>(() => {
    const raw = localStorage.getItem(roundKey(tournamentId, teamId));
    const n = raw ? Number(raw) : 1;
    return n === 2 ? 2 : 1;
  });
  useEffect(() => {
    localStorage.setItem(roundKey(tournamentId, teamId), String(selectedRound));
  }, [selectedRound, tournamentId, teamId]);

  // Strokes state (sync init from localStorage)
  const [strokes36, setStrokes36] = useState<Strokes36>(() => {
    const raw = localStorage.getItem(storageKey(tournamentId, teamId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return ensureStrokes36(parsed);
      } catch {}
    }
    return ensureStrokes36();
  });
  const [savingHole, setSavingHole] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    localStorage.setItem(storageKey(tournamentId, teamId), JSON.stringify(strokes36));
  }, [tournamentId, teamId, strokes36]);




  const holes = useMemo(() => getRoundHoleMeta(selectedRound), [selectedRound]);
  const courseName = useMemo(() => getCourseName(selectedRound), [selectedRound]);
  const roundTotals = useMemo(() => computeRoundTotals(strokes36, selectedRound), [strokes36, selectedRound]);
  const tourneyTotals = useMemo(() => computeTournamentTotals(strokes36), [strokes36]);

  // first empty hole in this round
  const firstUnfilledHoleIndex = useMemo(() => {
    for (let i = 1; i <= HOLES_PER_ROUND; i++) {
      const idx = getHoleGlobalIndex(selectedRound, i);
      const v = strokes36[idx];
      if (v == null || Number.isNaN(Number(v))) return i;
    }
    return null;
  }, [strokes36, selectedRound]);

  // focus the current hole
// ⬇️ Focus once on mount
useEffect(() => {
  if (firstUnfilledHoleIndex != null) {
    const ref = inputRefs.current[firstUnfilledHoleIndex - 1];
    ref?.focus();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// ⬇️ And refocus when switching rounds
useEffect(() => {
  if (firstUnfilledHoleIndex != null) {
    const ref = inputRefs.current[firstUnfilledHoleIndex - 1];
    ref?.focus();
  }
  // IMPORTANT: do not include firstUnfilledHoleIndex here—just the round
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedRound]);


  // Save using actual hole par
  const saveHole = async (hole1Based: number, strokesValue: number) => {
    const holePar = holes[hole1Based - 1]?.par ?? 4;
    try {
      setSavingHole(hole1Based);
      await scoreService.createScore({
        tournamentId,
        teamId,
        roundNumber: selectedRound,
        holeNumber: hole1Based,
        strokes: strokesValue,
        par: holePar,
      } as any);
    } catch (err) {
      console.error(`❌ Failed to save hole ${hole1Based}`, err);
    } finally {
      setSavingHole((h) => (h === hole1Based ? null : h));
    }
  };
  const setHoleScore = (hole1Based: number, value: number | null) => {
  setStrokes36((prev) => setStroke(prev, selectedRound, hole1Based, value));
};




  // Only update local state on change (no autosave)
  const handleStrokeChange = (hole1Based: number, raw: string) => {
    const v = raw === "" ? null : Number(raw);
    if (v != null && (v < 1 || v > 15)) return;
    setHoleScore(hole1Based, v);
  };

  const handleSaveClick = async (hole1Based: number) => {
    const idx = getHoleGlobalIndex(selectedRound, hole1Based);
    const v = strokes36[idx];
    if (v == null || Number.isNaN(Number(v))) return;
    await saveHole(hole1Based, Number(v));
  };

  const onPressEnterSaveAdvance =
    (hole1Based: number) => async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        await handleSaveClick(hole1Based);
        const next = hole1Based + 1;
        if (next <= HOLES_PER_ROUND) {
          const ref = inputRefs.current[next - 1];
          if (ref) ref.focus();
        }
      }
    };

  const holesEnteredThisRound = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= HOLES_PER_ROUND; i++) {
      const idx = getHoleGlobalIndex(selectedRound, i);
      const v = strokes36[idx];
      if (v != null && !Number.isNaN(Number(v))) count++;
    }
    return count;
  }, [strokes36, selectedRound]);
  const progressPct = Math.round((holesEnteredThisRound / HOLES_PER_ROUND) * 100);

  const renderHoleCard = (hole1Based: number, par: number, idx: number) => {
    const gIdx = getHoleGlobalIndex(selectedRound, hole1Based);
    const value = strokes36[gIdx] ?? null;
    const filled = value != null && !Number.isNaN(Number(value));
    const isCurrent =
      !filled &&
      (firstUnfilledHoleIndex === hole1Based ||
        (firstUnfilledHoleIndex == null && hole1Based === HOLES_PER_ROUND));

    return (
      <div key={hole1Based} className={`golf-hole ${isCurrent ? "current" : ""}`}>
        <div className="row">
          <div className="golf-hole-title">
            <span className="golf-hole-badge">{hole1Based}</span>
            <span>Hole {hole1Based}</span>
          </div>
          <div className="golf-par">Par {par}</div>
        </div>

        <div className="row" style={{ marginTop: 10, gap: 8 }}>
          <input
            ref={(el) => (inputRefs.current[idx] = el)}
            type="number"
            min={1}
            max={15}
            inputMode="numeric"
            value={value ?? ""}
            onChange={(e) => handleStrokeChange(hole1Based, e.target.value)}
            onKeyDown={onPressEnterSaveAdvance(hole1Based)}
            className="golf-input"
            placeholder=""          // ✅ no default “4”
          />
          <button
            className="golf-btn"
            onClick={() => handleSaveClick(hole1Based)}
            disabled={savingHole === hole1Based}
            title="Save score"
          >
            {savingHole === hole1Based ? "Saving…" : "Save"}
          </button>
        </div>

        {filled && (
          <div className="row" style={{ marginTop: 8, fontSize: 12, color: "#546a5d" }}>
            <div>
              <strong>{value}</strong> · {holeResultLabel(Number(value), par)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const front = holes.filter(h => h.hole1Based <= 9);
  const back  = holes.filter(h => h.hole1Based > 9);

  return (
    <div className="golf-page">
      <div className="golf-sheet">
        {/* Header */}
        <div className="golf-header">
          <div>
            <div style={{ opacity: .9, fontSize: 12 }}>Tournament #{tournamentId}</div>
            <h1 style={{ margin: 2, fontWeight: 900, fontSize: 26 }}>⛳ Player Score Entry</h1>
            <div style={{ opacity: .95, fontSize: 13 }}>Course: {courseName}</div>
          </div>
          <div className="golf-round-toggle">
            {[1, 2].map((r) => (
              <button
                key={r}
                className={selectedRound === r ? "active" : ""}
                onClick={() => setSelectedRound(r as 1 | 2)}
              >
                Round {r}
              </button>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="golf-progress-wrap">
          <div className="golf-progress-meta">
            <span>{holesEnteredThisRound}/{HOLES_PER_ROUND} holes</span>
            <span>Round {selectedRound}: {formatToPar(roundTotals.toPar)} · Total: {formatToPar(tourneyTotals.toPar)}</span>
          </div>
          <div className="golf-progress-bar">
            <div className="golf-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Front 9 */}
        <h3 className="golf-section-title">Holes 1–9 (Front 9)</h3>
        <div className="golf-holes-grid">
          {front.map(({ hole1Based, par }, idx) => renderHoleCard(hole1Based, par, idx))}
        </div>

        {/* Back 9 */}
        <h3 className="golf-section-title" style={{ marginTop: 16 }}>Holes 10–18 (Back 9)</h3>
        <div className="golf-holes-grid">
          {back.map(({ hole1Based, par }, idx) => renderHoleCard(hole1Based, par, idx + front.length))}
        </div>

        {/* Footer */}
        <div className="golf-footer">
          <button
            className="golf-btn golf-secondary"
            onClick={() =>
              navigate(`/leaderboard/${tournamentId}`, { state: { tournamentId, teamId } })
            }
          >
            View Leaderboard
          </button>
          <span style={{ color: "#eaf7ef", fontSize: 12 }}>
            Tip: press <strong>Enter</strong> in a score box to save and jump to the next hole.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerScoreEntry;
