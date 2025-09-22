// GolfTournamentAPI/Hubs/LeaderboardHub.cs
using Microsoft.AspNetCore.SignalR;
using GolfTournamentAPI.Services;
using System.Collections.Concurrent;

namespace GolfTournamentAPI.Hubs
{
    public class LeaderboardHub : Hub
    {
        private static readonly ConcurrentDictionary<string, UserConnection> _connections = new();
        private readonly ILeaderboardCalculationService _leaderboardService;
        private readonly ILogger<LeaderboardHub> _logger;

        public LeaderboardHub(ILeaderboardCalculationService leaderboardService, ILogger<LeaderboardHub> logger)
        {
            _leaderboardService = leaderboardService;
            _logger = logger;
        }

        public async Task JoinTournamentGroup(int tournamentId, string? userName = null)
        {
            try
            {
                var groupName = GetTournamentGroupName(tournamentId);
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

                _connections[Context.ConnectionId] = new UserConnection
                {
                    ConnectionId = Context.ConnectionId,
                    TournamentId = tournamentId,
                    UserName = userName ?? "Anonymous",
                    ConnectedAt = DateTime.UtcNow
                };

                _logger.LogInformation("User {UserName} joined tournament {TournamentId} group", userName, tournamentId);

                // Send current leaderboard to the newly connected user
                var leaderboard = await _leaderboardService.GetTournamentLeaderboardAsync(tournamentId);
                await Clients.Caller.SendAsync("LeaderboardUpdated", leaderboard);

                // Notify others about new viewer
                await Clients.OthersInGroup(groupName).SendAsync("ViewerJoined", userName, GetGroupMemberCount(tournamentId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining tournament group {TournamentId}", tournamentId);
                await Clients.Caller.SendAsync("Error", "Failed to join tournament");
            }
        }

        public async Task LeaveTournamentGroup(int tournamentId)
        {
            try
            {
                var groupName = GetTournamentGroupName(tournamentId);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

                if (_connections.TryRemove(Context.ConnectionId, out var userConnection))
                {
                    _logger.LogInformation("User {UserName} left tournament {TournamentId} group",
                        userConnection.UserName, tournamentId);

                    // Notify others about viewer leaving
                    await Clients.OthersInGroup(groupName).SendAsync("ViewerLeft",
                        userConnection.UserName, GetGroupMemberCount(tournamentId));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving tournament group {TournamentId}", tournamentId);
            }
        }

        public async Task SendScoreUpdate(int tournamentId, string teamName, int holeNumber, int strokes)
        {
            try
            {
                var groupName = GetTournamentGroupName(tournamentId);
                var message = $"{teamName} scored {strokes} on hole {holeNumber}";

                await Clients.Group(groupName).SendAsync("ScoreUpdate", new
                {
                    TournamentId = tournamentId,
                    TeamName = teamName,
                    HoleNumber = holeNumber,
                    Strokes = strokes,
                    Message = message,
                    Timestamp = DateTime.UtcNow
                });

                _logger.LogInformation("Score update sent for tournament {TournamentId}: {Message}",
                    tournamentId, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending score update for tournament {TournamentId}", tournamentId);
            }
        }

        public async Task RequestLeaderboardRefresh(int tournamentId)
        {
            try
            {
                var groupName = GetTournamentGroupName(tournamentId);
                var leaderboard = await _leaderboardService.GetTournamentLeaderboardAsync(tournamentId);

                await Clients.Group(groupName).SendAsync("LeaderboardUpdated", leaderboard);

                _logger.LogInformation("Leaderboard refresh sent for tournament {TournamentId}", tournamentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing leaderboard for tournament {TournamentId}", tournamentId);
                await Clients.Group(GetTournamentGroupName(tournamentId))
                    .SendAsync("Error", "Failed to refresh leaderboard");
            }
        }

        public async Task SendPositionChange(int tournamentId, string teamName, int oldPosition, int newPosition)
        {
            try
            {
                var groupName = GetTournamentGroupName(tournamentId);
                var message = newPosition < oldPosition
                    ? $"{teamName} moved up to #{newPosition}!"
                    : $"{teamName} dropped to #{newPosition}";

                await Clients.Group(groupName).SendAsync("PositionChange", new
                {
                    TournamentId = tournamentId,
                    TeamName = teamName,
                    OldPosition = oldPosition,
                    NewPosition = newPosition,
                    Message = message,
                    Timestamp = DateTime.UtcNow
                });

                _logger.LogInformation("Position change sent for tournament {TournamentId}: {Message}",
                    tournamentId, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending position change for tournament {TournamentId}", tournamentId);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                if (_connections.TryRemove(Context.ConnectionId, out var userConnection))
                {
                    var groupName = GetTournamentGroupName(userConnection.TournamentId);
                    await Clients.OthersInGroup(groupName).SendAsync("ViewerLeft",
                        userConnection.UserName, GetGroupMemberCount(userConnection.TournamentId));

                    _logger.LogInformation("User {UserName} disconnected from tournament {TournamentId}",
                        userConnection.UserName, userConnection.TournamentId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling disconnection for connection {ConnectionId}", Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        private static string GetTournamentGroupName(int tournamentId) => $"Tournament_{tournamentId}";

        private static int GetGroupMemberCount(int tournamentId)
        {
            return _connections.Values.Count(c => c.TournamentId == tournamentId);
        }
    }

    public class UserConnection
    {
        public string ConnectionId { get; set; } = string.Empty;
        public int TournamentId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; }
    }
}