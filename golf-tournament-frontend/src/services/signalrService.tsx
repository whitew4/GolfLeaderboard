// src/services/signalRService.ts
import * as signalR from '@microsoft/signalr';

interface ScoreUpdateData {
  tournamentId: number;
  teamName: string;
  holeNumber: number;
  strokes: number;
  message: string;
  timestamp: string;
}

interface PositionChangeData {
  tournamentId: number;
  teamName: string;
  oldPosition: number;
  newPosition: number;
  message: string;
  timestamp: string;
}

interface ViewerData {
  userName: string;
  viewerCount: number;
}

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isManualDisconnection = false;
  private currentTournamentId: number | null = null;

  // Event handlers
  private scoreUpdateHandlers: ((data: ScoreUpdateData) => void)[] = [];
  private leaderboardUpdateHandlers: ((data: any) => void)[] = [];
  private positionChangeHandlers: ((data: PositionChangeData) => void)[] = [];
  private viewerJoinedHandlers: ((data: ViewerData) => void)[] = [];
  private viewerLeftHandlers: ((data: ViewerData) => void)[] = [];
  private errorHandlers: ((error: string) => void)[] = [];
  private connectionStatusHandlers: ((status: 'connected' | 'disconnected' | 'reconnecting') => void)[] = [];

  constructor() {
    this.setupConnection();
  }

  private setupConnection(): void {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7020';
    const hubUrl = `${apiBaseUrl.replace('/api', '')}/leaderboardHub`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
        },
        withCredentials: false,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < 5) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection events
    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.notifyConnectionStatus('disconnected');
      
      if (!this.isManualDisconnection) {
        this.attemptReconnection();
      }
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.notifyConnectionStatus('reconnecting');
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.notifyConnectionStatus('connected');
      this.reconnectAttempts = 0;
      
      if (this.currentTournamentId) {
        this.joinTournamentGroup(this.currentTournamentId);
      }
    });

    // Server message handlers
    this.connection.on('ScoreUpdate', (data: ScoreUpdateData) => {
      console.log('Score update received:', data);
      this.scoreUpdateHandlers.forEach(handler => handler(data));
    });

    this.connection.on('LeaderboardUpdated', (data: any) => {
      console.log('Leaderboard updated:', data);
      this.leaderboardUpdateHandlers.forEach(handler => handler(data));
    });

    this.connection.on('PositionChange', (data: PositionChangeData) => {
      console.log('Position change received:', data);
      this.positionChangeHandlers.forEach(handler => handler(data));
    });

    this.connection.on('ViewerJoined', (userName: string, viewerCount: number) => {
      console.log('Viewer joined:', userName, 'Total viewers:', viewerCount);
      this.viewerJoinedHandlers.forEach(handler => handler({ userName, viewerCount }));
    });

    this.connection.on('ViewerLeft', (userName: string, viewerCount: number) => {
      console.log('Viewer left:', userName, 'Total viewers:', viewerCount);
      this.viewerLeftHandlers.forEach(handler => handler({ userName, viewerCount }));
    });

    this.connection.on('Error', (errorMessage: string) => {
      console.error('SignalR error:', errorMessage);
      this.errorHandlers.forEach(handler => handler(errorMessage));
    });
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.startConnection();
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  private notifyConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.connectionStatusHandlers.forEach(handler => handler(status));
  }

  // Public API
  async startConnection(): Promise<void> {
    if (!this.connection) {
      this.setupConnection();
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      this.isManualDisconnection = false;
      await this.connection?.start();
      console.log('SignalR connected successfully');
      this.notifyConnectionStatus('connected');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.notifyConnectionStatus('disconnected');
      
      if (!this.isManualDisconnection) {
        this.attemptReconnection();
      }
      
      throw error;
    }
  }

  async stopConnection(): Promise<void> {
    this.isManualDisconnection = true;
    
    if (this.currentTournamentId) {
      await this.leaveTournamentGroup(this.currentTournamentId);
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.stop();
    }
    
    console.log('SignalR connection stopped');
    this.notifyConnectionStatus('disconnected');
  }

  async joinTournamentGroup(tournamentId: number, userName?: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }

    try {
      await this.connection?.invoke('JoinTournamentGroup', tournamentId, userName);
      this.currentTournamentId = tournamentId;
      console.log(`Joined tournament ${tournamentId} group`);
    } catch (error) {
      console.error('Failed to join tournament group:', error);
      throw error;
    }
  }

  async leaveTournamentGroup(tournamentId: number): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection?.invoke('LeaveTournamentGroup', tournamentId);
      this.currentTournamentId = null;
      console.log(`Left tournament ${tournamentId} group`);
    } catch (error) {
      console.error('Failed to leave tournament group:', error);
    }
  }

  async sendScoreUpdate(tournamentId: number, teamName: string, holeNumber: number, strokes: number): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('SendScoreUpdate', tournamentId, teamName, holeNumber, strokes);
    } catch (error) {
      console.error('Failed to send score update:', error);
      throw error;
    }
  }

  async requestLeaderboardRefresh(tournamentId: number): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('RequestLeaderboardRefresh', tournamentId);
    } catch (error) {
      console.error('Failed to request leaderboard refresh:', error);
      throw error;
    }
  }

  // Event subscription methods
  onScoreUpdate(handler: (data: ScoreUpdateData) => void): () => void {
    this.scoreUpdateHandlers.push(handler);
    return () => {
      const index = this.scoreUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.scoreUpdateHandlers.splice(index, 1);
      }
    };
  }

  onLeaderboardUpdate(handler: (data: any) => void): () => void {
    this.leaderboardUpdateHandlers.push(handler);
    return () => {
      const index = this.leaderboardUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.leaderboardUpdateHandlers.splice(index, 1);
      }
    };
  }

  onPositionChange(handler: (data: PositionChangeData) => void): () => void {
    this.positionChangeHandlers.push(handler);
    return () => {
      const index = this.positionChangeHandlers.indexOf(handler);
      if (index > -1) {
        this.positionChangeHandlers.splice(index, 1);
      }
    };
  }

  onViewerJoined(handler: (data: ViewerData) => void): () => void {
    this.viewerJoinedHandlers.push(handler);
    return () => {
      const index = this.viewerJoinedHandlers.indexOf(handler);
      if (index > -1) {
        this.viewerJoinedHandlers.splice(index, 1);
      }
    };
  }

  onViewerLeft(handler: (data: ViewerData) => void): () => void {
    this.viewerLeftHandlers.push(handler);
    return () => {
      const index = this.viewerLeftHandlers.indexOf(handler);
      if (index > -1) {
        this.viewerLeftHandlers.splice(index, 1);
      }
    };
  }

  onError(handler: (error: string) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  onConnectionStatusChanged(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void): () => void {
    this.connectionStatusHandlers.push(handler);
    return () => {
      const index = this.connectionStatusHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionStatusHandlers.splice(index, 1);
      }
    };
  }

  // Utility methods
  getConnectionState(): string {
    return this.connection?.state ?? 'Disconnected';
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getCurrentTournamentId(): number | null {
    return this.currentTournamentId;
  }
}

// Create singleton instance
export const signalRService = new SignalRService();

export default signalRService;