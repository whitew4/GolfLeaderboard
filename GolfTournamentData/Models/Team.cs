using System.Text.Json.Serialization; // ← ADD THIS
using GolfTournamentData.Models;     // ← ADD THIS

namespace GolfTournamentData.Models
{
    public class Team
    {
        public int TeamId { get; set; }
        public int TournamentId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Player1Name { get; set; } = string.Empty;
        public string Player2Name { get; set; } = string.Empty;
        
        // Navigation properties
        [JsonIgnore]
        public virtual Tournament? Tournament { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Score> Scores { get; set; } = new List<Score>();
    }
}