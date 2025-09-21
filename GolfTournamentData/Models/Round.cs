using System;
using System.Collections.Generic;

namespace GolfTournamentData.Models
{
    public class Round
    {
        public int RoundId { get; set; }
        public int TournamentId { get; set; }
        public int RoundNumber { get; set; }
        public DateTime Date { get; set; }
        
        // Navigation properties
        public Tournament? Tournament { get; set; }
        public ICollection<Score> Scores { get; set; } = new List<Score>();
    }
}