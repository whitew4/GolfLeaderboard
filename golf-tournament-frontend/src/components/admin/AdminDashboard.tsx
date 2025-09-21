// src/components/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../../contexts/TournamentContext';
import { adminService } from '../../services/apiService';

const AdminDashboard: React.FC = () => {
  const { currentTournament, teams } = useTournament();
  const navigate = useNavigate();

  // Active tournament id
  const tid = currentTournament?.tournamentId ?? null;

  // UI state
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Reset = clear teams/rounds/scores but KEEP the tournament row
  const handleResetTournament = async () => {
    if (!tid) {
      alert('No active tournament selected.');
      return;
    }
    if (
      !window.confirm(
        '⚠️ This will delete ALL teams, rounds, and scores for this tournament.\nThe tournament itself will remain so you can reuse it.\n\nContinue?'
      )
    ) {
      return;
    }

    try {
      setResetting(true);

      // ✅ RESET ONLY — no query flag -> keeps the tournament row
      await adminService.resetTournament(tid); // DELETE /api/admin/reset-tournament/{id}

      // Clear any local caches tied to this tournament
      clearLocalCachesForTournament(tid);

      // Optional notice (no hard reload needed if your context re-renders)
      setNotice('✅ Tournament data cleared. You can now add new teams/scores.');
      setTimeout(() => setNotice(null), 3500);

      // If you prefer a hard refresh:
      // window.location.reload();
    } catch (err) {
      console.error(err);
      setNotice('❌ Failed to clear tournament data.');
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setResetting(false);
    }
  };

  // Hard delete = remove the tournament row + all related data
  const deleteTournamentCompletely = async () => {
    if (!tid) {
      alert('No active tournament selected.');
      return;
    }
    if (
      !window.confirm(
        '⚠️ PERMANENT: delete this tournament AND all teams, rounds, and scores?'
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await adminService.deleteTournament(tid); // /api/admin/reset-tournament/{id}?deleteTournament=true
      clearLocalCachesForTournament(tid);
      alert('Tournament deleted.');
      // Go back to Admin home so UI doesn’t try to use a deleted tournament
      window.location.replace('/admin');
    } catch (e) {
      console.error(e);
      alert('Failed to delete tournament.');
    } finally {
      setDeleting(false);
    }
  };

  const clearLocalCachesForTournament = (tournamentId: number) => {
    const prefix1 = `golf:strokes36:t${tournamentId}:`;
    const prefix2 = `golf:selectedRound:t${tournamentId}:`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(prefix1) || k.startsWith(prefix2)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🏌️‍♂️ Golf Tournament Manager</h1>
      <p>Welcome, Admin! | Live updates for the bachelor party!</p>

      {notice && (
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
          {notice}
        </div>
      )}

      {/* Tournament Status Card */}
      <div
        style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #dee2e6',
        }}
      >
        <h2>Tournament Admin Dashboard</h2>
        {currentTournament ? (
          <div>
            <p>
              <strong>Name:</strong> {currentTournament.name}
            </p>
            <p>
              <strong>Dates:</strong>{' '}
              {new Date(currentTournament.startDate).toLocaleDateString()} -{' '}
              {new Date(currentTournament.endDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong> {currentTournament.status}
            </p>
          </div>
        ) : (
          <p>No active tournament. Create one to get started!</p>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            background: '#007bff',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h3>{teams.length}</h3>
          <p>Teams Registered</p>
        </div>

        <div
          style={{
            background: '#28a745',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h3>36</h3>
          <p>Holes</p>
        </div>

        <div
          style={{
            background: '#ffc107',
            color: 'black',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h3>{currentTournament?.status || 'Inactive'}</h3>
          <p>Tournament Status</p>
        </div>
      </div>

      {/* Admin Actions */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
        }}
      >
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin/tournaments')}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🏆 Create Tournament
          </button>

          <button
            onClick={deleteTournamentCompletely}
            disabled={!tid || deleting}
            style={{
              padding: '10px 20px',
              background: deleting ? '#7f1d1d' : '#b91c1c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (!tid || deleting) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: (!tid || deleting) ? 0.7 : 1,
            }}
            title={tid ? '' : 'Select a tournament first'}
          >
            {deleting ? 'Deleting…' : '🗑️ Delete Tournament'}
          </button>

          <button
            onClick={() => tid && navigate(`/leaderboard/${tid}`)}
            disabled={!tid}
            style={{
              padding: '10px 20px',
              background: '#054207',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: tid ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: tid ? 1 : 0.6,
            }}
            title={tid ? '' : 'Select a tournament first'}
          >
            📊 View Leaderboard
          </button>

          <button
            onClick={() => tid && navigate(`/tournament/${tid}/select-team`)}
            disabled={!tid}
            style={{
              padding: '10px 20px',
              background: '#f59e0b',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: tid ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: tid ? 1 : 0.6,
            }}
            title={tid ? '' : 'Select a tournament first'}
          >
            ⛳ Enter Scores
          </button>

          <button
            onClick={() => navigate('/admin/teams')}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            👥 Manage Teams
          </button>

          <button
            onClick={handleResetTournament}
            disabled={!tid || resetting}
            style={{
              padding: '10px 20px',
              background: resetting ? '#9e1c28' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (!tid || resetting) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: (!tid || resetting) ? 0.7 : 1,
            }}
            title={tid ? '' : 'Select a tournament first'}
          >
            {resetting ? 'Clearing…' : '🗑️ Clear Tournament Data'}
          </button>

          <button
            onClick={() => {
              // logout: clear storage and send to login
              localStorage.removeItem('authToken');
              localStorage.removeItem('username');
              localStorage.removeItem('userRole');
              navigate('/login', { replace: true });
            }}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
