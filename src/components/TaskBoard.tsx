import React, { useState } from 'react';
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  User, 
  UserRole, 
  SubTask 
} from '../types';
import { 
  Plus, 
  CheckSquare, 
  Calendar, 
  Tag, 
  User as UserIcon, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (task: Partial<Task> & { id: string }) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskBoard({
  tasks,
  users,
  currentUser,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: TaskBoardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasksList, setSubtasksList] = useState<{ title: string }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Permission Checks
  const canModify = currentUser.role === 'admin' || currentUser.role === 'member';
  const canDelete = currentUser.role === 'admin';

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const subtasks: SubTask[] = subtasksList.map((st, i) => ({
      id: `sub-${Date.now()}-${i}`,
      title: st.title,
      completed: false
    }));

    onAddTask({
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId || null,
      creatorId: currentUser.id,
      tags,
      subtasks,
      dueDate: dueDate || new Date().toISOString().split('T')[0]
    });

    // Reset Form
    resetForm();
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !canModify) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onUpdateTask({
      id: editingTask.id,
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId || null,
      tags,
      dueDate: dueDate || new Date().toISOString().split('T')[0]
    });

    setEditingTask(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setAssigneeId('');
    setDueDate('');
    setTagsInput('');
    setSubtasksList([]);
    setNewSubtaskTitle('');
    setShowAddForm(false);
  };

  const startEdit = (task: Task) => {
    if (!canModify) return;
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId || '');
    setDueDate(task.dueDate);
    setTagsInput(task.tags.join(', '));
    setShowAddForm(true);
  };

  const addSubtaskField = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasksList([...subtasksList, { title: newSubtaskTitle.trim() }]);
      setNewSubtaskTitle('');
    }
  };

  const toggleSubtask = (task: Task, subtaskId: string) => {
    if (!canModify) return;
    const updatedSubtasks = task.subtasks.map(sub => 
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );
    onUpdateTask({
      id: task.id,
      subtasks: updatedSubtasks
    });
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'high': return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'low': return 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]';
    }
  };

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-t-4 border-[#9E9E9E]' },
    { id: 'in_progress', title: 'In Progress', color: 'border-t-4 border-[#4A4A4A]' },
    { id: 'review', title: 'Review & Audit', color: 'border-t-4 border-amber-600' },
    { id: 'done', title: 'Completed', color: 'border-t-4 border-[#2E7D32]' }
  ];

  return (
    <div className="space-y-6">
      {/* Upper Bar: Controls & Alerts */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-[24px] shadow-sm border border-[#E5E5E5]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Workspace Tasks</h2>
          <p className="text-xs text-[#9E9E9E] mt-0.5">
            Current Session: <span className="font-semibold text-[#4A4A4A]">{currentUser.name}</span> ({currentUser.role.toUpperCase()} privileges)
          </p>
        </div>
        
        {canModify ? (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4A4A4A] hover:bg-[#333333] text-white font-semibold rounded-full text-xs shadow-sm transition"
          >
            <Plus size={16} />
            Create Task
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F5] text-[#9E9E9E] border border-[#E5E5E5] rounded-full text-xs font-semibold">
            <Eye size={14} className="text-[#9E9E9E]" />
            Viewer Access (Read-Only)
          </div>
        )}
      </div>

      {/* Inline Forms for Creation and Editing */}
      {showAddForm && (
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-[24px] shadow-sm transition">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#F5F5F5]">
            <h3 className="font-bold text-[#1A1A1A] text-base">
              {editingTask ? 'Edit Task Settings' : 'Create New Collaboration Task'}
            </h3>
            <button 
              onClick={resetForm}
              className="text-xs text-[#9E9E9E] hover:text-[#4A4A4A] font-semibold"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider">Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Implement Encryption Guard"
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the workflow, deliverables, and security boundaries..."
                rows={3}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border capitalize transition ${
                      priority === p 
                        ? 'bg-[#4A4A4A] border-[#4A4A4A] text-white' 
                        : 'bg-white border-[#E5E5E5] text-[#9E9E9E] hover:text-[#4A4A4A] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Security, API, Urgent"
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              />
            </div>

            {/* Subtask Creation (Only for New Tasks, editing does it inline on cards) */}
            {!editingTask && (
              <div className="space-y-1 md:col-span-2 bg-[#FAF9F9] p-4 rounded-2xl border border-[#E5E5E5]">
                <label className="text-[10px] font-bold text-[#1A1A1A] block uppercase tracking-wider mb-2">Checklist Subtasks</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a checklist item..."
                    className="flex-1 px-3 py-1.5 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
                  />
                  <button
                    type="button"
                    onClick={addSubtaskField}
                    className="px-3.5 py-1.5 bg-[#4A4A4A] hover:bg-[#333333] text-white font-bold rounded-xl text-xs transition"
                  >
                    Add
                  </button>
                </div>
                {subtasksList.length > 0 && (
                  <ul className="mt-3 space-y-1 divide-y divide-[#E5E5E5]">
                    {subtasksList.map((st, idx) => (
                      <li key={idx} className="text-xs text-[#1A1A1A] pt-2 flex justify-between items-center">
                        <span className="font-medium">• {st.title}</span>
                        <button
                          type="button"
                          onClick={() => setSubtasksList(subtasksList.filter((_, i) => i !== idx))}
                          className="text-[#9E9E9E] hover:text-rose-500 font-bold text-xs"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="md:col-span-2 pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 border border-[#E5E5E5] text-[#1A1A1A] text-xs font-bold rounded-full hover:bg-[#F5F5F5] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#4A4A4A] hover:bg-[#333333] text-white text-xs font-bold rounded-full shadow-sm transition"
              >
                {editingTask ? 'Save Changes' : 'Post Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-white/40 rounded-[24px] p-4 flex flex-col min-h-[500px] border border-[#E5E5E5] shadow-xs">
              {/* Column Header */}
              <div className={`p-3 bg-white rounded-xl border border-[#EEEEEE] mb-4 flex justify-between items-center ${col.color}`}>
                <h4 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 tracking-tight">
                  {col.title}
                  <span className="text-[10px] px-2 py-0.5 bg-[#F5F5F5] text-[#4A4A4A] border border-[#E5E5E5] font-bold rounded-full">
                    {colTasks.length}
                  </span>
                </h4>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 border border-dashed border-[#E5E5E5] rounded-2xl text-[#9E9E9E] text-xs text-center p-4">
                    No active tasks here.
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
                    const totalSubtasks = task.subtasks.length;
                    const percentComplete = totalSubtasks > 0 
                      ? Math.round((completedSubtasks / totalSubtasks) * 100) 
                      : 0;

                    return (
                      <div 
                        key={task.id} 
                        className="bg-white p-5 rounded-2xl border border-[#EEEEEE] hover:border-[#CCCCCC] shadow-xs transition group space-y-4 duration-150"
                      >
                        {/* Priority & Controls */}
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority} Priority
                          </span>
                          
                          {/* Column Shift buttons (Accessible Alternative to Drag/Drop) */}
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                            {col.id !== 'todo' && canModify && (
                              <button
                                title="Move Left"
                                onClick={() => {
                                  const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
                                  const prevIdx = statuses.indexOf(col.id) - 1;
                                  onUpdateTask({ id: task.id, status: statuses[prevIdx] });
                                }}
                                className="p-1 hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded text-xs text-[#4A4A4A]"
                              >
                                ◀
                              </button>
                            )}
                            {col.id !== 'done' && canModify && (
                              <button
                                title="Move Right"
                                onClick={() => {
                                  const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
                                  const nextIdx = statuses.indexOf(col.id) + 1;
                                  onUpdateTask({ id: task.id, status: statuses[nextIdx] });
                                }}
                                className="p-1 hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded text-xs text-[#4A4A4A]"
                              >
                                ▶
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h5 className="font-bold text-[#1A1A1A] text-sm group-hover:text-[#4A4A4A] transition tracking-tight leading-snug">
                            {task.title}
                          </h5>
                          <p className="text-xs text-[#9E9E9E] mt-1.5 line-clamp-3 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Subtasks Progress */}
                        {totalSubtasks > 0 && (
                          <div className="space-y-2 p-3 bg-[#F5F5F5]/60 rounded-xl border border-[#EEEEEE]">
                            <div className="flex justify-between items-center text-[9px] text-[#4A4A4A] font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <CheckSquare size={12} className="text-[#9E9E9E]" />
                                Checklist ({completedSubtasks}/{totalSubtasks})
                              </span>
                              <span>{percentComplete}%</span>
                            </div>
                            <div className="h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#4A4A4A] transition-all duration-300"
                                style={{ width: `${percentComplete}%` }}
                              />
                            </div>
                            {/* Expandable checklist */}
                            <div className="space-y-1 mt-1.5 pt-1.5 border-t border-[#EEEEEE]">
                              {task.subtasks.map((st) => (
                                <label 
                                  key={st.id} 
                                  className={`flex items-center gap-2 text-[10px] cursor-pointer ${canModify ? '' : 'pointer-events-none'}`}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={st.completed}
                                    disabled={!canModify}
                                    onChange={() => toggleSubtask(task, st.id)}
                                    className="rounded border-[#E5E5E5] text-[#4A4A4A] focus:ring-0 h-3.5 w-3.5 accent-[#4A4A4A]"
                                  />
                                  <span className={st.completed ? 'line-through text-[#9E9E9E]' : 'text-[#1A1A1A] font-medium'}>
                                    {st.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag, idx) => (
                              <span key={idx} className="flex items-center gap-0.5 text-[9px] font-semibold bg-[#FAF9F9] border border-[#EEEEEE] text-[#4A4A4A] px-2 py-0.5 rounded-full">
                                <Tag size={8} className="text-[#9E9E9E]" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: Date & Assignee */}
                        <div className="flex justify-between items-center pt-3 border-t border-[#F5F5F5] text-[10px] text-[#9E9E9E]">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={12} className="text-[#9E9E9E]" />
                            {task.dueDate}
                          </span>

                          <div className="flex items-center gap-1">
                            {assignee ? (
                              <span 
                                className="flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F5F5] border border-[#EEEEEE] text-[#1A1A1A]"
                                title={`Assigned to ${assignee.name}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${assignee.avatarColor}`} />
                                {assignee.name.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="text-[#9E9E9E] italic text-[10px]">Unassigned</span>
                            )}
                          </div>
                        </div>

                        {/* Card Edit/Delete Actions (Only displayed if canModify) */}
                        {canModify && (
                          <div className="flex justify-end gap-1.5 pt-2 border-t border-[#FAF9F9]">
                            <button
                              onClick={() => startEdit(task)}
                              className="p-1 text-[#9E9E9E] hover:text-[#4A4A4A] rounded hover:bg-[#F5F5F5] transition"
                              title="Edit Task Settings"
                            >
                              <Edit3 size={12} />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1 text-[#9E9E9E] hover:text-rose-600 rounded hover:bg-[#F5F5F5] transition"
                                title="Delete Task"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
