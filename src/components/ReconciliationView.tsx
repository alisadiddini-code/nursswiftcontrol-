/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  MessageSquare, 
  FileText, 
  CreditCard, 
  Database,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { TransactionOrder } from '../types';

interface ReconciliationViewProps {
  order: TransactionOrder | null;
  onClose: () => void;
}

export default function ReconciliationView({ order, onClose }: ReconciliationViewProps) {
  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-30 uppercase font-bold tracking-[0.4em] p-10 text-center">
        <ArrowLeft size={48} className="mb-4" />
        Select an active operative vector from the operations terminal to initiate 4-column reconciliation
      </div>
    );
  }

  const comparisonRows = [
    { label: 'Buyer / Payer Entity', key: 'buyer', vals: ['LLC KORVONSAROI CHIN', 'LLC KORVONSAROI CHIN', 'LLC KORVONSAROI CHIN', 'LLC KORVONSAROI CHIN'], status: 'match' },
    { label: 'Beneficiary Name', key: 'beneficiary', vals: ['JABS INTERNATIONAL', 'JABS INTERNATIONAL PVT. LTD', 'JABS INTERNATIONAL PVT. LTD', 'JABS INTERNATIONAL PVT. LTD'], status: 'warning' },
    { label: 'Settlement Amount', key: 'amount', vals: ['125,000.00', '125,000.00', '125,000.00', '125,000.00'], status: 'match' },
    { label: 'Asset Currency', key: 'currency', vals: ['USD', 'USD', 'USD', 'USD'], status: 'match' },
    { label: 'Account Vector', key: 'account', vals: ['8823...88', '8823...88', '8823...88', '8823...88'], status: 'match' },
    { label: 'SWIFT / BIC Node', key: 'bic', vals: ['JABINBB77XXX', 'JABINBB77XXX', 'JABINBB77XXX', 'JABINBB77XXX'], status: 'match' },
    { label: 'Contract Relational ID', key: 'contract', vals: ['CONT/2024/0045', 'CONT/2024/0045', 'CONT/2024/0045', 'CONT/2024/0045'], status: 'match' },
    { label: 'HS Code Mapping', key: 'hs', vals: ['--', '0910.11', '--', '--'], status: 'missing' },
    { label: 'Payment Intent / F70', key: 'f70', vals: ['INV 882', 'REF INV 882', 'PAYMENT INV 882', 'INV 882'], status: 'partial' },
  ];

  const columns = [
    { icon: MessageSquare, label: 'WhatsApp Order', color: 'text-green-500' },
    { icon: FileText, label: 'Contract Data', color: 'text-blue-500' },
    { icon: CreditCard, label: 'Bank Instruction', color: 'text-yellow-500' },
    { icon: Database, label: 'SWIFT MT103', color: 'text-purple-500' },
  ];

  return (
    <div className="h-full flex flex-col p-4 bg-surface-base overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-1 px-2 hover:bg-white/5 rounded border border-border-subtle transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={14} className="text-text-dim" />
            <span className="text-[10px] font-bold text-text-dim uppercase">Return to Hub</span>
          </button>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Order #{order.id.split('-').pop()} Analysis Matrix</h2>
            <p className="text-[10px] text-text-muted font-mono mt-0.5 uppercase italic">4-Column Vector Alignment Mapping // System Node T1</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-500/50 font-bold uppercase tracking-widest">Action Required</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {/* 4-Column Reconciliation Map */}
        <div className="grid grid-cols-4 gap-2">
          {columns.map((col, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <col.icon size={12} className={col.color} />
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{col.label}</span>
              </div>
              <div className="space-y-1">
                 {comparisonRows.map((row, j) => {
                    const val = row.vals[i];
                    const isMatch = row.status === 'match';
                    const isWarning = row.status === 'warning';
                    const isMissing = val === '--';

                    return (
                      <div 
                        key={j} 
                        className={`p-2 bg-surface-panel border text-[10px] font-mono rounded truncate transition-colors hover:border-accent-blue/30 ${
                          isMatch ? 'border-green-500/30 text-green-400' :
                          isWarning ? 'border-yellow-500/30 text-yellow-400 italic' :
                          isMissing ? 'border-border-subtle text-text-dim/40' :
                          'border-red-500/30 text-red-400 font-bold'
                        }`}
                        title={`${row.label}: ${val}`}
                      >
                        {val}
                      </div>
                    );
                 })}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Discrepancy Terminal */}
          <div className="bg-red-950/10 border border-red-900/40 p-3 rounded shadow-sm">
            <div className="flex items-center space-x-2 text-red-400 font-bold text-[10px] mb-3 uppercase italic tracking-widest">
              <AlertTriangle size={14} />
              <span>Validation Discrepancies ({comparisonRows.filter(r => r.status !== 'match').length})</span>
            </div>
            <ul className="space-y-1.5 text-[10px] font-mono">
              <li className="flex justify-between items-center gap-4 text-red-400/80">
                <span>[ERR_01] AMOUNT MISMATCH: Payment (4.8k) vs Contract (48k)</span>
                <span className="bg-red-900 text-red-200 px-1 rounded">MISSING_0</span>
              </li>
              <li className="flex justify-between items-center gap-4 text-yellow-400/80">
                <span>[W_09] SWIFT DATA PENDING: Block 32A incomplete</span>
                <span className="bg-yellow-900 text-yellow-200 px-1 rounded">WARNING</span>
              </li>
              <li className="flex justify-between items-center gap-4 text-text-dim/60">
                <span>[INFO] HS CODE MAPPING: Standard deviation verified</span>
                <span className="bg-surface-card text-text-muted px-1 rounded">NOMINAL</span>
              </li>
            </ul>
          </div>

          {/* Quick Tasks / Uploads */}
          <div className="grid grid-cols-2 gap-2">
            <button className="border border-dashed border-border-subtle p-4 text-center rounded hover:bg-border-subtle transition-all flex flex-col items-center justify-center group">
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1 group-hover:text-accent-blue transition-colors">UPLOAD SWIFT</span>
              <span className="text-[11px] font-bold text-text-muted">PDF / SCREENSHOT</span>
            </button>
            <button className="border border-dashed border-border-subtle p-4 text-center rounded hover:bg-border-subtle transition-all flex flex-col items-center justify-center group">
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1 group-hover:text-accent-blue transition-colors">UPLOAD PI</span>
              <span className="text-[11px] font-bold text-text-muted">BANK DOC</span>
            </button>
          </div>
        </div>

        {/* Source Data Logs */}
        <div className="space-y-3">
          <div className="flex items-center text-[10px] uppercase font-bold text-text-dim tracking-[0.2em]">
            <div className="flex-1 h-[1px] bg-border-subtle"></div>
            <span className="px-3">Source Vector Logs</span>
            <div className="flex-1 h-[1px] bg-border-subtle"></div>
          </div>
          <div className="bg-surface-panel p-3 rounded border border-border-subtle text-[11px] font-mono text-text-muted leading-relaxed">
            <div className="text-accent-blue mb-1 font-bold italic uppercase tracking-tighter">[INTAKE_NODE_882] WhatsApp Message Sync:</div>
            "Pay to Jabs International Pvt Ltd from Aktiv Bank for LLC Rushdi Hisor, amount 125,000 USD, urgent priority treatment requested."
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-surface-card border-t border-border-subtle grid grid-cols-3 gap-2 mt-4 shadow-2xl">
        <button className="bg-surface-panel hover:bg-border-subtle border border-border-subtle text-white font-bold py-2.5 rounded text-[10px] uppercase tracking-[0.2em] transition-all">Assign Entity</button>
        <button className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 font-bold py-2.5 rounded text-[10px] uppercase tracking-[0.2em] transition-all">Flag Conflict</button>
        <button className="bg-accent-blue hover:brightness-110 text-surface-panel font-bold py-2.5 rounded text-[10px] uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all">Force Validate</button>
      </div>
    </div>
  );
}
