import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  X,
  ExternalLink,
  Filter,
  Flag,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();

    const handler = () => loadAlerts();
    window.addEventListener("orders-refresh", handler);

    return () => {
      window.removeEventListener("orders-refresh", handler);
    };
  }, []);

  async function loadAlerts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["error", "warning"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((o: any) => ({
      id: o.id,
      type:
        o.risk_level === "critical"
          ? "CRITICAL"
          : o.risk_level === "high"
          ? "WARNING"
          : "INFO",
      title:
        o.status === "error"
          ? "Validation Failure"
          : "Mismatch Detected",
      desc: `Beneficiary: ${o.beneficiary_name} | Possible mismatch in SWIFT / Account / Amount`,
      order: o.order_no,
      score: o.match_score ?? 0,
      time: new Date(o.created_at).toLocaleTimeString(),
    }));

    setAlerts(mapped);
    setLoading(false);
  }

  function getColor(type: string) {
    if (type === "CRITICAL") return "border-red-500/30 bg-red-500/[0.02]";
    if (type === "WARNING") return "border-yellow-500/30 bg-yellow-500/[0.02]";
    return "border-white/5";
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-500" />
          Real Alert Engine
        </h2>
      </div>

      <div className="space-y-3 overflow-auto pr-2">
        {loading ? (
          <div className="text-gray-400 text-sm">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-green-400 text-sm">
            ✅ No risks detected
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg ${getColor(alert.type)}`}
            >
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-bold uppercase">
                    {alert.title}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500">
                  {alert.time}
                </span>
              </div>

              <p className="text-[11px] text-gray-400 mb-3">
                {alert.desc}
              </p>

              <div className="flex justify-between text-xs">
                <span className="text-blue-400">{alert.order}</span>

                <span
                  className={
                    alert.score > 80
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {alert.score}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}