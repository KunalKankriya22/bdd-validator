/**
 * Valid Scan Interface Model
 * Represents a single valid scan/scale interface configuration record
 */
export interface ValidScanInterfaceModel {
  rowId: string;
  scanType: string;
  startCount: number;
  startCode: string;
  stopSize: number;
  stopCode: string;
  stringSize: number;
  effectiveDate: Date | null;
  terminationDate?: Date | null;
  modificationDate: Date | null;
}

/**
 * Request DTO for fetching Valid Scan Interface data
 */
export interface ValidScanInterfaceParamsDto {
  searchKeyword?: string;
  scanType?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  sort?: string;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface ValidScanInterfaceFilterValue {
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: Date | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: Date | null;
}

/**
 * DTO for Add Valid Scan Interface (POST)
 */
export interface ValidScanInterfaceDto {
  scanType: string;
  startCount: number;
  startCode: string;
  stopSize: number;
  stopCode: string;
  stringSize: number;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

/**
 * DTO for Update Valid Scan Interface (PUT)
 */
export interface ValidScanInterfaceUpdateDto {
  rowId: string;
  originalScanType: string;
  startCount: number;
  startCode: string;
  stopSize: number;
  stopCode: string;
  stringSize: number;
  terminationDate?: Date | null;
}

/**
 * Panel State Interface
 */
export interface ValidScanInterfacePanelState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  data?: ValidScanInterfaceModel;
}
