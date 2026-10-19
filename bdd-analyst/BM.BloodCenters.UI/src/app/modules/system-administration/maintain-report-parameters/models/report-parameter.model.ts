/**
 * Report Parameter model based on RMREPCD specifications.
 * Represents data from RPT_PARM_CODE table.
 */
export interface ReportParameter {
    /** Parameter code identifier (max 5 characters) */
    parameterCode: string;

    /** Description of the parameter code (max 30 characters) */
    description: string;

    /** Prompt text shown to users when entering parameters (max 40 characters) */
    prompt: string;

    /**
     * Type of parameter - RMREPCD valid values:
     * - CHAR: Alphanumeric
     * - DATE: Date in MM-DD-YY format
     * - DATETM: Date in MM-DD-YY HH:MI format
     * - NUMBER: Number
     * - ODATE: Date in DD-MON-YY format
     */
    parameterType: 'CHAR' | 'DATE' | 'DATETM' | 'NUMBER' | 'ODATE';

    /** Indicates if parameter values should be converted to uppercase */
    isUpper: boolean;

    /** Indicates if parameter supports multiple values (list of values) */
    isList: boolean;

    /** Reference table name for validation (max 30 characters) */
    referenceTable?: string;

    /** Reference column name for validation (max 30 characters) */
    referenceColumn?: string;

    /** Name of the form for list of values lookup (max 8 characters) */
    listFormName?: string;

    /** Default value for this parameter (max 15 characters) */
    defaultValue?: string;
}
