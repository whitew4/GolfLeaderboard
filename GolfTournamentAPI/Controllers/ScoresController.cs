// GolfTournamentAPI/Controllers/ScoresController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolfTournamentData;
using GolfTournamentData.Models;
using GolfTournamentAPI.Services;
using System.ComponentModel.DataAnnotations;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScoresController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ISignalRService _signalRService;
        private readonly ILeaderboardCalculationService _leaderboardService;
        private readonly ILogger<ScoresController> _logger;

        public ScoresController(
            AppDbContext context,
            ISignalRService signalRService,
            ILeaderboardCalculationService leaderboardService,
            ILogger<ScoresController> logger)
        {
            _context = context;
            _signalRService = signalRService;
            _leaderboardService = leaderboardService;
            _logger = logger;
        }

        /// <summary>
        /// Get scores with optional filtering
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ScoreDto>>> GetScores(
            [FromQuery] int? teamId,
            [FromQuery] int? roundId,
            [FromQuery] int? tournamentId)
        {
            try
            {
                var query = _context.Scores
                    .Include(s => s.Team)
                    .Include(s => s.Round)
                    .AsNoTracking()
                    .AsQueryable();

                if (teamId.HasValue)
                    query = query.Where(s => s.TeamId == teamId.Value);

                if (roundId.HasValue)
                    query = query.Where(s => s.RoundId == roundId.Value);

                if (tournamentId.HasValue)
                    query = query.Where(s => s.Round.TournamentId == tournamentId.Value);

                var scores = await query
                    .OrderBy(s => s.Round.RoundNumber)
                    .ThenBy(s => s.HoleNumber)
                    .Select(s => new ScoreDto
                    {
                        ScoreId = s.ScoreId,
                        TeamId = s.TeamId,
                        TeamName = s.Team.TeamName,
                        RoundId = s.RoundId,
                        RoundNumber = s.Round.RoundNumber,
                        TournamentId = s.Round.TournamentId,
                        HoleNumber = s.HoleNumber,
                        Strokes = s.Strokes,
                        Par = s.Par,
                        Score = s.Strokes - s.Par
                    })
                    .ToListAsync();

                return Ok(scores);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving scores");
                return StatusCode(500, "Error retrieving scores");
            }
        }

        /// <summary>
        /// Create or update a score with real-time broadcasting
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ScoreDto>> CreateScore([FromBody] CreateScoreRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Validate the request
                var validationResult = await ValidateScoreRequestAsync(request);
                if (!validationResult.IsValid)
                    return BadRequest(validationResult.ErrorMessage);

                // Get team and round info for real-time updates
                var team = await _context.Teams
                    .AsNoTracking()
                    .FirstAsync(t => t.TeamId == request.TeamId);

                var round = await _context.Rounds
                    .AsNoTracking()
                    .FirstAsync(r => r.RoundId == request.RoundId);

                // Store previous leaderboard positions for comparison
                var previousLeaderboard = await _leaderboardService.GetTournamentLeaderboardAsync(round.TournamentId);
                var previousPosition = previousLeaderboard.FirstOrDefault(e => e.TeamId == request.TeamId)?.Position ?? 0;

                // Create or update the score
                var score = await UpsertScoreAsync(request);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Broadcast score update
                await _signalRService.BroadcastScoreUpdateAsync(
                    round.TournamentId,
                    team.TeamName,
                    request.HoleNumber,
                    request.Strokes);

                // Check for position changes and broadcast
                var newLeaderboard = await _leaderboardService.GetTournamentLeaderboardAsync(round.TournamentId);
                var newPosition = newLeaderboard.FirstOrDefault(e => e.TeamId == request.TeamId)?.Position ?? 0;

                if (previousPosition > 0 && newPosition != previousPosition)
                {
                    await _signalRService.BroadcastPositionChangeAsync(
                        round.TournamentId,
                        team.TeamName,
                        previousPosition,
                        newPosition);
                }

                var scoreDto = new ScoreDto
                {
                    ScoreId = score.ScoreId,
                    TeamId = score.TeamId,
                    TeamName = team.TeamName,
                    RoundId = score.RoundId,
                    RoundNumber = round.RoundNumber,
                    TournamentId = round.TournamentId,
                    HoleNumber = score.HoleNumber,
                    Strokes = score.Strokes,
                    Par = score.Par,
                    Score = score.Strokes - score.Par
                };

                return CreatedAtAction(nameof(GetScore), new { id = score.ScoreId }, scoreDto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating score for team {TeamId}, round {RoundId}, hole {HoleNumber}",
                    request.TeamId, request.RoundId, request.HoleNumber);
                return StatusCode(500, "Error creating score");
            }
        }

        /// <summary>
        /// Get a specific score by ID
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ScoreDto>> GetScore(int id)
        {
            try
            {
                var score = await _context.Scores
                    .Include(s => s.Team)
                    .Include(s => s.Round)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.ScoreId == id);

                if (score == null)
                    return NotFound($"Score with ID {id} not found");

                var scoreDto = new ScoreDto
                {
                    ScoreId = score.ScoreId,
                    TeamId = score.TeamId,
                    TeamName = score.Team.TeamName,
                    RoundId = score.RoundId,
                    RoundNumber = score.Round.RoundNumber,
                    TournamentId = score.Round.TournamentId,
                    HoleNumber = score.HoleNumber,
                    Strokes = score.Strokes,
                    Par = score.Par,
                    Score = score.Strokes - score.Par
                };

                return Ok(scoreDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving score {ScoreId}", id);
                return StatusCode(500, "Error retrieving score");
            }
        }

        /// <summary>
        /// Get scores for a team in a specific round
        /// </summary>
        [HttpGet("team/{teamId:int}/round/{roundId:int}")]
        public async Task<ActionResult<List<ScoreDto>>> GetTeamRoundScores(int teamId, int roundId)
        {
            try
            {
                var scores = await _context.Scores
                    .Include(s => s.Team)
                    .Include(s => s.Round)
                    .Where(s => s.TeamId == teamId && s.RoundId == roundId)
                    .OrderBy(s => s.HoleNumber)
                    .AsNoTracking()
                    .Select(s => new ScoreDto
                    {
                        ScoreId = s.ScoreId,
                        TeamId = s.TeamId,
                        TeamName = s.Team.TeamName,
                        RoundId = s.RoundId,
                        RoundNumber = s.Round.RoundNumber,
                        TournamentId = s.Round.TournamentId,
                        HoleNumber = s.HoleNumber,
                        Strokes = s.Strokes,
                        Par = s.Par,
                        Score = s.Strokes - s.Par
                    })
                    .ToListAsync();

                return Ok(scores);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving scores for team {TeamId}, round {RoundId}", teamId, roundId);
                return StatusCode(500, "Error retrieving team round scores");
            }
        }

        private async Task<ValidationResult> ValidateScoreRequestAsync(CreateScoreRequest request)
        {
            // Validate hole number
            if (request.HoleNumber < 1 || request.HoleNumber > 18)
                return ValidationResult.Invalid("Hole number must be between 1 and 18");

            // Validate strokes
            if (request.Strokes <= 0 || request.Strokes > 15)
                return ValidationResult.Invalid("Strokes must be between 1 and 15");

            // Validate par
            if (request.Par < 2 || request.Par > 7)
                return ValidationResult.Invalid("Par must be between 2 and 7");

            // Validate team exists
            var teamExists = await _context.Teams.AnyAsync(t => t.TeamId == request.TeamId);
            if (!teamExists)
                return ValidationResult.Invalid($"Team {request.TeamId} does not exist");

            // Validate round exists
            var roundExists = await _context.Rounds.AnyAsync(r => r.RoundId == request.RoundId);
            if (!roundExists)
                return ValidationResult.Invalid($"Round {request.RoundId} does not exist");

            // Validate team belongs to same tournament as round
            var teamTournamentId = await _context.Teams
                .Where(t => t.TeamId == request.TeamId)
                .Select(t => t.TournamentId)
                .FirstOrDefaultAsync();

            var roundTournamentId = await _context.Rounds
                .Where(r => r.RoundId == request.RoundId)
                .Select(r => r.TournamentId)
                .FirstOrDefaultAsync();

            if (teamTournamentId != roundTournamentId)
                return ValidationResult.Invalid("Team and round must belong to the same tournament");

            return ValidationResult.Valid();
        }

        private async Task<Score> UpsertScoreAsync(CreateScoreRequest request)
        {
            var existingScore = await _context.Scores
                .FirstOrDefaultAsync(s =>
                    s.TeamId == request.TeamId &&
                    s.RoundId == request.RoundId &&
                    s.HoleNumber == request.HoleNumber);

            if (existingScore != null)
            {
                // Update existing score
                existingScore.Strokes = request.Strokes;
                existingScore.Par = request.Par;
                return existingScore;
            }
            else
            {
                // Create new score
                var newScore = new Score
                {
                    TeamId = request.TeamId,
                    RoundId = request.RoundId,
                    HoleNumber = request.HoleNumber,
                    Strokes = request.Strokes,
                    Par = request.Par
                };

                _context.Scores.Add(newScore);
                return newScore;
            }
        }
    }

    // DTOs
    public class CreateScoreRequest
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "TeamId must be greater than 0")]
        public int TeamId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "RoundId must be greater than 0")]
        public int RoundId { get; set; }

        [Required]
        [Range(1, 18, ErrorMessage = "HoleNumber must be between 1 and 18")]
        public int HoleNumber { get; set; }

        [Required]
        [Range(1, 15, ErrorMessage = "Strokes must be between 1 and 15")]
        public int Strokes { get; set; }

        [Required]
        [Range(2, 7, ErrorMessage = "Par must be between 2 and 7")]
        public int Par { get; set; }
    }

    public class ScoreDto
    {
        public int ScoreId { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public int RoundId { get; set; }
        public int RoundNumber { get; set; }
        public int TournamentId { get; set; }
        public int HoleNumber { get; set; }
        public int Strokes { get; set; }
        public int Par { get; set; }
        public int Score { get; set; } // Relative to par
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;

        public static ValidationResult Valid() => new() { IsValid = true };
        public static ValidationResult Invalid(string message) => new() { IsValid = false, ErrorMessage = message };
    }
}