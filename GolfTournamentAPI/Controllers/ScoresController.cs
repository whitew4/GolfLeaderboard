using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;
using GolfTournamentData.Models;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScoresController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ScoresController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Score>>> GetScores([FromQuery] int? teamId, [FromQuery] int? roundId)
        {
            var q = _context.Scores.AsNoTracking().AsQueryable();
            if (teamId.HasValue) q = q.Where(s => s.TeamId == teamId.Value);
            if (roundId.HasValue) q = q.Where(s => s.RoundId == roundId.Value);

            var list = await q
                .OrderBy(s => s.RoundId)
                .ThenBy(s => s.TeamId)
                .ThenBy(s => s.HoleNumber)
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost]
        public async Task<ActionResult<Score>> PostScore([FromBody] ScoreCreateDto dto)
        {
            if (dto is null) return BadRequest("Body was empty.");

            // --- Validate basics ---
            if (dto.TournamentId <= 0) return BadRequest("TournamentId is required and must be > 0.");
            if (dto.TeamId <= 0) return BadRequest("TeamId is required and must be > 0.");
            if (dto.RoundNumber <= 0) return BadRequest("RoundNumber is required and must be > 0.");
            if (dto.HoleNumber < 1 || dto.HoleNumber > 18) return BadRequest("HoleNumber must be between 1 and 18.");
            if (dto.Strokes <= 0) return BadRequest("Strokes must be positive.");
            if (dto.Par.HasValue && (dto.Par < 2 || dto.Par > 7)) return BadRequest("Par must be realistic (2–7).");

            // --- Ensure team exists and belongs to the tournament ---
            var team = await _context.Teams
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TeamId == dto.TeamId);
            if (team is null) return BadRequest($"Team {dto.TeamId} does not exist.");
            if (team.TournamentId != dto.TournamentId)
                return BadRequest($"Team {dto.TeamId} belongs to Tournament {team.TournamentId}, not {dto.TournamentId}.");

            // --- Find or CREATE the round for (TournamentId, RoundNumber) ---
            var round = await _context.Rounds
                .FirstOrDefaultAsync(r => r.TournamentId == dto.TournamentId && r.RoundNumber == dto.RoundNumber);

            if (round is null)
            {
                round = new Round
                {
                    TournamentId = dto.TournamentId,
                    RoundNumber = dto.RoundNumber
                };
                _context.Rounds.Add(round);
                await _context.SaveChangesAsync(); // materialize RoundId
            }

            // (Optional) If legacy roundId was provided and doesn't match, we ignore it and use the correct RoundId.
            var targetRoundId = round.RoundId;

            // --- Determine Par (map legacy "Score" to Par if used) ---
            var par = dto.Par ?? dto.Score ?? 4;
            if (par <= 0) par = 4;

            // --- Upsert Score for (Team, Round, Hole) ---
            var existing = await _context.Scores.FirstOrDefaultAsync(s =>
                s.TeamId == dto.TeamId &&
                s.RoundId == targetRoundId &&
                s.HoleNumber == dto.HoleNumber);

            if (existing is null)
            {
                var score = new Score
                {
                    TournamentId = round.TournamentId, 
                    TeamId = dto.TeamId,
                    RoundId = targetRoundId,
                    HoleNumber = dto.HoleNumber,
                    Strokes = dto.Strokes,
                    Par = par
                };

                _context.Scores.Add(score);

                try
                {
                    await _context.SaveChangesAsync();
                    return CreatedAtAction(nameof(GetScore), new { id = score.ScoreId }, score);
                }
                catch (DbUpdateException)
                {
                   
                    var concurrent = await _context.Scores.FirstOrDefaultAsync(s =>
                        s.TeamId == dto.TeamId &&
                        s.RoundId == targetRoundId &&
                        s.HoleNumber == dto.HoleNumber);

                    if (concurrent is null) throw; 

                    concurrent.Strokes = dto.Strokes;
                    concurrent.Par = par;
                    await _context.SaveChangesAsync();
                    return Ok(concurrent);
                }
            }
            else
            {
                // Update existing
                existing.Strokes = dto.Strokes;
            
                if (dto.Par.HasValue || dto.Score.HasValue)
                    existing.Par = par;

                // gotta keep these consistent
                existing.TournamentId = round.TournamentId;

                await _context.SaveChangesAsync();
                return Ok(existing);
            }
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Score>> GetScore(int id)
        {
            var score = await _context.Scores.AsNoTracking().FirstOrDefaultAsync(s => s.ScoreId == id);
            if (score == null) return NotFound();
            return Ok(score);
        }

        // PUT: api/scores/123
        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutScore(int id, [FromBody] ScoreUpdateDto dto)
        {
            var score = await _context.Scores.FirstOrDefaultAsync(s => s.ScoreId == id);
            if (score == null) return NotFound();

            if (dto.HoleNumber.HasValue)
            {
                if (dto.HoleNumber < 1 || dto.HoleNumber > 18)
                    return BadRequest("HoleNumber must be 1-18.");
                score.HoleNumber = dto.HoleNumber.Value;
            }

            if (dto.Strokes.HasValue)
            {
                if (dto.Strokes <= 0) return BadRequest("Strokes must be positive.");
                score.Strokes = dto.Strokes.Value;
            }

            if (dto.Par.HasValue)
            {
                if (dto.Par < 2 || dto.Par > 7) return BadRequest("Par must be realistic (2–7).");
                score.Par = dto.Par.Value;
            }

            // Allow moving to a different round by RoundId (existing behavior).
            if (dto.RoundId.HasValue && dto.RoundId.Value != score.RoundId)
            {
                var newRound = await _context.Rounds.AsNoTracking().FirstOrDefaultAsync(r => r.RoundId == dto.RoundId.Value);
                if (newRound == null) return BadRequest($"Round {dto.RoundId.Value} does not exist.");
                score.RoundId = dto.RoundId.Value;
                score.TournamentId = newRound.TournamentId; 
            }

            if (dto.TeamId.HasValue && dto.TeamId.Value != score.TeamId)
            {
                var team = await _context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.TeamId == dto.TeamId.Value);
                if (team == null) return BadRequest($"Team {dto.TeamId.Value} does not exist.");

                // Ensure team and round belong to same tournament
                var round = await _context.Rounds.AsNoTracking().FirstAsync(r => r.RoundId == score.RoundId);
                if (team.TournamentId != round.TournamentId)
                    return BadRequest($"Team {dto.TeamId.Value} (Tournament {team.TournamentId}) does not match Round {score.RoundId}'s Tournament {round.TournamentId}.");

                score.TeamId = dto.TeamId.Value;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteScore(int id)
        {
            var score = await _context.Scores.FindAsync(id);
            if (score == null) return NotFound();

            _context.Scores.Remove(score);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // --- DTOs ---

    public class ScoreCreateDto
    {
        // Required for Step 2 flow:
        public int TournamentId { get; set; }
        public int TeamId { get; set; }
        public int RoundNumber { get; set; }  
        public int HoleNumber { get; set; }
        public int Strokes { get; set; }

        // Optional / legacy compatibility:
        public int? RoundId { get; set; }      
        public int? Par { get; set; }          
        public int? Score { get; set; }        
    }

    public class ScoreUpdateDto
    {
        public int? TeamId { get; set; }
        public int? RoundId { get; set; }      
        public int? HoleNumber { get; set; }
        public int? Strokes { get; set; }
        public int? Par { get; set; }
    }
}
