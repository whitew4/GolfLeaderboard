// Tournament.cs - Fix nullable warnings
using GolfTournamentData.Models;
using System.ComponentModel.DataAnnotations;

namespace GolfTournamentData
{
    public class Tournament
    {
        public int TournamentId { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;  // Fix nullable warning

        public string? Location { get; set; }  // Optional location property

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string Status { get; set; } = "Upcoming";

        // Navigation properties
        public ICollection<Team> Teams { get; set; } = new List<Team>();
        public ICollection<Round> Rounds { get; set; } = new List<Round>();
    }
}