export interface CustomerTierPricingDto {
  customer: string;
  tier: number;
  minimumAge: number;
  maximumAge: number;
  tierDay: number;
  unitPrice: number;
  effectiveDate: string | null;
  terminationDate: string | null;
  lastModifiedDate?: string;
}

export interface StandardTierDto {
  customer: string;
  tier: number;
  minimumAge: number;
  maximumAge: number;
  tierDay: number;
  unitPrice: number;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface CustomerLOV {
  customerId: string;
  customerName: string;
  phoneNo?: string;
}

export interface ProductTypeLOV {
  productTypeId: string;
  productTypeDesc: string;
  lifeSpan?: number;
  lifeSpanIndicator?: string;
  standardPrice?: number;
  standardTiers?: StandardTierDto[];
}

export interface DropdownValuesResponse {
  customers: CustomerLOV[];
  productTypes: ProductTypeLOV[];
}

export interface TierPricingItem {
  tier: number;
  fromDay: number;
  toDay: number;
  unitPrice: number;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface CreateCustomerTierPricingRequest {
  customerId: string;
  productType: string;
  tierPricingItems: TierPricingItem[];
}

export interface UpdateCustomerTierPricingDto {
  unitPrice: number;
  terminationDate: string | null;
}

export interface CustomerTierPricingQueryDto {
  customerId: string;
  productType: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CustomerTierPricingFilter {
  effectiveDatePeriod?: 'After' | 'Before';
  effectiveDate?: string | null;
  terminationDatePeriod?: 'After' | 'Before';
  terminationDate?: string | null;
}

export interface CustomerTierPricingFilterRequest {
  effectiveDatePeriod?: string | null;
  effectiveDate?: string | null;
  terminationDatePeriod?: string | null;
  terminationDate?: string | null;
}
