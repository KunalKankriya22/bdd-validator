import { ComponentDto } from './component.model';
import { UnitTestResultDto } from './unit-test-result.model';
import { UnitTestBaseDto } from './unit-test-base.model';

export interface LabQcSummaryDto {
  components: ComponentDto[];
  testResults: UnitTestResultDto[];
  testBase: UnitTestBaseDto[];
}

export interface TestBatchDropdown {
  tbId: string;
  testChapterId: string | null;
  insertDate: string | null;
}

export interface BatchUnitsResponse {
  tbId: string;
  testChapterId: string | null;
  unscheduledUnitCount: number;
  units: UnitQcStatus[];
}

export interface UnitQcStatus {
  sequenceNumber: number;
  unitId: string;
  displayUnitId: string | null;
  collDate: string;
  chapterId: string;
  checkDigit: string | null;
  donorInterface: string | null;
  testingFlag: string | null;
  nursingAuditFlag: string | null;
  componentReview: string | null;
  qcLabelFlag: string | null;
}

export interface SaveQcLabelRequest {
  items: SaveQcLabelItem[];
}

export interface SaveQcLabelItem {
  unitId: string;
  collDate: string;
  chapterId: string;
  componentReview: string | null;
  qcLabelFlag: string | null;
}
