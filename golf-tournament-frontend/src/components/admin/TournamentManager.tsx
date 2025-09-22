// src/components/admin/TeamManager.tsx
import React, { useState } from "react";
import { teamService, CreateTeamRequest } from "../../services/apiService";
import { useTournament } from "../../contexts/TournamentContext";

const TeamManager: React.FC = () => {
  const { currentTournament, teams, setTeams } = useTournament();

  const [name, setName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const clearMessages = () => {
    setSuccessMsg("");
    setErrorMsg("");
  };

  const clearForm = () => {
    setName("");
    setP1("");
    setP2("");
    clearMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTournament) {
      setErrorMsg("❌ No tournament selected");
      return;
    }

    if (!name || !p1 || !p2) {
      setErrorMsg("❌ Please fill in all fields");
      return;
    }

    const tid = currentTournament.tournamentId;
    setLoading(true);

    try {
      // Fixed: Include both name and teamName properties
      await teamService.createTeam({
        name: name, // Add this line
        teamName: name,
        player1Name: p1,
        player2Name: p2,
        tournamentId: tid,
      });

      // ✅ Refetch to stay perfectly in sync with server
      const fresh = await teamService.getTeamsByTournament(tid);
      setTeams(fresh);

      setSuccessMsg("✅ Team created successfully!");
      clearForm();
    } catch (err: any) {
      console.error("Error creating team:", err);
      setErrorMsg(`❌ Error: ${err.message || "Failed to create team"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;

    try {
      await teamService.deleteTeam(teamId);

      // Update local state
      if (currentTournament) {
        const fresh = await teamService.getTeamsByTournament(
          currentTournament.tournamentId
        );
        setTeams(fresh);
      }

      setSuccessMsg("✅ Team deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting team:", err);
      setErrorMsg(`❌ Error: ${err.message || "Failed to delete team"}`);
    }
  };

  if (!currentTournament) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Team Management</h2>
        <p>Please select a tournament first.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Team Management</h2>
      <h3>Tournament: {currentTournament.name}</h3>

      {/* Messages */}
      {successMsg && (
        <div
          style={{
            background: "#d4edda",
            color: "#155724",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            border: "1px solid #c3e6cb",
          }}
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            border: "1px solid #f5c6cb",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Create Team Form */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
        }}
      >
        <h3>Create New Team</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Team Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Player 1 Name:
            </label>
            <input
              type="text"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              placeholder="Enter player 1 name"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Player 2 Name:
            </label>
            <input
              type="text"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              placeholder="Enter player 2 name"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
            <button
              type="button"
              onClick={clearForm}
              style={{
                background: "#6c757d",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Teams List */}
      <div>
        <h3>Existing Teams ({teams.length})</h3>
        {teams.length === 0 ? (
          <p>No teams found for this tournament.</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {teams.map((team) => (
              <div
                key={team.teamId}
                style={{
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "15px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 8px 0" }}>
                      {team.teamName}
                    </h4>
                    <p style={{ margin: 0, color: "#666" }}>
                      {team.player1Name} & {team.player2Name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.teamId)}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManager;
