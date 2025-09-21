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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --------------------------
            // Tournament
            // --------------------------
            modelBuilder.Entity<Tournament>(entity =>
            {
                entity.HasKey(t => t.TournamentId);
                entity.Property(t => t.Name).HasMaxLength(200);
            });

            // --------------------------
            // Team  (PAIR nav + FK to avoid "TournamentId1")
            // --------------------------
            modelBuilder.Entity<Team>(entity =>
            {
                entity.HasKey(t => t.TeamId);

                // Explicitly bind Team.Tournament <-> Tournament.Teams using Team.TournamentId
                entity.HasOne(t => t.Tournament)
                      .WithMany(tn => tn.Teams)
                      .HasForeignKey(t => t.TournamentId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(t => t.TournamentId)
                      .HasDatabaseName("IX_Teams_TournamentId");
            });

            // --------------------------
            // Round  (PAIR nav + FK to avoid "TournamentId1")
            // --------------------------
            modelBuilder.Entity<Round>(entity =>
            {
                entity.HasKey(r => r.RoundId);

                // Explicitly bind Round.Tournament <-> Tournament.Rounds using Round.TournamentId
                entity.HasOne(r => r.Tournament)
                      .WithMany(tn => tn.Rounds)
                      .HasForeignKey(r => r.TournamentId)
                      .OnDelete(DeleteBehavior.Cascade);

                // ✅ UNIQUE: one (TournamentId, RoundNumber) per tournament
                entity.HasIndex(r => new { r.TournamentId, r.RoundNumber })
                      .IsUnique()
                      .HasDatabaseName("UX_Rounds_Tournament_RoundNumber");
            });

            // --------------------------
            // Score  (NO ACTION on FKs to avoid multiple cascade paths)
            // --------------------------
            modelBuilder.Entity<Score>(entity =>
            {
                entity.HasKey(s => s.ScoreId);

                entity.Property(s => s.TeamId).IsRequired();
                entity.Property(s => s.TournamentId).IsRequired();
                entity.Property(s => s.RoundId).IsRequired();
                entity.Property(s => s.HoleNumber).IsRequired();
                entity.Property(s => s.Strokes).IsRequired();
                entity.Property(s => s.Par).IsRequired();

                // Score -> Team
                entity.HasOne(s => s.Team)
                      .WithMany(t => t.Scores)
                      .HasForeignKey(s => s.TeamId)
                      .OnDelete(DeleteBehavior.NoAction);

                // Score -> Tournament
                entity.HasOne(s => s.Tournament)
                      .WithMany() // no Scores collection on Tournament
                      .HasForeignKey(s => s.TournamentId)
                      .OnDelete(DeleteBehavior.NoAction);

                // Score -> Round
                entity.HasOne(s => s.Round)
                      .WithMany(r => r.Scores)
                      .HasForeignKey(s => s.RoundId)
                      .OnDelete(DeleteBehavior.NoAction);

                // Helpful single-column indexes
                entity.HasIndex(s => s.TeamId).HasDatabaseName("IX_Scores_TeamId");
                entity.HasIndex(s => s.TournamentId).HasDatabaseName("IX_Scores_TournamentId");

                // ❌ (old) non-unique index removed:
                // entity.HasIndex(s => new { s.TournamentId, s.RoundId, s.HoleNumber });

                // ✅ UNIQUE: at most one score per (Team, Round, Hole)
                entity.HasIndex(s => new { s.TeamId, s.RoundId, s.HoleNumber })
                      .IsUnique()
                      .HasDatabaseName("UX_Scores_Team_Round_Hole");
            });
        }
    }
}
