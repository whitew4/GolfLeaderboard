using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GolfTournamentData.Models
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            
            // Direct connection string - no config file reading needed
            optionsBuilder.UseSqlServer("Server=DANNYSXPS\\SQLEXPRESS;Database=GolfTournament;Trusted_Connection=true;TrustServerCertificate=true;MultipleActiveResultSets=true");
            return new AppDbContext(optionsBuilder.Options);
        }
    }
}