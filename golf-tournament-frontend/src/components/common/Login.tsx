// src/components/common/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (token: string, user: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username.');
      return;
    }

    setLoading(true);

    try {
      const unameLower = trimmed.toLowerCase();

      // --- Admin path ---
      if (unameLower === 'admin') {
        if (password !== 'golf123') {
          setError('Invalid admin password.');
          return;
        }

        // Persist auth BEFORE navigating
        localStorage.setItem('authToken', 'mock-admin-token');
        localStorage.setItem('username', 'admin');
        localStorage.setItem('userRole', 'admin');

        onLogin('mock-admin-token', 'admin');

        // ✅ SPA navigation (no flash)
        navigate('/admin', { replace: true });
        return;
      }

      // --- Player path ---
      localStorage.setItem('authToken', 'mock-player-token');
      localStorage.setItem('username', trimmed);
      localStorage.setItem('userRole', 'player');

      onLogin('mock-player-token', trimmed);

      // Send players to the root (TournamentSelector)
      navigate('/', { replace: true });
      return;
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = username.trim().toLowerCase() === 'admin';

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '10vh auto',
        padding: 24,
        border: '1px solid #eee',
        borderRadius: 12,
        background: '#fff'
      }}
    >
      <h2 style={{ marginTop: 0 }}>Sign in</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Username</span>
          <input
            type="text"
            placeholder="e.g., admin or player1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
            autoFocus
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>
            Password {isAdmin ? '(admin password required)' : '(ignored for players)'}
          </span>
          <input
            type="password"
            placeholder={isAdmin ? 'anything' : ''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            background: '#0f5132',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>

      <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
        
        <div><strong>Player:</strong> use your name; password is ignored</div>
      </div>
    </div>
  );
};

export default Login;
