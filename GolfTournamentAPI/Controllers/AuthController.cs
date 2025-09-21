using Microsoft.AspNetCore.Mvc;
using GolfTournamentAPI.Services;

namespace GolfTournamentAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JwtService _jwtService;

        public AuthController(JwtService jwtService)
        {
            _jwtService = jwtService;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            
            if (request.Username == "admin" && request.Password == "golf123")
            {
                var token = _jwtService.GenerateToken(request.Username);
                return Ok(new { token, username = request.Username });
            }

            return Unauthorized("Invalid credentials");
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}