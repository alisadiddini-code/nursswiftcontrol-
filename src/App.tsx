/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Table2, 
  Search, 
  Download,
  Upload,
  MessageSquare,
  ShieldAlert,
  ArrowRightLeft,
  ScanText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabaseClient';

// Components
import DashboardView from './components/DashboardView';
import OrdersTable from './components/OrdersTable';
import ImportTerminal from './components/ImportTerminal';
import SwiftChecker from './components/SwiftChecker';
import ReconciliationView from './components/ReconciliationView';
import AlertCenter from './components/AlertCenter';
import SidePanel from './components/SidePanel';

type ViewType =
  | 'dashboard'
  | 'orders'
  | 'import'
  | 'checker'
  | 'reconciliation'
  | 'alerts';

type HeaderStats = {
  total: number;
  matched: number;
  warnings: number;
  errors: number;
  usd: number;
  cny: number;
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [stats, setStats] = useState<HeaderStats>({
    total: 0,
    matched: 0,
    warnings: 0,
    errors: 0,
    usd: 0,
    cny: 0,
  });

  const fetchStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', today.toISOString());

    if (error) {
      console.error('Header stats load error:', error);
      return;
    }

    const rows = data || [];

    let matched = 0;
    let warnings = 0;
    let errors = 0;
    let usd = 0;
    let cny = 0;

    rows.forEach((order: any) => {
      if (order.status === 'matched') matched += 1;
      if (order.status === 'warning') warnings += 1;
      if (order.status === 'error') errors += 1;

      if (order.currency === 'USD') usd += Number(order.amount || 0);
      if (order.currency === 'CNY') cny += Number(order.amount || 0);
    });

    setStats({
      total: rows.length,
      matched,
      warnings,
      errors,
      usd,
      cny,
    });
  }, []);

  useEffect(() => {
    fetchStats();

    const refreshStatsHandler = () => {
      fetchStats();
    };

    window.addEventListener('orders-refresh', refreshStatsHandler);

    return () => {
      window.removeEventListener('orders-refresh', refreshStatsHandler);
    };
  }, [fetchStats]);

  useEffect(() => {
    const goToOrdersHandler = () => {
      setActiveView('orders');
      setIsPanelOpen(false);
      fetchStats();
    };

    window.addEventListener('go-to-orders', goToOrdersHandler);

    return () => {
      window.removeEventListener('go-to-orders', goToOrdersHandler);
    };
  }, [fetchStats]);

  const handleRowClick = (order: any) => {
    setSelectedOrder(order);
    setIsPanelOpen(true);
  };

  const reconciliationRate =
    stats.total > 0 ? ((stats.matched / stats.total) * 100).toFixed(1) : '0.0';

  const menuItems = [
    { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
    { id: 'orders', label: 'Operations', icon: Table2 },
    { id: 'import', label: 'Ingestion', icon: MessageSquare },
    { id: 'checker', label: 'SWIFT Parser', icon: ScanText },
    { id: 'reconciliation', label: 'Reconcile', icon: ArrowRightLeft },
    { id: 'alerts', label: 'Compliance', icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col h-screen bg-surface-base text-text-base font-sans overflow-hidden select-none">
      {/* Top Navigation - Terminal Style */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-border-subtle bg-surface-panel shrink-0">
        <div className="flex items-center space-x-6">
          <div className="text-xs font-bold tracking-widest text-accent-blue uppercase">
            NUR SWIFTCONTROL <span className="text-text-dim">v4.0.2</span>
          </div>

          <nav className="flex space-x-4 text-[11px] font-semibold uppercase tracking-tight text-text-muted">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`pb-1 transition-all ${
                  activeView === item.id 
                    ? 'text-white border-b-2 border-accent-blue' 
                    : 'hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-text-dim font-bold uppercase">
              RECONCILIATION RATE:
            </span>
            <span className="text-xs font-mono text-green-400">
              {reconciliationRate}%
            </span>
          </div>

          <div className="h-6 w-[1px] bg-border-subtle"></div>

          <div className="text-[10px] text-text-muted font-mono uppercase">
            SESSION: {new Date().toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC
          </div>
        </div>
      </header>

      {/* Sub-Header: Global Stats Grid */}
      <div className="grid grid-cols-4 lg:grid-cols-8 border-b border-border-subtle bg-surface-base shrink-0">
        <div className="p-2 border-r border-border-subtle">
          <div className="text-[10px] text-text-dim uppercase font-bold">
            Today Orders
          </div>
          <div className="text-lg font-mono text-white leading-none mt-1 uppercase tracking-tighter">
            {stats.total}
          </div>
        </div>

        <div className="p-2 border-r border-border-subtle">
          <div className="text-[10px] text-text-dim uppercase font-bold">
            Matched
          </div>
          <div className="text-lg font-mono text-green-400 leading-none mt-1 tracking-tighter">
            {stats.matched}
          </div>
        </div>

        <div className="p-2 border-r border-border-subtle">
          <div className="text-[10px] text-text-dim uppercase font-bold">
            Warnings
          </div>
          <div className="text-lg font-mono text-yellow-400 leading-none mt-1 tracking-tighter">
            {stats.warnings}
          </div>
        </div>

        <div className="p-2 border-r border-border-subtle">
          <div className="text-[10px] text-red-400 uppercase font-bold">
            Critical Errors
          </div>
          <div className="text-lg font-mono text-red-500 leading-none mt-1 tracking-tighter animate-pulse">
            {stats.errors.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="p-2 border-r border-border-subtle col-span-2">
          <div className="text-[10px] text-text-dim uppercase font-bold">
            Total Volume (USD)
          </div>
          <div className="text-lg font-mono text-white leading-none mt-1 tracking-tighter">
            $ {stats.usd.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="p-2 lg:col-span-2">
          <div className="text-[10px] text-text-dim uppercase font-bold">
            Total Volume (CNY)
          </div>
          <div className="text-lg font-mono text-white leading-none mt-1 tracking-tighter">
            ¥ {stats.cny.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-16 border-r border-border-subtle bg-surface-panel flex flex-col shrink-0">
          <div className="flex-1 py-4 flex flex-col items-center space-y-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as ViewType)}
                  className={`p-2 rounded transition-all group relative ${
                    isActive 
                      ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' 
                      : 'text-text-dim hover:text-white hover:bg-white/5'
                  }`}
                  title={item.label}
                >
                  <Icon size={20} />

                  {isActive && (
                    <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-1 h-4 bg-accent-blue rounded-r" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-border-subtle flex flex-col items-center gap-4">
            <button className="p-2 text-text-dim hover:text-white">
              <Upload size={18} />
            </button>

            <button className="p-2 text-text-dim hover:text-white">
              <Download size={18} />
            </button>
          </div>
        </aside>

        {/* View Router */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface-base">
          {/* Internal View Header / Search */}
          <div className="flex items-center space-x-2 p-2 border-b border-border-subtle bg-surface-card">
            <div className="relative flex-1 max-w-xl">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim"
                size={12}
              />

              <input
                type="text"
                placeholder="PROXIMITY SEARCH: BENEFICIARY / SWIFT / BIC / CONTRACT..."
                className="w-full bg-surface-panel border border-border-subtle text-[11px] py-1.5 pl-8 pr-4 rounded outline-none focus:border-accent-blue text-white font-mono uppercase placeholder:text-text-dim"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex space-x-1">
              <button className="px-3 py-1.5 bg-accent-blue text-surface-panel text-[10px] font-bold rounded uppercase tracking-tighter">
                Execute Query
              </button>

              <button className="px-3 py-1.5 bg-border-subtle text-white text-[10px] font-bold rounded uppercase tracking-tighter">
                Export Grid
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="h-full"
              >
                {activeView === 'dashboard' && <DashboardView />}

                {activeView === 'orders' && (
                  <OrdersTable onRowClick={handleRowClick} />
                )}

                {activeView === 'import' && (
                  <ImportTerminal
                    onSuccess={() => {
                      setActiveView('orders');
                      setIsPanelOpen(false);
                      fetchStats();
                      window.dispatchEvent(new Event('orders-refresh'));
                    }}
                  />
                )}

                {activeView === 'checker' && <SwiftChecker />}

                {activeView === 'reconciliation' && (
                  <ReconciliationView 
                    order={selectedOrder} 
                    onClose={() => setActiveView('orders')}
                  />
                )}

                {activeView === 'alerts' && <AlertCenter />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Extreme Right Side Panel for Details */}
        <AnimatePresence>
          {isPanelOpen && selectedOrder && (
            <SidePanel 
              order={selectedOrder} 
              onClose={() => setIsPanelOpen(false)}
              onReconcile={() => {
                setIsPanelOpen(false);
                setActiveView('reconciliation');
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 bg-surface-panel border-t border-border-subtle flex items-center px-4 justify-between text-[9px] uppercase font-bold tracking-widest shrink-0">
        <div className="flex space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="text-green-500">Node Sync: Nominal</span>
          </div>

          <div className="text-text-dim">Active Workers: 04</div>
          <div className="text-text-dim">Recon Queue: 00</div>
        </div>

        <div className="text-accent-blue font-mono">
          Terminal: NUR-T1-DUSHANBE | User: ADMIN_ROOT
        </div>
      </footer>
    </div>
  );
}