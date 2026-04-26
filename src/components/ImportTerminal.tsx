import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ImportTerminal() {
  const [form, setForm] = useState({
    beneficiary: "",
    amount: "",
    currency: "",
    account: "",
    swift: "",
    bank: "",
    buyerCompany: "",
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const [memoryList, setMemoryList] = useState<any[]>([]);
  const [detection, setDetection] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ================= LOAD INITIAL =================
  useEffect(() => {
    loadMemory();
    loadBanks();
  }, []);

  async function loadMemory() {
    const { data } = await supabase.from("entity_memory").select("*");
    if (data) setMemoryList(data);
  }

  async function loadBanks() {
    const { data } = await supabase.from("banks_master").select("*");
    if (data) setBanks(data);
  }

  async function loadCompanies(bankId: string) {
    const { data } = await supabase
      .from("buyer_companies_master")
      .select("*")
      .eq("bank_id", bankId);

    if (data) setCompanies(data);
  }

  // ================= BANK CHANGE =================
  async function handleBankChange(bankName: string) {
    setForm({ ...form, bank: bankName, buyerCompany: "" });

    const selected = banks.find((b) => b.name === bankName);
    if (selected) {
      await loadCompanies(selected.id);
    }
  }

  // ================= NORMALIZE =================
  function normalize(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // ================= AUTO FILL =================
  useEffect(() => {
    if (!form.beneficiary) return;

    const norm = normalize(form.beneficiary);

    const found = memoryList.find(
      (m) =>
        norm.includes(m.normalized_name) ||
        m.normalized_name.includes(norm)
    );

    if (found) {
      setForm((prev) => ({
        ...prev,
        account: found.account_number || prev.account,
        swift: found.swift_code || prev.swift,
        currency: found.currency || prev.currency,
      }));
    }
  }, [form.beneficiary]);

  // ================= COMMIT =================
  async function commit() {
    setLoading(true);

    const { error } = await supabase.from("orders").insert([
      {
        order_no: `#${Math.floor(Math.random() * 10000)}`,
        beneficiary_name: form.beneficiary,
        amount: Number(form.amount),
        currency: form.currency.toUpperCase(),
        account_number: form.account,
        swift_code: form.swift,

        bank_name: form.bank,
        buyer_company: form.buyerCompany,

        whatsapp_received: true,
        status: "whatsapp_received",
        risk_level: "low",
        match_score: 0,
      },
    ]);

    if (error) {
      alert("Insert failed ❌");
      setLoading(false);
      return;
    }

    alert("Order Created ✅");
    window.dispatchEvent(new Event("orders-refresh"));

    setForm({
      beneficiary: "",
      amount: "",
      currency: "",
      account: "",
      swift: "",
      bank: "",
      buyerCompany: "",
    });

    setLoading(false);
  }

  // ================= ADD NEW BANK =================
  async function addBank() {
    const name = prompt("Enter new bank name");
    if (!name) return;

    await supabase.from("banks_master").insert({ name });
    loadBanks();
  }

  // ================= ADD NEW COMPANY =================
  async function addCompany() {
    if (!form.bank) {
      alert("Select bank first");
      return;
    }

    const name = prompt("Enter company name");
    if (!name) return;

    const bank = banks.find((b) => b.name === form.bank);

    await supabase.from("buyer_companies_master").insert({
      name,
      bank_id: bank.id,
    });

    loadCompanies(bank.id);
  }

  return (
    <div className="p-4 text-white space-y-4 max-w-3xl mx-auto">
      <h2 className="text-lg font-bold">Manual Order Input</h2>

      {/* BANK */}
      <div className="flex gap-2">
        <select
          value={form.bank}
          onChange={(e) => handleBankChange(e.target.value)}
          className="w-full p-2 bg-black border border-gray-700"
        >
          <option value="">Select Bank</option>
          {banks.map((b) => (
            <option key={b.id}>{b.name}</option>
          ))}
        </select>

        <button onClick={addBank} className="bg-blue-600 px-2">
          +
        </button>
      </div>

      {/* COMPANY */}
      <div className="flex gap-2">
        <select
          value={form.buyerCompany}
          onChange={(e) =>
            setForm({ ...form, buyerCompany: e.target.value })
          }
          className="w-full p-2 bg-black border border-gray-700"
        >
          <option value="">Select Company</option>
          {companies.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>

        <button onClick={addCompany} className="bg-green-600 px-2">
          +
        </button>
      </div>

      {/* INPUTS */}
      {["beneficiary", "amount", "currency", "account", "swift"].map(
        (field) => (
          <input
            key={field}
            placeholder={field.toUpperCase()}
            value={(form as any)[field]}
            onChange={(e) =>
              setForm({ ...form, [field]: e.target.value })
            }
            className="w-full p-2 bg-black border border-gray-700"
          />
        )
      )}

      <button
        onClick={commit}
        disabled={loading}
        className="bg-green-600 px-4 py-2 rounded w-full"
      >
        {loading ? "Creating..." : "CREATE ORDER"}
      </button>
    </div>
  );
}