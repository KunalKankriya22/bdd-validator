export type { UnitValidationResponse, UnitValidationApiResponse } from '@shared/components/unit-id-field/unit-id-field.model';

export interface LovItem {
  unitId: string;
  collDate: string;
  displayUnitId: string | null;
}
