/**
 * Filter values for patient list
 */
export interface PatientFilterValue {
  status: string | null;
  shipTo: string | null;
  surgeryDate: string | null; // YYYY-MM-DD
  surgeryDatePeriod: 'before' | 'after' | null;
  neededBy: string | null; // YYYY-MM-DD
  neededByPeriod: 'before' | 'after' | null;
}
