// Menu Access Filter Values
export interface MenuAccessFilterValue {
  menuTitle: string | null;
  program: string | null;
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: string | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: string | null;
}

// Access Classes Filter Values
export interface AccessClassesFilterValue {
  class: string | null;
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: string | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: string | null;
}

// Interdictions Filter Values
export interface InterdictionsFilterValue {
  interdictionsType: string | null;
  interdictionsCode: string | null;
}
