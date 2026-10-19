import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

export interface UploadStatusFilterValue {
  fileId: string | null;
  testBatchId: string | null;
  status: string | null;
  period: string | null;
  processDate: Date | null;
}

function periodToOperator(period: string | null | undefined): string {
  const normalized = period?.toLowerCase();
  if (normalized === 'after') return '≥';
  if (normalized === 'before') return '≤';
  return '=';
}

function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    'P': 'Pending',
    'S': 'Loaded Successfully',
    'E': 'Error',
    'A': 'Aborted'
  };
  return statusMap[status] || status;
}

export function buildUploadStatusFilterChips(
  filters: UploadStatusFilterValue
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.fileId) {
    chips.push({
      key: 'fileId',
      label: `File ID: ${filters.fileId}`,
      value: filters.fileId,
      removable: true
    });
  }

  if (filters.testBatchId) {
    chips.push({
      key: 'testBatchId',
      label: `Test Batch ID: ${filters.testBatchId}`,
      value: filters.testBatchId,
      removable: true
    });
  }

  if (filters.status) {
    chips.push({
      key: 'status',
      label: `Status: ${getStatusLabel(filters.status)}`,
      value: filters.status,
      removable: true
    });
  }

  if (filters.processDate && filters.period) {
    const operator = periodToOperator(filters.period);
    const dateStr = moment(filters.processDate).format('DD-MMM-YYYY').toUpperCase();
    chips.push({
      key: 'processDate',
      label: `Process Date ${operator} ${dateStr}`,
      value: filters.processDate,
      removable: true
    });
  }

  return chips;
}
