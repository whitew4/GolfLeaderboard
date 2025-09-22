// GolfTournamentAPI/Services/SignalRService.cs
using Microsoft.AspNetCore.SignalR;
using GolfTournamentAPI.Hubs;

namespace GolfTournamentAPI.Services
{
    public interface ISignalRService
    {
        Task BroadcastScoreUpdateAsync(int tournamentId, string teamName, int holeNumber, int strokes);
        Task BroadcastLeaderboardUpdateAsync(int tournamentId);
        Task BroadcastPositionChangeAsync(int tournamentId, string teamName, int oldPosition, int newPosition);
    }

    public class SignalRService : ISignalRService
    {
        private readonly IHubContext<LeaderboardHub> _hubContext;
        private readonly ILeaderboardCalculationService _leaderboardService;
        private readonly ILogger<SignalRService> _logger;

        public SignalRService(
            IHubContext<LeaderboardHub> hubContext,
            ILeaderboardCalculationService leaderboardService,
            ILogger<SignalRService> logger)
        {
            _hubContext = hubContext;
            _leaderboardService = leaderboardService;
            _logger = logger;
        }

        public async Task BroadcastScoreUpdateAsync(int tournamentId, string teamName, int holeNumber, int strokes)
        {
            try
            {
                var groupName = $"Tournament_{tournamentId}";

                await _hubContext.Clients.Group(groupName).SendAsync("ScoreUpdate", new
                {
                    TournamentId = tournamentId,
                    TeamName = teamName,
                    HoleNumber = holeNumber,
                    Strokes = strokes,
                    Message = $"{teamName} scored {strokes} on hole {holeNumber}",
                    Timestamp = DateTime.UtcNow
                });

                // Also trigger leaderboard refresh
                await BroadcastLeaderboardUpdateAsync(tournamentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting score update for tournament {TournamentId}", tournamentId);
            }
        }

        public async Task BroadcastLeaderboardUpdateAsync(int tournamentId)
        {
            try
            {
                var groupName = $"Tournament_{tournamentId}";
                var leaderboard = await _leaderboardService.GetTournamentLeaderboardAsync(tournamentId);

                await _hubContext.Clients.Group(groupName).SendAsync("LeaderboardUpdated", leaderboard);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting leaderboard update for tournament {TournamentId}", tournamentId);
            }
        }

        public async Task BroadcastPositionChangeAsync(int tournamentId, string teamName, int oldPosition, int newPosition)
        {
            try
            {
                var groupName = $"Tournament_{tournamentId}";
                var message = newPosition < oldPosition
                    ? $"{teamName} moved up to #{newPosition}!"
                    : $"{teamName} dropped to #{newPosition}";

                await _hubContext.Clients.Group(groupName).SendAsync("PositionChange", new
                {
                    TournamentId = tournamentId,
                    TeamName = teamName,
                    OldPosition = oldPosition,
                    NewPosition = newPosition,
                    Message = message,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting position change for tournament {TournamentId}", tournamentId);
            }
        }
    }
}