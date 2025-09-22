// GolfTournamentAPI/Services/LeaderboardCalculationService.cs
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;
using GolfTournamentData.Models;
using System.Text.Json;
using GolfTournamentAPI.Models;

namespace GolfTournamentAPI.Services
{
    public class LeaderboardCalculationService : ILeaderboardCalculationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LeaderboardCalculationService> _logger;

        public LeaderboardCalculationService(AppDbContext context, ILogger<LeaderboardCalculationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<LeaderboardResult> CalculateLeaderboardAsync(int tournamentId)
        {
            try
            {
                var tournament = await _context.Tournaments
                    // REMOVED: .Include(t => t.Course)
                    .Include(t => t.Teams)
                    .Include(t => t.Rounds)
                        .ThenInclude(r => r.Scores)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.TournamentId == tournamentId);

                if (tournament == null)
                    throw new ArgumentException($"Tournament {tournamentId} not found");

                // REMOVED: Course holes parsing - use standard 18-hole course
                var courseHoles = Enumerable.Repeat(4, 18).ToList(); // Default to 18 par-4 holes
                var leaderboardEntries = new List<LeaderboardEntry>();

                foreach (var team in tournament.Teams)
                {
                    var entry = await CalculateTeamScoreAsync(team, tournament.Rounds.ToList(), courseHoles);
                    leaderboardEntries.Add(entry);
                }

                // Sort by total score (relative to par), then by total strokes
                leaderboardEntries = leaderboardEntries
                    .OrderBy(e => e.TotalScore)
                    .ThenBy(e => e.TotalStrokes)
                    .ToList();

                // Assign positions with tie handling
                AssignPositions(leaderboardEntries);

                return new LeaderboardResult
                {
                    TournamentId = tournamentId,
                    TournamentName = tournament.Name,
                    LastUpdated = DateTime.UtcNow,
                    Entries = leaderboardEntries,
                    RoundCount = tournament.Rounds.Count
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating leaderboard for tournament {TournamentId}", tournamentId);
                throw;
            }
        }

        public async Task<List<TeamRoundScore>> GetRoundScoresAsync(int tournamentId, int roundNumber)
        {
            var round = await _context.Rounds
                .Include(r => r.Scores)
                    .ThenInclude(s => s.Team)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.TournamentId == tournamentId && r.RoundNumber == roundNumber);

            if (round == null)
                return new List<TeamRoundScore>();

            var teamScores = round.Scores
                .GroupBy(s => s.TeamId)
                .Select(g => new TeamRoundScore
                {
                    TeamId = g.Key,
                    TeamName = g.First().Team!.TeamName,
                    Player1Name = g.First().Team!.Player1Name,
                    Player2Name = g.First().Team!.Player2Name,
                    RoundNumber = roundNumber,
                    HolesCompleted = g.Count(),
                    TotalStrokes = g.Sum(s => s.Strokes),
                    ScoreToPar = g.Sum(s => s.Strokes - s.Par),
                    HoleScores = g.OrderBy(s => s.HoleNumber)
                                 .Select(s => new HoleScore
                                 {
                                     HoleNumber = s.HoleNumber,
                                     Strokes = s.Strokes,
                                     Par = s.Par,
                                     Score = s.Strokes - s.Par
                                 }).ToList()
                })
                .OrderBy(ts => ts.ScoreToPar)
                .ThenBy(ts => ts.TotalStrokes)
                .ToList();

            return teamScores;
        }

        public async Task<List<LeaderboardEntry>> GetTournamentLeaderboardAsync(int tournamentId)
        {
            var result = await CalculateLeaderboardAsync(tournamentId);
            return result.Entries;
        }

        private async Task<LeaderboardEntry> CalculateTeamScoreAsync(Team team, List<Round> rounds, List<int> courseHoles)
        {
            var allScores = await _context.Scores
                .Where(s => s.TeamId == team.TeamId && rounds.Select(r => r.RoundId).Contains(s.RoundId))
                .AsNoTracking()
                .ToListAsync();

            var roundScores = new Dictionary<int, RoundScore>();
            var totalStrokes = 0;
            var totalPar = 0;
            var holesCompleted = 0;

            foreach (var round in rounds)
            {
                var roundScoreData = allScores.Where(s => s.RoundId == round.RoundId).ToList();
                var roundStrokes = roundScoreData.Sum(s => s.Strokes);
                var roundPar = roundScoreData.Sum(s => s.Par);
                var roundHoles = roundScoreData.Count;

                roundScores[round.RoundNumber] = new RoundScore
                {
                    RoundNumber = round.RoundNumber,
                    Strokes = roundStrokes,
                    Par = roundPar,
                    Score = roundStrokes - roundPar,
                    HolesCompleted = roundHoles
                };

                totalStrokes += roundStrokes;
                totalPar += roundPar;
                holesCompleted += roundHoles;
            }

            return new LeaderboardEntry
            {
                TeamId = team.TeamId,
                TeamName = team.TeamName,
                Player1Name = team.Player1Name,
                Player2Name = team.Player2Name,
                TotalStrokes = totalStrokes,
                TotalScore = totalStrokes - totalPar,
                HolesCompleted = holesCompleted,
                RoundScores = roundScores,
                Position = 1 // Will be assigned later
            };
        }

        private static void AssignPositions(List<LeaderboardEntry> entries)
        {
            if (!entries.Any()) return;

            entries[0].Position = 1;

            for (int i = 1; i < entries.Count; i++)
            {
                if (entries[i].TotalScore == entries[i - 1].TotalScore &&
                    entries[i].TotalStrokes == entries[i - 1].TotalStrokes)
                {
                    // Tie - same position as previous
                    entries[i].Position = entries[i - 1].Position;
                }
                else
                {
                    // Different score - position is current index + 1
                    entries[i].Position = i + 1;
                }
            }
        }

        // REMOVED: ParseCourseHoles method since we no longer use Course.Holes
    }
}