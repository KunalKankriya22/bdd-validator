/**
 * Reset cycle types for application sequence numbers
 * Maps backend codes to display strings
 */
export enum ResetCycleCode {
  DAILY = 'D',
  YEARLY = 'Y'
}

/**
 * Reset cycle option with code and display string
 */
export interface ResetCycleOption {
  code: string;
  display: string;
}

/**
 * Available reset cycle options for dropdowns
 * Used in filter modal and future ADD/EDIT forms
 */
export const RESET_CYCLE_OPTIONS: readonly ResetCycleOption[] = [
  { code: ResetCycleCode.DAILY, display: 'Daily Reset' },
  { code: ResetCycleCode.YEARLY, display: 'Yearly Reset' }
] as const;

/**
 * Get display string from backend code
 * Returns '-' for null values (table display convention)
 * 
 * @param code - Backend cycle code ("D", "Y", or null)
 * @returns Display string or "-" for null
 */
export function getCycleDisplay(code: string | null): string {
  if (code === null) return '-';
  
  const option = RESET_CYCLE_OPTIONS.find(opt => opt.code === code);
  return option?.display ?? '-';
}

/**
 * Get code from display string (for reverse lookup in future ADD/EDIT)
 * 
 * @param display - Display string (e.g., "Daily Reset")
 * @returns Backend code or null if not found
 */
export function getCycleCode(display: string): string | null {
  const option = RESET_CYCLE_OPTIONS.find(opt => opt.display === display);
  return option?.code ?? null;
}
