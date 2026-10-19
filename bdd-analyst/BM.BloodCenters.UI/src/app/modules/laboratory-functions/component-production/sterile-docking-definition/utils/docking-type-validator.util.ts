import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator for sterile docking definition form
 * Validates that filter fields are required when docking type is FI, FB, or BF
 */
export function dockingTypeConditionalValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const dockingType = form.get('dockingType')?.value;
    const filterType = form.get('filterType')?.value;
    const filterLotNumber = form.get('filterLotNumber')?.value;

    // Filter fields are required for these docking types
    const requiresFilter = ['FI', 'FB', 'BF'].includes(dockingType);

    if (requiresFilter && (!filterType || !filterLotNumber)) {
      return {
        filterRequired: 'Filter Type and Filter Lot Number are required for this docking type'
      };
    }

    return null;
  };
}
