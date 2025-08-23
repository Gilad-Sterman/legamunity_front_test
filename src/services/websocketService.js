/**
 * WebSocket Service for Real-time Interview Processing Updates
 * Handles Socket.IO connection and interview status events
 */

import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Initialize WebSocket connection
   */
  connect() {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    // Determine server URL based on environment
    let serverUrl;
    if (process.env.NODE_ENV === 'production') {
      // For production, use the current domain with HTTPS
      serverUrl = window.location.origin;
    } else {
      // For development, use the API URL or localhost
      serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    }
    
    console.log('🔌 Connecting to WebSocket server:', serverUrl);
    
    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 20000,
      forceNew: true,
      secure: window.location.protocol === 'https:', // Use secure connection for HTTPS
      rejectUnauthorized: false // For development with self-signed certificates
    });

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.isConnected = false;
    });

    // Listen for interview status updates
    this.socket.on('interview-status-update', (data) => {
      console.log('📡 Received interview status update:', data);
      this.handleInterviewStatusUpdate(data);
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Join interview room for targeted updates
   */
  joinInterviewRoom(interviewId) {
    if (this.socket?.connected) {
      this.socket.emit('join-interview', interviewId);
      console.log(`📡 Joined interview room: ${interviewId}`);
    }
  }

  /**
   * Leave interview room
   */
  leaveInterviewRoom(interviewId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-interview', interviewId);
      console.log(`📡 Left interview room: ${interviewId}`);
    }
  }

  /**
   * Subscribe to interview status updates
   */
  onInterviewStatusUpdate(interviewId, callback) {
    if (!this.listeners.has(interviewId)) {
      this.listeners.set(interviewId, []);
    }
    this.listeners.get(interviewId).push(callback);
    
    // Join the room for this interview
    this.joinInterviewRoom(interviewId);
  }

  /**
   * Unsubscribe from interview status updates
   */
  offInterviewStatusUpdate(interviewId, callback = null) {
    if (this.listeners.has(interviewId)) {
      if (callback) {
        // Remove specific callback
        const callbacks = this.listeners.get(interviewId);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        
        // If no more callbacks, remove the interview and leave room
        if (callbacks.length === 0) {
          this.listeners.delete(interviewId);
          this.leaveInterviewRoom(interviewId);
        }
      } else {
        // Remove all callbacks for this interview
        this.listeners.delete(interviewId);
        this.leaveInterviewRoom(interviewId);
      }
    }
  }

  /**
   * Handle incoming interview status updates
   */
  handleInterviewStatusUpdate(data) {
    const { interviewId } = data;
    
    if (this.listeners.has(interviewId)) {
      const callbacks = this.listeners.get(interviewId);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in interview status callback:', error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create and export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
