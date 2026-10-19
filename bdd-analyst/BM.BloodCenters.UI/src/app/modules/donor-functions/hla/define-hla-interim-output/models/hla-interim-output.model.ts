export interface HlaInterimOutput {
  hlaCode: string; // Composite: match_a1a1-match_a1a2-match_a2a1-match_a2a2
  hlaDescription: string; // Same as hlaCode
  matchA1A1?: string; // Individual code for forms
  matchA1A1Description?: string; // Description for table display
  matchA1A2?: string; // Individual code for forms
  matchA1A2Description?: string; // Description for table display
  matchA2A1?: string; // Individual code for forms
  matchA2A1Description?: string; // Description for table display
  matchA2A2?: string; // Individual code for forms
  matchA2A2Description?: string; // Description for table display
  interimCode?: string;
  interimDescription?: string;
  outcomeAntigenA1?: string; // Outcome code for Antigen A1
  outcomeAntigenA1Description?: string; // Description for table display
  outcomeAntigenA2?: string; // Outcome code for Antigen A2
  outcomeAntigenA2Description?: string; // Description for table display
  effectiveDate: string | Date;
  terminationDate?: string | Date | null;
  insUser?: string;
  insDate?: string | Date;
  updUser?: string;
  updDate?: string | Date;
}

export interface HlaInterimOutputSearchParams {
  matchA1A1?: string;
  matchA1A2?: string;
  outcomeAntigenA1?: string;
  matchA2A1?: string;
  matchA2A2?: string;
  outcomeAntigenA2?: string;
  effDate?: string | Date;
  effDatePeriod?: 'After' | 'Before';
  termDate?: string | Date;
  termDatePeriod?: 'After' | 'Before';
  searchText?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface InterimCodeLov {
  interimCode: string;
  interimDescription: string;
}

export interface FilterValueOption {
  value: string;
  label: string;
}

export interface FilterValueItem {
  match: string;
  description: string;
}

export interface HlaInterimOutputFilterValues {
  matchA1A1: FilterValueItem[];
  matchA1A2: FilterValueItem[];
  matchA2A1: FilterValueItem[];
  matchA2A2: FilterValueItem[];
  outputA1: FilterValueItem[];
  outputA2: FilterValueItem[];
}
