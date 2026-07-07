import React, { useState, useEffect, useRef } from 'react';
import { 
  ProjectState, 
  Task, 
  Milestone, 
  Thread, 
  Message, 
  ActivityLog, 
  User, 
  SyncItem,
  UserRole
} from './types';
import TaskBoard from './components/TaskBoard';
import ProjectDashboard from './components/ProjectDashboard';
import TeamChat from './components/TeamChat';
import SecurityConsole from './components/SecurityConsole';
import OfflineManager from './components/OfflineManager';
import PDFExporter from './components/PDFExporter';
import { ClientCrypto } from './utils/crypto';
import { 
  Shield, 
  Users, 
  Wifi, 
  WifiOff, 
  Layers, 
  MessageSquare, 
  Lock, 
  RotateCcw,
  Flag,
  Globe,
  Database
} from 'lucide-react';

// Default list of workspace users
const WORKSPACE_USERS: User[] = [
  { id: 'user-1', name: 'Alice Admin', email: 'alice@collab.secure', role: 'admin', avatarColor: 'bg-[#4A4A4A]' },
  { id: 'user-2', name: 'Bob Dev', email: 'bob@collab.secure', role: 'member', avatarColor: 'bg-[#7A7A7A]' },
  { id: 'user-3', name: 'Charlie Stakeholder', email: 'charlie@collab.secure', role: 'viewer', avatarColor: 'bg-[#A1A1A1]' }
];

