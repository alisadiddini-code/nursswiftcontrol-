/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ScanText, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck,
  Cpu,
  Clipboard,
  Zap,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SwiftChecker() {
  const [swiftText, setSwiftText] = useState('');
  const [analysis, setAnalysis] = useState<any | null>(null);

  const analyzeSwift = () => {
    if (!swiftText.trim()) return;
    
    // Simulated parsing of MT103 fields
    setAnalysis({
      senderRef: 'SND-4455-992',
      bankOpCode: 'CRED',
      date: '2024-04-24',
      currency: 'USD',
      amount: '125,000.00',
      orderingCustomer: 'LLC KORVONSAROI CHIN',
      orderingInst: 'AKTIV BANK',
      beneficiaryBank: 'HDFC BANK LTD',
      beneficiaryCustomer: 'JABS INTERNATIONAL PVT. LTD',
      remittanceInfo: 'PAYMENT FOR SPICES AS PER CONT/2024/0045 INV 882',
      charges: 'SHA',
      validations: [
        { label: 'Field 32A Format', status: 'PASS', icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Beneficiary Name Alignment', status: 'MATCHED', icon: CheckCircle2, color: 'text-green-500' },
        { label: 'BIC Checksum Validation', status: 'VERIFIED', icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Sanction Screening (AML)', status: 'LOW_RISK', icon: ShieldCheck, color: 'text-blue-500' },
      ]
    });
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <Cpu size={14} className="text-accent-blue" />
            SWIFT MT103 Neural Checker
          </h2>
          <p className="text-[10px] text-text-dim font-mono mt-1 uppercase italic">High-precision parsing of financial message blocks (V2.4)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Input Terminal */}
        <div className="flex flex-col space-y-4">
          <div className="flex-1 bg-surface-panel border border-border-subtle rounded overflow-hidden flex flex-col shadow-inner">
            <div className="px-4 py-2 bg-surface-card border-b border-border-subtle flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-text-dim">Raw Message Payload</span>
              <button 
                onClick={() => setSwiftText('')}
                className="text-[9px] font-bold text-text-dim hover:text-white uppercase transition-colors"
              >
                Clear Buffer
              </button>
            </div>
            <textarea
              value={swiftText}
              onChange={(e) => setSwiftText(e.target.value)}
              className="flex-1 bg-transparent p-4 text-[10px] font-mono leading-relaxed placeholder:text-text-dim/30 focus:outline-none text-accent-blue"
              placeholder=":20:SENDER REFERENCE\n:23B:BANK OPERATION CODE\n:32A:DATE/CURR/AMOUNT\n:50K:ORDERING CUSTOMER..."
            />
          </div>
          <button 
            onClick={analyzeSwift}
            disabled={!swiftText}
            className="h-12 bg-accent-blue hover:brightness-110 disabled:bg-surface-panel disabled:text-text-dim/40 transition-all rounded shadow-lg shadow-accent-blue/10 flex items-center justify-center gap-3 overflow-hidden group text-surface-panel"
          >
            <Zap size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">INITIATE MT103 ANALYSIS</span>
          </button>
        </div>

        {/* Analysis Output */}
        <div className="flex flex-col min-h-0 bg-surface-panel rounded border border-border-subtle overflow-hidden">
          {analysis ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              <div className="px-5 py-3 border-b border-border-subtle bg-surface-card flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-accent-blue font-mono tracking-widest">ANALYSIS_REPORT // {analysis.senderRef}</span>
                <div className="flex gap-1">
                   <div className="px-2 py-0.5 bg-green-900/10 text-green-400 border border-green-500/30 text-[9px] font-bold rounded flex items-center gap-1 leading-none h-5">
                     <CheckCircle2 size={10} /> VALIDATED
                   </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-6 font-mono">
                {/* Core Field Mapping */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { tag: ':20', label: 'Sender Reference', val: analysis.senderRef },
                    { tag: ':32A', label: 'Amount & Currency', val: `${analysis.currency} ${analysis.amount}`, highlight: true },
                    { tag: ':50K', label: 'Ordering Customer', val: analysis.orderingCustomer },
                    { tag: ':59', label: 'Beneficiary Customer', val: analysis.beneficiaryCustomer },
                    { tag: ':57A', label: 'Beneficiary Bank', val: analysis.beneficiaryBank },
                    { tag: ':70', label: 'Remittance Info', val: analysis.remittanceInfo, full: true },
                  ].map((field, i) => (
                    <div key={i} className={`p-3 bg-surface-base border border-border-subtle rounded group hover:border-accent-blue/30 transition-colors ${field.full ? 'col-span-2' : ''}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-mono font-bold text-text-dim bg-surface-panel px-1 rounded">{field.tag}</span>
                        <span className="text-[9px] font-bold uppercase text-text-dim tracking-wider">{field.label}</span>
                      </div>
                      <p className={`text-[11px] font-bold uppercase truncate ${field.highlight ? 'text-accent-blue' : 'text-text-base'}`}>
                        {field.val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Validation Checklist */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldCheck size={12} className="text-text-dim/60" />
                    Neural Verification Matrix
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {analysis.validations.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-surface-base border border-border-subtle group hover:bg-surface-card transition-colors">
                        <span className="text-[10px] font-bold uppercase text-text-muted">{v.label}</span>
                        <div className={`flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-tighter ${v.color}`}>
                          <v.icon size={12} />
                          {v.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 flex gap-3 pb-4">
                   <button className="flex-1 py-2.5 bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-500/30 rounded text-[9px] font-bold uppercase tracking-widest transition-all">
                     LINK TO ORDER
                   </button>
                   <button className="flex-1 py-2.5 bg-surface-base hover:bg-surface-card border border-border-subtle rounded text-[9px] font-bold uppercase tracking-widest transition-all text-text-dim hover:text-white">
                     EXPORT ANALYSIS
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-dim/20">
              <Clipboard size={64} className="mb-4 stroke-[0.5]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-center max-w-[200px]">
                Awaiting payload ingestion for vector processing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
