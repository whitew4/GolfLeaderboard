// GolfTournamentAPI/Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json;
using Microsoft.Data.SqlClient; // ADD THIS LINE

using GolfTournamentAPI.Hubs;
using GolfTournamentAPI.Services;
using GolfTournamentData;

var builder = WebApplication.CreateBuilder(args);

// ===== LOGGING =====
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

if (builder.Environment.IsDevelopment())
{
    builder.Logging.SetMinimumLevel(LogLevel.Debug);
}

// ===== CONTROLLERS & API =====
builder.Services.AddControllers(options =>
{
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.WriteIndented = true;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// ===== SWAGGER DOCUMENTATION =====
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Golf Tournament API",
        Version = "v1",
        Description = "Live golf tournament leaderboard system with real-time updates"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ===== DEPENDENCY INJECTION =====
builder.Services.AddScoped<ILeaderboardCalculationService, LeaderboardCalculationService>();
builder.Services.AddScoped<ISignalRService, SignalRService>();
builder.Services.AddScoped<JwtService>();

// ===== SIGNALR =====
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
})
.AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// ===== JWT AUTHENTICATION =====
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "dev-secret-key-for-golf-tournament";
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"] ?? "GolfTournamentAPI",
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"] ?? jwtSettings["Issuer"] ?? "GolfTournamentAPI",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
            RequireExpirationTime = true
        };

        // Enable JWT in SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/leaderboardHub"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim("role", "admin"));
    options.AddPolicy("PlayerOrAdmin", policy => policy.RequireClaim("role", "player", "admin"));
});

// ===== DATABASE DEBUG & CONFIGURATION =====
var connectionStringFromConfig = builder.Configuration.GetConnectionString("DefaultConnection");
var fallbackConnectionString = "Server=DEVELOP-07\\MSSQLSERVER02;uid=truenorth;pwd=Pm?8Ui)KQYFYB3;Database=GolfTournament;TrustServerCertificate=true;";

Console.WriteLine($"🔍 Connection String from appsettings.json: '{connectionStringFromConfig}'");
Console.WriteLine($"🔍 Fallback Connection String: '{fallbackConnectionString}'");

var connectionString = connectionStringFromConfig ?? fallbackConnectionString;
Console.WriteLine($"🔍 Final Connection String Being Used: '{connectionString}'");

// Test the connection before EF tries to use it
try
{
    Console.WriteLine("🧪 Testing direct SqlConnection...");
    using var testConnection = new SqlConnection(connectionString);
    await testConnection.OpenAsync();
    Console.WriteLine("✅ Direct SqlConnection test successful!");
    Console.WriteLine($"   Server Version: {testConnection.ServerVersion}");
    Console.WriteLine($"   Database: {testConnection.Database}");
    testConnection.Close();
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Direct SqlConnection test failed: {ex.Message}");
    Console.WriteLine($"❌ Full exception: {ex}");

    // Try alternative connection string format
    var altConnectionString = "Data Source=DEVELOP-07\\MSSQLSERVER02;Initial Catalog=GolfTournament;User ID=truenorth;Password=Pm?8Ui)KQYFYB3;TrustServerCertificate=True;Encrypt=False;";
    Console.WriteLine($"🔄 Trying alternative format: '{altConnectionString}'");

    try
    {
        using var altTestConnection = new SqlConnection(altConnectionString);
        await altTestConnection.OpenAsync();
        Console.WriteLine("✅ Alternative connection string works! Updating connectionString variable...");
        connectionString = altConnectionString;
        altTestConnection.Close();
    }
    catch (Exception altEx)
    {
        Console.WriteLine($"❌ Alternative connection string also failed: {altEx.Message}");
    }
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);

        sqlOptions.CommandTimeout(30);
    });

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000", "https://localhost:3001" };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// ===== HEALTH CHECKS =====
//builder.Services.AddHealthChecks()
//    .AddDbContextCheck<AppDbContext>("database")
//    .AddCheck("signalr", () =>
//    {
//        return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("SignalR is running");
//    });

// ===== RESPONSE CACHING =====
builder.Services.AddResponseCaching();
builder.Services.AddMemoryCache();

// ===== API BEHAVIOR =====
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .SelectMany(x => x.Value!.Errors)
            .Select(x => x.ErrorMessage)
            .ToList();

        var response = new
        {
            type = "validation_error",
            title = "One or more validation errors occurred",
            status = 400,
            errors = errors
        };

        return new BadRequestObjectResult(response);
    };
});

// ===== BUILD APPLICATION =====
var app = builder.Build();

// ===== MIDDLEWARE PIPELINE =====

// Exception handling (must be first)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Golf Tournament API v1");
        c.RoutePrefix = "swagger";
        c.DisplayRequestDuration();
        c.EnableTryItOutByDefault();
    });
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    await next();
});

// Request logging
app.UseMiddleware<RequestLoggingMiddleware>();

// HTTPS redirection
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS (before auth)
app.UseCors("AllowReactApp");

// Response caching
app.UseResponseCaching();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Rate limiting middleware
app.UseMiddleware<RateLimitingMiddleware>();

// Controllers
app.MapControllers();

// SignalR Hub
app.MapHub<LeaderboardHub>("/leaderboardHub");

// Health checks
//app.MapHealthChecks("/health");

// API info endpoint
app.MapGet("/api/info", () => new
{
    name = "Golf Tournament API",
    version = "1.0.0",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
});

// Database initialization
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        Console.WriteLine("🔧 Testing database connection during initialization...");

        if (app.Environment.IsDevelopment())
        {
            await context.Database.EnsureCreatedAsync();

            if ((await context.Database.GetPendingMigrationsAsync()).Any())
            {
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully");
            }
        }

        logger.LogInformation("Database connection verified");
        Console.WriteLine("✅ Database initialization completed successfully!");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database initialization failed");
        Console.WriteLine($"❌ Database initialization failed: {ex.Message}");
        throw;
    }
}

app.Run();

// Custom middleware classes
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            if (context.Request.Path.StartsWithSegments("/api"))
            {
                _logger.LogInformation(
                    "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMilliseconds}ms",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
        }
    }
}

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly Dictionary<string, (DateTime lastRequest, int requestCount)> _clientRequests = new();
    private static readonly object _lock = new object();

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;
        var windowStart = now.AddMinutes(-1);

        lock (_lock)
        {
            var keysToRemove = _clientRequests
                .Where(kvp => kvp.Value.lastRequest < windowStart)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in keysToRemove)
            {
                _clientRequests.Remove(key);
            }

            if (_clientRequests.TryGetValue(clientIp, out var clientData))
            {
                if (clientData.requestCount >= 100) // 100 requests per minute
                {
                    context.Response.StatusCode = 429;
                    return;
                }

                _clientRequests[clientIp] = (now, clientData.requestCount + 1);
            }
            else
            {
                _clientRequests[clientIp] = (now, 1);
            }
        }

        await _next(context);
    }
}

public partial class Program { }