export default function App() {
  // Active user selection for Role-Based Access Control (RBAC) demo
  const [currentUser, setCurrentUser] = useState<User>(WORKSPACE_USERS[0]);

  // Main UI Tab navigation
  const [activeTab, setActiveTab] = useState<'board' | 'dashboard' | 'chat' | 'security' | 'sync' | 'export'>('board');

  // Project state
  const [state, setState] = useState<ProjectState>({
    tasks: [],
    milestones: [],
    threads: [],
    messages: [],
    activities: []
  });

  // Offline Mode States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Load offline queue on initial boot
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem('offline_collab_queue');
      if (storedQueue) {
        setOfflineQueue(JSON.parse(storedQueue));
      }
    } catch (e) {
      console.error('Failed to parse local offline queue:', e);
    }
  }, []);

  // Update localStorage whenever queue changes
  useEffect(() => {
    try {
      localStorage.setItem('offline_collab_queue', JSON.stringify(offlineQueue));
    } catch (e) {
      console.error('Failed to write local offline queue:', e);
    }
  }, [offlineQueue]);

  // Connect WebSockets
  useEffect(() => {
    if (!isOnline) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WS Connection Established.');
      setIsOnline(true);
      // Trigger outbox reconciliation sync on reconnect
      triggerOfflineSync(socket);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        switch (type) {
          case 'INIT':
          case 'SYNC_STATE':
            setState(payload);
            break;
          
          case 'TASK_CREATED':
            setState(prev => ({
              ...prev,
              tasks: [...prev.tasks, payload]
            }));
            break;

          case 'TASK_UPDATED':
            setState(prev => ({
              ...prev,
              tasks: prev.tasks.map(t => t.id === payload.id ? { ...t, ...payload } : t)
            }));
            break;

          case 'TASK_DELETED':
            setState(prev => ({
              ...prev,
              tasks: prev.tasks.filter(t => t.id !== payload.id)
            }));
            break;

          case 'MESSAGE_CREATED':
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, payload]
            }));
            break;

          case 'THREAD_CREATED':
            setState(prev => ({
              ...prev,
              threads: [...prev.threads, payload]
            }));
            break;

          case 'MILESTONE_UPDATED':
            setState(prev => ({
              ...prev,
              milestones: prev.milestones.map(m => m.id === payload.id ? { ...m, ...payload } : m)
            }));
            break;

          case 'ACTIVITY_LOGGED':
            setState(prev => ({
              ...prev,
              activities: [payload, ...prev.activities]
            }));
            break;

          case 'ERROR':
            alert(`Authorization Alert:\n${payload}`);
            break;
        }
      } catch (err) {
        console.error('Error handling WS server message:', err);
      }
    };

    socket.onclose = () => {
      console.log('WS Connection Dropped.');
      setIsOnline(false);
    };

    socket.onerror = () => {
      setIsOnline(false);
    };

    return () => {
      socket.close();
    };
  }, [isOnline]);

  // Synchronize queued offline modifications to the server
  const triggerOfflineSync = (activeSocket?: WebSocket) => {
    const socket = activeSocket || wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || offlineQueue.length === 0) return;

    setIsSyncing(true);

    // Collect batch mutations
    const offlineTasks: Task[] = [];
    const offlineMessages: Message[] = [];
    const offlineActivities: ActivityLog[] = [];

    offlineQueue.forEach(item => {
      if (item.action === 'create_task') {
        offlineTasks.push(item.payload);
        offlineActivities.push({
          id: `act-sync-${Date.now()}-${Math.random()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          actionType: 'Task Creation',
          details: `Created task "${item.payload.title}" while offline`,
          timestamp: item.timestamp,
          isOffline: true
        });
      } else if (item.action === 'update_task') {
        offlineTasks.push(item.payload);
        offlineActivities.push({
          id: `act-sync-${Date.now()}-${Math.random()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          actionType: 'Task Status Transition',
          details: `Updated task status or checklist items while offline`,
          timestamp: item.timestamp,
          isOffline: true
        });
      } else if (item.action === 'create_message') {
        offlineMessages.push(item.payload);
      }
    });

    // Send single, unified batch
    socket.send(JSON.stringify({
      type: 'SYNC_OFFLINE_BATCH',
      senderRole: currentUser.role,
      userId: currentUser.id,
      userName: currentUser.name,
      payload: {
        tasks: offlineTasks,
        messages: offlineMessages,
        activities: offlineActivities
      }
    }));

    // Clear queue
    setOfflineQueue([]);
    setIsSyncing(false);
  };

  // Safe action dispatcher that respects OFFLINE states and client-side caching queue
  const dispatchAction = (type: string, payload: any) => {
    const timestamp = new Date().toISOString();

    // Check backend RBAC constraints locally first for snappy UI feedback
    if (currentUser.role === 'viewer') {
      alert('Access Denied: Viewers are unauthorized to make project edits.');
      return;
    }

    if (currentUser.role === 'member' && (type === 'DELETE_TASK' || type === 'RESET_PROJECT')) {
      alert('Access Denied: Members are unauthorized to delete or reset workspace items.');
      return;
    }

    // IF OFFLINE: Queue up changes locally instead of throwing WS errors
    if (!isOnline) {
      let actionName: any = null;
      let syncPayload = { ...payload };

      if (type === 'CREATE_TASK') {
        actionName = 'create_task';
        const mockId = `task-offline-${Date.now()}`;
        syncPayload = {
          ...payload,
          id: mockId,
          creatorId: currentUser.id,
          createdAt: timestamp,
          updatedAt: timestamp,
          isOfflineSynced: true
        };

        // Optimistically append task to list
        setState(prev => ({
          ...prev,
          tasks: [...prev.tasks, syncPayload]
        }));
      } else if (type === 'UPDATE_TASK') {
        actionName = 'update_task';
        syncPayload = {
          ...payload,
          updatedAt: timestamp,
          isOfflineSynced: true
        };

        // Optimistically update task status
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === payload.id ? { ...t, ...payload, updatedAt: timestamp } : t)
        }));
      } else if (type === 'CREATE_MESSAGE') {
        actionName = 'create_message';
        const mockMsgId = `msg-offline-${Date.now()}`;
        syncPayload = {
          ...payload,
          id: mockMsgId,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp,
          isOfflineSynced: true
        };

        // Optimistically append chat message
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, syncPayload]
        }));
      }

      if (actionName) {
        const queueItem: SyncItem = {
          id: `queue-${Date.now()}-${Math.random()}`,
          action: actionName,
          payload: syncPayload,
          timestamp
        };

        // Enqueue item
        setOfflineQueue(prev => [...prev, queueItem]);

        // Append to activity log locally
        const localAct: ActivityLog = {
          id: `act-local-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          actionType: 'Offline Modification Saved',
          details: `Queued [${actionName}] action locally. Changes will transmit upon reconnection.`,
          timestamp,
          isOffline: true
        };
        setState(prev => ({
          ...prev,
          activities: [localAct, ...prev.activities]
        }));
      }
      return;
    }

    // ONLINE MODE: Transmit instantly over live WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        senderRole: currentUser.role,
        userId: currentUser.id,
        userName: currentUser.name,
        payload
      }));
    }
  };

  // Factory state reset controller
  const handleResetWorkspace = async () => {
    if (currentUser.role !== 'admin') {
      alert('Access Denied: Only Workspace Admins can trigger clean resets.');
      return;
    }

    if (!confirm('Are you sure you want to restore the project workspace to original factory defaults? This clears custom histories.')) {
      return;
    }

    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        setOfflineQueue([]);
        localStorage.removeItem('offline_collab_queue');
      }
    } catch (e) {
      console.error('Reset request failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans flex flex-col select-none">
      
      {/* Header Bar */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4A4A4A] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs">
              NX
            </div>
            <div>
              <h1 className="font-bold text-base leading-none tracking-tight text-[#1A1A1A]">NexusTask</h1>
              <p className="text-[10px] text-[#9E9E9E] font-semibold tracking-wider uppercase mt-1 flex items-center gap-1">
                <Globe size={10} /> Secure Real-time Coordination Portal
              </p>
            </div>
          </div>

          {/* Network Sync status */}
          <div className="flex items-center gap-3">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-pulse"></span>
                Live Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-rose-600 rounded-full"></span>
                Offline Mode
              </span>
            )}

            {/* Role Switcher Demo Console for Stakeholder review */}
            <div className="flex items-center gap-2 bg-[#F5F5F5] border border-[#E5E5E5] p-1.5 rounded-full px-3">
              <Users size={12} className="text-[#9E9E9E] shrink-0" />
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const targetUser = WORKSPACE_USERS.find(u => u.id === e.target.value);
                  if (targetUser) setCurrentUser(targetUser);
                }}
                className="bg-transparent border-none text-[#1A1A1A] text-xs font-bold focus:ring-0 cursor-pointer select-none outline-none"
                title="Change active simulation role to review different permissions"
              >
                {WORKSPACE_USERS.map(u => (
                  <option key={u.id} value={u.id} className="bg-white text-[#1A1A1A]">
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[24px] border border-[#E5E5E5] p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider block px-1">Navigation</span>
            <nav className="space-y-1">
              {activeTab === 'board' ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] font-semibold text-xs border-l-2 border-[#4A4A4A]">
                  <div className="w-1 h-3 bg-[#4A4A4A] rounded-full"></div>
                  📋 Task Kanban
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('board')}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-[#9E9E9E] hover:text-[#4A4A4A] cursor-pointer bg-transparent text-xs font-medium rounded-xl transition hover:bg-[#FAF9F9]"
                >
                  <span className="pl-4">📋 Task Kanban</span>
                </button>
              )}
              
              {activeTab === 'dashboard' ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] font-semibold text-xs border-l-2 border-[#4A4A4A]">
                  <div className="w-1 h-3 bg-[#4A4A4A] rounded-full"></div>
                  🎯 Performance Roadmap
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-[#9E9E9E] hover:text-[#4A4A4A] cursor-pointer bg-transparent text-xs font-medium rounded-xl transition hover:bg-[#FAF9F9]"
                >
                  <span className="pl-4">🎯 Performance Roadmap</span>
                </button>
              )}

              {activeTab === 'chat' ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] font-semibold text-xs border-l-2 border-[#4A4A4A]">
                  <div className="w-1 h-3 bg-[#4A4A4A] rounded-full"></div>
                  💬 Encrypted Chat
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-[#9E9E9E] hover:text-[#4A4A4A] cursor-pointer bg-transparent text-xs font-medium rounded-xl transition hover:bg-[#FAF9F9]"
                >
                  <span className="pl-4">💬 Encrypted Chat</span>
                </button>
              )}

              {activeTab === 'security' ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] font-semibold text-xs border-l-2 border-[#4A4A4A]">
                  <div className="w-1 h-3 bg-[#4A4A4A] rounded-full"></div>
                  🛡️ HSM Security
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('security')}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-[#9E9E9E] hover:text-[#4A4A4A] cursor-pointer bg-transparent text-xs font-medium rounded-xl transition hover:bg-[#FAF9F9]"
                >
                  <span className="pl-4">🛡️ HSM Security</span>
                </button>
              )}

              {activeTab === 'sync' ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] font-semibold text-xs border-l-2 border-[#4A4A4A] justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-3 bg-[#4A4A4A] rounded-full"></div>
                    📡 Sync Outbox
                  </div>
                  {offlineQueue.length > 0 && (
                    <span className="bg-[#4A4A4A] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      {offlineQueue.length}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('sync')}
                  className="w-full text-left flex items-center justify-between px-3 py-2 text-[#9E9E9E] hover:text-[#4A4A4A] cursor-pointer bg-transparent text-xs font-medium rounded-xl transition hover:bg-[#FAF9F9]"
                >
                  <span className="pl-4">📡 Sync Outbox</span>
                  {offlineQueue.length > 0 && (
                    <span className="bg-[#9E9E9E] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      {offlineQueue.length}
                    </span>
                  )}
                </button>
              )}

              {activeTab === 'export' ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] font-semibold text-xs border-l-2 border-[#4A4A4A]">
                  <div className="w-1 h-3 bg-[#4A4A4A] rounded-full"></div>
                  📄 Stakeholder Review
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('export')}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-[#9E9E9E] hover:text-[#4A4A4A] cursor-pointer bg-transparent text-xs font-medium rounded-xl transition hover:bg-[#FAF9F9]"
                >
                  <span className="pl-4">📄 Stakeholder Review</span>
                </button>
              )}
            </nav>
          </div>

          {/* Quick Active user spec card */}
          <div className="bg-white rounded-[24px] border border-[#EEEEEE] p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider block px-1">Session Audit</span>
            <div className="flex items-center gap-2.5 p-1">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${currentUser.avatarColor}`}>
                {currentUser.name.charAt(0)}
              </span>
              <div className="space-y-0.5 leading-tight">
                <div className="font-bold text-xs text-[#1A1A1A]">{currentUser.name}</div>
                <div className="text-[10px] text-[#9E9E9E] font-semibold uppercase">{currentUser.role} role</div>
              </div>
            </div>

            {currentUser.role === 'admin' && (
              <button
                onClick={handleResetWorkspace}
                className="w-full mt-2 py-2 px-3 border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#1A1A1A] font-medium rounded-full text-[10px] transition flex justify-center items-center gap-1"
                title="Cleanses the database state for fresh reviews"
              >
                <RotateCcw size={10} />
                Reset Project Databases
              </button>
            )}
          </div>
        </aside>

        {/* Tab Viewport */}
        <main className="lg:col-span-4 h-full">
          {activeTab === 'board' && (
            <TaskBoard
              tasks={state.tasks}
              users={WORKSPACE_USERS}
              currentUser={currentUser}
              onAddTask={(t) => dispatchAction('CREATE_TASK', t)}
              onUpdateTask={(t) => dispatchAction('UPDATE_TASK', t)}
              onDeleteTask={(id) => dispatchAction('DELETE_TASK', { id })}
            />
          )}

          {activeTab === 'dashboard' && (
            <ProjectDashboard
              tasks={state.tasks}
              milestones={state.milestones}
              currentUser={currentUser}
              onUpdateMilestone={(m) => dispatchAction('UPDATE_MILESTONE', m)}
            />
          )}

          {activeTab === 'chat' && (
            <TeamChat
              threads={state.threads}
              messages={state.messages}
              users={WORKSPACE_USERS}
              currentUser={currentUser}
              onAddThread={(t) => dispatchAction('CREATE_THREAD', t)}
              onSendMessage={(m) => dispatchAction('CREATE_MESSAGE', m)}
            />
          )}

          {activeTab === 'security' && (
            <SecurityConsole />
          )}

          {activeTab === 'sync' && (
            <OfflineManager
              isOnline={isOnline}
              onToggleConnection={() => setIsOnline(!isOnline)}
              offlineQueue={offlineQueue}
              activityLogs={state.activities}
              currentUser={currentUser}
              onTriggerSync={() => triggerOfflineSync()}
            />
          )}

          {activeTab === 'export' && (
            <PDFExporter
              tasks={state.tasks}
              milestones={state.milestones}
              threads={state.threads}
              messages={state.messages}
              activities={state.activities}
            />
          )}
        </main>

      </div>

      {/* Clean elegant footer */}
      <footer className="h-12 bg-white border-t border-[#E5E5E5] px-8 flex items-center justify-between text-[10px] text-[#9E9E9E] font-medium shrink-0 mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full"></div>
            System Online
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#4A4A4A] rounded-full"></div>
            Local Mirror: 100% Synced
          </div>
        </div>
        <div>Last encrypted backup: Just now — V.2.4.8</div>
      </footer>

    </div>
  );
}
