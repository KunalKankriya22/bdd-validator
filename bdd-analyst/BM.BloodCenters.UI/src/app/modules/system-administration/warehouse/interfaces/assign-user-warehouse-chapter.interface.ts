export interface AssignedWarehouse {
  id?: string; // for edit

  warehouseId: string;
  warehouseName?: string;

  chapterId: string;
  chapterName: string;

  printerId?: string;
  printer?: string;

  effectiveDate: string;
  terminationDate?: string;
}

//for BE

export interface ValidWarehouseUserDto {
  UserId: string;
  WarehouseId: string;
  WarehouseDescription?: string;
  ChapterId: string;
  ChapterName?: string;
  ChapterDescription?: string;
  PrinterId?: string | null;
  PrinterDescription?: string;
  EffDate?: string | null;
  TermDate?: string | null;
}


/** Generic API Response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

// for LOVs

export interface Warehouse {
  id: string;
  name?: string;
  terminated?: boolean;
}

export interface Chapter {
  id: string;
  name?: string;
}

export interface Printer {
  id: string;
  name?: string;
}

// LOV DTOs from BE (matching backend WarehouseLovDto, ChapterLovDto, PrinterLovDto)
export interface WarehouseLovDto {
  id: string;
  description: string;
}

export interface ChapterLovDto {
  id: string;
  name: string;
}

export interface PrinterLovDto {
  id: string;
  description: string;
}

// Combined LOV response from BE (matching WarehouseUserLovResponse)
export interface WarehouseUserLovResponse {
  warehouses: WarehouseLovDto[];
  chapters: ChapterLovDto[];
}

// Update DTO with original values for identifying record
export interface UpdateValidWarehouseUserDto {
  userId: string;
  warehouseId: string;
  originalChapterId?: string | null;
  originalEffDate: string;
  chapterId?: string | null;
  printerId?: string | null;
  termDate?: string | null;
}
