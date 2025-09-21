using System.Text.Json.Serialization;

namespace GolfTournamentData.Models
{
    public class Tournament
    {
        public int TournamentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        // ✅ New property
        public string Status { get; set; } = "Scheduled";  

        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<Team> Teams { get; set; } = new List<Team>();

        [JsonIgnore]
        public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
    }
}
