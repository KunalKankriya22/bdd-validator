/**
 * Tube Check-In / Shipment Models
 * Mnemonic: TSHIP
 * Screen: 18.2.4 Tube Shipment (TSHIP)
 * API Endpoint: /sample-packs
 */

/**
 * Sample Pack DTO - matches backend SamplePackDto
 */
export interface SamplePackDto {
  boxId: string;
  collDate: Date;
  extractType: string;
  extractTypeDescription: string;
  donorType: string;
  donorTypeDescription: string;
  destinationCode: string;
  destinationName: string | null;
  status: string;
  statusDescription: string;
  chapterId: string;
  boxClosedDate: Date | null;
  boxClosedUser: string | null;
  insertDate: Date;
  insertUser: string;
  tubeCount: number;
}

/**
 * Sample Pack Query DTO for filtering
 */
export interface SamplePackQueryDto {
  boxId?: string | null;
  status?: string | null;
  extractType?: string | null;
  donorType?: string | null;
  destinationCode?: string | null;
  fromDate?: Date | null;
  toDate?: Date | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

/**
 * Sample Pack Tube DTO - matches backend SamplePackTubeDto
 */
export interface SamplePackTubeDto {
  boxId: string;
  unitId: string;
  purpleTubeFlag: string | null;
  purpleTube2Flag: string | null;
  redTubeFlag: string | null;
  insertDate: Date;
  insertUser: string;
  checkDigit: string | null;
}

/**
 * Create Sample Pack Request DTO
 */
export interface CreateSamplePackRequestDto {
  boxId: string;
  collDate: Date;
  extractType: string; // V=Viral Marker, N=NAT, B=Both
  donorType: string; // I=First Time, R=Repeat, O=Others
  destinationCode: string;
}

/**
 * Update Sample Pack Request DTO
 */
export interface UpdateSamplePackRequestDto {
  collDate: Date;
  extractType: string;
  donorType: string;
  destinationCode: string;
}

/**
 * Add Tube Request DTO
 */
export interface AddTubeRequestDto {
  unitId: string;
  purpleTubeFlag: string | null;
  purpleTube2Flag: string | null;
  redTubeFlag: string | null;
}

/**
 * Return Result wrapper for API responses
 */
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string; // Error code from backend validation
  data?: T[];
  totalRecords?: number;
}

/**
 * Testing Lab DTO - matches backend TestingLabDto
 */
export interface TestingLabDto {
  testingLabId: string;
  testingLabName: string;
  chapterId: string;
  effDate: Date | null;
  termDate: Date | null;
}

/**
 * Destination Lab (backward compatibility alias)
 */
export interface DestinationLab extends TestingLabDto {}

// Legacy interfaces for backward compatibility
export interface BoxHeader extends SamplePackDto {}
export interface TubeEntry extends SamplePackTubeDto {
  sequence?: number;
}
export interface CreateBoxRequest extends CreateSamplePackRequestDto {}
export interface AddTubeRequest extends AddTubeRequestDto {}
export interface CloseBoxRequest {
  boxId: string;
  printPackList: boolean;
}
