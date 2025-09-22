// GolfTournamentData/Models/Team.cs
using System.ComponentModel.DataAnnotations;

namespace GolfTournamentData.Models
{
    public class Team
    {
        public int TeamId { get; set; }
        public int TournamentId { get; set; }

        [Required]
        [StringLength(100)]
        public string TeamName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Player1Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Player2Name { get; set; } = string.Empty;

        // Navigation properties
        public Tournament Tournament { get; set; } = null!;
        public ICollection<Score> Scores { get; set; } = new List<Score>();
    }
}