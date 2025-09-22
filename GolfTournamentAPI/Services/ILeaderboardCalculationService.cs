// GolfTournamentAPI/Services/ILeaderboardCalculationService.cs
using GolfTournamentData.Models;

namespace GolfTournamentAPI.Services
{
    public interface ILeaderboardCalculationService
    {
        Task<LeaderboardResult> CalculateLeaderboardAsync(int tournamentId);
        Task<List<TeamRoundScore>> GetRoundScoresAsync(int tournamentId, int roundNumber);
        Task<List<LeaderboardEntry>> GetTournamentLeaderboardAsync(int tournamentId);
    }

    // DTOs
    public class LeaderboardResult
    {
        public int TournamentId { get; set; }
        public string TournamentName { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
        public List<LeaderboardEntry> Entries { get; set; } = new();
        public int RoundCount { get; set; }
    }

    public class LeaderboardEntry
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Player1Name { get; set; } = string.Empty;
        public string Player2Name { get; set; } = string.Empty;
        public int TotalStrokes { get; set; }
        public int TotalScore { get; set; } // Relative to par
        public int Position { get; set; }
        public int HolesCompleted { get; set; }
        public Dictionary<int, RoundScore> RoundScores { get; set; } = new();
    }

    public class RoundScore
    {
        public int RoundNumber { get; set; }
        public int Strokes { get; set; }
        public int Par { get; set; }
        public int Score { get; set; } // Relative to par
        public int HolesCompleted { get; set; }
    }

    public class TeamRoundScore
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Player1Name { get; set; } = string.Empty;
        public string Player2Name { get; set; } = string.Empty;
        public int RoundNumber { get; set; }
        public int HolesCompleted { get; set; }
        public int TotalStrokes { get; set; }
        public int ScoreToPar { get; set; }
        public List<HoleScore> HoleScores { get; set; } = new();
    }

    public class HoleScore
    {
        public int HoleNumber { get; set; }
        public int Strokes { get; set; }
        public int Par { get; set; }
        public int Score { get; set; } // Relative to par
    }
}