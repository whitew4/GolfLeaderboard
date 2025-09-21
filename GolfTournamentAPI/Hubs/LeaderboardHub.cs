using Microsoft.AspNetCore.SignalR;

namespace GolfTournamentAPI.Hubs
{
    public class LeaderboardHub : Hub
    {
        public async Task SendScoreUpdate(int tournamentId, string teamName, int newPosition)
        {
            await Clients.Group(tournamentId.ToString())
                .SendAsync("ReceiveScoreUpdate", teamName, newPosition);
        }

        public async Task SendLeaderboardRefresh(int tournamentId)
        {
            await Clients.Group(tournamentId.ToString())
                .SendAsync("RefreshLeaderboard");
        }

        public async Task JoinTournamentGroup(int tournamentId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, tournamentId.ToString());
        }

        public async Task LeaveTournamentGroup(int tournamentId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, tournamentId.ToString());
        }
    }
}