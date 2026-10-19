import { FilterValue, SetInventoryLevelDisplay } from '../models/setup-inventory-levels.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';

export class SetupInventoryLevelsFilterChipsUtils {
  static createFilterChips(filters: FilterValue, tableData?: SetInventoryLevelDisplay[]): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.productType) {
      const desc = this.findProductTypeDesc(filters.productType, tableData);
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}${desc ? ' - ' + desc : ''}`,
        value: filters.productType
      });
    }

    if (filters.aborh) {
      const desc = this.findBloodTypeDesc(filters.aborh, tableData);
      chips.push({
        key: 'aborh',
        label: `ABORh: ${filters.aborh}${desc ? ' - ' + desc : ''}`,
        value: filters.aborh
      });
    }

    if (filters.attribute) {
      const desc = this.findAttributeDesc(filters.attribute, tableData);
      chips.push({
        key: 'attribute',
        label: `Attribute: ${filters.attribute}${desc ? ' - ' + desc : ''}`,
        value: filters.attribute
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const operator = this.getDatePeriodSymbol(filters.effectiveDatePeriod);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const operator = this.getDatePeriodSymbol(filters.terminationDatePeriod);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: formattedDate
      });
    }

    return chips;
  }

  private static findProductTypeDesc(code: string, tableData?: SetInventoryLevelDisplay[]): string {
    if (!tableData) return '';
    const row = tableData.find(r => r.productType === code);
    return row?.productTypeDesc || '';
  }

  private static findBloodTypeDesc(code: string, tableData?: SetInventoryLevelDisplay[]): string {
    if (!tableData) return '';
    const row = tableData.find(r => r.bloodType === code);
    return row?.bloodTypeDesc || '';
  }

  private static findAttributeDesc(code: string, tableData?: SetInventoryLevelDisplay[]): string {
    if (!tableData) return '';
    const row = tableData.find(r => r.attribCode === code);
    if (!row) return '';
    return row.attribGroup ? `${row.attribGroup}` : '';
  }

  private static getDatePeriodSymbol(period: string): string {
    return period?.toLowerCase() === 'after' ? '≥' : '≤';
  }

  private static formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      return '-';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  static removeFilter(filters: FilterValue, chipKey: string): FilterValue {
    const updated = { ...filters };

    switch (chipKey) {
      case 'productType':
        delete updated.productType;
        break;
      case 'aborh':
        delete updated.aborh;
        break;
      case 'attribute':
        delete updated.attribute;
        break;
      case 'effectiveDate':
        delete updated.effectiveDate;
        delete updated.effectiveDatePeriod;
        break;
      case 'terminationDate':
        delete updated.terminationDate;
        delete updated.terminationDatePeriod;
        break;
    }

    return updated;
  }

  static clearAllFilters(): FilterValue {
    return {};
  }
}
