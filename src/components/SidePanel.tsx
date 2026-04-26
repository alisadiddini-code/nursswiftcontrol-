import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  CreditCard,
  Database,
  MessageSquare,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabaseClient";

interface Order {
  id: string;
  order_no: string | null;
  beneficiary_name: string | null;
  amount: number | null;
  currency: string | null;
  account_number: string | null;
  swift_code: string | null;
  whatsapp_received: boolean | null;
  contract_uploaded: boolean | null;
  bank_instruction_uploaded: boolean | null;
  swift_uploaded: boolean | null;
  contract_url?: string | null;
  bank_instruction_url?: string | null;
  swift_url?: string | null;
  validation_result?: any;
  parsed_swift?: any;
  automation_log?: any[];
  status?: string | null;
  risk_level?: string | null;
  match_score?: number | null;
}

interface Props {
  order: Order;
  onClose: () => void;
  onReconcile?: () => void;
}

export default function SidePanel({ order, onClose, onReconcile }: Props) {
  const [uploading, setUploading] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const [validation, setValidation] = useState<any>(
    order.validation_result || null
  );
  const [swiftText, setSwiftText] = useState("");
  const [parsedSwift, setParsedSwift] = useState<any>(
    order.parsed_swift || null
  );

  useEffect(() => {
    setLocalOrder(order);
    setValidation(order.validation_result || null);
    setParsedSwift(order.parsed_swift || null);
    setSwiftText("");
  }, [order]);

  function normalizeText(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  }

  function buildAutomationLog(action: string) {
    return {
      action,
      at: new Date().toISOString(),
    };
  }

  function mergeAutomationLog(action: string) {
    const currentLog = Array.isArray(localOrder.automation_log)
      ? localOrder.automation_log
      : [];

    return [...currentLog, buildAutomationLog(action)];
  }

  async function uploadFile(file: File, type: "contract" | "bank" | "swift") {
    setUploading(true);

    const filePath = `${localOrder.id}/${type}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("contract-files")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      alert(`${type} upload failed`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("contract-files")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;
    const updates: any = {};

    if (type === "contract") {
      updates.contract_uploaded = true;
      updates.contract_url = publicUrl;
      updates.status = "contract_created";
      updates.automation_log = mergeAutomationLog("contract_uploaded");
    }

    if (type === "bank") {
      updates.bank_instruction_uploaded = true;
      updates.bank_instruction_url = publicUrl;
      updates.status = "bank_instruction_received";
      updates.automation_log = mergeAutomationLog("bank_instruction_uploaded");
    }

    if (type === "swift") {
      updates.swift_uploaded = true;
      updates.swift_url = publicUrl;
      updates.status = "swift_received";
      updates.automation_log = mergeAutomationLog("swift_uploaded");
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", localOrder.id);

    if (updateError) {
      console.error(updateError);
      alert("File uploaded, but order update failed");
      setUploading(false);
      return;
    }

    setLocalOrder((prev) => ({
      ...prev,
      ...updates,
    }));

    window.dispatchEvent(new Event("orders-refresh"));
    setUploading(false);
  }

  function parseMT103(text: string) {
    const getField = (tag: string) => {
      const regex = new RegExp(`:${tag}:(.*?)(\\n:|$)`, "s");
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    const field32A = getField("32A");

    let valueDate: string | null = null;
    let currency: string | null = null;
    let amount: number | null = null;

    if (field32A) {
      const match = field32A.match(/^(\d{6})([A-Z]{3})([\d,\.]+)/);
      if (match) {
        valueDate = match[1];
        currency = match[2];
        amount = Number(match[3].replace(",", "."));
      }
    }

    const beneficiaryRaw = getField("59");
    let beneficiaryAccount: string | null = null;
    let beneficiaryName: string | null = null;

    if (beneficiaryRaw) {
      const lines = beneficiaryRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0) {
        beneficiaryAccount = lines[0].replace("/", "");
        beneficiaryName = lines.slice(1).join(" ");
      }
    }

    const beneficiaryBankRaw = getField("57A");
    let beneficiaryBankSwift: string | null = null;

    if (beneficiaryBankRaw) {
      const lines = beneficiaryBankRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      beneficiaryBankSwift = lines[0]?.replace("/", "") || null;
    }

    return {
      sender_ref: getField("20"),
      operation_code: getField("23B"),
      field_32a: field32A,
      value_date: valueDate,
      currency,
      amount,
      ordering_customer: getField("50K"),
      ordering_bank: getField("52A"),
      beneficiary_bank: beneficiaryBankRaw,
      beneficiary_bank_swift: beneficiaryBankSwift,
      beneficiary: beneficiaryRaw,
      beneficiary_account: beneficiaryAccount,
      beneficiary_name: beneficiaryName,
      remittance: getField("70"),
      charges: getField("71A"),
      raw_text: text,
      parsed_at: new Date().toISOString(),
    };
  }

  async function handleParseSwift() {
    if (!swiftText.trim()) {
      alert("Please paste SWIFT MT103 text first");
      return;
    }

    const parsed = parseMT103(swiftText);
    setParsedSwift(parsed);

    const updates = {
      parsed_swift: parsed,
      swift_raw_text: swiftText,
      swift_uploaded: true,
      status: "swift_parsed",
      automation_log: mergeAutomationLog("swift_parsed"),
    };

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", localOrder.id);

    if (error) {
      console.error(error);
      alert("SWIFT parsing save failed");
      return;
    }

    setLocalOrder((prev) => ({
      ...prev,
      ...updates,
    }));

    window.dispatchEvent(new Event("orders-refresh"));
    alert("SWIFT parsed & saved");
  }

  async function runMatching() {
    const parsed = parsedSwift || localOrder.parsed_swift || null;

    const amountMatch = parsed?.amount
      ? Number(parsed.amount) === Number(localOrder.amount)
      : Boolean(localOrder.amount);

    const currencyMatch = parsed?.currency
      ? normalizeText(parsed.currency) === normalizeText(localOrder.currency || "")
      : Boolean(localOrder.currency);

    const accountMatch = parsed?.beneficiary_account
      ? normalizeText(parsed.beneficiary_account) ===
        normalizeText(localOrder.account_number || "")
      : Boolean(localOrder.account_number);

    const swiftMatch = parsed?.beneficiary_bank_swift
      ? normalizeText(parsed.beneficiary_bank_swift) ===
        normalizeText(localOrder.swift_code || "")
      : Boolean(localOrder.swift_code);

    const beneficiaryMatch = parsed?.beneficiary_name
      ? normalizeText(parsed.beneficiary_name).includes(
          normalizeText(localOrder.beneficiary_name || "")
        ) ||
        normalizeText(localOrder.beneficiary_name || "").includes(
          normalizeText(parsed.beneficiary_name)
        )
      : Boolean(localOrder.beneficiary_name);

    const checks = {
      amount: amountMatch,
      currency: currencyMatch,
      beneficiary: beneficiaryMatch,
      account: accountMatch,
      swift_code: swiftMatch,
      contract_uploaded: Boolean(localOrder.contract_uploaded),
      bank_instruction_optional: true,
      swift_uploaded: Boolean(localOrder.swift_uploaded || parsed),
    };

    const weightedChecks = [
      checks.amount,
      checks.currency,
      checks.beneficiary,
      checks.account,
      checks.swift_code,
      checks.contract_uploaded,
      checks.swift_uploaded,
    ];

    const passed = weightedChecks.filter(Boolean).length;
    const percent = Math.round((passed / weightedChecks.length) * 100);

    let status = "matched";
    let risk_level = "low";

    if (percent < 70) {
      status = "error";
      risk_level = "critical";
    } else if (percent < 90) {
      status = "warning";
      risk_level = "high";
    }

    const result = {
      percent,
      checks,
      parsed_swift: parsed,
      checked_at: new Date().toISOString(),
      note:
        "Bank Instruction is optional. If uploaded, it is included in the pipeline, but missing bank instruction is not treated as an error.",
    };

    setValidation(result);

    const updates = {
      validation_result: result,
      validation_notes: result.note,
      matched_at: new Date().toISOString(),
      match_score: percent,
      status,
      risk_level,
      automation_log: mergeAutomationLog("matching_run"),
    };

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", localOrder.id);

    if (error) {
      console.error("Validation save error:", error);
      alert("Matching result could not be saved");
      return;
    }

    setLocalOrder((prev) => ({
      ...prev,
      ...updates,
    }));

    window.dispatchEvent(new Event("orders-refresh"));
  }

  const stages = [
    {
      label: "WhatsApp",
      icon: MessageSquare,
      value: localOrder.whatsapp_received,
    },
    {
      label: "Contract",
      icon: FileText,
      value: localOrder.contract_uploaded,
    },
    {
      label: "Bank",
      icon: CreditCard,
      value: localOrder.bank_instruction_uploaded,
      optional: true,
    },
    {
      label: "SWIFT",
      icon: Database,
      value: localOrder.swift_uploaded || parsedSwift,
    },
  ];

  return (
    <motion.div className="absolute inset-y-0 right-0 w-[420px] bg-black border-l border-gray-800 flex flex-col z-50">
      <div className="p-4 border-b border-gray-800 flex justify-between">
        <h2 className="text-white font-bold">{localOrder.order_no}</h2>

        <button onClick={onClose}>
          <X className="text-gray-400 hover:text-white" />
        </button>
      </div>

      <div className="p-4 space-y-5 overflow-auto">
        <div className="flex gap-2">
          {stages.map((s, i) => {
            const isOptional = s.optional && !s.value;

            return (
              <div
                key={i}
                title={s.label}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  s.value
                    ? "bg-green-500 text-white"
                    : isOptional
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                <s.icon size={14} />
              </div>
            );
          })}
        </div>

        <div className="border border-gray-800 p-3 rounded text-xs space-y-2">
          <div className="text-gray-400">Beneficiary</div>
          <div className="text-white font-bold">
            {localOrder.beneficiary_name || "-"}
          </div>

          <div className="text-gray-400 mt-3">Amount</div>
          <div className="text-white font-bold">
            {localOrder.currency} {localOrder.amount?.toLocaleString() || "-"}
          </div>

          <div className="text-gray-400 mt-3">Account</div>
          <div className="text-blue-400 font-mono">
            {localOrder.account_number || "-"}
          </div>

          <div className="text-gray-400 mt-3">SWIFT</div>
          <div className="text-blue-400 font-mono">
            {localOrder.swift_code || "-"}
          </div>

          <div className="text-gray-400 mt-3">Status</div>
          <div className="text-white font-mono">
            {localOrder.status || "new"}
          </div>

          <div className="text-gray-400 mt-3">Risk</div>
          <div
            className={`font-mono ${
              localOrder.risk_level === "critical"
                ? "text-red-400"
                : localOrder.risk_level === "high"
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {localOrder.risk_level || "low"}
          </div>
        </div>

        <div className="border border-gray-800 p-3 rounded space-y-2">
          <div className="text-xs text-gray-400">Paste SWIFT MT103</div>

          <textarea
            value={swiftText}
            onChange={(e) => setSwiftText(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-white h-32 outline-none focus:border-blue-500"
            placeholder="Paste full MT103 message here..."
          />

          <button
            onClick={handleParseSwift}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded font-bold"
          >
            Parse MT103
          </button>

          {parsedSwift && (
            <div className="text-xs text-gray-300 space-y-1 pt-2 border-t border-gray-800">
              <div>
                <span className="text-gray-500">Sender Ref:</span>{" "}
                {parsedSwift.sender_ref || "-"}
              </div>
              <div>
                <span className="text-gray-500">Currency:</span>{" "}
                {parsedSwift.currency || "-"}
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>{" "}
                {parsedSwift.amount || "-"}
              </div>
              <div>
                <span className="text-gray-500">Beneficiary Account:</span>{" "}
                {parsedSwift.beneficiary_account || "-"}
              </div>
              <div>
                <span className="text-gray-500">Beneficiary:</span>{" "}
                {parsedSwift.beneficiary_name || "-"}
              </div>
              <div>
                <span className="text-gray-500">Bank SWIFT:</span>{" "}
                {parsedSwift.beneficiary_bank_swift || "-"}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={runMatching}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded font-bold"
        >
          Run Matching Check
        </button>

        {onReconcile && (
          <button
            onClick={onReconcile}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded font-bold"
          >
            Open Reconciliation
          </button>
        )}

        {validation && (
          <div className="border border-gray-800 p-3 rounded text-xs space-y-2">
            <div className="text-white font-bold">
              Match Score: {validation.percent}%
            </div>

            {Object.entries(validation.checks).map(([key, val]: any) => (
              <div
                key={key}
                className={val ? "text-green-400" : "text-red-400"}
              >
                {val ? "✅" : "❌"} {key}
              </div>
            ))}

            <div className="text-gray-500 pt-2">{validation.note}</div>
          </div>
        )}

        <UploadBox
          title="Contract"
          onUpload={(file: File) => uploadFile(file, "contract")}
          fileUrl={localOrder.contract_url}
          uploading={uploading}
        />

        <UploadBox
          title="Bank Instruction"
          onUpload={(file: File) => uploadFile(file, "bank")}
          fileUrl={localOrder.bank_instruction_url}
          uploading={uploading}
        />

        <UploadBox
          title="SWIFT MT103"
          onUpload={(file: File) => uploadFile(file, "swift")}
          fileUrl={localOrder.swift_url}
          uploading={uploading}
        />
      </div>
    </motion.div>
  );
}

function UploadBox({ title, onUpload, fileUrl, uploading }: any) {
  return (
    <div className="border border-gray-800 p-3 rounded">
      <h3 className="text-xs text-gray-400 mb-3">{title}</h3>

      <label className="flex items-center justify-center gap-2 border border-dashed border-gray-700 rounded p-4 cursor-pointer hover:border-blue-500">
        <Upload size={16} />

        <span className="text-sm text-gray-300">
          {uploading ? "Uploading..." : "Choose File"}
        </span>

        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </label>

      {fileUrl && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 text-center py-2 rounded text-white"
          >
            View
          </a>

          <a
            href={fileUrl}
            download
            className="bg-blue-600 text-center py-2 rounded text-white"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}