import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  ProjectState, 
  Task, 
  Milestone, 
  Thread, 
  Message, 
  ActivityLog, 
  UserRole 
} from "./src/types";

// State file for persistence
const STATE_FILE = path.join(process.cwd(), "project_state.json");

// Default initial high-fidelity mock data
const INITIAL_STATE: ProjectState = {
  tasks: [
    {
      id: "task-1",
      title: "Design Dynamic Encryption Schema",
      description: "Implement custom client-side symmetric block cipher and encryption console. Ensure zero raw text communications pass over the socket.",
      status: "done",
      priority: "high",
      assigneeId: "user-1", // Alice
      creatorId: "user-1",
      tags: ["Security", "Cryptography"],
      subtasks: [
        { id: "sub-1-1", title: "Key schedule generation", completed: true },
        { id: "sub-1-2", title: "IV semantic randomized salt", completed: true },
        { id: "sub-1-3", title: "Decryption cipher block mapping", completed: true }
      ],
      dueDate: "2026-07-10",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "task-2",
      title: "Real-time Sync WebSocket Engine",
      description: "Setup robust, unified port Express WebSocket server. Handle optimistic replication and auto-reconciliation on reconnection.",
      status: "in_progress",
      priority: "high",
      assigneeId: "user-2", // Bob
      creatorId: "user-1",
      tags: ["Real-time", "Backend"],
      subtasks: [
        { id: "sub-2-1", title: "Create WS port upgrade route", completed: true },
        { id: "sub-2-2", title: "Reconnection outbox sync pipeline", completed: false },
        { id: "sub-2-3", title: "Broadcast delta action mutations", completed: true }
      ],
      dueDate: "2026-07-15",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "task-3",
      title: "Audit Interactive Milestones Dashboard",
      description: "Construct modern, responsive SVG metrics and burn-down visualizers in React. Export complete stakeholder PDF reviews.",
      status: "todo",
      priority: "medium",
      assigneeId: "user-3", // Charlie
      creatorId: "user-1",
      tags: ["Analytics", "UI/UX"],
      subtasks: [
        { id: "sub-3-1", title: "Draft clean custom SVG progress arcs", completed: false },
        { id: "sub-3-2", title: "PDF printable stylesheet layout", completed: false }
      ],
      dueDate: "2026-07-20",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  milestones: [
    {
      id: "milestone-1",
      title: "Phase 1: Zero-Knowledge Encryption Gateway",
      description: "Secure all communication channels using dynamic end-to-end symmetric stream encryption.",
      dueDate: "2026-07-10",
      status: "achieved",
      progress: 100,
      tasksAssigned: ["task-1"]
    },
    {
      id: "milestone-2",
      title: "Phase 2: Live Sync & Real-time Collaboration",
      description: "Establish resilient WebSockets pipeline linking multiple team sessions with active conflict resolution.",
      dueDate: "2026-07-16",
      status: "upcoming",
      progress: 65,
      tasksAssigned: ["task-2"]
    },
    {
      id: "milestone-3",
      title: "Phase 3: Stakeholder Executive Review",
      description: "Compile live metrics, milestone progress, and thread auditing into formal downloadable PDF briefs.",
      dueDate: "2026-07-25",
      status: "upcoming",
      progress: 15,
      tasksAssigned: ["task-3"]
    }
  ],
  threads: [
    {
      id: "thread-general",
      title: "📢 General Project Workspace",
      taskId: null,
      category: "general",
      createdAt: new Date().toISOString()
    },
    {
      id: "thread-task-2",
      title: "🔧 WebSockets Sync Discussion",
      taskId: "task-2",
      category: "tasks",
      createdAt: new Date().toISOString()
    }
  ],
  // Pre-encrypted default messages using ClientCrypto format
  // Key ID: "project-key-v1"
  // Key: "team-collab-secure-2026-master-key-xyz-778"
  // Message 1 (General Chat): "Welcome to the Collaborative Task Manager Workspace. All data here is client-side encrypted."
  // Ciphertext: "721e050302061e381b151025553e1a06041c2c06041315531d0413000b0e5015111d0a5108000d1e5f08020e1a1b1a03520f011903061a5c100c14041b1d161d0d571f0003501a1c021c541c0c16051759080e1a0d1e1c5f0a0d0a0b1652" (with IV: "abcde123")
  messages: [
    {
      id: "msg-1",
      threadId: "thread-general",
      senderId: "user-1",
      senderName: "Alice Admin",
      senderRole: "admin",
      encryptedContent: "50325d57504e0e23434b0a701962455940422c544d03093b1319031c13154b1f55490a0c4f1c11030e0a544b0e570c0c05170d105c10010c14041b1d161d0d571f0003501a1c021c541c0c16051759080e1a0d1e1c5f0a0d0a0b1652",
      iv: "abcde123",
      keyId: "project-key-v1",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "msg-2",
      threadId: "thread-task-2",
      senderId: "user-2",
      senderName: "Bob Dev",
      senderRole: "member",
      encryptedContent: "5b234a5d5e5340170a445e75122e034440531c1044431e340c49020a16145610010c0e0b1d035414570d130a085b1c034914101e4a055d5b1d1a1b0200",
      iv: "xyz98765",
      keyId: "project-key-v1",
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  activities: [
    {
      id: "act-1",
      userId: "user-1",
      userName: "Alice Admin",
      actionType: "Project Initialization",
      details: "Created main project workspace and bootstrapped initial milestone checklist.",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isOffline: false
    },
    {
      id: "act-2",
      userId: "user-2",
      userName: "Bob Dev",
      actionType: "Task Transition",
      details: "Moved 'Real-time Sync WebSocket Engine' into in_progress.",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isOffline: false
    }
  ]
};

// Load state from file or write default
function loadState(): ProjectState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read state file, using default data.", error);
  }
  saveState(INITIAL_STATE);
  return INITIAL_STATE;
}

function saveState(state: ProjectState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write state file.", error);
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Load state
  let projectState = loadState();

  // API HTTP Routes
  app.get("/api/state", (req, res) => {
    res.json(projectState);
  });

  app.post("/api/reset", (req, res) => {
    projectState = {
      ...INITIAL_STATE,
      tasks: INITIAL_STATE.tasks.map(t => ({ ...t, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
      activities: [
        {
          id: "reset-act",
          userId: "system",
          userName: "System Workspace",
          actionType: "Workspace Clean Reset",
          details: "All tasks, messaging, and security settings have been reset to factory defaults.",
          timestamp: new Date().toISOString(),
          isOffline: false
        }
      ]
    };
    saveState(projectState);
    broadcastToAll({ type: "SYNC_STATE", payload: projectState });
    res.json({ success: true, state: projectState });
  });

  // Setup WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  // Keep track of connected clients
  const clients = new Set<WebSocket>();

  function broadcastToAll(message: any, excludeWs?: WebSocket) {
    const rawMessage = JSON.stringify(message);
    clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(rawMessage);
      }
    });
  }

  wss.on("connection", (ws) => {
    clients.add(ws);

    // Send initial state to newly connected client
    ws.send(JSON.stringify({ type: "INIT", payload: projectState }));

    ws.on("message", (messageStr) => {
      try {
        const message = JSON.parse(messageStr.toString());
        const { type, payload, senderRole, userId, userName } = message;

        // Strict Backend Role-Based Access Control
        // Viewer is not allowed to perform any modifications
        if (senderRole === 'viewer' && type !== 'GET_STATE') {
          ws.send(JSON.stringify({ 
            type: "ERROR", 
            payload: "Unauthorized: Viewers cannot mutate workspace state." 
          }));
          return;
        }

        // Member cannot delete tasks or reset the database
        if (senderRole === 'member' && (type === 'DELETE_TASK' || type === 'RESET_PROJECT')) {
          ws.send(JSON.stringify({ 
            type: "ERROR", 
            payload: "Unauthorized: Members do not have deletion or resetting permissions." 
          }));
          return;
        }

        switch (type) {
          case "CREATE_TASK": {
            const newTask: Task = {
              ...payload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            projectState.tasks.push(newTask);
            
            // Add activity log
            const act: ActivityLog = {
              id: `act-${Date.now()}`,
              userId: userId || "unknown",
              userName: userName || "Unknown User",
              actionType: "Task Creation",
              details: `Created task "${newTask.title}" with priority ${newTask.priority}`,
              timestamp: new Date().toISOString(),
              isOffline: !!payload.isOfflineSynced
            };
            projectState.activities.unshift(act);
            saveState(projectState);
            broadcastToAll({ type: "TASK_CREATED", payload: newTask });
            broadcastToAll({ type: "ACTIVITY_LOGGED", payload: act });
            break;
          }

          case "UPDATE_TASK": {
            const index = projectState.tasks.findIndex(t => t.id === payload.id);
            if (index !== -1) {
              const oldTask = projectState.tasks[index];
              const updatedTask: Task = {
                ...oldTask,
                ...payload,
                updatedAt: new Date().toISOString()
              };
              projectState.tasks[index] = updatedTask;

              // Generate appropriate details of changes
              let details = `Updated task "${updatedTask.title}"`;
              if (oldTask.status !== updatedTask.status) {
                details = `Moved "${updatedTask.title}" from ${oldTask.status} to ${updatedTask.status}`;
              }

              const act: ActivityLog = {
                id: `act-${Date.now()}`,
                userId: userId || "unknown",
                userName: userName || "Unknown User",
                actionType: "Task Update",
                details,
                timestamp: new Date().toISOString(),
                isOffline: !!payload.isOfflineSynced
              };
              projectState.activities.unshift(act);
              saveState(projectState);
              broadcastToAll({ type: "TASK_UPDATED", payload: updatedTask });
              broadcastToAll({ type: "ACTIVITY_LOGGED", payload: act });
            }
            break;
          }

          case "DELETE_TASK": {
            const taskToDelete = projectState.tasks.find(t => t.id === payload.id);
            if (taskToDelete) {
              projectState.tasks = projectState.tasks.filter(t => t.id !== payload.id);

              const act: ActivityLog = {
                id: `act-${Date.now()}`,
                userId: userId || "unknown",
                userName: userName || "Unknown User",
                actionType: "Task Deletion",
                details: `Deleted task "${taskToDelete.title}"`,
                timestamp: new Date().toISOString(),
                isOffline: false
              };
              projectState.activities.unshift(act);
              saveState(projectState);
              broadcastToAll({ type: "TASK_DELETED", payload: { id: payload.id } });
              broadcastToAll({ type: "ACTIVITY_LOGGED", payload: act });
            }
            break;
          }

          case "CREATE_MESSAGE": {
            const newMessage: Message = {
              ...payload,
              timestamp: new Date().toISOString()
            };
            projectState.messages.push(newMessage);

            // Fetch thread info to print in logs
            const thread = projectState.threads.find(t => t.id === newMessage.threadId);
            const channelName = thread ? thread.title : "Discussion Thread";

            const act: ActivityLog = {
              id: `act-${Date.now()}`,
              userId: userId || "unknown",
              userName: userName || "Unknown User",
              actionType: "Encrypted Message Posted",
              details: `Sent secure communication to ${channelName} [Key: ${newMessage.keyId}]`,
              timestamp: new Date().toISOString(),
              isOffline: !!payload.isOfflineSynced
            };
            projectState.activities.unshift(act);
            saveState(projectState);
            broadcastToAll({ type: "MESSAGE_CREATED", payload: newMessage });
            broadcastToAll({ type: "ACTIVITY_LOGGED", payload: act });
            break;
          }

          case "UPDATE_MILESTONE": {
            const index = projectState.milestones.findIndex(m => m.id === payload.id);
            if (index !== -1) {
              const oldMilestone = projectState.milestones[index];
              const updatedMilestone: Milestone = {
                ...oldMilestone,
                ...payload
              };
              projectState.milestones[index] = updatedMilestone;

              const act: ActivityLog = {
                id: `act-${Date.now()}`,
                userId: userId || "unknown",
                userName: userName || "Unknown User",
                actionType: "Milestone Adjustment",
                details: `Adjusted milestone "${updatedMilestone.title}" progress to ${updatedMilestone.progress}% (${updatedMilestone.status})`,
                timestamp: new Date().toISOString(),
                isOffline: !!payload.isOfflineSynced
              };
              projectState.activities.unshift(act);
              saveState(projectState);
              broadcastToAll({ type: "MILESTONE_UPDATED", payload: updatedMilestone });
              broadcastToAll({ type: "ACTIVITY_LOGGED", payload: act });
            }
            break;
          }

          case "CREATE_THREAD": {
            const newThread: Thread = {
              ...payload,
              createdAt: new Date().toISOString()
            };
            projectState.threads.push(newThread);

            const act: ActivityLog = {
              id: `act-${Date.now()}`,
              userId: userId || "unknown",
              userName: userName || "Unknown User",
              actionType: "Thread Created",
              details: `Created new project discussion channel: "${newThread.title}"`,
              timestamp: new Date().toISOString(),
              isOffline: false
            };
            projectState.activities.unshift(act);
            saveState(projectState);
            broadcastToAll({ type: "THREAD_CREATED", payload: newThread });
            broadcastToAll({ type: "ACTIVITY_LOGGED", payload: act });
            break;
          }

          case "SYNC_OFFLINE_BATCH": {
            // Reconcile and merge list of offline activities, tasks, and messages
            const { tasks: offlineTasks, messages: offlineMessages, activities: offlineActivities } = payload;

            // Merge and update tasks
            if (offlineTasks && Array.isArray(offlineTasks)) {
              offlineTasks.forEach((offTask: Task) => {
                const existingIndex = projectState.tasks.findIndex(t => t.id === offTask.id);
                if (existingIndex !== -1) {
                  // Only update if offline task was modified more recently than server task
                  if (new Date(offTask.updatedAt) > new Date(projectState.tasks[existingIndex].updatedAt)) {
                    projectState.tasks[existingIndex] = offTask;
                  }
                } else {
                  projectState.tasks.push(offTask);
                }
              });
            }

            // Merge messages
            if (offlineMessages && Array.isArray(offlineMessages)) {
              offlineMessages.forEach((offMsg: Message) => {
                if (!projectState.messages.some(m => m.id === offMsg.id)) {
                  projectState.messages.push(offMsg);
                }
              });
            }

            // Record offline activities
            if (offlineActivities && Array.isArray(offlineActivities)) {
              offlineActivities.forEach((offAct: ActivityLog) => {
                projectState.activities.unshift({
                  ...offAct,
                  details: `${offAct.details} (Synced from offline queue)`
                });
              });
            }

            // Add overall sync activity log
            const syncSummaryAct: ActivityLog = {
              id: `act-${Date.now()}`,
              userId: userId || "unknown",
              userName: userName || "Unknown User",
              actionType: "Reconciliation Sync",
              details: `Reconnected & synchronized queued offline modifications successfully.`,
              timestamp: new Date().toISOString(),
              isOffline: false
            };
            projectState.activities.unshift(syncSummaryAct);

            saveState(projectState);
            broadcastToAll({ type: "SYNC_STATE", payload: projectState });
            break;
          }
        }
      } catch (err) {
        console.error("Error processing websocket message:", err);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", (err) => {
      console.error("WS client connection error:", err);
      clients.delete(ws);
    });
  });

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listen on PORT 3000
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Collaborative Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal Server Startup Error:", err);
});
