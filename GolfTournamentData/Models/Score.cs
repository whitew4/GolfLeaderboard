using System.Text.Json.Serialization;
using GolfTournamentData.Models;

namespace GolfTournamentData.Models
{
    public class Score
    {
        public int ScoreId { get; set; }
        public int TeamId { get; set; }
        public int TournamentId { get; set; } // ← ADD THIS
        public int RoundId { get; set; }
        public int HoleNumber { get; set; }
        public int Strokes { get; set; }
        public int Par { get; set; }
        
        // Navigation properties
        [JsonIgnore]
        public virtual Team? Team { get; set; }
        
        [JsonIgnore]
        public virtual Round? Round { get; set; }

        [JsonIgnore] // ← Add this too
        public virtual Tournament? Tournament { get; set; }
    }
}