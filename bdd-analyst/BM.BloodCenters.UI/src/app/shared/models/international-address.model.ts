/**
 * International Address Model
 * Matches backend: InternationalAddressDto
 * Used for cross-component communication (DPWIADDR functionality)
 */
export interface InternationalAddressModel {
  /** Street Address Line 1 (Required) */
  streetName: string;

  /** Street Address Line 2 */
  addr1?: string | null;

  /** Street Address Line 3 */
  addr2?: string | null;

  /** Street Address Line 4 */
  addr3?: string | null;

  /** Street Address Line 5 */
  addr4?: string | null;

  /** Country (Required) - from VALID_MASTER_CODES */
  country: string;

  /** Postal Code */
  postalCode?: string | null;

  /** Home Phone Number (Numeric only) */
  homePhoneNo?: string | null;

  /** Work Phone Number (Numeric only) */
  workPhoneNo?: string | null;

  /** Work Phone Extension (Numeric only) */
  workPhoneExt?: string | null;

  /** Mobile Phone Number (Numeric only) */
  mobilePhoneNo?: string | null;

  /** Fax Number (Numeric only) */
  faxNo?: string | null;

  /** Email Address */
  email?: string | null;

  /** International Address Flag ('Y' or 'N') */
  intlAddrFlag?: string;

  /** Modified Flag - tracks if any field has been changed */
  modifiedFlag?: string;
}

/**
 * Country Model for dropdown/autocomplete
 * Matches backend: CountryModel
 */
export interface CountryModel {
  codeType?: string;
  code: string;
  description: string;
}

/**
 * Request for validating international address.
 * Matches backend: ValidateInternationalAddressRequest
 */
export interface ValidateInternationalAddressRequest {
  streetName: string;
  addr1?: string | null;
  addr2?: string | null;
  addr3?: string | null;
  addr4?: string | null;
  country: string;
  postalCode?: string | null;
  homePhoneNo?: string | null;
  workPhoneNo?: string | null;
  workPhoneExt?: string | null;
  mobilePhoneNo?: string | null;
  faxNo?: string | null;
  email?: string | null;
}

/**
 * Request for saving international address and linking to target table.
 * Matches backend: SaveInternationalAddressRequest
 */
export interface SaveInternationalAddressRequest {
  address: InternationalAddressModel;
  targetTable: string;
  /** Primary key values in order matching backend PrimaryKeyColumns */
  recordKeyValues: string[];
  chapterId: string;
  existingAddressId?: number | null;
}

/**
 * Dialog data for InternationalAddressDialogComponent.
 * When targetTable is provided, the dialog saves to backend and links address.
 * When targetTable is null/empty, only the address form data is returned.
 */
export interface InternationalAddressDialogData {
  existingAddress?: InternationalAddressModel | null;
  /** Target table constant for self-contained save (e.g., 'SPONSOR_CONTACT') */
  targetTable?: string | null;
  /** Primary key values for linking address to target table */
  recordKeyValues?: string[];
  /** Chapter ID */
  chapterId?: string;
  /** Existing ADDRESS_ID to update (null for new) */
  existingAddressId?: number | null;
}
