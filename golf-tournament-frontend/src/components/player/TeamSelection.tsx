import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { teamService } from '../../services/apiService';
import type { Team } from '../../services/apiService';

const TeamSelection: React.FC = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parsedTournamentId = Number(tournamentId);
  const isTournamentIdValid = Number.isInteger(parsedTournamentId) && parsedTournamentId > 0;

  useEffect(() => {
    if (!isTournamentIdValid) {
      setError('Invalid tournament id.');
      setLoading(false);
      return;
    }

    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Your service returns Team[] directly
        const result: Team[] = await teamService.getTeamsByTournament(parsedTournamentId);
        setTeams(result);
      } catch (e: any) {
        console.error('Error fetching teams:', e);
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [isTournamentIdValid, parsedTournamentId]);

  if (!isTournamentIdValid) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: 'red' }}>Invalid tournament.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 10,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            background: '#007bff',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Back to Tournaments
        </button>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading teams…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 10,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            background: '#007bff',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
      <h2>⛳ Tournament Score Entry</h2>
      <p>Select your team:</p>

      {teams.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', border: '1px dashed #bbb', borderRadius: 8 }}>
          <p style={{ marginBottom: 12 }}>No teams found for this tournament.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                background: '#6c757d',
                color: '#fff'
              }}
            >
              Back to Tournaments
            </Link>
            <Link
              to="/admin/teams"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                background: '#007bff',
                color: '#fff'
              }}
            >
              Manage Teams (Admin)
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {teams.map((team) => (
            <Link
              key={team.teamId}
              to={`/tournament/${parsedTournamentId}/enter-scores/${team.teamId}`}
              style={{
                padding: 15,
                border: '2px solid #007bff',
                borderRadius: 8,
                textDecoration: 'none',
                color: '#333',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                transition: 'all .15s ease'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#e3f2fd';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#f8f9fa';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#007bff';
              }}
            >
              <strong>{team.teamName}</strong>
              <br />
              {team.player1Name} &amp; {team.player2Name}
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Link
          to="/"
          style={{
            padding: '10px 16px',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: 8,
            background: '#6c757d',
            color: '#fff',
            flex: 1
          }}
        >
          ← Tournaments
        </Link>

        <Link
          to={`/leaderboard/${parsedTournamentId}`}
          style={{
            padding: '10px 16px',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: 8,
            background: '#28a745',
            color: '#fff',
            flex: 1
          }}
        >
          View Leaderboard →
        </Link>
      </div>
    </div>
  );
};

export default TeamSelection;
