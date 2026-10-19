export interface BatchIdLovItem {
  batchId: string;
}

export interface BatchUnitDto {
  unitId: string;
  chkDigit: string | null;
  collDate: string | null;
  donorDecisionCode: string | null;
  catalogNumber: string | null;
  driveId: string | null;
  groupSiteId: string | null;
  redTubeFlag: string | null;
  redTube2: string | null;
  purpleTubeFlag: string | null;
  serumPlasmaInd: string | null;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  qcCheckinDate: string | null;
}

export interface BatchUnitsResponse {
  units: BatchUnitDto[];
  unitCount: number;
}

export interface ReturnResult<T> {
  success: boolean | null;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number | null;
  data: T[] | null;
  item: T | null;
  total: number | null;
}
