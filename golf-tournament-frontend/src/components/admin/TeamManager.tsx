// src/components/admin/TeamManager.tsx
import React, { useState } from 'react';
import { teamService } from '../../services/apiService';
import { useTournament } from '../../contexts/TournamentContext';

const TeamManager: React.FC = () => {
  const { currentTournament, teams, setTeams } = useTournament();
  const tid = currentTournament?.tournamentId ?? null;

  const [teamName, setTeamName] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetNotices = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    resetNotices();

    if (!tid) {
      setErrorMsg('Please select or create a tournament first.');
      return;
    }

    const name = teamName.trim();
    const p1 = player1Name.trim();
    const p2 = player2Name.trim();

    if (!name || !p1 || !p2) {
      setErrorMsg('Team name and both player names are required.');
      return;
    }

    setLoading(true);
    try {
      await teamService.createTeam({
        teamName: name,
        player1Name: p1,
        player2Name: p2,
        tournamentId: tid, // ✅ use active tournament id
      });

      // ✅ Refetch to stay perfectly in sync with server
      const fresh = await teamService.getTeamsByTournament(tid);
      setTeams(fresh);

      setSuccessMsg('✅ Team created successfully!');
      setTeamName('');
      setPlayer1Name('');
      setPlayer2Name('');
    } catch (err: any) {
      console.error('Error creating team:', err);
      // Friendly error messages
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data ||
        err?.message ||
        '';
      if (typeof apiMsg === 'string' && apiMsg.includes('does not exist')) {
        setErrorMsg('This tournament no longer exists. Create/select a new tournament and try again.');
      } else if (
        typeof apiMsg === 'string' &&
        (apiMsg.toLowerCase().includes('foreign key') ||
          apiMsg.toLowerCase().includes('constraint'))
      ) {
        setErrorMsg('Could not create team because the tournament was deleted. Please create/select a new tournament.');
      } else {
        setErrorMsg(apiMsg || 'Failed to create team. Please try again.');
      }
    } finally {
      setLoading(false);
      // auto-hide success after a moment
      if (successMsg) {
        setTimeout(() => setSuccessMsg(null), 2500);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '560px', margin: '0 auto' }}>
      <h2>👥 Team Management</h2>

      {currentTournament ? (
        <p style={{ marginTop: 0, color: '#555' }}>
          Active tournament: <strong>{currentTournament.name}</strong>
        </p>
      ) : (
        <p style={{ color: '#dc3545' }}>No active tournament selected.</p>
      )}

      {successMsg && (
        <div
          style={{
            margin: '10px 0',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #a5d6a7',
            background: '#e8f5e9',
            color: '#1b5e20',
          }}
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            margin: '10px 0',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #f5c2c7',
            background: '#f8d7da',
            color: '#842029',
          }}
        >
          {errorMsg}
        </div>
      )}

      {teams.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Current Teams ({teams.length})</h3>
          {teams.map((team) => (
            <div
              key={team.teamId}
              style={{
                background: '#f8f9fa',
                padding: '10px',
                margin: '6px 0',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
              }}
            >
              <strong>{team.teamName}</strong>: {team.player1Name} &amp; {team.player2Name}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Team Name:</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            placeholder="e.g., Birdie Bandits"
            style={{ padding: '12px', fontSize: '16px', width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Player 1 Name:</label>
          <input
            type="text"
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
            required
            placeholder="First player's name"
            style={{ padding: '12px', fontSize: '16px', width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Player 2 Name:</label>
          <input
            type="text"
            value={player2Name}
            onChange={(e) => setPlayer2Name(e.target.value)}
            required
            placeholder="Second player's name"
            style={{ padding: '12px', fontSize: '16px', width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !tid}
          style={{
            padding: '14px',
            fontSize: '16px',
            backgroundColor: loading || !tid ? '#bbb' : '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !tid ? 'not-allowed' : 'pointer',
          }}
          title={tid ? '' : 'Select or create a tournament first'}
        >
          {loading ? 'Creating…' : 'Create Team'}
        </button>
      </form>
    </div>
  );
};

export default TeamManager;
