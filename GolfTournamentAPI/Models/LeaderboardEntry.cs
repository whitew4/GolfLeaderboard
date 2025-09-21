namespace GolfTournamentAPI.Models
{
    public class LeaderboardEntry
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Player1Name { get; set; } = string.Empty;
        public string Player2Name { get; set; } = string.Empty;
        public int TotalStrokes { get; set; }
        public int TotalScore { get; set; } // Relative to par (negative = under par)
        public int Position { get; set; }
    }
}