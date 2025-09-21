import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface MobileNavigationProps {
  onLogout: () => void;
  username: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onLogout, username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  if (!isAdmin) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1001,
          background: '#007bff',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer'
        }}
        aria-label="Open admin menu"
      >
        ☰
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: 260,
              height: '100vh',
              background: '#333',
              color: 'white',
              padding: '80px 20px 20px',
              zIndex: 1000,
              boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Admin • {username}</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Link to="/admin" onClick={() => setIsOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: 18 }}>
                ⚙️ Admin Dashboard
              </Link>
              <Link to="/admin/tournaments" onClick={() => setIsOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: 18 }}>
                📅 Manage Tournaments
              </Link>
              <Link to="/admin/teams" onClick={() => setIsOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: 18 }}>
                👥 Manage Teams
              </Link>
              <hr style={{ opacity: 0.2 }} />
              <button
                onClick={() => { onLogout(); setIsOpen(false); }}
                style={{ background: 'transparent', border: 'none', color: '#ffb3b3', fontSize: 16, textAlign: 'left', cursor: 'pointer' }}
              >
                🚪 Logout
              </button>
            </nav>
          </div>

          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          />
        </>
      )}
    </div>
  );
};

export default MobileNavigation;
