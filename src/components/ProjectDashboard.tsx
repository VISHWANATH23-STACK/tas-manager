import React, { useState } from 'react';
import { Task, Milestone, User } from '../types';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Flag, 
  Calendar,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ProjectDashboardProps {
  tasks: Task[];
  milestones: Milestone[];
  currentUser: User;
  onUpdateMilestone: (milestone: Partial<Milestone> & { id: string }) => void;
}

export default function ProjectDashboard({
  tasks,
  milestones,
  currentUser,
  onUpdateMilestone
}: ProjectDashboardProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'upcoming' | 'achieved' | 'delayed'>('upcoming');

  // Permission Check for Milestones
  const canModifyMilestones = currentUser.role === 'admin';

  // Calculate high-fidelity stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const reviewTasks = tasks.filter(t => t.status === 'review').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority Stats
  const highPriority = tasks.filter(t => t.priority === 'high').length;
  const medPriority = tasks.filter(t => t.priority === 'medium').length;
  const lowPriority = tasks.filter(t => t.priority === 'low').length;

  // Custom SVG Progress Circle Calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  const handleMilestoneUpdateSubmit = (milestoneId: string) => {
    onUpdateMilestone({
      id: milestoneId,
      progress: editProgress,
      status: editStatus
    });
    setSelectedMilestone(null);
  };

  const openMilestoneEdit = (m: Milestone) => {
    if (!canModifyMilestones) return;
    setSelectedMilestone(m.id);
    setEditProgress(m.progress);
    setEditStatus(m.status);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Project Performance & Milestones</h2>
        <p className="text-xs text-[#9E9E9E] mt-0.5">Live auditing metrics derived from collaborative team state</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="bg-white p-5 rounded-[24px] border border-[#EEEEEE] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider block">Completion Rate</span>
            <div className="text-2xl font-bold text-[#4A4A4A]">{completionRate}%</div>
            <p className="text-[10px] text-[#9E9E9E]">{completedTasks} of {totalTasks} tasks finished</p>
          </div>
          {/* Custom SVG Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="32" cy="32" r="26" 
                className="stroke-[#EEEEEE] fill-none" 
                strokeWidth="4" 
              />
              <circle 
                cx="32" cy="32" r="26" 
                className="stroke-[#4A4A4A] fill-none transition-all duration-500" 
                strokeWidth="4" 
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 - (completionRate / 100) * (2 * Math.PI * 26)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[#4A4A4A]">{completionRate}%</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-[24px] border border-[#EEEEEE] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider block">In Progress</span>
            <div className="text-2xl font-bold text-[#1A1A1A]">{inProgressTasks}</div>
            <p className="text-[10px] text-[#9E9E9E]">Actively worked by team</p>
          </div>
        </div>

        {/* Quality Audit */}
        <div className="bg-white p-5 rounded-[24px] border border-[#EEEEEE] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#FAF9F9] text-[#4A4A4A] rounded-xl border border-[#EEEEEE]">
            <TrendingUp size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider block">In Peer Review</span>
            <div className="text-2xl font-bold text-[#1A1A1A]">{reviewTasks}</div>
            <p className="text-[10px] text-[#9E9E9E]">Requires verification</p>
          </div>
        </div>

        {/* Milestones Achieved */}
        <div className="bg-white p-5 rounded-[24px] border border-[#EEEEEE] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#E8F5E9] text-[#2E7D32] rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider block">Milestones Achieved</span>
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {milestones.filter(m => m.status === 'achieved').length} / {milestones.length}
            </div>
            <p className="text-[10px] text-[#9E9E9E]">Key targets successfully hit</p>
          </div>
        </div>
      </div>

      {/* Main Analysis and Visualization Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom SVG Graphical Distribution */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 tracking-tight">
            <Layers size={16} className="text-[#4A4A4A]" />
            Workspace Task Distribution
          </h3>

          {/* Interactive Responsive SVG Stack Bar Chart */}
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between items-center text-xs text-[#1A1A1A] mb-2 font-bold">
                <span>Task Distribution Status Breakdown</span>
                <span className="text-[10px] bg-[#F5F5F5] border border-[#E5E5E5] text-[#4A4A4A] px-2 py-0.5 rounded-full font-bold">Total {totalTasks} Tasks</span>
              </div>
              
              {/* Stacked visualization block */}
              {totalTasks > 0 ? (
                <div className="space-y-3">
                  <div className="h-6 w-full rounded-full overflow-hidden flex shadow-xs bg-[#EEEEEE]">
                    {todoTasks > 0 && (
                      <div 
                        style={{ width: `${(todoTasks / totalTasks) * 100}%` }} 
                        className="h-full bg-[#EEEEEE] hover:opacity-90 transition-all duration-300 flex items-center justify-center text-[10px] text-[#4A4A4A] font-bold"
                        title={`To Do: ${todoTasks}`}
                      >
                        {todoTasks > 0 && `${Math.round((todoTasks / totalTasks) * 100)}%`}
                      </div>
                    )}
                    {inProgressTasks > 0 && (
                      <div 
                        style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }} 
                        className="h-full bg-[#4A4A4A] hover:opacity-90 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                        title={`In Progress: ${inProgressTasks}`}
                      >
                        {inProgressTasks > 0 && `${Math.round((inProgressTasks / totalTasks) * 100)}%`}
                      </div>
                    )}
                    {reviewTasks > 0 && (
                      <div 
                        style={{ width: `${(reviewTasks / totalTasks) * 100}%` }} 
                        className="h-full bg-amber-500 hover:opacity-90 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                        title={`Review: ${reviewTasks}`}
                      >
                        {reviewTasks > 0 && `${Math.round((reviewTasks / totalTasks) * 100)}%`}
                      </div>
                    )}
                    {completedTasks > 0 && (
                      <div 
                        style={{ width: `${(completedTasks / totalTasks) * 100}%` }} 
                        className="h-full bg-[#2E7D32] hover:opacity-90 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                        title={`Completed: ${completedTasks}`}
                      >
                        {completedTasks > 0 && `${Math.round((completedTasks / totalTasks) * 100)}%`}
                      </div>
                    )}
                  </div>

                  {/* Legends */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#9E9E9E] font-medium">
                      <span className="w-3 h-3 bg-[#EEEEEE] rounded border border-[#E5E5E5]" />
                      <span>To Do ({todoTasks})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#9E9E9E] font-medium">
                      <span className="w-3 h-3 bg-[#4A4A4A] rounded" />
                      <span>In Progress ({inProgressTasks})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#9E9E9E] font-medium">
                      <span className="w-3 h-3 bg-amber-500 rounded" />
                      <span>Review ({reviewTasks})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#9E9E9E] font-medium">
                      <span className="w-3 h-3 bg-[#2E7D32] rounded" />
                      <span>Completed ({completedTasks})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-10 flex items-center justify-center bg-[#F5F5F5] text-[#9E9E9E] text-xs rounded-xl border border-dashed border-[#E5E5E5]">
                  No active data to generate charts.
                </div>
              )}
            </div>

            {/* Priority Comparison bar chart using interactive SVG paths */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Priority Load Balancing</h4>
              <div className="space-y-3">
                {/* High Priority Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#4A4A4A] font-medium">
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> High Priority
                    </span>
                    <span>{highPriority} tasks</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden border border-[#EEEEEE]">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalTasks > 0 ? (highPriority / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Medium Priority Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#4A4A4A] font-medium">
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Medium Priority
                    </span>
                    <span>{medPriority} tasks</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden border border-[#EEEEEE]">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalTasks > 0 ? (medPriority / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Low Priority Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#4A4A4A] font-medium">
                    <span className="font-bold text-[#2E7D32] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" /> Low Priority
                    </span>
                    <span>{lowPriority} tasks</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden border border-[#EEEEEE]">
                    <div 
                      className="h-full bg-[#2E7D32] rounded-full transition-all duration-500" 
                      style={{ width: `${totalTasks > 0 ? (lowPriority / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Adjustment panel */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-4">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 tracking-tight">
            <Sparkles size={16} className="text-amber-500" />
            Milestone Console
          </h3>
          
          <p className="text-xs text-[#9E9E9E] leading-relaxed">
            Key product phases. {canModifyMilestones ? 'Select a milestone card below to dynamically adjust progress rates.' : 'Admins can modify targets. Read-only for other roles.'}
          </p>

          {/* Quick status view */}
          <div className="p-4 bg-[#FAF9F9] rounded-2xl border border-[#EEEEEE] text-xs text-[#1A1A1A] space-y-1.5">
            <span className="font-bold text-[#4A4A4A]">Milestone Roadmap Status:</span>
            <ul className="list-none space-y-1 pl-1 text-[#4A4A4A] font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                {milestones.filter(m => m.status === 'achieved').length} Achieved
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A4A4A]" />
                {milestones.filter(m => m.status === 'upcoming').length} Upcoming
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                {milestones.filter(m => m.status === 'delayed').length} Delayed
              </li>
            </ul>
          </div>

          {/* Inline Editor */}
          {selectedMilestone && (
            <div className="p-4 bg-white rounded-2xl border border-[#E5E5E5] space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Adjust Milestone State</h4>
              <div className="space-y-1">
                <label className="text-[10px] text-[#4A4A4A] font-bold uppercase block">Progress Percentage ({editProgress}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full accent-[#4A4A4A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#4A4A4A] font-bold uppercase block">Milestone Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E5] rounded-xl text-[#1A1A1A] focus:outline-none focus:ring-0 focus:border-[#4A4A4A]"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="achieved">Achieved</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="px-4 py-2 text-[10px] border border-[#E5E5E5] text-[#1A1A1A] font-bold rounded-full bg-white hover:bg-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMilestoneUpdateSubmit(selectedMilestone)}
                  className="px-4 py-2 text-[10px] bg-[#4A4A4A] text-white font-bold rounded-full hover:bg-[#333333] shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Milestones Roadmaps Timeline */}
      <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-4">
        <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 tracking-tight">
          <Flag size={16} className="text-[#4A4A4A]" />
          Milestones Roadmaps
        </h3>

        <div className="space-y-4">
          {milestones.map((m) => {
            const isEditingThis = selectedMilestone === m.id;
            return (
              <div 
                key={m.id}
                onClick={() => canModifyMilestones && openMilestoneEdit(m)}
                className={`p-5 rounded-2xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  canModifyMilestones ? 'cursor-pointer hover:border-[#CCCCCC]' : ''
                } ${isEditingThis ? 'border-[#4A4A4A] ring-2 ring-[#4A4A4A]/10 bg-[#FAF9F9]' : 'border-[#EEEEEE] bg-white'}`}
              >
                {/* Title & Desc */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#1A1A1A] text-sm tracking-tight">{m.title}</h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${
                      m.status === 'achieved' 
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                        : m.status === 'delayed'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-[#F5F5F5] text-[#4A4A4A] border-[#E5E5E5]'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#9E9E9E] leading-relaxed">{m.description}</p>
                </div>

                {/* Progress bar visual */}
                <div className="flex items-center gap-4 w-full md:w-64">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-[#4A4A4A] uppercase tracking-wider">
                      <span>Progress</span>
                      <span>{m.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden border border-[#EEEEEE]">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.status === 'achieved' ? 'bg-[#2E7D32]' : 'bg-[#4A4A4A]'
                        }`}
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold text-[#9E9E9E] uppercase block tracking-wider">Due Date</span>
                    <span className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1 mt-0.5">
                      <Calendar size={12} className="text-[#9E9E9E]" />
                      {m.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
