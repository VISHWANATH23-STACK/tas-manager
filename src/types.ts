export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarColor: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  creatorId: string;
  tags: string[];
  subtasks: SubTask[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'upcoming' | 'achieved' | 'delayed';
  progress: number; // 0 to 100
  tasksAssigned: string[]; // task IDs
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  encryptedContent: string;
  iv: string; // initialization vector or salt representation
  keyId: string; // identifies the encryption key used
  timestamp: string;
  // Computed on client side, never sent unencrypted to backend
  cleartextContent?: string;
}

export interface Thread {
  id: string;
  title: string;
  taskId: string | null; // Associated task, if any
  category: 'general' | 'tasks' | 'milestones';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  actionType: string;
  details: string;
  timestamp: string;
  isOffline: boolean;
}

export interface SyncItem {
  id: string;
  action: 'create_task' | 'update_task' | 'delete_task' | 'create_message' | 'update_milestone';
  payload: any;
  timestamp: string;
}

export interface ProjectState {
  tasks: Task[];
  milestones: Milestone[];
  threads: Thread[];
  messages: Message[];
  activities: ActivityLog[];
}
