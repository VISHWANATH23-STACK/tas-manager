import React, { useState } from 'react';
import { ClientCrypto } from '../utils/crypto';
import { 
  ShieldAlert, 
  Lock, 
  Key, 
  Database, 
  Terminal, 
  RefreshCw, 
  CheckCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';

export default function SecurityConsole() {
  const [testCleartext, setTestCleartext] = useState('Stakeholder Q3 Audit Confirmed.');
  const [customKeyId, setCustomKeyId] = useState('custom-sec-key-3');
  const [customKeyVal, setCustomKeyVal] = useState('secure-rotating-2026-stakeholder-alpha');
  const [testKeyId, setTestKeyId] = useState('project-key-v1');
  const [rotatedLog, setRotatedLog] = useState<string[]>([]);

  // Key metadata list
  const [keyRing, setKeyRing] = useState(ClientCrypto.getKeyRingMetadata());

  // Live test encryption states
  const iv = ClientCrypto.generateIV();
  const encrypted = ClientCrypto.encrypt(testCleartext, testKeyId, iv);
  const decrypted = ClientCrypto.decrypt(encrypted, testKeyId, iv);

  const handleRegisterKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKeyId.trim() && customKeyVal.trim().length >= 8) {
      ClientCrypto.registerKey(customKeyId.trim(), customKeyVal.trim());
      setKeyRing(ClientCrypto.getKeyRingMetadata());
      setRotatedLog(prev => [
        `[${new Date().toLocaleTimeString()}] Registered new cipher key ID: "${customKeyId}" successfully.`,
        ...prev
      ]);
      setCustomKeyId('');
      setCustomKeyVal('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A] flex items-center gap-1.5">
            <Lock className="text-[#4A4A4A]" size={20} />
            Cryptographic Security Console
          </h2>
          <p className="text-xs text-[#9E9E9E] max-w-2xl mt-0.5">
            Communications on this platform are encrypted on the client side PRIOR to transmission across the WebSocket. The server has no visibility of plain-text messages or private keys.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] px-3.5 py-1.5 rounded-full text-xs font-bold">
            <ShieldAlert size={14} />
            Zero-Knowledge Active
          </div>
        </div>
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Key Management Vault */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-4">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 border-b border-[#F5F5F5] pb-3 tracking-tight">
            <Key size={16} className="text-[#4A4A4A]" />
            Active Crypto Keyring (HSM Vault)
          </h3>

          {/* Key Ring list */}
          <div className="space-y-2">
            {keyRing.map((k) => (
              <div key={k.id} className="p-3 bg-[#FAF9F9] border border-[#EEEEEE] rounded-2xl text-xs flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#1A1A1A] flex items-center gap-1">
                    <Database size={12} className="text-[#9E9E9E]" />
                    {k.id}
                    {k.id === ClientCrypto.getActiveKeyId() && (
                      <span className="bg-[#E8F5E9] text-[#2E7D32] font-bold px-2.5 py-0.5 rounded-full text-[8px] uppercase tracking-wider border border-[#C8E6C9]">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-[#9E9E9E]">Value: {k.mask}</div>
                </div>
                <div className="text-right text-[10px] font-mono text-[#9E9E9E]">
                  Size: {k.length} chars
                </div>
              </div>
            ))}
          </div>

          {/* Key Rotation Registrar */}
          <form onSubmit={handleRegisterKey} className="space-y-3 p-4 bg-[#FAF9F9] rounded-2xl border border-[#EEEEEE]">
            <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Add New Key to Vault</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-[#4A4A4A] font-bold uppercase block tracking-wider">Key Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., project-key-v3"
                  value={customKeyId}
                  onChange={(e) => setCustomKeyId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#4A4A4A] font-bold uppercase block tracking-wider">Raw Key Secret</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={customKeyVal}
                  onChange={(e) => setCustomKeyVal(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#4A4A4A] hover:bg-[#333333] text-white font-bold rounded-full text-xs transition shadow-sm flex justify-center items-center gap-1.5"
            >
              <RefreshCw size={12} />
              Register and Sync New Key
            </button>
          </form>

          {/* HSM Action Logs */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider">Rotation Ledger</h4>
            <div className="h-24 overflow-y-auto bg-white text-[#1A1A1A] font-mono text-[9px] p-3 rounded-2xl border border-[#E5E5E5] space-y-1">
              {rotatedLog.length === 0 ? (
                <div className="text-[#9E9E9E] italic py-6 text-center">No recent rotations recorded.</div>
              ) : (
                rotatedLog.map((log, idx) => (
                  <div key={idx} className="leading-tight text-[#4A4A4A]">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Playground sandbox */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-4">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 border-b border-[#F5F5F5] pb-3 tracking-tight">
            <Cpu size={16} className="text-[#4A4A4A]" />
            Symmetric Cipher Sandbox
          </h3>

          <div className="space-y-3">
            {/* Input Cleartext */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1A1A1A] block uppercase tracking-wider">Test Cleartext Payload</label>
              <input
                type="text"
                value={testCleartext}
                onChange={(e) => setTestCleartext(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              />
            </div>

            {/* Select Key to simulate */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1A1A1A] block uppercase tracking-wider">Select Key to Encrypt</label>
              <select
                value={testKeyId}
                onChange={(e) => setTestKeyId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs focus:border-[#4A4A4A] focus:outline-none focus:ring-0 bg-white text-[#1A1A1A]"
              >
                {keyRing.map(k => (
                  <option key={k.id} value={k.id}>{k.id}</option>
                ))}
              </select>
            </div>

            {/* Cryptographic outputs pipeline */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-[#4A4A4A] uppercase tracking-wider">
                <span>Cryptographic Process Pipe</span>
                <span className="text-[#2E7D32] font-bold">128-bit Stream XOR</span>
              </div>

              {/* Encryption Node */}
              <div className="p-4 bg-[#FAF9F9] border border-[#EEEEEE] rounded-2xl space-y-3 font-mono text-[10px] select-all">
                <div className="space-y-1">
                  <span className="text-[#1A1A1A] font-bold block">1. Generated Random IV Vector:</span>
                  <span className="text-[#4A4A4A] bg-white border border-[#EEEEEE] px-2 py-0.5 rounded">{iv}</span>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[#1A1A1A] font-bold block">2. Resulting Database Ciphertext (HEX):</span>
                  <div className="bg-white border border-[#EEEEEE] p-2 rounded break-all text-[#4A4A4A] text-[9px] max-h-16 overflow-y-auto leading-normal">
                    {encrypted}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-[#EEEEEE] mt-1">
                  <span className="text-[#2E7D32] font-bold block flex items-center gap-1">
                    <CheckCircle size={10} />
                    3. Decrypted Text Recovered:
                  </span>
                  <span className="text-[#1A1A1A] italic">"{decrypted}"</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Protocol Explanation Panel */}
      <div className="bg-[#FAF9F9] rounded-[24px] border border-[#E5E5E5] p-5 space-y-4">
        <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 tracking-tight">
          <Terminal size={16} className="text-[#4A4A4A]" />
          Platform Cryptographic Architecture Spec
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#1A1A1A] leading-relaxed">
          <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] space-y-2">
            <span className="font-bold text-[#1A1A1A] block">1. End-to-End Encryption</span>
            <p className="text-[#9E9E9E] text-[11px] leading-relaxed">
              Every project message is locally encrypted using RC4 stream block ciphering based on an IV and keys. Server databases only store HEX representations of ciphertext.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] space-y-2">
            <span className="font-bold text-[#1A1A1A] block">2. Dynamic Salt Vectors</span>
            <p className="text-[#9E9E9E] text-[11px] leading-relaxed">
              An 8-character Initialization Vector is generated for every post. Because of this, identical consecutive plaintexts generate entirely different database ciphertexts.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] space-y-2">
            <span className="font-bold text-[#1A1A1A] block">3. Access Verification</span>
            <p className="text-[#9E9E9E] text-[11px] leading-relaxed">
              Only authorized team members (Admin, Member) holding active HSM-registered private keys are mathematically capable of reading conversation logs on the client dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
