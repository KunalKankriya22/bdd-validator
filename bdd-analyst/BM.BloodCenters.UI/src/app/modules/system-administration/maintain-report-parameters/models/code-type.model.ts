/**
 * Code Type model matching backend CodeTypeDto
 * Based on RMREPCD CODE_TYPE LOV specification
 */
export interface CodeType {
  /** The code value (CHAR, DATE, DATETM, NUMBER, ODATE) */
  code: string;

  /** Human-readable description of the code type */
  description: string;
}

/**
 * Available code types based on RMREPCD specifications:
 * - CHAR: Alphanumeric
 * - DATE: Date in MM-DD-YY format
 * - DATETM: Date in MM-DD-YY HH:MI format
 * - NUMBER: Number
 * - ODATE: Date in DD-MON-YY format
 */
export const CODE_TYPE_OPTIONS: CodeType[] = [
  { code: 'CHAR', description: 'Alphanumeric' },
  { code: 'DATE', description: 'Date in MM-DD-YY format' },
  { code: 'DATETM', description: 'Date in MM-DD-YY HH:MI format' },
  { code: 'NUMBER', description: 'Number' },
  { code: 'ODATE', description: 'Date in DD-MON-YY format' }
];
