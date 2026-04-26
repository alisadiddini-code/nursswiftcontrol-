/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Currency = 'USD' | 'CNY';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type WorkflowStage = 
  | 'WhatsApp Order' 
  | 'Contract Created' 
  | 'Bank Payment Instruction' 
  | 'SWIFT' 
  | 'Completed';

export interface Bank {
  id: string;
  name: string;
}

export interface BuyerCompany {
  id: string;
  name: string;
  bankId: string;
}

export interface Beneficiary {
  id: string;
  name: string;
}

export interface TransactionOrder {
  id: string;
  orderNo: string;
  date: string;
  bankId: string;
  buyerCompanyId: string;
  beneficiaryName: string;
  currency: Currency;
  amount: number;
  contractNo?: string;
  accountNo: string;
  swiftBic: string;
  status: WorkflowStage;
  risk: RiskLevel;
  matchScore: number;
  sourceType: 'WhatsApp' | 'PDF' | 'Word' | 'Image';
  beneficiaryBank: string;
  invoiceNo?: string;
  whatsappText?: string;
  hasContract: boolean;
  hasPayment: boolean;
  hasSwift: boolean;
}

export interface ReconciliationData {
  whatsapp?: Partial<TransactionOrder>;
  contract?: Partial<TransactionOrder> & { hsCode?: string; goodsDescription?: string };
  payment?: Partial<TransactionOrder>;
  swift?: Partial<TransactionOrder> & { field70?: string };
}
