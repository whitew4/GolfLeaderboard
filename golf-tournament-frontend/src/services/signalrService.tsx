import * as signalR from '@microsoft/signalr';

const API_BASE_URL = 'https://localhost:7020';

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  async startConnection() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/leaderboardHub`)
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log('SignalR Connected successfully!');
    } catch (err) {
      console.error('Error connecting to SignalR:', err);
    }
  }

  // Listen for score updates (RECEIVE messages)
  onScoreUpdate(callback: (message: string) => void) {
    this.connection?.on('ReceiveScoreUpdate', callback);
  }

  // Listen for leaderboard refresh requests
  onLeaderboardRefresh(callback: () => void) {
    this.connection?.on('RefreshLeaderboard', callback);
  }

  // Send score updates to server (SEND messages)
  async sendScoreUpdate(tournamentId: number, message: string) {
    await this.connection?.invoke('SendScoreUpdate', tournamentId, message);
  }

  // Join a tournament group
  async joinTournamentGroup(tournamentId: number) {
    await this.connection?.invoke('JoinTournamentGroup', tournamentId);
  }

  // Leave a tournament group
  async leaveTournamentGroup(tournamentId: number) {
    await this.connection?.invoke('LeaveTournamentGroup', tournamentId);
  }

  disconnect() {
    this.connection?.stop();
  }
}

export const signalRService = new SignalRService();