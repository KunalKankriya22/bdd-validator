/**
 * Shared models for Pending Audit Queries (Donations and Deferrals)
 */

export interface DonationTypeOption {
  value: string;
  label: string;
}

export interface ProcedureCodeOption {
  value: string;
  label: string;
}

export interface PendingAuditFilterValue {
  donationType: string | null;
  procedureCode: string | null;
}
