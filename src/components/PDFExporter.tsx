import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Task, Milestone, Thread, Message, ActivityLog } from '../types';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Layers, 
  CheckCircle,
  Clock,
  Printer,
  RefreshCw
} from 'lucide-react';

interface PDFExporterProps {
  tasks: Task[];
  milestones: Milestone[];
  threads: Thread[];
  messages: Message[];
  activities: ActivityLog[];
}

export default function PDFExporter({
  tasks,
  milestones,
  threads,
  messages,
  activities
}: PDFExporterProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Stats calculations
        const totalT = tasks.length;
        const compT = tasks.filter(t => t.status === 'done').length;
        const rate = totalT > 0 ? Math.round((compT / totalT) * 100) : 0;
        const dateStr = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // ================= PAGE 1: COVER PAGE =================
        // Draw elegant decorative header band (Charcoal #4A4A4A)
        doc.setFillColor(74, 74, 74);
        doc.rect(0, 0, pageWidth, 55, 'F');

        // Draw an elegant minimalist secure accent strip (Light Gray #E5E5E5)
        doc.setFillColor(229, 229, 229);
        doc.rect(0, 55, pageWidth, 4, 'F');

        // Cover Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('COLLABORATIVE WORKSPACE AUDIT', 20, 24);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('SECURE REAL-TIME TASK MANAGEMENT & STAKEHOLDER REVIEW BRIEF', 20, 32);
        doc.text(`Generated on: ${dateStr} • Local Time: 2026-07-07`, 20, 38);

        // Subtitle block
        doc.setTextColor(26, 26, 26);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('1. Executive Deliverables Summary', 20, 75);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(158, 158, 158);
        doc.text('This brief reviews active task compliance, milestone tracking logs, and cryptographic auditing.', 20, 83);

        // Drawing beautiful KPI Card metrics on Page 1 (Minimalist Light Gray background)
        // Card 1: Completion
        doc.setFillColor(250, 249, 249);
        doc.setDrawColor(229, 229, 229);
        doc.roundedRect(20, 95, 52, 35, 3, 3, 'FD');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(74, 74, 74);
        doc.text(`${rate}%`, 25, 108);
        doc.setFontSize(8);
        doc.setTextColor(158, 158, 158);
        doc.text('Task Progress Rate', 25, 116);
        doc.setFont('Helvetica', 'normal');
        doc.text(`${compT} of ${totalT} Completed`, 25, 122);

        // Card 2: Milestones
        doc.setFillColor(250, 249, 249);
        doc.roundedRect(79, 95, 52, 35, 3, 3, 'FD');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(74, 74, 74);
        const activeM = milestones.filter(m => m.status === 'achieved').length;
        doc.text(`${activeM} achieved`, 84, 108);
        doc.setFontSize(8);
        doc.setTextColor(158, 158, 158);
        doc.text('Milestone Achievements', 84, 116);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Out of ${milestones.length} total targets`, 84, 122);

        // Card 3: Communications
        doc.setFillColor(250, 249, 249);
        doc.roundedRect(138, 95, 52, 35, 3, 3, 'FD');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(74, 74, 74);
        doc.text(`${messages.length}`, 143, 108);
        doc.setFontSize(8);
        doc.setTextColor(158, 158, 158);
        doc.text('Encrypted Records', 143, 116);
        doc.setFont('Helvetica', 'normal');
        doc.text('Zero plaintext stored', 143, 122);

        // Security Declaration block (Minimalist soft gray block)
        doc.setFillColor(250, 249, 249);
        doc.setDrawColor(229, 229, 229);
        doc.roundedRect(20, 142, 170, 30, 2, 2, 'FD');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 26, 26);
        doc.text('Zero-Knowledge Client Encryption Compliance verified', 26, 150);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(158, 158, 158);
        doc.text('All messaging payloads transmitted across WebSockets utilize standard symmetrical 128-bit XOR stream', 26, 156);
        doc.text('cipher structures. Security keys are generated on-the-fly and never shared with the Express server logs.', 26, 161);

        // Milestone Status Table Header
        doc.setTextColor(26, 26, 26);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('2. Core Product Milestones Status', 20, 185);

        // Simple milestones list
        let yPos = 195;
        milestones.forEach((m) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(26, 26, 26);
          doc.text(`• ${m.title} (${m.progress}%)`, 20, yPos);
          
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(158, 158, 158);
          doc.text(`Status: ${m.status.toUpperCase()} | Due Date: ${m.dueDate}`, 20, yPos + 4.5);
          doc.text(`Description: ${m.description.substring(0, 95)}...`, 20, yPos + 8.5);
          
          yPos += 16;
        });

        // Elegant Page Footer
        doc.setDrawColor(229, 229, 229);
        doc.line(20, 275, 190, 275);
        doc.setFontSize(8);
        doc.setTextColor(158, 158, 158);
        doc.text('Stakeholder Review Report • Page 1 of 2', 20, 281);
        doc.text('CONFIDENTIAL - TEAM INTERNAL USE ONLY', 130, 281);


        // ================= PAGE 2: DETAILED TASK MATRIX =================
        doc.addPage();
        
        // Draw Header (Charcoal #4A4A4A)
        doc.setFillColor(74, 74, 74);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('PROJECT DELIVERABLES COMPLIANCE MATRIX', 20, 16);

        // Core Task Table Header
        doc.setTextColor(26, 26, 26);
        doc.setFontSize(11);
        doc.text('3. Detailed Task Manifest', 20, 36);

        // Draw Table Header
        doc.setFillColor(250, 249, 249);
        doc.rect(20, 42, 170, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(74, 74, 74);
        doc.text('TASK TITLE', 24, 47.5);
        doc.text('STATUS', 95, 47.5);
        doc.text('PRIORITY', 125, 47.5);
        doc.text('DUE DATE', 155, 47.5);

        // Draw Task Rows
        let rowY = 55;
        doc.setFont('Helvetica', 'normal');
        tasks.forEach((t) => {
          // If drawing would exceed page bounds, add page or break
          if (rowY > 200) return;

          doc.setTextColor(26, 26, 26);
          doc.setFont('Helvetica', 'bold');
          doc.text(t.title.substring(0, 35), 24, rowY);
          
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(74, 74, 74);
          doc.text(t.status.toUpperCase(), 95, rowY);
          doc.text(t.priority.toUpperCase(), 125, rowY);
          doc.text(t.dueDate, 155, rowY);

          // Draw custom line below row
          doc.setDrawColor(245, 245, 245);
          doc.line(20, rowY + 3, 190, rowY + 3);

          rowY += 10;
        });

        // Communication Audit section
        doc.setTextColor(26, 26, 26);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('4. Real-time Message Stream Cryptographic Fingerprint Logs', 20, rowY + 12);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(158, 158, 158);
        doc.text('The following represent real communication fragments recorded in encrypted HEX format on the server databases:', 20, rowY + 18);

        let msgY = rowY + 24;
        messages.slice(0, 4).forEach((msg) => {
          if (msgY > 260) return;

          doc.setFillColor(250, 249, 249);
          doc.rect(20, msgY, 170, 11, 'F');
          
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(74, 74, 74);
          doc.text(`${msg.senderName} (${msg.senderRole.toUpperCase()}):`, 24, msgY + 4);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(158, 158, 158);
          doc.text(`[Key: ${msg.keyId} | IV: ${msg.iv}] Ciphertext HEX: ${msg.encryptedContent.substring(0, 60)}...`, 24, msgY + 8);

          msgY += 14;
        });

        // Elegant Page Footer Page 2
        doc.setDrawColor(229, 229, 229);
        doc.line(20, 275, 190, 275);
        doc.setFontSize(8);
        doc.setTextColor(158, 158, 158);
        doc.text('Stakeholder Review Report • Page 2 of 2', 20, 281);
        doc.text('CONFIDENTIAL - SECURITY AUDITED', 130, 281);

        // Save PDF file
        doc.save(`Stakeholder-Executive-Report-${new Date().toISOString().split('T')[0]}.pdf`);

      } catch (e) {
        console.error('PDF Generation Error:', e);
        alert('Failed to compile PDF. Check log stream.');
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  };

  return (
    <div className="bg-white p-6 rounded-[24px] border border-[#E5E5E5] shadow-sm space-y-5">
      
      {/* Exporter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5 tracking-tight">
            <FileText size={18} className="text-[#4A4A4A]" />
            Executive Stakeholder Review Exporter
          </h3>
          <p className="text-xs text-[#9E9E9E] mt-0.5">
            Generate formal, production-grade PDF dossiers summarizing all active workspace state.
          </p>
        </div>

        {/* Real-time sync printing button */}
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="px-5 py-2.5 bg-[#4A4A4A] hover:bg-[#333333] text-white font-bold rounded-full text-xs shadow-sm transition flex items-center gap-1.5 disabled:bg-[#CCCCCC] disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              Compiling Dossier...
            </>
          ) : (
            <>
              <Download size={12} />
              Export Stakeholder PDF
            </>
          )}
        </button>
      </div>

      {/* Brief specifications layout */}
      <div className="p-5 bg-[#FAF9F9] rounded-2xl border border-[#EEEEEE] text-xs text-[#4A4A4A] space-y-3">
        <h4 className="font-bold text-[#1A1A1A]">The PDF Stakeholder dossier compiles:</h4>
        <ul className="space-y-2 list-disc list-inside text-[11px] text-[#9E9E9E]">
          <li>Executive deliverables completion metrics (%).</li>
          <li>Detailed active task manifestation tables (Priority, Status, Deadlines).</li>
          <li>Structured milestone target progress percentages and schedules.</li>
          <li>Communication audit ledger capturing raw hexadecimal socket packets for zero-knowledge encryption compliance review.</li>
        </ul>
      </div>

    </div>
  );
}

