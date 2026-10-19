/**
 * Spike Component Models
 * Based on API Documentation: spike-component-api-documentation.md
 */

// Request DTOs

export interface CreateComponentSpikingDto {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  spikingType: string;
  bagLotNumber: string;
  filterLotNumber: string | null;
  bagsSpiked: number;
  bagsForComponents: number;
}

export interface ValidateUnitRequestDto {
  unitId: string;
}

// Response DTOs

export interface ComponentSpikingResponseDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  spikingType: string;
  bagLotNumber: string;
  filterLotNumber: string | null;
  bagsSpiked: number;
  bagsForComponents: number;
  bagsUsed: number;
  insertDats: string;
  insertUserId: string;
  programId: string;
}

export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string;
  isValid: boolean;
  message: string;
}

export interface ProcessCodeDto {
  processCode: string;
  processCodeDesc: string;
}

export interface SpikingTypeDto {
  spikingType: string;
  spikingTypeDesc: string;
}

export interface ProductDto {
  productCode: string;
  productDesc: string;
  componentPrefix: string;
  productType: string;
}

export interface LotNumberDto {
  lotNumber: string;
}

// API Response Wrappers

export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  item?: T;
}

// Form Model (internal component state)

export interface SpikeFormData {
  unitId: string;
  collDate: string | null;
  processCode: string;
  productCode: string;
  componentPrefix: string;
  spikingType: string;
  bagLotNumber: string;
  filterLotNumber: string;
  bagsSpiked: number | null;
  bagsForComponents: number | null;
}

// Table row model for displaying spiking records in session
export interface SpikingTableRow {
  unitId: string;
  productCode: string;
  type: string;
  bagLotNumber: string;
  filterLotNumber: string;
  bags: number;
  numberOfComponent: number;
}
