export interface WorksheetIdItem {
  worksheetId: string;
}

export interface WorksheetIdsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: WorksheetIdItem[];
  total: number;
}

export interface CryoResultUnitDto {
  unitId: string;
  chkDigit: string | null;
  collDate: string | null;
  actualProductCode: string | null;
  productShortName: string | null;
  thawMethod: string | null;
  thawTemperature: number | null;
  sepInd: string | null;
  freezeTime: string | null;
}

export interface CryoResultUnitsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CryoResultUnitDto[];
  total: number;
}

export interface CryoResultUnit {
  unitId: string;
  collDate: string;
  actualProductCode: string;
  productShortName: string;
  thawMethod: string;
  thawTemperature: string;
  sepInd: string;
  freezeTime: string;
}
