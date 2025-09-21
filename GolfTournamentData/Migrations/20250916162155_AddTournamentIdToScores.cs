using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolfTournamentData.Migrations
{
    public partial class AddTournamentIdToScores : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 0) Ensure composite index drop is safe (may not exist yet)
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Scores_TournamentId_RoundId_HoleNumber'
                      AND object_id = OBJECT_ID('dbo.Scores')
                )
                BEGIN
                    DROP INDEX IX_Scores_TournamentId_RoundId_HoleNumber ON dbo.Scores;
                END
            ");

            // 1) Add TournamentId column if missing (as NULL first)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'Scores' AND COLUMN_NAME = 'TournamentId'
                )
                BEGIN
                    ALTER TABLE dbo.Scores ADD TournamentId INT NULL;
                END
            ");

            // 2) Backfill TournamentId from Teams when null
            migrationBuilder.Sql(@"
                UPDATE s
                SET s.TournamentId = t.TournamentId
                FROM dbo.Scores s
                INNER JOIN dbo.Teams t ON t.TeamId = s.TeamId
                WHERE s.TournamentId IS NULL;
            ");

            // 3) Make NOT NULL (only if no nulls remain)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM dbo.Scores WHERE TournamentId IS NULL)
                BEGIN
                    DECLARE @dc sysname;
                    SELECT @dc = d.name
                    FROM sys.default_constraints AS d
                    INNER JOIN sys.columns AS c
                      ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID('dbo.Scores')
                      AND c.name = 'TournamentId';

                    IF @dc IS NOT NULL
                    BEGIN
                        DECLARE @sql nvarchar(max) = N'ALTER TABLE dbo.Scores DROP CONSTRAINT ' + QUOTENAME(@dc) + N';';
                        EXEC (@sql);
                    END

                    ALTER TABLE dbo.Scores ALTER COLUMN TournamentId INT NOT NULL;
                END
            ");

            // 4) Create helpful indexes if missing
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_Scores_TournamentId' AND object_id = OBJECT_ID('dbo.Scores')
                )
                BEGIN
                    CREATE INDEX IX_Scores_TournamentId ON dbo.Scores(TournamentId);
                END

                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_Scores_TournamentId_RoundId_HoleNumber'
                      AND object_id = OBJECT_ID('dbo.Scores')
                )
                BEGIN
                    CREATE INDEX IX_Scores_TournamentId_RoundId_HoleNumber
                    ON dbo.Scores (TournamentId, RoundId, HoleNumber);
                END
            ");

            // 5) Drop any existing FKs to avoid conflicts / cascades
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Teams_TeamId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Teams_TeamId;

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Tournaments_TournamentId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Tournaments_TournamentId;

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Rounds_RoundId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Rounds_RoundId;
            ");

            // 6) Recreate the FKs with NO ACTION (permanent fix for multiple cascade paths)
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
            // Drop FKs safely
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Teams_TeamId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Teams_TeamId;
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Tournaments_TournamentId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Tournaments_TournamentId;
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Scores_Rounds_RoundId')
                    ALTER TABLE dbo.Scores DROP CONSTRAINT FK_Scores_Rounds_RoundId;
            ");

            // Drop indexes if they exist
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_Scores_TournamentId_RoundId_HoleNumber'
                      AND object_id = OBJECT_ID('dbo.Scores')
                )
                BEGIN
                    DROP INDEX IX_Scores_TournamentId_RoundId_HoleNumber ON dbo.Scores;
                END

                IF EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_Scores_TournamentId'
                      AND object_id = OBJECT_ID('dbo.Scores')
                )
                BEGIN
                    DROP INDEX IX_Scores_TournamentId ON dbo.Scores;
                END
            ");

            // Make column nullable then drop it
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'Scores' AND COLUMN_NAME = 'TournamentId'
                )
                BEGIN
                    ALTER TABLE dbo.Scores ALTER COLUMN TournamentId INT NULL;
                    ALTER TABLE dbo.Scores DROP COLUMN TournamentId;
                END
            ");
        }
    }
}
