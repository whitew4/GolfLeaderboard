using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;
using GolfTournamentData.Models;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TournamentsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/tournaments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tournament>>> GetTournaments()
        {
            var list = await _context.Tournaments
                .AsNoTracking()
                .Include(t => t.Teams)
                .Include(t => t.Rounds)
                .OrderBy(t => t.StartDate)
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/tournaments/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Tournament>> GetTournament(int id)
        {
            var tournament = await _context.Tournaments
                .AsNoTracking()
                .Include(t => t.Teams)
                .Include(t => t.Rounds)
                .FirstOrDefaultAsync(t => t.TournamentId == id);

            if (tournament == null)
                return NotFound();

            return Ok(tournament);
        }

        // POST: api/tournaments
        [HttpPost]
        public async Task<ActionResult<Tournament>> PostTournament([FromBody] Tournament tournament)
        {
            if (tournament == null)
                return BadRequest("Body was empty.");

            if (string.IsNullOrWhiteSpace(tournament.Name))
                return BadRequest("Name is required.");

            if (tournament.StartDate == default || tournament.EndDate == default)
                return BadRequest("StartDate and EndDate are required.");

            if (tournament.EndDate < tournament.StartDate)
                return BadRequest("EndDate cannot be before StartDate.");

            // Ensure NOT NULL column has a value
            if (string.IsNullOrWhiteSpace(tournament.Status))
                tournament.Status = "Scheduled";

            _context.Tournaments.Add(tournament);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    statusCode: 500,
                    title: "Failed to create tournament");
            }

            // ✅ Auto-create rounds: one per day, minimum 1
            try
            {
                var dayCount = (int)Math.Max(1,
                    (tournament.EndDate.Date - tournament.StartDate.Date).TotalDays + 1);

                // Only seed if none exist yet for this tournament
                var hasRounds = await _context.Rounds
                    .AnyAsync(r => r.TournamentId == tournament.TournamentId);

                if (!hasRounds)
                {
                    var rounds = Enumerable.Range(1, dayCount).Select(n => new Round
                    {
                        TournamentId = tournament.TournamentId,
                        RoundNumber  = n,
                        Date         = tournament.StartDate.Date.AddDays(n - 1)
                    });

                    _context.Rounds.AddRange(rounds);
                    await _context.SaveChangesAsync();
                }
            }
            catch (DbUpdateException ex)
            {
                // If seeding rounds fails, surface a clear message but still return the tournament
                return CreatedAtAction(nameof(GetTournament),
                    new { id = tournament.TournamentId },
                    new
                    {
                        tournament,
                        warning = "Tournament created, but failed to seed rounds.",
                        detail = ex.InnerException?.Message ?? ex.Message
                    });
            }

            return CreatedAtAction(nameof(GetTournament), new { id = tournament.TournamentId }, tournament);
        }

        // PUT: api/tournaments/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutTournament(int id, [FromBody] Tournament tournament)
        {
            if (tournament == null || id != tournament.TournamentId)
                return BadRequest("Route id mismatch or empty body.");

            if (string.IsNullOrWhiteSpace(tournament.Name))
                return BadRequest("Name is required.");

            if (tournament.StartDate == default || tournament.EndDate == default)
                return BadRequest("StartDate and EndDate are required.");

            if (tournament.EndDate < tournament.StartDate)
                return BadRequest("EndDate cannot be before StartDate.");

            if (string.IsNullOrWhiteSpace(tournament.Status))
                tournament.Status = "Scheduled";

            _context.Entry(tournament).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                var exists = await _context.Tournaments.AnyAsync(t => t.TournamentId == id);
                if (!exists) return NotFound();
                throw;
            }
            catch (DbUpdateException ex)
            {
                return Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    statusCode: 500,
                    title: "Failed to update tournament");
            }

            return NoContent();
        }

        // DELETE: api/tournaments/5 (delete a single tournament and dependents)
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTournament(int id)
        {
            var exists = await _context.Tournaments.AnyAsync(t => t.TournamentId == id);
            if (!exists)
                return NotFound();

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                // Delete Scores by team
                await _context.Database.ExecuteSqlRawAsync(@"
                    DELETE s
                    FROM [Scores] s
                    INNER JOIN [Teams] tt ON tt.TeamId = s.TeamId
                    WHERE tt.TournamentId = {0};", id);

                // Delete Scores by round
                await _context.Database.ExecuteSqlRawAsync(@"
                    DELETE s
                    FROM [Scores] s
                    INNER JOIN [Rounds] rr ON rr.RoundId = s.RoundId
                    WHERE rr.TournamentId = {0};", id);

                // Delete Teams & Rounds
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Teams]  WHERE [TournamentId] = {0};", id);
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Rounds] WHERE [TournamentId] = {0};", id);

                // Finally delete Tournament
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Tournaments] WHERE [TournamentId] = {0};", id);

                await tx.CommitAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    statusCode: 500,
                    title: "Failed to delete tournament");
            }
        }

        // DELETE: api/tournaments/all (delete ALL tournaments + dependents)
        [HttpDelete("all")]
        public async Task<IActionResult> DeleteAllTournaments()
        {
            // Optional simple guard via header
            if (!HttpContext.Request.Headers.TryGetValue("X-User-Role", out var role) || role != "admin")
                return Forbid();

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Scores];");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Teams];");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Rounds];");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Tournaments];");

                await tx.CommitAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    statusCode: 500,
                    title: "Failed to delete all tournaments");
            }
        }
    }
}
