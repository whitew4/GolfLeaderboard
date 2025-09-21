// src/components/common/TournamentSelector.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentService, adminService, type Tournament } from '../../services/apiService';


const TournamentSelector: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  // ✅ derive role once per mount
  const isAdmin = useMemo(() => {
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    return (role ?? '').toLowerCase() === 'admin';
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await tournamentService.getTournaments();
setTournaments(list);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleTournamentSelect = (tournamentId: number) => {
    navigate(`/tournament/${tournamentId}/select-team`);
  };

  const handleDelete = async (tournamentId: number) => {
  if (!isAdmin) return;
  const ok = window.confirm('Delete this tournament? This cannot be undone.');
  if (!ok) return;

  setDeletingId(tournamentId);
  try {
    // 🔁 Use admin endpoint that truly deletes the tournament in your backend
    await adminService.deleteTournament(tournamentId);

    // ✅ Refetch to be 100% in sync with server
    const list = await tournamentService.getTournaments();
setTournaments(list);
  } catch (err) {
    console.error('Error deleting tournament:', err);
    setError('Failed to delete tournament');
  } finally {
    setDeletingId(null);
  }
};

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading tournaments...</div>;
  if (error) return <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h2>🏆 Select a Tournament</h2>

      {tournaments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>No tournaments available.</p>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Create Tournament (Admin)
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {tournaments.map((tournament) => (
            <div
              key={tournament.tournamentId}
              style={{
                padding: 20,
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#007bff' }}>{tournament.name}</h3>
                {tournament.location && (
                  <p style={{ margin: '4px 0', color: '#444' }}>📍 {tournament.location}</p>
                )}
                <p style={{ margin: '4px 0', color: '#666' }}>
                  📅 {new Date(tournament.startDate).toLocaleDateString()} —{' '}
                  {new Date(tournament.endDate).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleTournamentSelect(tournament.tournamentId)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Select Team
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(tournament.tournamentId)}
                    disabled={deletingId === tournament.tournamentId}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: deletingId === tournament.tournamentId ? '#aaa' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: deletingId === tournament.tournamentId ? 'not-allowed' : 'pointer',
                    }}
                    title="Delete tournament"
                  >
                    {deletingId === tournament.tournamentId ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentSelector;
