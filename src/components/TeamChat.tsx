import React, { useState, useEffect, useRef } from 'react';
import { Thread, Message, User } from '../types';
import { ClientCrypto } from '../utils/crypto';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  ShieldCheck, 
  Lock, 
  Key, 
  Clock, 
  Search,
  Hash,
  Unlock,
  AlertCircle
} from 'lucide-react';

interface TeamChatProps {
  threads: Thread[];
  messages: Message[];
  users: User[];
  currentUser: User;
  onAddThread: (thread: Omit<Thread, 'id' | 'createdAt'>) => void;
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'senderName' | 'senderRole'>) => void;
}

export default function TeamChat({
  threads,
  messages,
  users,
  currentUser,
  onAddThread,
  onSendMessage
}: TeamChatProps) {
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-general');
  const [newMessageText, setNewMessageText] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showAddThreadForm, setShowAddThreadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // PEER INTO MESSAGE CRYPTO
  // Store which message IDs have their "raw ciphertext reveal" panel open
  const [revealedMessageIds, setRevealedMessageIds] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const activeMessages = messages.filter(m => m.threadId === activeThreadId);

  // Decrypt cleartext on rendering
  const decryptedMessages = activeMessages.map(msg => {
    const clearText = ClientCrypto.decrypt(
      msg.encryptedContent,
      msg.keyId,
      msg.iv
    );
    return {
      ...msg,
      cleartextContent: clearText
    };
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || currentUser.role === 'viewer') return;

    const iv = ClientCrypto.generateIV();
    const keyId = ClientCrypto.getActiveKeyId();
    
    // Perform robust client-side encryption
    const encrypted = ClientCrypto.encrypt(newMessageText.trim(), keyId, iv);

    onSendMessage({
      threadId: activeThreadId,
      senderId: currentUser.id,
      encryptedContent: encrypted,
      iv,
      keyId
    });

    setNewMessageText('');
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || currentUser.role === 'viewer') return;

    onAddThread({
      title: `# ${newThreadTitle.trim().replace(/\s+/g, '-')}`,
      taskId: null,
      category: 'general'
    });

    setNewThreadTitle('');
    setShowAddThreadForm(false);
  };

  const toggleRevealCrypto = (msgId: string) => {
    setRevealedMessageIds(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const activeKey = ClientCrypto.getKey(ClientCrypto.getActiveKeyId());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 bg-white rounded-[24px] border border-[#E5E5E5] shadow-sm overflow-hidden h-[600px]">
      
      {/* Threads Sidebar */}
      <div className="border-r border-[#E5E5E5] bg-[#FAF9F9] flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center bg-white">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5">
            <MessageSquare size={16} className="text-[#4A4A4A]" />
            Project Threads
          </h3>
          {currentUser.role !== 'viewer' && (
            <button
              onClick={() => setShowAddThreadForm(!showAddThreadForm)}
              className="p-1.5 hover:bg-[#F5F5F5] rounded-full text-[#4A4A4A] transition"
              title="Create Thread"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Create Thread Form */}
        {showAddThreadForm && (
          <form onSubmit={handleCreateThread} className="p-3 border-b border-[#E5E5E5] bg-white space-y-2">
            <input
              type="text"
              required
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="thread-name..."
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded-xl focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
            />
            <div className="flex gap-1 justify-end">
              <button
                type="button"
                onClick={() => setShowAddThreadForm(false)}
                className="px-3 py-1.5 text-[10px] border border-[#E5E5E5] text-[#1A1A1A] rounded-full hover:bg-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-[10px] bg-[#4A4A4A] hover:bg-[#333333] text-white rounded-full font-bold"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  isActive 
                    ? 'bg-[#F5F5F5] border border-[#EEEEEE] text-[#1A1A1A] font-bold' 
                    : 'text-[#9E9E9E] hover:text-[#1A1A1A] hover:bg-[#F5F5F5]/60 border border-transparent'
                }`}
              >
                <Hash size={14} className={isActive ? 'text-[#4A4A4A]' : 'text-[#9E9E9E]'} />
                <span className="truncate">{thread.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Key Status Info block */}
        <div className="p-4 bg-white text-[#4A4A4A] text-[10px] leading-relaxed border-t border-[#E5E5E5] flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-1 font-bold text-[#1A1A1A] uppercase tracking-wider">
            <Lock size={10} className="text-[#2E7D32]" />
            Active Crypto Keyring
          </div>
          <div className="truncate font-mono bg-[#FAF9F9] p-2 rounded-xl border border-[#EEEEEE] text-[9px] text-[#4A4A4A]">
            ID: <span className="text-[#4A4A4A] font-bold">project-key-v1</span>
            <br />
            Key: {activeKey.substring(0, 16)}...
          </div>
          <p className="text-[#9E9E9E] text-[9px]">Messages are client-encrypted with zero plaintext transmission over the server.</p>
        </div>
      </div>

      {/* Active Conversation Area */}
      <div className="lg:col-span-3 flex flex-col h-full bg-white">
        
        {/* Active Channel Header */}
        <div className="p-4 border-b border-[#E5E5E5] bg-white flex justify-between items-center">
          <div>
            <h4 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1">
              <Hash size={15} className="text-[#4A4A4A]" />
              {activeThread?.title?.replace('#', '') || 'General'}
            </h4>
            <p className="text-[10px] text-[#9E9E9E] font-semibold mt-0.5">
              Category: {activeThread?.category.toUpperCase()} • Live Decrypted Stream
            </p>
          </div>

          {/* Secure Shield Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-full text-[10px] font-bold">
            <ShieldCheck size={12} className="text-[#2E7D32]" />
            Client Encrypted
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F9]/40">
          {decryptedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#9E9E9E] text-xs text-center space-y-2 py-20">
              <Lock size={24} className="text-[#4A4A4A]" />
              <div>
                <p className="font-bold text-[#1A1A1A]">Beginning of Encrypted Stream</p>
                <p className="text-[10px] text-[#9E9E9E] mt-0.5">All conversation logs sent to this thread are fully shielded.</p>
              </div>
            </div>
          ) : (
            decryptedMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const isRevealed = !!revealedMessageIds[msg.id];

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1 max-w-[85%] ${isMine ? 'ml-auto' : 'mr-auto'}`}>
                  
                  {/* Sender Name & Role */}
                  <span className="text-[10px] text-[#4A4A4A] font-bold flex items-center gap-1.5 px-1">
                    {msg.senderName} 
                    <span className="bg-[#F5F5F5] text-[#4A4A4A] border border-[#EEEEEE] rounded-full px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold">
                      {msg.senderRole}
                    </span>
                  </span>

                  {/* Message Bubble Card */}
                  <div 
                    onClick={() => toggleRevealCrypto(msg.id)}
                    className={`p-3 rounded-[18px] text-xs border transition duration-150 cursor-pointer ${
                      isMine 
                        ? 'bg-[#4A4A4A] border-[#4A4A4A] text-white rounded-tr-none' 
                        : 'bg-[#FAF9F9] border border-[#EEEEEE] text-[#1A1A1A] rounded-tl-none hover:border-[#CCCCCC]'
                    }`}
                    title="Click to inspect cryptographic ciphertext & keys"
                  >
                    <p className="leading-relaxed font-sans whitespace-pre-wrap select-text">{msg.cleartextContent}</p>

                    {/* Cryptographic shield anchor inside bubble */}
                    <div className={`mt-1.5 pt-1 border-t border-dashed flex justify-between items-center text-[8px] font-mono ${
                      isMine ? 'border-white/10 text-white/70' : 'border-[#EEEEEE] text-[#9E9E9E]'
                    }`}>
                      <span className="flex items-center gap-0.5">
                        <Lock size={8} /> Client Secured
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={8} /> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* PEER CRYPTO DROPDOWN CARD */}
                  {isRevealed && (
                    <div className="w-full p-3.5 bg-[#FAF9F9] text-[#1A1A1A] text-[9px] font-mono rounded-2xl border border-[#E5E5E5] space-y-2 shadow-sm mt-2 max-w-full overflow-hidden select-text">
                      <div className="flex justify-between items-center border-b border-[#EEEEEE] pb-1.5 mb-1.5 text-[#9E9E9E] font-bold uppercase tracking-wider text-[8px]">
                        <span>🛡️ Cryptographic Inspection Ledger</span>
                        <span className="text-[#2E7D32]">STATUS: Decrypted</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-[#9E9E9E]">Key ID:</span>
                        <span className="col-span-2 text-[#1A1A1A] font-bold">{msg.keyId}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-[#9E9E9E]">IV Vector:</span>
                        <span className="col-span-2 text-[#1A1A1A] font-bold">{msg.iv}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1 border-t border-[#EEEEEE] pt-1">
                        <span className="text-[#9E9E9E] font-bold uppercase text-[8px]">DATABASE CIPHERTEXT (Hex bytes):</span>
                        <div className="bg-[#F5F5F5] p-2 rounded-lg break-all text-[#4A4A4A] text-[8px] border border-[#EEEEEE] max-h-12 overflow-y-auto">
                          {msg.encryptedContent}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[#9E9E9E] font-bold uppercase text-[8px]">PLAINTEXT STREAM RECOVERED:</span>
                        <div className="bg-[#F5F5F5] p-2 rounded-lg text-[#1A1A1A] text-[8px] border border-[#EEEEEE]">
                          {msg.cleartextContent}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input form bar */}
        {currentUser.role !== 'viewer' ? (
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#E5E5E5] flex gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder={`Send encrypted message to ${activeThread?.title || 'thread'}...`}
              className="flex-1 px-4 py-2.5 border border-[#E5E5E5] rounded-full text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-[#FAF9F9] text-[#1A1A1A]"
            />
            <button
              type="submit"
              className="px-4.5 py-2.5 bg-[#4A4A4A] hover:bg-[#333333] text-white font-bold rounded-full text-xs shadow-sm transition shrink-0 flex items-center gap-1.5"
            >
              <Send size={12} />
              Encrypt & Send
            </button>
          </form>
        ) : (
          <div className="p-4 bg-[#FAF9F9] border-t border-[#E5E5E5] text-center text-[10px] text-[#9E9E9E] font-bold flex items-center justify-center gap-1.5">
            <AlertCircle size={12} className="text-[#9E9E9E]" />
            Viewing Mode: You are unauthorized to broadcast messages to this thread.
          </div>
        )}

      </div>

    </div>
  );
}
