// AppDbContext.cs - Updated to remove Course references
using GolfTournamentData.Models;
using Microsoft.EntityFrameworkCore;

namespace GolfTournamentData
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Tournament> Tournaments { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Round> Rounds { get; set; }
        public DbSet<Score> Scores { get; set; }

        // REMOVED: Course DbSet
        // public DbSet<Course> Courses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Tournament configuration
            modelBuilder.Entity<Tournament>(entity =>
            {
                entity.HasKey(t => t.TournamentId);
                entity.Property(t => t.Name).IsRequired().HasMaxLength(200);
                entity.Property(t => t.Location).HasMaxLength(200);
                entity.Property(t => t.Status).HasDefaultValue("Upcoming");
            });

            // Team configuration with explicit foreign key
            modelBuilder.Entity<Team>(entity =>
            {
                entity.HasKey(t => t.TeamId);
                entity.Property(t => t.TournamentId).IsRequired();

                // Explicit relationship configuration
                entity.HasOne<Tournament>()
                      .WithMany(t => t.Teams)
                      .HasForeignKey(t => t.TournamentId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Round configuration with explicit foreign key  
            modelBuilder.Entity<Round>(entity =>
            {
                entity.HasKey(r => r.RoundId);
                entity.Property(r => r.TournamentId).IsRequired();

                // Explicit relationship configuration
                entity.HasOne<Tournament>()
                      .WithMany(t => t.Rounds)
                      .HasForeignKey(r => r.TournamentId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Score configuration
            modelBuilder.Entity<Score>(entity =>
            {
                entity.HasKey(s => s.ScoreId);
                entity.Property(s => s.TeamId).IsRequired();
                entity.Property(s => s.RoundId).IsRequired();
                entity.Property(s => s.TournamentId).IsRequired();
            });
        }
    }
}