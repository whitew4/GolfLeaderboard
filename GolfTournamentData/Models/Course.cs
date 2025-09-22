// GolfTournamentData/Models/Course.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GolfTournamentData.Models
{
    public class Course
    {
        public int CourseId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        public int HoleCount { get; set; } = 18;
        public int ParTotal { get; set; } = 72;

        [Column(TypeName = "nvarchar(max)")]
        public string Holes { get; set; } = "[]"; // JSON: [4,5,3,4,4,5,4,3,4,5,4,3,5,4,3,4,3,5]

        // Navigation properties
        public ICollection<Tournament> Tournaments { get; set; } = new List<Tournament>();
    }
}