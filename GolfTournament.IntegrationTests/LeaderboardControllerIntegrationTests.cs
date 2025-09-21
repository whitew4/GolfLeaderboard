namespace GolfTournament.IntegrationTests;

public class LeaderboardControllerIntegrationTests : TestBase
{
    public LeaderboardControllerIntegrationTests(CustomWebApplicationFactory factory) 
        : base(factory)
    {
    }

    [Fact]
    public async Task GetTournamentLeaderboard_ReturnsNotFound_ForNonExistentTournament()
    {
        // Act
        var response = await Client.GetAsync("/api/leaderboard/tournament/999");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }
}