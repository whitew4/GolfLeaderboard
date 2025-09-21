using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolfTournamentData.Migrations
{
    public partial class NoCascadeOnScores : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop FKs if they already exist (names may or may not exist yet)
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Teams_TeamId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Teams_TeamId;

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Tournaments_TournamentId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Tournaments_TournamentId;

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Rounds_RoundId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Rounds_RoundId;
            ");

            // Recreate ALL three FKs with NO ACTION (no cascade) to avoid multiple cascade paths
            migrationBuilder.AddForeignKey(
                name: "FK_Scores_Teams_TeamId",
                table: "Scores",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "TeamId",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Scores_Tournaments_TournamentId",
                table: "Scores",
                column: "TournamentId",
                principalTable: "Tournaments",
                principalColumn: "TournamentId",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Scores_Rounds_RoundId",
                table: "Scores",
                column: "RoundId",
                principalTable: "Rounds",
                principalColumn: "RoundId",
                onDelete: ReferentialAction.NoAction);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Down: drop the NO ACTION FKs (you can re-add cascades here if desired)
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Teams_TeamId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Teams_TeamId;

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Tournaments_TournamentId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Tournaments_TournamentId;

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Rounds_RoundId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Rounds_RoundId;
            ");
        }
    }
}
