using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolfTournamentData.Migrations
{
    public partial class AddUniqueIndexes_Rounds_Scores : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
{
    // Safely drop legacy artifacts if they exist (from older shadow property "TournamentId1")
    migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Rounds_Tournaments_TournamentId1')
    ALTER TABLE [dbo].[Rounds] DROP CONSTRAINT [FK_Rounds_Tournaments_TournamentId1];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Rounds_TournamentId1' AND object_id = OBJECT_ID('[dbo].[Rounds]'))
    DROP INDEX [IX_Rounds_TournamentId1] ON [dbo].[Rounds];

IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'TournamentId1' AND Object_ID = Object_ID(N'[dbo].[Rounds]'))
    ALTER TABLE [dbo].[Rounds] DROP COLUMN [TournamentId1];
");

    // Create the unique indexes we actually want
    migrationBuilder.CreateIndex(
        name: "UX_Rounds_Tournament_RoundNumber",
        table: "Rounds",
        columns: new[] { "TournamentId", "RoundNumber" },
        unique: true);

    migrationBuilder.CreateIndex(
        name: "UX_Scores_Team_Round_Hole",
        table: "Scores",
        columns: new[] { "TeamId", "RoundId", "HoleNumber" },
        unique: true);
}


        protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropIndex(
        name: "UX_Rounds_Tournament_RoundNumber",
        table: "Rounds");

    migrationBuilder.DropIndex(
        name: "UX_Scores_Team_Round_Hole",
        table: "Scores");
}

    }
}
