// GolfTournamentAPI/Controllers/LeaderboardController.cs
using Microsoft.AspNetCore.Mvc;
using GolfTournamentAPI.Services;
using Microsoft.AspNetCore.Authorization;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ILeaderboardCalculationService _leaderboardService;
        private readonly ISignalRService _signalRService;
        private readonly ILogger<LeaderboardController> _logger;

        public LeaderboardController(
            ILeaderboardCalculationService leaderboardService,
            ISignalRService signalRService,
            ILogger<LeaderboardController> logger)
        {
            _leaderboardService = leaderboardService;
            _signalRService = signalRService;
            _logger = logger;
        }

        /// <summary>
        /// Get the full tournament leaderboard with all teams and scores
        /// </summary>
        [HttpGet("tournament/{tournamentId:int}")]
        public async Task<ActionResult<LeaderboardResult>> GetTournamentLeaderboard(int tournamentId)
        {
            try
            {
                var leaderboard = await _leaderboardService.CalculateLeaderboardAsync(tournamentId);

                if (leaderboard == null)
                    return NotFound($"Tournament {tournamentId} not found");

                return Ok(leaderboard);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Tournament {TournamentId} not found", tournamentId);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leaderboard for tournament {TournamentId}", tournamentId);
                return StatusCode(500, "Error retrieving leaderboard");
            }
        }

        /// <summary>
        /// Get scores for a specific round
        /// </summary>
        [HttpGet("tournament/{tournamentId:int}/round/{roundNumber:int}")]
        public async Task<ActionResult<List<TeamRoundScore>>> GetRoundLeaderboard(int tournamentId, int roundNumber)
        {
            try
            {
                var roundScores = await _leaderboardService.GetRoundScoresAsync(tournamentId, roundNumber);
                return Ok(roundScores);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving round {RoundNumber} scores for tournament {TournamentId}",
                    roundNumber, tournamentId);
                return StatusCode(500, "Error retrieving round scores");
            }
        }

        /// <summary>
        /// Manually trigger a leaderboard refresh (admin only)
        /// </summary>
        [HttpPost("tournament/{tournamentId:int}/refresh")]
        public async Task<ActionResult> RefreshLeaderboard(int tournamentId)
        {
            try
            {
                // Verify admin role
                if (!IsAdmin())
                    return Forbid("Admin access required");

                // Calculate fresh leaderboard
                var leaderboard = await _leaderboardService.CalculateLeaderboardAsync(tournamentId);

                // Broadcast to all connected clients
                await _signalRService.BroadcastLeaderboardUpdateAsync(tournamentId);

                _logger.LogInformation("Leaderboard manually refreshed for tournament {TournamentId}", tournamentId);

                return Ok(new { message = "Leaderboard refreshed successfully", timestamp = DateTime.UtcNow });
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing leaderboard for tournament {TournamentId}", tournamentId);
                return StatusCode(500, "Error refreshing leaderboard");
            }
        }

        /// <summary>
        /// Get leaderboard summary (top 5 teams) for quick display
        /// </summary>
        [HttpGet("tournament/{tournamentId:int}/summary")]
        public async Task<ActionResult<LeaderboardSummary>> GetLeaderboardSummary(int tournamentId)
        {
            try
            {
                var fullLeaderboard = await _leaderboardService.CalculateLeaderboardAsync(tournamentId);

                if (fullLeaderboard == null)
                    return NotFound($"Tournament {tournamentId} not found");

                var summary = new LeaderboardSummary
                {
                    TournamentId = tournamentId,
                    TournamentName = fullLeaderboard.TournamentName,
                    LastUpdated = fullLeaderboard.LastUpdated,
                    TopTeams = fullLeaderboard.Entries.Take(5).ToList(),
                    TotalTeams = fullLeaderboard.Entries.Count,
                    CompletedRounds = fullLeaderboard.RoundCount
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leaderboard summary for tournament {TournamentId}", tournamentId);
                return StatusCode(500, "Error retrieving leaderboard summary");
            }
        }

        /// <summary>
        /// Get team position and surrounding teams (for mobile displays)
        /// </summary>
        [HttpGet("tournament/{tournamentId:int}/team/{teamId:int}/position")]
        public async Task<ActionResult<TeamPositionView>> GetTeamPosition(int tournamentId, int teamId)
        {
            try
            {
                var leaderboard = await _leaderboardService.CalculateLeaderboardAsync(tournamentId);

                if (leaderboard == null)
                    return NotFound($"Tournament {tournamentId} not found");

                var teamEntry = leaderboard.Entries.FirstOrDefault(e => e.TeamId == teamId);
                if (teamEntry == null)
                    return NotFound($"Team {teamId} not found in tournament {tournamentId}");

                // Get surrounding teams (2 above, team itself, 2 below)
                var teamIndex = leaderboard.Entries.IndexOf(teamEntry);
                var startIndex = Math.Max(0, teamIndex - 2);
                var endIndex = Math.Min(leaderboard.Entries.Count - 1, teamIndex + 2);

                var surroundingTeams = leaderboard.Entries
                    .Skip(startIndex)
                    .Take(endIndex - startIndex + 1)
                    .ToList();

                var positionView = new TeamPositionView
                {
                    FocusTeam = teamEntry,
                    SurroundingTeams = surroundingTeams,
                    TotalTeams = leaderboard.Entries.Count
                };

                return Ok(positionView);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving team position for team {TeamId} in tournament {TournamentId}",
                    teamId, tournamentId);
                return StatusCode(500, "Error retrieving team position");
            }
        }

        private bool IsAdmin()
        {
            // Check for admin role in JWT claims or header
            return HttpContext.Request.Headers.TryGetValue("X-User-Role", out var role) &&
                   role == "admin";
        }
    }

    // Response DTOs
    public class LeaderboardSummary
    {
        public int TournamentId { get; set; }
        public string TournamentName { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
        public List<LeaderboardEntry> TopTeams { get; set; } = new();
        public int TotalTeams { get; set; }
        public int CompletedRounds { get; set; }
    }

    public class TeamPositionView
    {
        public LeaderboardEntry FocusTeam { get; set; } = new();
        public List<LeaderboardEntry> SurroundingTeams { get; set; } = new();
        public int TotalTeams { get; set; }
    }
}