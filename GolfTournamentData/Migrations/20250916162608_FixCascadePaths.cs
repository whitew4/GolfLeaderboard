using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolfTournamentData.Migrations
{
    public partial class FixCascadePaths : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Scores_Rounds_RoundId",
                table: "Scores");

            migrationBuilder.DropForeignKey(
                name: "FK_Scores_Tournaments_TournamentId",
                table: "Scores");

            migrationBuilder.AddForeignKey(
                name: "FK_Scores_Rounds_RoundId",
                table: "Scores",
                column: "RoundId",
                principalTable: "Rounds",
                principalColumn: "RoundId");

            migrationBuilder.AddForeignKey(
                name: "FK_Scores_Tournaments_TournamentId",
                table: "Scores",
                column: "TournamentId",
                principalTable: "Tournaments",
                principalColumn: "TournamentId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Scores_Rounds_RoundId",
                table: "Scores");

            migrationBuilder.DropForeignKey(
                name: "FK_Scores_Tournaments_TournamentId",
                table: "Scores");

            migrationBuilder.AddForeignKey(
                name: "FK_Scores_Rounds_RoundId",
                table: "Scores",
                column: "RoundId",
                principalTable: "Rounds",
                principalColumn: "RoundId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Scores_Tournaments_TournamentId",
                table: "Scores",
                column: "TournamentId",
                principalTable: "Tournaments",
                principalColumn: "TournamentId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
