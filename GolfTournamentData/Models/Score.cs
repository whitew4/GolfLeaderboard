// Score.cs - Add missing TournamentId property
using GolfTournamentData.Models;
using System.ComponentModel.DataAnnotations;

namespace GolfTournamentData
{
    public class Score
    {
        public int ScoreId { get; set; }

        [Required]
        public int TeamId { get; set; }

        [Required]
        public int RoundId { get; set; }

        [Required]
        public int TournamentId { get; set; }  // ADD THIS - matches your database

        [Required]
        public int HoleNumber { get; set; }

        [Required]
        public int Strokes { get; set; }

        [Required]
        public int Par { get; set; }

        // Navigation properties (optional)
        public Team? Team { get; set; }
        public Round? Round { get; set; }
        public Tournament? Tournament { get; set; }
    }
}