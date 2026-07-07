import React from 'react';
import { ActivityLog, SyncItem, User } from '../types';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  CloudLightning, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  Play
} from 'lucide-react';

interface OfflineManagerProps {
  isOnline: boolean;
  onToggleConnection: () => void;
  offlineQueue: SyncItem[];
  activityLogs: ActivityLog[];
  currentUser: User;
  onTriggerSync: () => void;
}

export default function OfflineManager({
  isOnline,
  onToggleConnection,
  offlineQueue,
  activityLogs,
  currentUser,
  onTriggerSync
}: OfflineManagerProps) {
  return (
    <div className="space-y-6">
      
      {/* Network Status Widget */}
      <div className={`p-5 rounded-[24px] border transition shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5 ${
        isOnline 
          ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]' 
          : 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1.5 font-bold text-[#2E7D32] text-sm">
                <Wifi size={18} className="animate-pulse" />
                Network Mode: Online & Synchronized
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-[#C62828] text-sm">
                <WifiOff size={18} />
                Network Mode: Offline (Remote Productivity)
              </span>
            )}
          </div>
          <p className="text-xs text-[#4A4A4A] max-w-2xl leading-normal mt-0.5">
            {isOnline 
              ? 'Your browser is linked directly to the Express + WebSockets backend. All task mutations, status adjustments, and messages synchronize instantly with all teammates.'
              : 'You are disconnected from the network. You can continue creating/editing tasks and typing messages. Actions are cached locally in your IndexedDB/localStorage queue.'
            }
          </p>
        </div>

        {/* Big Connection Toggle Button */}
        <button
          onClick={onToggleConnection}
          className={`px-4 py-2.5 text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
            isOnline 
              ? 'bg-[#C62828] hover:bg-[#B71C1C] text-white' 
              : 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white'
          }`}
        >
          {isOnline ? (
            <>
              <WifiOff size={14} />
              Go Offline
            </>
          ) : (
            <>
              <Wifi size={14} />
              Go Online & Sync
            </>
          )}
        </button>
      </div>

      {/* Queue and Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cached Queue block */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#F5F5F5] pb-3">
            <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 tracking-tight">
              <Database size={16} className="text-[#4A4A4A]" />
              Offline Outbox Caches ({offlineQueue.length})
            </h3>
            {!isOnline && offlineQueue.length > 0 && (
              <button
                onClick={onTriggerSync}
                className="text-[10px] bg-[#FAF9F9] hover:bg-[#F5F5F5] font-bold px-3 py-1.5 border border-[#E5E5E5] rounded-full text-[#1A1A1A] flex items-center gap-1 transition cursor-pointer"
                title="Force local synchronization pipeline"
              >
                <RefreshCw size={10} className="animate-spin" /> Sync Now
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {offlineQueue.length === 0 ? (
              <div className="text-center text-[#9E9E9E] py-16 space-y-1.5">
                <CloudLightning size={24} className="text-[#4A4A4A] mx-auto" />
                <p className="text-xs font-bold text-[#1A1A1A]">Caches Empty</p>
                <p className="text-[10px] text-[#9E9E9E]">No modifications queued. Everything is synced up.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {offlineQueue.map((item) => (
                  <div key={item.id} className="p-3.5 bg-[#FAF9F9] border border-[#EEEEEE] rounded-2xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#9E9E9E]">
                      <span className="uppercase text-[#4A4A4A] font-bold">Action: {item.action}</span>
                      <span className="flex items-center gap-0.5 font-semibold">
                        <Clock size={10} /> {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[#1A1A1A] font-bold truncate">
                      {item.action === 'create_task' || item.action === 'update_task'
                        ? `Task: "${item.payload.title || item.payload.id}"`
                        : item.action === 'create_message'
                        ? `Encrypted message payload in Thread: "${item.payload.threadId}"`
                        : 'Modification payload'}
                    </div>
                    <div className="text-[10px] text-[#9E9E9E] font-mono overflow-hidden truncate bg-white border border-[#EEEEEE] p-1.5 rounded-lg">
                      Payload: {JSON.stringify(item.payload)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync Audits Ledger */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-4">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 border-b border-[#F5F5F5] pb-3 tracking-tight">
            <CloudLightning size={16} className="text-[#4A4A4A]" />
            Audit Ledger & Synchronization logs
          </h3>

          <div className="space-y-3 h-[380px] overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-[#FAF9F9] border border-[#EEEEEE] rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9E9E9E]" />
                    {log.actionType}
                  </span>
                  {log.isOffline && (
                    <span className="text-[8px] font-bold bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082] px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider">
                      <WifiOff size={8} /> Synced Offline
                    </span>
                  )}
                </div>
                <p className="text-[#4A4A4A] text-xs leading-relaxed font-sans">{log.details}</p>
                <div className="flex justify-between items-center text-[10px] text-[#9E9E9E] pt-1">
                  <span>Logged by: <span className="font-bold text-[#4A4A4A]">{log.userName}</span></span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
