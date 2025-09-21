namespace GolfTournamentData.Models
{
    public class ScoreCreateDto
    {
        public int TeamId { get; set; }
        public int RoundId { get; set; }
        public int HoleNumber { get; set; }
        public int Strokes { get; set; }
        public int Par { get; set; }
    }
}