// src/components/admin/TournamentManager.tsx
import React, { useState } from 'react';
import { tournamentService, adminService, type Tournament } from '../../services/apiService';


const TournamentManager: React.FC = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // createTournament returns AxiosResponse<Tournament>
      const created = await tournamentService.createTournament({
      name,
      location,
      startDate,
      endDate,
})

      setCurrentTournament(created);
      localStorage.setItem('currentTournament', JSON.stringify(created));

      // clear form
      setName('');
      setLocation('');
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      console.error('Create tournament failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to create tournament';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    const ok = window.confirm(
      '⚠️ This will permanently delete ALL tournaments (and related teams/scores). Continue?'
    );
    if (!ok) return;

    setError(null);
    setDeletingAll(true);
    try {
      // Since there is no deleteAllTournaments() service,
      // fetch all, then delete one-by-one.
      // in TournamentManager.tsx -> handleDeleteAll
       const tournaments = await tournamentService.getTournaments();
// Use admin delete for each id
      for (const t of tournaments) {
        await adminService.deleteTournament(t.tournamentId);
}


      setCurrentTournament(null);
      localStorage.removeItem('currentTournament');
      alert('All tournaments deleted.');
    } catch (err: any) {
      console.error('Delete all tournaments failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to delete all tournaments';
      setError(msg);
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h2>🛠️ Tournament Manager</h2>

      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          Location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          Start Date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          End Date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: 8,
              background: '#007bff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {saving ? 'Creating…' : 'Create Tournament'}
          </button>

          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={deletingAll}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: 8,
              background: '#d32f2f',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {deletingAll ? 'Deleting…' : '🗑️ Delete All Tournaments'}
          </button>
        </div>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: 12 }}>
          {error}
        </p>
      )}

      {currentTournament && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            background: '#f8f9fa',
          }}
        >
          <h3 style={{ margin: 0 }}>{currentTournament.name}</h3>
          {currentTournament.location && (
            <p style={{ margin: '6px 0' }}>{currentTournament.location}</p>
          )}
          <p style={{ margin: '6px 0' }}>
            {new Date(currentTournament.startDate).toLocaleDateString()} —{' '}
            {new Date(currentTournament.endDate).toLocaleDateString()}
          </p>
          {currentTournament.status && (
            <p style={{ margin: '6px 0' }}>
              Status: {currentTournament.status}
            </p>
          )}
          <small>ID: {currentTournament.tournamentId}</small>
        </div>
      )}
    </div>
  );
};

export default TournamentManager;
