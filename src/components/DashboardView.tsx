import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Activity,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function DashboardView() {

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
  }

  // ================= CALCULATIONS =================

  const todayOrders = orders.length;

  const totalUSD = orders
    .filter(o => o.currency === "USD")
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const pending = orders.filter(o => o.status !== "matched").length;

  const highRisk = orders.filter(o => o.risk_level === "critical").length;

  const stats = [
    { label: 'Today Total', value: `${todayOrders}`, sub: 'ORDERS', icon: Activity, color: 'text-blue-400' },
    { label: 'Total Volume (USD)', value: `$${(totalUSD/1000000).toFixed(1)}M`, sub: 'SYNCED', icon: DollarSign, color: 'text-green-400' },
    { label: 'Pending Recon', value: `${pending}`, sub: 'ACTIONS', icon: Clock, color: 'text-yellow-400' },
    { label: 'High Risk Flag', value: `${highRisk}`, sub: 'ALERTS', icon: AlertCircle, color: 'text-red-400' },
  ];

  return (
    <div className="p-4 space-y-4">

      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface-card border border-border-subtle rounded p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{stat.label}</span>
              <stat.icon size={14} className={stat.color} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-bold text-white">{stat.value}</span>
              <span className="text-[10px] text-text-muted uppercase">{stat.sub}</span>
            </div>

            <div className="mt-4 h-1 w-full bg-surface-base rounded-full overflow-hidden">
              <div className={`h-full ${stat.color.replace('text','bg')} opacity-50`} style={{ width: '65%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LIVE FEED */}
        <div className="lg:col-span-2 bg-surface-panel border border-border-subtle rounded overflow-hidden">
          <div className="p-3 border-b border-border-subtle flex justify-between">
            <h3 className="text-[10px] font-bold uppercase flex gap-2">
              <TrendingUp size={12} className="text-accent-blue" />
              Live Vector Feed
            </h3>
          </div>

          <div className="divide-y divide-border-subtle max-h-[400px] overflow-auto">
            {orders.slice(0, 10).map((order, i) => (
              <div key={i} className="p-3 flex justify-between hover:bg-white/5">

                <div>
                  <p className="text-[11px] font-bold text-white">
                    {order.beneficiary_name}
                  </p>
                  <p className="text-[9px] text-text-dim">
                    {order.order_no} // {order.bank_name} // SCORE: {order.match_score || 0}%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-bold">
                    {order.currency} {order.amount?.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-text-dim">{order.status}</p>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* NODE DISTRIBUTION */}
        <div className="bg-surface-panel border border-border-subtle rounded p-4">
          <h3 className="text-[10px] font-bold uppercase mb-4 flex gap-2">
            <BarChart3 size={12} className="text-purple-400" />
            Node Distribution
          </h3>

          {[
            { label: 'WhatsApp', field: 'whatsapp_received' },
            { label: 'Contract', field: 'contract_uploaded' },
            { label: 'Bank Instr', field: 'bank_instruction_uploaded' },
            { label: 'SWIFT', field: 'swift_uploaded' },
          ].map((item, i) => {
            const count = orders.filter(o => o[item.field]).length;

            return (
              <div key={i} className="mb-3">
                <div className="flex justify-between text-[10px]">
                  <span>{item.label}</span>
                  <span>{count}</span>
                </div>
                <div className="h-1 bg-gray-800 mt-1">
                  <div className="h-1 bg-blue-400" style={{ width: `${(count / (orders.length || 1)) * 100}%` }} />
                </div>
              </div>
            );
          })}

          <div className="mt-6 text-[10px] text-green-400">
            System Live ✅
          </div>
        </div>

      </div>
    </div>
  );
}