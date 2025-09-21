using Xunit;
using GolfTournamentAPI.Services;
using GolfTournamentData.Models;
using GolfTournamentAPI.Models;

namespace GolfTournament.UnitTests;

public class LeaderboardCalculationServiceTests
{
    [Fact]
    public void CalculateLeaderboard_SingleTeam_ReturnsCorrectTotal()
    {
        // Arrange
        var service = new LeaderboardCalculationService();
        
        // Create a simple tournament with one team and one round
        var tournament = new Tournament
        {
            TournamentId = 1,
            Teams = new List<Team>
            {
                new Team
                {
                    TeamId = 1,
                    TeamName = "Test Team",
                    Player1Name = "Player A",
                    Player2Name = "Player B",
                    Scores = new List<Score>
                    {
                        new Score { RoundId = 1, HoleNumber = 1, Strokes = 4, Par = 4 },
                        new Score { RoundId = 1, HoleNumber = 2, Strokes = 3, Par = 3 },
                        new Score { RoundId = 1, HoleNumber = 3, Strokes = 5, Par = 4 }
                    }
                }
            },
            Rounds = new List<Round>
            {
                new Round { RoundId = 1, RoundNumber = 1 }
            }
        };

        // Act
        var result = service.CalculateLeaderboard(tournament);
        var teamResult = result.First(); // Get the first (and only) team

        // Assert
        Assert.Single(result); // Should only be one team
        Assert.Equal(12, teamResult.TotalStrokes); // 4 + 3 + 5 = 12
        Assert.Equal(1, teamResult.TotalScore); // 12 strokes - 11 par = +1
        Assert.Equal(1, teamResult.Position); // Should be in first place
    }

    [Fact]
    public void CalculateLeaderboard_TwoTeamsWithTie_HandlesTieCorrectly()
    {
        // Arrange
        var service = new LeaderboardCalculationService();
        
        var tournament = new Tournament
        {
            TournamentId = 1,
            Teams = new List<Team>
            {
                new Team
                {
                    TeamId = 1,
                    TeamName = "Team A",
                    Player1Name = "Player A1",
                    Player2Name = "Player A2",
                    Scores = new List<Score>
                    {
                        new Score { RoundId = 1, HoleNumber = 1, Strokes = 4, Par = 4 },
                        new Score { RoundId = 1, HoleNumber = 2, Strokes = 3, Par = 3 }
                    }
                },
                new Team
                {
                    TeamId = 2, 
                    TeamName = "Team B",
                    Player1Name = "Player B1",
                    Player2Name = "Player B2",
                    Scores = new List<Score>
                    {
                        new Score { RoundId = 1, HoleNumber = 1, Strokes = 3, Par = 4 },
                        new Score { RoundId = 1, HoleNumber = 2, Strokes = 4, Par = 3 }
                    }
                }
            },
            Rounds = new List<Round> { new Round { RoundId = 1, RoundNumber = 1 } }
        };

        // Act
        var result = service.CalculateLeaderboard(tournament);

        // Assert - Both teams should have same position (tie)
        Assert.Equal(2, result.Count);
        Assert.Equal(0, result[0].TotalScore); // (4+3=7) - (4+3=7) = 0
        Assert.Equal(0, result[1].TotalScore); // (3+4=7) - (4+3=7) = 0
        Assert.Equal(1, result[0].Position); // Both should be position 1
        Assert.Equal(1, result[1].Position); // Both should be position 1
    }

    [Fact] 
    public void CalculateLeaderboard_EmptyTournament_ReturnsEmptyList()
    {
        // Arrange
        var service = new LeaderboardCalculationService();
        var tournament = new Tournament
        {
            TournamentId = 1,
            Teams = new List<Team>(),
            Rounds = new List<Round>()
        };

        // Act
        var result = service.CalculateLeaderboard(tournament);

        // Assert
        Assert.Empty(result);
    }
}