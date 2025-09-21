using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;
using GolfTournamentData.Models;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/teams
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Team>>> GetTeams()
        {
            return await _context.Teams
                .AsNoTracking()
                .ToListAsync();
        }

        // GET: api/teams/tournament/5
        [HttpGet("tournament/{tournamentId}")]
        public async Task<ActionResult<IEnumerable<Team>>> GetTeamsByTournament(int tournamentId)
        {
            var teams = await _context.Teams
                .Where(t => t.TournamentId == tournamentId)
                .AsNoTracking()
                .ToListAsync();

            if (!teams.Any())
            {
                return NotFound($"No teams found for tournament ID {tournamentId}");
            }

            return teams;
        }

        // GET: api/teams/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Team>> GetTeam(int id)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TeamId == id);

            if (team == null)
            {
                return NotFound($"Team with ID {id} not found");
            }

            return team;
        }

        // POST: api/teams
        [HttpPost]
        public async Task<ActionResult<Team>> PostTeam(Team team)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTeam), new { id = team.TeamId }, team);
        }

        // PUT: api/teams/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTeam(int id, Team team)
        {
            if (id != team.TeamId)
            {
                return BadRequest("ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Entry(team).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TeamExists(id))
                {
                    return NotFound($"Team with ID {id} not found");
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/teams/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeam(int id)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null)
            {
                return NotFound($"Team with ID {id} not found");
            }

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TeamExists(int id)
        {
            return _context.Teams.Any(e => e.TeamId == id);
        }
    }
}