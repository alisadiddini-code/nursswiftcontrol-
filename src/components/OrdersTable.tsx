import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

type Order = {
  id: string;
  order_no: string | null;
  beneficiary_name: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  risk_level: string | null;
  match_score: number | null;
  account_number: string | null;
  swift_code: string | null;
  created_at: string;

  bank_name: string | null;
  buyer_company: string | null;

  whatsapp_received: boolean | null;
  contract_uploaded: boolean | null;
  bank_instruction_uploaded: boolean | null;
  swift_uploaded: boolean | null;
};

type PipelineField =
  | "whatsapp_received"
  | "contract_uploaded"
  | "bank_instruction_uploaded"
  | "swift_uploaded";

type Props = {
  onRowClick: (order: Order) => void;
};

export default function OrdersTable({ onRowClick }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [bankFilter, setBankFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [search, setSearch] = useState("");

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Orders load error:", error);
    } else {
      setOrders(data || []);
      setFilteredOrders(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();

    const handler = () => loadOrders();
    window.addEventListener("orders-refresh", handler);

    return () => {
      window.removeEventListener("orders-refresh", handler);
    };
  }, [loadOrders]);

  useEffect(() => {
    let data = [...orders];

    if (bankFilter) {
      data = data.filter((o) => o.bank_name === bankFilter);
    }

    if (companyFilter) {
      data = data.filter((o) => o.buyer_company === companyFilter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();

      data = data.filter(
        (o) =>
          o.order_no?.toLowerCase().includes(s) ||
          o.bank_name?.toLowerCase().includes(s) ||
          o.buyer_company?.toLowerCase().includes(s) ||
          o.beneficiary_name?.toLowerCase().includes(s) ||
          o.swift_code?.toLowerCase().includes(s) ||
          o.account_number?.toLowerCase().includes(s)
      );
    }

    setFilteredOrders(data);
  }, [orders, bankFilter, companyFilter, search]);

  async function updatePipeline(
    orderId: string,
    field: PipelineField,
    value: boolean
  ) {
    const { error } = await supabase
      .from("orders")
      .update({ [field]: value })
      .eq("id", orderId);

    if (error) {
      console.error("Pipeline update error:", error);
      return;
    }

    loadOrders();
  }

  async function deleteOrder(orderId: string) {
    const ok = confirm("Delete this order?");
    if (!ok) return;

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      console.error("Delete order error:", error);
      alert("Delete failed");
      return;
    }

    loadOrders();
    window.dispatchEvent(new Event("orders-refresh"));
  }

  async function saveEdit() {
    if (!editingOrder) return;

    const { error } = await supabase
      .from("orders")
      .update({
        bank_name: editingOrder.bank_name,
        buyer_company: editingOrder.buyer_company,
        beneficiary_name: editingOrder.beneficiary_name,
        amount: editingOrder.amount,
        currency: editingOrder.currency,
        account_number: editingOrder.account_number,
        swift_code: editingOrder.swift_code,
        status: editingOrder.status,
        risk_level: editingOrder.risk_level,
        match_score: editingOrder.match_score,
      })
      .eq("id", editingOrder.id);

    if (error) {
      console.error("Save edit error:", error);
      alert("Save failed");
      return;
    }

    setEditingOrder(null);
    loadOrders();
    window.dispatchEvent(new Event("orders-refresh"));
  }

  function getRowStyle(order: Order) {
    if (order.status === "error" || order.risk_level === "critical") {
      return "bg-red-500/[0.05] border-l-2 border-red-500 hover:bg-red-500/[0.1]";
    }

    if (order.status === "warning" || order.risk_level === "high") {
      return "bg-yellow-500/[0.05] border-l-2 border-yellow-400 hover:bg-yellow-500/[0.1]";
    }

    if (order.status === "matched") {
      return "bg-green-500/[0.03] border-l-2 border-green-400 hover:bg-green-500/[0.06]";
    }

    return "hover:bg-white/5 border-l-2 border-transparent";
  }

  function getStatusColor(status: string | null) {
    if (status === "error") return "text-red-500";
    if (status === "warning") return "text-yellow-400";
    if (status === "matched") return "text-green-400";
    if (status === "whatsapp_received") return "text-blue-300";
    if (status === "contract_created") return "text-yellow-300";
    return "text-gray-400";
  }

  function getRiskColor(risk: string | null) {
    if (risk === "critical") return "text-red-500";
    if (risk === "high") return "text-yellow-400";
    return "text-green-400";
  }

  function renderPipeline(order: Order) {
    const steps = [
      {
        label: "WhatsApp",
        field: "whatsapp_received",
        value: Boolean(order.whatsapp_received),
      },
      {
        label: "Contract",
        field: "contract_uploaded",
        value: Boolean(order.contract_uploaded),
      },
      {
        label: "Bank (Optional)",
        field: "bank_instruction_uploaded",
        value: Boolean(order.bank_instruction_uploaded),
        optional: true,
      },
      {
        label: "SWIFT",
        field: "swift_uploaded",
        value: Boolean(order.swift_uploaded),
      },
    ];

    return (
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {steps.map((step) => {
          const isOptionalPending = step.optional && !step.value;

          return (
            <button
              key={step.field}
              title={step.label}
              onClick={() =>
                updatePipeline(
                  order.id,
                  step.field as PipelineField,
                  !step.value
                )
              }
              className={`w-2.5 h-2.5 rounded-full transition-all hover:scale-125 ${
                step.value
                  ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                  : isOptionalPending
                  ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  : "bg-gray-600 hover:bg-yellow-400"
              }`}
            />
          );
        })}
      </div>
    );
  }

  const uniqueBanks = [
    ...new Set(orders.map((o) => o.bank_name).filter(Boolean)),
  ];

  const uniqueCompanies = [
    ...new Set(orders.map((o) => o.buyer_company).filter(Boolean)),
  ];

  return (
    <div className="h-full p-4 overflow-auto bg-surface-base">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
          Operations / Orders
        </h2>

        <button
          onClick={loadOrders}
          className="px-3 py-1.5 text-[10px] font-bold uppercase bg-accent-blue text-black rounded"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <select
          value={bankFilter}
          onChange={(e) => setBankFilter(e.target.value)}
          className="bg-black border border-gray-700 px-2 py-1 text-xs text-white rounded"
        >
          <option value="">All Banks</option>
          {uniqueBanks.map((bank) => (
            <option key={String(bank)} value={String(bank)}>
              {String(bank)}
            </option>
          ))}
        </select>

        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="bg-black border border-gray-700 px-2 py-1 text-xs text-white rounded"
        >
          <option value="">All Companies</option>
          {uniqueCompanies.map((company) => (
            <option key={String(company)} value={String(company)}>
              {String(company)}
            </option>
          ))}
        </select>

        <input
          placeholder="Search beneficiary / swift / account / order"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-black border border-gray-700 px-2 py-1 text-xs text-white rounded outline-none focus:border-accent-blue"
        />
      </div>

      <div className="border border-border-subtle rounded overflow-hidden">
        <table className="w-full text-[11px] font-mono">
          <thead className="bg-surface-panel text-text-dim uppercase">
            <tr>
              <th className="p-2 text-left">Order</th>
              <th className="p-2 text-left">Bank</th>
              <th className="p-2 text-left">Company</th>
              <th className="p-2 text-left">Beneficiary</th>
              <th className="p-2 text-left">Currency</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-left">Pipeline</th>
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-left">SWIFT</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Risk</th>
              <th className="p-2 text-right">Score</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="p-6 text-center text-gray-500">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-6 text-center text-gray-500">
                  No matching orders.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onRowClick(order)}
                  className={`border-t border-border-subtle cursor-pointer text-white transition-all ${getRowStyle(
                    order
                  )}`}
                >
                  <td className="p-2">{order.order_no || "-"}</td>

                  <td className="p-2 text-blue-400">
                    {order.bank_name || "-"}
                  </td>

                  <td className="p-2 text-green-400">
                    {order.buyer_company || "-"}
                  </td>

                  <td className="p-2 text-accent-blue">
                    {order.beneficiary_name || "-"}
                  </td>

                  <td className="p-2">{order.currency || "-"}</td>

                  <td className="p-2 text-right">
                    {order.amount !== null && order.amount !== undefined
                      ? Number(order.amount).toLocaleString()
                      : "-"}
                  </td>

                  <td className="p-2">{renderPipeline(order)}</td>

                  <td className="p-2">{order.account_number || "-"}</td>

                  <td className="p-2">{order.swift_code || "-"}</td>

                  <td className={`p-2 ${getStatusColor(order.status)}`}>
                    {order.status || "new"}
                  </td>

                  <td className={`p-2 ${getRiskColor(order.risk_level)}`}>
                    {order.risk_level || "low"}
                  </td>

                  <td className="p-2 text-right">
                    {order.match_score !== null &&
                    order.match_score !== undefined
                      ? `${order.match_score}%`
                      : "-"}
                  </td>

                  <td
                    className="p-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingOrder(order)}
                        className="text-blue-400 hover:text-blue-200 text-[10px] font-bold uppercase"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-500 hover:text-red-300 text-[10px] font-bold uppercase"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded p-4 w-[460px] space-y-3 text-white">
            <h3 className="text-sm font-bold uppercase tracking-widest">
              Edit Order
            </h3>

            <input
              value={editingOrder.bank_name || ""}
              onChange={(e) =>
                setEditingOrder({
                  ...editingOrder,
                  bank_name: e.target.value,
                })
              }
              placeholder="Bank"
              className="w-full p-2 bg-black border border-gray-700 rounded text-xs"
            />

            <input
              value={editingOrder.buyer_company || ""}
              onChange={(e) =>
                setEditingOrder({
                  ...editingOrder,
                  buyer_company: e.target.value,
                })
              }
              placeholder="Company"
              className="w-full p-2 bg-black border border-gray-700 rounded text-xs"
            />

            <input
              value={editingOrder.beneficiary_name || ""}
              onChange={(e) =>
                setEditingOrder({
                  ...editingOrder,
                  beneficiary_name: e.target.value,
                })
              }
              placeholder="Beneficiary"
              className="w-full p-2 bg-black border border-gray-700 rounded text-xs"
            />

            <input
              value={
                editingOrder.amount !== null && editingOrder.amount !== undefined
                  ? String(editingOrder.amount)
                  : ""
              }
              onChange={(e) =>
                setEditingOrder({
                  ...editingOrder,
                  amount: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="Amount"
              className="w-full p-2 bg-black border border-gray-700 rounded text-xs"
            />

            <select
              value={editingOrder.currency || ""}
              onChange={(e) =>
                setEditingOrder({
                  ...editingOrder,
                  currency: e.target.value,
                })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded text-xs"
            >
              <option value="">Currency</option>
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="EUR">EUR</option>
            </select>

            <input
              value={editingOrder.account_number || ""}
              onChange={(e) =>
                setEditingOrder({
                  ...editingOrder,
                  account_number: e.target.value,
                })
              }
              placeholder="Account"
              className="w-full p-2 bg-black border border-gray-700 rounded text-xs"
            />

            <input
              value={editingOrder.swift_code || ""}
              onChange={(e) =>
                setEditingOrder({
                  ...editingOrder,
                  swift_code: e.target.value,
                })
              }
              placeholder="SWIFT"
              className="w-full p-2 bg-black border border-gray-700 rounded text-xs"
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                value={editingOrder.status || ""}
                onChange={(e) =>
                  setEditingOrder({
                    ...editingOrder,
                    status: e.target.value,
                  })
                }
                className="p-2 bg-black border border-gray-700 rounded text-xs"
              >
                <option value="">Status</option>
                <option value="whatsapp_received">whatsapp_received</option>
                <option value="contract_created">contract_created</option>
                <option value="swift_received">swift_received</option>
                <option value="swift_parsed">swift_parsed</option>
                <option value="matched">matched</option>
                <option value="warning">warning</option>
                <option value="error">error</option>
              </select>

              <select
                value={editingOrder.risk_level || ""}
                onChange={(e) =>
                  setEditingOrder({
                    ...editingOrder,
                    risk_level: e.target.value,
                  })
                }
                className="p-2 bg-black border border-gray-700 rounded text-xs"
              >
                <option value="">Risk</option>
                <option value="low">low</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>

              <input
                value={
                  editingOrder.match_score !== null &&
                  editingOrder.match_score !== undefined
                    ? String(editingOrder.match_score)
                    : ""
                }
                onChange={(e) =>
                  setEditingOrder({
                    ...editingOrder,
                    match_score:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Score"
                className="p-2 bg-black border border-gray-700 rounded text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={saveEdit}
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded w-full text-xs font-bold uppercase"
              >
                Save
              </button>

              <button
                onClick={() => setEditingOrder(null)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded w-full text-xs font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}