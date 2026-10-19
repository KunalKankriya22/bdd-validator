import { Moment } from 'moment';

export interface SampleType {
  code: string;
  name: string;
}

export interface TestIdOption {
  value: string;
  label: string;
}

export interface TestLinkageRow {
  _rowId: string;
  testId: string;
  effectiveDate: Moment | null;
  terminationDate: Moment | null;
}
