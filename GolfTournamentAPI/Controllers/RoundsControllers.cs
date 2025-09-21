
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;
using GolfTournamentData.Models;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoundsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RoundsController(AppDbContext context) => _context = context;

        
        [HttpGet("by-tournament/{tournamentId:int}")]
        public async Task<ActionResult<IEnumerable<Round>>> GetByTournament(int tournamentId)
        {
            var rounds = await _context.Rounds
                .AsNoTracking()
                .Where(r => r.TournamentId == tournamentId)
                .OrderBy(r => r.RoundNumber)
                .ToListAsync();
            return Ok(rounds);
        }

        [HttpPost]
        public async Task<ActionResult<Round>> PostRound([FromBody] RoundCreateDto dto)
        {
            if (dto == null) return BadRequest("Body was empty.");
            if (dto.TournamentId <= 0) return BadRequest("TournamentId is required.");
            if (dto.RoundNumber <= 0) return BadRequest("RoundNumber must be positive.");

            var tournamentExists = await _context.Tournaments
                .AnyAsync(t => t.TournamentId == dto.TournamentId);
            if (!tournamentExists) return BadRequest($"Tournament {dto.TournamentId} does not exist.");

            var exists = await _context.Rounds.AnyAsync(r =>
                r.TournamentId == dto.TournamentId && r.RoundNumber == dto.RoundNumber);
            if (exists) return Conflict($"Round {dto.RoundNumber} already exists for tournament {dto.TournamentId}.");

            var round = new Round
            {
                TournamentId = dto.TournamentId,
                RoundNumber = dto.RoundNumber,
                Date = dto.Date ?? DateTime.UtcNow.Date
            };

            _context.Rounds.Add(round);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetByTournament), new { tournamentId = dto.TournamentId }, round);
        }

    
        [HttpPost("seed/{tournamentId:int}")]
        public async Task<ActionResult> Seed(int tournamentId, [FromQuery] int count = 1)
        {
            if (count <= 0) return BadRequest("count must be >= 1");
            var t = await _context.Tournaments.AsNoTracking()
                .FirstOrDefaultAsync(x => x.TournamentId == tournamentId);
            if (t == null) return BadRequest($"Tournament {tournamentId} does not exist.");

            var existing = await _context.Rounds
                .Where(r => r.TournamentId == tournamentId)
                .Select(r => r.RoundNumber)
                .ToListAsync();

            var toAdd = new List<Round>();
            for (int n = 1; n <= count; n++)
            {
                if (!existing.Contains(n))
                {
                    toAdd.Add(new Round
                    {
                        TournamentId = tournamentId,
                        RoundNumber = n,
                        Date = t.StartDate.AddDays(n - 1)
                    });
                }
            }

            if (toAdd.Count == 0) return Ok(new { message = "No new rounds to add." });

            _context.Rounds.AddRange(toAdd);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Added {toAdd.Count} round(s)." });
        }
[HttpPost("ensure")]
public async Task<IActionResult> EnsureRound([FromBody] RoundCreateDto dto)
{
    if (dto == null) return BadRequest("Body was empty.");
    if (dto.TournamentId <= 0) return BadRequest("TournamentId is required.");
    if (dto.RoundNumber < 1 || dto.RoundNumber > 2) return BadRequest("RoundNumber must be 1 or 2.");

    var tourney = await _context.Tournaments
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.TournamentId == dto.TournamentId);
    if (tourney is null) return NotFound($"Tournament {dto.TournamentId} not found.");

    var existing = await _context.Rounds
        .FirstOrDefaultAsync(r => r.TournamentId == dto.TournamentId && r.RoundNumber == dto.RoundNumber);
    if (existing != null) return Ok(existing);

    var round = new Round
    {
        TournamentId = dto.TournamentId,
        RoundNumber  = dto.RoundNumber,
        Date         = dto.Date ?? (tourney.StartDate == default ? DateTime.UtcNow.Date
        : tourney.StartDate.Date.AddDays(dto.RoundNumber - 1))
    };

    _context.Rounds.Add(round);
    await _context.SaveChangesAsync();
    return CreatedAtAction(nameof(GetByTournament), new { tournamentId = dto.TournamentId }, round);
}



    }

    public class RoundCreateDto
    {
        public int TournamentId { get; set; }
        public int RoundNumber { get; set; }
        public DateTime? Date { get; set; }
    }
}
