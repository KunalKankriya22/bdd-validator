export interface TerritoryModel {
  territoryId: string;
  chapterId: string;
  territoryShortName: string;
  territoryName: string;
  territoryGroup: string | null;
  territoryGroupDescription?: string;
  territoryType: string;
  territoryTypeDescription?: string;
  effDate: string | Date;
  termDate: string | Date | null;
  comments: string | null;
  programId: string;
  insertDate: string | Date;
  insertUser: string;
  auditKey: number;
  modificationDate?: string | Date;
}

export interface TerritoryDto {
  territoryShortName: string;
  territoryName: string;
  territoryGroup: string | null;
  territoryType: string;
  effDate: string | null;
  termDate: string | null;
  comments: string | null;
  chapterId?: string;
}

export interface TerritoryUpdateDto extends TerritoryDto {
  territoryId: string;
  originalTerritoryShortName: string;
}

export interface TerritoryParamsDto {
  searchText?: string;
  territoryGroup?: string;
  territoryType?: string;
  showTerminated?: string;
  effDate?: string;
  effDatePeriod?: string;
  termDate?: string;
  termDatePeriod?: string;
  sort?: 'A' | 'D';
  sortColumn?: string;
  chapterId?: string;
}

export interface TerritoryFilterValue {
  showTerminated: boolean;
  territoryGroup: string | null;
  territoryType: string | null;
  effDatePeriod: string | null;
  effDate: Date | null;
  termDatePeriod: string | null;
  termDate: Date | null;
}

export interface LookupItem {
  code: string;
  description: string;
}

export interface TerritoryLookups {
  groups: LookupItem[];
  types: LookupItem[];
}

export interface TerritoryFilterOptions {
  groups: LookupItem[];
  types: LookupItem[];
}
