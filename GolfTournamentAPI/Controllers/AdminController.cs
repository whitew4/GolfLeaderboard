
using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminController(AppDbContext db) => _db = db;

        
        [HttpDelete("reset-tournament/{id:int}")]
        public async Task<IActionResult> ResetTournament(
            int id,
            [FromQuery(Name = "deleteTournament")] string? deleteTournament = null)
        {

            if (!Request.Headers.TryGetValue("X-User-Role", out var role) || role != "admin")
                return Forbid();

            
            var doDelete =
                string.Equals(deleteTournament, "true", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(deleteTournament, "1", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(deleteTournament, "yes", StringComparison.OrdinalIgnoreCase);

            var t = await _db.Tournaments
                .Include(x => x.Teams)
                .Include(x => x.Rounds).ThenInclude(r => r.Scores)
                .FirstOrDefaultAsync(x => x.TournamentId == id);

            if (t is null) return NotFound();

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                
                var scores = t.Rounds.SelectMany(r => r.Scores).ToList();
                if (scores.Count > 0) _db.Scores.RemoveRange(scores);
                if (t.Rounds.Count  > 0) _db.Rounds.RemoveRange(t.Rounds);
                if (t.Teams.Count   > 0) _db.Teams.RemoveRange(t.Teams);

                if (doDelete)
                {
                    _db.Tournaments.Remove(t);
                    await _db.SaveChangesAsync();
                    await tx.CommitAsync();
                    return NoContent(); 
                }

                
                await _db.SaveChangesAsync();
                await tx.CommitAsync();
                return Ok("Tournament data reset successfully");
            }
            catch
            {
                await tx.RollbackAsync();
                return StatusCode(500, new { message = "Failed to reset/delete tournament." });
            }
        }
    }
}
