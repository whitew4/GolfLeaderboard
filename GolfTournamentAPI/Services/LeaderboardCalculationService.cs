using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;

namespace GolfTournamentAPI.Services
{
    public record LeaderboardRow(
        int TeamId,
        string TeamLabel,
        int RoundNumber,
        int HolesEntered,
        int TotalStrokes,
        int ToPar
    );

    public interface ILeaderboardCalculationService
    {
        Task<List<LeaderboardRow>> GetRoundAsync(int tournamentId, int roundNumber);
    }

    public class LeaderboardCalculationService : ILeaderboardCalculationService
    {
        private readonly AppDbContext _db;
        public LeaderboardCalculationService(AppDbContext db) => _db = db;

        public async Task<List<LeaderboardRow>> GetRoundAsync(int tournamentId, int roundNumber)
        {
            // Find the round by (tournament, roundNumber)
            var round = await _db.Rounds
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.TournamentId == tournamentId && r.RoundNumber == roundNumber);

            if (round is null) return new List<LeaderboardRow>();

            // Pull all scores for that round
            var scores = await _db.Scores
                .AsNoTracking()
                .Where(s => s.RoundId == round.RoundId)
                .ToListAsync();

            if (scores.Count == 0) return new List<LeaderboardRow>();

            // Group and project in memory
            var rows = scores
                .GroupBy(s => s.TeamId)
                .Select(g => new LeaderboardRow(
                    TeamId: g.Key,
                    TeamLabel: $"Team {g.Key}",            // safe fallback label
                    RoundNumber: roundNumber,
                    HolesEntered: g.Count(),
                    TotalStrokes: g.Sum(x => x.Strokes),
                    ToPar: g.Sum(x => x.Strokes - x.Par)
                ))
                .OrderBy(r => r.TotalStrokes)
                .ThenBy(r => r.HolesEntered)
                .ToList();

            return rows;
        }
    }
}
