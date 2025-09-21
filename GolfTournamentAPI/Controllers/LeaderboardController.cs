using Microsoft.AspNetCore.Mvc;
using GolfTournamentAPI.Services;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/leaderboard")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ILeaderboardCalculationService _svc;
        public LeaderboardController(ILeaderboardCalculationService svc) => _svc = svc;

        [HttpGet("{tournamentId:int}/round/{roundNumber:int}")]
        public async Task<ActionResult<List<LeaderboardRow>>> Get(int tournamentId, int roundNumber)
            => Ok(await _svc.GetRoundAsync(tournamentId, roundNumber));
    }
}
