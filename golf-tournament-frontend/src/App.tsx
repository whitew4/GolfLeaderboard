import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Leaderboard from "./components/leaderboard/Leaderboard";
import MobileNavigation from "./components/common/MobileNavigation";
import Login from "./components/common/Login";
import TeamSelection from "./components/player/TeamSelection";
import AdminDashboard from "./components/admin/AdminDashboard";
import TournamentManager from "./components/admin/TournamentManager";
import TeamManager from "./components/admin/TeamManager";
import { TournamentProvider } from "./contexts/TournamentContext";
import PlayerScoreEntryWrapper from "./components/player/PlayerScoreEntryWrapper";
import TournamentSelector from "./components/common/TournamentSelector";

import RequireAdmin from "./components/routing/RequireAdmin";
import { isAdmin } from "./utils/auth";
import "./App.css";

function App() {
  // session auth only (no auto-login from localStorage on mount)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  const handleLogin = (token: string, user: string) => {
    // persist for API use
    localStorage.setItem("authToken", token);
    localStorage.setItem("username", user);
    localStorage.setItem("userRole", user === "admin" ? "admin" : "player");

    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUsername("");
  };

  // tiny guard for non-admin pages
  const RequireAuth = ({ children }: { children: JSX.Element }) =>
    isAuthenticated ? children : <Navigate to="/login" replace />;

  return (
    <TournamentProvider>
      <Router>
        <div className="App">
          {/* Show menu/header only when authenticated */}
          {isAuthenticated && isAdmin() && (
            <MobileNavigation onLogout={handleLogout} username={username} />
          )}

          {isAuthenticated && (
            <header className="App-header">
              <h1>⛳ Golf Tournament Manager</h1>
              <p>Welcome, {username}! | Live updates for the bachelor party!</p>
            </header>
          )}

          <main>
            <Routes>
              {/* ✅ LOGIN lives inside Router.
                  If authed, send by role; else render Login component */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    isAdmin() ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />

              {/* ADMIN (guarded by RequireAdmin which reads localStorage) */}
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/tournaments"
                element={
                  <RequireAdmin>
                    <TournamentManager />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/teams"
                element={
                  <RequireAdmin>
                    <TeamManager />
                  </RequireAdmin>
                }
              />

              {/* PLAYER / DEFAULT (guarded by session auth) */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    {isAdmin() ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <TournamentSelector
                        onTournamentSelect={(tournamentId) => {
                          // Handle tournament selection - navigate to appropriate page
                          // You might want to navigate to leaderboard or admin page
                          window.location.href = `/tournament/${tournamentId}/teams`;
                        }}
                      />
                    )}
                  </RequireAuth>
                }
              />
              <Route
                path="/tournaments"
                element={
                  <RequireAuth>
                    <TournamentSelector
                      onTournamentSelect={(tournamentId) => {
                        // Handle tournament selection - navigate to appropriate page
                        // You might want to navigate to leaderboard or admin page
                        window.location.href = `/tournament/${tournamentId}/teams`;
                      }}
                    />
                  </RequireAuth>
                }
              />
              <Route
                path="/tournament/:tournamentId/select-team"
                element={
                  <RequireAuth>
                    <TeamSelection />
                  </RequireAuth>
                }
              />
              <Route
                path="/tournament/:tournamentId/enter-scores/:teamId"
                element={
                  <RequireAuth>
                    <PlayerScoreEntryWrapper />
                  </RequireAuth>
                }
              />
              <Route
                path="/leaderboard/:tournamentId"
                element={
                  <RequireAuth>
                    <Leaderboard />
                  </RequireAuth>
                }
              />

              {/* Legacy redirects */}
              <Route path="/old-leaderboard" element={<Leaderboard />} />
              <Route
                path="/tournament/:tournamentId/score-entry"
                element={
                  <Navigate
                    to="/tournament/:tournamentId/select-team"
                    replace
                  />
                }
              />

              {/* Fallback: if authed send by role, else go to login */}
              <Route
                path="*"
                element={
                  isAuthenticated ? (
                    isAdmin() ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </TournamentProvider>
  );
}

export default App;
