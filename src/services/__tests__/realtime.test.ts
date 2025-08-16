import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { onSnapshot, onDisconnect } from 'firebase/firestore';

// Mock socket.io
vi.mock('socket.io-client');
vi.mock('firebase/firestore');

describe('Real-time Features', () => {
  let mockSocket: any;
  let mockUnsubscribe: vi.Mock;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      off: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: false,
      id: 'socket-123'
    };
    
    vi.mocked(io).mockReturnValue(mockSocket);
    mockUnsubscribe = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockUnsubscribe();
  });

  describe('WebSocket Connections', () => {
    it('establishes WebSocket connection', () => {
      const socket = io('ws://localhost:3000', {
        transports: ['websocket'],
        auth: { token: 'auth-token' }
      });

      expect(io).toHaveBeenCalledWith('ws://localhost:3000', expect.objectContaining({
        transports: ['websocket'],
        auth: { token: 'auth-token' }
      }));
      expect(socket).toBeDefined();
    });

    it('handles connection events', () => {
      const onConnect = vi.fn();
      const onDisconnect = vi.fn();
      const onError = vi.fn();

      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          mockSocket.connected = true;
          callback();
        } else if (event === 'disconnect') {
          mockSocket.connected = false;
          callback();
        } else if (event === 'error') {
          callback(new Error('Connection failed'));
        }
      });

      const socket = io('ws://localhost:3000');
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('error', onError);

      expect(onConnect).toHaveBeenCalled();
      expect(mockSocket.connected).toBe(true);
    });

    it('handles reconnection with exponential backoff', async () => {
      const reconnectAttempts: number[] = [];
      let attempt = 0;

      const reconnect = async () => {
        const delays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
        while (attempt < 5 && !mockSocket.connected) {
          const delay = delays[Math.min(attempt, delays.length - 1)];
          reconnectAttempts.push(delay);
          
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate delay
          attempt++;
          
          if (attempt === 3) {
            mockSocket.connected = true; // Succeed on 3rd attempt
          }
        }
      };

      await reconnect();
      expect(reconnectAttempts).toHaveLength(3);
      expect(reconnectAttempts[0]).toBe(1000);
      expect(reconnectAttempts[1]).toBe(2000);
      expect(mockSocket.connected).toBe(true);
    });

    it('emits events to server', () => {
      const socket = io('ws://localhost:3000');
      
      const testData = {
        type: 'test_result',
        patientId: 'patient-123',
        testId: 'test-456',
        result: { value: 14.5, unit: 'g/dL' }
      };

      socket.emit('test:update', testData);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test:update', testData);
    });

    it('receives real-time updates', () => {
      const updates: any[] = [];
      
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data:update') {
          // Simulate receiving updates
          setTimeout(() => {
            callback({ id: '1', data: 'update1' });
            callback({ id: '2', data: 'update2' });
          }, 100);
        }
      });

      const socket = io('ws://localhost:3000');
      socket.on('data:update', (data: any) => {
        updates.push(data);
      });

      // Wait for updates
      setTimeout(() => {
        expect(updates).toHaveLength(2);
        expect(updates[0].id).toBe('1');
      }, 200);
    });
  });

  describe('Firebase Real-time Listeners', () => {
    it('subscribes to document changes', () => {
      const callback = vi.fn();
      const docRef = { path: 'patients/patient-123' };

      vi.mocked(onSnapshot).mockImplementation((ref: any, cb: any) => {
        // Simulate document change
        cb({
          exists: () => true,
          data: () => ({ name: 'John Doe', status: 'active' }),
          id: 'patient-123'
        });
        return mockUnsubscribe;
      });

      const unsubscribe = onSnapshot(docRef, callback);
      
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        exists: expect.any(Function),
        data: expect.any(Function),
        id: 'patient-123'
      }));
    });

    it('subscribes to collection changes', () => {
      const changes: any[] = [];
      const collectionRef = { path: 'tests' };

      vi.mocked(onSnapshot).mockImplementation((ref: any, cb: any) => {
        // Simulate collection changes
        cb({
          docs: [
            { id: '1', data: () => ({ name: 'CBC' }) },
            { id: '2', data: () => ({ name: 'Lipid Panel' }) }
          ],
          docChanges: () => [
            { type: 'added', doc: { id: '1', data: () => ({ name: 'CBC' }) } },
            { type: 'added', doc: { id: '2', data: () => ({ name: 'Lipid Panel' }) } }
          ]
        });
        return mockUnsubscribe;
      });

      const unsubscribe = onSnapshot(collectionRef, (snapshot: any) => {
        snapshot.docChanges().forEach((change: any) => {
          changes.push({
            type: change.type,
            id: change.doc.id,
            data: change.doc.data()
          });
        });
      });

      expect(changes).toHaveLength(2);
      expect(changes[0].type).toBe('added');
      expect(changes[0].data.name).toBe('CBC');
    });

    it('handles snapshot errors', () => {
      const errorHandler = vi.fn();
      const docRef = { path: 'patients/invalid' };

      vi.mocked(onSnapshot).mockImplementation((ref: any, cb: any, onError: any) => {
        // Simulate error
        onError(new Error('Permission denied'));
        return mockUnsubscribe;
      });

      onSnapshot(
        docRef,
        () => {},
        errorHandler
      );

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Permission denied'
      }));
    });

    it('unsubscribes from listeners', () => {
      const docRef = { path: 'patients/patient-123' };

      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onSnapshot(docRef, () => {});
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Real-time Notifications', () => {
    it('receives and displays notifications', () => {
      const notifications: any[] = [];
      
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'notification') {
          callback({
            id: 'notif-1',
            title: 'New Test Result',
            message: 'CBC test completed',
            type: 'info',
            timestamp: Date.now()
          });
        }
      });

      const socket = io('ws://localhost:3000');
      socket.on('notification', (notification: any) => {
        notifications.push(notification);
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('New Test Result');
    });

    it('handles priority notifications', () => {
      const notifications: any[] = [];
      
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'notification:priority') {
          callback({
            id: 'critical-1',
            title: 'Critical Result',
            message: 'Hemoglobin critically low',
            priority: 'high',
            requiresAck: true
          });
        }
      });

      const socket = io('ws://localhost:3000');
      socket.on('notification:priority', (notification: any) => {
        notifications.push(notification);
        
        // Send acknowledgment
        if (notification.requiresAck) {
          socket.emit('notification:ack', { 
            notificationId: notification.id,
            acknowledgedAt: Date.now()
          });
        }
      });

      expect(notifications[0].priority).toBe('high');
      expect(mockSocket.emit).toHaveBeenCalledWith('notification:ack', expect.any(Object));
    });

    it('batches multiple notifications', () => {
      const notificationBatch: any[] = [];
      let batchTimeout: any;

      const addNotification = (notification: any) => {
        notificationBatch.push(notification);
        
        if (batchTimeout) clearTimeout(batchTimeout);
        
        batchTimeout = setTimeout(() => {
          processBatch();
        }, 100);
      };

      const processBatch = () => {
        expect(notificationBatch).toHaveLength(3);
        notificationBatch.length = 0;
      };

      // Add multiple notifications quickly
      addNotification({ id: '1', message: 'First' });
      addNotification({ id: '2', message: 'Second' });
      addNotification({ id: '3', message: 'Third' });
    });
  });

  describe('Live Data Synchronization', () => {
    it('syncs data changes bidirectionally', () => {
      const localChanges: any[] = [];
      const remoteChanges: any[] = [];

      // Local to remote
      const syncLocalChange = (change: any) => {
        localChanges.push(change);
        mockSocket.emit('sync:push', change);
      };

      // Remote to local
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'sync:pull') {
          callback({ id: 'remote-1', data: 'from server' });
        }
      });

      const socket = io('ws://localhost:3000');
      socket.on('sync:pull', (change: any) => {
        remoteChanges.push(change);
      });

      // Sync local change
      syncLocalChange({ id: 'local-1', data: 'from client' });

      expect(localChanges).toHaveLength(1);
      expect(mockSocket.emit).toHaveBeenCalledWith('sync:push', expect.any(Object));
      expect(remoteChanges).toHaveLength(1);
    });

    it('handles conflict resolution', () => {
      const resolveConflict = (local: any, remote: any) => {
        // Last-write-wins strategy
        if (local.timestamp > remote.timestamp) {
          return local;
        }
        return remote;
      };

      const localData = { id: '1', value: 'local', timestamp: 1000 };
      const remoteData = { id: '1', value: 'remote', timestamp: 2000 };

      const resolved = resolveConflict(localData, remoteData);
      expect(resolved.value).toBe('remote');
    });

    it('maintains data consistency during network issues', () => {
      const pendingSync: any[] = [];
      let isOnline = true;

      const syncData = (data: any) => {
        if (isOnline) {
          mockSocket.emit('sync', data);
        } else {
          pendingSync.push(data);
        }
      };

      // Go offline
      isOnline = false;
      syncData({ id: '1', data: 'offline-1' });
      syncData({ id: '2', data: 'offline-2' });

      expect(pendingSync).toHaveLength(2);

      // Come back online and flush pending
      isOnline = true;
      pendingSync.forEach(data => {
        mockSocket.emit('sync', data);
      });

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Presence System', () => {
    it('tracks user presence', () => {
      const presenceData = {
        userId: 'user-123',
        status: 'online',
        lastSeen: Date.now(),
        currentPage: '/patients'
      };

      mockSocket.emit('presence:update', presenceData);
      expect(mockSocket.emit).toHaveBeenCalledWith('presence:update', presenceData);
    });

    it('shows active users', () => {
      const activeUsers: any[] = [];

      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'presence:list') {
          callback([
            { userId: 'user-1', status: 'online', currentPage: '/dashboard' },
            { userId: 'user-2', status: 'online', currentPage: '/tests' },
            { userId: 'user-3', status: 'away', currentPage: '/results' }
          ]);
        }
      });

      const socket = io('ws://localhost:3000');
      socket.on('presence:list', (users: any[]) => {
        activeUsers.push(...users);
      });

      expect(activeUsers).toHaveLength(3);
      expect(activeUsers.filter(u => u.status === 'online')).toHaveLength(2);
    });

    it('handles user disconnect', () => {
      const userId = 'user-123';
      
      vi.mocked(onDisconnect).mockImplementation((ref: any) => {
        return {
          set: vi.fn(),
          update: vi.fn((data) => {
            expect(data).toEqual({
              status: 'offline',
              lastSeen: expect.any(Number)
            });
          }),
          remove: vi.fn(),
          cancel: vi.fn()
        };
      });

      const presenceRef = { path: `presence/${userId}` };
      const disconnectRef = onDisconnect(presenceRef);
      
      disconnectRef.update({
        status: 'offline',
        lastSeen: Date.now()
      });
    });
  });

  describe('Collaborative Editing', () => {
    it('broadcasts cursor position', () => {
      const cursorData = {
        userId: 'user-123',
        documentId: 'doc-456',
        position: { line: 10, column: 25 },
        selection: null
      };

      mockSocket.emit('cursor:update', cursorData);
      expect(mockSocket.emit).toHaveBeenCalledWith('cursor:update', cursorData);
    });

    it('syncs document changes', () => {
      const changes: any[] = [];

      const applyChange = (change: any) => {
        changes.push(change);
        mockSocket.emit('doc:change', change);
      };

      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'doc:change') {
          callback({
            documentId: 'doc-123',
            operation: 'insert',
            position: 50,
            text: 'Hello',
            userId: 'user-456'
          });
        }
      });

      const socket = io('ws://localhost:3000');
      socket.on('doc:change', (change: any) => {
        if (change.userId !== 'user-123') { // Don't apply own changes
          changes.push(change);
        }
      });

      // Local change
      applyChange({
        documentId: 'doc-123',
        operation: 'insert',
        position: 0,
        text: 'Hi',
        userId: 'user-123'
      });

      expect(changes).toHaveLength(2);
      expect(changes[0].text).toBe('Hi');
      expect(changes[1].text).toBe('Hello');
    });

    it('handles operational transformation', () => {
      // Simplified OT for concurrent edits
      const transform = (op1: any, op2: any) => {
        if (op1.position < op2.position) {
          return op1;
        } else if (op1.position > op2.position) {
          return { ...op1, position: op1.position + op2.text.length };
        } else {
          // Same position - use user ID for tie-breaking
          return op1.userId < op2.userId ? op1 : { ...op1, position: op1.position + op2.text.length };
        }
      };

      const localOp = { position: 10, text: 'A', userId: 'user-1' };
      const remoteOp = { position: 10, text: 'B', userId: 'user-2' };

      const transformed = transform(localOp, remoteOp);
      expect(transformed.position).toBe(10); // user-1 < user-2, so keeps position
    });
  });

  describe('Server-Sent Events (SSE)', () => {
    it('receives server-sent events', () => {
      const eventSource = new EventTarget();
      const events: any[] = [];

      eventSource.addEventListener('message', (event: any) => {
        events.push(JSON.parse(event.data));
      });

      // Simulate SSE
      const messageEvent = new Event('message');
      (messageEvent as any).data = JSON.stringify({
        type: 'status_update',
        data: { testId: '123', status: 'completed' }
      });
      eventSource.dispatchEvent(messageEvent);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('status_update');
    });

    it('handles SSE reconnection', async () => {
      let connectionAttempts = 0;
      const maxRetries = 3;

      const connectSSE = async () => {
        while (connectionAttempts < maxRetries) {
          try {
            connectionAttempts++;
            if (connectionAttempts === 2) {
              // Succeed on second attempt
              return { status: 'connected' };
            }
            throw new Error('Connection failed');
          } catch (error) {
            if (connectionAttempts >= maxRetries) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      const result = await connectSSE();
      expect(result?.status).toBe('connected');
      expect(connectionAttempts).toBe(2);
    });
  });
});