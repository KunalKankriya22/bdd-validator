export const API = {
  AUTH: {
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/api/v1/system-admin/password/forgot-temp-password',
    RESET_PASSWORD_WITH_TOKEN: '/api/v1/system-admin/password/reset-with-token',
    UPLOAD: '/api/v1/Auth/upload',
  },

  INSTITUTION: {
    CREATE: '/api/v1/institutions/Save-institution',
    GET: '/api/v1/institutions',
    UPDATE: '/api/v1/institutions/Update-institution/{instId}',
    STATES_LOOKUP: '/api/v1/chapters/states/lookup',
    COUNTRIES_LOOKUP: '/api/v1/chapters/countries/lookup',
    ALL_CHAPTERS: '/api/v1/institutions/all-chapters',
  },

  SYSTEM_PARAMETER: {
    GET: '/api/v1/system-parameters',
    POST: '/api/v1/system-parameter',
    PUT: '/api/v1/system-parameter',
    GET_BY_CODE: (code: string) => `/api/v1/donors/system-parameters/${code}`,
  },
  CHAPTER: {
    GET: '/api/v1/chapters',
    GET_BY_ID: (chapterId: string) => `/api/v1/chapters/${chapterId}`,
    WAREHOUSES: (chapterId: string) => `/api/v1/change-chapter-warehouse/chapters/${chapterId}/warehouses`,
    ACTIVE_LOOKUP: '/api/v1/chapters/active/lookup',
    STATES_LOOKUP: '/api/v1/chapters/states/lookup',
    COUNTRIES_LOOKUP: '/api/v1/chapters/countries/lookup',
    TIMEZONES_LOOKUP: '/api/v1/chapters/timezones/lookup',
  },

  SYSTEM_ADMIN: {
    GROUPS: '/api/v1/groups',
    PASSWORD_CONFIGURATION: '/api/v1/system-admin/password-configuration',
    PASSWORD_CONFIG_BY_USER: (username: string) => `/api/v1/system-users/password-config/${encodeURIComponent(username)}`,
    UPDATE_PASSWORD: '/api/v1/change-password/update-password',
    VALIDATE_PASSWORD_HISTORY: '/api/v1/change-password/validate-password-history',
    GENERATE_TEMP_PASSWORD: '/api/v1/system-admin/password/generate-temp-password',
    SEND_TEMP_PASSWORD: '/api/v1/system-admin/password/send-temp-password',
    PASSWORD_RESET: '/api/v1/system-admin/password-reset',
    APPLICATION_SEQUENCE_NUMBERS: (take: number, skip: number) =>
      `/api/v1/system-admin/application-sequence-numbers/${take}/${skip}`,
    ADD_APPLICATION_SEQUENCE_NUMBER: '/api/v1/system-admin/application-sequence-number',
    UPDATE_APPLICATION_SEQUENCE_NUMBER: (chapterId: string, numberType: string) =>
      `/api/v1/system-admin/application-sequence-number/${encodeURIComponent(chapterId)}/${encodeURIComponent(numberType)}`,
    APPLICATION_SEQUENCE_NUMBERS_FILTER_DROPDOWN: '/api/v1/system-admin/application-sequence-numbers/filter-dropdown-values',

    MANAGE_USERS: {
      ADD_NEW_USER: {
        CHAPTER_LOOKUP: 'api/v1/chapters/lookup',
        WAREHOUSE_LOOKUP: 'api/v1/system-users/GetWarehouses',
        LABCODE_LOOKUP: 'api/v1/system-users/GetLabCodes',
        PRINTER_LOOKUP: 'api/v1/system-users/GetPrinterCodes',
        GROUP_LOOKUP: 'api/v1/groups',
        ACCESS_LEVEL_LOOKUP: 'api/v1/system-users/GetAccessLevels',
        CREATEUSER: 'api/v1/system-users/create-system-user',
      },
      GET_USER: (userId: string) => `api/v1/system-users/${userId}`,
      GET_USER_GROUP: (userId: string) => `api/v1/system-users/group-details/${userId}`,
      GET_USER_CHAPTERS: (userId: string) => `api/v1/system-users/${userId}/chapters`,
      UPDATE_USER: (userId: string) => `api/v1/system-users/${userId}`,
    },
    REPORT_MASTER_TABLE: (take: number, skip: number) =>
      `/api/v1/admin/report-master-table/${take}/${skip}`,
    REPORT_MASTER_TABLE_FILTERS: '/api/v1/admin/report-master-table-filters',
    REPORT_MASTER_TABLE_ADD_DROPDOWN: '/api/v1/admin/report-master-table-add-dropdown',
    REPORT_PARAMETERS: '/api/v1/system-admin/report-parameters',
    REPORT_NAMES: '/api/v1/system-admin/report-names',
    REPORT_PARAMETER_FILTERS: '/api/v1/system-admin/report-parameters/parameter-types',
    REPORT_DETAILS: (reportName: string) => `/api/v1/system-admin/reports/${reportName}`,
    SAVE_REPORT_PARAMETER_DEFINITION: '/api/v1/system-admin/report-parameter-definition',
    GET_REPORT_PARAMETER_DEFINITION: (reportName: string) =>
      `/api/v1/system-admin/report-parameter-definition/${reportName}`,
    CREATE_REPORT_MASTER: '/api/v1/system-admin/report-master', // POST
    UPDATE_REPORT_MASTER: '/api/v1/system-admin/report-master/update', // PUT with query params (for report-master-table)
    UPDATE_REPORT: (reportId: string) => `/api/v1/system-admin/reports/${reportId}`, // PUT (for report-admin)
    DELETE_REPORT_MASTER: '/api/v1/admin/report-master-table', // DELETE (requires JSON body)

    MENU_ADMIN: {
      ADD_FUNCTIONS: '/api/v1/system-admin/menu-admin/add-functions',
      MENU_GROUPS: '/api/v1/menu/menu-groups',
      ONSITE_MENU_GROUPS: '/api/v1/menu/onsite-menu-groups',
      MENU_LISTS: (groupId: string) => `/api/v1/groups/${groupId}/menu-lists`,
      UPDATE_ACCESS: (groupId: string) => `/api/v1/groups/${groupId}/update-access`,
      MOVE_MENU_ITEM: (fcnId: number) => `/api/v1/groups/menu-items/${fcnId}/move`,
      ADD_MENU_ITEM: '/api/v1/groups/menu-items',
      UPDATE_MENU_ITEM: (fcnId: string) => `/api/v1/groups/menu-items/${fcnId}`,
    },

    DEFINE_USER_ACCESS: {
      GET_ALL: '/api/v1/define-user-access',
      ATTACHED_USERS: (accessClass: string) => `/api/v1/define-user-access/attached-users/${accessClass}`,
      ACCESS_CLASSES: '/api/v1/define-user-access/access-classes',
      ASSIGN: '/api/v1/define-user-access/assign',
      UPDATE: (userId: string, accessClass: string) => `/api/v1/define-user-access/${userId}/${accessClass}`,
      USERS_DROPDOWN: '/api/v1/define-user-access/users-dropdown',
      OVERLAPPING_INTERDICTIONS: (userId: string) => `/api/v1/define-user-access/overlapping-interdictions/${encodeURIComponent(userId)}`,
      USER_CLASSES: (userId: string) => `/api/v1/define-user-access/user-classes?userId=${encodeURIComponent(userId)}`,
    },

    LAB_USER_ACCESS: {
      GET_USER_ACCOUNTS: '/api/v1/donors/User/GetUserAccounts',
      GET_DETAILS: '/api/v1/lab-user-access/details',
      INSERT: '/api/v1/lab-user-access/insertlabaccessdetails',
      UPDATE: (accessClass: string) => `/api/v1/lab-user-access/updatelabaccessdetails/${accessClass}`,
      ACCESS_CLASSES_DROPDOWN: '/api/v1/lab-user-access/access-classes-dropdown',
      USERS_DROPDOWN: '/api/v1/lab-user-access/users-dropdown',
      ATTACHED_USERS: (accessClass: string) => `/api/v1/lab-user-access/attached-users/${accessClass}`,
      ACCESS_LEVEL_DROPDOWN: '/api/v1/lab-user-access/access-level-dropdown',
    },

    VALID_WAREHOUSE_USERS: {
      GET: '/api/v1/valid-warehouse-users',
      GET_BY_USER: (userId: string) => `/api/v1/valid-warehouse-users/${encodeURIComponent(userId)}`,
      POST: '/api/v1/valid-warehouse-users',
      POST_BY_USER: (userId: string) => `/api/v1/valid-warehouse-users/${encodeURIComponent(userId)}`,
      PUT: '/api/v1/valid-warehouse-users',
      // LOV endpoints - data from master tables per Oracle Forms XML
      LOV_USERS: '/api/v1/valid-warehouse-users/lov/users',
      LOV_DROPDOWNS: '/api/v1/valid-warehouse-users/lov/dropdowns',
      LOV_PRINTERS: (warehouseId: string) => `/api/v1/valid-warehouse-users/lov/printers/${encodeURIComponent(warehouseId)}`,
    },

    USER_ACCESS: {
      // GET /api/v1/system-users/active-users
      ACTIVE_USERS: '/api/v1/system-users/active-users',

      // POST /api/v1/system-users/{userId}/menu-items/{take}/{skip}
      MENU_ITEMS: (userId: string, take: number, skip: number) =>
        `/api/v1/system-users/${userId}/menu-items/${take}/${skip}`,

      // GET /api/v1/system-users/menu-items/{mnemonic}/users/{userId}/{take}/{skip}
      MENU_USERS: (mnemonic: string, userId: string, take: number, skip: number) =>
        `/api/v1/system-users/menu-items/${mnemonic}/users/${userId}/${take}/${skip}`,

      // GET /api/v1/system-users/menu-items/filters
      MENU_FILTERS: '/api/v1/system-users/menu-items/filters',

      // POST /api/v1/system-users/{userId}/interdictions/{take}/{skip} (returns Access Classes data)
      ACCESS_CLASSES: (userId: string, take: number, skip: number) =>
        `/api/v1/system-users/${userId}/interdictions/${take}/${skip}`,

      // GET /api/v1/system-users/interdictions/filters
      ACCESS_CLASSES_FILTERS: '/api/v1/system-users/interdictions/filters',

      // POST /api/v1/system-users/{userId}/interdictions/{accessClass}/users/{take}/{skip}
      ACCESS_CLASSES_USERS: (userId: string, accessClass: string, take: number, skip: number) =>
        `/api/v1/system-users/${userId}/interdictions/${accessClass}/users/${take}/${skip}`,

      // POST /api/v1/system-users/interdictions/{accessClass}/associated/{take}/{skip}
      ACCESS_CLASSES_INTERDICTIONS: (accessClass: string, take: number, skip: number) =>
        `/api/v1/system-users/interdictions/${accessClass}/associated/${take}/${skip}`,

      // GET /api/v1/system-users/group-details/{userId}
      GROUP_DETAILS: (userId: string) => `/api/v1/system-users/group-details/${userId}`,
    },

    // Access Class by Interdiction Code endpoints
    ACCESS_CLASS_BY_INTER_CODE: '/api/v1/system-administration/access-class-by-inter-code',
    ACCESS_CLASS_BY_INTER_CODE_USERS: (accessClass: string) =>
      `/api/v1/system-administration/access-class-by-inter-code/${accessClass}/users`,
    ACCESS_CLASS_BY_INTER_CODE_INTERDICTIONS: (accessClass: string) =>
      `/api/v1/system-administration/access-class-by-inter-code/${accessClass}/interdictions`,
    ACCESS_CLASS_BY_INTER_CODE_LOV_INTERDICTION_CODES:
      '/api/v1/system-administration/access-class-by-inter-code/lov/interdiction-codes',
  },
  APPLICATION_ADMIN: {
    DONOR_ERROR_CODES: (take: number, skip: number) =>
      `/api/v1/application-admin/donor-error-codes/${take}/${skip}`,
    DONOR_ERROR_CODE: '/api/v1/application-admin/donor-error-code',
    IS_CODE_EXISTS: (code: string) => `/api/v1/application-admin/is-code/${code}`,
    LAB_ERROR_CODES: (take: number, skip: number) =>
      `/api/v1/admin/lab-error-codes/${take}/${skip}`,
    LAB_ERROR_CODE: '/api/v1/admin/lab-error-code',
    DISTRIBUTION_ERROR_CODES: (take: number, skip: number) =>
      `/api/v1/application-admin/distribution-error-codes/${take}/${skip}`,
    DISTRIBUTION_ERROR_CODE: '/api/v1/application-admin/distribution-error-code',
    ASSIGN_INTERDICTION_CLASS: (take: number, skip: number) =>
      `/api/v1/admin/assign-interdiction-class/${take}/${skip}`,
    ASSIGN_INTERDICTION_CLASS_FILTERS: '/api/v1/admin/assign-interdiction-class-filters',
    GET_DESCRIPTION_AND_TYPE_INTERDICTION_CODE: (inter_code: string) => `/api/v1/application-admin/lab-interdictions/${inter_code}`,
    GET_LAB_INTERDICTION_BY_CODE: (inter_code: string) => `/api/v1/application-admin/lab-interdictions/${encodeURIComponent(inter_code)}`,
    ADD_EDIT_INTERDICTION_CLASS: '/api/v1/admin/assign-interdiction-class',
    INTERDICTION_UPGRADE_MATRIX: (take: number, skip: number) =>
      `/api/v1/admin/interdiction-upgrade-matrix/${take}/${skip}`,
    INTERDICTION_UPGRADE_MATRIX_ADD_EDIT: '/api/v1/admin/interdiction-upgrade-matrix',
    INTERDICTION_UPGRADE_MATRIX_FILTERS: '/api/v1/admin/interdiction-upgrade-matrix-filters',
    INTERDICTION_CODES: '/api/v1/admin/interdiction-codes',
    INVENTORY_PRODUCT_TYPES: '/api/v1/admin/inventory-product-type-substitution/product-types',
    ABO_TYPES: '/api/v1/admin/abo-types',
    DEFINE_DONATION_TYPES: (take: number, skip: number) =>
      `/api/v1/donation-types/${take}/${skip}`,
    GROUP_SITES: (take: number, skip: number) =>
      `/api/v1/admin/group-sites/${take}/${skip}`,
    GROUP_SITES_ADD_EDIT: '/api/v1/admin/group-sites',
    GROUP_SITES_BY_ID: (chapterId: number, groupSiteId: number) =>
      `/api/v1/admin/group-sites/${chapterId}/${groupSiteId}`,
    GROUP_SITES_CHAPTERS: '/api/v1/admin/group-sites/chapters',
    GROUP_SITES_FILTERS: '/api/v1/admin/group-sites/filters',
    VALID_PRODUCT_SUBSTITUTION: (take: number, skip: number) =>
      `/api/v1/admin/inventory-product-type-substitution/${take}/${skip}`,
    VALID_PRODUCT_SUBSTITUTION_ADD_EDIT: '/api/v1/admin/inventory-product-type-substitution',
    VALID_PRODUCT_SUBSTITUTION_FILTERS: '/api/v1/admin/inventory-product-type-substitution/filter-dropdown',
    BOX_CAPACITY: (take: number, skip: number) =>
      `/api/v1/admin/box-capacity/${take}/${skip}`,
    BOX_CAPACITY_ADD_EDIT: '/api/v1/admin/box-capacity',
    BOX_CAPACITY_FILTERS: '/api/v1/admin/box-capacity/filters',
    BOX_CAPACITY_LOOKUPS: '/api/v1/admin/box-capacity/lookups',
    CUSTOMER_PREFERRED_TIER: {
      GET_ALL: '/api/v1/customer-preferred-tiers',
      GET_BY_ID: (customerId: string, productType: string) =>
        `/api/v1/customer-preferred-tiers/${encodeURIComponent(customerId)}/${encodeURIComponent(productType)}`,
      CREATE: (customerId: string) =>
        `/api/v1/customer-preferred-tiers/${encodeURIComponent(customerId)}`,
      UPDATE: (customerId: string, productType: string) =>
        `/api/v1/customer-preferred-tiers/${encodeURIComponent(customerId)}/${encodeURIComponent(productType)}`,
      DELETE: (customerId: string, productType: string) =>
        `/api/v1/customer-preferred-tiers/${encodeURIComponent(customerId)}/${encodeURIComponent(productType)}`,
      DROPDOWN_CUSTOMERS: '/api/v1/customer-preferred-tiers/dropdowns/customers',
      DROPDOWN_PRODUCT_TYPES: '/api/v1/customer-preferred-tiers/dropdowns/product-types',
      DROPDOWN_PRICING_TIERS: '/api/v1/customer-preferred-tiers/dropdowns/pricing-tiers',
      DROPDOWN_FILTER_PRODUCT_TYPES: '/api/v1/customer-preferred-tiers/dropdowns/filter-product-types'
    },
    DAYLIGHT_SAVINGS: (take: number, skip: number) =>
      `/api/v1/admin/daylight-savings/${take}/${skip}`,
    DAYLIGHT_SAVINGS_ADD_EDIT: '/api/v1/admin/daylight-savings',
    DAYLIGHT_SAVINGS_FILTERS: '/api/v1/admin/daylight-savings-filters',
    DAYLIGHT_SAVINGS_DROPDOWN: '/api/v1/admin/daylight-savings-dropdown',
    DAYLIGHT_SAVINGS_TIMEZONE_REGIONS: '/api/v1/admin/daylight-savings-timezone-regions',
    DAYLIGHT_SAVINGS_CHAPTERS: '/api/v1/admin/daylight-savings-chapters',
    EXTERNAL_BC_DATA_TRANSLATE: (take: number, skip: number, sourceId: string, targetId: string) =>
      `/api/v1/external-data-translate/search-sort-filter/${take}/${skip}/${encodeURIComponent(sourceId)}/${encodeURIComponent(targetId)}`,
    EXTERNAL_BC_DATA_TRANSLATE_DROPDOWNS: '/api/v1/external-data-translate/dropdowns',
    EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS: (sourceId: string, targetId: string) =>
      `/api/v1/external-data-translate/filter-dropdowns/${encodeURIComponent(sourceId)}/${encodeURIComponent(targetId)}`,
    EXTERNAL_BC_DATA_TRANSLATE_SOURCE_CODE_DESCRIPTION: (code: string) =>
      `/api/v1/external-data-translate/source-code-description/${encodeURIComponent(code)}`,
    EXTERNAL_BC_DATA_TRANSLATE_TARGET_VALUES_BY_CODE_TYPE: (targetCodeType: string) =>
      `/api/v1/external-data-translate/target-values/${encodeURIComponent(targetCodeType)}`,
    ADD_EXTERNAL_BC_DATA_TRANSLATE: '/api/v1/external-data-translate',
    UPDATE_EXTERNAL_BC_DATA_TRANSLATE: '/api/v1/external-data-translate',
    TIMEZONES: '/api/v1/admin/timezones',
    ASSIGN_USER_INTERDICTION_CLASS: (take: number, skip: number) =>
      `/api/v1/application-admin/user-interdiction-class/${take}/${skip}`,
    ADD_EDIT_USER_INTERDICTION_CLASS: '/api/v1/application-admin/assign-user-interdiction-class',
    GET_USERS: '/api/v1/application-admin/user-interdiction-class/lookups/users',
    GET_INTERDICTION_CLASSES: '/api/v1/application-admin/user-interdiction-class/lookups/interdiction-classes',
    GET_INTERDICTION_CLASS_BY_CODE: (code: string) => `/api/v1/application-admin/interdiction-classes/${code}`,

    // New User Interdiction Class endpoints
    CREATE_USER_INTERDICTION_CLASS: '/api/v1/application-admin/user-interdiction-class',
    UPDATE_USER_INTERDICTION_CLASS: (userId: string, interClass: string) =>
      `/api/v1/application-admin/user-interdiction-class/${userId}/${interClass}`,
    GET_USER_INTERDICTION_CLASS_BY_ID: (userId: string, interClass: string) =>
      `/api/v1/application-admin/user-interdiction-class/${userId}/${interClass}`,

    // Valid Scan Scale Interfaces endpoints
    VALID_SCAN_INTERFACES: '/api/v1/admin/valid-scan-scale-interfaces',
    CREATE_VALID_SCAN_INTERFACE: '/api/v1/admin/valid-scan-scale-interfaces',
    UPDATE_VALID_SCAN_INTERFACE: '/api/v1/admin/valid-scan-scale-interfaces',
    SCAN_TYPE_LOOKUP: '/api/v1/admin/valid-scan-scale-interfaces/scan-type-lookup',

    RETURN_REASONS: (take: number, skip: number) =>
      `/api/v1/admin/return-reasons/${take}/${skip}`,
    RETURN_REASONS_GET_BY_ID: (chapterId: string, code: string) =>
      `/api/v1/admin/return-reasons/${chapterId}/${code}`,
    RETURN_REASONS_ADD_EDIT: '/api/v1/admin/return-reasons',
    RETURN_REASONS_LOCATION_TYPES: '/api/v1/admin/return-reasons/location-types',
    RETURN_REASONS_CHARGE_CODES: (excludeCode?: string) =>
      excludeCode ? `/api/v1/admin/return-reasons/charge-codes?excludeCode=${excludeCode}` : '/api/v1/admin/return-reasons/charge-codes',
    VALID_OPERATORS: (take: number, skip: number) =>
      `/api/v1/valid-operators/${take}/${skip}`,
    VALID_OPERATORS_ADD: '/api/v1/valid-operators',
    VALID_OPERATORS_UPDATE: (operatorCode: string) =>
      `/api/v1/valid-operators/${operatorCode}`,
    VENIPUNCTURE_ATTRIBUTES: (take: number, skip: number) =>
      `/api/v1/venipuncture-attributes/${take}/${skip}`,
    VENIPUNCTURE_ATTRIBUTES_ADD: '/api/v1/venipuncture-attributes',
    VENIPUNCTURE_ATTRIBUTES_GET: (group: string, code: string) =>
      `/api/v1/venipuncture-attributes/${encodeURIComponent(group)}/${encodeURIComponent(code)}`,
    VENIPUNCTURE_ATTRIBUTES_UPDATE: (group: string, code: string) =>
      `/api/v1/venipuncture-attributes/${encodeURIComponent(group)}/${encodeURIComponent(code)}`,
    VENIPUNCTURE_ATTRIBUTES_FILTERS: '/api/v1/venipuncture-attributes/codes',
    VENIPUNCTURE_ATTRIBUTES_GROUPS: '/api/v1/venipuncture-attributes/groups',
    DEFINE_DURATION_BETWEEN_PROCEDURES: (take: number, skip: number) =>
      `/api/v1/define-duration/valid-eligible-procedures/${take}/${skip}`,
    DEFINE_DURATION_BETWEEN_PROCEDURES_FILTERS: '/api/v1/define-duration/valid-eligible-procedures-filters',
    DEFINE_DURATION_BETWEEN_PROCEDURES_CRUD: '/api/v1/define-duration/valid-eligible-procedures',
    DEFINE_DURATION_LOOKUPS: {
      DONATION_TYPES: '/api/v1/define-duration/lookups/donation-types',
      PROCEDURE_CODES: '/api/v1/define-duration/lookups/procedure-codes'
    },
    // Eligible Plasma Cell Loss endpoints
    ELIGIBLE_PLASMA_CELL_LOSS: {
      FILTER_OPTIONS: '/api/v1/application-administration/eligible-plasma-cell-loss/filter-options',
      GET_RECORDS: '/api/v1/application-administration/eligible-plasma-cell-loss/get-records',
      GET_BY_AUDIT_KEY: (auditKey: string) => `/api/v1/application-administration/eligible-plasma-cell-loss/${auditKey}`,
      ADD_RECORD: '/api/v1/application-administration/eligible-plasma-cell-loss/add-record',
      UPDATE_RECORD: (auditKey: string) => `/api/v1/application-administration/eligible-plasma-cell-loss/update-record/${auditKey}`,
      DELETE_RECORD: (auditKey: string) => `/api/v1/application-administration/eligible-plasma-cell-loss/delete-record/${auditKey}`,
      VALIDATE_DUPLICATE: '/api/v1/application-administration/eligible-plasma-cell-loss/validate-duplicate'
    },
    REGISTRATION_HOLDS_MAPPING_GET_BY_CODE: (take: number, skip: number) => `/api/v1/application-admin/registration-holds-mapping/get-by-code/${take}/${skip}`,
    REGISTRATION_HOLDS_MAPPING_FILTERS: '/api/v1/application-admin/registration-holds-mapping/filters',
    REGISTRATION_HOLDS_MAPPING_CREATE: '/api/v1/application-admin/registration-holds-mapping/create',
    REGISTRATION_HOLDS_MAPPING_UPDATE: '/api/v1/application-admin/registration-holds-mapping/update',
    REGISTRATION_HOLDS_MAPPING_DROPDOWNS: '/api/v1/application-admin/registration-holds-mapping/dropdowns',
    REGISTRATION_HOLDS_MAPPING_DESCRIPTION: (code: string) => `/api/v1/application-admin/registration-holds-mapping/description/${code}`,
    REGISTRATION_HOLDS: '/api/v1/admin/registration-holds',
    
    // Valid ABO endpoints
    VALID_ABO_GET_ALL: '/api/v1/valid-abo',
    VALID_ABO: (take: number, skip: number) => `/api/v1/valid-abo/search-sort-filter/${take}/${skip}`,
    VALID_ABO_BY_CODE: (code: string) => `/api/v1/valid-abo/${code}`,
    VALID_ABO_FILTERS: '/api/v1/valid-abo/dropdowns',
    VALID_ABO_LOOKUPS: '/api/v1/valid-abo/lookups',
    VALID_ABO_CREATE: '/api/v1/valid-abo',
    VALID_ABO_UPDATE: '/api/v1/valid-abo',
    VALID_ABO_DELETE: (code: string) => `/api/v1/valid-abo/${code}`,

    // Valid City State endpoints
    VALID_CITY_STATE_BASE: '/api/v1/valid-city-state',
    VALID_CITY_STATE_QUERY: (take: number, skip: number) => `/api/v1/valid-city-state/${take}/${skip}`,
    VALID_CITY_STATE_GET_BY_ID: (uspsId: number) => `/api/v1/valid-city-state/${uspsId}`,
    VALID_CITY_STATE_CREATE: '/api/v1/valid-city-state',
    VALID_CITY_STATE_UPDATE: (uspsId: number) => `/api/v1/valid-city-state/${uspsId}`,
    VALID_CITY_STATE_STATES: '/api/v1/valid-city-state/states',
    VALID_CITY_STATE_CITIES: (state: string) => `/api/v1/valid-city-state/cities?state=${encodeURIComponent(state)}`,
    VALID_CITY_STATE_COUNTIES: (state: string, city: string) => `/api/v1/valid-city-state/counties?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`,

    // Valid FF Flag endpoints
    VALID_FF_FLAG: '/api/v1/admin/valid-ff-values',
    VALID_FF_FLAG_FILTERS: '/api/v1/admin/valid-ff-values/filter-dropdown',
    VALID_FF_FLAG_ADD_CHAPTERS: '/api/v1/admin/valid-ff-values/add-dropdown/chapters',
    VALID_FF_FLAG_ADD_COLLECTION_FACILITIES: '/api/v1/admin/valid-ff-values/add-dropdown/collection-facilities',
    VALID_FF_FLAG_ADD_SOURCE_TYPES: '/api/v1/admin/valid-ff-values/add-dropdown/source-types',
    VALID_FF_FLAG_CREATE: '/api/v1/admin/valid-ff-values/create',
    VALID_FF_FLAG_UPDATE: '/api/v1/admin/valid-ff-values/update',

    ADD_DONATION_TYPE: '/api/v1/donation-types',
    UPDATE_DONATION_TYPE: '/api/v1/donation-types',
    DONATION_TYPE_FILTERS: '/api/v1/donation-types/donation-type-filters',
    VALID_FACILITY_IDENTIFIERS: (take: number, skip: number) =>
      `/api/v1/valid-facility-identifiers/${take}/${skip}`,
    ADD_VALID_FACILITY_IDENTIFIER: '/api/v1/valid-facility-identifiers',
    UPDATE_VALID_FACILITY_IDENTIFIER: '/api/v1/valid-facility-identifiers',
    VALID_FACILITY_IDENTIFIERS_CHAPTERS: '/api/v1/valid-facility-identifiers/chapters',
    VALID_FACILITY_IDENTIFIERS_ACTIVE_CHAPTERS: '/api/v1/valid-facility-identifiers/active-chapters',
    DEFINE_PROCEDURE_GROUPS: (take: number, skip: number) =>
      `/api/v1/procedure-groups/${take}/${skip}`,
    PROCEDURE_GROUP_FILTERS: '/api/v1/procedure-groups/filters',
    PROCEDURE_GROUP: '/api/v1/procedure-groups',
    PROCEDURE_GROUP_UPDATE: (procedureGroup: string, procedureCode: string, effectiveDate: string) =>
      `/api/v1/procedure-groups/${procedureGroup}/${procedureCode}/${effectiveDate}`,
    PROCEDURE_GROUP_USER_CONTEXT: (userId: string) =>
      `/api/v1/procedure-groups/user/context/${userId}`,
    PROCEDURE_GROUP_LOOKUPS: {
      PROCEDURE_GROUPS: '/api/v1/procedure-groups/lookups/procedure-groups',
      PROCEDURE_CODES: '/api/v1/procedure-groups/lookups/procedure-codes',
      CREDIT_COUNTS: '/api/v1/procedure-groups/lookups/credit-counts'
    },
    PROCEDURE_GROUP_FILTER_LOOKUPS: {
      PROCEDURE_GROUPS: '/api/v1/procedure-groups/filters/procedure-groups',
      PROCEDURE_CODES: '/api/v1/procedure-groups/filters/procedure-codes'
    },

    // Procedure Exclusions endpoints
    DEFINE_PROCEDURE_EXCLUSIONS: (take: number, skip: number) =>
      `/api/v1/admin/procedure-exclusion/${take}/${skip}`,
    PROCEDURE_EXCLUSION_FILTERS: '/api/v1/admin/procedure-exclusion/filters',
    PROCEDURE_EXCLUSION_LOOKUPS: '/api/v1/admin/procedure-exclusion/lookups',
    PROCEDURE_EXCLUSION_CREATE: '/api/v1/admin/procedure-exclusion',
    PROCEDURE_EXCLUSION_UPDATE: '/api/v1/admin/procedure-exclusion',
    PROCEDURE_EXCLUSION_PROCEDURE_CODES: (donationType: string) =>
      `/api/v1/admin/procedure-exclusion/procedure-codes/${encodeURIComponent(donationType)}`,

    // Procedure Code endpoints
    PROCEDURE_CODES: (take: number, skip: number) => `/api/v1/application-admin/valid-procedure-types/${take}/${skip}`,
    PROCEDURE_CODE_BY_CODE: (code: string) => `/api/v1/application-admin/valid-procedure-types/${code}`,
    PROCEDURE_CODE_FILTERS: '/api/v1/application-admin/procedure-code-filters',
    PROCEDURE_CODE_CREATE: '/api/v1/application-admin/valid-procedure-types',
    PROCEDURE_CODE_UPDATE: (procedureCode: string) => `/api/v1/application-admin/valid-procedure-types/${procedureCode}`,

    // Valid Donation Type/Procedure Code (Donation/Procedure Mapping) endpoints
    VALID_DONATION_PROC_ATTRIBUTES_GET: (take: number, skip: number) => `/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-proc-attributes-get-details/${take}/${skip}`,
    VALID_DONATION_PROC_ATTRIBUTES_ADD: '/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-proc-attributes-add-record',
    VALID_DONATION_PROC_ATTRIBUTES_UPDATE: '/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-proc-attributes-update-record',
    VALID_DONATION_PROC_ATTRIBUTES_DONATION_TYPES_LOV: '/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-proc-attributes-donation-types-lov',
    VALID_DONATION_PROC_ATTRIBUTES_PROCEDURE_CODES_LOV: '/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-proc-attributes-procedure-codes-lov',
    VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_GROUPS_LOV: '/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-proc-attributes-attrib-groups-lov',
    VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_CODES_LOV: '/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-proc-attributes-attrib-codes-lov',
    VALID_DONATION_PROC_ATTRIBUTES_DONATION_TYPES_FILTER: '/api/v1/application-administration/valid-donation-proc-attributes/valid-donation-types-filter',
    VALID_DONATION_PROC_ATTRIBUTES_PROCEDURE_CODES_FILTER: '/api/v1/application-administration/valid-donation-proc-attributes/valid-procedure-codes-filter',
    VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_GROUPS_FILTER: '/api/v1/application-administration/valid-donation-proc-attributes/valid-attrib-groups-filter',

    // Instrument Test Results endpoints (INTSTRS - MLT-12476)
    INSTRUMENT_TEST_RESULTS: {
      BASE: '/api/v1/instrument-test-results',
      GET_ALL: (take: number, skip: number) => `/api/v1/instrument-test-results/${take}/${skip}`,
      GET_BY_ID: (chapterId: string, machineId: string, testId: string, resultStatus: string) =>
        `/api/v1/instrument-test-results/${encodeURIComponent(chapterId)}/${encodeURIComponent(machineId)}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}`,
      CREATE: '/api/v1/instrument-test-results',
      UPDATE: (chapterId: string, machineId: string, testId: string, resultStatus: string) =>
        `/api/v1/instrument-test-results/${encodeURIComponent(chapterId)}/${encodeURIComponent(machineId)}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}`,
      DELETE: (chapterId: string, machineId: string, testId: string, resultStatus: string) =>
        `/api/v1/instrument-test-results/${encodeURIComponent(chapterId)}/${encodeURIComponent(machineId)}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}`,
      MACHINES_DROPDOWN: '/api/v1/instrument-test-results/machines/dropdown',
      TESTS_DROPDOWN: (machineId: string) => `/api/v1/instrument-test-results/tests/dropdown/${encodeURIComponent(machineId)}`,
      RESULT_STATUSES_DROPDOWN: (testId: string) => `/api/v1/instrument-test-results/result-statuses/dropdown/${encodeURIComponent(testId)}`,
    },

    DRIVES: (take: number, skip: number) => `/api/v1/drives/details/${take}/${skip}`,
    DRIVES_INSERT: '/api/v1/drives/insert',
    DRIVES_UPDATE: '/api/v1/drives/update',
    DRIVES_FILTERS: '/api/v1/admin/drives-filters',
    DRIVES_CHAPTER_LOOKUP: '/api/v1/chapters/lookup',
    DRIVES_TYPES: '/api/v1/admin/drives/types',
    DRIVES_GROUP_SITES: '/api/v1/drives/group-sites',
    DRIVES_GROUP_SITES_FILTER: '/api/v1/drives/group-sites-filtered-by-drives',
    DRIVES_TYPES_FILTER: '/api/v1/drives/drive-types-filtered-by-drives',
    DRIVES_FILTER: '/api/v1/drives/drive-filter',  
    DRIVES_GROUP_SITE_BY_ID: (groupSiteId: string) => `/api/v1/drives/group-sites/${encodeURIComponent(groupSiteId)}`,
    DONOR_GRADING_MATRIX: (take: number, skip: number) =>
      `/api/v1/donor-grading-matrix/${take}/${skip}`,
    DONOR_GRADING_MATRIX_ADD: '/api/v1/donor-grading-matrix',
    DONOR_GRADING_MATRIX_UPDATE: (dgmId: number) =>
      `/api/v1/donor-grading-matrix/${dgmId}`,

    // ABO Product Compatibility endpoints
    ABO_PRODUCT_COMPATIBILITY: (take: number, skip: number) =>
      `/api/v1/admin/abo-product-compatibility/${take}/${skip}`,
    ABO_PRODUCT_COMPATIBILITY_ADD_EDIT: '/api/v1/admin/abo-product-compatibility',
    ABO_PRODUCT_COMPATIBILITY_FILTERS: '/api/v1/admin/abo-product-compatibility/filter-dropdown-values',
    ABO_PRODUCT_COMPATIBILITY_ADD_DROPDOWN_VALUES: '/api/v1/admin/abo-product-compatibility/add-dropdown-values',

    // Antigen Tests endpoints
    ANTIGEN_TESTS_GET_DETAILS: (take: number, skip: number) => `/api/v1/application-administration/antigen-test/details/${take}/${skip}`,
    ANTIGEN_TESTS_BULK_UPSERT: '/api/v1/application-administration/antigen-test/details/bulk-upsert',
    ANTIGEN_TESTS_DELETE: (antigenId: string) => `/api/v1/application-administration/antigen-test/${encodeURIComponent(antigenId)}`,
    BAR_CODE_TRANSLATIONS: (take: number, skip: number) =>
      `/api/v1/bar-code-translations/${take}/${skip}`,
    BAR_CODE_TRANSLATIONS_ADD: '/api/v1/bar-code-translations',
    BAR_CODE_TRANSLATIONS_UPDATE: (machineCode: string) =>
      `/api/v1/bar-code-translations/${machineCode}`,
    BAR_CODE_TRANSLATIONS_MACHINE_CODES: '/api/v1/bar-code-translations/machine-codes',
    BAR_CODE_TRANSLATIONS_EYE_READ: '/api/v1/bar-code-translations/eye-read-translations',

    // Define Tests Lab endpoints
    DEFINE_TESTS_LAB_TEST_IDS: '/api/v1/define-tests-lab/test-ids',
    DEFINE_TESTS_LAB_BY_ID: (testId: string) => `/api/v1/define-tests-lab/${testId}`,
    DEFINE_TESTS_LAB_DROPDOWNS: '/api/v1/define-tests-lab/dropdowns',
    DEFINE_TESTS_LAB_DROPDOWNS_TEST_GROUPS: '/api/v1/define-tests-lab/dropdowns/test-groups',
    DEFINE_TESTS_LAB_DROPDOWNS_RESULT_CODES: '/api/v1/define-tests-lab/dropdowns/result-codes',
    DEFINE_TESTS_LAB_INTERDICTION_CODES_BY_TESTID: (testId: string) => `/api/v1/define-tests-lab/interdiction-codes/${testId}`,
    DEFINE_TESTS_LAB_ACTIVE_TEST_IDS: '/api/v1/define-tests-lab/active-test-ids',
    DEFINE_TESTS_LAB_CREATE: '/api/v1/define-tests-lab',
    DEFINE_TESTS_LAB_UPDATE: (testId: string) => `/api/v1/define-tests-lab/${testId}`,
    DEFINE_TEST_RESULTS_LAB_FILTER_VALUES: '/api/v1/define-test-results-lab/filter-values',
    DEFINE_TEST_RESULTS_LAB_DROPDOWNS_INTERDICTIONS: '/api/v1/define-test-results-lab/dropdowns/interdictions',
    DEFINE_TEST_RESULTS_LAB_DROPDOWNS_ATTRIBUTES: '/api/v1/define-test-results-lab/dropdowns/attributes',
    DEFINE_TEST_RESULTS_LAB_DROPDOWNS_RESULT_CODES: '/api/v1/define-test-results-lab/dropdowns/result-codes',
    DEFINE_TEST_RESULTS_LAB_DROPDOWNS_TESTS: '/api/v1/define-test-results-lab/dropdowns/tests',
    DEFINE_TEST_RESULTS_LAB_FILTER_BY_TESTID: (testId: string) =>
      `/api/v1/define-test-results-lab/filter-by-testid?testId=${testId}`,
    DEFINE_TEST_RESULTS_LAB_BULK_UPSERT: (testId: string) =>
      `/api/v1/define-test-results-lab/bulk/upsert?testId=${testId}`,

    // Define Tests Donor endpoints
    DEFINE_TESTS_DONOR_TEST_IDS: '/api/v1/define-tests-donor/test-ids',
    DEFINE_TESTS_DONOR_BY_ID: (testId: string) => `/api/v1/define-tests-donor/${testId}`,
    DEFINE_TESTS_DONOR_DROPDOWNS: '/api/v1/define-tests-donor/dropdowns',
    DEFINE_TESTS_DONOR_DROPDOWNS_ANTIGEN_TYPES: '/api/v1/define-tests-donor/dropdowns/antigen-types',
    DEFINE_TESTS_DONOR_DROPDOWNS_ANTIGEN_GROUPS: '/api/v1/define-tests-donor/dropdowns/antigen-groups',
    DEFINE_TESTS_DONOR_DROPDOWNS_TEST_GROUPS: '/api/v1/define-tests-donor/dropdowns/test-groups',
    DEFINE_TESTS_DONOR_CREATE: '/api/v1/define-tests-donor',
    DEFINE_TESTS_DONOR_UPDATE: (testId: string) => `/api/v1/define-tests-donor/${testId}`,
    DEFINE_TEST_RESULTS_DONOR_FILTER_VALUES: '/api/v1/define-test-results-donor/filter-values',
    DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_TESTS: '/api/v1/define-test-results-donor/dropdowns/tests',
    DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_INTERDICTIONS: '/api/v1/define-test-results-donor/dropdowns/interdictions',
    DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_INTERDICTIONS_BY_TESTID: (testId: string) => `/api/v1/define-test-results-donor/dropdowns/interdictions/${testId}`,
    DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_RESULT_CODES: '/api/v1/define-test-results-donor/dropdowns/result-codes',
    DEFINE_TEST_RESULTS_DONOR_FILTER_BY_TESTID: (testId: string) => `/api/v1/define-test-results-donor/filter-by-testid?testId=${testId}`,
    DEFINE_TEST_RESULTS_DONOR_BULK_UPSERT: (testId: string) => `/api/v1/define-test-results-donor/bulk/upsert?testId=${testId}`,

    // External Antigen Approval endpoints (AGIMANGR - External File Mapping)
    EXT_ANT_APPROVAL_SEARCH: (take: number, skip: number) =>
      `/api/v1/ext-ant-approval/search-sort-filter/${take}/${skip}`,
    EXT_ANT_APPROVAL_CREATE: '/api/v1/ext-ant-approval',
    EXT_ANT_APPROVAL_UPDATE: '/api/v1/ext-ant-approval',
    EXT_ANT_APPROVAL_DELETE: (auditKey: number) => `/api/v1/ext-ant-approval/${auditKey}`,
    EXT_ANT_APPROVAL_COUNT: '/api/v1/ext-ant-approval/count',
    EXT_ANT_APPROVAL_FILTER_OPTIONS: '/api/v1/ext-ant-approval/filter-options',
    EXT_ANT_APPROVAL_LOOKUP_PREFIXES: '/api/v1/ext-ant-approval/lookups/test-batch-prefixes',
    EXT_ANT_APPROVAL_LOOKUP_ANTIGEN_TESTS: '/api/v1/ext-ant-approval/lookups/antigen-tests',
    EXT_ANT_APPROVAL_CHECK_PREFIX_EXISTS: '/api/v1/ext-ant-approval/check-prefix-exists',

    // Transfusion Status Log endpoints (AGIMANGR - Transfusion Status Log)
    TRANSFUSION_STATUS_LOG_SEARCH: (take: number, skip: number) =>
      `/api/v1/transfusion-status-log/search-sort-filter/${take}/${skip}`,
    TRANSFUSION_STATUS_LOG_COUNT: '/api/v1/transfusion-status-log/count',
    TRANSFUSION_STATUS_LOG_OK_UNITS: (jobId: number) => `/api/v1/transfusion-status-log/${jobId}/ok-units`,
    TRANSFUSION_STATUS_LOG_ERROR_UNITS: (jobId: number) => `/api/v1/transfusion-status-log/${jobId}/error-units`,

    // Labeling Interdiction Override endpoints
    LABELING_INTERDICTION_OVERRIDE: (take: number, skip: number) =>
      `/api/v1/labeling-interdiction-override/search-sort-filter/${take}/${skip}`,
    LABELING_INTERDICTION_OVERRIDE_CREATE: '/api/v1/labeling-interdiction-override/create',
    LABELING_INTERDICTION_OVERRIDE_UPDATE: '/api/v1/labeling-interdiction-override/update',
    LABELING_INTERDICTION_OVERRIDE_DROPDOWNS: '/api/v1/labeling-interdiction-override/dropdowns',
    LABELING_INTERDICTION_OVERRIDE_FILTER_DROPDOWN: '/api/v1/labeling-interdiction-override/filter-dropdown',

    // Hospital Returns endpoints (IMIRETN)
    // --- Items ---
    HOSPITAL_RETURNS_GET_BY_ADVICE: '/api/v1/lab/hospital-returns/items',
    HOSPITAL_RETURNS_GET_ALL: '/api/v1/lab/hospital-returns/items/search',
    HOSPITAL_RETURNS_GET_BY_ID: (unitId: string, returnAdviceId: string) =>
      `/api/v1/lab/hospital-returns/items/${encodeURIComponent(unitId)}/${encodeURIComponent(returnAdviceId)}`,
    HOSPITAL_RETURNS_CREATE: '/api/v1/lab/hospital-returns/items',
    HOSPITAL_RETURNS_UPDATE: (unitId: string, returnAdviceId: string) =>
      `/api/v1/lab/hospital-returns/items/${encodeURIComponent(unitId)}/${encodeURIComponent(returnAdviceId)}`,
    HOSPITAL_RETURNS_DELETE: (unitId: string, returnAdviceId: string) =>
      `/api/v1/lab/hospital-returns/items/${encodeURIComponent(unitId)}/${encodeURIComponent(returnAdviceId)}`,
    // --- Items: Scan/Evaluate/Commit ---
    HOSPITAL_RETURNS_SCAN_PRODUCT: '/api/v1/lab/hospital-returns/items/scan-product',
    HOSPITAL_RETURNS_EVALUATE_RETURN: '/api/v1/lab/hospital-returns/items/evaluate-return',
    HOSPITAL_RETURNS_COMMIT_RETURN: '/api/v1/lab/hospital-returns/items/commit-return',
    // --- Items: Dropdowns ---
    HOSPITAL_RETURNS_PRODUCT_CODES: '/api/v1/lab/hospital-returns/items/product-codes',
    HOSPITAL_RETURNS_BLOOD_TYPES: '/api/v1/lab/hospital-returns/items/blood-types',
    // --- Advices ---
    HOSPITAL_RETURNS_ADVICES_GET_ALL: (take: number, skip: number) =>
      `/api/v1/lab/hospital-returns/advices/${take}/${skip}`,
    HOSPITAL_RETURNS_ADVICES_CREATE: '/api/v1/lab/hospital-returns/advices',
    HOSPITAL_RETURNS_ADVICES_UPDATE: (returnAdviceId: string) =>
      `/api/v1/lab/hospital-returns/advices/${encodeURIComponent(returnAdviceId)}`,
    HOSPITAL_RETURNS_ADVICES_DELETE: (returnAdviceId: string) =>
      `/api/v1/lab/hospital-returns/advices/${encodeURIComponent(returnAdviceId)}`,
    HOSPITAL_RETURNS_ADVICES_OPEN: '/api/v1/lab/hospital-returns/advices/open',
    HOSPITAL_RETURNS_ADVICES_GET_BY_ID: (returnAdviceId: string) =>
      `/api/v1/lab/hospital-returns/advices/${encodeURIComponent(returnAdviceId)}`,
    HOSPITAL_RETURNS_ADVICES_RETURN_REASONS: '/api/v1/lab/hospital-returns/advices/return-reasons',
    HOSPITAL_RETURNS_ADVICES_CUSTOMERS: '/api/v1/lab/hospital-returns/advices/customers',
    HOSPITAL_RETURNS_ADVICES_CONTACTS: '/api/v1/lab/hospital-returns/advices/contacts',
    HOSPITAL_RETURNS_ADVICES_PRINTERS: '/api/v1/lab/hospital-returns/advices/printers',
    HOSPITAL_RETURNS_ADVICES_CLOSE: (returnAdviceId: string) =>
      `/api/v1/lab/hospital-returns/advices/${encodeURIComponent(returnAdviceId)}/close`,

    // Order Class Codes endpoints
    ORDER_CLASS_CODES: (chapterId: string, take: number, skip: number) =>
      `/api/v1/admin/order-class/${chapterId}/${take}/${skip}`,
    ORDER_CLASS_CODES_ADD_EDIT: '/api/v1/admin/order-class',

    // Lab Donor Interface Log Query endpoints
    LAB_DONOR_INTERFACE_QUERY: (take: number, skip: number, chapterId: string) =>
      `/api/v1/admin/lab-donor-interface-query/${take}/${skip}/${chapterId}`,
    LAB_DONOR_INTERFACE_EXCEPTION: (interfaceId: string) =>
      `/api/v1/admin/lab-donor-interface-query/interface-exception/${interfaceId}`,
    LAB_DONOR_INTERFACE_PARAMETER: (interfaceId: string) =>
      `/api/v1/admin/lab-donor-interface-query/interface-parameter/${interfaceId}`,
    LAB_DONOR_INTERFACE_FILTERS: (chapterId: string) =>
      `/api/v1/admin/lab-donor-interface-query/filter-dropdown-values/${chapterId}`,

    // Manual Donor Interface endpoints
    MANUAL_DONOR_INTERFACE_TEST_RESULTS: '/api/v1/manual-donor-interface/abo-results',
    MANUAL_DONOR_INTERFACE_SUBMIT: '/api/v1/manual-donor-interface/process',
    MANUAL_DONOR_INTERFACE_UNIT_DETAILS: '/api/v1/manual-donor-interface/unit-details',
    // Common DonorLib endpoints (shared across screens)
    DONOR_LIB_VALIDATE_UNIT: '/api/v1/donor-lib/validate-unit',
    DONOR_LIB_VALIDATE_UNIT_ABO_SCAN: '/api/v1/donor-lib/validate-unit-abo-scan',
    DONOR_LIB_VALIDATE_ABO_SCAN: '/api/v1/donor-lib/validate-abo-scan',
    DONOR_LIB_VALIDATE_PRODUCT_EXPDATE_SCAN: '/api/v1/donor-lib/validate-product-expdate-scan',
    DONOR_LIB_VALIDATE_PRODUCT_SCAN: '/api/v1/donor-lib/validate-product-scan',
    DONOR_LIB_VALIDATE_EXPDATE_SCAN: '/api/v1/donor-lib/validate-expdate-scan',
    DONOR_LIB_VALIDATE_EXPIRY_SCAN: '/api/v1/donor-lib/validate-expiry-scan',
    DONOR_LIB_VALIDATE_PRODUCT_EXPIRY_SCAN: '/api/v1/donor-lib/validate-product-expiry-scan',
    DONOR_LIB_VALIDATE_SP_TEST_SCAN: '/api/v1/donor-lib/validate-sp-test-scan',
    DONOR_LIB_VALIDATE_CATALOG_SCAN: '/api/v1/donor-lib/validate-catalog-scan',
    DONOR_LIB_VALIDATE_LOT_SCAN: '/api/v1/donor-lib/validate-lot-scan',

    // Re-Interface Donor to Lab endpoints
    RE_INTERFACE_DONOR_TO_LAB: (unitId: string) =>
      `/api/v1/admin/re-interface-donor-to-lab/${encodeURIComponent(unitId)}`,
    RE_INTERFACE_DONOR_TO_LAB_EXECUTE: '/api/v1/admin/re-interface-donor-to-lab/execute',

    // Lab Interface Results endpoints
    LAB_INTERFACE_RESULTS_VERIFY_UNIT: '/api/v1/lab-interface-results/verify-unit',
    LAB_INTERFACE_RESULTS_UNITS_BY_DATE: (collectionDate: string, interfaceType: string) =>
      `/api/v1/lab-interface-results/units-by-date?collectionDate=${encodeURIComponent(collectionDate)}&interfaceType=${encodeURIComponent(interfaceType)}`,
    LAB_INTERFACE_RESULTS_PROCESS: '/api/v1/lab-interface-results/process',

    // Upload Test Results endpoints
    UPLOAD_TEST_RESULTS: (chapterId: string, loggedInUserName: string) =>
      `/api/v1/Auth/uploadTestResults?chapterId=${chapterId}&loggedInUserName=${loggedInUserName}`,
    FILE_LOCATION: '/api/v1/Auth/file-location',

    // Define Donation Procedures endpoints
    DEFINE_DONATION_PROCEDURES: (take: number, skip: number) =>
      `/api/v1/admin/donation-procedure/${take}/${skip}`,
    DONATION_PROCEDURE_FILTERS: '/api/v1/admin/donation-procedure/filters',
    DONATION_PROCEDURE_LOOKUPS: '/api/v1/admin/donation-procedure/lookups',
    ADD_DONATION_PROCEDURE: '/api/v1/admin/donation-procedure',
    UPDATE_DONATION_PROCEDURE: '/api/v1/admin/donation-procedure',

    // ABO Values endpoints
    ABO_VALUES: (take: number, skip: number) =>
      `/api/v1/admin/valid-abo-values/${take}/${skip}`,
    ABO_VALUES_ADD_EDIT: '/api/v1/admin/valid-abo-values',
    ABO_VALUES_FILTERS: '/api/v1/admin/valid-abo-values/filter-dropdown',
    ABO_VALUES_DROPDOWNS: '/api/v1/admin/valid-abo-values/add-dropdown',

    // Inventory Product Types endpoints
    INVENTORY_PRODUCT_TYPES_GET_ALL: '/api/v1/product-types',
    INVENTORY_PRODUCT_TYPES_LIST: (take: number, skip: number) => `/api/v1/product-types/search-sort-filter/${take}/${skip}`,
    INVENTORY_PRODUCT_TYPES_BY_CODE: (code: string) => `/api/v1/product-types/${code}`,
    INVENTORY_PRODUCT_TYPES_FILTERS: '/api/v1/product-types/filter-dropdowns', // DEPRECATED - use AVAILABLE_DROPDOWNS or FILTER_OPTIONS
    INVENTORY_PRODUCT_TYPES_AVAILABLE_DROPDOWNS: '/api/v1/product-types/available-dropdowns', // For add/edit forms (all master values)
    INVENTORY_PRODUCT_TYPES_FILTER_OPTIONS: '/api/v1/product-types/filter-options', // For filter panel (only values in use)
    INVENTORY_PRODUCT_TYPES_AVAILABLE: '/api/v1/product-types/available-types',
    INVENTORY_PRODUCT_TYPES_CREATE: '/api/v1/product-types',
    INVENTORY_PRODUCT_TYPES_UPDATE: '/api/v1/product-types',
    INVENTORY_PRODUCT_TYPES_DELETE: (code: string) => `/api/v1/product-types/${code}`,

    // Pool Compatibility Matrix endpoints
    POOL_COMPATIBILITY_MATRIX: (take: number, skip: number) => `/api/v1/pool-compatibility-matrix/${take}/${skip}`,
    POOL_COMPATIBILITY_MATRIX_INVENTORY_TYPES: '/api/v1/pool-compatibility-matrix/inventory-product-types',
    POOL_COMPATIBILITY_MATRIX_FINISHED_TYPES: '/api/v1/pool-compatibility-matrix/finished-product-types',
    POOL_COMPATIBILITY_MATRIX_FILTER_INVENTORY_TYPES: '/api/v1/pool-compatibility-matrix/filters/inventory-product-types',
    POOL_COMPATIBILITY_MATRIX_FILTER_FINISHED_TYPES: '/api/v1/pool-compatibility-matrix/filters/finished-product-types',
    POOL_COMPATIBILITY_MATRIX_WORK_OPTIONS: '/api/v1/pool-compatibility-matrix/work-options',
    POOL_COMPATIBILITY_MATRIX_CREATE: '/api/v1/pool-compatibility-matrix',
    POOL_COMPATIBILITY_MATRIX_UPDATE: '/api/v1/pool-compatibility-matrix',
    POOL_COMPATIBILITY_MATRIX_BATCH: '/api/v1/pool-compatibility-matrix/batch',

    // QC Batch Units (Check in Batch Query with Unit Data) endpoints
    QC_BATCH_UNITS_BATCH_IDS_LOV: '/api/v1/qc-batch-unit-inquiry/batch-ids',
    QC_BATCH_UNITS_BY_BATCH: (batchId: string) =>
      `/api/v1/qc-batch-unit-inquiry/${encodeURIComponent(batchId)}`,

    // Associate Nickname to Name endpoints
    ASSOCIATE_NICKNAME_TO_NAME_SEARCH: (take: number, skip: number) =>
      `/api/v1/associate-nickname-to-name/${take}/${skip}`,
    ASSOCIATE_NICKNAME_TO_NAME_BY_KEY: (nickName: string, firstName: string) =>
      `/api/v1/associate-nickname-to-name/${encodeURIComponent(nickName)}/${encodeURIComponent(firstName)}`,
    ASSOCIATE_NICKNAME_TO_NAME_CREATE: '/api/v1/associate-nickname-to-name',
    ASSOCIATE_NICKNAME_TO_NAME_UPDATE: (nickName: string, firstName: string) =>
      `/api/v1/associate-nickname-to-name/${encodeURIComponent(nickName)}/${encodeURIComponent(firstName)}`,
    // Define Max Donations endpoints
    DEFINE_MAX_DONATIONS: (take: number, skip: number) =>
      `/api/v1/define-max-donations/${take}/${skip}`,
    ADD_MAX_DONATION: '/api/v1/define-max-donations',
    UPDATE_MAX_DONATION: '/api/v1/define-max-donations',
    MAX_DONATIONS_DONATION_TYPES: '/api/v1/define-max-donations/donation-types',
    MAX_DONATIONS_DONATION_TYPES_FILTER: '/api/v1/define-max-donations/donation-types-filter',
    MAX_DONATIONS_PROCEDURE_GROUPS: '/api/v1/define-max-donations/procedure-groups',
    // Valid Donation Type/Procedure Codes endpoints
    VALID_DONATION_TYPE_PROCEDURE_CODES: (take: number, skip: number) =>
      `/api/v1/admin/valid-don-proc-attributes/${take}/${skip}`,
    // Note: ADD and UPDATE use the same endpoint path but different HTTP methods
    ADD_ATTRIBUTE_MAPPING: '/api/v1/admin/valid-don-proc-attribute', // POST
    UPDATE_ATTRIBUTE_MAPPING: '/api/v1/admin/valid-don-proc-attribute', // PUT
    VALID_DON_PROC_ATTRIBUTE_FILTERS: '/api/v1/admin/valid-don-proc-attribute-filters',
    ATTRIBUTE_MAPPING_ATTRIBUTE_CODES: '/api/v1/admin/valid-don-proc-attributes/attribute-codes',

    // Donor Decision Codes endpoints
    DONOR_DECISION_CODES: (take: number, skip: number) =>
      `/api/v1/application-admin/donor-decision-codes/${take}/${skip}`,
    GET_DONOR_DECISION_CODES_DISTINCT: '/api/v1/application-admin/donor-decision-codes/distinct',
    GET_DONOR_DECISION_CODES_BARCODES: '/api/v1/application-admin/donor-decision-codes/barcodes',
    GET_DONOR_DECISION_CODE_DESCRIPTION: (code: string) =>
      `/api/v1/application-admin/donor-decision-code/${encodeURIComponent(code)}/description`,
    GET_DONOR_DECISION_CODE_BY_BARCODE: (barCodeValue: string) =>
      `/api/v1/application-admin/donor-decision-code/${encodeURIComponent(barCodeValue)}`,
    CREATE_DONOR_DECISION_CODE: '/api/v1/application-admin/donor-decision-code',
    UPDATE_DONOR_DECISION_CODE: (barCodeValue: string) =>
      `/api/v1/application-admin/donor-decision-code/${encodeURIComponent(barCodeValue)}`,

    // Donor Interdiction Override (Tech 1) endpoints
    DONOR_INTERDICTION_OVERRIDE: (take: number, skip: number) =>
      `/api/v1/application-admin/donor-interdiction-override/${take}/${skip}`,
    DONOR_INTERDICTION_OVERRIDE_CREATE: '/api/v1/application-admin/donor-interdiction-override',
    DONOR_INTERDICTION_OVERRIDE_UPDATE: (donorDecisionCode: string, productType: string, interCode: string) =>
      `/api/v1/application-admin/donor-interdiction-override/${donorDecisionCode}/${productType}/${interCode}`,
    DONOR_INTERDICTION_OVERRIDE_DROPDOWNS: '/api/v1/application-admin/donor-interdiction-override/dropdowns',
    DONOR_INTERDICTION_OVERRIDE_FILTER_OPTIONS: '/api/v1/application-admin/donor-interdiction-override/filter-options',
    DONOR_INTERDICTION_OVERRIDE_ATTRIB_CODES_BY_GROUP: (attribGroup: string) =>
      `/api/v1/application-admin/donor-interdiction-override/dropdowns/attrib-codes/${attribGroup}`,

  // Physical Rules (Define Physical Findings Values) endpoints
    PHYSICAL_RULES_GET: '/api/v1/donor-functions/physical-rules/get',
    PHYSICAL_RULES_CREATE: '/api/v1/donor-functions/physical-rules',
    PHYSICAL_RULES_UPDATE: '/api/v1/donor-functions/physical-rules',
    PHYSICAL_RULES_LOOKUPS: '/api/v1/donor-functions/physical-rules',
    // Test Result Override Rules endpoints
    TEST_RESULT_OVERRIDE_RULES: {
      TEST_IDS: '/api/v1/application-admin/test-ids',
      GET_RULES: (take: number, skip: number) =>
        `/api/v1/application-admin/test-result-override-rules/${take}/${skip}`,
      SAVE: '/api/v1/application-admin/test-result-override-rules/save'
    },

    // Interdiction codes for application admin
    APP_ADMIN_INTERDICTION_CODES: '/api/v1/application-admin/interdiction-codes',
    APP_ADMIN_INTERDICTION_CODES_FILTER: '/api/v1/application-admin/interdiction-codes/filter',

    // Test results for application admin
    TEST_RESULTS: '/api/v1/application-admin/test-results',

    // Labeling Interdiction Override Query endpoints
    LABELING_INTERDICTION_OVERRIDE_QUERY: (take: number, skip: number) =>
  `/api/v1/admin/labelling-interdiction-override-query/${take}/${skip}`,

    LABELING_INTERDICTION_OVERRIDE_QUERY_FILTERS:
  `/api/v1/admin/labelling-interdiction-override-query-filters`,

    // Donor Interdiction Override Tech 2 endpoints
    DONOR_INTERDICTION_OVERRIDE_TECH2: {
      SEARCH: '/api/v1/application-admin/donor-interdiction-override-tech2/search',
      VERIFY: '/api/v1/application-admin/donor-interdiction-override-tech2/verify'
    },

    // Lab Interdiction Override Tech 2 endpoints
    LAB_INTERDICTION_OVERRIDE_TECH2: {
      SEARCH: '/api/v1/application-admin/lab-interdiction-override-tech2/search',
      VERIFY: '/api/v1/application-admin/lab-interdiction-override-tech2/verify',
      FILTER_DROPDOWN: '/api/v1/application-admin/lab-interdiction-override-tech2/filter-dropdown'
    },

    // Labeling Configuration endpoints
    LABELING_CONFIGURATION: {
      // Tab 1: Barcode Config
      BARCODE_LIST: '/api/v1/lbl-barcode-config/list',
      BARCODE_ADD: '/api/v1/lbl-barcode-config',
      BARCODE_UPDATE: (barcodeValue: string, testId: string, resultCode: string) =>
        `/api/v1/lbl-barcode-config/${encodeURIComponent(barcodeValue)}/${encodeURIComponent(testId)}/${encodeURIComponent(resultCode)}`,
      BARCODE_DELETE: (barcodeValue: string, testId: string, resultCode: string) =>
        `/api/v1/lbl-barcode-config/${encodeURIComponent(barcodeValue)}/${encodeURIComponent(testId)}/${encodeURIComponent(resultCode)}`,
      BARCODE_LOOKUP_BARCODES: '/api/v1/lbl-barcode-config/lookups/barcodes',
      BARCODE_LOOKUP_TEST_IDS: '/api/v1/lbl-barcode-config/lookups/test-ids',
      // Tab 2: Product Type Prioritization
      PRODUCT_TYPE_LIST: '/api/v1/lbl-product-type-config/list',
      PRODUCT_TYPE_ADD: '/api/v1/lbl-product-type-config',
      PRODUCT_TYPE_UPDATE: (productType: string, barcodeValue: string) =>
        `/api/v1/lbl-product-type-config/${encodeURIComponent(productType)}/${encodeURIComponent(barcodeValue)}`,
      PRODUCT_TYPE_DELETE: (productType: string, barcodeValue: string) =>
        `/api/v1/lbl-product-type-config/${encodeURIComponent(productType)}/${encodeURIComponent(barcodeValue)}`,
      PRODUCT_TYPE_LOOKUP_TYPES: '/api/v1/lbl-product-type-config/lookups/product-types',
      PRODUCT_TYPE_LOOKUP_BARCODES: '/api/v1/lbl-product-type-config/lookups/barcodes',
      PRODUCT_TYPE_MAX_PRIORITY: (productType: string) =>
        `/api/v1/lbl-product-type-config/${encodeURIComponent(productType)}/max-priority`,
      PRODUCT_TYPE_CHECK_PRIORITY: (productType: string, prioritySeq: number) =>
        `/api/v1/lbl-product-type-config/${encodeURIComponent(productType)}/check-priority/${prioritySeq}`,
      PRODUCT_TYPE_FIX_PRIORITIES: (productType: string) =>
        `/api/v1/lbl-product-type-config/fix-duplicate-priorities/${encodeURIComponent(productType)}`,
      // Tab 3: Plasma Tests Config
      PLASMA_TESTS_LIST: '/api/v1/lbl-plasma-tests-config/list',
      PLASMA_TESTS_ADD: '/api/v1/lbl-plasma-tests-config',
      PLASMA_TESTS_UPDATE: (testId: string) =>
        `/api/v1/lbl-plasma-tests-config/${encodeURIComponent(testId)}`,
      PLASMA_TESTS_DELETE: (testId: string) =>
        `/api/v1/lbl-plasma-tests-config/${encodeURIComponent(testId)}`,
      // Tab 4: Test Message Mapping
      TEST_MESSAGE_LIST: '/api/v1/labeling-test-message-map/list',
      TEST_MESSAGE_ADD: '/api/v1/labeling-test-message-map',
      TEST_MESSAGE_UPDATE: (ltTestId: string, resultCode: string, displyTestId: string) =>
        `/api/v1/labeling-test-message-map/${encodeURIComponent(ltTestId)}/${encodeURIComponent(resultCode)}/${encodeURIComponent(displyTestId)}`,
      TEST_MESSAGE_DELETE: (ltTestId: string, resultCode: string, displyTestId: string) =>
        `/api/v1/labeling-test-message-map/${encodeURIComponent(ltTestId)}/${encodeURIComponent(resultCode)}/${encodeURIComponent(displyTestId)}`,
      TEST_MESSAGE_LOOKUP_RESULT_CODES: (ltTestId?: string) =>
        ltTestId ? `/api/v1/labeling-test-message-map/lookups/result-codes?ltTestId=${encodeURIComponent(ltTestId)}` : '/api/v1/labeling-test-message-map/lookups/result-codes',
      TEST_MESSAGE_LOOKUP_TEST_IDS: '/api/v1/labeling-test-message-map/lookups/test-ids',
      TEST_MESSAGE_LOOKUP_MESSAGE_TYPES: '/api/v1/labeling-test-message-map/lookups/message-types',
      // Tab 5: RBC Antigen Print Product Types
      AG_PRINT_LIST: '/api/v1/lbl-ag-print-prod-types/list',
      AG_PRINT_ADD: '/api/v1/lbl-ag-print-prod-types',
      AG_PRINT_UPDATE: (productType: string) =>
        `/api/v1/lbl-ag-print-prod-types/${encodeURIComponent(productType)}`,
      AG_PRINT_DELETE: (productType: string) =>
        `/api/v1/lbl-ag-print-prod-types/${encodeURIComponent(productType)}`,
      AG_PRINT_LOOKUP_TYPES: '/api/v1/lbl-ag-print-prod-types/lookups/product-types',
    },

    // Instrument Error Log Query endpoints
    INSTRUMENT_ERROR_LOG_QUERY: (take: number, skip: number) => `/api/v1/instrument-error-log-query/list/${take}/${skip}`,

    // API Log Query endpoints
    API_LOG_QUERY_SOURCE_IDS: '/api/v1/api-log-query/source-ids',
    API_LOG_QUERY_DATA_SOURCES: '/api/v1/api-log-query/data-sources',
    API_LOG_QUERY: (take: number, skip: number) => `/api/v1/api-log-query/${take}/${skip}`,
    API_LOG_QUERY_EXPORT: '/api/v1/api-log-query/export',

    // API Temporary Data Query endpoints (API Conversion)
    API_TEMP_DATA_QUERY_ID_TYPES: '/api/v1/api-conversion/id-types',
    API_TEMP_DATA_QUERY_SOURCE_IDS: '/api/v1/api-conversion/source-ids',
    API_TEMP_DATA_QUERY_TEMPORARY_IDS: '/api/v1/api-conversion/temporary-ids',
    API_TEMP_DATA_QUERY_PERMANENT_IDS: '/api/v1/api-conversion/permanent-ids',
    API_TEMP_DATA_QUERY: (take: number, skip: number) => `/api/v1/api-conversion/${take}/${skip}`,
    API_TEMP_DATA_QUERY_EXPORT: '/api/v1/api-conversion/export',

    // Convert External Data to LT Data endpoints (APICONVL)
    CONVERSION_MAPPING_SOURCE_APPLICATIONS: '/api/v1/conversion-mappings/source-applications',
    CONVERSION_MAPPING_TARGET_TYPES: '/api/v1/conversion-mappings/target-types',
    CONVERSION_MAPPING_LIST: (take: number, skip: number) => `/api/v1/conversion-mappings/${take}/${skip}`,
    CONVERSION_MAPPING_GET_BY_KEY: (sourceApplId: string, targetApplId: string, sourceValue: string, targetValue: string, targetValueType: string) =>
      `/api/v1/conversion-mappings/${encodeURIComponent(sourceApplId)}/${encodeURIComponent(targetApplId)}/${encodeURIComponent(sourceValue)}/${encodeURIComponent(targetValue)}/${encodeURIComponent(targetValueType)}`,
    CONVERSION_MAPPING_CREATE: '/api/v1/conversion-mappings',
    CONVERSION_MAPPING_UPDATE: (sourceApplId: string, targetApplId: string, sourceValue: string, targetValue: string, targetValueType: string) =>
      `/api/v1/conversion-mappings/${encodeURIComponent(sourceApplId)}/${encodeURIComponent(targetApplId)}/${encodeURIComponent(sourceValue)}/${encodeURIComponent(targetValue)}/${encodeURIComponent(targetValueType)}`,
    CONVERSION_MAPPING_DELETE: (sourceApplId: string, targetApplId: string, sourceValue: string, targetValue: string, targetValueType: string) =>
      `/api/v1/conversion-mappings/${encodeURIComponent(sourceApplId)}/${encodeURIComponent(targetApplId)}/${encodeURIComponent(sourceValue)}/${encodeURIComponent(targetValue)}/${encodeURIComponent(targetValueType)}`,

    // Drive Interface Donor to Lab endpoints
    DRIVE_INTERFACE_DRIVES: '/api/v1/drive-interface/drives',
    DRIVE_INTERFACE_TRANSFER: '/api/v1/drive-interface/drives/transfer',

    // Mobile PC Laptop Register endpoints
    // EMF Processes endpoints
    EMF_PROCESSES: (take: number, skip: number) =>
      `/api/v1/emf-processes/${take}/${skip}`,
    EMF_PROCESS_BY_ID: (procCode: string) =>
      `/api/v1/emf-processes/${procCode}`,
    EMF_PROCESS_ADD_EDIT: '/api/v1/emf-processes',
    EMF_SOURCE_PROCESSES: (take: number, skip: number) =>
      `/api/v1/emf-process-definitions/${take}/${skip}`,
    EMF_SOURCE_PROCESS_BY_ID: (processCode: string, processSeq: number) =>
      `/api/v1/emf-process-definitions/${encodeURIComponent(processCode)}/${processSeq}`,
    EMF_SOURCE_PROCESS_DETAILS: (processCode: string, processSeq: number) =>
      `/api/v1/emf-process-definitions/${encodeURIComponent(processCode)}/${processSeq}/details`,
    EMF_SOURCE_PROCESS_CREATE: '/api/v1/emf-process-definitions',
    EMF_SOURCE_PROCESS_UPDATE: (processCode: string, processSeq: number) =>
      `/api/v1/emf-process-definitions/${encodeURIComponent(processCode)}/${processSeq}`,
    EMF_SOURCE_PROCESS_DELETE: (processCode: string, processSeq: number) =>
      `/api/v1/emf-process-definitions/${encodeURIComponent(processCode)}/${processSeq}`,

    // EMF Process Action endpoints
    EMF_TARGET_PROCESSES: (take: number, skip: number) =>
      `/api/v1/emf-process-actions/${take}/${skip}`,
    EMF_TARGET_PROCESSES_BY_SOURCE: (processCode: string) =>
      `/api/v1/emf-process-actions/source/${encodeURIComponent(processCode)}`,
    EMF_TARGET_PROCESS_BY_ID: (processCode: string, actionSeq: string) =>
      `/api/v1/emf-process-actions/${encodeURIComponent(processCode)}/${encodeURIComponent(actionSeq)}`,
    EMF_TARGET_PROCESS_CREATE: '/api/v1/emf-process-actions',
    EMF_TARGET_PROCESS_UPDATE: (processCode: string, actionSeq: string) =>
      `/api/v1/emf-process-actions/${encodeURIComponent(processCode)}/${encodeURIComponent(actionSeq)}`,
    EMF_TARGET_PROCESS_DELETE: (processCode: string, actionSeq: string) =>
      `/api/v1/emf-process-actions/${encodeURIComponent(processCode)}/${encodeURIComponent(actionSeq)}`,
    EMF_TARGET_PROCESS_NEXT_SEQ: (processCode: string) =>
      `/api/v1/emf-process-actions/next-sequence/${encodeURIComponent(processCode)}`,
    EMF_TARGET_PROCESS_GENERATE_SQL: (processCode: string) =>
      `/api/v1/emf-process-actions/generate-sql/${encodeURIComponent(processCode)}`,
    EMF_TARGET_PROCESS_VIEW_SQL: (processCode: string) =>
      `/api/v1/emf-process-actions/view-sql/${encodeURIComponent(processCode)}`,

    // Process Mapping endpoints
    PROCESS_MAPPING: (take: number, skip: number) =>
      `/api/v1/process-mapping/${take}/${skip}`,
    PROCESS_MAPPING_GET: (processCode: string, mappingName: string) =>
      `/api/v1/process-mapping/${encodeURIComponent(processCode)}/${encodeURIComponent(mappingName)}`,
    PROCESS_MAPPING_CREATE: '/api/v1/process-mapping',
    PROCESS_MAPPING_UPDATE: (processCode: string, mappingName: string) =>
      `/api/v1/process-mapping/${encodeURIComponent(processCode)}/${encodeURIComponent(mappingName)}`,
    PROCESS_MAPPING_DELETE: (processCode: string, mappingName: string) =>
      `/api/v1/process-mapping/${encodeURIComponent(processCode)}/${encodeURIComponent(mappingName)}`,
    PROCESS_MAPPING_CHECK_USAGE: (processCode: string, mappingName: string) =>
      `/api/v1/process-mapping/${encodeURIComponent(processCode)}/${encodeURIComponent(mappingName)}/check-usage`,

    // Parameter Definition endpoints
    PARAMETER_DEFINITION_GET: (processCode: string) =>
      `/api/v1/parameter-definition/${encodeURIComponent(processCode)}`,
    PARAMETER_DEFINITION_CREATE: '/api/v1/parameter-definition',
    PARAMETER_DEFINITION_UPDATE: (processCode: string, parmNo: number) =>
      `/api/v1/parameter-definition/${encodeURIComponent(processCode)}/${parmNo}`,
    PARAMETER_DEFINITION_DELETE: (processCode: string, parmNo: number) =>
      `/api/v1/parameter-definition/${encodeURIComponent(processCode)}/${parmNo}`,
    PARAMETER_DEFINITION_BATCH: (processCode: string) =>
      `/api/v1/parameter-definition/${encodeURIComponent(processCode)}/batch`,

    // Manufacturing Mapping Lookup endpoints
    MANUF_LOOKUP_PROCESS_CODES: '/api/v1/manuf-mapping-lookups/process-codes',
    MANUF_LOOKUP_MAPPING_NAMES: (processCode: string) =>
      `/api/v1/manuf-mapping-lookups/mapping-names/${encodeURIComponent(processCode)}`,
    MANUF_LOOKUP_TABLES: '/api/v1/manuf-mapping-lookups/table-names',
    MANUF_LOOKUP_COLUMNS: (tableName: string) =>
      `/api/v1/manuf-mapping-lookups/column-names/${encodeURIComponent(tableName)}`,
    EMF_ACTION_CODES: '/api/v1/emf-process-actions/action-codes',
    EMF_VALIDATE_PARENT_ACTION: (processCode: string, actionSeq: string) =>
      `/api/v1/emf-process-actions/validate-parent-action/${encodeURIComponent(processCode)}/${encodeURIComponent(actionSeq)}`,
    EMF_OPERATORS: '/api/v1/emf-process-actions/operators',
    EMF_VALIDATE_FUNCTION: (functionName: string) =>
      `/api/v1/emf-process-actions/validate-function/${encodeURIComponent(functionName)}`,

    MOBILE_PC_LAPTOP_REGISTER: (take: number, skip: number) =>
      `/api/v1/apis-integration/mobile-pc-laptop-register/${take}/${skip}`,
    MOBILE_PC_LAPTOP_REGISTER_ADD_EDIT: '/api/v1/apis-integration/mobile-pc-laptop-register',
    MOBILE_PC_LAPTOP_REGISTER_FILTERS: '/api/v1/apis-integration/mobile-pc-laptop-register-filters',

    // Vehicle Details endpoints
    VEHICLE_DETAILS: (take: number, skip: number) =>
      `/api/v1/valid-vehicles/${take}/${skip}`,
    VEHICLE_DETAILS_BY_ID: (vehicleId: string) =>
      `/api/v1/valid-vehicles/${encodeURIComponent(vehicleId)}`,
    VEHICLE_DETAILS_CREATE: '/api/v1/valid-vehicles',
    VEHICLE_DETAILS_UPDATE: (vehicleId: string) =>
      `/api/v1/valid-vehicles/${encodeURIComponent(vehicleId)}`,
    VEHICLE_DETAILS_NOTES: (vehicleId: string) =>
      `/api/v1/valid-vehicles/${encodeURIComponent(vehicleId)}/notes`,
    VEHICLE_DETAILS_NOTE_UPDATE: (noteId: string, auditKey: string) =>
      `/api/v1/valid-vehicles/notes/${encodeURIComponent(noteId)}/${encodeURIComponent(auditKey)}`,
    VEHICLE_DETAILS_NOTE_DELETE: (vehicleId: string, auditKey: string) =>
      `/api/v1/valid-vehicles/${encodeURIComponent(vehicleId)}/notes/${encodeURIComponent(auditKey)}`,
    VEHICLE_TYPES: '/api/v1/valid-vehicles/types',
    VEHICLE_IDS: '/api/v1/valid-vehicles/vehicle-ids'
  },

  SET_INVENTORY_LEVELS: {
    LIST: (inventoryClass: string, take: number, skip: number) =>
      `/api/v1/distributions/set-inventory-levels/${inventoryClass}/${take}/${skip}`,
    GET: (inventoryClass: string) => `/api/v1/distributions/set-inventory-levels/${inventoryClass}`,
    CREATE: (inventoryClass: string) => `/api/v1/distributions/set-inventory-levels/${inventoryClass}`,
    UPDATE: (inventoryClass: string) => `/api/v1/distributions/set-inventory-levels/${inventoryClass}`,
    DELETE: (inventoryClass: string) => `/api/v1/distributions/set-inventory-levels/${inventoryClass}`,
    INVENTORY_CLASSES_LOOKUP: '/api/v1/distributions/set-inventory-levels/inventory-classes',
    INVENTORY_TYPES_LOOKUP: '/api/v1/distributions/set-inventory-levels/inventory-types',
    PRODUCT_TYPES_LOOKUP: '/api/v1/distributions/set-inventory-levels/product-types',
    BLOOD_TYPES_LOOKUP: '/api/v1/distributions/set-inventory-levels/blood-types',
    ATTRIBUTE_GROUPS_LOOKUP: '/api/v1/distributions/set-inventory-levels/attribute-groups',
    ATTRIBUTE_CODES_LOOKUP: (attributeGroup: string) => `/api/v1/distributions/set-inventory-levels/attribute-codes/${attributeGroup}`,
  },

  SYSTEM_USERS: {
    GET_USER: (userId: string) => `api/v1/system-users/${userId}`,
    GET_USER_BY_EMAIL: (userEmail: string) => `api/v1/system-users/by-email/${encodeURIComponent(userEmail)}`,
  },
  MENU: {
    MENU_ITEMS: 'api/v1/menu/menu-items',
  },
  LAB_INTERDICTION_CODES: {
    GET: '/api/v1/application-admin/lab-interdictions/get',
    POST: '/api/v1/application-admin/lab-interdictions',
    PUT: '/api/v1/application-admin/lab-interdictions'
  },

  MASTER_SERVICE_CODES: {
    BASE: '/api/master-service-codes',
    GET_ALL: (take: number, skip: number) => `/api/master-service-codes/${take}/${skip}`,
    GET_BY_CODE: (billingCode: string) => `/api/master-service-codes/${encodeURIComponent(billingCode)}`,
    CREATE: '/api/master-service-codes',
    UPDATE: (billingCode: string) => `/api/master-service-codes/${encodeURIComponent(billingCode)}`,
    DELETE: (billingCode: string) => `/api/master-service-codes/${encodeURIComponent(billingCode)}`
  },

  CRYO_METHODS: {
    LIST: (take: number, skip: number) => `/api/v1/cryo-methods/${take}/${skip}`,
    GET_BY_ID: (thawMethod: string) => `/api/v1/cryo-methods/${encodeURIComponent(thawMethod)}`,
    CREATE: '/api/v1/cryo-methods',
    UPDATE: (thawMethod: string) => `/api/v1/cryo-methods/${encodeURIComponent(thawMethod)}`,
    DELETE: (thawMethod: string) => `/api/v1/cryo-methods/${encodeURIComponent(thawMethod)}`
  },

  CRYO_PRODUCTION: {
    CREATE: '/api/v1/cryo-production',
    UPDATE: (unitId: string) => `/api/v1/cryo-production/${encodeURIComponent(unitId)}`,
    GET_BY_UNIT: (unitId: string) => `/api/v1/cryo-production/${encodeURIComponent(unitId)}`,
    SEARCH: (take: number, skip: number) => `/api/v1/cryo-production/${take}/${skip}`,
    DELETE: (unitId: string) => `/api/v1/cryo-production/${encodeURIComponent(unitId)}`,
    // LOV endpoints
    THAW_METHODS: '/api/v1/cryo-production/thaw-methods',
    CENTRIFUGES: '/api/v1/cryo-production/centrifuges',
    CATALOG_NUMBERS: (unitId: string, productType: string) =>
      `/api/v1/cryo-production/catalog-numbers?unitId=${encodeURIComponent(unitId)}&productType=${encodeURIComponent(productType)}`,
    OLD_PRODUCTS: (unitId: string) => `/api/v1/cryo-production/old-products/${encodeURIComponent(unitId)}`,
    // Validation endpoints
    VALIDATE_UNIT: '/api/v1/cryo-production/validate-unit',
    VALIDATE_CENTRIFUGE: '/api/v1/cryo-production/validate-centrifuge', // ✅ NEW
    VALIDATE_TEMPERATURE: '/api/v1/cryo-production/validate-temperature', // ✅ NEW
    VALIDATE_FREEZE_TIME: '/api/v1/cryo-production/validate-freeze-time', // ✅ NEW
    VALIDATE_CATALOG_NUMBER: '/api/v1/cryo-production/validate-catalog-number', // ✅ NEW
    VALIDATE_NEW_PRODUCT: '/api/v1/cryo-production/validate-new-product', // ✅ NEW
    // Business logic endpoints
    AUTO_SELECT_PRODUCT: '/api/v1/cryo-production/auto-select-product',
    CHECK_BL_INTERDICTION: '/api/v1/cryo-production/check-bl-interdiction', // ✅ NEW
    UPDATE_ADD_ON_BAGS: '/api/v1/cryo-production/update-add-on-bags', // ✅ NEW
    TEMPERATURE_RANGES: (thawMethod: string) => `/api/v1/cryo-production/temperature-ranges/${encodeURIComponent(thawMethod)}`,
    FREEZE_TIME_RANGES: (thawMethod: string) => `/api/v1/cryo-production/freeze-time-ranges/${encodeURIComponent(thawMethod)}`,
    REPRINT_LABEL: '/api/v1/cryo-production/reprint-label',
    GET_SEPARATION_INFO: (unitId: string) => `/api/v1/cryo-production/separation-info/${encodeURIComponent(unitId)}`,
    GET_INTENDED_USE: (unitId: string, productCode: string) =>
      `/api/v1/cryo-production/intended-use/${encodeURIComponent(unitId)}?productCode=${encodeURIComponent(productCode)}`,
    GET_PRODUCT_VARIANTS: (catalogNumber: string, antiCode?: string, volume?: number) => {
      let url = `/api/v1/cryo-production/product-variants?catalogNumber=${encodeURIComponent(catalogNumber)}`;
      if (antiCode) url += `&antiCode=${encodeURIComponent(antiCode)}`;
      if (volume) url += `&volume=${volume}`;
      return url;
    }
  },

  CRYO_WORKSHEET_UNITS: {
    GET_WORKSHEETS: (take: number, skip: number) => `/api/v1/cryo-worksheet-units/worksheets/${take}/${skip}`,
    GET_UNITS: (worksheetId: string, take: number, skip: number) => `/api/v1/cryo-worksheet-units/${encodeURIComponent(worksheetId)}/${take}/${skip}`,
    DELETE_UNITS: '/api/v1/cryo-worksheet-units'
  },

  CRYO_RESULTS_QUERY: {
    GET_WORKSHEETS: '/api/v1/cryo-results-query/worksheets',
    GET_UNITS: (worksheetId: string, take: number, skip: number) =>
      `/api/v1/cryo-results-query/${encodeURIComponent(worksheetId)}/${take}/${skip}`,
  },

  SP_ANTIGEN_GROUPS: {
    LIST: (take: number, skip: number) => `/api/v1/antigen-groups/${take}/${skip}`,
    GET_BY_ID: (antigenGroup: string, testId: string) => `/api/v1/antigen-groups/${encodeURIComponent(antigenGroup)}/${encodeURIComponent(testId)}`,
    GET_BY_GROUP: (antigenGroup: string) => `/api/v1/antigen-groups/by-group/${encodeURIComponent(antigenGroup)}`,
    CREATE: '/api/v1/antigen-groups',
    UPDATE: (antigenGroup: string, testId: string) => `/api/v1/antigen-groups/${encodeURIComponent(antigenGroup)}/${encodeURIComponent(testId)}`,
    DELETE: (antigenGroup: string, testId: string) => `/api/v1/antigen-groups/${encodeURIComponent(antigenGroup)}/${encodeURIComponent(testId)}`,
    LOV_ANTIGEN_GROUPS: '/api/v1/antigen-groups/lov/antigen-groups',
    LOV_TEST_IDS: '/api/v1/antigen-groups/lov/test-ids',
    LOV_TEST_RESULTS: '/api/v1/antigen-groups/lov/test-results',
  },

  SP_ANTIGEN_RARITIES: {
    LIST: (take: number, skip: number) => `/api/v1/valid-rarity-codes/${take}/${skip}`,
    GET_BY_ID: (matrixId: number) => `/api/v1/valid-rarity-codes/${matrixId}`,
    CREATE: '/api/v1/valid-rarity-codes',
    UPDATE: (matrixId: number) => `/api/v1/valid-rarity-codes/${matrixId}`,
    DELETE: (matrixId: number) => `/api/v1/valid-rarity-codes/${matrixId}`,
    DETAILS: (matrixId: number) => `/api/v1/valid-rarity-codes/${matrixId}/details`,
    DETAILS_LIST: (matrixId: number, take: number, skip: number) => `/api/v1/valid-rarity-codes/${matrixId}/details/${take}/${skip}`,
    LOV_MATRIX_IDS: '/api/v1/valid-rarity-codes/lov/matrix-ids',
    LOV_TEST_IDS: '/api/v1/valid-rarity-codes/lov/test-ids',
    LOV_TEST_RESULTS: '/api/v1/valid-rarity-codes/lov/test-results',
  },

  DONOR_INTERDICTION: {
    VALID_DONOR_OVERRIDES: (take: number, skip: number) =>
      `/api/v1/donor-interdiction/valid-donor-overrides/${take}/${skip}`,
    LOOKUP_CUE: '/api/v1/donor-interdiction/valid-donor-overrides/lookup/cue',
    LOOKUP_TYPE: '/api/v1/donor-interdiction/valid-donor-overrides/lookup/type',
  },

  RESOURCE_AVAILABILITY: {
    DETAILS: '/api/v1/resource-availability/details',
    INSERT: '/api/v1/resource-availability/insert',
    UPDATE: '/api/v1/resource-availability/update',
    VALID_RESOURCES: '/api/v1/resource-availability/resource-codes-dropdown',
    WEEK_DAYS_DROPDOWN: '/api/v1/resource-availability/week-days-dropdown',
    ACTIVE_RESOURCES_SUMMARY: '/api/v1/resource-availability/active-resources-summary',
  },
  DONOR: {
    RESOURCE_STATUS_QUERY: (take: number, skip: number) => `/api/v1/resource-status-query/${take}/${skip}`,
    RESOURCE_STATUS_QUERY_RESOURCES: '/api/v1/resource-status-query/resources',
    MULTIPLE_DONORS_QUERY_SEARCH: (take: number, skip: number) => `/api/v1/multiple-donors-query/search/${take}/${skip}`,
    MULTIPLE_DONORS_QUERY_MAX_ROWS: '/api/v1/multiple-donors-query/max-rows',
  },

  DONOR_NOTIFICATION: {
    // Get all / filter donor notifications (paginated)
    SEARCH: (take: number, skip: number) => `/api/donor-notification/${take}/${skip}`,

    // Get by composite key
    GET_BY_ID: (donorId: string, comCode: string, comDate: string) =>
      `/api/donor-notification/${encodeURIComponent(donorId)}/${encodeURIComponent(comCode)}/${encodeURIComponent(comDate)}`,

    // Create new notification
    CREATE: '/api/donor-notification',

    // Update notification
    UPDATE: (donorId: string, comCode: string, comDate: string) =>
      `/api/donor-notification/${encodeURIComponent(donorId)}/${encodeURIComponent(comCode)}/${encodeURIComponent(comDate)}`,

    // Delete notification
    DELETE: (donorId: string, comCode: string, comDate: string) =>
      `/api/donor-notification/${encodeURIComponent(donorId)}/${encodeURIComponent(comCode)}/${encodeURIComponent(comDate)}`,
  },

  HLA: {
    // Define HLA Interim Output (HLAINTOT) endpoints
    INTERIM_OUTPUT: {
      SEARCH: (take: number, skip: number) =>
        `/api/v1/hla-interim-output/${take}/${skip}`,
      GET_BY_MATCH: (matchA1A1: string, matchA1A2: string, matchA2A1: string, matchA2A2: string) =>
        `/api/v1/hla-interim-output/${encodeURIComponent(matchA1A1)}/${encodeURIComponent(matchA1A2)}/${encodeURIComponent(matchA2A1)}/${encodeURIComponent(matchA2A2)}`,
      CREATE: '/api/v1/hla-interim-output',
      UPDATE: (matchA1A1: string, matchA1A2: string, matchA2A1: string, matchA2A2: string) =>
        `/api/v1/hla-interim-output/${encodeURIComponent(matchA1A1)}/${encodeURIComponent(matchA1A2)}/${encodeURIComponent(matchA2A1)}/${encodeURIComponent(matchA2A2)}`,
      GET_FILTER_VALUES: '/api/v1/hla-interim-output/filter-values',
      GET_INTERIM_CODES_LOV: '/api/v1/hla-interim-output/lov/interim-codes'
    },
  },

  RECRUITMENT: {
    DAY_STATUS_CODES: (take: number, skip: number) =>
      `/api/v1/recruitment/define-day-status-codes/${take}/${skip}`,
    DAY_STATUS_CODES_FILTERS: '/api/v1/recruitment/define-day-status-codes/filter',
    ADD_DAY_STATUS_CODE: '/api/v1/recruitment/define-day-status-codes',
    UPDATE_DAY_STATUS_CODE: '/api/v1/recruitment/define-day-status-codes',
    DRIVE_SHEET_PRINT_STATUS: '/api/v1/drive-sheet-print-status',

    // Parent Sponsor Query (MRQSPCHL)
    PARENT_SPONSOR_QUERY: {
      PARENT_SPONSORS_LOOKUP: '/api/v1/parent-sponsor-query/lookups/parent-sponsors',
      PARENT_INFO: (sponsorId: string) => `/api/v1/parent-sponsor-query/parent-info/${sponsorId}`,
      CONSTITUENT_SPONSORS: (take: number, skip: number) =>
        `/api/v1/parent-sponsor-query/constituent-sponsors/${take}/${skip}`,
    },

    // Drives by Sponsor Query (MRQRECDR)
    SPONSOR_DRIVES: {
      SPONSORS_LOOKUP: '/api/v1/sponsor-drives/lookups/sponsors',
      SPONSOR_DETAILS: (sponsorId: string) => `/api/v1/sponsor-drives/sponsors/${sponsorId}`,
      SEARCH: (take: number, skip: number) => `/api/v1/sponsor-drives/search?skip=${skip}&take=${take}`,
      SPONSOR_INSTRUCTIONS: (sponsorId: string) => `/api/v1/sponsor-drives/sponsors/${sponsorId}/instructions`,
    },

    // Drive Projections (Draw Query)
    DRIVE_PROJECTIONS: '/api/v1/drive-projections',
    DRIVE_PROJECTIONS_DONATION_TYPES: '/api/v1/drive-projections/lookups/donation-types',
    DRIVE_PROJECTIONS_DETAILS: (driveDate: string) =>
      `/api/v1/drive-projections/details/${encodeURIComponent(driveDate)}`,

    // Donations on Hold Query (DONHOLDQ)
    DONATIONS_ON_HOLD: {
      SEARCH: (take: number, skip: number) =>
        `/api/v1/donations-on-hold/${take}/${skip}`,
      DONATION_HOLDS: (transactionId: string) =>
        `/api/v1/donations-on-hold/${encodeURIComponent(transactionId)}/donation-holds`,
      DONOR_HOLDS: (transactionId: string, donorId: string) =>
        `/api/v1/donations-on-hold/${encodeURIComponent(transactionId)}/donor-holds/${encodeURIComponent(donorId)}`,
      LOOKUPS: '/api/v1/donations-on-hold/lookups',
      DRIVES_LOOKUP: '/api/v1/donations-on-hold/drives-lookup',
      USERS_LOOKUP: '/api/v1/donations-on-hold/users-lookup',
    },

    MERGE_DUPLICATE_SPONSORS: {
      SPONSORS_LOV: (take: number, skip: number) =>
        `/api/v1/duplicate-sponsor-merge/sponsors-lov/${take}/${skip}`,
      RETRIEVE: '/api/v1/duplicate-sponsor-merge/retrieve',
      DRIVES: (sponsorId: string) =>
        `/api/v1/duplicate-sponsor-merge/drives/${encodeURIComponent(sponsorId)}`,
      MERGE: '/api/v1/duplicate-sponsor-merge/merge',
    },
    // Drive Details Query (MCQDRIVE)
    DRIVE_DETAILS_QUERY: {
      FILTERS: '/api/v1/drive-details-query/filters',
      GET_DETAILS: '/api/v1/drive-details-query',
      LOCATION_NOTES: '/api/v1/drive-details-query/location-notes',
      CHECKLIST: '/api/v1/drive-details-query/checklist',
      RESOURCES: '/api/v1/drive-details-query/resources',
      PICKUP_SCHEDULE: '/api/v1/drive-details-query/pickup-schedule',
      SUPPLIES: '/api/v1/drive-details-query/supplies',
      PROCEDURES: '/api/v1/drive-details-query/procedures'
    },

    // Maintain Drive Location (DRIVELOC)
    MAINTAIN_DRIVE_LOCATION: {
      SEARCH: (take: number, skip: number) => `/api/v1/drive-locations/search/${take}/${skip}`,
      GET_DETAILS: (locationId: string, chapterId: string) => `/api/v1/drive-locations/${locationId}/${chapterId}`,
      GET_NOTES: (locationId: string, chapterId: string) => `/api/v1/drive-locations/${locationId}/${chapterId}/notes`,
      UPSERT: '/api/v1/drive-locations/upsert',
      LOOKUPS: {
        LOCATION_TYPE: '/api/v1/drive-locations/lookups/location-type',
        LOCATION: (chapterId: string, locationType: string) => `/api/v1/drive-locations/lookups/location/${chapterId}/${locationType}`,
        CITY_STATE_BY_ZIP: (zipCode: string) => `/api/v1/drive-locations/lookups/city-state/${zipCode}`,
        SPONSOR: (chapterId: string) => `/api/v1/drive-locations/lookups/sponsor/${chapterId}`,
        HOSPITAL: (chapterId: string) => `/api/v1/drive-locations/lookups/hospital/${chapterId}`,
        STAFF: (chapterId: string) => `/api/v1/drive-locations/lookups/staff/${chapterId}`,
        FACILITY: '/api/v1/drive-locations/lookups/facility',
      }
    },

    // Cancel Fixed & Special Drives (MCICANSF)
    CANCEL_DRIVES: {
      SEARCH: '/api/v1/cancel-drives/search',
      GET_BY_ID: (driveId: string) =>
        `/api/v1/cancel-drives/${encodeURIComponent(driveId)}`,
      CANCEL: (driveId: string) =>
        `/api/v1/cancel-drives/${encodeURIComponent(driveId)}/cancel`,
      LOOKUPS: {
        CANCEL_REASON_CODES: '/api/v1/cancel-drives/cancel-reason-codes',
        DRIVES_LOOKUP: '/api/v1/cancel-drives/drives-lookup',
      },
    },

    // Special Drives (Create or Modify Special Drive)
    SPECIAL_DRIVES: {
      // Search (paginated)
      SEARCH: (take: number, skip: number) =>
        `/api/v1/special-drives/${take}/${skip}`,

      // CRUD
      GET_BY_ID: (driveId: string) =>
        `/api/v1/special-drives/${encodeURIComponent(driveId)}`,
      CREATE: '/api/v1/special-drives',
      UPDATE: (driveId: string) =>
        `/api/v1/special-drives/${encodeURIComponent(driveId)}`,
      DELETE: (driveId: string) =>
        `/api/v1/special-drives/${encodeURIComponent(driveId)}`,
      RECREATE: '/api/v1/special-drives/recreate',

      // Lookups
      LOOKUPS: {
        DRIVE_CATEGORIES: '/api/v1/special-drives/lookups/drive-categories',
        DRIVE_IDS: (chapterId: string) =>
          `/api/v1/special-drives/lookups/drive-ids?chapterId=${encodeURIComponent(chapterId)}`,
        RESOURCES: (chapterId: string) =>
          `/api/v1/special-drives/lookups/resources?chapterId=${encodeURIComponent(chapterId)}`,
        SPONSORS: (take: number, skip: number) =>
          `/api/v1/special-drives/lookups/sponsors/${take}/${skip}`,
        LOCATIONS: (chapterId: string) =>
          `/api/v1/special-drives/lookups/locations/${encodeURIComponent(chapterId)}`,
        RECRUITERS: (chapterId: string) =>
          `/api/v1/special-drives/lookups/recruiters/${encodeURIComponent(chapterId)}`,
        CANCEL_CODES: '/api/v1/special-drives/lookups/cancel-codes',
        DEFAULT_DEFERRAL_RATE: '/api/v1/special-drives/lookups/default-deferral-rate',
        SPDR_LIMIT: '/api/v1/special-drives/lookups/spdr-limit',
      }
    },

    DRIVE_STATISTICS: {
      GET: (driveId: string, chapterId: string) =>
        `/api/v1/drive-statistics/${encodeURIComponent(driveId)}/${encodeURIComponent(chapterId)}`,
    },

    DONATION_ENTRY_DETAILS: {
      GET: (transactionId: string) =>
        `/api/v1/donation-entry-details/${encodeURIComponent(transactionId)}`,
      GET_WITH_DONOR: (unitId: string, collDate?: string) =>
        `/api/v1/donation-entry-details/${encodeURIComponent(unitId)}/with-donor${collDate ? `?collDate=${encodeURIComponent(collDate)}` : ''}`,
    },

    DEFERRAL_ENTRY_DETAILS: {
      GET_ALL: (take: number, skip: number) =>
        `/api/v1/deferral-entry-details/${take}/${skip}`,
      GET_BY_COMPOSITE_KEY: (donorId: string, driveDate: string) =>
        `/api/v1/deferral-entry-details/${encodeURIComponent(donorId)}/${encodeURIComponent(driveDate)}`,
      GET_BY_DONOR: (donorId: string, take: number, skip: number) =>
        `/api/v1/deferral-entry-details/by-donor/${encodeURIComponent(donorId)}/${take}/${skip}`,
    },

    // HLA Matching Grades (Valid HLA Grading)
    HLA_MATCHING_GRADES: {
      SEARCH: (take: number, skip: number) => `/api/v1/hla-grading/${take}/${skip}`,
      DROPDOWNS: '/api/v1/hla-grading/dropdowns',
      NEXT_GRADE_ID: '/api/v1/hla-grading/next-grade-id',
      CREATE: '/api/v1/hla-grading/create',
      UPDATE: '/api/v1/hla-grading/update',
    },

    // HLA Cross-Reactive Groups (Valid HLA Epitopes)
    HLA_CROSS_REACTIVE_GROUPS: {
      SEARCH: (take: number, skip: number) => `/api/v1/valid-hla-epitopes/${take}/${skip}`,
      GET_BY_ID: (publicEpitopeId: string, associatedEpitopeId: string) =>
        `/api/v1/valid-hla-epitopes/${encodeURIComponent(publicEpitopeId)}/${encodeURIComponent(associatedEpitopeId)}`,
      CREATE: '/api/v1/valid-hla-epitopes',
      UPDATE: (publicEpitopeId: string, associatedEpitopeId: string) =>
        `/api/v1/valid-hla-epitopes/${encodeURIComponent(publicEpitopeId)}/${encodeURIComponent(associatedEpitopeId)}`,
      PUBLIC_EPITOPES: '/api/v1/valid-hla-epitopes/public-epitopes',
      HLA_STANDARDS: '/api/v1/valid-hla-epitopes/hla-standards',
      HLA_STANDARDS_FROM_MASTER_CODE: '/api/v1/valid-hla-epitopes/hla-standards-from-master-code',
      HLA_STANDARDS_FROM_EPITOPES: '/api/v1/valid-hla-epitopes/hla-standards-from-epitopes',
      ASSOCIATED_EPITOPES: '/api/v1/valid-hla-epitopes/associated-epitopes',
    },
  },

  DONOR_PROFILE: {
    MERGE_DUPLICATE_DONORS: {
      DUPLICATE_SETS: (take: number, skip: number) =>
        `/api/v1/donor-merge/duplicate-sets/${take}/${skip}`,
      GET_SET: (setId: string) =>
        `/api/v1/donor-merge/duplicate-sets/${encodeURIComponent(setId)}`,
      PREVIEW: '/api/v1/donor-merge/preview',
      MERGE: '/api/v1/donor-merge/merge',
      RESOLVE: '/api/v1/donor-merge/resolve',
    },
  },

  MONTHLY_COLLECTION_GOALS: {
    // Lookups
    GOAL_TYPES: '/api/v1/monthly-collection-goals/lookups/goal-types',
    CUSTODIANS: (goalType: string) => `/api/v1/monthly-collection-goals/lookups/custodians/${goalType}`,
    YEAR_RANGE: '/api/v1/monthly-collection-goals/lookups/year-range',
    // Search Tab
    SEARCH: '/api/v1/monthly-collection-goals/summary',
    MONTH_DETAILS: '/api/v1/monthly-collection-goals/month-details',
    // Summary Tabs
    BY_DONATION_TYPE: '/api/v1/monthly-collection-goals/by-donation-type',
    BY_PROCEDURE_TYPE: '/api/v1/monthly-collection-goals/by-procedure-type',
    TERRITORIES: '/api/v1/monthly-collection-goals/territories',
    FIXED_SITES: '/api/v1/monthly-collection-goals/fixed-sites',
  },

  LAB_MASTER_CODES: {
    GET_ALL: (take: number, skip: number) => `/api/v1/lab-master-codes/${take}/${skip}`,
    GET_BY_CODE_TYPE: (codeType: string, take: number, skip: number) =>
      `/api/v1/lab-master-codes/${encodeURIComponent(codeType)}/${take}/${skip}`,
    CREATE: '/api/v1/lab-master-codes',
    UPDATE: (codeType: string, code: string) =>
      `/api/v1/lab-master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`,
    DELETE: (codeType: string, code: string) =>
      `/api/v1/lab-master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`,
  },

  PROCEDURE_ATTRIBUTE_EQUIPMENT: {
    BASE: '/api/procedure-attribute-equipment',
    BY_ATTRIBUTE_GROUP: (attributeGroup: string) =>
      `/api/procedure-attribute-equipment/${encodeURIComponent(attributeGroup)}`,
    CREATE: '/api/procedure-attribute-equipment',
    UPDATE: (attrGroup: string, attrCode: string, equipType: string, paramCode: string) =>
      `/api/procedure-attribute-equipment/${encodeURIComponent(attrGroup)}/${encodeURIComponent(attrCode)}/${encodeURIComponent(equipType)}/${encodeURIComponent(paramCode)}`,
    DELETE: (attrGroup: string, attrCode: string, equipType: string, paramCode: string) =>
      `/api/procedure-attribute-equipment/${encodeURIComponent(attrGroup)}/${encodeURIComponent(attrCode)}/${encodeURIComponent(equipType)}/${encodeURIComponent(paramCode)}`,
    DROPDOWNS: {
      ATTRIBUTE_GROUPS: '/api/procedure-attribute-equipment/dropdowns/attribute-groups',
      ATTRIBUTE_CODES: (attributeGroup: string) =>
        `/api/procedure-attribute-equipment/dropdowns/attribute-codes/${encodeURIComponent(attributeGroup)}`,
      EQUIPMENT_TYPES: '/api/procedure-attribute-equipment/dropdowns/equipment-types',
      PARAMETER_CODES: '/api/procedure-attribute-equipment/dropdowns/parameter-codes'
    }
  },

  LOOKUPS: {
    BY_CODE_TYPE: (codeType: string) => `/api/v1/shared/lookups/${encodeURIComponent(codeType)}`,
    VALIDATE: (codeType: string, code: string) =>
      `/api/v1/shared/lookups/${encodeURIComponent(codeType)}/validate/${encodeURIComponent(code)}`,
  },

  SHARED_SCAN: {
    VALIDATE_TRAY_SCAN: '/api/v1/shared/validate-tray-scan',
  },

  ALTERNATE_DEMOGRAPHICS: {
    GET: (donorId: string) => `/api/v1/shared/alternate-demographics/${encodeURIComponent(donorId)}`,
    UPDATE: (donorId: string) => `/api/v1/shared/alternate-demographics/${encodeURIComponent(donorId)}`,
    CITY_STATE: '/api/v1/shared/city-state',
    VALIDATE: '/api/v1/shared/alternate-demographics/validate',
  },

  DONOR_DEMOGRAPHICS: {
    GET: (donorId: string) => `/api/v1/donor-demographics/${encodeURIComponent(donorId)}`,
    UPDATE: (donorId: string) => `/api/v1/donor-demographics/${encodeURIComponent(donorId)}`,
    HEADER: (donorId: string) => `/api/v1/donor-demographics/${encodeURIComponent(donorId)}/header`,
    CITY_STATE: '/api/v1/shared/city-state',
  },

  DONATION_DETAILS: {
    GET: (donorId: string, take: number, skip: number) =>
      `/api/v1/donation-details/${encodeURIComponent(donorId)}/${take}/${skip}`,
    UPDATE_CREDIT_SPONSOR: (unitId: string) =>
      `/api/v1/donation-details/${encodeURIComponent(unitId)}/credit-sponsor`,
    AUX_DONATIONS: (donorId: string) =>
      `/api/v1/donation-details/${encodeURIComponent(donorId)}/aux-donations`,
    EQUIP_SUPPLY: (transactionId: string) =>
      `/api/v1/donation-details/transactions/${encodeURIComponent(transactionId)}/equip-supply`,
    ATTRIBUTES: (transactionId: string) =>
      `/api/v1/donation-details/transactions/${encodeURIComponent(transactionId)}/attributes`,
    PHYSICAL_COMMENTS: (transactionId: string) =>
      `/api/v1/donation-details/transactions/${encodeURIComponent(transactionId)}/physical-comments`,
    SPONSOR_SEARCH: '/api/v1/donation-details/sponsors/search',
    ACCESS: '/api/v1/donation-details/access',
  },

  INTERNATIONAL_ADDRESS: {
    COUNTRIES: '/api/v1/shared/countries',
    VALIDATE: '/api/v1/shared/international-address/validate',
    SAVE: '/api/v1/shared/international-address/save',
  },

  SPONSOR_CONTACTS: {
    GET_ALL: (take: number, skip: number) =>
      `/api/v1/sponsor-contacts/${take}/${skip}`,
    SPONSOR_IDS: (chapterId: string) =>
      `/api/v1/sponsor-contacts/sponsor-ids?chapterId=${encodeURIComponent(chapterId)}`,
    CONTACT_NAMES: (chapterId: string) =>
      `/api/v1/sponsor-contacts/contact-names?chapterId=${encodeURIComponent(chapterId)}`,
    GET_DETAIL: (sponsorId: string, addressId: string) =>
      `/api/v1/sponsor-contacts/${sponsorId}/${addressId}`,
    TITLES: '/api/v1/sponsor-contacts/titles',
    SALUTATIONS: '/api/v1/sponsor-contacts/salutations',
    CONTACT_TYPES: '/api/v1/sponsor-contacts/contact-types',
    COUNTRIES: '/api/v1/sponsor-contacts/countries',
    CREATE: '/api/v1/sponsor-contacts',
    UPDATE: (sponsorId: string, addressId: string, chapterId: string) =>
      `/api/v1/sponsor-contacts/${sponsorId}/${addressId}?chapterId=${encodeURIComponent(chapterId)}`,
    ADD_NOTE: (sponsorId: string, addressId: string, chapterId: string) =>
      `/api/v1/sponsor-contacts/${sponsorId}/${addressId}/notes?chapterId=${encodeURIComponent(chapterId)}`,
    UPDATE_NOTE: (noteId: string, auditKey: number) =>
      `/api/v1/sponsor-contacts/notes/${noteId}/${auditKey}`,
    DELETE_NOTE: (sponsorId: string, addressId: string, auditKey: number) =>
      `/api/v1/sponsor-contacts/${sponsorId}/${addressId}/notes/${auditKey}`,
    LOOKUPS: (lookupType: string) =>
      `/api/v1/sponsor-contacts/lookups/${encodeURIComponent(lookupType)}`,
    ZIP_CODES: (zipCode: string) =>
      `/api/v1/sponsor-contacts/zip-codes/${encodeURIComponent(zipCode)}`
  },

  DRIVE_SHEET_PRINT_STATUS: '/api/v1/drive-sheet-print-status',

  // Alternate ID Configuration endpoints
  ALTERNATE_ID_CONFIG: {
    GET_ALL: (take: number, skip: number) =>
      `/api/v1/alt-id-donor-grades/${take}/${skip}`,
    GET_BY_AUDIT_KEY: (auditKey: number) =>
      `/api/v1/alt-id-donor-grades/${auditKey}`,
    CREATE: '/api/v1/alt-id-donor-grades',
    UPDATE: '/api/v1/alt-id-donor-grades',
    DELETE: (auditKey: number) =>
      `/api/v1/alt-id-donor-grades/${auditKey}`,
  },

  USER_UTILITIES: {
    // POST /api/v1/user-utilities/report-actions/{take}/{skip}
    REPORT_ACTIONS: (take: number, skip: number) =>
      `/api/v1/user-utilities/report-actions/${take}/${skip}`,

    // GET /api/v1/user-utilities/report-action/{reportName}/{parmId}/{userName}
    REPORT_ACTION_BY_KEY: (reportName: string, parmId: string, userName: string) =>
      `/api/v1/user-utilities/report-action/${encodeURIComponent(reportName)}/${encodeURIComponent(parmId)}/${encodeURIComponent(userName)}`,

    // POST /api/v1/user-utilities/report-action/url
    REPORT_ACTION_URL: '/api/v1/user-utilities/report-action/url',

    // DELETE /api/v1/user-utilities/report-action/{reportName}/{parmId}/{userName}/{applId}
    REPORT_ACTION_DELETE: (reportName: string, parmId: string, userName: string, applId: string) =>
      `/api/v1/user-utilities/report-action/${encodeURIComponent(reportName)}/${encodeURIComponent(parmId)}/${encodeURIComponent(userName)}/${encodeURIComponent(applId)}`,

    // GET /api/v1/user-utilities/report-actions/dropdowns
    REPORT_ACTIONS_DROPDOWNS: '/api/v1/user-utilities/report-actions/dropdowns',

    // GET /api/v1/user-utilities/report-actions/distinct-usernames
    REPORT_ACTIONS_DISTINCT_USERNAMES: '/api/v1/user-utilities/report-actions/distinct-usernames',

    // GET /api/v1/user-utilities/report-actions/auto-refresh-interval
    REPORT_ACTIONS_AUTO_REFRESH_INTERVAL: '/api/v1/user-utilities/report-actions/auto-refresh-interval',

    // GET /api/v1/user-utilities/report-actions/is-supervisor
    REPORT_ACTIONS_IS_SUPERVISOR: '/api/v1/user-utilities/report-actions/is-supervisor',

    // POST /api/v1/user-utilities/report-action/show-log
    REPORT_ACTION_SHOW_LOG: '/api/v1/user-utilities/report-action/show-log',

    // DELETE /api/v1/user-utilities/report-action/log-cleanup/{sessionId}/{parmId}
    REPORT_ACTION_LOG_CLEANUP: (sessionId: string, parmId: string) =>
      `/api/v1/user-utilities/report-action/log-cleanup/${encodeURIComponent(sessionId)}/${encodeURIComponent(parmId)}`,

    // GET /api/v1/user-utilities/user-details/{userId}
    USER_DETAILS: (userId: string) =>
      `/api/v1/user-utilities/user-details/${encodeURIComponent(userId)}`,

    // GET /api/v1/user-utilities/users-by-chapter/{chapterId}
    USERS_BY_CHAPTER: (chapterId: string) =>
      `/api/v1/user-utilities/users-by-chapter/${encodeURIComponent(chapterId)}`,

    // Document Library endpoints
    DOCUMENT_LIBRARY: {
      UPLOAD: '/api/v1/document-library/upload',
      SEARCH: (take: number, skip: number) => `/api/v1/document-library/search/${take}/${skip}`,
      GET: (sessionId: string) => `/api/v1/document-library/${encodeURIComponent(sessionId)}`,
      DOWNLOAD: (sessionId: string) => `/api/v1/document-library/${encodeURIComponent(sessionId)}/download`,
      DELETE: (sessionId: string) => `/api/v1/document-library/${encodeURIComponent(sessionId)}`,
      LINK_CATEGORIES: '/api/v1/document-library/link-categories',
      VALIDATE_VALUE: '/api/v1/document-library/validate-value',
      LINK_VALUES: (sessionId: string) => `/api/v1/document-library/${encodeURIComponent(sessionId)}/link-values`,
      COLUMN_CODES: '/api/v1/document-library/column-codes',
    },
  },

  ABBREVIATED_QUESTIONNAIRE: {
    GET: '/api/v1/donors/abbreviated-questionnaire-setup',
    DONATION_TYPES: '/api/v1/donors/abbreviated-questionnaire-setup/donation-types',
    UPDATE: '/api/v1/donors/abbreviated-questionnaire-setup',
  },

  DONOR_FUNCTIONS: {
    AUDIT_DONATION: {
      GET_DONATION: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}`,
      GET_DONATION_BY_DEFERRAL: (deferralId: string) => `/api/v1/donors/audit-donation/by-deferral/${encodeURIComponent(deferralId)}`,
      GET_HEALTH_HISTORY: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/health-history`,
      ADD_HEALTH_HISTORY_RESPONSE: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/health-history`,
      UPDATE_HEALTH_HISTORY: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/health-history`,
      DELETE_HEALTH_HISTORY: (unitId: string, questionCode: string, auditKey: number) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/health-history/${encodeURIComponent(questionCode)}/${auditKey}`,
      GET_PHYSICAL_FINDINGS: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/physical-findings`,
      ADD_PHYSICAL_FINDING: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/physical-findings/add`,
      UPDATE_PHYSICAL_FINDINGS: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/physical-findings`,
      DELETE_PHYSICAL_FINDING: (unitId: string, physicalCode: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/physical-findings/${encodeURIComponent(physicalCode)}`,
      GET_INTERDICTIONS: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/interdictions`,
      ADD_INTERDICTION: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/interdictions`,
      REMOVE_INTERDICTION: (unitId: string, interCode: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/interdictions/${encodeURIComponent(interCode)}`,
      GET_HH_TEMPLATE: (donationType: string, collectionDate?: string, transactionId?: string, donorId?: string) =>
        `/api/v1/donors/audit-donation/health-history-template?donationType=${encodeURIComponent(donationType)}` +
        (collectionDate ? `&collectionDate=${encodeURIComponent(collectionDate)}` : '') +
        (transactionId ? `&transactionId=${encodeURIComponent(transactionId)}` : '') +
        (donorId ? `&donorId=${encodeURIComponent(donorId)}` : ''),
      ADD_QUESTION_TO_TEMPLATE: `/api/v1/donors/audit-donation/health-history-template`,
      DELETE_QUESTION_FROM_TEMPLATE: (questionCode: string, donationType: string) => `/api/v1/donors/audit-donation/health-history-template?donationType=${encodeURIComponent(donationType)}&questionCode=${encodeURIComponent(questionCode)}`,
      SAVE_DONATION_AUDIT: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}`,
      PLACE_HOLD: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/place-hold`,
      GET_PF_TEMPLATE: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/physical-findings-template`,
      GET_PF_VALUE_RULES: (unitId: string) => `/api/v1/donors/audit-donation/${encodeURIComponent(unitId)}/physical-value-rules`,
      GET_PF_WEIGHT_CODE: `/api/v1/donors/audit-donation/pf-weight-code`,
      GET_HOLD_CODES: `/api/v1/donors/audit-donation/hold-codes`,
      GET_PERIOD_TYPE_MULTIPLIERS: `/api/v1/donors/audit-donation/period-type-multipliers`,
      GET_NODOSIGN_CODE: `/api/v1/donors/audit-donation/nodonsign-code`,
      GET_NODONATION_CODE: `/api/v1/donors/audit-donation/nodonation-code`,
      GET_NOPROCEDUR_CODE: `/api/v1/donors/audit-donation/noprocedur-code`,
      VALIDATE_HH_COMMENT: `/api/v1/donors/audit-donation/validate-hh-comment`,
      VALIDATE_PF_COMMENT: `/api/v1/donors/audit-donation/validate-pf-comment`,
    },
    DONATION_DEFERRAL_AUDIT: {
      GET: (transactionId: string) => `/api/v1/donation-deferral-audit/${encodeURIComponent(transactionId)}`
    },
    COLLECTION_GOALS_BY_DATE: {
      GOAL_TYPES: '/api/v1/collection-goals-by-date/lookups/goal-types',
      CUSTODIANS: (goalType: string, chapterId: string) =>
        `/api/v1/collection-goals-by-date/lookups/custodians/${goalType}/${chapterId}`,
      SUMMARY: '/api/v1/collection-goals-by-date/summary'
    },
    COLLECTION_STATISTICS: {
      DONATION_TYPES: '/api/v1/collection-statistics/donation-types',
      PROCEDURE_CODES: '/api/v1/collection-statistics/procedure-codes',
      REPORT: '/api/v1/collection-statistics/report',
      DATE_DETAIL: '/api/v1/collection-statistics/date-detail',
      UNITS: '/api/v1/collection-statistics/units',
      GOALS: '/api/v1/collection-statistics/goals',
    },
    SITE_COLLECTION_STATISTICS: {
      BASE: '/api/v1/site-collection-statistics',
      DONATION_BREAKDOWN: '/api/v1/site-collection-statistics/donation-breakdown',
      UNIT_DETAILS: '/api/v1/site-collection-statistics/unit-details',
      GOALS: '/api/v1/site-collection-statistics/goals',
      SITES: '/api/v1/site-collection-statistics/sites',
    },
    SET_DRIVE_DATE_AND_ID: {
      USER_ACCESS: '/api/v1/set-drive-date-and-id/user-access',
      DRIVES: '/api/v1/set-drive-date-and-id/drives',
      VALIDATE: '/api/v1/set-drive-date-and-id/validate'
    },
    RBC_AG_GROUPS: {
      SEARCH: (take: number, skip: number) => `/api/v1/rbc-ag-groups/search-sort-filter/${take}/${skip}`,
      CREATE: '/api/v1/rbc-ag-groups',
      UPDATE: '/api/v1/rbc-ag-groups',
      BATCH_UPDATE: '/api/v1/rbc-ag-groups/batch-update',
      DELETE: (auditKey: number) => `/api/v1/rbc-ag-groups/${auditKey}`,
      FILTER_OPTIONS: '/api/v1/rbc-ag-groups/filter-options',
      LOOKUP_ANTIGEN_GROUPS: '/api/v1/rbc-ag-groups/lookups/antigen-groups',
      LOOKUP_SER_TEST_IDS: '/api/v1/rbc-ag-groups/lookups/ser-test-ids',
      LOOKUP_MOL_TEST_IDS: '/api/v1/rbc-ag-groups/lookups/mol-test-ids',
      CHECK_GROUP_EXISTS: '/api/v1/rbc-ag-groups/check-group-exists',
      COUNT: '/api/v1/rbc-ag-groups/count',
    },
    TEMPORARY_DRIVE_QUERY: '/api/v1/temporary-drive-query',
    TEMPORARY_DRIVE_QUERY_DETAIL: (tempdrId: string) => `/api/v1/temporary-drive-query/details/${encodeURIComponent(tempdrId)}`,
    TEMPORARY_DRIVE_QUERY_RECRUITERS: '/api/v1/temporary-drive-query/lookups/recruiters',
    TEMPORARY_DRIVE_QUERY_SPONSORS: '/api/v1/temporary-drive-query/lookups/sponsors',
    TEMPORARY_DRIVE_QUERY_FILTER_RECRUITERS: '/api/v1/temporary-drive-query/lookups/filter-recruiters',
    TEMPORARY_DRIVE_QUERY_FILTER_SPONSORS: '/api/v1/temporary-drive-query/lookups/filter-sponsors',
    REGISTERED_DONATIONS_QUERY: '/api/v1/donors/donation-query',
    REGISTERED_DONATIONS_QUERY_DRIVES: '/api/v1/donors/donation-query/drives-dropdown',
    REGISTERED_DONATIONS_QUERY_USERS: '/api/v1/donors/donation-query/users-dropdown',
    REGISTERED_DONATIONS_QUERY_SETS: '/api/v1/donors/donation-query/sets-dropdown',
    REGISTERED_DONATIONS_QUERY_LOV_LIMIT: '/api/v1/donors/donation-query/lov-limit',
    REGISTERED_DONATIONS_QUERY_PHLEBOTOMY_DETAILS: (transactionId: string) =>
      `/api/v1/donors/donation-query/phlebotomy-details/${encodeURIComponent(transactionId)}`,
    DONATIONS_PENDING_AUDIT: {
      SEARCH: '/api/v1/donations-pending-audit/search',
      DRIVES_DROPDOWN: '/api/v1/donations-pending-audit/drives/lov'
    },
    DEFERRALS_PENDING_AUDIT: {
      SEARCH: '/api/v1/deferrals-pending-audit/search',
      DRIVES_DROPDOWN: '/api/v1/donations-pending-audit/drives/lov' // Shared endpoint with donations
    },
    MULTIPLE_DRIVE_SELECTION_LOOKUPS: (chapterId: string) =>
      `/api/v1/multiple-drive-selection-query/lookups/${chapterId}`,
    MULTIPLE_DRIVE_SELECTION_QUERY: (chapterId: string, take: number, skip: number) =>
      `/api/v1/multiple-drive-selection-query/${chapterId}/${take}/${skip}`,

    // Graded Donors Query endpoints
    GRADED_DONORS_QUERY: {
      SEARCH: '/api/v1/donors/graded-donors-query',
      LAST_NAMES_LOV: '/api/v1/donors/graded-donors-query/last-names-lov',
      UNIT_IDS_LOV: '/api/v1/donors/graded-donors-query/unit-ids-lov',
      UNIT_HOLDS: '/api/v1/donation-hold-details/unit-holds',
      DONOR_HOLDS: '/api/v1/donation-hold-details/donor-holds'
    },

    // Unit Test Results Query endpoints (MLT-10914)
    UNIT_TEST_RESULTS_QUERY: {
      QUERY: '/api/v1/unit-test-results/query',
      GET_BY_UNIT_ID: (unitId: string) => `/api/v1/unit-test-results/${encodeURIComponent(unitId)}`
    },

    // Donor Survey Manager - Q&A Library
    DONOR_SURVEY_MANAGER: {
      QUESTIONS: '/api/v1/donor-survey-manager/questions',
      QUESTION_BY_CODE: (questionCode: string) =>
        `/api/v1/donor-survey-manager/questions/${encodeURIComponent(questionCode)}`,
      ANSWERS: (questionCode: string) =>
        `/api/v1/donor-survey-manager/questions/${encodeURIComponent(questionCode)}/answers`,
      ACCESS_CONFIG: '/api/v1/donor-survey-manager/access-config',
      ACCESS_CONFIG_CHAPTERS: '/api/v1/donor-survey-manager/access-config/chapters',
      ACCESS_CONFIG_FUNCTION_NAMES: '/api/v1/donor-survey-manager/access-config/webapp-function-names',
      ACCESS_CONFIG_UPDATE: (chapterId: string, donorType: string) =>
        `/api/v1/donor-survey-manager/access-config/${encodeURIComponent(chapterId)}/${encodeURIComponent(donorType)}`,
      RESPONSES: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${chapterId}/${templateId}/responses`,
      RESPONSE_DONORS: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${chapterId}/${templateId}/responses/donors`,
      RESPONSE_COMMENTS: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${chapterId}/${templateId}/responses/comments`,
    },

    // Survey Template endpoints
    SURVEY_TEMPLATE: {
      GET_ALL: '/api/v1/donor-survey-manager/templates',
      FILTER_DROPDOWN: '/api/v1/donor-survey-manager/templates/filter-dropdown',
      ADD_DROPDOWN: '/api/v1/donor-survey-manager/templates/add-dropdown',
      SURVEY_TYPES: '/api/v1/donor-survey-manager/survey-types',
      CREATE: '/api/v1/donor-survey-manager/templates',
      GET_BY_ID: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(chapterId)}/${encodeURIComponent(templateId)}`,
      UPDATE: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(chapterId)}/${encodeURIComponent(templateId)}`,
      DELETE: (templateId: string, chapterId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(templateId)}/${encodeURIComponent(chapterId)}`
    },

    // Template Link endpoints
    TEMPLATE_LINK: {
      GET_LINKS: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(chapterId)}/${encodeURIComponent(templateId)}/links`,
      CREATE_LINK: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(chapterId)}/${encodeURIComponent(templateId)}/links`,
      UPDATE_LINK: (chapterId: string, templateId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(chapterId)}/${encodeURIComponent(templateId)}/links`,
      CATEGORY_CODES: '/api/v1/donor-survey-manager/category-codes',
      CATEGORY_VALUES: (categoryCode: string) =>
        `/api/v1/donor-survey-manager/category-values/${encodeURIComponent(categoryCode)}`
    },

    // Attach Donor endpoints (DRUREHLD)
    ATTACH_DONOR: {
      GET_GRADED_DONORS: (transactionId: string) =>
        `/api/v1/attach-donor/graded-donors/${encodeURIComponent(transactionId)}`,
      GET_TRANSACTION: (transactionId: string) =>
        `/api/v1/attach-donor/transaction/${encodeURIComponent(transactionId)}`,
      GET_TRANSACTION_BY_UNIT: (unitId: string) =>
        `/api/v1/attach-donor/transaction/by-unit/${encodeURIComponent(unitId)}`,
      SELECT_DONOR: '/api/v1/attach-donor/select-donor',
      MARK_DUPLICATES: '/api/v1/attach-donor/mark-duplicates',
      MARK_FALSE_DUPLICATE: '/api/v1/attach-donor/mark-false-duplicate',
      PUT_DONOR_ON_HOLD: '/api/v1/attach-donor/put-on-hold',
      ADD_GRADED_DONOR: '/api/v1/attach-donor/add-graded-donor',
      GET_DONOR_DEMOGRAPHICS: (donorId: string) => `/api/v1/donor-demographics/${encodeURIComponent(donorId)}`,
      UPDATE_DONOR: (donorId: string) => `/api/v1/donors/${encodeURIComponent(donorId)}`
    },

    // Survey Questions (Q&A Library) endpoints
    SURVEY_QUESTIONS: {
      GET_ALL: '/api/v1/donor-survey-manager/valid-questions',
      GET_BY_ID: (questionId: string) =>
        `/api/v1/donor-survey-manager/questions/${encodeURIComponent(questionId)}`,
      CREATE: '/api/v1/donor-survey-manager/questions',
      UPDATE: '/api/v1/donor-survey-manager/questions',
      DELETE: (questionId: string, chapterId: string) =>
        `/api/v1/donor-survey-manager/questions/${encodeURIComponent(questionId)}/${encodeURIComponent(chapterId)}`,
      GET_ANSWERS: (questionCode: string) =>
        `/api/v1/donor-survey-manager/questions/${encodeURIComponent(questionCode)}/valid-answers`
    },

    // Template Questions (assigned to template) endpoints
    TEMPLATE_QUESTIONS: {
      GET_ASSIGNED: (templateId: string, chapterId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(templateId)}/${encodeURIComponent(chapterId)}/questions`,
      ASSIGN_QUESTIONS: (templateId: string, chapterId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(templateId)}/${encodeURIComponent(chapterId)}/questions`,
      UPDATE_SEQUENCE: (templateId: string, chapterId: string) =>
        `/api/v1/donor-survey-manager/templates/${encodeURIComponent(templateId)}/${encodeURIComponent(chapterId)}/questions/sequence`
    },

    // FastTrack Web Configuration endpoints
    FASTTRAK_WEB_CONFIG: {
      ADD_RESOURCE: '/api/v1/donors/fastrack-web-configuration/ValidHHResourceConfig/add',
      UPDATE_RESOURCE: '/api/v1/donors/fastrack-web-configuration/ValidHHResourceConfig',
      RETRIEVE_RESOURCES: '/api/v1/donors/fastrack-web-configuration/ValidHHResourceConfig',
      DONOR_RESPONSE_CONFIG: '/api/v1/donors/fastrack-web-configuration/donor-response-configuration',
      RESOURCE_CONFIG: '/api/v1/donors/fastrack-web-configuration/resource-configuration'
    },

    // Notification Log (DNWDCOMM) endpoints
    NOTIFICATION_LOG: {
      GET_DONOR_INFO: (donorId: string) =>
        `/api/v1/donors/notification-logs/${encodeURIComponent(donorId)}/donor-info`,
      GET_COMMUNICATION_TYPES: (donorId: string) =>
        `/api/v1/donors/notification-logs/${encodeURIComponent(donorId)}/communication-types`,
      GET_COMMUNICATION_CODES: (donorId: string, comType: string) =>
        `/api/v1/donors/notification-logs/${encodeURIComponent(donorId)}/communication-codes/${encodeURIComponent(comType)}`,
      GET_NOTIFICATION_LOGS: (donorId: string, comType?: string, comCode?: string) => {
        const baseUrl = `/api/v1/donors/notification-logs/${encodeURIComponent(donorId)}`;
        const params = [];
        if (comType) params.push(`ComType=${encodeURIComponent(comType)}`);
        if (comCode) params.push(`ComCode=${encodeURIComponent(comCode)}`);
        return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
      },
      GET_LETTER_DETAILS: (donorId: string, letterSeqNo: string) =>
        `/api/v1/donors/notification-logs/${encodeURIComponent(donorId)}/letter/${encodeURIComponent(letterSeqNo)}`,
      REPRINT_LETTER: (donorId: string, letterSeqNo: string) =>
        `/api/v1/donors/notification-logs/${encodeURIComponent(donorId)}/letter/${encodeURIComponent(letterSeqNo)}/reprint`,
      CREATE_COMMUNICATION: (donorId: string) =>
        `/api/v1/donors/notification-logs/${encodeURIComponent(donorId)}`,
      GET_ADD_DROPDOWN_VALUES: '/api/v1/donors/notification-logs/add-dropdown-values',
      GET_ADD_COMMUNICATION_CODES: (comType: string) =>
        `/api/v1/donors/notification-logs/add-communication-codes/${encodeURIComponent(comType)}`
    },

    // Donors by Events Query endpoints
    DONORS_BY_EVENTS_QUERY: {
      SEARCH_TYPES: '/api/v1/donor-search/search-types',
      SEARCH: '/api/v1/donor-search/search',
      VALUE_CODES: '/api/v1/donor-search/value-codes',
      DRIVES_LOV: '/api/v1/donor-search/drives-lov'
    },

    REGISTERED_DEFERRALS_QUERY: {
      QUERY: (take: number, skip: number) => `/api/v1/donor/registered-deferrals/${take}/${skip}`,
      DRIVES_LOV: '/api/v1/donor/registered-deferrals/drives-lov',
      USERS_LOV: '/api/v1/donor/registered-deferrals/users-lov',
      DEFERRALS_LOV: '/api/v1/donor/registered-deferrals/deferrals-lov',
      SETS_LOV: '/api/v1/donor/registered-deferrals/sets-lov',
      TRANSACTIONS_LOV: '/api/v1/donor/registered-deferrals/transactions-lov',
      LOV_LIMIT: '/api/v1/donor/registered-deferrals/lov-limit'
    },

    // Notification Letters (Valid Letters) endpoints
    NOTIFICATION_LETTERS: {
      LIST: (take: number, skip: number) => `/api/v1/donor/notification/valid-letters/${take}/${skip}`,
      CREATE: '/api/v1/donor/notification/valid-letters',
      REVISE: '/api/v1/donor/notification/valid-letters/revise',
      DETAIL: (letterCode: string, documentType?: string) =>
        `/api/v1/donor/notification/valid-letters/${encodeURIComponent(letterCode)}${documentType ? `?documentType=${encodeURIComponent(documentType)}` : ''}`,
      PREVIEW: (letterCode: string, versionNo: number, documentType?: string) =>
        `/api/v1/donor/notification/valid-letters/${encodeURIComponent(letterCode)}/${versionNo}/preview${documentType ? `?documentType=${encodeURIComponent(documentType)}` : ''}`,
      REPORT_PREVIEW: (letterId: string) =>
        `/api/v1/donor/notification/valid-letters/${encodeURIComponent(letterId)}/report-preview`,
      SEND_PREVIEW: '/api/v1/donor/notification/valid-letters/send-preview',
      FILTERS: '/api/v1/donor/notification/valid-letters-filters',
      TEMPLATE_VARIABLES: '/api/v1/donor/notification/template-variables'
    },

    // Associate Strong Reactivity (HLAXX) endpoints
    ASSOCIATE_STRONG_REACTIVITY: {
      LIST: (take: number, skip: number) => `/api/v1/strong-reactivity/${take}/${skip}`,
      GET_BY_ID: (id: string) => `/api/v1/strong-reactivity/${id}`,
      CREATE: '/api/v1/strong-reactivity',
      UPDATE: (id: string) => `/api/v1/strong-reactivity/${id}`,
      DELETE: (id: string) => `/api/v1/strong-reactivity/${id}`,
      BATCH_UPDATE: '/api/v1/strong-reactivity/batch',
    },

    ASSOCIATE_LETTER_TO_INTERDICTION: {
      SEARCH: '/api/v1/notification-letter-associations/search',
      GET_BY_KEY: (interCode: string, donationType: string, letterId: string) =>
        `/api/v1/notification-letter-associations/${encodeURIComponent(interCode)}/${encodeURIComponent(donationType)}/${encodeURIComponent(letterId)}`,
      CREATE: '/api/v1/notification-letter-associations',
      UPDATE: (interCode: string, donationType: string, letterId: string) =>
        `/api/v1/notification-letter-associations/${encodeURIComponent(interCode)}/${encodeURIComponent(donationType)}/${encodeURIComponent(letterId)}`,
      DELETE: (interCode: string, donationType: string, letterId: string) =>
        `/api/v1/notification-letter-associations/${encodeURIComponent(interCode)}/${encodeURIComponent(donationType)}/${encodeURIComponent(letterId)}`,
      INTERDICTIONS_DROPDOWN: '/api/v1/notification-letter-associations/interdictions-dropdown',
      DONATION_TYPES_DROPDOWN: '/api/v1/notification-letter-associations/donation-types-dropdown',
      LETTERS_DROPDOWN: '/api/v1/notification-letter-associations/letters-dropdown',
      FILTER_INTERDICTIONS_DROPDOWN: '/api/v1/notification-letter-associations/filter-interdictions-dropdown',
      FILTER_DONATION_TYPES_DROPDOWN: '/api/v1/notification-letter-associations/filter-donation-types-dropdown',
      FILTER_LETTERS_DROPDOWN: '/api/v1/notification-letter-associations/filter-letters-dropdown',
    },

    // Update Deferral (DEFMAINT / DRUREDEF) endpoints
    UPDATE_DEFERRAL: {
      GET_BY_ID: (deferralId: string) => `/api/v1/update-deferral/get-deferral?deferralId=${encodeURIComponent(deferralId)}`,
      UPDATE: (deferralId: string) => `/api/v1/update-deferral/${encodeURIComponent(deferralId)}`,
      VALIDATE: (deferralId: string) => `/api/v1/update-deferral/${encodeURIComponent(deferralId)}/validate`,
      GET_INTERDICTIONS: (transactionId: string) => `/api/v1/update-deferral/interdictions?transactionId=${encodeURIComponent(transactionId)}`,
      ADD_INTERDICTION: '/api/v1/update-deferral/interdictions',
      REMOVE_INTERDICTION: (transactionId: string, interCode: string) => `/api/v1/update-deferral/interdictions/${encodeURIComponent(transactionId)}/${encodeURIComponent(interCode)}`,
      GET_DRIVES: (driveDate?: string) => `/api/v1/update-deferral/drives${driveDate ? '?driveDate=' + encodeURIComponent(driveDate) : ''}`,
      GET_EMPLOYEES: (driveDate?: string) => `/api/v1/update-deferral/employees${driveDate ? '?driveDate=' + encodeURIComponent(driveDate) : ''}`,
      GET_DONATION_TYPES: '/api/v1/update-deferral/donation-types',
      GET_PROCEDURE_CODES: (donationType?: string) => `/api/v1/update-deferral/procedure-codes${donationType ? '?donationType=' + encodeURIComponent(donationType) : ''}`,
      GET_EQUIPMENT_TYPES: '/api/v1/update-deferral/equipment-types',
      GET_DEFERRAL_REASONS: (donationType?: string) => `/api/v1/update-deferral/deferral-reasons${donationType ? '?donationType=' + encodeURIComponent(donationType) : ''}`,
      GET_ETHNIC_GROUPS: '/api/v1/update-deferral/ethnic-groups',
      GET_EMPLOYERS: (searchKeyword?: string) => `/api/v1/update-deferral/employers${searchKeyword ? '?searchKeyword=' + encodeURIComponent(searchKeyword) : ''}`,
      VALIDATE_STAFF: (staffId: string, driveDate?: string) => `/api/v1/update-deferral/validate-staff?staffId=${encodeURIComponent(staffId)}${driveDate ? '&driveDate=' + encodeURIComponent(driveDate) : ''}`,
      VALIDATE_DONATION_TYPE: (donationType: string) => `/api/v1/update-deferral/validate-donation-type?donationType=${encodeURIComponent(donationType)}`,
      VALIDATE_PROCEDURE_CODE: (donationType: string, procedureCode: string) => `/api/v1/update-deferral/validate-procedure-code?donationType=${encodeURIComponent(donationType)}&procedureCode=${encodeURIComponent(procedureCode)}`,
      VALIDATE_EQUIPMENT_TYPE: (equipType: string) => `/api/v1/update-deferral/validate-equipment-type?equipType=${encodeURIComponent(equipType)}`,
      VALIDATE_DEFERRAL_REASON: (reasonCode: string, donationType?: string) => `/api/v1/update-deferral/validate-deferral-reason?reasonCode=${encodeURIComponent(reasonCode)}${donationType ? '&donationType=' + encodeURIComponent(donationType) : ''}`,
      VALIDATE_CITY: (city: string) => `/api/v1/update-deferral/validate-city?city=${encodeURIComponent(city)}`,
      VALIDATE_ZIP_CITY: (city: string, zip: string) => `/api/v1/update-deferral/validate-zip-city?city=${encodeURIComponent(city)}&zip=${encodeURIComponent(zip)}`,
      VALIDATE_ALTERNATE_ID_TYPE: (alternateIdType: string) => `/api/v1/update-deferral/validate-alternate-id-type?alternateIdType=${encodeURIComponent(alternateIdType)}`,
      VALIDATE_ETHNIC_GROUP: (ethnicGroup: string) => `/api/v1/update-deferral/validate-ethnic-group?ethnicGroup=${encodeURIComponent(ethnicGroup)}`,
      VALIDATE_SCAN_ID: (scanId: string, donorId?: string) => `/api/v1/update-deferral/validate-scan-id?scanId=${encodeURIComponent(scanId)}${donorId ? '&donorId=' + encodeURIComponent(donorId) : ''}`,
      GET_CITIES: (searchTerm: string) => `/api/v1/update-deferral/cities?search=${encodeURIComponent(searchTerm)}`,
      ZIP_LOOKUP: (zip: string) => `/api/v1/update-deferral/zip-lookup?zip=${encodeURIComponent(zip)}`,
      GET_MANUAL_HOLDS: '/api/v1/update-deferral/manual-holds',
      GET_ETHNIC_REQUIRED: '/api/v1/update-deferral/ethnic-required',
      GET_COUNTRIES: '/api/v1/update-deferral/countries',
      GET_ALTERNATE_ID_TYPES_LOOKUP: '/api/v1/update-deferral/alternate-id-types',
      EMPLOYER_ZIP_LOOKUP: (zip: string) => `/api/v1/update-deferral/employer-zip-lookup?zip=${encodeURIComponent(zip)}`,
      EMPLOYER_CITIES: (searchTerm: string) => `/api/v1/update-deferral/employer-cities?search=${encodeURIComponent(searchTerm)}`,
      CREATE_EMPLOYER: '/api/v1/register-deferral/employer',
    },

    // Donor Eligibility & Attributes (DNWELIGB) endpoints
    DONOR_ELIGIBILITY: {
      DONOR_INFO: (donorId: string) => `/api/v1/donor-eligibility/${encodeURIComponent(donorId)}`,
      DONATION_TYPES: '/api/v1/donor-eligibility/donation-types',
      PROCEDURE_CODES: (donationType: string) => `/api/v1/donor-eligibility/procedure-codes/${encodeURIComponent(donationType)}`,
      CHECK: '/api/v1/donor-eligibility/check',
      INTERDICTIONS: (donorId: string) => `/api/v1/donor-eligibility/${encodeURIComponent(donorId)}/interdictions`,
    },

    // Interdiction Query (DONIQ) endpoints
    INTERDICTION_QUERY: {
      GET: '/api/v1/donor-interdiction-query',
      ADD_AND: '/api/v1/donor-interdiction-query/add-and',
      ADD_OR: '/api/v1/donor-interdiction-query/add-or',
      USER_INACTIVE_CLASSES: '/api/v1/donor-interdiction-query/user-inactive-classes',
      INTERDICTION_CODES: '/api/v1/donor-interdiction-query/interdiction-codes'
    },

    // Donor Communication Query (DCQDCOMM / DCOMQ) endpoints
    DONOR_COMMUNICATION_QUERY: {
      QUERY: (take: number, skip: number) => `/api/v1/donor-communication-query/${take}/${skip}`,
      GET_BY_ID: (donorId: string, comType: string, comCode: string, insertUser: string, insertDate: string) =>
        `/api/v1/donor-communication-query/${encodeURIComponent(donorId)}/${encodeURIComponent(comType)}/${encodeURIComponent(comCode)}/${encodeURIComponent(insertUser)}/${encodeURIComponent(insertDate)}`,
      UPDATE: (donorId: string, comType: string, comCode: string, insertUser: string, insertDate: string) =>
        `/api/v1/donor-communication-query/${encodeURIComponent(donorId)}/${encodeURIComponent(comType)}/${encodeURIComponent(comCode)}/${encodeURIComponent(insertUser)}/${encodeURIComponent(insertDate)}`,
      ACTION_CODES: '/api/v1/donor-communication-query/action-codes',
      USERS: '/api/v1/donor-communication-query/users',
      COMMUNICATION_DROPDOWNS: '/api/v1/donor-communication-query/communication-dropdowns'
    },
    // Donor Profile Audit Query (DPAQ) endpoints
    DONOR_PROFILE_AUDIT_QUERY: {
      QUERY: (take: number, skip: number, expandAll?: boolean) =>
        `/api/v1/donor-profile-audit-query/query/${take}/${skip}${expandAll ? '?expandAll=true' : ''}`,
      DETAIL: (recordId: number) =>
        `/api/v1/donor-profile-audit-query/detail/${recordId}`,
    },

    // Maintain Group Interdictions — Place (GroupInterdictionController)
    MAINTAIN_GROUP_INTERDICTIONS: {
      GET_GROUP_MODES: '/api/v1/group-interdictions/lookups/group-modes',
      GET_DRIVE_IDS: '/api/v1/group-interdictions/lookups/drive-ids',
      GET_COLLECTION_DATES: '/api/v1/group-interdictions/lookups/collection-dates',
      GET_BATCH_IDS: '/api/v1/group-interdictions/lookups/batch-ids',
      GET_INTER_TYPES: '/api/v1/group-interdictions/lookups/inter-types',
      GET_DONATIONS: '/api/v1/group-interdictions/donations',
      GET_VALID_INTERDICTIONS: '/api/v1/group-interdictions/valid-interdictions',
      PLACE_INTERDICTIONS: '/api/v1/group-interdictions/place',
      // Remove (RemoveGroupInterdictionController)
      GET_TERM_REASONS: '/api/v1/remove-group-interdictions/lookups/term-reasons',
      GET_INTER_CODES: '/api/v1/remove-group-interdictions/inter-codes',
      REMOVE_INTERDICTIONS: '/api/v1/remove-group-interdictions/remove',
    },

    // Maintain Donor Group Interdictions (DonorGroupInterdictionController)
    MAINTAIN_DONOR_GROUP_INTERDICTIONS: {
      GET_GROUP_MODES: '/api/v1/donor-group-interdictions/lookups/group-modes',
      GET_GROUP_VALUES: (mode: string) => `/api/v1/donor-group-interdictions/lookups/group-values/${encodeURIComponent(mode)}`,
      GET_TERM_REASONS: '/api/v1/donor-group-interdictions/lookups/term-reasons',
      GET_INTER_TYPES: '/api/v1/donor-group-interdictions/lookups/inter-types',
      GET_VALID_INTERDICTIONS: '/api/v1/donor-group-interdictions/valid-interdictions',
      GET_DONORS: '/api/v1/donor-group-interdictions/donors',
      GET_INTER_CODES: '/api/v1/donor-group-interdictions/inter-codes',
      GET_COMMENTS: '/api/v1/donor-group-interdictions/comments',
      ADD_COMMENT: '/api/v1/donor-group-interdictions/comments/add',
      PLACE_INTERDICTIONS: '/api/v1/donor-group-interdictions/place',
      REMOVE_INTERDICTIONS: '/api/v1/donor-group-interdictions/remove',
    },

    // Donor Attributes / Properties (DPWPROPR) endpoints
    DONOR_ATTRIBUTES: {
      GET_DONOR_DEMOGRAPHICS: (donorId: string) =>
        `/api/v1/donor-demographics/${encodeURIComponent(donorId)}`,
      GET_ALL_ATTRIBUTES: (donorId: string) =>
        `/api/v1/donor-attributes/${encodeURIComponent(donorId)}`,
      GET_ACTIVE_ATTRIBUTES: (donorId: string) =>
        `/api/v1/donor-attributes/${encodeURIComponent(donorId)}/active`,
      GET_VALID_PROPERTIES: '/api/v1/donor-attributes/attributes/dropdown',
      ADD_ATTRIBUTE: '/api/v1/donor-attributes',
      UPDATE_ATTRIBUTE: (donorId: string, interCode: string) =>
        `/api/v1/donor-attributes/${encodeURIComponent(donorId)}/${encodeURIComponent(interCode)}`,
      TERMINATE_ATTRIBUTE: (donorId: string, interCode: string) =>
        `/api/v1/donor-attributes/${encodeURIComponent(donorId)}/${encodeURIComponent(interCode)}/terminate`,
      BULK_UPSERT: (donorId: string) =>
        `/api/v1/donor-attributes/${encodeURIComponent(donorId)}/bulk/upsert`,
    },

    // Query by Interdictions & Holds (DPQUTINT) endpoints
    QUERY_INTERDICTIONS_HOLDS: {
      SEARCH: '/api/v1/donor-interdictions/search',
      SEARCH_DONORS: '/api/v1/donor-interdictions/search-donors',
      INTER_CODES_LOOKUP: '/api/v1/donor-interdictions/lookups/inter-codes',
      INTER_TYPES_LOOKUP: '/api/v1/donor-interdictions/lookups/inter-types',
      DONATION_TYPES_LOOKUP: '/api/v1/donor-interdictions/lookups/donation-types',
      OTHER_HOLDS: '/api/v1/donor-interdictions/other-holds',
      DONOR_ADDRESS: (donorId: string) => `/api/v1/donor-interdictions/donor-address/${encodeURIComponent(donorId)}`,
      DONOR_INFO: (donorId: string) => `/api/v1/donors/${encodeURIComponent(donorId)}`
    },
    // Valid HLA Locus (VDIHLALC / HLANTI) endpoints
    VALID_HLA_LOCUS: {
      GET_LIST: (take: number, skip: number) =>
        `/api/v1/valid-hla-locus/${take}/${skip}`,
      GET_BY_ID: (locus: string, epitopeId: string) =>
        `/api/v1/valid-hla-locus/${encodeURIComponent(locus)}/${encodeURIComponent(epitopeId)}`,
      CREATE: '/api/v1/valid-hla-locus',
      UPDATE: (locus: string, epitopeId: string) =>
        `/api/v1/valid-hla-locus/${encodeURIComponent(locus)}/${encodeURIComponent(epitopeId)}`,
      GET_LOCUS_CODES: '/api/v1/valid-hla-locus/locus-codes',
      GET_EPITOPE_IDS: '/api/v1/valid-hla-locus/epitope-ids',
      GET_EPITOPE_SUPER_IDS: '/api/v1/valid-hla-locus/epitope-super-ids'
    },

    // Donor Notification (DNINOTFY) — both Prepare (DONNOTE) and Authorize (AUTHLET)
    // share the same search/details/mark-no-letter endpoints since both search DONOR_INTERDICTIONS
    AUTHORIZE_DONOR_NOTIFICATION: {
      SEARCH: (take: number, skip: number) =>
        `/api/v1/authorize-donor-notification/search/${take}/${skip}`,
      GET_DONOR_DETAILS: (donorId: string) =>
        `/api/v1/authorize-donor-notification/donor-details/${encodeURIComponent(donorId)}`,
      GET_COMMUNICATIONS: (donorId: string) =>
        `/api/v1/authorize-donor-notification/communications/${encodeURIComponent(donorId)}`,
      MARK_NO_LETTER: '/api/v1/authorize-donor-notification/mark-no-letter',
      APPROVE_NO_LETTER: '/api/v1/authorize-donor-notification/approve-no-letter',
      REJECT_NO_LETTER: (donorId: string, interCode: string) =>
        `/api/v1/authorize-donor-notification/reject-no-letter/${encodeURIComponent(donorId)}/${encodeURIComponent(interCode)}`,
      GET_CODE_DESCRIPTION: (searchType: string, code: string) =>
        `/api/v1/authorize-donor-notification/code-description/${encodeURIComponent(searchType)}/${encodeURIComponent(code)}`,
      GET_LOV_LIMIT: '/api/v1/authorize-donor-notification/lov-limit',
      GET_LOV_CODES: (searchType: string) =>
        `/api/v1/authorize-donor-notification/lov-codes/${encodeURIComponent(searchType)}`,
      CHECK_UNIT_EXISTS: (unitId: string) =>
        `/api/v1/authorize-donor-notification/check-unit-exists/${encodeURIComponent(unitId)}`
    },
    // Enter HLA Results (HRITSTIN) endpoints
    HLA_RESULTS: {
      RETRIEVE_BY_UNIT: '/api/v1/hla-results/retrieve-by-unit',
      SAVE: '/api/v1/hla-results',
      UPDATE: (donorId: string) =>
        `/api/v1/hla-results/${encodeURIComponent(donorId)}`,
      GET_BY_DONOR: (donorId: string) =>
        `/api/v1/hla-results/${encodeURIComponent(donorId)}`,
      GET_VALID_ANTIGENS: (locus: string) =>
        `/api/v1/hla-results/antigens/locus/${encodeURIComponent(locus)}`
    },

    // Donor RBC Antigen Query (MLT-10944) endpoints
    DONOR_RBC_AG_QUERY: {
      GET_BY_DONOR_ID: (donorId: string) =>
        `/api/v1/donor-rbc-ag-query/${encodeURIComponent(donorId)}`,
      GET_BY_ANTIGEN: (donorId: string, antigenCode: string) =>
        `/api/v1/donor-rbc-ag-query/${encodeURIComponent(donorId)}/antigen/${encodeURIComponent(antigenCode)}`,
      GET_CMV_HBS: (unitId: string) =>
        `/api/v1/donor-rbc-ag-query/cmv-hbs/${encodeURIComponent(unitId)}`,
      UPDATE_GENOTYPE: '/api/v1/donor-rbc-ag-query/genotype',
      UPDATE_EXCLUDE_FLAG: '/api/v1/donor-rbc-ag-query/exclude-flag',
      CHECK_ACCESS: '/api/v1/donor-rbc-ag-query/check-access',
    },

    // Maintain Special Instructions (VDISPINS / PHY) endpoints
    MAINTAIN_SPECIAL_INSTRUCTIONS: {
      DROPDOWN_VALUES: '/api/v1/donors/maintain-special-instruction/dropdown-values',
      GET_BY_LABEL_CODE: (labelCode: string) =>
        `/api/v1/donors/maintain-special-instruction/${encodeURIComponent(labelCode)}`,
      SAVE: '/api/v1/donors/maintain-special-instruction',
      SAVE_ALL: '/api/v1/donors/maintain-special-instruction/save-all',
      DELETE: (labelCode: string, lineNumber: number, lineText: string) =>
        `/api/v1/donors/maintain-special-instruction/${encodeURIComponent(labelCode)}/${lineNumber}/${encodeURIComponent(lineText)}`,
    },
    // Change Drive ID or Collection Date (MODDRV) endpoints
    CHANGE_DRIVE: {
      BATCHES: (take: number, skip: number) =>
        `/api/v1/donor/change-drive/batches/${take}/${skip}`,
      BATCH_BY_SET_ID: (setId: string) =>
        `/api/v1/donor/change-drive/batch/${encodeURIComponent(setId)}`,
      BY_UNIT_ID: (unitId: string) =>
        `/api/v1/donor/change-drive/unit/${encodeURIComponent(unitId)}`,
      BY_DEFERRAL_ID: (deferralId: string) =>
        `/api/v1/donor/change-drive/deferral/${encodeURIComponent(deferralId)}`,
      BY_DRIVE_ID: (driveId: string) =>
        `/api/v1/donor/change-drive/drive/${encodeURIComponent(driveId)}`,
      DRIVES_BY_DATE: (driveDate: string) =>
        `/api/v1/donor/change-drive/drives/${encodeURIComponent(driveDate)}`,
      UPDTE_DRIV_PARAM: '/api/v1/donor/change-drive/updte-driv-param',
      VALIDATE: '/api/v1/donor/change-drive/validate',
      UPDATE: '/api/v1/donor/change-drive',
      DONATION_TYPES: '/api/v1/donor/change-drive/donation-types',
      PROCEDURE_CODES: '/api/v1/donor/change-drive/procedure-codes'
    },

    // Donor Within Test (DPWDNTST) - Donation History Test Results endpoints
    DONOR_WITHIN_TEST: {
      ACCESS_LEVEL: '/api/v1/donor-within-test/access-level',
      DONOR_HEADER: (donorId: string) =>
        `/api/v1/donor-within-test/donors/${encodeURIComponent(donorId)}/header`,
      DONATIONS: (donorId: string) =>
        `/api/v1/donor-within-test/donors/${encodeURIComponent(donorId)}/donations`,
      TEST_RESULTS: (unitId: string, collDate: string) =>
        `/api/v1/donor-within-test/donations/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/test-results`,
      CONFIRMATORY_TESTS: (unitId: string, collDate: string) =>
        `/api/v1/donor-within-test/donations/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/confirmatory-tests`
    },

    INVESTIGATE_DUPLICATE_DONOR: {
      BASE: '/api/v1/duplicate-investigations',
      GET_SETS: '/api/v1/duplicate-investigations/sets',
      GET_POTENTIAL_DUPLICATES: (setId: string) =>
        `/api/v1/duplicate-investigations/sets/${encodeURIComponent(setId)}/potential-duplicates`,
      UPDATE_REVIEW: (setId: string, donorId: string) =>
        `/api/v1/duplicate-investigations/sets/${encodeURIComponent(setId)}/donors/${encodeURIComponent(donorId)}/review`,
      UPDATE_MERGE_FLAG: (setId: string, donorId: string) =>
        `/api/v1/duplicate-investigations/sets/${encodeURIComponent(setId)}/donors/${encodeURIComponent(donorId)}/merge-flag`,
      UPDATE_STATUS: (setId: string) =>
        `/api/v1/duplicate-investigations/sets/${encodeURIComponent(setId)}/status`,
      RESOLVE: (setId: string) =>
        `/api/v1/duplicate-investigations/sets/${encodeURIComponent(setId)}/resolve`,
      STATUS_CODES: '/api/v1/duplicate-investigations/status-codes',
      CREATE_SET: '/api/v1/duplicate-investigations/sets/create',
      ADD_DONOR_TO_SET: (setId: string) =>
        `/api/v1/duplicate-investigations/sets/${encodeURIComponent(setId)}/donors`,
    }
  },

  DONOR_COMMUNICATION: {
    DONOR_LABELS: {
      DROPDOWN: '/api/v1/donor-labels/dropdown',
      SEARCH: (take: number, skip: number) => `/api/v1/donor-labels/search/${take}/${skip}`,
      GET_DETAILS: (donorId: string, collectionDate: string) =>
        `/api/v1/donor-labels/${encodeURIComponent(donorId)}/${encodeURIComponent(collectionDate)}`,
      UPDATE_PRINT_FLAGS: '/api/v1/donor-labels/print-flags',
      GENERATE: '/api/v1/donor-labels/generate',
      PRINT: '/api/v1/donor-labels/print',
      VALIDATE_PRINTER: (printerName: string) => `/api/v1/donor-labels/validate-printer/${encodeURIComponent(printerName)}`
    }
  },
  FIND_DONOR: {
    SEARCH: '/api/v1/find-donors/search',
    ALTERNATE_ID_TYPES: '/api/v1/find-donors/alternate-id-types',
    CREATE_DONOR: '/api/v1/find-donors/create-donor',
    LOOKUP_DONOR_ID: (donorId: string) => `/api/v1/find-donors/lookup-donor-id/${encodeURIComponent(donorId)}`,
    CONFIG: '/api/v1/find-donors/config',
  },
  ISBT_CHECK_DIGIT: {
    CALCULATE: '/api/v1/isbt-check-digit/calculate',
    CALCULATE_BATCH: '/api/v1/isbt-check-digit/calculate-batch'
  },
  ISBT_ATTRIBUTE_LOOKUP: {
    SEARCH: '/api/v1/isbt-attribute-lookup/search',
    GET_GROUP: '/api/v1/isbt-attribute-lookup/groups',
    GET_GROUPS_LOV: '/api/v1/isbt-attribute-lookup/groups',
    GET_NEW_CODES_LOV: '/api/v1/isbt-attribute-lookup/attributes-new',
    GET_OLD_CODES_LOV: '/api/v1/isbt-attribute-lookup/attributes-old',
    GET_PRODUCT: '/api/v1/isbt-attribute-lookup/products',
    GET_PRODUCTS_LOV: '/api/v1/isbt-attribute-lookup/products',
    GET_GROUP_MAPPING: '/api/v1/isbt-attribute-lookup/group-mapping',
    CODE_MAPPING_NEW_TO_OLD: '/api/v1/isbt-attribute-lookup/code-mapping/new-to-old',
    CODE_MAPPING_OLD_TO_NEW: '/api/v1/isbt-attribute-lookup/code-mapping/old-to-new',
  },
  SEARCH_FOR_DONOR: {
    SEARCH:`/api/v1/search-donors/search`,
    VALIDATE_DEFERRAL_ID: '/api/v1/search-donors/validate-deferral-id'
  },

  DONOR_LIST_VIEWER: {
    LOOKUP: (lovLimit?: number) =>
      `/api/v1/donor-lists/lookup${lovLimit ? `?lovLimit=${lovLimit}` : ''}`,
    METADATA: (listId: string) =>
      `/api/v1/donor-lists/${encodeURIComponent(listId)}/metadata`,
    DONORS: (listId: string, take: number, skip: number) =>
      `/api/v1/donor-lists/${encodeURIComponent(listId)}/donors/${take}/${skip}`
  },

  REGISTER_DONATION: {
    GET_ALL: (take: number, skip: number) =>
      `/api/v1/register-donations/${take}/${skip}`,
    GET_BY_ID: (transactionId: string) =>
      `/api/v1/register-donations/${encodeURIComponent(transactionId)}`,
    GET_BY_DONOR: (donorId: string) =>
      `/api/v1/register-donations/by-donor/${encodeURIComponent(donorId)}`,
    CREATE: '/api/v1/register-donations',
    HOLD: '/api/v1/register-donations/hold',
    BATCH_CREATE: '/api/v1/register-donations/batch',
    UPDATE: (transactionId: string) =>
      `/api/v1/register-donations/${encodeURIComponent(transactionId)}`,
    DELETE: (transactionId: string) =>
      `/api/v1/register-donations/${encodeURIComponent(transactionId)}`,
    GET_BY_UNIT: (unitId: string) =>
      `/api/v1/update-donations/by-unit/${encodeURIComponent(unitId)}`,
    CHECK_DUPLICATE_UNIT: (unitId: string) =>
      `/api/v1/register-donations/check-duplicate-unit?unitId=${encodeURIComponent(unitId)}`,
    UPDATE_DONATION: (transactionId: string) =>
      `/api/v1/update-donations/${encodeURIComponent(transactionId)}`,
  },
  REGISTER_DONATION_LOOKUPS: {
    PROCEDURE_CODES: '/api/v1/register-donation-lookups/procedure-codes',
    VENIPUNCTURE_CODES: '/api/v1/register-donation-lookups/venipuncture-codes',
    EMPLOYEES: '/api/v1/register-donation-lookups/employees',
    INTERDICTION_CODES: '/api/v1/register-donation-lookups/interdiction-codes',
    DRIVES: '/api/v1/register-donation-lookups/drives',
    DONATION_TYPES: '/api/v1/register-donation-lookups/donation-types',
    SPONSORS: '/api/v1/register-donation-lookups/sponsors',
    CITY_STATE: '/api/v1/register-donation-lookups/city-state',
    EMPLOYERS: (searchTerm: string) =>
      `/api/v1/register-donation-lookups/employers?search=${encodeURIComponent(searchTerm)}`,
    PROCEDURE_CODES_BY_TYPE: (donationType: string) =>
      `/api/v1/register-donation-lookups/procedure-codes-by-type?donationType=${encodeURIComponent(donationType)}`,
    DEFERRAL_REASONS: (donationType: string, driveDate: string) =>
      `/api/v1/register-donation-lookups/deferral-reasons?donationType=${encodeURIComponent(donationType)}&driveDate=${encodeURIComponent(driveDate)}`,
    EQUIPMENT_TYPES: '/api/v1/register-donation-lookups/equipment-types',
    ETHNIC_GROUPS: '/api/v1/register-donation-lookups/ethnic-groups',
    ALTERNATE_ID_TYPES: '/api/v1/register-donation-lookups/alternate-id-types',
    REACTION_CODES: '/api/v1/register-donation-lookups/reaction-codes',
    ETHNIC_REQUIRED: '/api/v1/register-donation-lookups/ethnic-required',
  },

  DONATION_INTERDICTION: {
    GET_BY_TRANSACTION: (transactionId: string) =>
      `/api/v1/donation-interdictions/by-transaction/${encodeURIComponent(transactionId)}`,
    CREATE: '/api/v1/donation-interdictions',
  },

  HEALTH_HISTORY_QUESTIONS: {
    SEARCH: '/api/v1/health-history-questions/search',
    GET_BY_CODE: (questionCode: string) =>
      `/api/v1/health-history-questions/${encodeURIComponent(questionCode)}`,
    UPDATE: (questionCode: string) =>
      `/api/v1/health-history-questions/${encodeURIComponent(questionCode)}`,
    CREATE: '/api/v1/health-history-questions',
    GENDER_DROPDOWN: '/api/v1/health-history-questions/gender-dropdown',
    INTERDICTION_CODES: '/api/v1/health-history-questions/interdiction-codes',
  },

  HEALTH_HISTORY_ANSWERS: {
    SEARCH: (take: number, skip: number) =>
      `/api/v1/health-history-answers/search/${take}/${skip}`,
    GET_BY_CODE: (questionCode: string, answerCode: string) =>
      `/api/v1/health-history-answers/${encodeURIComponent(questionCode)}/${encodeURIComponent(answerCode)}`,
    UPDATE: (questionCode: string, answerCode: string) =>
      `/api/v1/health-history-answers/${encodeURIComponent(questionCode)}/${encodeURIComponent(answerCode)}`,
    CREATE: '/api/v1/health-history-answers',
    PERIOD_TYPES: '/api/v1/health-history-answers/period-types',
    COMMENTS: (questionCode: string, answerCode: string, responseCode: string) =>
      `/api/v1/health-history-answers/${encodeURIComponent(questionCode)}/${encodeURIComponent(answerCode)}/comments/${encodeURIComponent(responseCode)}`,
    COMMENT_BY_CODE: (questionCode: string, answerCode: string, responseCode: string, commentCode: string) =>
      `/api/v1/health-history-answers/${encodeURIComponent(questionCode)}/${encodeURIComponent(answerCode)}/comments/${encodeURIComponent(responseCode)}/${encodeURIComponent(commentCode)}`,
    GROUP_CODES: '/api/v1/donor/hh-response-groups/group-codes-dropdown',
  },

  REGISTER_DEFERRAL: {
    GET_DRIVES: (driveDate: string) =>
      `/api/v1/register-deferral/drives?driveDate=${encodeURIComponent(driveDate)}`,
    VALIDATE_DEFERRAL_ID: '/api/v1/register-deferral/validate-deferral-id',
    CHECK_DEFERRAL_EXISTS: (deferralId: string) =>
      `/api/v1/register-deferral/check-exists/${encodeURIComponent(deferralId)}`,
    GET_DONOR: (donorId: string) =>
      `/api/v1/register-deferral/donor/${encodeURIComponent(donorId)}`,
    GET_DONOR_ADDRESS: (donorId: string) =>
      `/api/v1/register-deferral/donor-address/${encodeURIComponent(donorId)}`,
    REGISTER: '/api/v1/register-deferral/register',
    UPDATE: '/api/v1/register-deferral/update',
    GET_DEFERRAL: (deferralId: string) =>
      `/api/v1/register-deferral/${encodeURIComponent(deferralId)}`,
    SEARCH_DEFERRAL: '/api/v1/register-deferral/search',
    GET_EMPLOYEES: (driveDate: string) => `/api/v1/register-deferral/employees?driveDate=${encodeURIComponent(driveDate)}`,
    GET_DONATION_TYPES: '/api/v1/register-deferral/donation-types',
    GET_PROCEDURE_CODES: (donationType: string) =>
      `/api/v1/register-deferral/procedure-codes?donationType=${encodeURIComponent(donationType)}`,
    GET_DEFERRAL_REASONS: (driveDate: string, donationType: string) => `/api/v1/register-deferral/deferral-reasons?donationType=${encodeURIComponent(donationType)}&driveDate=${encodeURIComponent(driveDate)}`,
    GET_EQUIPMENT_TYPES: '/api/v1/register-deferral/equipment-types',
    GET_ETHNIC_GROUPS: '/api/v1/register-deferral/ethnic-groups',
    GET_ETHNIC_REQUIRED: '/api/v1/register-deferral/ethnic-required',
    GET_INTERDICTIONS: '/api/v1/register-deferral/interdictions',
    GET_EMPLOYERS: (searchTerm?: string) =>
      `/api/v1/register-deferral/employers${searchTerm ? '?search=' + encodeURIComponent(searchTerm) : ''}`,
    GET_CITIES: (searchTerm: string) =>
      `/api/v1/register-deferral/cities?search=${encodeURIComponent(searchTerm)}`,
    GET_DEFERRAL_TYPES: '/api/v1/register-deferral/deferral-types',
    GET_ALTERNATE_ID_TYPES: '/api/v1/register-deferral/alternate-id-types',
    ZIP_LOOKUP: (zip: string) =>
      `/api/v1/register-deferral/zip-lookup?zip=${encodeURIComponent(zip)}`,
    VALIDATE_STAFF: (staffId: string, driveDate: string) =>
      `/api/v1/register-deferral/validate-staff?staffId=${encodeURIComponent(staffId)}&driveDate=${encodeURIComponent(driveDate)}`,
    VALIDATE_DONATION_TYPE: (donationType: string) =>
      `/api/v1/register-deferral/validate-donation-type?donationType=${encodeURIComponent(donationType)}`,
    VALIDATE_PROCEDURE_CODE: (donationType: string, procedureCode: string) =>
      `/api/v1/register-deferral/validate-procedure-code?donationType=${encodeURIComponent(donationType)}&procedureCode=${encodeURIComponent(procedureCode)}`,
    VALIDATE_EQUIPMENT_TYPE: (equipType: string) =>
      `/api/v1/register-deferral/validate-equipment-type?equipType=${encodeURIComponent(equipType)}`,
    VALIDATE_DEFERRAL_REASON: (reasonCode: string, donationType: string, driveDate: string) =>
      `/api/v1/register-deferral/validate-deferral-reason?reasonCode=${encodeURIComponent(reasonCode)}&donationType=${encodeURIComponent(donationType)}&driveDate=${encodeURIComponent(driveDate)}`,
    VALIDATE_CITY: (city: string) =>
      `/api/v1/register-deferral/validate-city?city=${encodeURIComponent(city)}`,
    VALIDATE_ZIP_CITY: (city: string, zip: string) =>
      `/api/v1/register-deferral/validate-zip-city?city=${encodeURIComponent(city)}&zip=${encodeURIComponent(zip)}`,
    VALIDATE_ETHNIC_GROUP: (ethnicGroup: string) =>
      `/api/v1/register-deferral/validate-ethnic-group?ethnicGroup=${encodeURIComponent(ethnicGroup)}`,
    VALIDATE_ALTERNATE_ID_TYPE: (alternateIdType: string) =>
      `/api/v1/register-deferral/validate-alternate-id-type?alternateIdType=${encodeURIComponent(alternateIdType)}`,
    VALIDATE_SCAN_ID: (scanId: string, donorId?: string) =>
      `/api/v1/register-deferral/validate-scan-id?scanId=${encodeURIComponent(scanId)}${donorId ? '&donorId=' + encodeURIComponent(donorId) : ''}`,
    VALIDATE_INTERDICTION_CODE: (interCode: string) =>
      `/api/v1/register-deferral/validate-interdiction-code?interCode=${encodeURIComponent(interCode)}`,
    VALIDATE_SPONSOR: (sponsorId: string) =>
      `/api/v1/register-deferral/validate-sponsor?sponsorId=${encodeURIComponent(sponsorId)}`,
    REGISTER_HOLD: '/api/v1/register-deferral/hold',
    CREATE_EMPLOYER: '/api/v1/register-deferral/employer',
    CHECK_ONLINE_DONATION: (donorId: string) =>
      `/api/v1/register-deferral/check-online-donation/${encodeURIComponent(donorId)}`,
    CHECK_AGE_LIMITS: (dateOfBirth: string) =>
      `/api/v1/register-deferral/check-age-limits?dateOfBirth=${encodeURIComponent(dateOfBirth)}`,
  },

  HEALTH_HISTORY_TEMPLATES: {
    SEARCH: (take: number, skip: number) =>
      `/api/v1/health-history-templates/search/${take}/${skip}`,
    GET_BY_TEMPLATE: (templateId: string) =>
      `/api/v1/health-history-templates/${encodeURIComponent(templateId)}`,
    GET_BY_KEY: (donationType: string, questionCode: string, templateId: string) =>
      `/api/v1/health-history-templates/${encodeURIComponent(donationType)}/${encodeURIComponent(questionCode)}/${encodeURIComponent(templateId)}`,
    CREATE: '/api/v1/health-history-templates',
    UPDATE: (donationType: string, questionCode: string, templateId: string) =>
      `/api/v1/health-history-templates/${encodeURIComponent(donationType)}/${encodeURIComponent(questionCode)}/${encodeURIComponent(templateId)}`,
    DELETE: (donationType: string, questionCode: string, templateId: string) =>
      `/api/v1/health-history-templates/${encodeURIComponent(donationType)}/${encodeURIComponent(questionCode)}/${encodeURIComponent(templateId)}`,
    DONATION_TYPES: '/api/v1/health-history-templates/donation-types',
    AVAILABLE_QUESTIONS: '/api/v1/health-history-templates/available-questions',
    GENERATE_ID: '/api/v1/health-history-templates/generate-id',
    TEMPLATES_BY_DONATION_TYPE: (donationType: string) =>
      `/api/v1/health-history-templates/templates/${encodeURIComponent(donationType)}`,
    UPDATE_TERM_DATE: (templateId: string) =>
      `/api/v1/health-history-templates/${encodeURIComponent(templateId)}/term-date`,
  },


  VISUAL_AUDIT: {
    SEARCH: '/api/v1/visual-audit/search',
    SAVE: '/api/v1/visual-audit/save',
    RESET: '/api/v1/visual-audit/reset',
    RESET_OPTIONS: '/api/v1/visual-audit/reset-options'
  },

  BAG_CHECKIN: {
    GET_BATCHES: '/api/v1/bag-checkin/batches',
    GET_BATCH_DETAIL: (batchId: string) => `/api/v1/bag-checkin/batches/${encodeURIComponent(batchId)}`,
    GET_BATCH_UNITS: (batchId: string) => `/api/v1/bag-checkin/batches/${encodeURIComponent(batchId)}/units`,
    VALIDATE_UNIT: (unitId: string) => `/api/v1/bag-checkin/validate-unit/${encodeURIComponent(unitId)}`,
    GET_CATALOG_NUMBERS: '/api/v1/bag-checkin/catalog-numbers',
    VALIDATE_CATALOG: (catalogNumber: string) => `/api/v1/bag-checkin/validate-catalog/${encodeURIComponent(catalogNumber)}`,
    GET_LOT_NUMBERS: '/api/v1/bag-checkin/lot-numbers',
    CHECK_IN: '/api/v1/bag-checkin/check-in',
  },

  TUBE_CHECKIN: {
    GET_FORMATS: '/api/v1/tube-checkin/formats',
    GET_ENTRIES: '/api/v1/tube-checkin/entries',
    VALIDATE_UNIT: '/api/v1/tube-checkin/validate-unit',
    SUBMIT: '/api/v1/tube-checkin/submit',
  },

  CHECK_IN_DETAILS: {
    GET_DRIVES: (collDate: string) =>
      `/api/v1/check-in-details/drives?collDate=${encodeURIComponent(collDate)}`,
    GET_DRIVE_DESCRIPTION: (driveId: string, collDate: string) =>
      `/api/v1/check-in-details/drive-description?driveId=${encodeURIComponent(driveId)}&collDate=${encodeURIComponent(collDate)}`,
    VALIDATE_UNIT: '/api/v1/check-in-details/validate-unit',
    GET_UNIT_DETAILS: (unitId: string, collDate: string) =>
      `/api/v1/check-in-details/unit-details?unitId=${encodeURIComponent(unitId)}&collDate=${encodeURIComponent(collDate)}`,
    GET_ATTRIBUTE_GROUPS: '/api/v1/check-in-details/attribute-groups',
    GET_ATTRIBUTE_CODES: (attribGroup: string, chapterId: string) =>
      `/api/v1/check-in-details/attribute-codes?attribGroup=${encodeURIComponent(attribGroup)}&chapterId=${encodeURIComponent(chapterId)}`,
    GET_MACHINES: (attribGroup: string, attribCode: string) =>
      `/api/v1/check-in-details/machines?attribGroup=${encodeURIComponent(attribGroup)}&attribCode=${encodeURIComponent(attribCode)}`,
    GET_ABO_VALUES: '/api/v1/check-in-details/abo-values',
    CHECK_IN: '/api/v1/check-in-details/check-in',
    GET_CHAPTER_CONFIG: '/api/v1/check-in-details/chapter-config',
    GET_UNITS: (driveId: string, collDate: string) =>
      `/api/v1/check-in-details/units?driveId=${encodeURIComponent(driveId)}&collDate=${encodeURIComponent(collDate)}`,
    GET_BAG_CONFIGS: '/api/v1/check-in-details/bag-configs',
    GET_SEPARATION_TIME: (unitId: string) =>
      `/api/v1/check-in-details/separation-time?unitId=${encodeURIComponent(unitId)}`,
  },

  DELETE_NON_UNIT_TUBES: {
    GET_TUBES: '/api/v1/delete-non-unit-tubes/query',
    DELETE_TUBES: '/api/v1/delete-non-unit-tubes/batch',
  },

  RESET_UNDER_EXTRACT: {
    GET_ELIGIBLE: '/api/v1/reset-under-extract',
    RESET: '/api/v1/reset-under-extract/reset',
  },

  PAPERLESS_NURSING_AUDIT: {
    OPTIONS: 'api/v1/paperless-nursing-audit/options',
    START: 'api/v1/paperless-nursing-audit/start',
    GET_RECORDS: 'api/v1/paperless-nursing-audit',
    EXCLUDE: 'api/v1/paperless-nursing-audit',
    COMMIT: 'api/v1/paperless-nursing-audit',
    DRIVE_IDS: 'api/v1/paperless-nursing-audit/drive-ids',
  },

  VALID_LOTS: {
    LIST: (take: number, skip: number) => `/api/v1/valid-lots/${take}/${skip}`,
    CREATE: '/api/v1/valid-lots',
    UPDATE: (lotNumber: string, catalogNumber: string) =>
      `/api/v1/valid-lots/${encodeURIComponent(lotNumber)}/${encodeURIComponent(catalogNumber)}`,
    CATALOGS: '/api/v1/valid-lots/catalogs',
    CMC_CODES: '/api/v1/valid-lots/cmc-codes',
    VOLUME_TYPE_SETS: '/api/v1/valid-lots/volume-type-sets',
    SUPPLY_CODES: '/api/v1/valid-lots/supply-codes',
  },

  VALID_CATALOG_NUMBERS: {
    LIST: (take: number, skip: number) => `/api/v1/valid-catalog-numbers/${take}/${skip}`,
    GET_BY_ID: (catalogNumber: string) => `/api/v1/valid-catalog-numbers/${encodeURIComponent(catalogNumber)}`,
    CREATE: '/api/v1/valid-catalog-numbers',
    UPDATE: (catalogNumber: string) => `/api/v1/valid-catalog-numbers/${encodeURIComponent(catalogNumber)}`,
    MANUFACTURERS: '/api/v1/valid-catalog-numbers/manufacturer-codes',
    BAG_TYPES: '/api/v1/valid-catalog-numbers/bag-types',
    ANTICOAGULANTS: '/api/v1/valid-catalog-numbers/anticoagulants',
    ADDITIVES: '/api/v1/valid-catalog-numbers/additives',
    FILTER: {
      CATALOG_NUMBERS: '/api/v1/valid-catalog-numbers/filter/catalog-numbers',
      MANUFACTURERS: '/api/v1/valid-catalog-numbers/filter/manufacturers',
    },
    CATALOG_DETAIL: {
      LIST: (take: number, skip: number) => `/api/v1/catalog-details/${take}/${skip}`,
      GET_BY_ID: (catalogNumber: string) => `/api/v1/catalog-details/${encodeURIComponent(catalogNumber)}`,
      CREATE: '/api/v1/catalog-details',
      UPDATE: (catalogNumber: string) => `/api/v1/catalog-details/${encodeURIComponent(catalogNumber)}`,
      PRODUCT_TYPES: '/api/v1/catalog-details/product-types',
      CONTAINER_IDS: '/api/v1/catalog-details/container-ids',
      FILTER: {
        CATALOG_NUMBERS: (baseCatalogNo: string) => `/api/v1/catalog-details/filter/catalog-numbers?baseCatalogNo=${encodeURIComponent(baseCatalogNo)}`,
      },
    },
  },

  DELETE_POOLED_COMPONENTS: {
    GET_POOL_DETAILS: (unitId: string) => `/api/v1/delete-pooled-components/pool/${encodeURIComponent(unitId)}`,
    GET_POOLED_UNITS: (unitId: string) => `/api/v1/delete-pooled-components/pool/${encodeURIComponent(unitId)}/units`,
    GET_POOLED_UNITS_PAGINATED: (unitId: string, take: number, skip: number) =>
      `/api/v1/delete-pooled-components/pool/${encodeURIComponent(unitId)}/units/${take}/${skip}`,
    DELETE_SELECTED_UNITS: (poolId: string) =>
      `/api/v1/delete-pooled-components/pool/${encodeURIComponent(poolId)}/units`,
    DELETE_POOL: (unitId: string) => `/api/v1/delete-pooled-components/pool/${encodeURIComponent(unitId)}`,
  },

  PREPARE_POOLED_COMPONENTS: {
    BASE: '/api/v1/prepare-pooled-components',
    SEARCH: (take: number, skip: number) => `/api/v1/prepare-pooled-components/${take}/${skip}`,
    GET_BY_ID: (poolId: string) => `/api/v1/prepare-pooled-components/${encodeURIComponent(poolId)}`,
    CREATE: '/api/v1/prepare-pooled-components',
    UPDATE: (poolId: string) => `/api/v1/prepare-pooled-components/${encodeURIComponent(poolId)}`,
    DELETE: (poolId: string) => `/api/v1/prepare-pooled-components/${encodeURIComponent(poolId)}`,
    GET_UNITS: (poolId: string) => `/api/v1/prepare-pooled-components/${encodeURIComponent(poolId)}/units`,
    VALID_PRODUCTS: '/api/v1/prepare-pooled-components/valid-products',
    VALID_ABO: '/api/v1/prepare-pooled-components/valid-abo',
    VALID_LOTS: '/api/v1/prepare-pooled-components/valid-lots',
    VALID_CATALOGS: '/api/v1/prepare-pooled-components/valid-catalogs',
    VALID_UNIT_PRODUCTS: '/api/v1/prepare-pooled-components/valid-unit-products',
  },

  MODIFY_POOLED_COMPONENTS: {
    GET_POOL_DETAILS: (unitId: string) => `/api/v1/modify-pooled-components/pool/${encodeURIComponent(unitId)}`,
    GET_PROCESS_CODES: (productCode: string) =>
      `/api/v1/modify-pooled-components/process-codes?productCode=${encodeURIComponent(productCode)}`,
    GET_VALID_CONVERSIONS: (sourceProductCode: string, codeScheme?: string) =>
      `/api/v1/modify-pooled-components/valid-conversions?sourceProductCode=${encodeURIComponent(sourceProductCode)}${codeScheme ? `&codeScheme=${encodeURIComponent(codeScheme)}` : ''}`,
    GET_VALID_PRODUCTS: (unitId: string) =>
      `/api/v1/modify-pooled-components/valid-products?unitId=${encodeURIComponent(unitId)}`,
    GET_VALID_CATALOG_NUMBERS: '/api/v1/modify-pooled-components/valid-catalog-numbers',
    GET_VALID_LOT_NUMBERS: (catalogNumber: string) =>
      `/api/v1/modify-pooled-components/valid-lot-numbers?catalogNumber=${encodeURIComponent(catalogNumber)}`,
    GET_VALID_FILTER_LOTS: (productType: string) =>
      `/api/v1/modify-pooled-components/valid-filter-lots?productType=${encodeURIComponent(productType)}`,
    SAVE: '/api/v1/modify-pooled-components/save',
    PRINT_LABEL: '/api/v1/modify-pooled-components/print-label',
    DERIVE_PRODUCT: (productCode: string, processCode: string, productType: string, codeScheme: string) =>
      `/api/v1/modify-pooled-components/derive-product?productCode=${encodeURIComponent(productCode)}&processCode=${encodeURIComponent(processCode)}&productType=${encodeURIComponent(productType)}&codeScheme=${encodeURIComponent(codeScheme)}`,
  },

  RECHECK_PRODUCTS_LAB: {
    VALIDATE_UNIT: '/api/v1/lab/recheck-products/validate-unit',
    AVAILABLE_COMPONENTS: (unitId: string, collDate: string) =>
      `/api/v1/lab/recheck-products/available-components/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,
    VALIDATE_COMPONENT: '/api/v1/lab/recheck-products/validate-component',
    PROCESS: '/api/v1/lab/recheck-products',
  },

  TRANSFER_DONOR_TO_LAB: {
    // Step 1: populate Batch ID dropdown (no params — session provides chapter/warehouse)
    GET_BATCHES: '/api/v1/lab/transfer-donor-to-lab/batches',
    // Drives dropdown — loaded when user selects a Collection Date
    GET_DRIVES: (collectionDate: string) =>
      `/api/v1/lab/transfer-donor-to-lab/drives?collectionDate=${encodeURIComponent(collectionDate)}`,
    // Step 4: get eligible units for given filter
    GET_UNITS: (p: { collectionDate: string; driveId?: string; batchId?: string; shipperNumber?: string }) => {
      const q = new URLSearchParams({ collectionDate: p.collectionDate });
      if (p.driveId) q.set('driveId', p.driveId);
      if (p.batchId) q.set('batchId', p.batchId);
      if (p.shipperNumber) q.set('shipperNumber', p.shipperNumber);
      return `/api/v1/lab/transfer-donor-to-lab/units?${q.toString()}`;
    },
    // Shippers dropdown — loaded when Drive ID is selected
    GET_SHIPPERS: (driveId: string, checkinType: string) =>
      `/api/v1/lab/transfer-donor-to-lab/shippers?driveId=${encodeURIComponent(driveId)}&checkinType=${encodeURIComponent(checkinType)}`,
    // Pre-RETRIEVE: validate header fields (drive, site, batch, shipper, date age)
    VALIDATE_HEADER: '/api/v1/lab/transfer-donor-to-lab/validate-header',
    // Step 5: validate a unit before transfer
    VALIDATE_UNIT: '/api/v1/lab/transfer-donor-to-lab/validate-unit',
    // Step 5b: run ALL per-unit validations (fields, donation, batch/drive/site, bleed times)
    VALIDATE_TRANSFER: '/api/v1/lab/transfer-donor-to-lab/validate-transfer',
    // Step 6: load donation details for the selected unit
    GET_DONATION_DETAILS: (unitId: string, collectionDate: string) =>
      `/api/v1/lab/transfer-donor-to-lab/donation-details?unitId=${encodeURIComponent(unitId)}&collectionDate=${encodeURIComponent(collectionDate)}`,
    // Step 7: execute the transfer
    TRANSFER: '/api/v1/lab/transfer-donor-to-lab',
  },

  SAMPLE_TRANSFER_IN: {
    CHECK_IN: '/api/v1/sample-transfer-in/check-in',
    GET_BOXES: (mode: string) => `/api/v1/sample-transfer-in/boxes?mode=${encodeURIComponent(mode)}`,
    VALIDATE_BOX: (boxId: string, mode: string) =>
      `/api/v1/sample-transfer-in/validate-box?boxId=${encodeURIComponent(boxId)}&mode=${encodeURIComponent(mode)}`,
    GET_BOX_SAMPLES: (boxId: string, mode: string) =>
      `/api/v1/sample-transfer-in/box-samples?boxId=${encodeURIComponent(boxId)}&mode=${encodeURIComponent(mode)}`,
    GET_CONTRACTS: (searchTerm?: string) =>
      `/api/v1/sample-transfer-in/contracts${searchTerm ? '?searchTerm=' + encodeURIComponent(searchTerm) : ''}`,
    GET_PROFILES: (contractId: string) =>
      `/api/v1/sample-transfer-in/profiles?contractId=${encodeURIComponent(contractId)}`,
    GET_BATCHES: (contractId: string) =>
      `/api/v1/sample-transfer-in/batches?contractId=${encodeURIComponent(contractId)}`,
    GENERATE_BATCH: '/api/v1/sample-transfer-in/batches/generate',
    GET_SAMPLE_TYPES: '/api/v1/sample-transfer-in/sample-types',
    GET_TESTS: '/api/v1/sample-transfer-in/tests',
    OVERRIDE_REASONS: '/api/v1/sample-transfer-in/override/reasons',
    OVERRIDE_HOLDS: '/api/v1/sample-transfer-in/override/holds',
    OVERRIDE_COMMENTS: '/api/v1/sample-transfer-in/override/comments',
    VALIDATE_OVERRIDE_USER: '/api/v1/sample-transfer-in/validate-override-user',
    VALIDATE_CONTRACT: (contractId: string) =>
      `/api/v1/sample-transfer-in/validate-contract?contractId=${encodeURIComponent(contractId)}`,
    BARCODE_SCHEME: (contractId: string) =>
      `/api/v1/sample-transfer-in/barcode-scheme/${encodeURIComponent(contractId)}`,
    CHECK_DUPLICATE_SAMPLE: (boxId: string, unitId: string, sampleType: string) =>
      `/api/v1/sample-transfer-in/check-duplicate-sample?boxId=${encodeURIComponent(boxId)}&unitId=${encodeURIComponent(unitId)}&sampleType=${encodeURIComponent(sampleType)}`,
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/sample-transfer-in/validate-unit?unitId=${encodeURIComponent(unitId)}`,
    SAMPLE_DATA: (unitId: string, boxId: string) =>
      `/api/v1/sample-transfer-in/sample-data/${encodeURIComponent(unitId)}?boxId=${encodeURIComponent(boxId)}`,
    COPY_UNITS: '/api/v1/sample-transfer-in/copy-units',
    ADHOC_TESTS: '/api/v1/sample-transfer-in/adhoc-tests',
    GET_NOTATIONS: (unitId: string, showTerminated: string) =>
      `/api/v1/sample-transfer-in/notations?unitId=${encodeURIComponent(unitId)}&showTerminated=${encodeURIComponent(showTerminated)}`,
    DELETE_NOTATION: (notationCode: string, unitId: string) =>
      `/api/v1/sample-transfer-in/notations/${encodeURIComponent(notationCode)}?unitId=${encodeURIComponent(unitId)}`,
    UPDATE_NOTATION: '/api/v1/sample-transfer-in/notations',
    UPDATE_SAMPLE_DETAIL: '/api/v1/sample-transfer-in/sample-detail',
    NOTATION_ACCESS: '/api/v1/sample-transfer-in/notation-access',
  },

  LAB_WAREHOUSE_CHECKIN: {
    VALIDATE_UNIT: '/api/v1/lab-warehouse-checkin/validate-unit',
    VALIDATE_PRODUCT: '/api/v1/lab-warehouse-checkin/validate-product',
    CHECKIN: '/api/v1/lab-warehouse-checkin/checkin',
    HISTORY: (date?: string) =>
      date
        ? `/api/v1/lab-warehouse-checkin/history?date=${encodeURIComponent(date)}`
        : '/api/v1/lab-warehouse-checkin/history',
  },

  WAREHOUSE_CHECKIN: {
    VALIDATE_ALL: '/api/v1/warehouse-checkin/validate',
    LOCATION_LOOKUP: '/api/v1/warehouse-checkin/location-lookup',
    CHECK_IN: '/api/v1/warehouse-checkin',
    UNIT_PRODUCTS: (unitId: string) => `/api/v1/warehouse-checkin/unit/${encodeURIComponent(unitId)}/products`,
  },

  WAREHOUSE_CHECKOUT: {
    BATCHES: '/api/v1/warehouse-checkout/batches',
    BATCH_BY_ID: (batchId: string) =>
      `/api/v1/warehouse-checkout/batches/${encodeURIComponent(batchId)}`,
    WAREHOUSES: '/api/v1/warehouse-checkout/warehouses',
    CREATE_BATCH: '/api/v1/warehouse-checkout/batches',
    UPDATE_BATCH: (batchId: string) =>
      `/api/v1/warehouse-checkout/batches/${encodeURIComponent(batchId)}`,
    ADD_PRODUCT: (batchId: string) =>
      `/api/v1/warehouse-checkout/batches/${encodeURIComponent(batchId)}/products`,
    REMOVE_PRODUCT: (batchId: string, productCode: string) =>
      `/api/v1/warehouse-checkout/batches/${encodeURIComponent(batchId)}/products/${encodeURIComponent(productCode)}`,
    COMMIT: (batchId: string) =>
      `/api/v1/warehouse-checkout/batches/${encodeURIComponent(batchId)}/commit`,
    UNIT_LOOKUP: (unitId: string) =>
      `/api/v1/warehouse-checkout/units/${encodeURIComponent(unitId)}/lookup`,
  },

  COMPONENT_CHANGES: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/lab/component-changes/validate/${encodeURIComponent(unitId)}`,
    ATTRIBUTES: (functionName: string, productType: string) =>
      `/api/v1/lab/component-changes/attributes/${encodeURIComponent(functionName)}/${encodeURIComponent(productType)}`,
    PRODUCT_TYPES: '/api/v1/lab/component-changes/product-types',
    CHANGE_ATTRIBUTE: '/api/v1/lab/component-changes/change-attribute',
    CHANGE_PRODUCT_CODE: '/api/v1/lab/component-changes/change-product-code',
    REPRINT_LABEL: '/api/v1/lab/component-changes/reprint-label',
    PRODUCT_CODES: (unitId: string, productType: string) =>
      `/api/v1/lab/component-changes/product-codes/${encodeURIComponent(unitId)}/${encodeURIComponent(productType)}`,
    CATALOG_NUMBERS: (unitId: string, productType: string) =>
      `/api/v1/lab/component-changes/catalog-numbers/${encodeURIComponent(unitId)}/${encodeURIComponent(productType)}`,
    DERIVE_PRODUCT_CODE: '/api/v1/lab/component-changes/derive-product-code',
  },

  SPECIAL_PROCESSING_MASTER_CODES: {
    LIST: (take: number, skip: number) => `/api/v1/sp-master-codes/${take}/${skip}`,
    GROUPED_LIST: (take: number, skip: number) => `/api/v1/sp-master-codes/grouped/${take}/${skip}`,
    GET_BY_ID: (codeType: string, code: string) =>
      `/api/v1/sp-master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`,
    CODE_TYPES: '/api/v1/sp-master-codes/code-types',
    CREATE: '/api/v1/sp-master-codes',
    UPDATE: (codeType: string, code: string) =>
      `/api/v1/sp-master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`,
  },

  PRE_PRINTED_PRODUCT_LABELS: {
    LIST: (take: number, skip: number) => `/api/v1/pre-printed-product-labels/${take}/${skip}`,
    GET_BY_ID: (catalogNumber: string, productType: string) =>
      `/api/v1/pre-printed-product-labels/${encodeURIComponent(catalogNumber)}/${encodeURIComponent(productType)}`,
    CREATE: '/api/v1/pre-printed-product-labels',
    UPDATE: (catalogNumber: string, productType: string) =>
      `/api/v1/pre-printed-product-labels/${encodeURIComponent(catalogNumber)}/${encodeURIComponent(productType)}`,
    FILTER_DROPDOWN: '/api/v1/pre-printed-product-labels/filter-dropdown',
    ADD_DROPDOWN: '/api/v1/pre-printed-product-labels/add-dropdown',
    PRODUCT_CODES: (productType: string) =>
      `/api/v1/pre-printed-product-labels/product-codes/${encodeURIComponent(productType)}`,
  },


  PRE_LABEL_FROZEN_ISBT: {
    BASE: '/api/v1/pre-label-frozen-isbt',
    PRINTER_CONFIG: '/api/v1/pre-label-frozen-isbt/printer-config',
    VALIDATE_ACCESS: '/api/v1/pre-label-frozen-isbt/validate-access',
    VALIDATE_UNIT: '/api/v1/pre-label-frozen-isbt/validate-unit',
    PROCESS_LABEL: '/api/v1/pre-label-frozen-isbt/process-label',
    CONFIRM_VERIFICATION: '/api/v1/pre-label-frozen-isbt/confirm-verification',
    REPRINT: '/api/v1/pre-label-frozen-isbt/reprint',
    LOV_ABO_VALUES: '/api/v1/pre-label-frozen-isbt/lov/abo-values',
    LOV_SPECIAL_TEST_CODES: '/api/v1/pre-label-frozen-isbt/lov/special-test-codes',
  },

  PHERESIS_COMPONENTS: {
    BASE: '/api/v1/enter-pheresis-components',
    PRODUCT_TYPES: '/api/v1/enter-pheresis-components/dropdowns/product-types',
    ATTRIBUTES: (productType: string) =>
      `/api/v1/enter-pheresis-components/dropdowns/attributes?productType=${encodeURIComponent(productType)}`,
    VALIDATE_UNIT: '/api/v1/enter-pheresis-components/validate-unit',
    CATALOG_NUMBERS: (productType: string, unitId: string) =>
      `/api/v1/enter-pheresis-components/dropdowns/catalog-numbers?productType=${encodeURIComponent(productType)}&unitId=${encodeURIComponent(unitId)}`,
    PRODUCT_CODES: (unitId: string, productType: string) =>
      `/api/v1/enter-pheresis-components/dropdowns/product-codes?unitId=${encodeURIComponent(unitId)}&productType=${encodeURIComponent(productType)}`,
    DETERMINE_PRODUCT: '/api/v1/enter-pheresis-components/determine-product',
    CREATE: '/api/v1/enter-pheresis-components',
    REPRINT_LABEL: '/api/v1/enter-pheresis-components/reprint-label',
  },

  RELEASE_FROM_SPECIAL_PROCESSING: {
    PROCESS_CODES: '/api/release-from-special-processing/process-codes',
    VALIDATE_UNIT: (processCode: string, unitId: string) =>
      `/api/release-from-special-processing/validate-unit/${encodeURIComponent(processCode)}/${encodeURIComponent(unitId)}`,
    AVAILABLE_PRODUCTS: (processCode: string, unitId: string, collDate: string) =>
      `/api/release-from-special-processing/available-products/${encodeURIComponent(processCode)}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,
    AVAILABLE_COMPONENTS: (processCode: string, unitId: string, collDate: string, productCode: string) =>
      `/api/release-from-special-processing/available-components/${encodeURIComponent(processCode)}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}`,
    RELEASE: '/api/release-from-special-processing/release',
  },

  VALID_POOL_ABO_VALUES: {
    LIST: (sortDir?: string) => `/api/v1/valid-abo-pooled-sld${sortDir ? `?sortDir=${sortDir}` : ''}`,
    SEARCH: (take: number, skip: number) => `/api/v1/valid-abo-pooled-sld/${take}/${skip}`,
    CREATE: '/api/v1/valid-abo-pooled-sld',
    UPDATE: (auditKey: string) => `/api/v1/valid-abo-pooled-sld/${auditKey}`,
    POOL_SLD_LOOKUP: '/api/v1/valid-abo-pooled-sld/pool-sld-lookup',
  },

  NOTATION_CODE: {
    BASE: '/api/v1/notation-codes',
    SEARCH: (take: number, skip: number) => `/api/v1/notation-codes/${take}/${skip}`,
    GET_BY_CODE: (notationCode: string) => `/api/v1/notation-codes/${encodeURIComponent(notationCode)}`,
    CREATE: '/api/v1/notation-codes',
    UPDATE: (notationCode: string) => `/api/v1/notation-codes/${encodeURIComponent(notationCode)}`,
    DELETE: (notationCode: string) => `/api/v1/notation-codes/${encodeURIComponent(notationCode)}`,
    NOTATION_CODE_LOV: '/api/v1/notation-codes/lookups/notation-codes',
    VALID_TESTS: '/api/v1/notation-codes/lookups/valid-tests',
  },

  PRODUCT_COMBINATIONS: {
    SEARCH: (take: number, skip: number) => `/api/v1/product-combinations/${take}/${skip}`,
    GET_BY_ID: (setId: number) => `/api/v1/product-combinations/${setId}`,
    CREATE: '/api/v1/product-combinations',
    DELETE: (setId: number) => `/api/v1/product-combinations/${setId}`,
    PRODUCT_TYPES: '/api/v1/product-combinations/product-types',
    BAG_CODES: '/api/v1/product-combinations/bag-codes',
    MATRIX_PRODUCT_TYPES: '/api/v1/product-combinations/matrix-product-types',
    NEXT_SET_ID: '/api/v1/product-combinations/next-set-id',
  },

  COMPONENT_INTERDICTION: {
    VALIDATE_UNIT: '/api/v1/component-interdiction/validate-unit',
    VALIDATE_PRODUCT: '/api/v1/component-interdiction/validate-product',
    VALID_INTERDICTIONS: '/api/v1/component-interdiction/valid-interdictions',
    CREATE: '/api/v1/component-interdiction',
    GET_PRODUCTS: '/api/v1/component-interdiction/valid-products',
    GET_BY_UNIT: '/api/v1/component-interdiction',
  },

  RELEASE_COMPONENT_HOLD: {
    VALIDATE_UNIT: '/api/v1/release-component-hold/validate-unit',
    PRODUCTS_WITH_HOLDS: '/api/v1/release-component-hold/products-with-holds',
    GET_HOLDS: '/api/v1/release-component-hold/holds',
    RELEASE: '/api/v1/release-component-hold/release',
  },

  COMPONENT_NOTES: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/component-notes/validate-unit/${encodeURIComponent(unitId)}`,
    PRODUCTS: (unitId: string) =>
      `/api/v1/component-notes/products/${encodeURIComponent(unitId)}`,
    COMPONENT_PREFIXES: '/api/v1/component-notes/component-prefixes',
    NOTE: '/api/v1/component-notes/note',
  },

  LAB_INTERDICTION_QUERY: {
    QUERY: '/api/v1/interdiction-query',
    GET_PRODUCTS: (unitId: string, collDate: string, codeScheme: string = 'I') =>
      `/api/v1/interdiction-query/products/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}?codeScheme=${codeScheme}`,
  },

  INSTRUMENT_UPLOAD_LOG: {
    QUERY: '/api/v1/instrument-upload-logs',
    FILTER_OPTIONS: '/api/v1/instrument-upload-logs/filter-options',
  },

  MULTIPLE_OBSERVATION_RESULT_MATRIX: {
    GET_MATRIX: (testId: string, testType: string) =>
      `/api/v1/multiple-observation-result-matrix?testId=${encodeURIComponent(testId)}&testType=${encodeURIComponent(testType)}`,
    SAVE_MATRIX: '/api/v1/multiple-observation-result-matrix',
    LOV_TESTS: '/api/v1/multiple-observation-result-matrix/lov/tests',
    LOV_TEST_TYPES: (testId: string) =>
      `/api/v1/multiple-observation-result-matrix/lov/test-types?testId=${encodeURIComponent(testId)}`,
    LOV_RESULT_INTERPRETATIONS: (testId: string) =>
      `/api/v1/multiple-observation-result-matrix/lov/result-interpretations?testId=${encodeURIComponent(testId)}`,
    LOV_RESULT_VALUES: '/api/v1/multiple-observation-result-matrix/lov/result-values',
  },

  VALID_MULTIPLE_OBSERVATION_RESULTS: {
    GET_TESTS: '/api/v1/valid-multiple-observation-results/tests',
    GET_BAND_RESULTS: (testId: string) =>
      `/api/v1/valid-multiple-observation-results/band-results/${encodeURIComponent(testId)}`,
    SAVE_BAND_RESULTS: '/api/v1/valid-multiple-observation-results/band-results/save',
  },

  MULTIPLE_OBSERVATION_FIELDS: {
    SEARCH: (take: number, skip: number) => `/api/v1/multiple-observation-fields/${take}/${skip}`,
    GET_BY_ID: (testId: string, testType: string, bandSeq: number) =>
      `/api/v1/multiple-observation-fields/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}/${bandSeq}`,
    CREATE: '/api/v1/multiple-observation-fields',
    UPDATE: (testId: string, testType: string, bandSeq: number) =>
      `/api/v1/multiple-observation-fields/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}/${bandSeq}`,
    DELETE: (testId: string, testType: string, bandSeq: number) =>
      `/api/v1/multiple-observation-fields/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}/${bandSeq}`,
    TESTS: '/api/v1/multiple-observation-fields/tests',
    TEST_TYPES: (testId: string) =>
      `/api/v1/multiple-observation-fields/test-types/${encodeURIComponent(testId)}`,
    RESEQUENCE: '/api/v1/multiple-observation-fields/resequence',
  },

  PRODUCT_ATTRIBUTES: {
    // Main CRUD operations
    LIST: (take: number, skip: number) => `/api/v1/product-attributes/${take}/${skip}`,
    GET_BY_ID: (productType: string, attribGroup: string, attribCode: string) =>
      `/api/v1/product-attributes/${encodeURIComponent(productType)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    CREATE: '/api/v1/product-attributes',
    UPDATE: (productType: string, attribGroup: string, attribCode: string) =>
      `/api/v1/product-attributes/${encodeURIComponent(productType)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    DELETE: (productType: string, attribGroup: string, attribCode: string) =>
      `/api/v1/product-attributes/${encodeURIComponent(productType)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    // Dropdown/LOV endpoints for forms
    PRODUCT_TYPES_DROPDOWN: '/api/v1/product-attributes/product-types',
    ATTRIBUTE_GROUPS_DROPDOWN: '/api/v1/product-attributes/attribute-groups',
    ATTRIBUTE_CODES_DROPDOWN: (attribGroup: string) =>
      `/api/v1/product-attributes/attribute-codes/${encodeURIComponent(attribGroup)}`,
    NEW_PRODUCT_TYPES_DROPDOWN: (currentProductType: string) =>
      `/api/v1/product-attributes/new-product-types/${encodeURIComponent(currentProductType)}`,
    // Filter endpoints for UI grid filtering
    FILTER_PRODUCT_TYPES: '/api/v1/product-attributes/filters/product-types',
    FILTER_ATTRIBUTE_GROUPS: '/api/v1/product-attributes/filters/attribute-groups',
    FILTER_ATTRIBUTE_CODES: '/api/v1/product-attributes/filters/attribute-codes',
  },

  VALID_ATTRIBUTES_MATRIX: {
    LIST: (take: number, skip: number) => `/api/v1/attribute-matrix/${take}/${skip}`,
    GET_BY_ID: (attribAddedGroup: string, attribAddedCode: string) =>
      `/api/v1/attribute-matrix/${encodeURIComponent(attribAddedGroup)}/${encodeURIComponent(attribAddedCode)}`,
    CREATE: '/api/v1/attribute-matrix',
    UPDATE: (attribAddedGroup: string, attribAddedCode: string) =>
      `/api/v1/attribute-matrix/${encodeURIComponent(attribAddedGroup)}/${encodeURIComponent(attribAddedCode)}`,
    DELETE: (attribAddedGroup: string, attribAddedCode: string) =>
      `/api/v1/attribute-matrix/${encodeURIComponent(attribAddedGroup)}/${encodeURIComponent(attribAddedCode)}`,
    ATTRIBUTE_GROUPS: (searchParam?: string) =>
      searchParam
        ? `/api/v1/attribute-matrix/attribute-groups?searchParam=${encodeURIComponent(searchParam)}`
        : '/api/v1/attribute-matrix/attribute-groups',
    ATTRIBUTE_CODES: (attribGroup?: string, searchParam?: string) => {
      const params: string[] = [];
      if (attribGroup) params.push(`attribGroup=${encodeURIComponent(attribGroup)}`);
      if (searchParam) params.push(`searchParam=${encodeURIComponent(searchParam)}`);
      return params.length
        ? `/api/v1/attribute-matrix/attribute-codes?${params.join('&')}`
        : '/api/v1/attribute-matrix/attribute-codes';
    },
    DELETED_ATTRIBUTE_CODES: (attribGroup?: string, searchParam?: string) => {
      const params: string[] = [];
      if (attribGroup) params.push(`attribGroup=${encodeURIComponent(attribGroup)}`);
      if (searchParam) params.push(`searchParam=${encodeURIComponent(searchParam)}`);
      return params.length
        ? `/api/v1/attribute-matrix/deleted-attribute-codes?${params.join('&')}`
        : '/api/v1/attribute-matrix/deleted-attribute-codes';
    },
    ASSOCIATED_ATTRIBUTE_CODES: (attribGroup?: string, searchParam?: string) => {
      const params: string[] = [];
      if (attribGroup) params.push(`attribGroup=${encodeURIComponent(attribGroup)}`);
      if (searchParam) params.push(`searchParam=${encodeURIComponent(searchParam)}`);
      return params.length
        ? `/api/v1/attribute-matrix/associated-attribute-codes?${params.join('&')}`
        : '/api/v1/attribute-matrix/associated-attribute-codes';
    },
    MODIFIER_CODES: (searchParam?: string) =>
      searchParam
        ? `/api/v1/attribute-matrix/modifier-codes?searchParam=${encodeURIComponent(searchParam)}`
        : '/api/v1/attribute-matrix/modifier-codes',
  },

  ANTIGEN_PRICING_MATRIX: {
    LIST: (take: number, skip: number) => `/api/v1/antigen-pricing-matrix/${take}/${skip}`,
    GET_BY_ID: (antigen: string) =>
      `/api/v1/antigen-pricing-matrix/${encodeURIComponent(antigen)}`,
    CREATE: '/api/v1/antigen-pricing-matrix',
    UPDATE: (antigen: string) =>
      `/api/v1/antigen-pricing-matrix/${encodeURIComponent(antigen)}`,
    DELETE: (antigen: string) =>
      `/api/v1/antigen-pricing-matrix/${encodeURIComponent(antigen)}`,
    FILTER_DROPDOWN: '/api/v1/antigen-pricing-matrix/filter-dropdown',
    ADD_DROPDOWN: '/api/v1/antigen-pricing-matrix/add-dropdown',
  },

  COMMON_LETTER: {
    COMMUNICATION_TYPES: '/api/v1/common-letter/communication-types',
    COMMUNICATION_CODES: (commType: string) =>
      `/api/v1/common-letter/communication-codes?commType=${encodeURIComponent(commType)}`,
    LETTERS_LIST: '/api/v1/common-letter/letters',
    LETTER_DETAIL: (letterCode: string) =>
      `/api/v1/common-letter/letters/${encodeURIComponent(letterCode)}`,
    GENERATE: '/api/v1/common-letter/generate',
    SAVE: '/api/v1/common-letter/save',
  },

  // Authorize Notification Letter - NotificationLetterController endpoints
  // Backend route: [Route("notification-letter")] - follows same pattern as SearchDonorController
  NOTIFICATION_LETTER: {
    // GET /api/v1/notification-letter/{donorId}/{letterSeqNo}
    GET_LETTER: (donorId: string, letterSeqNo: string) =>
      `/api/v1/notification-letter/${encodeURIComponent(donorId)}/${encodeURIComponent(letterSeqNo)}`,
    // GET /api/v1/notification-letter/letters-dropdown
    GET_LETTERS_DROPDOWN: '/api/v1/notification-letter/letters-dropdown',
    // GET /api/v1/notification-letter/letter-template/{letterId}/{letterCode}
    GET_LETTER_TEMPLATE: (letterId: string, letterCode: string) =>
      `/api/v1/notification-letter/letter-template/${encodeURIComponent(letterId)}/${encodeURIComponent(letterCode)}`,
    // GET /api/v1/notification-letter/{donorId}/donor-info
    GET_DONOR_INFO: (donorId: string) =>
      `/api/v1/notification-letter/${encodeURIComponent(donorId)}/donor-info`,
    // GET /api/v1/notification-letter/{donorId}/existing-letter
    GET_EXISTING_LETTER: (donorId: string) =>
      `/api/v1/notification-letter/${encodeURIComponent(donorId)}/existing-letter`,
    // POST /api/v1/notification-letter/authorize
    AUTHORIZE: '/api/v1/notification-letter/authorize',
    // POST /api/v1/notification-letter/reject
    REJECT: '/api/v1/notification-letter/reject',
    // POST /api/v1/notification-letter/save
    SAVE: '/api/v1/notification-letter/save',
    // PUT /api/v1/notification-letter/{donorId}/{letterSeqNo}/text
    UPDATE_TEXT: (donorId: string, letterSeqNo: string) =>
      `/api/v1/notification-letter/${encodeURIComponent(donorId)}/${encodeURIComponent(letterSeqNo)}/text`,
  },

  ROLLBACK_DONATION_AUDIT: {
    RETRIEVE: '/api/v1/rollback-donation-audit/retrieve',
    VERIFY_DONATION_ID: '/api/v1/rollback-donation-audit/verify-donation-id',
    ROLLBACK: '/api/v1/rollback-donation-audit/rollback',
    GET_COLLECTION_DATES: (unitId: string) => `/api/v1/rollback-donation-audit/collection-dates/${encodeURIComponent(unitId)}`,
  },

  ADD_DONOR: {
    CREATE: '/api/v1/donors',
    GET_BY_ID: (donorId: string) => `/api/v1/donors/${encodeURIComponent(donorId)}`,
    MODIFY: (donorId: string) => `/api/v1/donors/${encodeURIComponent(donorId)}`,
    LOOKUPS: {
      SALUTATIONS: '/api/v1/donors/lookups/salutations',
      ETHNIC_GROUPS: '/api/v1/donors/lookups/ethnic-groups',
      LANGUAGES: '/api/v1/donors/lookups/languages',
      EMPLOYERS: '/api/v1/donors/lookups/employers',
      CITIES: (search: string) => `/api/v1/donors/lookups/cities?searchKeyword=${encodeURIComponent(search)}`,
      ZIPS: (city: string) => `/api/v1/donors/lookups/zips?city=${encodeURIComponent(city)}`,
    },
    CITY_STATE_LOOKUP: (zip: string) => `/api/v1/donors/city-state/${encodeURIComponent(zip)}`,
  },

  DONOR_DETAIL_QUERY: {
    GET_BY_ID: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}`,
    GET_PROCEDURE_CODES: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/procedure-codes`,
    GET_INTERDICTIONS: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/interdictions`,
    GET_NOTES: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/notes`,
    GET_CELL_LOSS: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/cell-loss`,
    GET_INTERDICTION_HOLDS: (donorId: string, filter: string = 'active') => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/interdiction-holds?filter=${encodeURIComponent(filter)}`,
    GET_MERGED_DONORS: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/merged-donors`,
    GET_MERGED_INTERDICTIONS: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/merged-interdictions`,
    GET_MERGE_HOLD_UNITS: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/merge-hold-units`,
    GET_POTENTIAL_DUPLICATES: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/potential-duplicates`,
    GET_YTD_LOSS: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/ytd-loss`,
    GET_LETTERS: (donorId: string) => `/api/v1/donors/detail-query/${encodeURIComponent(donorId)}/letters`,
  },

  DETACH_DONOR_FROM_DONATION: {
    GET_DONATIONS: (unitId: string) =>
      `/api/v1/detach-donor-from-donation/donations/${encodeURIComponent(unitId)}`,
    VALIDATE: (unitId: string, collDate: string) =>
      `/api/v1/detach-donor-from-donation/validate/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,
    DETACH: '/api/v1/detach-donor-from-donation/detach',
    BLEED_TIME_DETAILS: (unitId: string) =>
      `/api/v1/detach-donor-from-donation/bleed-time-details/${encodeURIComponent(unitId)}`,
  },
  DETACH_DONOR_FROM_DEFERRAL: {
    GET_DEFERRAL: (deferralId: string) =>
      `/api/v1/detach-donor-from-deferral/deferral/${encodeURIComponent(deferralId)}`,
    EXECUTE: '/api/v1/detach-donor-from-deferral/execute',
  },
  RELEASE_AUDIT_INTERDICTIONS: {
    SEARCH: '/api/v1/release-audit-interdictions/search',
    RELEASE: '/api/v1/release-audit-interdictions/release',
    TERMINATED: '/api/v1/release-audit-interdictions/terminated',
    REMOVE: '/api/v1/release-audit-interdictions/remove',
    REMOVAL_REASONS: '/api/v1/release-audit-interdictions/removal-reasons',
  },
  MAINTAIN_DONOR_INTERDICTION: {
    DONOR_DETAILS: (donorId: string) =>
      `/api/v1/donor/${encodeURIComponent(donorId)}/interdiction-details`,
    INTERDICTIONS: (donorId: string) =>
      `/api/v1/donor/${encodeURIComponent(donorId)}/interdictions`,
    VALID_CODES: '/api/v1/donor/interdictions/valid-codes',
    COLLECTION_DATES: (donorId: string, unitId: string) =>
      `/api/v1/donor/${encodeURIComponent(donorId)}/interdictions/unit/${encodeURIComponent(unitId)}/collection-dates`,
    PLACE: (donorId: string) =>
      `/api/v1/donor/${encodeURIComponent(donorId)}/interdictions`,
    RELEASE: (donorId: string) =>
      `/api/v1/donor/${encodeURIComponent(donorId)}/interdictions/release`,
    TERMINATE: (donorId: string) =>
      `/api/v1/donor/${encodeURIComponent(donorId)}/interdictions/terminate`,
    TERMINATION_REASONS: '/api/v1/donor/interdictions/termination-reasons',
  },

  MAINTAIN_DONOR_ATTRIBUTE: {
    DONOR_DETAILS: (donorId: string) =>
      `/api/v1/maintain-donor-attribute/${encodeURIComponent(donorId)}/details`,
    ATTRIBUTES: (donorId: string) =>
      `/api/v1/maintain-donor-attribute/${encodeURIComponent(donorId)}/attributes`,
    PROPERTIES_DROPDOWN: '/api/v1/maintain-donor-attribute/properties/dropdown',
    CREATE: (donorId: string) =>
      `/api/v1/maintain-donor-attribute/${encodeURIComponent(donorId)}/attributes`,
    UPDATE: (donorId: string, interCode: string, effDate: string) =>
      `/api/v1/maintain-donor-attribute/${encodeURIComponent(donorId)}/attributes/${encodeURIComponent(interCode)}/${encodeURIComponent(effDate)}`,
    BULK_TERMINATE: (donorId: string) =>
      `/api/v1/maintain-donor-attribute/${encodeURIComponent(donorId)}/attributes/bulk-terminate`,
    VALIDATE_ACCESS: (interCode: string) =>
      `/api/v1/maintain-donor-attribute/validate-access/${encodeURIComponent(interCode)}`,
  },

  DONOR_EMPLOYER: {
    SEARCH: (take: number, skip: number) => `/api/v1/donor-employers/${take}/${skip}`,
    GET_BY_ID: (employerId: string) => `/api/v1/donor-employers/${encodeURIComponent(employerId)}`,
    CREATE: '/api/v1/donor-employers',
    UPDATE: '/api/v1/donor-employers',
    DELETE: (employerId: string) => `/api/v1/donor-employers/${encodeURIComponent(employerId)}`,
    AUTOCOMPLETE: '/api/v1/donor-employers/autocomplete',
    STATES: '/api/v1/donor-employers/states',
    COUNTRIES: '/api/v1/chapters/countries/lookup',
    CITY_STATE_LOOKUP: (zipCode: string) => `/api/v1/donor-employers/city-state/${encodeURIComponent(zipCode)}`,
    LOOKUPS: {
      CITIES: '/api/v1/donor-employers/cities',
      ZIPS: (city: string) => `/api/v1/donor-employers/zips?city=${encodeURIComponent(city)}`
    }
  },

  DONOR_LETTERS: {
    BASE: '/api/v1/donor-letters',
    DETAIL: (donorId: string, letterSeqNo: string) =>
      `/api/v1/donor-letters/${encodeURIComponent(donorId)}/${encodeURIComponent(letterSeqNo)}`,
    LETTER_CODES: '/api/v1/donor-letters/letter-codes',
    DONORS: '/api/v1/donor-letters/donors',
  },

  CONSENT_HISTORY: {
    BASE: '/api/v1/consent-history',
    DETAIL: (donorId: string, transactionId: string, letterId: string) =>
      `/api/v1/consent-history/${encodeURIComponent(donorId)}/${encodeURIComponent(transactionId)}/${encodeURIComponent(letterId)}`,
    SIGNATURE: (donorId: string, transactionId: string, letterId: string, type: string) =>
      `/api/v1/consent-history/signature/${encodeURIComponent(donorId)}/${encodeURIComponent(transactionId)}/${encodeURIComponent(letterId)}/${encodeURIComponent(type)}`,
    DONOR_INFO: (donorId: string) =>
      `/api/v1/consent-history/donor-info/${encodeURIComponent(donorId)}`,
  },

  NOTIFICATION_LETTERS: {
    GET_ALL: (donorId: string) =>
      `/api/v1/notification-letters/${encodeURIComponent(donorId)}`,
    GET_LETTER_TEXT: (donorId: string, letterSeqNo: string) =>
      `/api/v1/notification-letters/${encodeURIComponent(donorId)}/letter-text/${encodeURIComponent(letterSeqNo)}`,
  },

  VOID_DONOR_INTERFACE: {
    GET_UNIT_DETAILS: (unitId: string) => `/api/v1/admin/void-donor-interface/unit-details/${encodeURIComponent(unitId)}`,
    VOID: '/api/v1/admin/void-donor-interface',
  },
  RELEASE_AUDIT_HOLDS: {
    GET_UNIT: (unitId: string) => `/api/v1/release-audit-holds/unit/${encodeURIComponent(unitId)}`,
    GET_HOLDS: '/api/v1/release-audit-holds/holds',
    PLACE_HOLD: (unitId: string) => `/api/v1/release-audit-holds/unit/${encodeURIComponent(unitId)}/hold`,
    REMOVE_HOLD: (unitId: string) => `/api/v1/release-audit-holds/unit/${encodeURIComponent(unitId)}/hold/remove`,
    GET_INTERDICTION_CODES: '/api/v1/release-audit-holds/interdiction-codes',
    GET_DEFER_DONOR_CONFIG: (collDate: string) => `/api/v1/release-audit-holds/defer-donor-config?collDate=${encodeURIComponent(collDate)}`,
    GET_DONATION_TYPES: '/api/v1/release-audit-holds/donation-types',
    GET_DONATION_PROCEDURES: '/api/v1/release-audit-holds/donation-procedures',
    GET_AUDIT_HOLD_TYPES: '/api/v1/release-audit-holds/audit-hold-types',
    GET_HOLD_COMMENTS: (unitId: string) => `/api/v1/release-audit-holds/unit/${encodeURIComponent(unitId)}/hold/comments`,
    GET_UNIT_HOLDS: 'api/v1/donation-hold-details/unit-holds',
    GET_DONOR_HOLDS: 'api/v1/donation-hold-details/donor-holds'
  },

  DEFERRAL_HOLD: {
    SEARCH: (take: number, skip: number) =>
      `/api/v1/deferral-hold/${take}/${skip}`,
    DONOR_INTERDICTIONS: (transactionId: string, activeOnly: boolean) =>
      `/api/v1/deferral-hold/${encodeURIComponent(transactionId)}/donor-interdictions?activeOnly=${activeOnly}`,
    DONATION_INTERDICTIONS: (transactionId: string, activeOnly: boolean) =>
      `/api/v1/deferral-hold/${encodeURIComponent(transactionId)}/donation-interdictions?activeOnly=${activeOnly}`,
    LOOKUPS: {
      DRIVES: '/api/v1/deferral-hold/drives-lov',
      USERS: '/api/v1/deferral-hold/users-lov',
      TRANSACTIONS: '/api/v1/deferral-hold/transactions-lov',
      INTERDICTION_CODES: '/api/v1/deferral-hold/interdiction-codes-lov',
      DEFERRALS: '/api/v1/deferral-hold/deferrals-lov',
      SETS: '/api/v1/deferral-hold/sets-lov',
    },
  },

  ATTRIBUTE_EXPIRATION_DATE_OVERRIDE: {
    LIST: (take: number, skip: number) => `/api/v1/attribute-expiration-date-override/${take}/${skip}`,
    GET_BY_ID: (attribCode: string, ovrAttribCode: string) =>
      `/api/v1/attribute-expiration-date-override/${encodeURIComponent(attribCode)}/${encodeURIComponent(ovrAttribCode)}`,
    CREATE: '/api/v1/attribute-expiration-date-override',
    UPDATE: (attribCode: string, ovrAttribCode: string) =>
      `/api/v1/attribute-expiration-date-override/${encodeURIComponent(attribCode)}/${encodeURIComponent(ovrAttribCode)}`,
    DELETE: (attribCode: string, ovrAttribCode: string) =>
      `/api/v1/attribute-expiration-date-override/${encodeURIComponent(attribCode)}/${encodeURIComponent(ovrAttribCode)}`,
    ATTRIBUTES_DROPDOWN: '/api/v1/attribute-expiration-date-override/attributes-dropdown',
    FILTER_DROPDOWN: '/api/v1/attribute-expiration-date-override/filter-dropdown',
    ADD_DROPDOWN: '/api/v1/attribute-expiration-date-override/add-dropdown',
  },

  ATTRIBUTE_CODES: {
    LIST: (take: number, skip: number) => `/api/v1/attribute-codes/${take}/${skip}`,
    GET_BY_ID: (attribCode: string) => `/api/v1/attribute-codes/${encodeURIComponent(attribCode)}`,
    CREATE: '/api/v1/attribute-codes',
    UPDATE: (attribCode: string) => `/api/v1/attribute-codes/${encodeURIComponent(attribCode)}`,
    DELETE: (attribCode: string) => `/api/v1/attribute-codes/${encodeURIComponent(attribCode)}`,
    FILTER_DROPDOWN: '/api/v1/attribute-codes/filter-dropdown',
  },

  ATTRIBUTE_SERVICE_CODES: {
    LIST: (take: number, skip: number) => `/api/v1/attribute-service-codes/${take}/${skip}`,
    GET_BY_ID: (attributeGroup: string, attributeCode: string) =>
      `/api/v1/attribute-service-codes/${encodeURIComponent(attributeGroup)}/${encodeURIComponent(attributeCode)}`,
    UPDATE: (attributeGroup: string, attributeCode: string) =>
      `/api/v1/attribute-service-codes/${encodeURIComponent(attributeGroup)}/${encodeURIComponent(attributeCode)}`,
    GROUPS_DROPDOWN: '/api/v1/attribute-service-codes/groups/dropdown',
    ADD_DROPDOWN: '/api/v1/attribute-codes/add-dropdown',
    FILTER_PRICES: (attributeGroup: string) =>
      `/api/v1/attribute-service-codes/filter/prices/${encodeURIComponent(attributeGroup)}`,
    FILTER_SERVICE_CODES: (attributeGroup: string) =>
      `/api/v1/attribute-service-codes/filter/service-codes/${encodeURIComponent(attributeGroup)}`,
    DELETE: (attributeGroup: string, attributeCode: string) =>
      `/api/v1/attribute-service-codes/${encodeURIComponent(attributeGroup)}/${encodeURIComponent(attributeCode)}`,
  },

  IDP_CONVERSION: {
    LIST: (take: number, skip: number) => `/api/v1/idp-conversion/${take}/${skip}`,
    GET_BY_ID: (convRefId: number) => `/api/v1/idp-conversion/${convRefId}`,
    CREATE: '/api/v1/idp-conversion',
    UPDATE: (convRefId: number) => `/api/v1/idp-conversion/${convRefId}`,
    TARGET_VALUE_LOOKUPS: (targetCodeType: string) =>
      `/api/v1/idp-conversion/target-value-lookups/${encodeURIComponent(targetCodeType)}`,
  },

  UNIT_INTERDICTION: {
    SEARCH: '/api/v1/unit-interdiction/search',
    GET: '/api/v1/unit-interdiction/get',
    CREATE: '/api/v1/unit-interdiction',
    TERMINATE: '/api/v1/unit-interdiction/terminate',
    RELEASE: '/api/v1/unit-interdiction/release',
    SEARCH_OPTIONS: '/api/v1/unit-interdiction/search-options',
    INTERDICTION_CODES: '/api/v1/unit-interdiction/interdiction-codes',
    TERMINATION_REASONS: '/api/v1/unit-interdiction/termination-reasons',
    // Add Interdiction for Units Not Checked (MLT-13316)
    CHECK_UNIT_EXISTS: (unitId: string) => `/api/v1/unit-interdictions/check-unit-exists/${encodeURIComponent(unitId)}`,
    VALID_INTERDICTIONS: (unitId: string) => `/api/v1/unit-interdictions/valid-interdictions/${encodeURIComponent(unitId)}`,
    ADD_NOT_CHECKED: '/api/v1/unit-interdictions/add-not-checked',
  },

  PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION: {
    GET_ACTIONS: '/api/v1/inventory-management/unit-interdiction/actions',
    GET_INTERDICTION_CODES: '/api/v1/inventory-management/unit-interdiction/interdiction-codes',
    VALIDATE_UNIT: '/api/v1/inventory-management/unit-interdiction/validate-unit',
    VALIDATE_INTERDICTION_CODE: '/api/v1/inventory-management/unit-interdiction/validate-interdiction-code',
    PLACE: '/api/v1/inventory-management/unit-interdiction/place',
    RELEASE: '/api/v1/inventory-management/unit-interdiction/release',
    UNITS_FOR_RELEASE: '/api/v1/inventory-management/unit-interdiction/units-for-release',
  },

  VALID_FILTERS: {
    LIST: (take: number, skip: number) => `/api/v1/valid-filters/${take}/${skip}`,
    GET_BY_ID: (catalogNumber: string) =>
      `/api/v1/valid-filters/${encodeURIComponent(catalogNumber)}`,
    CREATE: '/api/v1/valid-filters',
    UPDATE: (catalogNumber: string) =>
      `/api/v1/valid-filters/${encodeURIComponent(catalogNumber)}`,
    DELETE: (catalogNumber: string) =>
      `/api/v1/valid-filters/${encodeURIComponent(catalogNumber)}`,
    FILTER_DROPDOWN: '/api/v1/valid-filters/filter-dropdown',
    ADD_DROPDOWN: '/api/v1/valid-filters/add-dropdown',
  },

  VALID_ADDITIONAL_TESTS: {
    LIST: (take: number, skip: number) => `/api/v1/valid-additional-tests/${take}/${skip}`,
    GET_BY_ID: (testId: string) => `/api/v1/valid-additional-tests/${encodeURIComponent(testId)}`,
    TESTS_DROPDOWN: '/api/v1/valid-additional-tests/tests-dropdown',
    CREATE: '/api/v1/valid-additional-tests',
    UPDATE: (testId: string) => `/api/v1/valid-additional-tests/${encodeURIComponent(testId)}`,
    DELETE: (testId: string) => `/api/v1/valid-additional-tests/${encodeURIComponent(testId)}`,
  },
  REAGENT_STORE: {
    LIST: (take: number, skip: number) => `/api/v1/reagent-store/${take}/${skip}`,
    GET_BY_ID: (reagentId: string, testId: string) => `/api/v1/reagent-store/by-id?reagentId=${encodeURIComponent(reagentId)}&testId=${encodeURIComponent(testId)}`,
    CREATE: '/api/v1/reagent-store',
    UPDATE: (reagentId: string, testId: string) => `/api/v1/reagent-store/by-id?reagentId=${encodeURIComponent(reagentId)}&testId=${encodeURIComponent(testId)}`,
    LOOKUPS: {
      TESTS: '/api/v1/reagent-store/tests',
      REAGENT_IDS: '/api/v1/reagent-store/reagent-ids',
      REAGENT_CODES: '/api/v1/reagent-store/reagent-codes',
      REAGENT_TYPES: '/api/v1/reagent-store/reagent-types',
      SUPPLIERS: '/api/v1/reagent-store/suppliers',
      CONTAINERS: '/api/v1/reagent-store/containers',
      STORAGE_LOCATIONS: '/api/v1/reagent-store/storage-locations',
      CONTROL_INDICATORS: '/api/v1/reagent-store/control-indicators',
      REJECT_REASONS: '/api/v1/reagent-store/reject-reasons',
    },
  },

  VALID_REMOTE_TESTING_LABS: {
    LIST: (take: number, skip: number) => `/api/v1/valid-remote-testing-labs/${take}/${skip}`,
    GET_BY_ID: (testingLabId: string) => `/api/v1/valid-remote-testing-labs/${encodeURIComponent(testingLabId)}`,
    CREATE: '/api/v1/valid-remote-testing-labs',
    UPDATE: (testingLabId: string) => `/api/v1/valid-remote-testing-labs/${encodeURIComponent(testingLabId)}`,
    DELETE: (testingLabId: string) => `/api/v1/valid-remote-testing-labs/${encodeURIComponent(testingLabId)}`,
    LOOKUP: '/api/v1/valid-remote-testing-labs/lookup',
  },

  LAB_MATERIAL_CHECK_IN: {
    CHECK_IN_EXCEPTION_QUERY: '/api/v1/check-in-exception-query',
  },

  NON_EXTRACTED_BATCHES: {
    GET_BATCHES: '/api/v1/laboratory/non-extracted-batches',
    GET_UNITS: (batchId: string) =>
      `/api/v1/laboratory/non-extracted-batches/${encodeURIComponent(batchId)}/units`,
    GET_TEST_RESULTS: (batchId: string, unitId: string) =>
      `/api/v1/laboratory/non-extracted-batches/${encodeURIComponent(batchId)}/units/${encodeURIComponent(unitId)}/test-results`,
    GET_CONTRACTS: '/api/v1/laboratory/non-extracted-batches/contracts',
  },

  DONOR_ANTIGENS_QUERY: {
    GET: (donorId: string) => `/api/v1/donor-antigens-query/${encodeURIComponent(donorId)}`,
  },

  TEST_BATCH_DETAILS_QUERY: {
    WORKSHEETS: '/api/v1/test-batch-details-query/lookups/worksheets',
    TESTS_FOR_WORKSHEET: (worksheetId: string) =>
      `/api/v1/test-batch-details-query/lookups/tests/${encodeURIComponent(worksheetId)}`,
    DETAILS: (worksheetId: string, testId: string) =>
      `/api/v1/test-batch-details-query/${encodeURIComponent(worksheetId)}/tests/${encodeURIComponent(testId)}`,
    SCHEDULED_TESTS: (worksheetId: string, testId: string) =>
      `/api/v1/test-batch-details-query/${encodeURIComponent(worksheetId)}/tests/${encodeURIComponent(testId)}/scheduled-tests`,
    UNSCHEDULED_TESTS: (worksheetId: string, testId: string) =>
      `/api/v1/test-batch-details-query/${encodeURIComponent(worksheetId)}/tests/${encodeURIComponent(testId)}/unscheduled-tests`,
    PARAMETERS: (worksheetId: string, testId: string) =>
      `/api/v1/test-batch-details-query/${encodeURIComponent(worksheetId)}/tests/${encodeURIComponent(testId)}/parameters`,
    HOLDING_TESTS: (worksheetId: string, testId: string) =>
      `/api/v1/test-batch-details-query/${encodeURIComponent(worksheetId)}/tests/${encodeURIComponent(testId)}/holding-tests`,
    NOTES: (worksheetId: string) =>
      `/api/v1/test-batch-details-query/${encodeURIComponent(worksheetId)}/notes`,
    NOTE: (worksheetId: string, auditKey: number) =>
      `/api/v1/test-batch-details-query/${encodeURIComponent(worksheetId)}/notes/${auditKey}`,
  },

  UNIT_LEVEL_QC: {
    BASE: '/api/v1/laboratory-functions/unit-level-qc',
    QUERY: (take: number, skip: number) =>
      `/api/v1/laboratory-functions/unit-level-qc/${take}/${skip}`,
    GET_BY_ID: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}`,
    GET_DETAIL: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}/detail`,
    VALIDATE: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}/validate`,
    QC_STATUS: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}/qc-status`,
    COMMIT_QC: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}/commit-qc`,
    COMPONENTS: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}/components`,
    TESTS_SCHEDULED: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}/tests/scheduled`,
    TESTS_UNSCHEDULED: (unitId: string) =>
      `/api/v1/laboratory-functions/unit-level-qc/${encodeURIComponent(unitId)}/tests/unscheduled`,
  },

  UNIT_TESTED_ANTIGENS: {
    QUERY: '/api/v1/unit-tested-antigens/query',
    VALIDATE_UNIT: (unitId: string) => `/api/v1/unit-tested-antigens/validate-unit/${encodeURIComponent(unitId)}`,
  },

  UNIT_COMPONENT_ATTRIBUTES: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/cpq-attributes/validate-unit/${encodeURIComponent(unitId)}`,
    QUERY: (unitId: string, collDate: string, codeScheme: string, productCode?: string) => {
      const params: string[] = [
        `unitId=${encodeURIComponent(unitId)}`,
        `collDate=${encodeURIComponent(collDate)}`,
        `codeScheme=${encodeURIComponent(codeScheme)}`,
      ];
      if (productCode) params.push(`productCode=${encodeURIComponent(productCode)}`);
      return `/api/v1/cpq-attributes/query?${params.join('&')}`;
    },
    PRODUCT_CODES: (unitId: string, collDate: string, codeScheme: string) => {
      const params = [
        `unitId=${encodeURIComponent(unitId)}`,
        `collDate=${encodeURIComponent(collDate)}`,
        `codeScheme=${encodeURIComponent(codeScheme)}`,
      ];
      return `/api/v1/cpq-attributes/product-codes?${params.join('&')}`;
    },
    // New paginated endpoints
    UNIT_ATTRIBUTES: (take: number, skip: number) =>
      `/api/v1/cpq-attributes/unit-attributes/${take}/${skip}`,
    UNIT_ATTRIBUTES_FILTER_OPTIONS: (unitId: string, collDate: string, codeScheme: string) => {
      const params = [
        `unitId=${encodeURIComponent(unitId)}`,
        `collDate=${encodeURIComponent(collDate)}`,
        `codeScheme=${encodeURIComponent(codeScheme)}`,
      ];
      return `/api/v1/cpq-attributes/unit-attributes/filter-options?${params.join('&')}`;
    },
    COMPONENT_ATTRIBUTES: (take: number, skip: number) =>
      `/api/v1/cpq-attributes/component-attributes/${take}/${skip}`,
    COMPONENT_ATTRIBUTES_FILTER_OPTIONS: (unitId: string, collDate: string, codeScheme: string, productCode?: string) => {
      const params = [
        `unitId=${encodeURIComponent(unitId)}`,
        `collDate=${encodeURIComponent(collDate)}`,
        `codeScheme=${encodeURIComponent(codeScheme)}`,
      ];
      if (productCode) params.push(`productCode=${encodeURIComponent(productCode)}`);
      return `/api/v1/cpq-attributes/component-attributes/filter-options?${params.join('&')}`;
    },
  },

  COMPONENT_ATTRIBUTES: {
    // Get all / filter component attributes with pagination
    GET_ALL: (take: number, skip: number) => `/api/v1/component-attribute/${take}/${skip}`,
    // Get component attribute by composite key
    GET_BY_ID: (unitId: string, collDate: string, productCode: string, attribGroup: string, attribCode: string) =>
      `/api/v1/component-attribute/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    // Create component attribute
    CREATE: '/api/v1/component-attribute',
    // Delete component attribute by composite key
    DELETE: (unitId: string, collDate: string, productCode: string, attribGroup: string, attribCode: string) =>
      `/api/v1/component-attribute/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    // Validate unit
    VALIDATE_UNIT: '/api/v1/component-attribute/validate-unit',
    // Get product codes LOV for a unit
    GET_PRODUCT_CODES: (unitId: string, collDate: string) => {
      return `/api/v1/component-attribute/product-codes?unitId=${encodeURIComponent(unitId)}&collDate=${encodeURIComponent(collDate)}`;
    },
    // Get valid attribute groups (requires productCode + codeScheme to filter)
    GET_ATTRIBUTE_GROUPS: (productCode: string, codeScheme?: string) => {
      let url = `/api/v1/component-attribute/attribute-groups?productCode=${encodeURIComponent(productCode)}`;
      if (codeScheme) url += `&codeScheme=${encodeURIComponent(codeScheme)}`;
      return url;
    },
    // Get valid attribute codes for a group (Gap H.2/L.2 fix)
    GET_ATTRIBUTE_CODES: (attribGroup: string, unitId: string, productCode: string, codeScheme?: string) => {
      let url = `/api/v1/component-attribute/attribute-codes/${encodeURIComponent(attribGroup)}?unitId=${encodeURIComponent(unitId)}&productCode=${encodeURIComponent(productCode)}`;
      if (codeScheme) {
        url += `&codeScheme=${encodeURIComponent(codeScheme)}`;
      }
      return url;
    },
  },

  ENTER_UNIT_ATTRIBUTES: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/unit-attributes/validate-unit/${encodeURIComponent(unitId)}`,
    GET_ATTRIBUTES: (unitId: string, take: number, skip: number) =>
      `/api/v1/unit-attributes/${encodeURIComponent(unitId)}/${take}/${skip}`,
    ATTRIBUTE_GROUPS: '/api/v1/unit-attributes/attribute-groups',
    ATTRIBUTE_CODES: (groupCode: string) =>
      `/api/v1/unit-attributes/attribute-codes/${encodeURIComponent(groupCode)}`,
    CREATE: '/api/v1/unit-attributes',
    DELETE: (unitId: string, attribGroup: string, attribCode: string) =>
      `/api/v1/unit-attributes/${encodeURIComponent(unitId)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
  },

  PHYSICIAN: {
    BASE: '/api/v1/physicians',
    SEARCH: '/api/v1/physicians/search',
    GET_BY_ID: (phyId: string, chapterId: string) =>
      `/api/v1/physicians/${encodeURIComponent(phyId)}/${encodeURIComponent(chapterId)}`,
    CREATE: '/api/v1/physicians',
    UPDATE: (phyId: string, chapterId: string) =>
      `/api/v1/physicians/${encodeURIComponent(phyId)}/${encodeURIComponent(chapterId)}`,
    DELETE: (phyId: string, chapterId: string) =>
      `/api/v1/physicians/${encodeURIComponent(phyId)}/${encodeURIComponent(chapterId)}`,
  },
  ENTER_HLA_RBC_REQUEST: {
    LOOKUP_PATIENTS:              '/api/v1/enter-hla-rbc-request/lookup/patients',
    LOOKUP_ABO_CODES:             '/api/v1/enter-hla-rbc-request/lookup/abo-codes',
    LOOKUP_HLA_LOCUS:             '/api/v1/enter-hla-rbc-request/lookup/hla-locus',
    LOOKUP_HLA_EPITOPES:          '/api/v1/enter-hla-rbc-request/lookup/hla-epitopes',
    LOOKUP_HLA_EPITOPES_BY_LOCUS: '/api/v1/enter-hla-rbc-request/lookup/hla-epitopes-by-locus',
    LOOKUP_RBC_TESTS:             '/api/v1/enter-hla-rbc-request/lookup/rbc-tests',
    LOOKUP_HOSPITALS:             '/api/v1/enter-hla-rbc-request/lookup/hospitals',
    LOOKUP_PHYSICIANS:            '/api/v1/enter-hla-rbc-request/lookup/physicians',
    LOOKUP_PRODUCTS:              '/api/v1/enter-hla-rbc-request/lookup/products',
    LOOKUP_PRIORITIES:            '/api/v1/enter-hla-rbc-request/lookup/priorities',
    LOOKUP_ATTRIBUTE_GROUPS:      '/api/v1/enter-hla-rbc-request/lookup/attribute-groups',
    LOOKUP_ATTRIBUTE_CODES:       '/api/v1/enter-hla-rbc-request/lookup/attribute-codes',
    PATIENT_DETAIL:   (patId: string) => `/api/v1/enter-hla-rbc-request/patient/${encodeURIComponent(patId)}`,
    PATIENT_REQUESTS: (patId: string) => `/api/v1/enter-hla-rbc-request/patient/${encodeURIComponent(patId)}/requests`,
    REQUEST_DETAIL:   (requestId: string) => `/api/v1/enter-hla-rbc-request/request/${encodeURIComponent(requestId)}`,
    SAVE:             '/api/v1/enter-hla-rbc-request/save',
  },
  HLA_RBC_REQUEST_QUERY: {
    BASE: '/api/v1/hla-rbc-request-query',
    GET_LIST: '/api/v1/hla-rbc-request-query',
    GET_DETAILS: (requestId: string) => `/api/v1/hla-rbc-request-query/${encodeURIComponent(requestId)}`,
    GET_DONORS: (requestId: string) => `/api/v1/hla-rbc-request-query/${encodeURIComponent(requestId)}/donors`,
    GET_UNITS: (requestId: string) => `/api/v1/hla-rbc-request-query/${encodeURIComponent(requestId)}/units`,
    CLOSE_REQUEST: (requestId: string) => `/api/v1/hla-rbc-request-query/${encodeURIComponent(requestId)}/close`,
    PRINT_DONORS: (requestId: string) => `/api/v1/hla-rbc-request-query/${encodeURIComponent(requestId)}/print-donors`,
    PRINT_UNITS: (requestId: string) => `/api/v1/hla-rbc-request-query/${encodeURIComponent(requestId)}/print-units`,
    CREATE_CALL_LIST: (requestId: string) => `/api/v1/hla-rbc-request-query/${encodeURIComponent(requestId)}/create-call-list`,
  },
  SPECIAL_UNITS: {
    // 1. GET ALL - Main Grid with Search/Filter/Pagination
    GET_ALL: (take: number, skip: number) =>
      `/api/v1/special-units/${take}/${skip}`,

    // 2. GET LINKED UNITS - Units linked to a Patient+Surgery
    GET_LINKED_UNITS: (patId: string, surgId: string) =>
      `/api/v1/special-units/linked-units/${encodeURIComponent(patId)}/${encodeURIComponent(surgId)}`,

    // 3. DONOR LOV - List Directed Donors for Dropdown
    GET_DONORS: (patId: string, surgId: string) =>
      `/api/v1/special-units/donors/${encodeURIComponent(patId)}/${encodeURIComponent(surgId)}`,

    // 4. DONOR DETAIL - Get Donor Phone/Product Types on Selection
    GET_DONOR_DETAIL: (patId: string, surgId: string, seqNo: number) =>
      `/api/v1/special-units/donors/${encodeURIComponent(patId)}/${encodeURIComponent(surgId)}/${seqNo}`,

    // 5. VALIDATE UNIT - Scan/Enter Unit ID
    VALIDATE_UNIT: '/api/v1/special-units/validate-unit',

    // 5b. VALIDATE SCAN UNIT - Combined registration check + demographics + business validations
    VALIDATE_SCAN_UNIT: '/api/v1/special-units/validate-scan-unit',

    // 6. DONOR DEMOGRAPHICS - Auto-populate after Unit Scan
    GET_DONOR_DEMOGRAPHICS: (unitId: string, collDate: string) =>
      `/api/v1/special-units/donor-demographics/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,

    // 7. LINK UNIT - Link a Unit to Special Donation
    LINK_UNIT: '/api/v1/special-units/link',

    // 8. UNLINK UNIT - Remove a Unit Link
    UNLINK_UNIT: (patId: string, surgId: string, seqNo: number, unitId: string, collDate: string) =>
      `/api/v1/special-units/unlink/${encodeURIComponent(patId)}/${encodeURIComponent(surgId)}/${seqNo}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,

    // Future Scope Endpoints
    CREATE_DONOR: '/api/v1/special-units/donors',
    UPDATE_DONOR: '/api/v1/special-units/donors',
    DELETE_DONOR: (patId: string, surgId: string, seqNo: number) =>
      `/api/v1/special-units/donors/${encodeURIComponent(patId)}/${encodeURIComponent(surgId)}/${seqNo}`,

    LOOKUPS: {
      AREA_CODES: '/api/v1/special-units/lookups/area-codes',
      PRODUCT_TYPES: '/api/v1/special-units/lookups/product-types',
    },
  },

  SPECIAL_DONATION_REQUEST: {
    SEARCH: '/api/v1/special-donation-request/search',
    GET_DETAIL: (patId: string) => `/api/v1/special-donation-request/patient/${encodeURIComponent(patId)}`,
    CREATE_PATIENT: '/api/v1/special-donation-request/patient',
    UPDATE_PATIENT: (patId: string) => `/api/v1/special-donation-request/patient/${encodeURIComponent(patId)}`,
    CREATE_SURGERY: '/api/v1/special-donation-request/surgery',
    UPDATE_SURGERY: (surgId: string) => `/api/v1/special-donation-request/surgery/${encodeURIComponent(surgId)}`,
    ADD_DONOR: '/api/v1/special-donation-request/donor',
    DELETE_DONOR: (surgId: string, seqNo: number) => `/api/v1/special-donation-request/donor/${encodeURIComponent(surgId)}/${seqNo}`,
    LOOKUP_HOSPITALS: '/api/v1/special-donation-request/lookup/hospitals',
    LOOKUP_CONSIGNEES: '/api/v1/special-donation-request/lookup/consignees',
    LOOKUP_SURGERY_TYPES: '/api/v1/special-donation-request/lookup/surgery-types',
    LOOKUP_PATIENT_TYPES: '/api/v1/special-donation-request/lookup/patient-types',
    LOOKUP_PRODUCT_TYPES: '/api/v1/special-donation-request/lookup/product-types',
    LOOKUP_PATIENT_STATUSES: '/api/v1/special-donation-request/lookup/patient-statuses',
    LOOKUP_ABO_TYPES: '/api/v1/special-donation-request/lookup/abo-types',
    GENERATE_PAT_ID: '/api/v1/special-donation-request/generate-id/patient',
    GENERATE_SURG_ID: '/api/v1/special-donation-request/generate-id/surgery',
    PATIENT_WITH_SURGERY: '/api/v1/special-donation-request/patient-with-surgery',
  },

  MODIFY_CHECK_IN_BATCH: {
    LIST: (take: number, skip: number) => `/api/v1/modify-check-in-batch/${take}/${skip}`,
    GET_BY_ID: (batchId: string) => `/api/v1/modify-check-in-batch/${encodeURIComponent(batchId)}`,
    UPDATE: (batchId: string) => `/api/v1/check-in-batch-data/${encodeURIComponent(batchId)}`,
    DROPDOWN_OPTIONS: '/api/v1/modify-check-in-batch/dropdown-options',
    COMMENTS: {
      LIST: (batchId: string) => `/api/v1/check-in-batch-data/${encodeURIComponent(batchId)}/comments`,
      CREATE: (batchId: string) => `/api/v1/check-in-batch-data/${encodeURIComponent(batchId)}/comments`,
      UPDATE: (batchId: string, auditKey: string) =>
        `/api/v1/check-in-batch-data/${encodeURIComponent(batchId)}/comments/${encodeURIComponent(auditKey)}`,
      DELETE: (batchId: string, auditKey: string) =>
        `/api/v1/check-in-batch-data/${encodeURIComponent(batchId)}/comments/${encodeURIComponent(auditKey)}`,
    },
  },

  TEST_VOID_BY_UNIT_ID: {
    VERIFY_UNIT: '/api/v1/test-void-by-unit-id/verify-unit',
    GET_LIST: (take: number, skip: number): string =>
      `/api/v1/test-void-by-unit-id/list/${take}/${skip}`,
    VOIDED_UNITS: '/api/v1/test-void-by-unit-id/voided-units',
  },

  VOIDED_TESTS_BATCH_QUERY: {
    BATCH_IDS: '/api/v1/voided-tests-batch-query/batch-ids',
    TEST_IDS: (tbId: string) => `/api/v1/voided-tests-batch-query/${encodeURIComponent(tbId)}/test-ids`,
    SEARCH: '/api/v1/voided-tests-batch-query/search',
  },

  HOLDING_TESTS_QUERY: {
    SEARCH: '/api/v1/holding-tests-query',
    TEST_IDS: '/api/v1/holding-tests-query/dropdowns/test-ids',
    BATCH_IDS: '/api/v1/holding-tests-query/dropdowns/batch-ids',
    INTERDICTIONS: '/api/v1/holding-tests-query/interdictions',
    CHECK_MENU_ACCESS: '/api/v1/holding-tests-query/check-menu-access',
    FILTER_VALUES: '/api/v1/holding-tests-query/filter-values',
  },

  VOID_TEST_BATCH: {
    GET_TEST_BATCHES: '/api/v1/void-test-batch/test-batches',
    GET_TESTS: (tbId: string) => `/api/v1/void-test-batch/tests/${encodeURIComponent(tbId)}`,
    GET_UNITS: (tbId: string, testId: string) =>
      `/api/v1/void-test-batch/units/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}`,
    GET_VOID_REASON_CODES: '/api/v1/void-test-batch/void-reason-codes',
    GET_TECH_MODE: '/api/v1/void-test-batch/tech-mode',
    VOID_BATCH: '/api/v1/void-test-batch/void',
  },

  VOID_CANCEL_TEST_RESULTS: {
    GET_ACTIONS: '/api/v1/void-cancel-test-results/actions',
    GET_TESTS: '/api/v1/void-cancel-test-results/tests',
    GET_TEST_GROUPS: '/api/v1/void-cancel-test-results/test-groups',
    GET_VOID_REASON_CODES: '/api/v1/void-test-batch/void-reason-codes',
    GET_TEST_RESULTS: (unitId: string, testId: string) =>
      `/api/v1/void-cancel-test-results/unit/${encodeURIComponent(unitId)}/test/${encodeURIComponent(testId)}`,
    GET_TEST_RESULTS_BY_UNIT: (unitId: string) =>
      `/api/v1/void-cancel-test-results/unit/${encodeURIComponent(unitId)}/tests`,
    GET_TEST_RESULT_DETAILS: (unitId: string) =>
      `/api/v1/void-cancel-test-results/unit/${encodeURIComponent(unitId)}/details`,
    VOID: '/api/v1/void-cancel-test-results/void',
    CANCEL: '/api/v1/void-cancel-test-results/cancel',
  },

  TEST_BATCH_PARM: {
    GET_PENDING_BATCHES: '/api/v1/lab/test-batch-parms/batches',
    GET_BATCH_TESTS: (tbId: string) => `/api/v1/lab/test-batch-parms/batches/${encodeURIComponent(tbId)}/tests`,
    GET_TEST_RUNS: '/api/v1/lab/test-batch-parms/runs',
    GET_TEST_KITS: '/api/v1/lab/test-batch-parms/test-kits',
    GET_PARM_VALUES_LOV: '/api/v1/lab/test-batch-parms/parameter-values',
    GET_BATCH_DETAIL: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}`,
    GET_PARAMETERS: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/parameters`,
    GET_REAGENTS: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/reagents`,
    GET_HOLDING_TESTS: (tbId: string, testId: string, take: number, skip: number) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/results/${take}/${skip}`,
    VERIFY_PARAMETERS: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/verify`,
    SAVE_PARAMETERS: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/save`,
    CONFIRM_BATCH: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/confirm`,
    LOCK: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/lock`,
    UNLOCK: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/unlock`,
    VALIDATE: (tbId: string, testId: string) =>
      `/api/v1/lab/test-batch-parms/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/validate`,
  },

  MODIFY_CONTRACT_BATCH: {
    BASE: '/api/v1/modify-contract-batch',
    CONTRACTS: '/api/v1/modify-contract-batch/contracts',
    RECEIVED_DATES: '/api/v1/modify-contract-batch/received-dates',
    BATCHES: '/api/v1/modify-contract-batch/batches',
    PROFILE_SETS: '/api/v1/modify-contract-batch/profile-sets',
    CONTRACT_TESTS: '/api/v1/modify-contract-batch/contract-tests',
    QUERY: '/api/v1/modify-contract-batch/query',
    VALIDATE: '/api/v1/modify-contract-batch/validate',
    MODIFY: '/api/v1/modify-contract-batch/modify',
  },

  CHECK_IN_BATCH_DATA: {
    LIST: (take: number, skip: number) => `/api/v1/check-in-batch-data/list/${take}/${skip}`,
    PRODUCT_TYPES: '/api/v1/check-in-batch-data/product-types',
    PRODUCT_TYPE_FILTERS: '/api/v1/check-in-batch-data/product-type-filters',
    CHECKIN_USERS: '/api/v1/check-in-batch-data/checkin-users',
  },

  SPECIAL_DONATION_STATUS: {
    QUERY: '/api/v1/special-donation-status/query',
    GET_UNIT_DETAILS: (unitId: string) => `/api/v1/special-donation-status/${encodeURIComponent(unitId)}`,
    LOOKUPS: {
      SHIP_LOCATIONS: '/api/v1/special-donation-status/lookups/ship-locations',
      PATIENTS: '/api/v1/special-donation-status/lookups/patients',
      UNIT_IDS: '/api/v1/special-donation-status/lookups/unit-ids',
      SURG_IDS: '/api/v1/special-donation-status/lookups/surg-ids',
    },
  },

  PRINT_SPECIAL_INSTRUCTIONS: {
    DONORS: '/api/v1/donors/print-special-inst-tie-tag/dropdown-values',
    TIE_TAGS: (donorId: string) =>
      `/api/v1/donors/print-special-inst-tie-tag/${encodeURIComponent(donorId)}`,
    PRINT_INSTRUCTIONS: '/api/v1/donors/print-special-inst-tie-tag/view-print-instructions',
    PRINTERS: '/api/v1/donors/print-special-inst-tie-tag/printers',
    PRINT: '/api/v1/donors/print-special-inst-tie-tag/print',
  },

  PRINT_AUTO_DIRECTED_TIE_TAG: {
    PATIENTS: '/api/v1/print-auto-directed-tie-tag/patients',
    SEARCH: '/api/v1/print-auto-directed-tie-tag/search',
    DETAILS: '/api/v1/print-auto-directed-tie-tag/details',
    DONATIONS: '/api/v1/print-auto-directed-tie-tag/donations',
    PATIENT_TYPES: '/api/v1/print-auto-directed-tie-tag/patient-types',
    ATTRIBUTES: '/api/v1/print-auto-directed-tie-tag/attributes',
    PRINTERS: '/api/v1/print-auto-directed-tie-tag/printers',
    IRRADIATION_PROMPT: '/api/v1/print-auto-directed-tie-tag/irradiation-prompt',
    VALIDATE_PRINT: '/api/v1/print-auto-directed-tie-tag/validate-print',
    PRINT: '/api/v1/print-auto-directed-tie-tag/print',
  },
  
  PRODUCT_CONVERSIONS: {
    LIST: (take: number, skip: number) => `/api/v1/product-conversions/${take}/${skip}`,
    GET_BY_ID: (sourceProductCode: string, targetProductCode: string) =>
      `/api/v1/product-conversions/${encodeURIComponent(sourceProductCode)}/${encodeURIComponent(targetProductCode)}`,
    CREATE: '/api/v1/product-conversions',
    UPDATE: (sourceProductCode: string, targetProductCode: string) =>
      `/api/v1/product-conversions/${encodeURIComponent(sourceProductCode)}/${encodeURIComponent(targetProductCode)}`,
    SOURCE_PRODUCTS: '/api/v1/product-conversions/source-products',
    TARGET_PRODUCTS: (sourceProductCode: string) =>
      `/api/v1/product-conversions/target-products/${encodeURIComponent(sourceProductCode)}`,
  },

  // PROCESS_STAGES: {
  //   LIST: (take: number, skip: number) => `/api/v1/process-stages/${take}/${skip}`,
  //   GET_BY_ID: (processCode: string, stageCode: string) =>
  //     `/api/v1/process-stages/${encodeURIComponent(processCode)}/${encodeURIComponent(stageCode)}`,
  //   PROCESS_CODES: '/api/v1/process-stages/process-codes/dropdown',
  //   STAGE_CODES: '/api/v1/process-stages/stage-codes/dropdown',
  //   CREATE: '/api/v1/process-stages',
  //   UPDATE: (processCode: string, stageCode: string) =>
  //     `/api/v1/process-stages/${encodeURIComponent(processCode)}/${encodeURIComponent(stageCode)}`,
  //   DELETE: (processCode: string, stageCode: string) =>
  //     `/api/v1/process-stages/${encodeURIComponent(processCode)}/${encodeURIComponent(stageCode)}`,
  // },

  PRODUCT_TYPES: {
    LIST: (take: number, skip: number) => `/api/v1/lab/product-types/${take}/${skip}`,
    GET_BY_ID: (productTypeCode: string) => `/api/v1/lab/product-types/${encodeURIComponent(productTypeCode)}`,
    CREATE: '/api/v1/lab/product-types',
    UPDATE: (productTypeCode: string) => `/api/v1/lab/product-types/${encodeURIComponent(productTypeCode)}`,
    DELETE: (productTypeCode: string) => `/api/v1/lab/product-types/${encodeURIComponent(productTypeCode)}`,
    PRODUCT_CLASSES_DROPDOWN: '/api/v1/lab/product-types/product-classes',
    FILTER_OPTIONS: '/api/v1/lab/product-types/filter-options',
    PRODUCT_TYPES_DROPDOWN: '/api/v1/lab/product-types/dropdown',
    PRODUCT_TYPES_LOV: '/api/v1/lab/product-types/lov',
  },

  // Report Submission endpoints
  REPORTS: {
    REPORT_NAMES: '/api/v1/system-admin/report-names',

    // Get distinct report types
    REPORT_TYPES: '/api/v1/reports/report-types',

    // Generate PARM_ID
    GENERATE_PARM_ID: '/api/v1/reports/generate-parm-id',

    // Get report information
    REPORT_INFO: (reportName: string) =>
      `/api/v1/reports/report-info/${encodeURIComponent(reportName)}`,

    // Get parameter definitions (includes LOV items pre-loaded)
    PARM_DEFINITIONS: (reportName: string) =>
      `/api/v1/reports/parm-definitions/${encodeURIComponent(reportName)}`,

    // Get LOV items for a parameter (for search/autocomplete)
    PARM_LOV: (parmCode: string) =>
      `/api/v1/reports/parameters/${encodeURIComponent(parmCode)}/lov`,

    // Validate parameter value
    VALIDATE_PARAMETER: (parmCode: string) =>
      `/api/v1/reports/parameters/${encodeURIComponent(parmCode)}/validate`,

    // Get recent parameter sets
    RECENT_PARM_IDS: (reportName: string) =>
      `/api/v1/reports/recent-parm-ids/${encodeURIComponent(reportName)}`,

    // Get parameter values
    PARM_VALUES: (reportName: string, parmId: string) =>
      `/api/v1/reports/parm-values/${encodeURIComponent(reportName)}/${encodeURIComponent(parmId)}`,

    // Get available printers
    PRINTERS: '/api/v1/reports/printers',

    // Get form types
    FORM_TYPES: '/api/v1/reports/form-types',

    // Submit report
    SUBMIT: '/api/v1/reports/submit',

    // Delete parameter set
    DELETE_PARM: (reportName: string, parmId: string) =>
      `/api/v1/reports/parm/${encodeURIComponent(reportName)}/${encodeURIComponent(parmId)}`,

    // Get report status
    REPORT_STATUS: (reportName: string, parmId: string) =>
      `/api/v1/reports/report-status/${encodeURIComponent(reportName)}/${encodeURIComponent(parmId)}`,
  },
  NEW_ZIP_CODE: {
    STATES: '/api/v1/valid-city-state/states',
    COUNTIES: (state: string) => `/api/v1/valid-city-state/counties?state=${encodeURIComponent(state)}`,
    CITIES: (state: string) => `/api/v1/valid-city-state/cities?state=${encodeURIComponent(state)}`,
    CREATE: '/api/v1/valid-city-state',
    UPDATE: (uspsId: number) => `/api/v1/valid-city-state/${uspsId}`,
  },

  DONATION_NOTES: {
    NOTES_BY_UNIT: (unitId: string, collDate: string) =>
      `/api/v1/donation-notes/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/notes`,
    ACCESS_BY_UNIT: (unitId: string, collDate: string) =>
      `/api/v1/donation-notes/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/access`,
    UPDATE_NOTE_BY_UNIT: (unitId: string, collDate: string, auditKey: number) =>
      `/api/v1/donation-notes/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/notes/${auditKey}`,
    DELETE_NOTE_BY_UNIT: (unitId: string, collDate: string, auditKey: number) =>
      `/api/v1/donation-notes/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/notes/${auditKey}`,
    NOTES_BY_TRANSACTION: (transactionId: string) =>
      `/api/v1/donation-notes/transaction/${encodeURIComponent(transactionId)}/notes`,
    ACCESS_BY_TRANSACTION: (transactionId: string) =>
      `/api/v1/donation-notes/transaction/${encodeURIComponent(transactionId)}/access`,
  },

  COMMUNICATION_LETTERS: {
    LIST: (take: number, skip: number) => `/api/v1/communication-letters/${take}/${skip}`,
    LOOKUP: '/api/v1/communication-letters/lookup',
    CONTENT: (letterId: string) => `/api/v1/communication-letters/${encodeURIComponent(letterId)}/content`,
    HISTORY: (letterCode: string) => `/api/v1/communication-letters/history/${encodeURIComponent(letterCode)}`,
    CREATE: '/api/v1/communication-letters',
    REVISE: (letterId: string) => `/api/v1/communication-letters/${encodeURIComponent(letterId)}/revise`,
    PREVIEW: (letterId: string) => `/api/v1/communication-letters/${encodeURIComponent(letterId)}/preview`,
  },
  // Donor Communications (DCWDCOMM)
  DONOR_COMMUNICATIONS: {
    BASE: '/api/v1/donor-communication',
    QUERY: '/api/v1/donor-communication-query',
  },

// Spike Component (SPIKE / FRISPIKE)
  SPIKE_COMPONENT: {
    CREATE: '/api/v1/lab/spike-component',
    VALIDATE_UNIT: '/api/v1/lab/spike-component/validate-unit',
    PRODUCTS: '/api/v1/lab/spike-component/products',
    PROCESS_CODES: '/api/v1/lab/spike-component/process-codes',
    SPIKING_TYPES: '/api/v1/lab/spike-component/spiking-types',
    BAG_LOTS: '/api/v1/lab/spike-component/bag-lots',
    FILTER_LOTS: '/api/v1/lab/spike-component/filter-lots',
    UNIT_COLLECTION_DATES: '/api/v1/lab/spike-component/unit-collection-dates',
  },

// Routine Separation Times (CPISEP)
  ROUTINE_SEPARATION_TIMES: {
    CENTRIFUGES: '/api/v1/separation-times/centrifuges',
    RECORD_SEPARATION: '/api/v1/separation-times/record-separation',
  },

  // Freeze Start Times Offline (CPIFRZM)
  FREEZE_START_TIMES: {
    BASE: '/api/v1/freeze-start-times',
    RECORD: '/api/v1/freeze-start-times',
    ELIGIBLE_COMPONENTS: (unitId: string) => `/api/v1/freeze-start-times/eligible-components/${encodeURIComponent(unitId)}`,
    UNIT_INFO: (unitId: string) => `/api/v1/freeze-start-times/unit-info/${encodeURIComponent(unitId)}`,
  },

// Modify Separation Times (MODSEP / CPISEPDA)
  SEPARATION_TIMES: {
    VALIDATE_UNIT: '/api/v1/modify-separation-times/validate-unit',
    COLLECTION_DATES: '/api/v1/modify-separation-times/collection-dates',
    GET: '/api/v1/modify-separation-times',
    SAVE: '/api/v1/modify-separation-times',
    CENTRIFUGES: '/api/v1/modify-separation-times/centrifuges',
  },

  // Separation Times Offline (OFFNSEP)
  SEPARATION_TIMES_OFFLINE: {
    BASE: '/api/v1/separation-times-offline',
    VALIDATE_UNIT: '/validate-unit',
    CENTRIFUGES: '/centrifuges',
    RECORD_FIRST: '/first-separation',
    RECORD_SECOND: '/second-separation',
  },

  STORAGE_DEVICE: {
    LIST: (take: number, skip: number) => `/api/v1/storage-device/${take}/${skip}`,
    CREATE: '/api/v1/storage-device',
    UPDATE: '/api/v1/storage-device',
    WAREHOUSE_LOV: '/api/v1/storage-device/warehouse-lov',
    DEVICE_TYPE_LOV: '/api/v1/storage-device/device-type-lov',
    DEVICE_STATUS_LOV: '/api/v1/storage-device/device-status-lov',
    FILTER_DEVICE_TYPES: (warehouseId: string) =>
      `/api/v1/storage-device/filter/device-types?warehouseId=${encodeURIComponent(warehouseId)}`,
    FILTER_STATUS_CODES: (warehouseId: string) =>
      `/api/v1/storage-device/filter/status-codes?warehouseId=${encodeURIComponent(warehouseId)}`,
  },

  EDIT_SPIKING_DETAILS: {
    GET: '/api/v1/edit-spiking-details',
    UPDATE: '/api/v1/edit-spiking-details',
    PROCESS_CODES: '/api/v1/edit-spiking-details/process-codes',
    SPIKING_TYPES: '/api/v1/edit-spiking-details/spiking-types',
    BAG_LOT_NUMBERS: '/api/v1/edit-spiking-details/bag-lot-numbers',
    FILTER_LOT_NUMBERS: '/api/v1/edit-spiking-details/filter-lot-numbers',
    PRODUCT_CODES: '/api/v1/edit-spiking-details/product-codes',
    COMPONENT_PREFIXES: '/api/v1/edit-spiking-details/component-prefixes',
    UNIT_COLLECTION_DATES: '/api/v1/edit-spiking-details/unit-collection-dates',
  },

  RACK_DEFINITION: {
    GET_PAGINATED: (take: number, skip: number) => `/api/v1/rack-definition/${take}/${skip}`,
    CREATE: '/api/v1/rack-definition',
    UPDATE: '/api/v1/rack-definition',
    WAREHOUSE_LOV: '/api/v1/rack-definition/warehouse-lov',
    DEVICE_TYPE_LOV: '/api/v1/rack-definition/device-type-lov',
    DEVICE_NUMBER_LOV: (warehouseId: string, deviceType: string) =>
      `/api/v1/rack-definition/device-number-lov?warehouseId=${encodeURIComponent(warehouseId)}&deviceType=${encodeURIComponent(deviceType)}`,
    STORAGE_TYPE_LOV: '/api/v1/rack-definition/storage-type-lov',
    PRODUCT_TYPE_LOV: '/api/v1/rack-definition/product-type-lov',
    ABORH_LOV: '/api/v1/rack-definition/aborh-lov',
    FILTER_RACK_NUMBERS: (wId: string, dType: string, dNum: string, sClass: string) =>
      `/api/v1/rack-definition/filter/rack-numbers?warehouseId=${encodeURIComponent(wId)}&deviceType=${encodeURIComponent(dType)}&deviceNumber=${encodeURIComponent(dNum)}&storageClass=${encodeURIComponent(sClass)}`,
    FILTER_PRODUCT_TYPES: (wId: string, dType: string, dNum: string, sClass: string) =>
      `/api/v1/rack-definition/filter/product-types?warehouseId=${encodeURIComponent(wId)}&deviceType=${encodeURIComponent(dType)}&deviceNumber=${encodeURIComponent(dNum)}&storageClass=${encodeURIComponent(sClass)}`,
  },

  CUSTOMER_DEBIT_CREDIT_QUERY: {
    BASE: '/api/v1/customer-debit-credit-query',
    GET_PAGINATED: (take: number, skip: number) => `/api/v1/customer-debit-credit-query/${take}/${skip}`,
    GET_BY_ID: (adviceId: string) => `/api/v1/customer-debit-credit-query/${encodeURIComponent(adviceId)}`,
    CUSTOMER_LOV: '/api/v1/customer-debit-credit-query/customer-lov',
    CUSTOMER_LOV_SEARCH: (searchTerm: string) => `/api/v1/customer-debit-credit-query/customer-lov?searchTerm=${encodeURIComponent(searchTerm)}`,
    ORDER_NO_LOV: (customerId: string) => `/api/v1/customer-debit-credit-query/order-no-lov?customerId=${encodeURIComponent(customerId)}`,
    ADVICE_ID_LOV: (customerId: string) => `/api/v1/customer-debit-credit-query/advice-id-lov?customerId=${encodeURIComponent(customerId)}`,
    ADVICE_ID_BY_ORDER_LOV: (customerId: string, orderNo: string) => `/api/v1/customer-debit-credit-query/advice-id-lov?customerId=${encodeURIComponent(customerId)}&orderNo=${encodeURIComponent(orderNo)}`,
  },

  ORDER_SERVICES_DEBIT_CREDIT: {
    CREATE: '/api/v1/order-services-debit-credit',
    GET_NOTE: (adviceId: string) => `/api/v1/order-services-debit-credit/${encodeURIComponent(adviceId)}/note`,
    ADD_NOTE: (adviceId: string) => `/api/v1/order-services-debit-credit/${encodeURIComponent(adviceId)}/note`,
    CUSTOMER_LOV: (searchTerm?: string | null) => {
      let url = '/api/v1/order-services-debit-credit/customer-lov';
      if (searchTerm) url += `?searchTerm=${encodeURIComponent(searchTerm)}`;
      return url;
    },
    ORDER_NO_LOV: (customerId: string, tranType: string, patientName?: string | null) => {
      let url = `/api/v1/order-services-debit-credit/order-no-lov?customerId=${encodeURIComponent(customerId)}&tranType=${encodeURIComponent(tranType)}`;
      if (patientName) url += `&patientName=${encodeURIComponent(patientName)}`;
      return url;
    },
    SERVICE_CODE_LOV: (tranType?: string | null, orderNo?: string | null) => {
      let url = '/api/v1/order-services-debit-credit/service-code-lov';
      const params: string[] = [];
      if (tranType) params.push(`tranType=${encodeURIComponent(tranType)}`);
      if (orderNo) params.push(`orderNo=${encodeURIComponent(orderNo)}`);
      if (params.length) url += `?${params.join('&')}`;
      return url;
    },
    REASON_CODE_LOV: (tranType: string) => `/api/v1/order-services-debit-credit/reason-code-lov?tranType=${encodeURIComponent(tranType)}`,
    PATIENT_LOV: (customerId: string, tranType: string, searchTerm?: string | null) => {
      let url = `/api/v1/order-services-debit-credit/patient-lov?customerId=${encodeURIComponent(customerId)}&tranType=${encodeURIComponent(tranType)}`;
      if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
      return url;
    },
    REQUESTED_BY_LOV: (customerId: string) => `/api/v1/order-services-debit-credit/requested-by-lov?customerId=${encodeURIComponent(customerId)}`,
  },

  ENTER_CUSTOMER_TIER_PRICING: {
    DROPDOWN_VALUES: '/api/v1/enter-customer-tier-pricing/dropdown-values',
    GET: (customerId: string, productType: string) =>
      `/api/v1/enter-customer-tier-pricing/${encodeURIComponent(customerId)}/${encodeURIComponent(productType)}`,
    CREATE: '/api/v1/enter-customer-tier-pricing',
    UPDATE: (customerId: string, productType: string, tier: number) =>
      `/api/v1/enter-customer-tier-pricing/${encodeURIComponent(customerId)}/${encodeURIComponent(productType)}/${tier}`,
    SEARCH: (customerId: string, productType: string) =>
      `/api/v1/enter-customer-tier-pricing/${encodeURIComponent(customerId)}/${encodeURIComponent(productType)}`,
    DELETE: (customerId: string, productType: string, tier: number) =>
      `/api/v1/enter-customer-tier-pricing/${encodeURIComponent(customerId)}/${encodeURIComponent(productType)}/${tier}`,
  },

  CUSTOMER_CONSIGNEE_PRODUCT: {
    LIST: (take: number, skip: number) => `/api/v1/customer-consignee-products/${take}/${skip}`,
    GET_BY_ID: (customerId: string) =>
      `/api/v1/customer-consignee-products/${encodeURIComponent(customerId)}`,
    CREATE: '/api/v1/customer-consignee-products',
    UPDATE: (customerId: string) =>
      `/api/v1/customer-consignee-products/${encodeURIComponent(customerId)}`,
    LOOKUP_CUSTOMERS: '/api/v1/customer-consignee-products/lookup/customers',
    LOOKUP_CONSIGNEES: (customerId: string) =>
      `/api/v1/customer-consignee-products/lookup/consignees/${encodeURIComponent(customerId)}`,
    LOOKUP_PRODUCT_TYPES: '/api/v1/customer-consignee-products/lookup/product-types',
    LOOKUP_PRODUCT_CODES: '/api/v1/customer-consignee-products/lookup/product-codes',
  },

  CANCEL_DEBIT_CREDIT_ADVICE: {
    BASE: '/api/v1/cancel-debit-credit-advice',
    GET_BY_ID: (adviceId: string) =>
      `/api/v1/cancel-debit-credit-advice/${encodeURIComponent(adviceId)}`,
    CANCEL: '/api/v1/cancel-debit-credit-advice/cancel',
  },

  // Customer Contract Details (VSCNTRCT) endpoints
  // TODO: Backend API implementation required - see customer-contract-api.service.ts
  CUSTOMER_CONTRACT: {
    LIST: (customerId: string, take: number, skip: number) =>
      `/api/v1/customer-contracts/${encodeURIComponent(customerId)}/${take}/${skip}`,
    GET_BY_ID: (customerId: string, contractId: string) =>
      `/api/v1/customer-contracts/${encodeURIComponent(customerId)}/${encodeURIComponent(contractId)}`,
    CREATE: (customerId: string) =>
      `/api/v1/customer-contracts/${encodeURIComponent(customerId)}`,
    UPDATE: (customerId: string, contractId: string) =>
      `/api/v1/customer-contracts/${encodeURIComponent(customerId)}/${encodeURIComponent(contractId)}`,
    DELETE: (customerId: string, contractId: string) =>
      `/api/v1/customer-contracts/${encodeURIComponent(customerId)}/${encodeURIComponent(contractId)}`,
  },

  PAYEE_CUSTOMER: {
    LIST: (take: number, skip: number) =>
      `/api/v1/payee-customer/${take}/${skip}`,
    GET_BY_ID: (id: string) =>
      `/api/v1/payee-customer/${encodeURIComponent(id)}`,
    CREATE: '/api/v1/payee-customer',
    UPDATE: (id: string) =>
      `/api/v1/payee-customer/${encodeURIComponent(id)}`,
    DELETE: (id: string) =>
      `/api/v1/payee-customer/${encodeURIComponent(id)}`,
  },

  // Customer Contact Details (VSCNTACT) endpoints
  CUSTOMER_CONTACT: {
    LIST: (customerId: string, includeTerminated = false) =>
      `/api/v1/customer-contact-names/${encodeURIComponent(customerId)}?includeTerminated=${includeTerminated}`,
    CONTACT_TYPES: '/api/v1/customer-contact-names/contact-types',
    CREATE: '/api/v1/customer-contact-names',
    UPDATE: (customerId: string, contactType: string) =>
      `/api/v1/customer-contact-names/${encodeURIComponent(customerId)}/${encodeURIComponent(contactType)}`,
  },

  CUSTOMER_PROFILE: {
    LIST: (take: number, skip: number) =>
      `/api/v1/customer-profile/${take}/${skip}`,
    GET_BY_ID: (customerId: string) =>
      `/api/v1/customer-profile/${encodeURIComponent(customerId)}`,
    CREATE: '/api/v1/customer-profile',
    UPDATE: (customerId: string) =>
      `/api/v1/customer-profile/${encodeURIComponent(customerId)}`,
    GENERATE_ID: (customerType: string) =>
      `/api/v1/customer-profile/generate-id/${encodeURIComponent(customerType)}`,
    CUSTOMER_TYPES: '/api/v1/customer-profile/dropdowns/customer-types',
    STATES: '/api/v1/customer-profile/dropdowns/states',
    PAYEES: '/api/v1/customer-profile/dropdowns/payees',
    PLASMA_TYPES: '/api/v1/customer-profile/dropdowns/plasma-file-types',
    CONSIGNEES: (customerId: string) =>
      `/api/v1/customer-profile/${encodeURIComponent(customerId)}/consignees`,
    CONTRACTS: (customerId: string) =>
      `/api/v1/customer-profile/${encodeURIComponent(customerId)}/contracts`,
    CONTACTS: (customerId: string) =>
      `/api/v1/customer-profile/${encodeURIComponent(customerId)}/contacts`,
    ZONES: '/api/v1/customer-profile/dropdowns/zones',
    CONTACT_TYPES: '/api/v1/customer-profile/dropdowns/contact-types',
  },

  PRODUCT_STORAGE_DEFINITION: {
    LIST: (take: number, skip: number) => `/api/v1/product-storage/${take}/${skip}`,
    CREATE: '/api/v1/product-storage',
    UPDATE: (productType: string, warehouseId: string, deviceType: string, deviceNumber: string) =>
      `/api/v1/product-storage/${encodeURIComponent(productType)}/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceType)}/${encodeURIComponent(deviceNumber)}`,
    DELETE: (productType: string, warehouseId: string, deviceType: string, deviceNumber: string) =>
      `/api/v1/product-storage/${encodeURIComponent(productType)}/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceType)}/${encodeURIComponent(deviceNumber)}`,
    PRODUCT_TYPE_LOV: '/api/v1/product-storage/dropdowns/product-types',
    WAREHOUSE_LOV: '/api/v1/product-storage/dropdowns/warehouses',
    DEVICE_TYPE_LOV: '/api/v1/product-storage/dropdowns/device-types',
    DEVICE_NUMBERS_LOV: '/api/v1/product-storage/dropdowns/device-numbers',
  },

  // Offline Product Shipment endpoints (SHIPO - Mnemonic)
  OFFLINE_PRODUCT_SHIPMENT: {
    BASE: '/api/v1/offline-product-shipment',
    GET_ALL: (take: number, skip: number) => `/api/v1/offline-product-shipment/${take}/${skip}`,
    GET_BY_ID: (shipmentNo: string, orderNo: string) =>
      `/api/v1/offline-product-shipment/${encodeURIComponent(shipmentNo)}/${encodeURIComponent(orderNo)}`,
    CREATE: '/api/v1/offline-product-shipment',
    UPDATE: (shipmentNo: string, orderNo: string) =>
      `/api/v1/offline-product-shipment/${encodeURIComponent(shipmentNo)}/${encodeURIComponent(orderNo)}`,
    DELETE: (shipmentNo: string, orderNo: string) =>
      `/api/v1/offline-product-shipment/${encodeURIComponent(shipmentNo)}/${encodeURIComponent(orderNo)}`,
    LOOKUP_SHIPMENTS: '/api/v1/offline-product-shipment/lookup/shipments',
    GET_HEADER: (shipmentNo: string) => `/api/v1/offline-product-shipment/header/${encodeURIComponent(shipmentNo)}`,
    CREATE_HEADER: '/api/v1/offline-product-shipment/header',
    LOOKUP_CONSIGNEES: '/api/v1/offline-product-shipment/lookup/consignees',
    GET_CONSIGNEE_DETAIL: (consigneeId: string) => `/api/v1/offline-product-shipment/lookup/consignee/${encodeURIComponent(consigneeId)}`,
    LOOKUP_CARRIERS: '/api/v1/offline-product-shipment/lookup/carriers',
    LOOKUP_CHARGE_CODES: '/api/v1/offline-product-shipment/lookup/charge-codes',
    GET_BOXES: (shipmentNo: string) => `/api/v1/offline-product-shipment/${encodeURIComponent(shipmentNo)}/boxes`,
    GET_PRODUCTS_IN_BOX: (shipmentNo: string) => `/api/v1/offline-product-shipment/box/${encodeURIComponent(shipmentNo)}/products`,
    GET_ZONE_CONSIGNEES: (consigneeId: string, zone: string) => `/api/v1/offline-product-shipment/consignee/${encodeURIComponent(consigneeId)}/same-zone?zone=${encodeURIComponent(zone)}`,
    LOOKUP_PRINTERS: '/api/v1/system-users/GetPrinterCodes',
    VALIDATE_BOX: '/api/v1/offline-product-shipment/box/validate',
    COMPLETE_BOX_ENTRY: (shipmentNo: string) => `/api/v1/offline-product-shipment/${encodeURIComponent(shipmentNo || 'new')}/complete`,
    DEFAULT_CHARGES: (shipmentNo: string) => `/api/v1/offline-product-shipment/${encodeURIComponent(shipmentNo)}/default-charges`,
    FINALIZE_SHIPMENT: (shipmentNo: string) => `/api/v1/offline-product-shipment/${encodeURIComponent(shipmentNo)}/finalize`,
  },

  // Standing Orders (STANDO) endpoints
  STANDING_ORDERS: {
    // Standing Order Header
    LIST: (take: number, skip: number) => `/api/v1/standing-orders/${take}/${skip}`,
    GET: (contractId: string, consigneeId: string, weekDay: string) =>
      `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}`,
    CREATE: '/api/v1/standing-orders',
    UPDATE: (contractId: string, consigneeId: string, weekDay: string) =>
      `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}`,
    DELETE: (contractId: string, consigneeId: string, weekDay: string) =>
      `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}`,

    // Standing Order Items
    ITEMS: {
      LIST: (contractId: string, consigneeId: string, weekDay: string, take: number, skip: number) =>
        `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}/items/${take}/${skip}`,
      GET: (contractId: string, consigneeId: string, weekDay: string, itemNo: number) =>
        `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}/items/${itemNo}`,
      CREATE: (contractId: string, consigneeId: string, weekDay: string) =>
        `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}/items`,
      UPDATE: (contractId: string, consigneeId: string, weekDay: string, itemNo: number) =>
        `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}/items/${itemNo}`,
      DELETE: (contractId: string, consigneeId: string, weekDay: string, itemNo: number) =>
        `/api/v1/standing-orders/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}/items/${itemNo}`,
    },

    // TODO: Add dropdown endpoints when backend implements them
    // DROPDOWNS: {
    //   CUSTOMER_TYPES: '/api/standing-orders/dropdowns/customer-types',
    //   CONTRACTS: (customerType: string) => `/api/standing-orders/dropdowns/contracts?customerType=${encodeURIComponent(customerType)}`,
    //   CONSIGNEES: (contractId: string) => `/api/standing-orders/dropdowns/consignees?contractId=${encodeURIComponent(contractId)}`,
    //   PRODUCT_TYPES: '/api/standing-orders/dropdowns/product-types',
    //   TIERS: '/api/standing-orders/dropdowns/tiers',
    //   ATTRIBUTES: '/api/standing-orders/dropdowns/attributes',
    // },
  },

  // Vista LifeTrak Error Log (VSTERLOG) endpoints
  VISTA_LIFETRAK_ERROR_LOG: {
    LIST: (take: number, skip: number) => `/api/v1/vista-lifetrak-error-log/${take}/${skip}`,
  },

  // LifeTrak API Log Information Query (APILOGL) endpoints
  LIFE_TRAK_API_LOG: {
    SOURCE_CODES: '/api/v1/lifetrak-api-log/source-codes',
    SEARCH: '/api/v1/lifetrak-api-log/search',
  },

  MODIFY_SDD_DETAILS: {
    PRODUCTS_BY_UNIT: (unitId: string) =>
      `/api/v1/laboratory/modify-sdd-details/products-by-unit/${encodeURIComponent(unitId)}`,
    SEARCH: (unitId: string, productCode: string) =>
      `/api/v1/laboratory/modify-sdd-details/search?unitId=${encodeURIComponent(unitId)}&productCode=${encodeURIComponent(productCode)}`,
    LOT_NUMBERS: (unitId: string, productCode: string) =>
      `/api/v1/laboratory/modify-sdd-details/lot-numbers?unitId=${encodeURIComponent(unitId)}&productCode=${encodeURIComponent(productCode)}`,
    WAFER_LOT_NUMBERS: '/api/v1/laboratory/modify-sdd-details/wafer-lot-numbers',
    STERILE_MACHINES: '/api/v1/laboratory/modify-sdd-details/sterile-machines',
    UPDATE: '/api/v1/laboratory/modify-sdd-details/update',
  },

  VERIFY_COMPONENT_SUITABILITY: {
    PROCESS_CODES: '/api/v1/verify-component-suitability/process-codes',
    PRODUCT_TYPES: '/api/v1/verify-component-suitability/product-types',
    PRODUCT_CODES: (productType: string) =>
      `/api/v1/verify-component-suitability/product-codes?productType=${encodeURIComponent(productType)}`,
    ELIGIBLE_PRODUCTS: (unitId: string, processCode: string) =>
      `/api/v1/verify-component-suitability/eligible-products?unitId=${encodeURIComponent(unitId)}&processCode=${encodeURIComponent(processCode)}`,
    VALIDATE_UNIT: '/api/v1/verify-component-suitability/validate-unit',
    VALIDATE_PRODUCT: (unitId: string, productCode: string, processCode: string, componentPrefix?: string) => {
      let url = `/api/v1/verify-component-suitability/validate-product?unitId=${encodeURIComponent(unitId)}&productCode=${encodeURIComponent(productCode)}&processCode=${encodeURIComponent(processCode)}`;
      if (componentPrefix) url += `&componentPrefix=${encodeURIComponent(componentPrefix)}`;
      return url;
    },
    ASSIGN: '/api/v1/verify-component-suitability/assign',
    UNIT_DETAILS: (unitId: string) =>
      `/api/v1/verify-component-suitability/unit/${encodeURIComponent(unitId)}`,
    ELIGIBLE_COMPONENTS: (unitId: string) =>
      `/api/v1/verify-component-suitability/unit/${encodeURIComponent(unitId)}/components`,
    VERIFY: '/api/v1/verify-component-suitability/verify',
  },

  STERILE_DOCKING_DEFINITION: {
    SEARCH: (take: number, skip: number) => `/api/v1/lab/sterile-docking-definition/${take}/${skip}`,
    GET_BY_KEY: (sdcUsNumber: string, unitId: string, collDate: string, chapterId: string, itemInd: string) =>
      `/api/v1/lab/sterile-docking-definition/${encodeURIComponent(sdcUsNumber)}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(itemInd)}`,
    CREATE: '/api/v1/lab/sterile-docking-definition',
    UPDATE: (sdcUsNumber: string, unitId: string, collDate: string, chapterId: string, itemInd: string) =>
      `/api/v1/lab/sterile-docking-definition/${encodeURIComponent(sdcUsNumber)}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(itemInd)}`,
    DELETE: (sdcUsNumber: string, unitId: string, collDate: string, chapterId: string, itemInd: string) =>
      `/api/v1/lab/sterile-docking-definition/${encodeURIComponent(sdcUsNumber)}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(itemInd)}`,
    FILTERS: '/api/v1/lab/sterile-docking-definition/filters',
    VALIDATE_UNIT: (unitId: string) => `/api/v1/lab/units/${encodeURIComponent(unitId)}/validate`,
    SEARCH_UNITS: (take: number, skip: number) => `/api/v1/lab/units/search/${take}/${skip}`,
    VALIDATE_UNIT_FOR_DOCKING: '/api/v1/lab/sterile-docking-definition/validate-unit',
    PARSE_CATALOG_BARCODE: '/api/v1/lab/sterile-docking-definition/parse-catalog-barcode',
    CALCULATE_EXPIRY_DATE: '/api/v1/lab/sterile-docking-definition/calculate-expiry-date',
    UNIT_PRODUCT_CODES: (unitId: string) => `/api/v1/lab/sterile-docking-definition/unit-product-codes/${encodeURIComponent(unitId)}`,
    CALCULATE_DERIVED_PRODUCT: '/api/v1/lab/sterile-docking-definition/calculate-derived-product',
  },

  VERIFY_COMPONENT_SUITABILITY_OFFLINE: {
    PROCESS_CODES: '/api/v1/verify-component-suitability-offline/process-codes',
    UNIT_DETAILS: (unitId: string) =>
      `/api/v1/verify-component-suitability-offline/unit/${encodeURIComponent(unitId)}`,
    ELIGIBLE_COMPONENTS: (unitId: string, processCode?: string) =>
      `/api/v1/verify-component-suitability-offline/unit/${encodeURIComponent(unitId)}/components${processCode ? `?processCode=${encodeURIComponent(processCode)}` : ''}`,
    VERIFY: '/api/v1/verify-component-suitability-offline/verify',
  },

  // Smart Manufacture Attribute Configurator
  ATTRIBUTE_CONFIG: {
    // Get all attribute configurations with filters and pagination (POST with take/skip in route)
    LIST: (take: number, skip: number) => `/api/v1/attribute-config/${take}/${skip}`,

    // Get single record by primary key
    GET_BY_ID: (chapterId: string, productType: string, fcnName: string, attribClass?: string, attribCode?: string) => {
      let url = `/api/v1/attribute-config/${encodeURIComponent(chapterId)}/${encodeURIComponent(productType)}/${encodeURIComponent(fcnName)}`;
      const params = [];
      if (attribClass) params.push(`attribClass=${encodeURIComponent(attribClass)}`);
      if (attribCode) params.push(`attribCode=${encodeURIComponent(attribCode)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      return url;
    },

    // Create new record
    CREATE: '/api/v1/attribute-config',

    // Update existing record
    UPDATE: '/api/v1/attribute-config',

    // Dropdown endpoints
    FUNCTION_NAMES: '/api/v1/attribute-config/function-names',
    PRODUCT_TYPES: '/api/v1/attribute-config/product-types',
    ATTRIBUTE_CLASSES: '/api/v1/attribute-config/attribute-classes',
    ATTRIBUTE_CODES: '/api/v1/attribute-config/attribute-codes',
    ATTRIBUTE_MODIFIERS: '/api/v1/attribute-config/attribute-modifiers',
  },

  VALID_ATTRIBUTES: {
    BASE: '/api/v1/valid-attributes',
    GET_ALL: (take: number, skip: number) => `/api/v1/valid-attributes/${take}/${skip}`,
    GET_BY_ID: (attribGroup: string, attribCode: string, unitSchemeType: string) =>
      `/api/v1/valid-attributes/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}/${encodeURIComponent(unitSchemeType)}`,
    CREATE: '/api/v1/valid-attributes',
    UPDATE: (attribGroup: string, attribCode: string, unitSchemeType: string) =>
      `/api/v1/valid-attributes/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}/${encodeURIComponent(unitSchemeType)}`,
    DELETE: (attribGroup: string, attribCode: string, unitSchemeType: string) =>
      `/api/v1/valid-attributes/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}/${encodeURIComponent(unitSchemeType)}`,
    ATTRIBUTE_GROUPS: '/api/v1/valid-attributes/attribute-groups',
    ATTRIBUTE_CODES: (attribGroup: string) => `/api/v1/valid-attributes/attribute-codes/${encodeURIComponent(attribGroup)}`,
    INTERDICTION_CODES: (statusFlag: string) => `/api/v1/valid-attributes/interdiction-codes/${encodeURIComponent(statusFlag)}`,
    EQ_CODE128_ATTRIB_CODES: (attribGroup: string) => `/api/v1/valid-attributes/eq-code128-attrib-codes/${encodeURIComponent(attribGroup)}`,
  },

  SDD_WORKSHEET_UNITS: {
    BASE: '/api/v1/sdd-worksheet-units',
    WORKSHEETS: '/api/v1/sdd-worksheet-units/worksheets',
    UNITS: (worksheetId: string, take: number, skip: number) => `/api/v1/sdd-worksheet-units/${encodeURIComponent(worksheetId)}/${take}/${skip}`,
    DELETE: '/api/v1/sdd-worksheet-units',
  },

  ENTER_NOTE_FOR_SPECIAL_PROCESSING: {
    GET_PROCESS_CODES: '/api/v1/special-processing-notes/process-codes',
    GET_PRODUCT_CODES: (processCode: string, unitId: string) =>
      `/api/v1/special-processing-notes/product-codes?processCode=${encodeURIComponent(processCode)}&unitId=${encodeURIComponent(unitId)}`,
    GET_ALIQUOTS: (processCode: string, unitId: string, productCode: string) =>
      `/api/v1/special-processing-notes/aliquots?processCode=${encodeURIComponent(processCode)}&unitId=${encodeURIComponent(unitId)}&productCode=${encodeURIComponent(productCode)}`,
    RETRIEVE: '/api/v1/special-processing-notes/retrieve',
    SAVE: '/api/v1/special-processing-notes/save',
  },

  ENTER_COMPONENT_DIFFERENTIAL: {
    GET_PROCESS_CODES: '/api/v1/component-differential/process-codes',
    GET_STAGE_CODES: (processCode: string) =>
      `/api/v1/component-differential/stage-codes?processCode=${encodeURIComponent(processCode)}`,
    GET_PRODUCT_CODES: (unitId: string, collDate: string, processCode: string) =>
      `/api/v1/component-differential/product-codes?unitId=${encodeURIComponent(unitId)}&collDate=${encodeURIComponent(collDate)}&processCode=${encodeURIComponent(processCode)}`,
    GET_CELL_CODES: '/api/v1/component-differential/cell-codes',
    GET_UNIT_INFO: (unitId: string) =>
      `/api/v1/component-differential/unit-info?unitId=${encodeURIComponent(unitId)}`,
    GET_COMPONENT_INFO: (unitId: string, collDate: string, productCode: string, componentPrefix: string, processCode: string) =>
      `/api/v1/component-differential/component-info?unitId=${encodeURIComponent(unitId)}&collDate=${encodeURIComponent(collDate)}&productCode=${encodeURIComponent(productCode)}&componentPrefix=${encodeURIComponent(componentPrefix)}&processCode=${encodeURIComponent(processCode)}`,
    SEARCH: (take: number, skip: number) =>
      `/api/v1/component-differential/${take}/${skip}`,
    GET_BY_ID: (differentialId: number) =>
      `/api/v1/component-differential/${differentialId}`,
    CREATE: '/api/v1/component-differential/create',
    UPDATE: (differentialId: number, cellCode: string) =>
      `/api/v1/component-differential/${differentialId}/${encodeURIComponent(cellCode)}`,
  },

  LAB_BATCH_TRANSFER: {
    EXECUTE: '/api/v1/distributions/lab-batch-transfer/execute',
  },

  // Close Box (CLBOX)
  CLOSE_BOX: {
    GET_DETAILS: (boxId: string) => `/api/distributions/close-box/${encodeURIComponent(boxId)}`,
    CLOSE: (boxId: string) => `/api/distributions/close-box/${encodeURIComponent(boxId)}/close`,
  },

  // Offline Product Packing (PACKO)
  OFFLINE_PRODUCT_PACKING: {
    GET_ALL: '/api/v1/offline-packing',
    GET_DETAIL: '/api/v1/offline-packing',
    BOX_TYPES: '/api/v1/offline-packing/lookups/box-types',
    PICK_SLIPS: (orderNo: string) => `/api/v1/offline-packing/lookups/pick-slips/${encodeURIComponent(orderNo)}`,
    BOX_CREATE: '/api/v1/offline-packing/box/create',
    PACK_PRODUCT: '/api/v1/offline-packing/pack',
    QUARANTINE: '/api/v1/offline-packing/quarantine',
    BOX_CLOSE: '/api/v1/offline-packing/box/close',
    PACK_STATUS: (orderNo: string) => `/api/v1/offline-packing/pack-status/${encodeURIComponent(orderNo)}`,
    BOX_CONTENTS: (boxId: string) => `/api/v1/offline-packing/box-contents/${encodeURIComponent(boxId)}`,
    OPEN_BOXES: (orderNo: string) => `/api/v1/offline-packing/lookups/boxes/${encodeURIComponent(orderNo)}`,
    PRODUCT_CODES: (unitId: string) => `/api/v1/offline-packing/lookups/product-codes/${encodeURIComponent(unitId)}`,
    BLOOD_TYPES: (unitId: string, productCode: string) => `/api/v1/offline-packing/lookups/blood-types/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    ALIQUOTS: (unitId: string, productCode: string) => `/api/v1/offline-packing/lookups/aliquots/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    BOX_TYPE_BY_BOX: (boxId: string) => `/api/v1/offline-packing/lookups/box-type/${encodeURIComponent(boxId)}`,
    UPDATE_BACK_ORDER: '/api/v1/offline-packing/update-back-order-status',
  },
  
  // Schedule Auto/Directed Order (SHIADORD)
  SCHEDULE_AUTO_DIRECTED_ORDER: {
    CUSTOMER: (customerId: string) => `/api/v1/schedule-auto-directed-order/customer/${customerId}`,
    CONSIGNEE: (consigneeId: string) => `/api/v1/schedule-auto-directed-order/consignee/${consigneeId}`,
    AVAILABLE_UNITS: '/api/v1/schedule-auto-directed-order/available-units',
    CREATE: '/api/v1/schedule-auto-directed-order/create',
    CUSTOMERS_LOOKUP: '/api/v1/schedule-auto-directed-order/lookup/customers',
    CONSIGNEES_LOOKUP: (customerId: string) => `/api/v1/schedule-auto-directed-order/lookup/consignees/${customerId}`,
  },

  // Ship Products (DISSHP)
  SHIP_PRODUCTS: {
    GET_ALL: (take: number, skip: number) => `/api/v1/ship-products/${take}/${skip}`,
    GET_BY_NUMBER: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}`,
    CREATE: '/api/v1/ship-products',
    UPDATE: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}`,
    CONSIGNEE_LOV: '/api/v1/ship-products/consignees/lookup',
    CARRIER_LOV: '/api/v1/ship-products/carriers/lookup',
    GET_BOXES: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/boxes`,
    ADD_BOX: (shipmentNo: string, boxId: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/boxes/${encodeURIComponent(boxId)}`,
    REMOVE_BOX: (shipmentNo: string, boxId: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/boxes/${encodeURIComponent(boxId)}`,
    GET_BOX_PRODUCTS: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/boxes/products`,
    COMPLETE: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/complete`,
    GET_CHARGES: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/charges`,
    ADD_CHARGE: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/charges`,
    DELETE_CHARGE: (shipmentNo: string, chargeCode: string, orderNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/charges/${encodeURIComponent(chargeCode)}/${encodeURIComponent(orderNo)}`,
    GET_CONSIGNEES_IN_ZONE: (consigneeId: string) => `/api/v1/ship-products/consignees/${encodeURIComponent(consigneeId)}/zone`,
    PACKED_BOXES_LOV: (consigneeId: string) => `/api/v1/ship-products/consignees/${encodeURIComponent(consigneeId)}/packed-boxes`,
    PRINTER_LOV: '/api/v1/system-users/GetPrinterCodes',
    CHARGE_CODES_LOV: '/api/v1/ship-products/charge-codes',
    VALIDATE_BARCODE: '/api/v1/ship-products/validate-barcode',
    PRINT_PACKLIST: (shipmentNo: string) => `/api/v1/ship-products/${encodeURIComponent(shipmentNo)}/print-packlist`,
  },

  // Generate Outdates Picklist (IMIOUTDT)
  GENERATE_OUTDATES_PICKLIST: {
    SUMMARY: '/api/v1/outdates-picklist/summary',
    DETAILS: '/api/v1/outdates-picklist/details',
    INVENTORY_CLASSES: '/api/v1/outdates-picklist/inventory-classes',
    COMMIT: '/api/v1/outdates-picklist/commit',
  },

  // Interdicted Active Stock (PINTQ)
  INTERDICTED_ACTIVE_STOCK: {
    QUERY: '/api/v1/laboratory/interdicted-active-stock',
    INVENTORY_CLASSES: '/api/v1/laboratory/interdicted-active-stock/inventory-classes',
    PRODUCT_TYPES: '/api/v1/laboratory/interdicted-active-stock/product-types',
  },

  // Reject Inventory Products (INVREJ)
  REJECT_INVENTORY_PRODUCTS: {
    SEARCH: '/api/v1/inventory-management/reject-inventory-products/search',
    REJECT: '/api/v1/reject-inventory-products/reject',
    VALIDATE_UNIT: '/api/v1/reject-inventory-products/validate-unit',
    REJECTION_CODES: '/api/v1/reject-inventory-products/reject-codes',
    PRODUCT_CODES: '/api/v1/reject-inventory-products/product-codes',
  },
  // Restock Unshipped Products (RESTOCK)
  RESTOCK_UNSHIPPED_PRODUCTS: {
    GET_PICK_SLIPS: '/api/v1/restock/pick-slips',
    // GET /api/v1/restock/pick-slips/{pickSlipId}/products/{take}/{skip}?chapterId=
    GET_PICK_SLIP_PRODUCTS: (pickSlipId: string, take: number, skip: number) =>
      `/api/v1/restock/pick-slips/${encodeURIComponent(pickSlipId)}/products/${take}/${skip}`,
    RESTOCK_PRODUCTS: '/api/v1/restock/products',
    GET_STORAGE_DEVICES: '/api/v1/restock/storage/devices',
    GET_STORAGE_RACKS: '/api/v1/restock/storage/racks',
    GET_STORAGE_TRAYS: '/api/v1/restock/storage/trays',
  },

  // Checkin Discard Products to Inventory (CHKDIS)
  CHECKIN_DISCARD_PRODUCTS: {
    VERIFY_DISCARD_UNIT: '/api/v1/checkin-discard-products/verify-discard-unit',
    PRODUCT_CODES: '/api/v1/checkin-discard-products/product-codes',
    ABO_TYPES: '/api/v1/checkin-discard-products/abo-types',
    LOCATION_DEFAULTS: '/api/v1/checkin-discard-products/location-defaults',
    DEVICES: '/api/v1/checkin-discard-products/devices',
    RACKS: '/api/v1/checkin-discard-products/racks',
    TRAYS: '/api/v1/checkin-discard-products/trays',
    CHECKIN: '/api/v1/checkin-discard-products/checkin',
  },

  // Order Processing Status (OEQOFLOW)
  ORDER_PROCESSING_STATUS: {
    GET_ORDERS: '/api/v1/order-processing-status',
    GET_STATUS_CODES: '/api/v1/order-processing-status/status-codes',
  },

  RELEASE_QUARANTINE: {
    QUARANTINE_TYPES: '/api/v1/quarantine/types',
    PRODUCT_INFO: '/api/v1/quarantine/product-info',
    RELEASE: '/api/v1/quarantine/release',
  },

  CHECK_IN_FROM_LAB: {
    LIST: (take: number, skip: number) => `/api/v1/check-in-from-lab/list/${take}/${skip}`,
    GET_BY_KEY: (unitId: string, productCode: string, aliquot: string) =>
      `/api/v1/check-in-from-lab/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}`,
    CREATE: '/api/v1/check-in-from-lab',
    UPDATE: (unitId: string, productCode: string, aliquot: string) =>
      `/api/v1/check-in-from-lab/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}`,
    VALIDATE_UNIT: '/api/v1/check-in-from-lab/validate-unit',
    VALIDATE_PRODUCT: '/api/v1/check-in-from-lab/validate-product',
    VALIDATE_RECEIVE_DATE: '/api/v1/check-in-from-lab/validate-receive-date',
    VALIDATE_ABO: '/api/v1/check-in-from-lab/validate-abo',
    VALIDATE_COMPONENT: '/api/v1/check-in-from-lab/validate-component',
    VALIDATE_EXPIRY: '/api/v1/check-in-from-lab/validate-expiry',
    VALIDATE_LOCATION: '/api/v1/check-in-from-lab/validate-location',
    INVENTORY_CLASSES: '/api/v1/check-in-from-lab/inventory-classes',
    WAREHOUSES: '/api/v1/check-in-from-lab/warehouses',
    DEVICES: (warehouseId: string) => `/api/v1/check-in-from-lab/devices/${encodeURIComponent(warehouseId)}`,
    RACKS: (warehouseId: string, deviceId: string) =>
      `/api/v1/check-in-from-lab/racks/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceId)}`,
    TRAYS: (warehouseId: string, deviceId: string, rackId: string) =>
      `/api/v1/check-in-from-lab/trays/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceId)}/${encodeURIComponent(rackId)}`,
    PRODUCTS: (unitId: string) => `/api/v1/check-in-from-lab/products/${encodeURIComponent(unitId)}`,
    ALIQUOTS: (unitId: string, productCode: string) =>
      `/api/v1/check-in-from-lab/aliquots/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    ABO_TYPES: '/api/v1/check-in-from-lab/abo-types',
    BASE_ABO_VALUE: (aboValue: string) => `/api/v1/check-in-from-lab/base-abo-value/${encodeURIComponent(aboValue)}`,
  },
  MOVE_OUTDATES: {
    LIST: (take: number, skip: number) => `/api/v1/move-outdates/${take}/${skip}`,
    GET_BY_ID: (productId: string) => `/api/v1/move-outdates/${encodeURIComponent(productId)}`,
    CREATE: '/api/v1/move-outdates',
    WAREHOUSES: '/api/v1/move-outdates/warehouses',
    DISCARD_CODES: '/api/v1/move-outdates/discard-codes',
    VALIDATE_UNIT: '/api/v1/move-outdates/validate-unit',
    PICK_SLIPS: '/api/v1/move-outdates/outdated-pickslips',
    PICK_SLIP_PRODUCT_DROPDOWN: (pickSlipId: string) =>
      `/api/v1/move-outdates/outdated-pickslips/${encodeURIComponent(pickSlipId)}/product-dropdown`,
    PICK_SLIP_PRODUCTS: (pickSlipId: string) =>
      `/api/v1/move-outdates/outdated-pickslips/${encodeURIComponent(pickSlipId)}/products`,
  },

  // Offline Product Check-In (CHKOFF) - MLT-14047
  OFFLINE_PRODUCT_CHECKIN: {
    INVENTORY_CLASSES: '/api/v1/offline-product-checkin/inventory-classes',
    VALIDATE_UNIT: (unitId: string) => `/api/v1/offline-product-checkin/validate-unit/${encodeURIComponent(unitId)}`,
    CHECKIN: '/api/v1/offline-product-checkin/checkin',
    ALIQUOTS: (unitId: string, productCode: string) =>
      `/api/v1/offline-product-checkin/aliquots/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    PRODUCT_CODES: (unitId: string) =>
      `/api/v1/offline-product-checkin/product-codes/${encodeURIComponent(unitId)}`,
    ABO_TYPES: (unitId: string, productCode: string, aliquot: string) =>
      `/api/v1/offline-product-checkin/abo-types/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}`,
    WAREHOUSES: '/api/v1/offline-product-checkin/warehouses',
    DEVICES: (warehouseId: string, productType?: string) => {
      let url = `/api/v1/offline-product-checkin/devices/${encodeURIComponent(warehouseId)}`;
      if (productType) url += `?productType=${encodeURIComponent(productType)}`;
      return url;
    },
    RACKS: (warehouseId: string, deviceNumber: string, deviceType?: string, productType?: string, bloodType?: string) => {
      let url = `/api/v1/offline-product-checkin/racks/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceNumber)}`;
      const params: string[] = [];
      if (deviceType) params.push(`deviceType=${encodeURIComponent(deviceType)}`);
      if (productType) params.push(`productType=${encodeURIComponent(productType)}`);
      if (bloodType) params.push(`bloodType=${encodeURIComponent(bloodType)}`);
      if (params.length) url += `?${params.join('&')}`;
      return url;
    },
    TRAYS: (warehouseId: string, deviceNumber: string, rackNumber: string) =>
      `/api/v1/offline-product-checkin/trays/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceNumber)}/${encodeURIComponent(rackNumber)}`,
  },

  // Modify Component Weight (CPIWEIGH)
  MODIFY_COMPONENT_WEIGHT: {
    BASE: '/api/v1/component-weight',
    GET_UNIT_DETAILS: (unitId: string, chapterId: string) =>
      `/api/v1/component-weight/units/${encodeURIComponent(unitId)}?chapterId=${encodeURIComponent(chapterId)}`,
    GET_VALID_PRODUCTS: (unitId: string, collDate: string, chapterId: string, codeScheme = 'I') =>
      `/api/v1/component-weight/components/${encodeURIComponent(unitId)}/products?collDate=${encodeURIComponent(collDate)}&chapterId=${encodeURIComponent(chapterId)}&codeScheme=${encodeURIComponent(codeScheme)}`,
    GET_COMPONENT_PREFIXES: (unitId: string, collDate: string, productCode: string, codeScheme: string) =>
      `/api/v1/component-weight/component-prefixes?unitId=${encodeURIComponent(unitId)}&collDate=${encodeURIComponent(collDate)}&productCode=${encodeURIComponent(productCode)}&codeScheme=${encodeURIComponent(codeScheme)}`,
    UPDATE: '/api/v1/component-weight/update',
  },

  // Modify Freeze Start Time (MODFRZ)
  MODIFY_FREEZE_START_TIME: {
    BASE: '/api/v1/modify-freeze-start-time',
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/modify-freeze-start-time/validate-unit/${encodeURIComponent(unitId)}`,
    GET_PRODUCTS: (unitId: string, collDate: string, codeScheme: string) =>
      `/api/v1/modify-freeze-start-time/products/${encodeURIComponent(unitId)}?collDate=${encodeURIComponent(collDate)}&codeScheme=${encodeURIComponent(codeScheme)}`,
    GET_ALIQUOTS: (unitId: string, productCode: string, collDate: string) =>
      `/api/v1/modify-freeze-start-time/aliquots/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}?collDate=${encodeURIComponent(collDate)}`,
    GET_COMPONENT_DETAILS: (unitId: string, productCode: string, aliquot: string, collDate: string) =>
      `/api/v1/modify-freeze-start-time/component?unitId=${encodeURIComponent(unitId)}&productCode=${encodeURIComponent(productCode)}&aliquot=${encodeURIComponent(aliquot)}&collDate=${encodeURIComponent(collDate)}`,
    UPDATE: '/api/v1/modify-freeze-start-time',
  },

  // Product Current Status (MLT-14053)
  PRODUCT_CURRENT_STATUS: {
    SUMMARY: '/api/v1/product-current-status/summary',
    ACTIVE: (take: number, skip: number) => `/api/v1/product-current-status/active/${take}/${skip}`,
    SHIPPED: (take: number, skip: number) => `/api/v1/product-current-status/shipped/${take}/${skip}`,
    DISCARDED: (take: number, skip: number) => `/api/v1/product-current-status/discarded/${take}/${skip}`,
    ANTIGENS: (unitId: string) => `/api/v1/product-current-status/antigens?unitId=${encodeURIComponent(unitId)}`,
    LOV_PRODUCT_CODES: (unitId: string, codeScheme?: string) => `/api/v1/product-current-status/lov/product-codes?unitId=${encodeURIComponent(unitId)}${codeScheme ? `&codeScheme=${encodeURIComponent(codeScheme)}` : ''}`,
    LOV_ALIQUOTS: (unitId: string, productCode: string) => `/api/v1/product-current-status/lov/aliquots?unitId=${encodeURIComponent(unitId)}&productCode=${encodeURIComponent(productCode)}`,
  },

  // Unit Transfer to Transfusion System (SNDHCLL/LTIHCLL) endpoints
  UNIT_TRANSFER_TO_TRANSFUSION: {
    FACILITIES: '/api/v1/donors/unit-transfer-to-system/facilities',
    EXECUTE: '/api/v1/donors/unit-transfer-to-system/transfer',
  },

  COMMIT_REAGENTS: {
    PROCESS_CODES: '/api/v1/commit-reagents/process-codes',
    STAGE_CODES: '/api/v1/commit-reagents/stage-codes',
    UNIT_INFO: '/api/v1/commit-reagents/unit-info',
    UNIT_PRODUCTS: '/api/v1/commit-reagents/unit-products',
    COMPONENT_INFO: '/api/v1/commit-reagents/component-info',
    KIT: '/api/v1/commit-reagents',
    LATEST_KIT: '/api/v1/commit-reagents/latest-kit',
    CODE_SCHEME: '/api/v1/commit-reagents/code-scheme',
  },

  REAGENT_QUERY: {
    BASE: '/api/v1/reagent-query',
    TESTS_DROPDOWN: '/api/v1/reagent-query/tests-dropdown',
    REAGENT_CODES_DROPDOWN: '/api/v1/reagent-query/reagent-codes-dropdown',
    LOT_NUMBERS_DROPDOWN: '/api/v1/reagent-query/lot-numbers-dropdown',
    REAGENT_IDS_DROPDOWN: '/api/v1/reagent-query/reagent-ids-dropdown',
    SEARCH: '/api/v1/reagent-query/search',
  },
  RECONCILE_LAB_WAREHOUSE_BATCH: {
    BATCH_HEADER: (batchId: string) => `/api/v1/reconcile-lab-warehouse-batch/batch-header/${encodeURIComponent(batchId)}`,
    BATCH_DETAILS: (batchId: string) => `/api/v1/reconcile-lab-warehouse-batch/batch-details/${encodeURIComponent(batchId)}`,
    REASON_CODES: '/api/v1/reconcile-lab-warehouse-batch/reason-codes',
    RECONCILE: '/api/v1/reconcile-lab-warehouse-batch/reconcile',
  },

  // Reconcile Transport Batch (IMIWHRCL/WHRCL) endpoints
  RECONCILE_TRANSPORT_BATCH: {
    BASE: '/api/v1/reconcile-transport-batch',
    BATCHES: '/api/v1/reconcile-transport-batch/batches',
    BATCH_DETAILS: (batchId: string) => `/api/v1/reconcile-transport-batch/${encodeURIComponent(batchId)}`,
    REASON_CODES: '/api/v1/reconcile-transport-batch/reason-codes',
    RECONCILE: (batchId: string) => `/api/v1/reconcile-transport-batch/${encodeURIComponent(batchId)}/reconcile`,
  },

  // Discard Empty Bags (CPIDISCA/DISMTBAG) endpoints
  DISCARD_EMPTY_BAGS: {
    REJECT_REASONS: '/api/v1/discard-empty-bags/reject-reasons',
    VALIDATE_UNIT_FOR_DISCARD: (unitId: string) =>
      `/api/v1/discard-empty-bags/validate-unit-for-discard/${encodeURIComponent(unitId)}`,
    VALIDATE_CATALOG: '/api/v1/discard-empty-bags/validate-catalog',
    AVAILABLE_CATALOGS: (unitId: string) =>
      `/api/v1/discard-empty-bags/available-catalogs/${encodeURIComponent(unitId)}`,
    DISCARD: '/api/v1/discard-empty-bags/discard',
  },

  // Reject Unit/Component (CPIREJ) endpoints - MLT-13008
  REJECT_COMPONENT: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/reject-component/validate-unit/${encodeURIComponent(unitId)}`,
    PRODUCT_CODES: (unitId: string) =>
      `/api/v1/reject-component/product-codes/${encodeURIComponent(unitId)}`,
    COMPONENTS: (unitId: string, productCode: string) =>
      `/api/v1/reject-component/components/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    REJECTION_REASONS: '/api/v1/reject-component/rejection-reasons',
    CATALOG_NUMBERS: (unitId: string) =>
      `/api/v1/reject-component/catalog-numbers/${encodeURIComponent(unitId)}`,
    REJECT: '/api/v1/reject-component/reject',
    REPRINT_LABEL: '/api/v1/components-made-from-unit/reprint-label',
    ABO_LABELS: '/api/v1/reject-component/abo-labels',
    VALIDATE_PRODUCT: (unitId: string, productCode: string) =>
      `/api/v1/reject-component/validate-product/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
  },

// Release Product Quarantine (RQU) endpoints
  RELEASE_PRODUCT_QUARANTINE: {
    BASE: '/api/v1/release-product-quarantine',
     GET_RELEASE_TYPES: '/release-types',
    GET_UNITS: (releaseType: string) => `/units/${encodeURIComponent(releaseType)}`,
    GET_UNIT_REASONS: '/unit-reasons',
    GET_REJECT_CODES: '/reject-codes',
    GET_STORAGE_DEVICES: '/storage/devices',
    GET_STORAGE_RACKS: '/storage/racks',
    GET_STORAGE_TRAYS: '/storage/trays',
    SAVE: '/save',
    GET_PRODUCT_CODES: (unitId: string) => `/product-codes/${encodeURIComponent(unitId)}`,
    QUARANTINE_TYPES: '/quarantine-types',
    PRODUCTS: '/products',
    PRODUCT_BY_ID: (unitId: string, productCode: string, aliquot: string) =>
      `/products/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}`,
    REASONS: (unitId: string, productCode: string, aliquot: string) =>
      `/products/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}/reasons`,
    LOCATIONS: '/locations',
    RELEASE: '/release',
    REMOVE_REASON: (unitId: string, productCode: string, aliquot: string, reasonCode: string) =>
      `/products/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}/reasons/${encodeURIComponent(reasonCode)}`,
    REMOVE_REASONS: '/remove-reasons',
  },

  // Place Product Quarantine (PQU) endpoints
  PLACE_PRODUCT_QUARANTINE: {
    BASE: '/api/v1/place-product-quarantine',
    PLACE_QUARANTINE: '/api/v1/place-product-quarantine',
    QUARANTINE_REASONS: '/api/v1/place-product-quarantine/quarantine-reasons',
    PRODUCT_CODES: '/api/v1/place-product-quarantine/product-codes',
    ALIQUOTS: '/api/v1/place-product-quarantine/aliquots',
    UNIT_INFO: '/api/v1/place-product-quarantine/unit-info',
  },

  RELEASE_SPECIAL_PROCESSING: {
    BASE: '/api/v1/release-special-processing',
    PROCESS_CODES: '/process-codes',
    VALIDATE_UNIT: '/validate-unit',
    PRODUCTS: '/products',
    ALIQUOTS: '/aliquots',
    RELEASE: '/release',
  },

  RELEASE_STANDING_ORDERS_BATCH: {
    BASE: '/api/v1/release-standing-orders',
    BATCH: '/batch',
    PREVIEW: '/preview',
  },

  RELEASE_COMPONENT_INTERDICTION: {
    BASE: '/api/v1/release-component-interdictions',
    VALIDATE_UNIT: '/validate-unit',
    VALIDATE_UNIT_SCAN: '/validate-unit-scan',
    VALIDATE_PRODUCT_SCAN: '/validate-product-scan',
    VALID_PRODUCTS: '/valid-products',
    INTERDICTIONS: '/interdictions',
    RELEASE: '/release',
  },

  RELEASE_GROUP_INTERDICTION: {
    BASE: '/api/v1/release-group-interdictions',
    GET_ALL: (take: number, skip: number) => `/api/v1/release-group-interdictions/${take}/${skip}`,
    DELETE: '/api/v1/release-group-interdictions/delete',
    UNITS_INFO: '/api/v1/release-group-interdictions/units-info',
    DROPDOWN_DRIVES: '/api/v1/release-group-interdictions/dropdown/drives',
    DROPDOWN_BATCHES: '/api/v1/release-group-interdictions/dropdown/batches',
    DROPDOWN_COLLECTION_DATES: '/api/v1/release-group-interdictions/dropdown/collection-dates',
    DROPDOWN_LOT_NUMBERS: '/api/v1/release-group-interdictions/dropdown/lot-numbers',
    DROPDOWN_TB_IDS: '/api/v1/release-group-interdictions/dropdown/tb-ids',
  },
  RELEASE_COMPONENT_SYSTEM_INTERDICTION: {
    BASE: '/api/v1/release-component-system-interdictions',
    VALIDATE_UNIT: '/validate-unit',
    VALID_PRODUCTS: '/valid-products',
    INTERDICTIONS: '/interdictions',
    RELEASE: '/release',
    SEARCH: '/search',
    APPLY: '/apply',
    ACTIVE_INTERDICTIONS: '/interdictions/active',
  },

  RELEASE_UNIT_SYSTEM_INTERDICTION: {
    BASE: '/api/v1/release-unit-system-interdictions',
    VALIDATE_UNIT: '/validate-unit',
    INTERDICTIONS: '/interdictions',
    RELEASE: '/release',
  },

  // Vista Interface Status (MLT-11901) endpoints
  VISTA_INTERFACE_STATUS: {
    BASE: '/api/v1/vista-interface-status',
    GET_ALL: (take: number, skip: number) => `/api/v1/vista-interface-status/${take}/${skip}`,
    GET_BY_ID: (transactionId: string) => `/api/v1/vista-interface-status/${encodeURIComponent(transactionId)}`,
    UPDATE_STATUS: (transactionId: string) => `/api/v1/vista-interface-status/${encodeURIComponent(transactionId)}/status`,
    DRIVES_LOV: '/api/v1/vista-interface-status/drives-lov',
    UPLOADED_DATA: (transactionId: string) => `/api/v1/vista-interface-status/${encodeURIComponent(transactionId)}/uploaded-data`,
  },

  PROCESS_STAGES: {
    LIST: '/api/v1/process-stages/list',
    GET_BY_ID: (processCode: string, stageCode: string) =>
      `/api/v1/process-stages/${encodeURIComponent(processCode)}/${encodeURIComponent(stageCode)}`,
    BULK_UPSERT: '/api/v1/process-stages/bulk/upsert',
    DELETE: (processCode: string, stageCode: string) =>
      `/api/v1/process-stages/${encodeURIComponent(processCode)}/${encodeURIComponent(stageCode)}`,
    PROCESS_CODES: '/api/v1/process-stages/process-codes/dropdown',
    STAGE_CODES: '/api/v1/process-stages/stage-codes/dropdown',
  },

  PRODUCT_PROCESS: {
    LIST: '/api/v1/product-process/list',
    GET_BY_ID: (processCode: string, productCode: string) =>
      `/api/v1/product-process/${encodeURIComponent(processCode)}/${encodeURIComponent(productCode)}`,
    CREATE: '/api/v1/product-process',
    UPDATE: (processCode: string, productCode: string) =>
      `/api/v1/product-process/${encodeURIComponent(processCode)}/${encodeURIComponent(productCode)}`,
    DELETE: (processCode: string, productCode: string) =>
      `/api/v1/product-process/${encodeURIComponent(processCode)}/${encodeURIComponent(productCode)}`,
    DROPDOWN_PROCESS_CODES: '/api/v1/product-process/dropdowns/process-codes',
    DROPDOWN_PRODUCT_CODES: '/api/v1/product-process/dropdowns/product-codes',
    DROPDOWN_ATTRIBUTE_GROUPS: (productCode: string) =>
      `/api/v1/product-process/dropdowns/attribute-groups/${encodeURIComponent(productCode)}`,
    DROPDOWN_ATTRIBUTE_CODES: (productCode: string, attribGroup: string) =>
      `/api/v1/product-process/dropdowns/attribute-codes/${encodeURIComponent(productCode)}/${encodeURIComponent(attribGroup)}`,
  },

  /**
   * Void Product Label into Hold (Label Product as Quarantine)
   * JIRA: MLT-12570, MLT-12574
   * Oracle Forms: LAIOVER
   */
  VOID_PRODUCT_LABEL: {
    SEARCH: (take: number, skip: number) =>
      `/api/v1/laboratory/void-product-labels/search/${take}/${skip}`,
    GET_COMPONENT: (unitId: string, productCode: string) =>
      `/api/v1/laboratory/void-product-labels/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    VOID: '/api/v1/laboratory/void-product-labels/void',
    OVERRIDE_CODES: '/api/v1/laboratory/void-product-labels/override-codes',
    UNIT_COMPONENTS: (unitId: string) =>
      `/api/v1/laboratory/void-product-labels/units/${encodeURIComponent(unitId)}/components`,
    PRODUCT_CODES: '/api/v1/laboratory/void-product-labels/product-codes',
    PRINT_LABEL: '/api/v1/laboratory/void-product-labels/print-label',
  },


  TRAY_DEFINITION: {
    BASE: '/api/v1/tray-definition',
    GET_ALL: (take: number, skip: number) => `/api/v1/tray-definition/${take}/${skip}`,
    GET_BY_ID: (chapterId: string, trayNumber: string) =>
      `/api/v1/tray-definition/${encodeURIComponent(chapterId)}/${encodeURIComponent(trayNumber)}`,
    TRAY_STATUS_LOV: '/api/v1/tray-definition/tray-status-lov',
    CREATE: '/api/v1/tray-definition',
    UPDATE: (chapterId: string, trayNumber: string) =>
      `/api/v1/tray-definition/${encodeURIComponent(chapterId)}/${encodeURIComponent(trayNumber)}`,
    DELETE: (chapterId: string, trayNumber: string) =>
      `/api/v1/tray-definition/${encodeURIComponent(chapterId)}/${encodeURIComponent(trayNumber)}`,
  },

  COMPONENT_QUERY: {
    SUMMARY: (unitId: string) =>
      `/api/v1/component-query/unit/${encodeURIComponent(unitId)}`,
    COMPONENTS: (unitId: string, take: number, skip: number, sortOrder?: string) => {
      let url = `/api/v1/component-query/unit/${encodeURIComponent(unitId)}/components/${take}/${skip}`;
      if (sortOrder) url += `?sortColumn=ProductCode&sortOrder=${sortOrder}`;
      return url;
    },
    CONVERTED: (unitId: string, take: number, skip: number, sortOrder?: string) => {
      let url = `/api/v1/component-query/unit/${encodeURIComponent(unitId)}/converted/${take}/${skip}`;
      if (sortOrder) url += `?sortColumn=ProductCode&sortOrder=${sortOrder}`;
      return url;
    },
    ATTRIBUTES: (unitId: string, productCode: string, sortOrder?: string) => {
      let url = `/api/v1/component-query/unit/${encodeURIComponent(unitId)}/attributes/${encodeURIComponent(productCode)}`;
      if (sortOrder) url += `?sortOrder=${sortOrder}`;
      return url;
    },
    INTERDICTIONS: (unitId: string, productCode: string, sortOrder?: string) => {
      let url = `/api/v1/component-query/unit/${encodeURIComponent(unitId)}/interdictions/${encodeURIComponent(productCode)}`;
      if (sortOrder) url += `?sortOrder=${sortOrder}`;
      return url;
    },
  },

  POOLED_COMPONENT: {
    GET_HEADER: (poolId: string) =>
      `/api/v1/pooled-components/${encodeURIComponent(poolId)}`,
    GET_UNITS: (poolId: string) =>
      `/api/v1/pooled-components/${encodeURIComponent(poolId)}/units`,
    SEARCH: (take: number, skip: number) =>
      `/api/v1/pooled-components/search/${take}/${skip}`,
  },

  NOTES_QUERY: {
    SEARCH: '/api/v1/notes-query/search',
    USERS: '/api/v1/notes-query/users',
    PROGRAMS: '/api/v1/notes-query/programs',
  },

  UPDATE_NUMBER_OF_BAGS: {
    VALIDATE_UNIT: '/api/v1/component-bag-update/validate-unit',
    PRODUCT_CODES: (unitId: string, collDate: string, codeScheme: string) =>
      `/api/v1/component-bag-update/product-codes?unitId=${encodeURIComponent(unitId)}&collDate=${encodeURIComponent(collDate)}&codeScheme=${encodeURIComponent(codeScheme)}`,
    COMPONENT_PREFIXES: (unitId: string, collDate: string, productCode: string, codeScheme: string) =>
      `/api/v1/component-bag-update/component-prefixes?unitId=${encodeURIComponent(unitId)}&collDate=${encodeURIComponent(collDate)}&productCode=${encodeURIComponent(productCode)}&codeScheme=${encodeURIComponent(codeScheme)}`,
    UPDATE_BAGS: '/api/v1/component-bag-update',
  },

  // ABO Labeling - Antigens endpoints (LAILABE2 - AGLBL)
  ABO_LABELING_ANTIGENS: {
    BASE: '/api/v1/abo-labeling-isbt',
    PRINTER_CONFIG: '/api/v1/abo-labeling-isbt/printer-config',
    VALIDATE_ACCESS: '/api/v1/abo-labeling-isbt/validate-access',
    VALIDATE_UNIT: '/api/v1/abo-labeling-isbt/validate-unit',
    PROCESS_LABEL: '/api/v1/abo-labeling-isbt/process-label',
    CONFIRM_VERIFICATION: '/api/v1/abo-labeling-isbt/confirm-verification',
    REPRINT: '/api/v1/abo-labeling-isbt/reprint',
    ANTIGENS: (unitId: string, collDate: string) =>
      `/api/v1/abo-labeling-isbt/antigens/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,
    LOV_ABO_VALUES: '/api/v1/abo-labeling-isbt/lov/abo-values',
    LOV_SPECIAL_TEST_CODES: '/api/v1/abo-labeling-isbt/lov/special-test-codes',
  },

  // ABO Labeling - ISBT Super endpoints (SUPLABLI)
  ABO_LABELING_ISBT_SUPER: {
    BASE: '/api/v1/abo-labeling-isbt-super',
    PRINTER_CONFIG: '/api/v1/abo-labeling-isbt-super/printer-config',
    VALIDATE_ACCESS: '/api/v1/abo-labeling-isbt-super/validate-access',
    VALIDATE_UNIT: '/api/v1/abo-labeling-isbt-super/validate-unit',
    PROCESS_LABEL: '/api/v1/abo-labeling-isbt-super/process-label',
    CONFIRM_VERIFICATION: '/api/v1/abo-labeling-isbt-super/confirm-verification',
    REPRINT: '/api/v1/abo-labeling-isbt-super/reprint',
    ANTIGENS: (unitId: string, collDate: string) =>
      `/api/v1/abo-labeling-isbt-super/antigens/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,
    LOV_ABO_VALUES: '/api/v1/abo-labeling-isbt-super/lov/abo-values',
    LOV_SPECIAL_TEST_CODES: '/api/v1/abo-labeling-isbt-super/lov/special-test-codes',
    LOG_ABANDONED: '/api/v1/abo-labeling-isbt-super/log-abandoned',
  },

  REPRINT_LABELS: {
    BASE: '/api/v1/reprint-labels',
    LABEL_TYPES: '/api/v1/reprint-labels/label-types',
    VALIDATE_UNIT: '/api/v1/reprint-labels/validate-unit',
    PROCESS_LABEL: '/api/v1/reprint-labels/process-label',
    VERIFY: '/api/v1/reprint-labels/verify',
    COMPONENTS: (unitId: string, labelType: string) =>
      `/api/v1/reprint-labels/${encodeURIComponent(unitId)}/components?labelType=${encodeURIComponent(labelType)}`,
    LOV_ABO_VALUES: (productCode: string, codeScheme: string) =>
      `/api/v1/reprint-labels/lov/abo-values?productCode=${encodeURIComponent(productCode)}&codeScheme=${encodeURIComponent(codeScheme)}`,
    LOV_SPECIAL_TEST: (productType: string) =>
      `/api/v1/reprint-labels/lov/special-test-codes?productType=${encodeURIComponent(productType)}`,
    PRINTER_CONFIG: '/api/v1/abo-labeling-isbt/printer-config',
  },

  // Equipment Management (Enter Equipment Details - EQUIPDET)
  EQUIPMENT: {
    BASE: '/api/v1/equipment',
    GET_ALL: (take: number, skip: number) => `/api/v1/equipment/${take}/${skip}`,
    GET_BY_KEY: (equipType: string, equipId: string, equipReference: string) =>
      `/api/v1/equipment/${encodeURIComponent(equipType)}/${encodeURIComponent(equipId)}/${encodeURIComponent(equipReference)}`,
    CREATE: '/api/v1/equipment',
    UPDATE: (equipType: string, equipId: string, equipReference: string) =>
      `/api/v1/equipment/${encodeURIComponent(equipType)}/${encodeURIComponent(equipId)}/${encodeURIComponent(equipReference)}`,
    DELETE: (equipType: string, equipId: string, equipReference: string) =>
      `/api/v1/equipment/${encodeURIComponent(equipType)}/${encodeURIComponent(equipId)}/${encodeURIComponent(equipReference)}`,
    TYPES: '/api/v1/equipment/types',
    IDS: (equipType: string) => `/api/v1/equipment/ids/${encodeURIComponent(equipType)}`,
    LOCATIONS: '/api/v1/equipment/locations',
    STATUSES: '/api/v1/equipment/statuses',
  },

  SERVICE_HISTORY_QUERY: {
    BASE: '/api/v1/service-history-query',
    GET_SERVICE_HISTORY: '/api/v1/service-history-query',
    EQUIPMENT_TYPES: '/api/v1/service-history-query/equipment-types',
    EQUIPMENT_IDS: (equipType: string) => `/api/v1/service-history-query/equipment-ids/${encodeURIComponent(equipType)}`,
    EQUIPMENT_REFERENCES: (equipType: string, equipId: string) =>
      `/api/v1/service-history-query/equipment-references/${encodeURIComponent(equipType)}/${encodeURIComponent(equipId)}`,
    VALIDATE_EQUIPMENT_TYPE: '/api/v1/service-history-query/validate-equipment-type',
    VALIDATE_EQUIPMENT: '/api/v1/service-history-query/validate-equipment',
    VALIDATE_EQUIPMENT_REFERENCE: '/api/v1/service-history-query/validate-equipment-reference',
  },

  DOWNTIME_HISTORY_QUERY: {
    BASE: '/api/v1/equipment-management/downtime-history',
    GET_DOWNTIME_HISTORY: (take: number, skip: number) => `/api/v1/equipment-management/downtime-history/${take}/${skip}`,
    EQUIPMENT_TYPES: '/api/v1/equipment-management/downtime-history/equipment-types',
    EQUIPMENT_BY_TYPE: (equipType: string) => `/api/v1/equipment-management/downtime-history/equipment-by-type/${encodeURIComponent(equipType)}`,
    EQUIPMENT_REFERENCES: '/api/v1/equipment-management/downtime-history/equipment-references',
    GET_BY_EVENT: (eventReference: string) => `/api/v1/equipment-management/downtime-history/${encodeURIComponent(eventReference)}`,
  },

  PHERESIS_COUNT: {
    COMPONENTS_BY_DATE: (take: number, skip: number, collectionDate: string, sortOrder: string = 'DESC', searchKeyword: string = '') => {
      let url = `/api/v1/pheresis-count/components/${take}/${skip}?collectionDate=${encodeURIComponent(collectionDate)}&sortOrder=${sortOrder}`;
      if (searchKeyword) { url += `&searchKeyword=${encodeURIComponent(searchKeyword)}`; }
      return url;
    },
    UPDATE_COMPONENT_COUNT: '/api/v1/pheresis-count/component-count',
    UPDATE_COMPONENT_COUNTS: '/api/v1/pheresis-count/component-counts',
    VALIDATE_COUNT: (productCode: string, unitId: string, componentCount: number) =>
      `/api/v1/pheresis-count/validate-count?productCode=${encodeURIComponent(productCode)}&unitId=${encodeURIComponent(unitId)}&componentCount=${componentCount}`,
  },

  CUSTOMER_PRODUCT_TIER_PRICING: {
    BASE: '/api/v1/customer-product-tier-pricing',
    CUSTOMERS: '/api/v1/customer-product-tier-pricing/customers',
    TIERS: (customerId: string, productType: string) =>
      `/api/v1/customer-product-tier-pricing/customers/${encodeURIComponent(customerId)}/products/${encodeURIComponent(productType)}/tiers`,
  },

  CHECK_IN_BATCH_EXCEPTION: {
    GET_BATCH_EXCEPTIONS: (batchId: string, unitId?: string) => {
      const baseUrl = `/api/v1/check-in-batch-exception-query/batch/${encodeURIComponent(batchId)}`;
      return unitId ? `${baseUrl}?unitId=${encodeURIComponent(unitId)}` : baseUrl;
    },
    GET_UNIT_ATTRIBUTES: (unitId: string, collDate: string | null) => {
      const baseUrl = `/api/v1/check-in-batch-exception-query/unit-attributes/${encodeURIComponent(unitId)}`;
      return collDate ? `${baseUrl}?collDate=${encodeURIComponent(collDate)}` : baseUrl;
    },
    GET_VALID_BATCHES: (search: string) =>
      `/api/v1/check-in-batch-exception-query/valid-batches${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  },

  RELEASE_RETURNED_PRODUCT_QUARANTINE: {
    HEADER: (returnAdviceId: string, warehouseId: string) =>
      `/api/v1/release-returned-product-quarantine/return-advices/${encodeURIComponent(returnAdviceId)}?warehouseId=${encodeURIComponent(warehouseId)}`,
    ITEMS: (take: number, skip: number, returnAdviceId?: string, warehouseId?: string) => {
      let url = `/api/v1/release-returned-product-quarantine/return-items?take=${take}&skip=${skip}&onlyUnmoved=true`;
      if (returnAdviceId) url += `&returnAdviceId=${encodeURIComponent(returnAdviceId)}`;
      if (warehouseId) url += `&warehouseId=${encodeURIComponent(warehouseId)}`;
      return url;
    },
    REJECT_CODES: '/api/v1/release-returned-product-quarantine/reject-codes',
    VALIDATE: '/api/v1/release-returned-product-quarantine/validate',
    PROCESS: '/api/v1/release-returned-product-quarantine/process',
  },

  // Standard Tier Pricing (MLT-14180)
  STANDARD_TIER_PRICING: {
    BASE: '/api/v1/standard-tier-pricing',
    PRODUCTS: '/api/v1/standard-tier-pricing/products',
    SEARCH: (take: number, skip: number) => `/api/v1/standard-tier-pricing/${take}/${skip}`,
    GET_BY_ID: (productType: string, tier: number) => `/api/v1/standard-tier-pricing/${encodeURIComponent(productType)}/${tier}`,
    CREATE: '/api/v1/standard-tier-pricing',
    UPDATE: (productType: string, tier: number) => `/api/v1/standard-tier-pricing/${encodeURIComponent(productType)}/${tier}`,
    DELETE: (productType: string, tier: number) => `/api/v1/standard-tier-pricing/${encodeURIComponent(productType)}/${tier}`,
  },

  LAB_WAREHOUSE_TRANSFER_QUERY: {
    BASE: '/api/v1/lab-warehouse-transfer-query',
    QUERY: (take: number, skip: number) => `/api/v1/lab-warehouse-transfer-query/${take}/${skip}`,
    HEADER: (batchId: string) => `/api/v1/lab-warehouse-transfer-query/header/${encodeURIComponent(batchId)}`,
    COMPLETE: (batchId: string) => `/api/v1/lab-warehouse-transfer-query/complete/${encodeURIComponent(batchId)}`,
    WAREHOUSES: '/api/v1/lab-warehouse-transfer-query/warehouses',
    BATCH_IDS: '/api/v1/lab-warehouse-transfer-query/batch-ids',
    STATUSES: '/api/v1/lab-warehouse-transfer-query/statuses',
  },

  PATHOGEN_REDUCTION: {
    LIST: (take: number, skip: number) =>
      `/api/v1/pathogen-reduction-config/${take}/${skip}`,
    GET_BY_ID: (volumeTypeSet: string) =>
      `/api/v1/pathogen-reduction-config/${encodeURIComponent(volumeTypeSet)}`,
    CREATE: '/api/v1/pathogen-reduction-config',
    UPDATE: (volumeTypeSet: string) =>
      `/api/v1/pathogen-reduction-config/${encodeURIComponent(volumeTypeSet)}`,
    VOLUME_TYPE_SETS: '/api/v1/pathogen-reduction-config/volume-type-sets',
    SUSPENSION_TYPES: '/api/v1/pathogen-reduction-config/suspension-types',
    EQUIPMENT_TYPES: '/api/v1/pathogen-reduction-config/equipment-types',
  },

  CONFIRMATORY_SAMPLE_TRANSFER_OUT: {
    GET_OPEN_BOXES: '/api/v1/confirmatory-sample-transfer-out/boxes/open',
    GET_BOX_DETAILS: (boxId: string) =>
      `/api/v1/confirmatory-sample-transfer-out/boxes/${encodeURIComponent(boxId)}`,
    CREATE_BOX: '/api/v1/confirmatory-sample-transfer-out/boxes',
    UPDATE_BOX: (boxId: string) =>
      `/api/v1/confirmatory-sample-transfer-out/boxes/${encodeURIComponent(boxId)}`,
    CLOSE_BOX: (boxId: string) =>
      `/api/v1/confirmatory-sample-transfer-out/boxes/${encodeURIComponent(boxId)}/close`,
    ADD_UNIT_TO_BOX: (boxId: string) =>
      `/api/v1/confirmatory-sample-transfer-out/boxes/${encodeURIComponent(boxId)}/units`,
    UPDATE_UNIT_IN_BOX: (boxId: string, sampleSeqNo: string) =>
      `/api/v1/confirmatory-sample-transfer-out/boxes/${encodeURIComponent(boxId)}/units/${encodeURIComponent(sampleSeqNo)}`,
    DELETE_UNIT_FROM_BOX: (boxId: string, sampleSeqNo: string) =>
      `/api/v1/confirmatory-sample-transfer-out/boxes/${encodeURIComponent(boxId)}/units/${encodeURIComponent(sampleSeqNo)}`,
    ADD_TEST_TO_SAMPLE: (sampleSeqNo: string) =>
      `/api/v1/confirmatory-sample-transfer-out/samples/${encodeURIComponent(sampleSeqNo)}/tests`,
    DELETE_TEST_FROM_SAMPLE: (sampleSeqNo: string, testId: string) =>
      `/api/v1/confirmatory-sample-transfer-out/samples/${encodeURIComponent(sampleSeqNo)}/tests/${encodeURIComponent(testId)}`,
    VALIDATE_UNIT: '/api/v1/confirmatory-sample-transfer-out/validate-unit',
    GET_FACILITIES: '/api/v1/confirmatory-sample-transfer-out/facilities',
    GET_SAMPLE_TYPES: '/api/v1/confirmatory-sample-transfer-out/sample-types',
    GET_FACILITY_TESTS: (facilityCode: string) =>
      `/api/v1/confirmatory-sample-transfer-out/facilities/${encodeURIComponent(facilityCode)}/tests`,
  },

  /**
   * Reagent Assignment API (MLT-13361)
   * Assign reagents to manual tests in test batches and generate worksheet reports
   * Base URL: /api/v1/reagent-assignment
   */
  REAGENT_ASSIGNMENT: {
    BASE: '/api/v1/reagent-assignment',
    /**
     * Get test batches with manual tests needing reagent assignment (LOV dropdown)
     * GET /api/v1/reagent-assignment/lov/test-batches
     */
    LOV_TEST_BATCHES: '/api/v1/reagent-assignment/lov/test-batches',
    /**
     * Get tests in a test batch needing reagent assignment
     * GET /api/v1/reagent-assignment/test-batches/{tbId}/tests
     */
    GET_TESTS: (tbId: string) =>
      `/api/v1/reagent-assignment/test-batches/${encodeURIComponent(tbId)}/tests`,
    /**
     * Assign a test kit (reagent) to a specific test
     * PUT /api/v1/reagent-assignment/test-batches/{tbId}/tests/{testId}/assign-reagent
     */
    ASSIGN_REAGENT: (tbId: string, testId: string) =>
      `/api/v1/reagent-assignment/test-batches/${encodeURIComponent(tbId)}/tests/${encodeURIComponent(testId)}/assign-reagent`,
    /**
     * Get units (blood donations) in a test batch
     * GET /api/v1/reagent-assignment/test-batches/{tbId}/units
     */
    GET_UNITS: (tbId: string) =>
      `/api/v1/reagent-assignment/test-batches/${encodeURIComponent(tbId)}/units`,
    /**
     * Queue worksheet report generation for selected tests
     * POST /api/v1/reagent-assignment/test-batches/{tbId}/generate-worksheet
     */
    GENERATE_WORKSHEET: (tbId: string) =>
      `/api/v1/reagent-assignment/test-batches/${encodeURIComponent(tbId)}/generate-worksheet`,
    PRINTABLE_TESTS: (tbId: string) =>
      `/api/v1/reagent-assignment/test-batches/${encodeURIComponent(tbId)}/printable-tests`,
    LOV_TEST_KITS: (tbId: string, testId: string) =>
      `/api/v1/reagent-assignment/test-batches/${encodeURIComponent(tbId)}/tests/${encodeURIComponent(testId)}/available-test-kits`,
  },
  PATHOGEN_REDUCTION_MANAGER: {
    BASE: '/api/v1/pathogen-reduction',
    DETAILS: (unitId: string) =>
      `/api/v1/pathogen-reduction/${encodeURIComponent(unitId)}`,
    PRODUCT_CATEGORIES: '/api/v1/pathogen-reduction/product-categories',
    CONFIG: '/api/v1/pathogen-reduction/config',
    SUSPENSION_TYPES: '/api/v1/pathogen-reduction/suspension-types',
    VOLUME_TYPE_SETS: '/api/v1/pathogen-reduction/volume-type-sets',
    EQUIPMENT_SERIAL_NUMBERS: (equipType: string) =>
      `/api/v1/pathogen-reduction/equipment-serial-numbers/${encodeURIComponent(equipType)}`,
    ILLUMINATOR_EQUIPMENT_TYPES: '/api/v1/pathogen-reduction/illuminator-equipment-types',
    STERILE_DOCKING_MACHINES: '/api/v1/pathogen-reduction/sterile-docking-machines',
    WAFER_LOT_NUMBERS: '/api/v1/pathogen-reduction/wafer-lot-numbers',
    SET_LOT_NUMBERS: (volumeTypeSet: string) =>
      `/api/v1/pathogen-reduction/set-lot-numbers/${encodeURIComponent(volumeTypeSet)}`,
    STATUS: '/api/v1/pathogen-reduction/status',
    CHECK_SUITABILITY: '/api/v1/pathogen-reduction/check-suitability',
    SUITABILITY: '/api/v1/pathogen-reduction/suitability',
    STERILE_DOCKING: '/api/v1/pathogen-reduction/sterile-docking',
    INTERMEDIATE_PROCESS: '/api/v1/pathogen-reduction/intermediate-process',
    FINAL_TRANSFER: '/api/v1/pathogen-reduction/final-transfer',
    FINAL_PRODUCTS: '/api/v1/pathogen-reduction/final-products',
  },

  FIND_UNITS_PRODUCTS: {
    SEARCH: '/api/v1/find-units-and-products/search',
    PRODUCT_TYPES: '/api/v1/find-units-and-products/product-types',
    ATTRIBUTE_GROUPS: '/api/v1/find-units-and-products/attribute-groups',
    ATTRIBUTES: '/api/v1/find-units-and-products/attributes',
    BLOOD_TYPES: '/api/v1/find-units-and-products/blood-types',
  },

  PACK_PRODUCTS: {
    BASE: '/api/v1/pack-products',
    ORDERS: '/api/v1/pack-products/orders',
    ORDERS_SEARCH: '/api/v1/pack-products/orders/search',
    ORDER_DETAILS: (orderNo: string) =>
      `/api/v1/pack-products/orders/${encodeURIComponent(orderNo)}`,
    ORDER_ITEMS: (orderNo: string) =>
      `/api/v1/pack-products/orders/${encodeURIComponent(orderNo)}/items`,
    ORDER_PICK_SLIPS: (orderNo: string) =>
      `/api/v1/pack-products/orders/${encodeURIComponent(orderNo)}/pick-slips`,
    ACTIVE_BOXES: '/api/v1/pack-products/boxes/active',
    BOX_TYPES: '/api/v1/pack-products/box-types',
    CREATE_BOX: '/api/v1/pack-products/boxes',
    CLOSE_BOX: (boxId: string) =>
      `/api/v1/pack-products/boxes/${encodeURIComponent(boxId)}/close`,
    BOX_CONTENTS: (boxId: string) =>
      `/api/v1/pack-products/boxes/${encodeURIComponent(boxId)}/contents`,
    PACK: '/api/v1/pack-products/pack',
    UNPACK: '/api/v1/pack-products/unpack',
    QUARANTINE: '/api/v1/pack-products/quarantine',
    PACKED_PRODUCTS: (pickSlipId: string) =>
      `/api/v1/pack-products/pick-slips/${encodeURIComponent(pickSlipId)}/products`,
    PACK_STATUS: (pickSlipId: string) =>
      `/api/v1/pack-products/pack-status/${encodeURIComponent(pickSlipId)}`,
    VALIDATE_UNIT: '/api/v1/pack-products/validate-unit',
    VALIDATE_EXPIRY: '/api/v1/pack-products/validate-expiry',
    UNIT_EXPIRY: (unitId: string) => `/api/v1/pack-products/units/${encodeURIComponent(unitId)}/expiry`,
  },

  PACK_INV_REJECTS_TO_DISCARD: {
    BASE: '/api/pack-inv-rejects-to-discard',
    CONSIGNEES: '/api/pack-inv-rejects-to-discard/consignees',
    ORDERS: '/api/pack-inv-rejects-to-discard/orders',
    PRODUCT_TYPES: '/api/pack-inv-rejects-to-discard/product-types',
    BOXES: '/api/pack-inv-rejects-to-discard/boxes',
    AVAILABLE_PRODUCTS: '/api/pack-inv-rejects-to-discard/available-products',
    VALIDATE_UNIT: '/api/pack-inv-rejects-to-discard/validate-unit',
    PACK_PRODUCT: '/api/pack-inv-rejects-to-discard/pack-product',
    UNPACK_PRODUCT: '/api/pack-inv-rejects-to-discard/unpack-product',
    BOX_CONTENTS: (boxId: string) =>
      `/api/pack-inv-rejects-to-discard/box-contents/${encodeURIComponent(boxId)}`,
    CLOSE_BOX: '/api/pack-inv-rejects-to-discard/close-box',
  },

  CONFIRMATORY_EXTRACTION: {
    BASE: '/api/v1/confirmatory-extraction',
    EXTRACT_IDS: '/api/v1/confirmatory-extraction/extract-ids',
    CONTRACTS: (extractId: string) => `/api/v1/confirmatory-extraction/contracts/${encodeURIComponent(extractId)}`,
    UNITS: '/api/v1/confirmatory-extraction/units',
    SCHEDULE_EXTRACTION: '/api/v1/confirmatory-extraction/schedule-extraction',
    EXECUTE_EXTRACTION: '/api/v1/confirmatory-extraction/execute-extraction'
  },

  ODTOFF: {
    ACTIVE_PICK_SLIPS: '/api/v1/removal-from-outdate-list/pick-slips/active',
    PICK_SLIP_SUMMARY: (pickSlipId: string) =>
      `/api/v1/removal-from-outdate-list/pick-slips/${encodeURIComponent(pickSlipId)}`,
    PICK_SLIP_PRODUCTS: (pickSlipId: string) =>
      `/api/v1/removal-from-outdate-list/pick-slips/${encodeURIComponent(pickSlipId)}/products`,
    PICK_SLIP_PRODUCTS_PAGED: (pickSlipId: string, take: number, skip: number, sortColumn?: string | null, sortOrder?: string | null) => {
      const base = `/api/v1/removal-from-outdate-list/pick-slips/${encodeURIComponent(pickSlipId)}/products/${take}/${skip}`;
      const params: string[] = [];
      if (sortColumn) params.push(`sortColumn=${encodeURIComponent(sortColumn)}`);
      if (sortOrder) params.push(`sortOrder=${encodeURIComponent(sortOrder)}`);
      return params.length > 0 ? `${base}?${params.join('&')}` : base;
    },
    REMOVE_PRODUCT: '/api/v1/removal-from-outdate-list/remove-product',
  },

  PRODUCTS_WITH_ANTIGENS: {
    SEARCH: '/api/v1/products-with-antigens/search',
    DROPDOWNS: {
      PRODUCT_TYPES: '/api/v1/products-with-antigens/dropdowns/product-types',
      ABO_RH_TYPES: '/api/v1/products-with-antigens/dropdowns/abo-rh-types',
      INVENTORY_CLASSES: '/api/v1/products-with-antigens/dropdowns/inventory-classes',
      ANTIGEN_GROUPS: '/api/v1/products-with-antigens/dropdowns/antigen-groups',
      WAREHOUSES: '/api/v1/products-with-antigens/dropdowns/warehouses',
      VALID_ANTIGENS: '/api/v1/products-with-antigens/dropdowns/valid-antigens',
    },
    ANTIGEN_GROUP_DETAIL: (groupCode: string) =>
      `/api/v1/products-with-antigens/antigen-groups/${encodeURIComponent(groupCode)}/detail`,
  },

  PRODUCTS_IN_QUARANTINE: {
    BASE: '/api/v1/products-in-quarantine',
    GET_PRODUCTS: (quarantineType?: string | null, take?: number, skip?: number) => {
      const params: string[] = [];
      if (quarantineType) params.push(`quarantineType=${encodeURIComponent(quarantineType)}`);
      if (take !== undefined) params.push(`take=${take}`);
      if (skip !== undefined) params.push(`skip=${skip}`);
      return `/api/v1/products-in-quarantine${params.length > 0 ? '?' + params.join('&') : ''}`;
    },
    QUARANTINE_TYPES: '/api/v1/products-in-quarantine/quarantine-types',
  },

  /**
   * Correct Imported Unit Data endpoints
   * JIRA: MLT-12626, MLT-12628
   * Mnemonic: IMPCORR
   * Form: IMUUNITS
   */
  CORRECT_IMPORTED_UNITS: {
    BASE: '/api/v1/correct-imported-units',
    GET_ALL: (take: number, skip: number) =>
      `/api/v1/correct-imported-units/${take}/${skip}`,
    GET_BY_ID: (unitId: string, chapterId: string, productCode: string, attribGroup: string, attribCode: string) =>
      `/api/v1/correct-imported-units/${encodeURIComponent(unitId)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    CREATE: '/api/v1/correct-imported-units',
    UPDATE: (unitId: string, chapterId: string, productCode: string, attribGroup: string, attribCode: string) =>
      `/api/v1/correct-imported-units/${encodeURIComponent(unitId)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    DELETE: (unitId: string, chapterId: string, productCode: string, attribGroup: string, attribCode: string) =>
      `/api/v1/correct-imported-units/${encodeURIComponent(unitId)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    ATTRIBUTE_GROUPS: '/api/v1/correct-imported-units/attribute-groups',
    ATTRIBUTE_CODES: (attribGroup: string) =>
      `/api/v1/correct-imported-units/attribute-codes/${encodeURIComponent(attribGroup)}`,
    CONTRACTS: '/api/v1/correct-imported-units/contracts',
    PRODUCT_CODES: (unitId: string) =>
      `/api/v1/correct-imported-units/product-codes/${encodeURIComponent(unitId)}`,
    CODE_SCHEME: (unitId: string) =>
      `/api/v1/correct-imported-units/code-scheme/${encodeURIComponent(unitId)}`,
    ABO_LABELS: (codeScheme: string) =>
      `/api/v1/correct-imported-units/abo-labels?codeScheme=${encodeURIComponent(codeScheme)}`,
    VALID_PRODUCT_CODES: (codeScheme: string, productType: string) =>
      `/api/v1/correct-imported-units/valid-product-codes?codeScheme=${encodeURIComponent(codeScheme)}&productType=${encodeURIComponent(productType)}`,
    SAVE: '/api/v1/correct-imported-units/save',
  },

  EQUIPMENT_EVENTS: {
    BASE: '/api/v1/equipment-events',
    BY_ID: (eventReference: string) =>
      `/api/v1/equipment-events/${encodeURIComponent(eventReference)}`,
    BY_EQUIPMENT: (equipReference: string) =>
      `/api/v1/equipment-events/equipment/${encodeURIComponent(equipReference)}`,
    CREATE: '/api/v1/equipment-events',
    UPDATE: (eventReference: string) =>
      `/api/v1/equipment-events/${encodeURIComponent(eventReference)}`,
    DELETE: (eventReference: string) =>
      `/api/v1/equipment-events/${encodeURIComponent(eventReference)}`,
    SEARCH: (take: number, skip: number) =>
      `/api/v1/equipment-events/${take}/${skip}`,
    // LOV endpoints - Gap fix for MLT-12631
    EQUIPMENT_TYPES: '/api/v1/equipment-events/equipment-types',
    EQUIPMENT_LIST: (equipmentType: string) =>
      `/api/v1/equipment-events/equipment-list/${encodeURIComponent(equipmentType)}`,
    DOWNTIME_CODES: '/api/v1/equipment-events/downtime-codes',
    SERVICE_CODES: '/api/v1/equipment-events/service-codes',
  },

  DISTRIBUTION: {
    REGENERATE_PLASMA_FILE: {
      BASE: '/api/v1/plasma-file-regeneration',
      PENDING_SHIPMENTS: '/api/v1/plasma-file-regeneration/pending-shipments',
      SHIPMENT_DETAILS: (shipmentNo: string) =>
        `/api/v1/plasma-file-regeneration/shipment/${encodeURIComponent(shipmentNo)}`,
      CARRIERS: '/api/v1/plasma-file-regeneration/carriers',
      REGENERATE: '/api/v1/plasma-file-regeneration/regenerate',
    },
    // Ship Discard and Salvage Products (MLT-14007)
    SHIP_DISCARD_SALVAGE: {
      BASE: '/api/v1/ship-discard-salvage',
      GET_SHIPMENTS: '/api/v1/ship-discard-salvage/shipments',
      GET_SHIPMENT_BY_ID: (shipmentNo: string) =>
        `/api/v1/ship-discard-salvage/shipments/${encodeURIComponent(shipmentNo)}`,
      CREATE_SHIPMENT: '/api/v1/ship-discard-salvage/shipments',
      ADD_BOX_TO_SHIPMENT: (shipmentNo: string) =>
        `/api/v1/ship-discard-salvage/shipments/${encodeURIComponent(shipmentNo)}/boxes`,
      GET_BOXES_FOR_CONSIGNEE: (consigneeId: string) =>
        `/api/v1/ship-discard-salvage/consignees/${encodeURIComponent(consigneeId)}/boxes`,
      GET_CARRIERS: '/api/v1/ship-discard-salvage/carriers',
      GET_CONSIGNEES: '/api/v1/ship-discard-salvage/consignees',
      REMOVE_BOX: (shipmentNo: string, boxId: string) =>
        `/api/v1/ship-discard-salvage/shipments/${encodeURIComponent(shipmentNo)}/boxes/${encodeURIComponent(boxId)}`,
      GET_SHIPMENT_PRODUCTS: (shipmentNo: string) =>
        `/api/v1/ship-discard-salvage/shipments/${encodeURIComponent(shipmentNo)}/products`,
      GET_ZONE_CONSIGNEES: (consigneeId: string) =>
        `/api/v1/ship-discard-salvage/consignees/${encodeURIComponent(consigneeId)}/zone-peers`,
      GET_SHIPMENT_CHARGES: (shipmentNo: string) =>
        `/api/v1/ship-discard-salvage/shipments/${encodeURIComponent(shipmentNo)}/charges`,
      ADD_SHIPMENT_CHARGE: (shipmentNo: string) =>
        `/api/v1/ship-discard-salvage/shipments/${encodeURIComponent(shipmentNo)}/charges`,
      DELETE_SHIPMENT_CHARGE: (shipmentNo: string, chargeCode: string, orderNo: string) =>
        `/api/v1/ship-discard-salvage/shipments/${encodeURIComponent(shipmentNo)}/charges/${encodeURIComponent(chargeCode)}/${encodeURIComponent(orderNo)}`,
      GET_CHARGE_CODES: '/api/v1/ship-discard-salvage/charge-codes',
      GET_CREDIT_DEBIT_TYPES: '/api/v1/ship-discard-salvage/credit-debit-types',
    },
    CLOSE_HOSPITAL_TRANSFER: {
      OPEN_SLIPS: '/api/v1/close-hospital-transfer/open',
      PRODUCTS: (pickSlipId: string) =>
        `/api/v1/close-hospital-transfer/${encodeURIComponent(pickSlipId)}/products`,
      CLOSE: '/api/v1/close-hospital-transfer/close',
      PRODUCT_CODE_LOV: '/api/v1/close-hospital-transfer/product-code-lov',
      ALIQUOT_LOV: '/api/v1/close-hospital-transfer/aliquot-lov',
      ABO_LOV: '/api/v1/close-hospital-transfer/abo-lov',
    },
  },

  COMPONENT_PRODUCTION: {
    PRODUCT_CODES: {
      PRODUCT_TYPES_LOV: '/api/v1/lab/product-types/lov',
      PRODUCT_CLASSES: '/api/v1/lab/product-types/product-classes',
      MODIFIERS: '/api/v1/lab/product-types/modifiers',
      INVENTORY_CLASSES: '/api/v1/lab/product-types/inventory-classes',
    },
  },

  EDIT_TEST_RESULTS: {
    BASE: '/api/v1/edit-test-results',
    VALIDATE_UNIT: (unitId: string) => `/api/v1/edit-test-results/validation/unit/${encodeURIComponent(unitId)}`,
    EDITABLE_TESTS: (unitId: string, testId?: string) =>
      `/api/v1/edit-test-results/editable-tests/${encodeURIComponent(unitId)}${testId ? `?testId=${encodeURIComponent(testId)}` : ''}`,
    EDITABLE_TESTS_DROPDOWN: (unitId: string) => `/api/v1/edit-test-results/editable-tests-dropdown/${encodeURIComponent(unitId)}`,
    UPDATE_TEST_RESULT: (unitId: string, testId: string) =>
      `/api/v1/edit-test-results/unit/${encodeURIComponent(unitId)}/test/${encodeURIComponent(testId)}`,
    EDIT_REASON_CODES: '/api/v1/edit-test-results/edit-reason-codes',
    VALID_RESULTS: (testId: string) => `/api/v1/edit-test-results/valid-results/${encodeURIComponent(testId)}`,
    COLLECTION_DATES: (unitId: string) => `/api/v1/edit-test-results/collection-dates/${encodeURIComponent(unitId)}`,
    CALCULATE_ALT_RESULT: '/api/v1/edit-test-results/calculate-alt-result',
  },

  // Edit Test Observation Results (MLT-12786)
  TEST_OBSERVATION: {
    BASE: '/api/v1/edit-test-observation-results',
    GET: (unitId: string, params: { testChapterId: string; testId: string; tbId: string; tbSeqNo: number }) =>
      `/api/v1/edit-test-observation-results/${encodeURIComponent(unitId)}?testChapterId=${encodeURIComponent(params.testChapterId)}&testId=${encodeURIComponent(params.testId)}&tbId=${encodeURIComponent(params.tbId)}&tbSeqNo=${params.tbSeqNo}`,
    SAVE_ALL: (unitId: string, testChapterId: string, testId: string, tbId: string, tbSeqNo: number) =>
      `/api/v1/edit-test-observation-results/save-all/${encodeURIComponent(unitId)}/${encodeURIComponent(testChapterId)}/${encodeURIComponent(testId)}/${encodeURIComponent(tbId)}/${tbSeqNo}`,
    LOOKUP_TEST_IDS: (unitId: string) =>
      `/api/v1/edit-test-observation-results/lookups/test-ids?unitId=${encodeURIComponent(unitId)}`,
    LOOKUP_TEST_BATCHES: (unitId: string, testId: string) =>
      `/api/v1/edit-test-observation-results/lookups/test-batches?unitId=${encodeURIComponent(unitId)}&testId=${encodeURIComponent(testId)}`,
    LOOKUP_BAND_VALUES: (testId: string) =>
      `/api/v1/edit-test-observation-results/lookups/band-values?testId=${encodeURIComponent(testId)}`,
    LOOKUP_RESULT_CODES: (testId: string) =>
      `/api/v1/edit-test-observation-results/lookups/result-codes?testId=${encodeURIComponent(testId)}`,
    LOOKUP_EDIT_REASONS: () =>
      `/api/v1/edit-test-observation-results/lookups/edit-reasons`,
    LOOKUP_CHECK_DIGIT: (unitId: string) =>
      `/api/v1/edit-test-observation-results/lookups/check-digit?unitId=${encodeURIComponent(unitId)}`,
    NOTES_GET: (unitId: string, testChapterId: string, testId: string, tbId: string, tbSeqNo: number) =>
      `/api/v1/edit-test-observation-results/notes/${encodeURIComponent(unitId)}/${encodeURIComponent(testChapterId)}/${encodeURIComponent(testId)}/${encodeURIComponent(tbId)}/${tbSeqNo}`,
    NOTES_CREATE: (unitId: string, testChapterId: string, testId: string, tbId: string, tbSeqNo: number) =>
      `/api/v1/edit-test-observation-results/notes/${encodeURIComponent(unitId)}/${encodeURIComponent(testChapterId)}/${encodeURIComponent(testId)}/${encodeURIComponent(tbId)}/${tbSeqNo}`,
    NOTES_UPDATE: (noteId: number) =>
      `/api/v1/edit-test-observation-results/notes/${noteId}`,
    NOTES_DELETE: (noteId: number) =>
      `/api/v1/edit-test-observation-results/notes/${noteId}`,
    DELETE_OTHER_BAND: (unitId: string, testChapterId: string, testId: string, tbId: string, tbSeqNo: number, tech: string) =>
      `/api/v1/edit-test-observation-results/other-bands/${encodeURIComponent(unitId)}/${encodeURIComponent(testChapterId)}/${encodeURIComponent(testId)}/${encodeURIComponent(tbId)}/${tbSeqNo}/${encodeURIComponent(tech)}`,
  },

  EXTRACT_TEST_RESULTS: {
    BASE: '/api/v1/extract-test-results',
    CONTRACTS: '/api/v1/extract-test-results/contracts',
    BATCHES: (take: number, skip: number) => `/api/v1/extract-test-results/batches/${take}/${skip}`,
    UNITS: (take: number, skip: number) => `/api/v1/extract-test-results/units/${take}/${skip}`,
    CREATE_EXTRACTION: '/api/v1/extract-test-results',
  },
  SKIP_CONFIRMATORY_RESULTS: {
    BASE: '/api/v1/skip-confirmatory-results',
    TESTS: '/api/v1/skip-confirmatory-results/tests',
    CONTRACTS: '/api/v1/skip-confirmatory-results/contracts',
    SKIP_OPTIONS: '/api/v1/skip-confirmatory-results/skip-options',
    TEST_BATCHES: '/api/v1/skip-confirmatory-results/test-batches',
    REASON_CODES: '/api/v1/skip-confirmatory-results/reason-codes',
    SEARCH: (take: number, skip: number) =>
      `/api/v1/skip-confirmatory-results/${take}/${skip}`,
    SKIP: '/api/v1/skip-confirmatory-results/skip',
    RESET: '/api/v1/skip-confirmatory-results/reset',
    UNIT_TEST_DETAILS: '/api/v1/skip-confirmatory-results/unit-test-details',
  },

  // Release Test Results (RGIRESQC) - Laboratory QC test release for reagent batches
  RELEASE_TEST_RESULTS: {
    BASE: '/api/v1/laboratory/release-test-results',
    SEARCH: '/api/v1/laboratory/release-test-results/search',
    AUTO_DETERMINE_QC_FLAGS: '/api/v1/laboratory/release-test-results/auto-determine-qc-flags',
    RELEASE: '/api/v1/laboratory/release-test-results/release',
    // TODO: Add these endpoints when implemented on backend
    // CONTRACTS: '/api/v1/laboratory/release-test-results/contracts',
    // BATCHES: (contractId: string) => `/api/v1/laboratory/release-test-results/batches/${encodeURIComponent(contractId)}`,
    // TEST_RESULTS: (unitId: string, collDate: string) => `/api/v1/laboratory/release-test-results/test-results/${encodeURIComponent(unitId)}?collDate=${encodeURIComponent(collDate)}`,

  },
  // Pack Inventory Rejects to Salvage (DSIPKOD)
  PACK_INV_REJECTS_TO_SALVAGE: {
    BASE: '/api/v1/pack-inv-rejects-to-salvage',
    CONSIGNEES: '/api/v1/pack-inv-rejects-to-salvage/consignees',
    ORDERS: '/api/v1/pack-inv-rejects-to-salvage/orders',
    PRODUCT_TYPES: '/api/v1/pack-inv-rejects-to-salvage/product-types',
    OPEN_BOXES: '/api/v1/pack-inv-rejects-to-salvage/open-boxes',
    PRODUCT_CODES: '/api/v1/pack-inv-rejects-to-salvage/product-codes',
    ALIQUOTS: '/api/v1/pack-inv-rejects-to-salvage/aliquots',
    BLOOD_TYPES: '/api/v1/pack-inv-rejects-to-salvage/blood-types',
    DISCARD_PRODUCTS: (take: number, skip: number) => `/api/v1/pack-inv-rejects-to-salvage/discard-products/${take}/${skip}`,
    BOX_CONTENTS: (boxId: string) => `/api/v1/pack-inv-rejects-to-salvage/box-contents/${encodeURIComponent(boxId)}`,
    PACK_PRODUCT: '/api/v1/pack-inv-rejects-to-salvage/pack-product',
    CLOSE_BOX: '/api/v1/pack-inv-rejects-to-salvage/close-box',
    CREATE_NEW_BOX: '/api/v1/pack-inv-rejects-to-salvage/create-new-box',
  },

  // Pack Lab Discards to Discard (MLT-14011)
  PACK_LAB_DISCARDS: {
    BASE: '/api/v1/pack-lab-discards',
    CONSIGNEES: '/api/v1/pack-lab-discards/consignees',
    ORDERS: (consigneeId: string) => `/api/v1/pack-lab-discards/orders/${encodeURIComponent(consigneeId)}`,
    PRODUCT_TYPES: '/api/v1/pack-lab-discards/product-types',
    DISCARD_TYPES: '/api/v1/pack-lab-discards/discard-types',
    BOXES: (consigneeId: string) => `/api/v1/pack-lab-discards/boxes?consigneeId=${encodeURIComponent(consigneeId)}`,
    TEST_IDS: '/api/v1/pack-lab-discards/test-ids',
    BOX_CONTENTS: (boxId: string) => `/api/v1/pack-lab-discards/boxes/${encodeURIComponent(boxId)}/contents`,
    AVAILABLE_PRODUCTS: '/api/v1/pack-lab-discards/available-products',
    UNIT_PRODUCTS: (unitId: string) => `/api/v1/pack-lab-discards/units/${encodeURIComponent(unitId)}/products`,
    PACK: '/api/v1/pack-lab-discards/pack',
    CLOSE_BOX: (boxId: string) => `/api/v1/pack-lab-discards/boxes/${encodeURIComponent(boxId)}/close`,
    UNPACK: (unitId: string, productCode: string, aliquot?: string) =>
      aliquot
        ? `/api/v1/pack-lab-discards/unpack/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}`
        : `/api/v1/pack-lab-discards/unpack/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
  },


  // Multiple Observation Test Types by MFG (MLT-13349)
  TEST_TYPES: {
    BASE: '/api/v1/test-types',
    GET_ALL: (testId: string) => `/api/v1/test-types/${encodeURIComponent(testId)}`,
    GET_BY_ID: (testId: string, testType: string) =>
      `/api/v1/test-types/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`,
    CREATE: '/api/v1/test-types',
    UPDATE: (testId: string, testType: string) =>
      `/api/v1/test-types/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`,
    DELETE: (testId: string, testType: string) =>
      `/api/v1/test-types/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`,
    LOOKUP_TESTS: '/api/v1/test-types/tests/lookup',
    LOOKUP_TEST_DESC: (testId: string) =>
      `/api/v1/test-types/tests/${encodeURIComponent(testId)}/description`,
    LOOKUP_CONTROL_VALUES: (testId: string) =>
      `/api/v1/test-types/default-control-values/${encodeURIComponent(testId)}`,
  },

  ADDITIONAL_TEST_SCHEDULING: {
    GET_TESTS: (take: number, skip: number) =>
      `/api/v1/additional-confirmatory-test-scheduled/${take}/${skip}`,
    GET_TEST_BY_ID: (testId: string) =>
      `/api/v1/additional-confirmatory-test-scheduled/${encodeURIComponent(testId)}`,
    GET_TEST_GROUPS: (screenMode: string) =>
      `/api/v1/additional-confirmatory-test-scheduled/lookup/test-groups?screenMode=${screenMode}`,
    GET_SAMPLE_TYPES: '/api/v1/additional-confirmatory-test-scheduled/lookup/sample-types',
    VALIDATE_UNIT: '/api/v1/additional-confirmatory-test-scheduled/validate-unit',
    GET_EXISTING_TESTS: '/api/v1/additional-confirmatory-test-scheduled/existing-tests',
    SCHEDULE: '/api/v1/additional-confirmatory-test-scheduled/schedule',
    SCC_STATUS: '/api/v1/additional-confirmatory-test-scheduled/scc-status',
    SCC_SAMPLE_TYPE: '/api/v1/additional-confirmatory-test-scheduled/scc-sample-type',
    SCC_OVERRIDE: '/api/v1/additional-confirmatory-test-scheduled/scc-override',
    GET_MASTER_CODES: (codeType: string, chapterId?: string) =>
      `/api/v1/additional-confirmatory-test-scheduled/lookup/master-codes?codeType=${encodeURIComponent(codeType)}${chapterId ? `&chapterId=${encodeURIComponent(chapterId)}` : ''}`,
  },

  // Additional Confirmatory Test Scheduled (MLT-13535, MLT-13536)
  ADDITIONAL_CONFIRMATORY_TEST_SCHEDULED: {
    BASE: '/api/v1/additional-confirmatory-test-scheduled',
    GET_BY_ID: (testId: string) =>
      `/api/v1/additional-confirmatory-test-scheduled/${encodeURIComponent(testId)}`,
    LOOKUP_TEST_GROUPS: '/api/v1/additional-confirmatory-test-scheduled/lookup/test-groups',
    LOOKUP_SAMPLE_TYPES: '/api/v1/additional-confirmatory-test-scheduled/lookup/sample-types',
  },

  ANTIGEN_RESULT_ENTRY: {
    BASE: '/api/v1/antigen-result-entry',
    WORKSHEETS: '/api/v1/antigen-result-entry/worksheets',
    VALIDATE_WORKSHEET: (tbId: string) =>
      `/api/v1/antigen-result-entry/validate-worksheet/${encodeURIComponent(tbId)}`,
    PENDING_UNITS: (tbId: string) =>
      `/api/v1/antigen-result-entry/worksheets/${encodeURIComponent(tbId)}/pending-units`,
    UNIT_TESTS: (tbId: string, unitId: string) =>
      `/api/v1/antigen-result-entry/worksheets/${encodeURIComponent(tbId)}/units/${encodeURIComponent(unitId)}/tests`,
    VALID_RESULTS: (testId: number | string) =>
      `/api/v1/antigen-result-entry/valid-results/${encodeURIComponent(testId)}`,
    SUBMIT_RESULTS: '/api/v1/antigen-result-entry/submit-results',
    CLOSE_WORKSHEET: (tbId: string) =>
      `/api/v1/antigen-result-entry/worksheets/${encodeURIComponent(tbId)}/close`,
    PENDING_COUNT: (tbId: string) =>
      `/api/v1/antigen-result-entry/pending-count/${encodeURIComponent(tbId)}`,
  },

  // Imported Blood Product Check-In (MLT-12611 / IMCHKIN)
  IMPORTED_BLOOD_CHECKIN: {
    // LOV / Dropdowns
    LOV_CONTRACTS: '/api/v1/imported-blood-checkin/lov/contracts',
    LOV_PRODUCT_TYPES: '/api/v1/imported-blood-checkin/lov/product-types',
    LOV_ABO_VALUES: '/api/v1/imported-blood-checkin/lov/abo-values',
    LOV_ATTRIBUTE_GROUPS: '/api/v1/imported-blood-checkin/lov/attribute-groups',
    LOV_ATTRIBUTE_CODES: '/api/v1/imported-blood-checkin/lov/attribute-codes',

    // Batch operations
    CREATE_BATCH: '/api/v1/imported-blood-checkin/batches',
    GET_BATCH: (batchId: string) =>
      `/api/v1/imported-blood-checkin/batches/${encodeURIComponent(batchId)}`,
    GET_BATCHES: (take: number, skip: number) =>
      `/api/v1/imported-blood-checkin/batches/${take}/${skip}`,
    GET_CONTRACT_TESTS: (contractId: string) =>
      `/api/v1/imported-blood-checkin/contracts/${encodeURIComponent(contractId)}/tests`,

    // Carton operations
    ADD_CARTONS: (batchId: string, expectedCount: number) =>
      `/api/v1/imported-blood-checkin/batches/${encodeURIComponent(batchId)}/cartons?expectedCount=${expectedCount}`,
    GET_CARTONS: (batchId: string) =>
      `/api/v1/imported-blood-checkin/batches/${encodeURIComponent(batchId)}/cartons`,

    // Barcode validation
    VALIDATE_UNIT_ID: '/api/v1/imported-blood-checkin/validate/unit-id',
    VALIDATE_PRODUCT_CODE: '/api/v1/imported-blood-checkin/validate/product-code',

    // Component operations
    CHECK_IN_COMPONENT: '/api/v1/imported-blood-checkin/components',
    GET_COMPONENT: (unitId: string) =>
      `/api/v1/imported-blood-checkin/components/${encodeURIComponent(unitId)}`,
    GET_COMPONENTS_BY_BATCH: (batchId: string, take: number, skip: number) =>
      `/api/v1/imported-blood-checkin/batches/${encodeURIComponent(batchId)}/components/${take}/${skip}`,
    UPDATE_COMPONENT_STATUS: (unitId: string) =>
      `/api/v1/imported-blood-checkin/components/${encodeURIComponent(unitId)}/status`,

    // Component attributes
    GET_COMPONENT_ATTRIBUTES: (unitId: string) =>
      `/api/v1/imported-blood-checkin/components/${encodeURIComponent(unitId)}/attributes`,
    ADD_COMPONENT_ATTRIBUTES: (unitId: string) =>
      `/api/v1/imported-blood-checkin/components/${encodeURIComponent(unitId)}/attributes`,
    UPDATE_COMPONENT_ATTRIBUTES: (unitId: string) =>
      `/api/v1/imported-blood-checkin/components/${encodeURIComponent(unitId)}/attributes`,

    // Product codes LOV
    LOV_PRODUCT_CODES: '/api/v1/imported-blood-checkin/lov/product-codes',
    VALIDATE_PRODUCT_CODE_FIELD: '/api/v1/imported-blood-checkin/validate-product-code-field',

    // Unit ID checks (postValidate)
    CHECK_DUPLICATE_EXTERNAL_UNIT: '/api/v1/imported-blood-checkin/check-duplicate-external-unit',
    CHECK_UNIT_CONTRACT_CONFLICT: '/api/v1/imported-blood-checkin/check-unit-contract-conflict',

  },

  // Imported Product Check-In Lookups (MLT-12611 / IMCHKIN)
  IMPORTED_PRODUCT_CHECKIN: {
    // Lookup operations
    GET_CONTRACTS: '/api/v1/imported-product-checkin/contracts/dropdown',
    GET_PRODUCTS_FOR_CONTRACT: (contractId: string) =>
      `/api/v1/imported-product-checkin/contracts/${encodeURIComponent(contractId)}/product-codes`,

    // Batch operations (paginated query)
    QUERY_BATCHES: (take: number, skip: number) => `/api/v1/imported-product-checkin/batches/${take}/${skip}`,
    GET_BATCH_BY_ID: (batchId: string, contractId: string) =>
      `/api/v1/imported-product-checkin/batches/${encodeURIComponent(batchId)}/${encodeURIComponent(contractId)}`,
    CREATE_BATCH: '/api/v1/imported-product-checkin/batches',
    UPDATE_BATCH: (batchId: string, contractId: string) =>
      `/api/v1/imported-product-checkin/batches/${encodeURIComponent(batchId)}/${encodeURIComponent(contractId)}`,
    DELETE_BATCH: (batchId: string, contractId: string) =>
      `/api/v1/imported-product-checkin/batches/${encodeURIComponent(batchId)}/${encodeURIComponent(contractId)}`,

    // Component operations
    GET_COMPONENTS_BY_BATCH: (batchId: string, contractId: string, take: number, skip: number) =>
      `/api/v1/imported-product-checkin/components/batch/${encodeURIComponent(batchId)}/${encodeURIComponent(contractId)}/${take}/${skip}`,
    GET_COMPONENT_BY_ID: (unitId: string) => `/api/v1/imported-product-checkin/components/${encodeURIComponent(unitId)}`,
    CREATE_COMPONENT: '/api/v1/imported-product-checkin/components',
    UPDATE_COMPONENT: (unitId: string) => `/api/v1/imported-product-checkin/components/${encodeURIComponent(unitId)}`,
    DELETE_COMPONENT: (unitId: string) => `/api/v1/imported-product-checkin/components/${encodeURIComponent(unitId)}`,

    // Validation
    VALIDATE_UNIT_ID: '/api/v1/imported-product-checkin/validate-unit-id',
  },

  // All Tests for Unit Query (MLT-13511) - Testing Modules / Testing Queries
  ALL_TESTS_FOR_UNIT: {
    BASE: '/api/v1/all-tests-for-unit',
    SEARCH: '/api/v1/all-tests-for-unit/search',
    UNSCHEDULED_SEARCH: '/api/v1/all-tests-for-unit/unscheduled/search',
    TEST_CODES: (unitId: string) => `/api/v1/all-tests-for-unit/${encodeURIComponent(unitId)}/test-codes`,
    UTRS_TESTS: (unitId: string, collDate?: string, chapterId?: string) => {
      const baseUrl = `/api/v1/all-tests-for-unit/utrs/${encodeURIComponent(unitId)}`;
      const params: string[] = [];
      if (collDate) params.push(`collDate=${encodeURIComponent(collDate)}`);
      if (chapterId) params.push(`chapterId=${encodeURIComponent(chapterId)}`);
      return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
    },
    UNIT_TEST_BASE: (unitId: string, chapterId?: string) => {
      const baseUrl = `/api/v1/all-tests-for-unit/unit-test-base/${encodeURIComponent(unitId)}`;
      return chapterId ? `${baseUrl}?chapterId=${encodeURIComponent(chapterId)}` : baseUrl;
    },
  },

  // Shipment Delivery Confirmation (MLT-14006)
  SHIPMENT_DELIVERY: {
    BASE: '/api/v1/shipment-delivery',
    UNDELIVERED_SHIPMENTS: '/api/v1/shipment-delivery/undelivered-shipments',
    GET_DETAILS: (shipmentNo: string) => `/api/v1/shipment-delivery/${encodeURIComponent(shipmentNo)}`,
    CONFIRM: '/api/v1/shipment-delivery/confirm',
  },

  // Valid Test Staging Parameters (MLT-13330)
  VALID_TEST_STAGING_PARAMETERS: {
    BASE: '/api/v1/valid-test-staging-parameters',
    SEARCH: (take: number, skip: number) => `/api/v1/valid-test-staging-parameters/${take}/${skip}`,
    GET_BY_ID: (parmCode: string) => `/api/v1/valid-test-staging-parameters/${encodeURIComponent(parmCode)}`,
    CREATE: '/api/v1/valid-test-staging-parameters',
    UPDATE: (parmCode: string) => `/api/v1/valid-test-staging-parameters/${encodeURIComponent(parmCode)}`,
    DELETE: (parmCode: string) => `/api/v1/valid-test-staging-parameters/${encodeURIComponent(parmCode)}`,
    LOOKUP_DATATYPES: '/api/v1/valid-test-staging-parameters/datatypes-lookup',
    LOOKUP_VOID_CODES: '/api/v1/valid-test-staging-parameters/void-codes-lookup',
    LOOKUP_RELATED_CODES: '/api/v1/valid-test-staging-parameters/related-codes-lookup',
  },

  TEST_RESULT_RECONCILIATION: {
    BATCHES: '/api/v1/test-result-reconciliation/batches',
    TESTS_IN_BATCH: (tbId: string) => `/api/v1/test-result-reconciliation/batches/${encodeURIComponent(tbId)}/tests`,
    UNITS: (tbId: string, testId: string) => `/api/v1/test-result-reconciliation/units?tbId=${encodeURIComponent(tbId)}&testId=${encodeURIComponent(testId)}`,
    VALID_RESULTS: (testId: string) => `/api/v1/test-result-reconciliation/valid-results/${encodeURIComponent(testId)}`,
    RECONCILE: '/api/v1/test-result-reconciliation/reconcile',
  },

  ENTER_INTERIM_RESULT_CODE: {
    BASE: '/api/v1/enter-interim-result-code',
    CONTRACTS: '/api/v1/enter-interim-result-code/contracts',
    TESTS: (contractId: string) => `/api/v1/enter-interim-result-code/tests/${encodeURIComponent(contractId)}`,
    BATCHES: (contractId: string) => `/api/v1/enter-interim-result-code/batches/${encodeURIComponent(contractId)}`,
    INTERIM_CODES: '/api/v1/enter-interim-result-code/interim-codes',
    QUERY_UNITS: '/api/v1/enter-interim-result-code/query-units',
    SAVE_RESULTS: '/api/v1/enter-interim-result-code/save-results',
  },

  TRANSPORT_BATCH_QUERY: {
    BATCHES: '/api/v1/transport-batch-query/batches',
    BATCH_DETAILS: (batchId: string) =>
      `/api/v1/transport-batch-query/batches/${encodeURIComponent(batchId)}/details`,
    WAREHOUSES: '/api/v1/transport-batch-query/warehouses',
    BATCH_STATUSES: '/api/v1/transport-batch-query/batch-statuses',
    RECENT_BATCHES: '/api/v1/transport-batch-query/recent-batches',
  },

  // ABO Labeling ISBT
  ABO_LABELING: {
    PRINTER_CONFIG: '/api/abo-labeling/printer-config',
    VALIDATE_UNIT: '/api/v1/laboratory/abo-labeling/validate-unit',
    VALIDATE_PRODUCT: '/api/v1/laboratory/abo-labeling/validate-product',
    VALIDATE_BARCODE: '/api/v1/laboratory/abo-labeling/validate-barcode',
    GENERATE_LABEL: '/api/v1/laboratory/abo-labeling/generate-label',
    LABEL_FORMATS: '/api/v1/laboratory/abo-labeling/label-formats',
  },

  AUTO_DIR_PRODUCTS: {
    SEARCH: (take: number, skip: number) => `/api/v1/auto-dir-products/search/${take}/${skip}`,
    GET_BY_ID: (unitId: string) => `/api/v1/auto-dir-products/${encodeURIComponent(unitId)}`,
    HOSPITALS: '/api/v1/auto-dir-products/hospitals',
    PATIENTS: '/api/v1/auto-dir-products/patients',
  },

  CONVERT_SPIKED_BAG: {
    BASE: '/api/v1/convert-spiked-bags',
    PROCESS_CODES: '/api/v1/convert-spiked-bags/process-codes',
    VALIDATE_UNIT: (unitId: string) => `/api/v1/convert-spiked-bags/validate/${encodeURIComponent(unitId)}`,
    PRODUCTS: '/api/v1/convert-spiked-bags/products',
    ATTRIBUTES: (functionName: string, productType: string) =>
      `/api/v1/convert-spiked-bags/attributes/${encodeURIComponent(functionName)}/${encodeURIComponent(productType)}`,
    // Get attributes from FR_VPRODUCT_PROCESSES (auto-populate based on product+process)
    ATTRIBUTES_FOR_PROCESS: '/api/v1/convert-spiked-bags/attributes',
    PRODUCT_TYPES: '/api/v1/convert-spiked-bags/product-types',
    CHANGE_ATTRIBUTE: '/api/v1/convert-spiked-bags/change-attribute',
    REPRINT_LABEL: '/api/v1/convert-spiked-bags/reprint-label',
    CHANGE_PRODUCT_CODE: '/api/v1/convert-spiked-bags/change-product-code',
    CONVERT: '/api/v1/convert-spiked-bags/convert',
    // Derive Product - exact FRICON2 logic (Del_Attribute.Add_Attribute)
    DERIVE_PRODUCT: '/api/v1/convert-spiked-bags/derive-product',
    VERIFY_PRODUCT: '/api/v1/convert-spiked-bags/verify-product',
    VALID_CATALOGS: '/api/v1/convert-spiked-bags/valid-catalogs',
    // Validate Catalog Number - matches FRICON2 CATALOG_NUMBER.VALIDATE_FIELD
    VALIDATE_CATALOG: '/api/v1/convert-spiked-bags/validate-catalog',
    // FRICON2 dropdown endpoints - Attribute Group and Type selection
    ATTRIBUTE_GROUPS: '/api/v1/convert-spiked-bags/attribute-groups',
    ATTRIBUTE_TYPES: '/api/v1/convert-spiked-bags/attribute-types',
  },

  LOOKUP_AND_PRINT_DONOR_CARD: {
    DRIVE_INFO: '/api/v1/lookup-donor-card/drive-info',
    SEARCH: '/api/v1/lookup-donor-card/search',
    DONOR_DETAILS: (donorId: string) => `/api/v1/lookup-donor-card/${encodeURIComponent(donorId)}/details`,
    DONOR_PICTURE: (donorId: string) => `/api/v1/lookup-donor-card/${encodeURIComponent(donorId)}/picture`,
    PRINT_CARD: (donorId: string) => `/api/v1/lookup-donor-card/${encodeURIComponent(donorId)}/print-card`,
    ELIGIBILITY: (donorId: string) => `/api/v1/lookup-donor-card/${encodeURIComponent(donorId)}/eligibility`,
    PRINTERS_LOV: '/api/v1/lookup-donor-card/printers-lov',
    YTD_LOSS: (donorId: string) => `/api/v1/lookup-donor-card/${encodeURIComponent(donorId)}/ytd-loss`,
    GET_NOTES: (donorId: string) => `/api/v1/lookup-donor-card/${encodeURIComponent(donorId)}/notes`,
    ADD_NOTE: (donorId: string) => `/api/v1/lookup-donor-card/${encodeURIComponent(donorId)}/notes`,
    DONATION_TYPES_LOV: '/api/v1/lookup-donor-card/donation-types-lov',
    PROCEDURE_CODES_LOV: (donationType: string) => `/api/v1/lookup-donor-card/procedure-codes-lov/${encodeURIComponent(donationType)}`,
    ALTERNATE_ID_TYPES_LOV: '/api/v1/lookup-donor-card/alternate-id-types-lov',
    CITIES_LOV: '/api/v1/lookup-donor-card/cities-lov',
    CITY_STATE_LOV: '/api/v1/lookup-donor-card/city-state-lov',
    SPONSORS_LOV: '/api/v1/lookup-donor-card/sponsors-lov',
    ETHNIC_GROUPS_LOV: '/api/v1/lookup-donor-card/ethnic-groups-lov',
    HEIGHT_LOV: '/api/v1/lookup-donor-card/height-lov',
    CHECK_DONOR_ELIGIBILITY: '/api/v1/lookup-donor-card/check-donor-eligibility',
  },

  CHANGE_INVENTORY_CLASS: {
    GET_PRODUCT: (unitId: string) => `/api/v1/change-inventory-class/product/${encodeURIComponent(unitId)}`,
    DEVICES: (warehouseId: string) => `/api/v1/change-inventory-class/devices/${encodeURIComponent(warehouseId)}`,
    RACKS: (warehouseId: string, deviceType: string, deviceNumber: string) =>
      `/api/v1/change-inventory-class/racks/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceType)}/${encodeURIComponent(deviceNumber)}`,
    TRAYS: (warehouseId: string, deviceType: string, deviceNumber: string, rackNumber: string) =>
      `/api/v1/change-inventory-class/trays/${encodeURIComponent(warehouseId)}/${encodeURIComponent(deviceType)}/${encodeURIComponent(deviceNumber)}/${encodeURIComponent(rackNumber)}`,
    UPDATE: (unitId: string) => `/api/v1/change-inventory-class/${encodeURIComponent(unitId)}`,
    INVENTORY_CLASSES: '/api/v1/change-inventory-class/inventory-classes',
    PRE_CHECK: '/api/v1/change-inventory-class/pre-check',
  },

  LINK_TEST_RESULTS: {
    UNIT_TESTS: (unitId: string) => `/api/v1/link-test-results/unit/${encodeURIComponent(unitId)}/tests`,
    VALIDATE: '/api/v1/link-test-results/validate',
    TRANSFER: '/api/v1/link-test-results/transfer',
  },

  HORIZONTAL_TEST_FILE_TEST_MAPPING: {
    LIST: (take: number, skip: number) => `/api/v1/horizontal-test-file-test-mapping/${take}/${skip}`,
    GET_BY_ID: (sequenceNo: number) => `/api/v1/horizontal-test-file-test-mapping/${sequenceNo}`,
    CREATE: '/api/v1/horizontal-test-file-test-mapping',
    UPDATE: (sequenceNo: number) => `/api/v1/horizontal-test-file-test-mapping/${sequenceNo}`,
    DELETE: (sequenceNo: number) => `/api/v1/horizontal-test-file-test-mapping/${sequenceNo}`,
    TEST_IDS_DROPDOWN: '/api/v1/horizontal-test-file-test-mapping/test-ids-dropdown',
    NEXT_SEQUENCE_NO: '/api/v1/horizontal-test-file-test-mapping/next-sequence-no',
  },

  PLATE_CONTROLS_QUERY: {
    QUERY:          '/api/v1/plate-controls/query',
    TEST_IDS:       '/api/v1/plate-controls/test-ids',
    TEST_BATCH_IDS: '/api/v1/plate-controls/test-batch-ids',
  },

  DELETE_COMPONENT_ATTRIBUTE: {
    VALIDATE_UNIT: '/api/v1/delete-component-attribute/validate-unit',
    PRODUCT_CODES: '/api/v1/delete-component-attribute/product-codes',
    DELETABLE_ATTRIBUTES: '/api/v1/delete-component-attribute/deletable-attributes',
    PREVIEW_NEW_PRODUCT_CODE: '/api/v1/delete-component-attribute/preview-new-product-code',
    DELETE: '/api/v1/delete-component-attribute/delete',
    ATTRIBUTE_HISTORY: '/api/v1/delete-component-attribute/attribute-history',
    REPRINT_LABEL: '/api/v1/delete-component-attribute/reprint-label',
  },

  TEST_SERIES_CONFIG: {
    LIST: (take: number, skip: number) => `/api/v1/test-series-config/${take}/${skip}`,
    GET_BY_ID: '/api/v1/test-series-config',
    CREATE: '/api/v1/test-series-config',
    UPDATE: '/api/v1/test-series-config',
    DELETE: '/api/v1/test-series-config',
    TEST_SERIES_DROPDOWN: '/api/v1/test-series-config/test-series-dropdown',
    VALID_TESTS: '/api/v1/test-series-config/valid-tests',
    RESULT_CODES: '/api/v1/test-series-config/result-codes',
    NOTATION_CODES: '/api/v1/test-series-config/notation-codes',
  },

  DELETE_UNIT_ATTRIBUTE: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/delete-unit-attributes/validate-unit/${encodeURIComponent(unitId)}`,
    GET_ATTRIBUTES: (unitId: string) =>
      `/api/v1/delete-unit-attributes/${encodeURIComponent(unitId)}`,
    DELETE: '/api/v1/delete-unit-attributes',
  },

  BLOOD_PRODUCT_CREDIT: {
    BASE:             '/api/v1/blood-product-credit',
    BY_UNIT_ID:       (unitId: string) => `/api/v1/blood-product-credit/${encodeURIComponent(unitId)}`,
    VALIDATE_UNIT:    (unitId: string) => `/api/v1/blood-product-credit/validate-unit/${encodeURIComponent(unitId)}`,
    CUSTOMERS:        '/api/v1/blood-product-credit/customers',
    REASON_CODES:     '/api/v1/blood-product-credit/reason-codes',
    NOTES:            (unitId: string) => `/api/v1/blood-product-credit/${encodeURIComponent(unitId)}/notes`,
    PRODUCT_HISTORY:  (unitId: string) => `/api/v1/blood-product-credit/${encodeURIComponent(unitId)}/product-history`,
  },

  CONFIGURE_INTERDICTION_PLACEMENT: {
    BASE: '/api/v1/interdiction-placement',
    GET_ALL: (take: number, skip: number) => `/api/v1/interdiction-placement/${take}/${skip}`,
    CREATE: '/api/v1/interdiction-placement',
    UPDATE: (chapterId: string, fn: string, type: string, code: string | null, prod: string) =>
      `/api/v1/interdiction-placement/${chapterId}/${fn}/${type}/${code || 'NULL'}/${prod}`,
    DELETE: (chapterId: string, fn: string, type: string, code: string | null, prod: string) =>
      `/api/v1/interdiction-placement/${chapterId}/${fn}/${type}/${code || 'NULL'}/${prod}`,
    FILTER_OPTIONS: (fn: string) => `/api/v1/interdiction-placement/filter-options/${fn}`,
    LOOKUPS: {
      FUNCTION_NAMES: '/api/v1/interdiction-placement/lookups/function-names',
      ACTION_TYPES: '/api/v1/interdiction-placement/lookups/action-types',
      ACTION_CODES: '/api/v1/interdiction-placement/lookups/action-codes',
      PRODUCT_CODES: '/api/v1/interdiction-placement/lookups/product-codes',
      INTERDICTION_CODES: '/api/v1/interdiction-placement/lookups/interdiction-codes',
      PRODUCT_TYPES: '/api/v1/interdiction-placement/lookups/product-types',
    },
  },

  SPECIAL_PROCESSING_QUERY: {
    SEARCH: '/api/v1/special-processing-query/search',
  },
  QC_HISTORY_QUERY: {
    LIST: (take: number, skip: number) =>
      `/api/v1/qc-history-query/list/${take}/${skip}`,
    EQUIPMENT_TYPES: '/api/v1/qc-history-query/equipment-types',
    EQUIPMENT_IDS: (equipmentType: string) =>
      `/api/v1/qc-history-query/equipment-ids/${encodeURIComponent(equipmentType)}`,
    EQUIPMENT_REFERENCES: (equipmentType: string, equipmentId: string) =>
      `/api/v1/qc-history-query/equipment-references/${encodeURIComponent(equipmentType)}/${encodeURIComponent(equipmentId)}`,
    QC_STATUSES: '/api/v1/qc-history-query/qc-statuses',
  },

  // Consignee Management (VSCONNEE) - MLT-14183
  CONSIGNEE: {
    LIST: (customerId: string) =>
      `/api/v1/consignee/${encodeURIComponent(customerId)}/list`,
    GET_BY_ID: (customerId: string, consigneeId: string) =>
      `/api/v1/consignee/${encodeURIComponent(customerId)}/${encodeURIComponent(consigneeId)}`,
    CREATE: '/api/v1/consignee',
    UPDATE: (customerId: string, consigneeId: string) =>
      `/api/v1/consignee/${encodeURIComponent(customerId)}/${encodeURIComponent(consigneeId)}`,
    DELETE: (customerId: string, consigneeId: string) =>
      `/api/v1/consignee/${encodeURIComponent(customerId)}/${encodeURIComponent(consigneeId)}`,
    LOOKUP_ZONES: '/api/v1/consignee/lookup/zones',
    LOOKUP_STATES: '/api/v1/consignee/lookup/states',
  },

  EQUIPMENT_QC: {
    RETRIEVE: '/api/v1/equipment-qc-data/retrieve',
    SAVE: '/api/v1/equipment-qc-data/save',
    DELETE: (seqNo: string) => `/api/v1/equipment-qc-data/${encodeURIComponent(seqNo)}`,
    LOOKUPS: {
      EQUIPMENT_TYPES: '/api/v1/equipment-qc-data/equipment-types',
      QC_TYPES: '/api/v1/equipment-qc-data/qc-types',
      REVIEW_REQUIRED: '/api/v1/equipment-qc-data/review-required',
      QC_PERFORMED_EVERY: '/api/v1/equipment-qc-data/qc-performed-every',
      UNITS: '/api/v1/equipment-qc-data/units',
    },
  },

  // EQIQCSUP — Edit / Reconcile QC Details
  EQUIPMENT_QC_SUP: {
    EQUIPMENT_TYPES:     '/api/v1/equipment-qc/equipment-types',
    EQUIPMENT_IDS:       '/api/v1/equipment-qc/equipment-ids',
    EQUIPMENT_REFERENCES:'/api/v1/equipment-qc/equipment-references',
    QC_EVENTS:           '/api/v1/equipment-qc/qc-events',
    QC_HEADER: (qcRef: string) => `/api/v1/equipment-qc/qc-header/${encodeURIComponent(qcRef)}`,
    QC_DETAILS: (qcRef: string) => `/api/v1/equipment-qc/qc-details/${encodeURIComponent(qcRef)}`,
    QC_TYPES:            '/api/v1/equipment-qc/qc-types',
    QC_RESULTS:          '/api/v1/equipment-qc/qc-results',
    USERS:               '/api/v1/equipment-qc/users',
    REVIEW_CODE:         '/api/v1/equipment-qc/review-code',
    PARSE_BARCODE:       '/api/v1/equipment-qc/parse-barcode',
  },

  ABO_LABEL_OVERRIDE_QUERY: {
    GET_BY_UNIT: (unitId: string) => `/api/v1/abo-label-override-query/${encodeURIComponent(unitId)}`,
    VALIDATE_UNIT: (unitId: string) => `/api/v1/abo-label-override-query/validate-unit/${encodeURIComponent(unitId)}`,
  },

  // Re-Label Codabar Units to ISBT Schema (CDISBT / LAICDISB)
  RELABEL_CODABAR_ISBT: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/relabel-codabar-isbt/unit/${encodeURIComponent(unitId)}`,
    COMPONENTS: '/api/v1/relabel-codabar-isbt/components',
    VALIDATE_COMPONENT: '/api/v1/relabel-codabar-isbt/validate-component',
    UNIT_ATTRIBUTES: '/api/v1/relabel-codabar-isbt/unit-attributes',
    VALIDATE_ISBT_DETAILS: '/api/v1/relabel-codabar-isbt/validate-isbt-details',
    ABO_MAPPING: '/api/v1/relabel-codabar-isbt/abo-mapping',
    ISBT_PRODUCT_CODE: (codabarProductCode: string) =>
      `/api/v1/relabel-codabar-isbt/isbt-product-code/${encodeURIComponent(codabarProductCode)}`,
    CHECK_USER_ACCESS: '/api/v1/relabel-codabar-isbt/check-user-access',
    VERIFY_LABEL: '/api/v1/relabel-codabar-isbt/verify-label',
    RELABEL_COMMIT: '/api/v1/relabel-codabar-isbt/relabel-commit',
    ABO_VALUES: '/api/v1/relabel-codabar-isbt/abo-values',
    CATALOG_NUMBERS: '/api/v1/relabel-codabar-isbt/catalog-numbers',
    LOT_NUMBERS: '/api/v1/relabel-codabar-isbt/lot-numbers',
    FACILITY_CODES: '/api/v1/relabel-codabar-isbt/facility-codes',
    SPECIAL_TESTING_CODES: '/api/v1/relabel-codabar-isbt/special-testing-codes',
    PRODUCT_CODES: '/api/v1/relabel-codabar-isbt/product-codes',
    PRODUCT_CODE_DROPDOWN: '/api/v1/relabel-codabar-isbt/product-code-dropdown',
    RELABEL: '/api/v1/relabel-codabar-isbt/relabel',
    UNIT_NOTES: '/api/v1/relabel-codabar-isbt/unit-notes',
    UNIT_NOTES_DELETE: (auditKey: number) =>
      `/api/v1/relabel-codabar-isbt/unit-notes/${auditKey}`,
    PRINT_LABEL: '/api/v1/relabel-codabar-isbt/print-label',
  },

  CHANGE_LABEL_PRINTER: {
    LABEL_PRINTERS: '/api/v1/change-label-printer/label-printers',
    TIETAG_PRINTERS: '/api/v1/change-label-printer/tietag-printers',
    PROCESSING_FACILITIES: '/api/v1/change-label-printer/processing-facilities',
    PROCESSING_FACILITY_DETAILS: (auditKey: number) =>
      `/api/v1/change-label-printer/processing-facilities/${auditKey}`,
    SAVE_SETTINGS: '/api/v1/change-label-printer/save-settings',
  },

  UNSCHEDULED_TEST_QUERY: {
    TEST_IDS: '/api/v1/laboratory/unscheduled-test-query/test-ids',
    SEARCH:   '/api/v1/laboratory/unscheduled-test-query/search',
  },

  // Place Group Interdiction or Hold (MLT-12686)
  GROUP_INTERDICTION: {
    BASE: '/api/v1/group-interdiction',
    PLACE: '/api/v1/group-interdiction/place',
    ACTIVE_INTERDICTIONS: '/api/v1/group-interdiction/interdictions/active',
    PREVIEW: '/api/v1/group-interdiction/preview',
    DROPDOWN_DRIVES: '/api/v1/group-interdiction/dropdown/drives',
    DROPDOWN_BATCHES: '/api/v1/group-interdiction/dropdown/batches',
    DROPDOWN_COLLECTION_DATES: '/api/v1/group-interdiction/dropdown/collection-dates',
    DROPDOWN_LOT_NUMBERS: '/api/v1/group-interdiction/dropdown/lot-numbers',
  },

  EQUIPMENT_QUERY: {
    LIST: '/api/v1/equipment-query',
    GET_BY_ID: (equipType: string, equipId: string, equipReference: string) =>
      `/api/v1/equipment-query/${encodeURIComponent(equipType)}/${encodeURIComponent(equipId)}/${encodeURIComponent(equipReference)}`,
    TYPES: '/api/v1/equipment-query/types',
    STATUSES: '/api/v1/equipment-query/statuses',
    IDS_BY_TYPE: (equipType: string) =>
      `/api/v1/equipment-query/types/${encodeURIComponent(equipType)}/ids`,
    REFERENCES: (equipType: string, equipId: string) =>
      `/api/v1/equipment-query/types/${encodeURIComponent(equipType)}/ids/${encodeURIComponent(equipId)}/references`,
    STATISTICS: (equipType: string, equipId: string, equipReference: string) =>
      `/api/v1/equipment-query/${encodeURIComponent(equipType)}/${encodeURIComponent(equipId)}/${encodeURIComponent(equipReference)}/statistics`,
    PARAMETERS: (equipType: string, equipId: string, equipReference: string) =>
      `/api/v1/equipment-query/${encodeURIComponent(equipType)}/${encodeURIComponent(equipId)}/${encodeURIComponent(equipReference)}/parameters`,
  },

  VALID_INSTRUMENT_TEST_SCHEDULES: {
    LIST: '/api/v1/valid-instrument-test-schedules',
    GET_BY_ID: (machineId: string) =>
      `/api/v1/valid-instrument-test-schedules/${encodeURIComponent(machineId)}`,
    SAVE: '/api/v1/valid-instrument-test-schedules/save',
    CREATE: '/api/v1/valid-instrument-test-schedules/create',
    UPDATE: (machineId: string, chapterId: string, machineTestId: string) =>
      `/api/v1/valid-instrument-test-schedules/${encodeURIComponent(machineId)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(machineTestId)}`,
    INSTRUMENTS: '/api/v1/valid-instrument-test-schedules/instruments',
    INSTRUMENT_TESTS: (instrumentId: string) =>
      `/api/v1/valid-instrument-test-schedules/instrument-tests/${encodeURIComponent(instrumentId)}`,
    ALL_INSTRUMENT_TESTS: (instrumentId: string) =>
      `/api/v1/valid-instrument-test-schedules/all-instrument-tests/${encodeURIComponent(instrumentId)}`,
    CREATE_INSTRUMENT_TEST: '/api/v1/valid-instrument-test-schedules/create-instrument-test',
    UPDATE_INSTRUMENT_TEST: (chapterId: string, machineId: string, testId: string) =>
      `/api/v1/valid-instrument-test-schedules/update-instrument-test/${encodeURIComponent(chapterId)}/${encodeURIComponent(machineId)}/${encodeURIComponent(testId)}`,
    LIFETRACK_TESTS: '/api/v1/valid-instrument-test-schedules/lifetrack-tests',
    TEST_RESULTS: (testId: string) =>
      `/api/v1/valid-instrument-test-schedules/test-results/${encodeURIComponent(testId)}`,
  },

  // Verify Test Observations: Tech 2 (MLT-12688)
  VERIFY_TEST_OBSERVATIONS_TECH2: {
    BASE: '/api/v1/verify-test-observations-tech2',
    WORKSHEETS: '/api/v1/verify-test-observations-tech2/worksheets',
    TESTS: (tbId: string) => `/api/v1/verify-test-observations-tech2/tests/${encodeURIComponent(tbId)}`,
    TEST_BANDS: (testId: string, testType: string) => `/api/v1/verify-test-observations-tech2/test-bands/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`,
    PENDING_UNITS: (tbId: string, testId: string) => `/api/v1/verify-test-observations-tech2/pending-units/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}`,
    VERIFY: '/api/v1/verify-test-observations-tech2/verify',
    BAND_RESULTS: (testId: string) => `/api/v1/verify-test-observations-tech2/band-results/${encodeURIComponent(testId)}`,
    VALID_RESULTS: (testId: string) => `/api/v1/verify-test-observations-tech2/valid-results/${encodeURIComponent(testId)}`,
    TEST_TYPE_METADATA: (testId: string, testType: string) => `/api/v1/verify-test-observations-tech2/test-type-metadata/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`,
    VALIDATE_COMBINATION: '/api/v1/verify-test-observations-tech2/validate-combination',
    CHECK_EXISTING: (tbId: string, testId: string, unitId: string) => `/api/v1/verify-test-observations-tech2/check-existing/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}`,
    CLEAR_VERIFICATION: '/api/v1/verify-test-observations-tech2/clear-verification',
    OTHER_BANDS: (tbId: string, testId: string, unitId: string) => `/api/v1/verify-test-observations-tech2/other-bands/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}`,
    OTHER_BANDS_WITH_SEQ: (tbId: string, testId: string, unitId: string, tbSeqNo: number) => `/api/v1/verify-test-observations-tech2/other-bands/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}/${tbSeqNo}`,
    NOTES: (tbId: string, testId: string, unitId: string) => `/api/v1/verify-test-observations-tech2/notes/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}`,
  },

  FREEZE_START_TIME: {
    BASE: '/api/v1/freeze-start-time',
    VALIDATE_UNIT: '/api/v1/freeze-start-time/validate-unit',
    LOOKUP_PRODUCTS: '/api/v1/freeze-start-time/lookup-products',
    LOOKUP_ALIQUOTS: '/api/v1/freeze-start-time/lookup-aliquots',
    RECORD: '/api/v1/freeze-start-time/record',
    CHECK_DUPLICATE: '/api/v1/freeze-start-time/check-duplicate',
    QUERY_HISTORY: '/api/v1/freeze-start-time/query',
  },

  // Valid Reagent Supplier Codes (VSUPPL) - MLT-13093
  VALID_REAGENT_SUPPLIER_CODES: {
    LIST: (take: number, skip: number) =>
      `/api/v1/valid-reagent-supplier-codes/${take}/${skip}`,
    GET_BY_ID: (supplierCode: string) =>
      `/api/v1/valid-reagent-supplier-codes/${encodeURIComponent(supplierCode)}`,
    CREATE: '/api/v1/valid-reagent-supplier-codes',
    UPDATE: (supplierCode: string) =>
      `/api/v1/valid-reagent-supplier-codes/${encodeURIComponent(supplierCode)}`,
    DELETE: (supplierCode: string) =>
      `/api/v1/valid-reagent-supplier-codes/${encodeURIComponent(supplierCode)}`,
  },

  VALID_REAGENT_CODES: {
    LIST: '/api/v1/valid-reagent-codes',
    GET_BY_ID: (testId: string, reagentCode: string) =>
      `/api/v1/valid-reagent-codes/${encodeURIComponent(testId)}/${encodeURIComponent(reagentCode)}`,
    CREATE: '/api/v1/valid-reagent-codes',
    UPDATE: (testId: string, reagentCode: string) =>
      `/api/v1/valid-reagent-codes/${encodeURIComponent(testId)}/${encodeURIComponent(reagentCode)}`,
    DELETE: (testId: string, reagentCode: string) =>
      `/api/v1/valid-reagent-codes/${encodeURIComponent(testId)}/${encodeURIComponent(reagentCode)}`,
    TEST_LOV: '/api/v1/valid-reagent-codes/test-ids-lov',
  },

  // Regional Tubes Check-In (MLT-12663 - RGITUBES Migration)
  REGIONAL_TUBES: {
    // Primary check-in operation (POST)
    CHECK_IN: '/api/v1/regional-tubes/check-in',

    // Real-time unit validation (POST)
    VALIDATE_UNIT: '/api/v1/regional-tubes/validate-unit',

    // Contract lookup (GET) - query param: searchString (optional)
    CONTRACTS: '/api/v1/regional-tubes/contracts',

    // Batch lookup (GET) - query param: contractId (required)
    BATCHES: '/api/v1/regional-tubes/batches',

    // Profile set lookup (GET) - path param: contractId
    PROFILE_SETS: (contractId: string) =>
      `/api/v1/regional-tubes/profile-sets/${encodeURIComponent(contractId)}`,

    // Batch units (GET) - path param: batchId
    BATCH_UNITS: (batchId: string) =>
      `/api/v1/regional-tubes/batch-units/${encodeURIComponent(batchId)}`,

    // Duplicate unit history (GET) - path param: osUnitId
    DUPLICATE_UNITS: (osUnitId: string) =>
      `/api/v1/regional-tubes/duplicate-units/${encodeURIComponent(osUnitId)}`,

    // Additional tests (GET) - path param: contractId
    ADDITIONAL_TESTS: (contractId: string) =>
      `/api/v1/regional-tubes/additional-tests/${encodeURIComponent(contractId)}`,

    // Contract test profile (GET) - path param: contractId, query param: profileSetId (optional)
    CONTRACT_TESTS: (contractId: string, profileSetId?: string) => {
      const base = `/api/v1/regional-tubes/contract-tests/${encodeURIComponent(contractId)}`;
      return profileSetId ? `${base}?profileSetId=${encodeURIComponent(profileSetId)}` : base;
    },

    // Lookups (GET)
    TUBE_FORMATS: '/api/v1/regional-tubes/lookups/tube-formats',
    DUPLICATE_REASONS: '/api/v1/regional-tubes/lookups/duplicate-reasons',
    OPTIONS: '/api/v1/regional-tubes/lookups/options',

    // Generate batch ID (POST) - called when user selects "NEW" for batch ID
    GENERATE_BATCH_ID: '/api/v1/regional-tubes/generate-batch-id',
  },

  // Missing Tubes Query (MSTUBEQ / RGQMSTUB)
  MISSING_TUBES_QUERY: {
    CONTRACTS: '/api/v1/missing-tubes-query/contracts',
    BATCHES: (contractId: string) =>
      `/api/v1/missing-tubes-query/batches/${encodeURIComponent(contractId)}`,
    MISSING_REASONS: '/api/v1/missing-tubes-query/missing-reasons',
    QUERY: '/api/v1/missing-tubes-query',
  },

  // Tubes Check-In Query (RGTUBEQ / RGQTUBES)
  TUBES_CHECKIN_QUERY: {
    CONTRACTS: '/api/v1/tubes-checkin-query/contracts',
    BATCHES: (contractId: string) =>
      `/api/v1/tubes-checkin-query/batches/${encodeURIComponent(contractId)}`,
    CHECKIN_DATES: (contractId: string) =>
      `/api/v1/tubes-checkin-query/checkin-dates/${encodeURIComponent(contractId)}`,
    QUERY: '/api/v1/tubes-checkin-query',
    PROFILE_TESTS: '/api/v1/tubes-checkin-query/profile-tests',
    ADDITIONAL_TESTS: (unitId: string) =>
      `/api/v1/tubes-checkin-query/additional-tests/${encodeURIComponent(unitId)}`,
  },

  // Samples Query (SAMPQ / GEQSAMP)
  SAMPLES_QUERY: {
    SEARCH: (take: number, skip: number) =>
      `/api/v1/samples-query/search/${take}/${skip}`,
    UNIT_DETAILS: (unitId: string) =>
      `/api/v1/samples-query/unit/${encodeURIComponent(unitId)}/details`,
    VALIDATE_UNIT: (unitId: string, isScanned: boolean) =>
      `/api/v1/samples-query/validate-unit/${encodeURIComponent(unitId)}?isScanned=${isScanned}`,
    BATCHES: '/api/v1/samples-query/batches',
    SAMPLE_CHECKIN_DETAILS: (unitId: string) =>
      `/api/v1/samples-query/unit/${encodeURIComponent(unitId)}/sample-checkin-details`,
    SAMPLE_NOTES: (unitId: string, collDate: string) =>
      `/api/v1/samples-query/unit/${encodeURIComponent(unitId)}/sample-notes?collDate=${encodeURIComponent(collDate)}`,
    CHECKIN_NOTES: (batchId: string) =>
      `/api/v1/samples-query/batch/${encodeURIComponent(batchId)}/checkin-notes`,
    TEST_NOTES: (unitId: string, testId: string, auditKey: number) =>
      `/api/v1/samples-query/unit/${encodeURIComponent(unitId)}/test-notes?testId=${encodeURIComponent(testId)}&auditKey=${auditKey}`,
    NOTE_COUNTS: (unitId: string) =>
      `/api/v1/samples-query/unit/${encodeURIComponent(unitId)}/note-counts`,
  },

  // Batch In-Progress Query (BIPQ / RGQEXRES)
  BATCH_IN_PROGRESS_QUERY: {
    SEARCH: '/api/v1/batch-in-progress-query/search',
    UNITS: (batchId: string) =>
      `/api/v1/batch-in-progress-query/${encodeURIComponent(batchId)}/units`,
    CONTRACTS: '/api/v1/batch-in-progress-query/contracts',
    CONTRACTS_SEARCH: '/api/v1/batch-in-progress-query/contracts/search',
    BATCHES_LOOKUP: '/api/v1/batch-in-progress-query/batches-lookup',
    CHAPTERS: '/api/v1/batch-in-progress-query/chapters',
    UNIT_TEST_RESULTS: (unitId: string) =>
      `/api/v1/batch-in-progress-query/units/${encodeURIComponent(unitId)}/test-results`,
    UNIT_INTERDICTIONS: (unitId: string) =>
      `/api/v1/batch-in-progress-query/units/${encodeURIComponent(unitId)}/interdictions`,
    UNIT_HOLDING_TESTS: (unitId: string) =>
      `/api/v1/batch-in-progress-query/units/${encodeURIComponent(unitId)}/holding-tests`,
  },

  // Change Testing Unit Collection Date (TUCOLDAT / TCICOLDT)
  CHANGE_COLLECTION_DATE: {
    BATCH_LOV: '/api/v1/change-collection-date/batch-lov',
    BATCH_UNITS: (batchId: string) =>
      `/api/v1/change-collection-date/batch-units/${encodeURIComponent(batchId)}`,
    VALIDATE_BATCH: '/api/v1/change-collection-date/validate-batch',
    VALIDATE_UNIT: '/api/v1/change-collection-date/validate-unit',
    CHANGE: '/api/v1/change-collection-date/change',
  },

  // Delete Regional Sample/Check-In Batch (SUPERDEL / SMUSUPR1)
  DELETE_REGIONAL_SAMPLE: {
    VALIDATE_BATCH: (batchId: string) =>
      `/api/v1/delete-regional-sample/validate-batch/${encodeURIComponent(batchId)}`,
    GET_UNITS: '/api/v1/delete-regional-sample/units',
    DELETE_SCOPE: (unitId: string) =>
      `/api/v1/delete-regional-sample/delete-scope/${encodeURIComponent(unitId)}`,
    DELETE: '/api/v1/delete-regional-sample/delete',
  },

  // Reset Extract for Parm/Batch/Sample (SUPEXRST / SMUSUPR2)
  RESET_EXTRACT: {
    VALIDATE_PARM: (parmId: string) =>
      `/api/v1/reset-extract/validate-parm/${encodeURIComponent(parmId)}`,
    VALIDATE_BATCH: (parmId: string, batchId: string) =>
      `/api/v1/reset-extract/validate-batch/${encodeURIComponent(parmId)}/${encodeURIComponent(batchId)}`,
    VALIDATE_UNIT_STANDALONE: (unitId: string) =>
      `/api/v1/reset-extract/validate-unit/${encodeURIComponent(unitId)}`,
    FIND_DATA: (take: number, skip: number) =>
      `/api/v1/reset-extract/find-data/${take}/${skip}`,
    RESET: '/api/v1/reset-extract/reset',
  },

  // Place Notes on Multiple Units (MUNOTES / GEUNOTES)
  PLACE_UNIT_NOTES: {
    ACCESS_CHECK: '/api/v1/laboratory/unit-notes/access-check',
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/laboratory/unit-notes/validate-unit/${encodeURIComponent(unitId)}`,
    CREATE_NOTES: '/api/v1/laboratory/unit-notes',
    NOTES_BY_UNIT: (unitId: string) =>
      `/api/v1/laboratory/unit-notes/unit/${encodeURIComponent(unitId)}`,
    NOTE_GROUP: (noteId: number) =>
      `/api/v1/laboratory/unit-notes/group/${noteId}`,
    DELETE_NOTE: (noteId: number, noteSeq: number) =>
      `/api/v1/laboratory/unit-notes/group/${noteId}/seq/${noteSeq}`,
  },

  // Hospital/Patient Contract Profile Tests (TSTEST)
  HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS: {
    // Get all contract tests (paginated) - POST /contract-tests/{contractId}/{take}/{skip}
    SEARCH: (contractId: string, take: number, skip: number) =>
      `/api/v1/contract-tests/${encodeURIComponent(contractId)}/${take}/${skip}`,

    // Get contract test by ID - GET /contract-tests/{contractId}/{testId}
    GET_BY_ID: (contractId: string, testId: string) =>
      `/api/v1/contract-tests/${encodeURIComponent(contractId)}/${encodeURIComponent(testId)}`,

    // Get active contracts dropdown - GET /contract-tests/contracts-dropdown
    CONTRACTS_DROPDOWN: '/api/v1/contract-tests/contracts-dropdown',

    // Get active tests dropdown - GET /contract-tests/tests-dropdown
    TESTS_DROPDOWN: '/api/v1/contract-tests/tests-dropdown',

    // Create new contract profile test - POST /contract-tests
    CREATE: '/api/v1/contract-tests',

    // Update contract profile test - PUT /contract-tests/{contractId}/{testId}
    UPDATE: (contractId: string, testId: string) =>
      `/api/v1/contract-tests/${encodeURIComponent(contractId)}/${encodeURIComponent(testId)}`,

    // Delete contract profile test - DELETE /contract-tests/{contractId}/{testId}
    DELETE: (contractId: string, testId: string) =>
      `/api/v1/contract-tests/${encodeURIComponent(contractId)}/${encodeURIComponent(testId)}`,
  },

  // Hospital/Patient Ad Hoc Testing Contract (AHCNTR - LTICNTRT)
  // TODO: Backend implementation pending (MLT-13574)
  HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT: {
    // Get all ad hoc testing contracts (paginated) - POST /ad-hoc-testing-contracts/{contractId}/{take}/{skip}
    SEARCH: (contractId: string, take: number, skip: number) =>
      `/api/v1/ad-hoc-testing-contracts/${encodeURIComponent(contractId)}/${take}/${skip}`,

    // Get ad hoc testing contract by ID - GET /ad-hoc-testing-contracts/{contractId}/{testId}
    GET_BY_ID: (contractId: string, testId: string) =>
      `/api/v1/ad-hoc-testing-contracts/${encodeURIComponent(contractId)}/${encodeURIComponent(testId)}`,

    // Get active contracts dropdown - GET /ad-hoc-testing-contracts/contracts-dropdown
    CONTRACTS_DROPDOWN: '/api/v1/ad-hoc-testing-contracts/contracts-dropdown',

    // Get active tests dropdown - GET /ad-hoc-testing-contracts/tests-dropdown
    TESTS_DROPDOWN: '/api/v1/ad-hoc-testing-contracts/tests-dropdown',

    // Create new ad hoc testing contract - POST /ad-hoc-testing-contracts
    CREATE: '/api/v1/ad-hoc-testing-contracts',

    // Update ad hoc testing contract - PUT /ad-hoc-testing-contracts/{contractId}/{testId}
    UPDATE: (contractId: string, testId: string) =>
      `/api/v1/ad-hoc-testing-contracts/${encodeURIComponent(contractId)}/${encodeURIComponent(testId)}`,

    // Delete ad hoc testing contract - DELETE /ad-hoc-testing-contracts/{contractId}/{testId}
    DELETE: (contractId: string, testId: string) =>
      `/api/v1/ad-hoc-testing-contracts/${encodeURIComponent(contractId)}/${encodeURIComponent(testId)}`,
  },

  // Hospital Patient Testing Contract (LTICNTRT - VCONTRCT)
  HOSPITAL_PATIENT_TESTING_CONTRACT: {
    LIST: (take: number, skip: number) =>
      `/api/v1/hospital-patient-testing-contract/${take}/${skip}`,
    GET_BY_ID: (contractId: string) =>
      `/api/v1/hospital-patient-testing-contract/${encodeURIComponent(contractId)}`,
    CREATE: '/api/v1/hospital-patient-testing-contract',
    UPDATE: (contractId: string) =>
      `/api/v1/hospital-patient-testing-contract/${encodeURIComponent(contractId)}`,
    DELETE: (contractId: string) =>
      `/api/v1/hospital-patient-testing-contract/${encodeURIComponent(contractId)}`,
    CONTACTS: (contractId: string) =>
      `/api/v1/hospital-patient-testing-contract/${encodeURIComponent(contractId)}/contacts`,
    CREATE_CONTACT: (contractId: string) =>
      `/api/v1/hospital-patient-testing-contract/${encodeURIComponent(contractId)}/contacts`,
    UPDATE_CONTACT: (contractId: string, contactId: number) =>
      `/api/v1/hospital-patient-testing-contract/${encodeURIComponent(contractId)}/contacts/${contactId}`,
    DELETE_CONTACT: (contractId: string, contactId: number) =>
      `/api/v1/hospital-patient-testing-contract/${encodeURIComponent(contractId)}/contacts/${contactId}`,
    LOV_CONTRACTS: (showTerminated = false) =>
      `/api/v1/hospital-patient-testing-contract/lov/contracts?showTerminated=${showTerminated}`,
    LOV_COMPANIES: (showTerminated = false) =>
      `/api/v1/hospital-patient-testing-contract/lov/companies?showTerminated=${showTerminated}`,
    LOV_CONTRACT_TYPES: (showTerminated = false) =>
      `/api/v1/hospital-patient-testing-contract/lov/contract-types?showTerminated=${showTerminated}`,
    LOV_STATE_CODES: '/api/v1/hospital-patient-testing-contract/lov/state-codes',
    LOV_BARCODE_PROTOCOLS: '/api/v1/hospital-patient-testing-contract/lov/barcode-protocols',
  },

  // Fixed Profile Tube Check-In (MLT-13601 - TSTUBES/LTICHKIN Migration)
  FIXED_PROFILE_TUBES: {
    LIST: (take: number, skip: number) =>
      `/api/v1/fixed-profile-tube-checkin/${take}/${skip}`,
    GET_BY_ID: (osUnitId: string) =>
      `/api/v1/fixed-profile-tube-checkin/${encodeURIComponent(osUnitId)}`,
    CREATE: '/api/v1/fixed-profile-tube-checkin',
    UPDATE: (osUnitId: string) =>
      `/api/v1/fixed-profile-tube-checkin/${encodeURIComponent(osUnitId)}`,
    DELETE: (osUnitId: string) =>
      `/api/v1/fixed-profile-tube-checkin/${encodeURIComponent(osUnitId)}`,
    CONTRACTS: '/api/v1/fixed-profile-tube-checkin/contracts',
    BATCHES: '/api/v1/fixed-profile-tube-checkin/batches',
  },

  // Results Observations Query (TEQBNDR / MLT-12761 / MLT-14259)
  RESULTS_OBSERVATIONS: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/results-observations/validate-unit/${encodeURIComponent(unitId)}`,
    TESTS_FOR_UNIT: (unitId: string) =>
      `/api/v1/results-observations/tests-for-unit/${encodeURIComponent(unitId)}`,
    TEST_BATCHES: (unitId: string, testId: string) =>
      `/api/v1/results-observations/test-batches/${encodeURIComponent(unitId)}/${encodeURIComponent(testId)}`,
    BAND_DETAILS: (unitId: string, testId: string, tbId: string, tbSeqNo: number) =>
      `/api/v1/results-observations/band-details/${encodeURIComponent(unitId)}/${encodeURIComponent(testId)}/${encodeURIComponent(tbId)}/${tbSeqNo}`,
  },

  ORDER_MANAGEMENT: {
    CREATE_ORDER: '/api/v1/regular-order',
    GET_ORDER: (orderNo: string) => `/api/v1/regular-order/${orderNo}`,
    UPDATE_ORDER: (orderNo: string) => `/api/v1/regular-order/${orderNo}`,
    DELETE_ORDER: (orderNo: string) => `/api/v1/regular-order/${orderNo}`,
    GET_ALL: (take: number, skip: number) => `/api/v1/regular-order/${take}/${skip}`,
    GET_ORDER_ITEMS: (orderNo: string) => `/api/v1/regular-order/${orderNo}/items`,
    ADD_ORDER_ITEM: (orderNo: string) => `/api/v1/regular-order/${orderNo}/items`,
    DELETE_ORDER_ITEM: (orderNo: string, itemNo: number) => `/api/v1/regular-order/${orderNo}/items/${itemNo}`,
    LOOKUP_ORDER_MODES: '/api/v1/regular-order/lookups/order-modes',
    LOOKUP_CUSTOMERS: '/api/v1/regular-order/lookups/customers',
    LOOKUP_BLOOD_TYPES: (productType: string) => `/api/v1/regular-order/lookups/blood-types/${productType}`,
    LOOKUP_CONSIGNEES: (customerId: string) => `/api/v1/regular-order/lookups/consignees/${customerId}`,
    LOOKUP_PAYEES: (customerId: string) => `/api/v1/regular-order/lookups/payees/${customerId}`,
    LOOKUP_CONTRACTS: (customerId: string) => `/api/v1/regular-order/lookups/contracts/${customerId}`,
    LOOKUP_TIERS: (productType: string) => `/api/v1/regular-order/lookups/tiers/${productType}`,
    LOOKUP_ORDER_CLASSES: '/api/v1/regular-order/lookups/order-classes',
    LOOKUP_PRODUCT_TYPES: '/api/v1/regular-order/lookups/product-types',
    LOOKUP_ATTRIBUTE_GROUPS: '/api/v1/regular-order/lookups/attribute-groups',
    LOOKUP_ATTRIBUTE_CODES: (attribGroup: string) => `/api/v1/regular-order/lookups/attribute-codes/${attribGroup}`,
    LOOKUP_SALUTATIONS: '/api/v1/regular-order/lookups/salutations',
    LOOKUP_CHARGE_CODES: '/api/v1/regular-order/lookups/charge-codes',
    OPEN_ORDER_ITEMS: (customerId: string) => `/api/v1/regular-order/lookups/open-orders/${customerId}`,
    INVENTORY_SUMMARY: '/api/v1/regular-order/lookups/inventory-summary',
    INVENTORY_TIERS: '/api/v1/regular-order/lookups/inventory-tiers',
    INVENTORY_STOCK_CHECK: '/api/v1/regular-order/lookups/inventory-stock-check',
    GET_ORDER_CHARGES: (orderNo: string) => `/api/v1/regular-order/${orderNo}/charges`,
    ADD_ORDER_CHARGE: (orderNo: string) => `/api/v1/regular-order/${orderNo}/charges`,
    DELETE_ORDER_CHARGE: (orderNo: string, chargeCode: string) => `/api/v1/regular-order/${orderNo}/charges/${chargeCode}`,
    GET_ORDER_NOTES: (orderNo: string) => `/api/v1/regular-order/${orderNo}/notes`,
    SAVE_ORDER_NOTES: (orderNo: string) => `/api/v1/regular-order/${orderNo}/notes`,
    LOOKUP_ORDER_NUMBERS: '/api/v1/regular-order/lookups/order-numbers',
    LOOKUP_CANCEL_CODES: '/api/v1/regular-order/lookups/cancel-codes',
    CANCEL_ORDER: (orderNo: string) => `/api/v1/regular-order/${orderNo}/cancel`,
    CANCEL_ORDER_ITEM: (orderNo: string, itemNo: number) => `/api/v1/regular-order/${orderNo}/items/${itemNo}/cancel`,
    UPDATE_ORDER_ITEM: (orderNo: string, itemNo: number) => `/api/v1/regular-order/${orderNo}/items/${itemNo}`,
    GET_PICK_SLIPS: (orderNo: string) => `/api/v1/regular-order/${orderNo}/pick-slips`,
    GET_ITEM_NOTES: (orderNo: string, itemNo: number) => `/api/v1/regular-order/${orderNo}/items/${itemNo}/notes`,
    SAVE_ITEM_NOTES: (orderNo: string, itemNo: number) => `/api/v1/regular-order/${orderNo}/items/${itemNo}/notes`,
    GET_AUDIT_TRAIL: (orderNo: string) => `/api/v1/order-charges/audit-trail/${orderNo}`,
  },

  EXPORT_ORDER_MANAGEMENT: {
    CREATE_ORDER: '/api/v1/export-orders',
    GET_ORDER: (orderNo: string) => `/api/v1/export-orders/${orderNo}`,
    UPDATE_ORDER: (orderNo: string) => `/api/v1/export-orders/${orderNo}`,
    DELETE_ORDER: (orderNo: string) => `/api/v1/export-orders/${orderNo}`,
    GET_ALL: (take: number, skip: number) => `/api/v1/export-orders/${take}/${skip}`,
    GET_ORDER_ITEMS: (orderNo: string) => `/api/v1/export-orders/${orderNo}/items`,
    ADD_ORDER_ITEM: (orderNo: string) => `/api/v1/export-orders/${orderNo}/items`,
    DELETE_ORDER_ITEM: (orderNo: string, itemNo: number) => `/api/v1/export-orders/${orderNo}/items/${itemNo}`,
    LOOKUP_ORDER_MODES: '/api/v1/export-orders/lookups/order-modes',
    LOOKUP_CUSTOMERS: '/api/v1/export-orders/lookups/customers',
    LOOKUP_BLOOD_TYPES: (productType: string) => `/api/v1/export-orders/lookups/blood-types/${productType}`,
    LOOKUP_CONSIGNEES: (customerId: string) => `/api/v1/export-orders/lookups/consignees/${customerId}`,
    LOOKUP_PAYEES: (customerId: string) => `/api/v1/export-orders/lookups/payees/${customerId}`,
    LOOKUP_CONTRACTS: (customerId: string) => `/api/v1/export-orders/lookups/contracts/${customerId}`,
    LOOKUP_TIERS: (productType: string) => `/api/v1/export-orders/lookups/tiers/${productType}`,
    LOOKUP_ORDER_CLASSES: '/api/v1/export-orders/lookups/order-classes',
    LOOKUP_PRODUCT_TYPES: '/api/v1/export-orders/lookups/product-types',
    LOOKUP_ATTRIBUTE_GROUPS: '/api/v1/export-orders/lookups/attribute-groups',
    LOOKUP_ATTRIBUTE_CODES: (attribGroup: string) => `/api/v1/export-orders/lookups/attribute-codes/${attribGroup}`,
    LOOKUP_SALUTATIONS: '/api/v1/export-orders/lookups/salutations',
    LOOKUP_CHARGE_CODES: '/api/v1/export-orders/lookups/charge-codes',
    OPEN_ORDER_ITEMS: (customerId: string) => `/api/v1/export-orders/lookups/open-orders/${customerId}`,
    INVENTORY_SUMMARY: '/api/v1/export-orders/lookups/inventory-summary',
    INVENTORY_TIERS: '/api/v1/export-orders/lookups/inventory-tiers',
    INVENTORY_STOCK_CHECK: '/api/v1/export-orders/lookups/inventory-stock-check',
    GET_ORDER_CHARGES: (orderNo: string) => `/api/v1/export-orders/${orderNo}/charges`,
    ADD_ORDER_CHARGE: (orderNo: string) => `/api/v1/export-orders/${orderNo}/charges`,
    DELETE_ORDER_CHARGE: (orderNo: string, chargeCode: string) => `/api/v1/export-orders/${orderNo}/charges/${chargeCode}`,
    GET_ORDER_NOTES: (orderNo: string) => `/api/v1/export-orders/${orderNo}/notes`,
    SAVE_ORDER_NOTES: (orderNo: string) => `/api/v1/export-orders/${orderNo}/notes`,
    LOOKUP_STANDING_ORDER_ITEMS: (customerId: string, contractId: string) =>
      `/api/v1/export-orders/lookups/standing-order-items/${encodeURIComponent(customerId)}/${encodeURIComponent(contractId)}`,
    CANCEL_ORDER_ITEM: (orderNo: string, itemNo: number) => `/api/v1/export-orders/${orderNo}/items/${itemNo}/cancel`,
  },

  SPECIAL_ORDER_MANAGEMENT: {
    CREATE_ORDER: '/api/v1/special-orders',
    GET_ORDER: (orderNo: string) => `/api/v1/special-orders/${orderNo}`,
    UPDATE_ORDER: (orderNo: string) => `/api/v1/special-orders/${orderNo}`,
    CANCEL_ORDER: (orderNo: string) => `/api/v1/special-orders/${orderNo}`,
    GET_ALL: (take: number, skip: number) => `/api/v1/special-orders/${take}/${skip}`,
    GET_ORDER_ITEMS: (orderNo: string) => `/api/v1/special-orders/${orderNo}/items`,
    ADD_ORDER_ITEM: (orderNo: string) => `/api/v1/special-orders/${orderNo}/items`,
    DELETE_ORDER_ITEM: (orderNo: string, itemNo: number) => `/api/v1/special-orders/${orderNo}/items/${itemNo}`,
    GET_ITEM_ANTIGENS: (orderNo: string, itemNo: number) => `/api/v1/special-orders/${orderNo}/items/${itemNo}/antigens`,
    ADD_ITEM_ANTIGEN: (orderNo: string, itemNo: number) => `/api/v1/special-orders/${orderNo}/items/${itemNo}/antigens`,
    DELETE_ITEM_ANTIGEN: (orderNo: string, itemNo: number, antigenId: string) => `/api/v1/special-orders/${orderNo}/items/${itemNo}/antigens/${antigenId}`,
    GET_ORDER_CHARGES: (orderNo: string) => `/api/v1/special-orders/${orderNo}/charges`,
    ADD_ORDER_CHARGE: (orderNo: string) => `/api/v1/special-orders/${orderNo}/charges`,
    DELETE_ORDER_CHARGE: (orderNo: string, chargeCode: string) => `/api/v1/special-orders/${orderNo}/charges/${chargeCode}`,
    GET_ORDER_NOTES: (orderNo: string) => `/api/v1/special-orders/${orderNo}/notes`,
    SAVE_ORDER_NOTES: (orderNo: string) => `/api/v1/special-orders/${orderNo}/notes`,
    LOOKUP_ORDER_MODES: '/api/v1/special-orders/lookups/order-modes',
    LOOKUP_CUSTOMERS: '/api/v1/special-orders/lookups/customers',
    LOOKUP_BLOOD_TYPES: (productType: string) => `/api/v1/special-orders/lookups/blood-types/${productType}`,
    LOOKUP_CONSIGNEES: (customerId: string) => `/api/v1/special-orders/lookups/consignees/${customerId}`,
    LOOKUP_PAYEES: (customerId: string) => `/api/v1/special-orders/lookups/payees/${customerId}`,
    LOOKUP_CONTRACTS: (customerId: string) => `/api/v1/special-orders/lookups/contracts/${customerId}`,
    LOOKUP_TIERS: (productType: string) => `/api/v1/special-orders/lookups/tiers/${productType}`,
    LOOKUP_ORDER_CLASSES: '/api/v1/special-orders/lookups/order-classes',
    LOOKUP_PRODUCT_TYPES: '/api/v1/special-orders/lookups/product-types',
    LOOKUP_ATTRIBUTE_GROUPS: '/api/v1/special-orders/lookups/attribute-groups',
    LOOKUP_ATTRIBUTE_CODES: (attribGroup: string) => `/api/v1/special-orders/lookups/attribute-codes/${attribGroup}`,
    LOOKUP_SALUTATIONS: '/api/v1/special-orders/lookups/salutations',
    LOOKUP_CHARGE_CODES: '/api/v1/special-orders/lookups/charge-codes',
    LOOKUP_ANTIGENS: '/api/v1/special-orders/lookups/antigens',
    LOOKUP_SOURCE_PRODUCTS: (productType: string) => `/api/v1/special-orders/lookups/source-products/${productType}`,
    OPEN_ORDER_ITEMS: (customerId: string) => `/api/v1/special-orders/lookups/open-orders/${customerId}`,
    INVENTORY_SUMMARY: '/api/v1/special-orders/lookups/inventory-summary',
    INVENTORY_TIERS: '/api/v1/special-orders/lookups/inventory-tiers',
    INVENTORY_STOCK_CHECK: '/api/v1/special-orders/lookups/inventory-stock-check',
    GET_ITEM_NOTES: (orderNo: string, itemNo: number) => `/api/v1/special-orders/${orderNo}/items/${itemNo}/notes`,
    SAVE_ITEM_NOTES: (orderNo: string, itemNo: number) => `/api/v1/special-orders/${orderNo}/items/${itemNo}/notes`,
  },
  ENTER_TESTS_MAPPING: {
    CONTRACTS_DROPDOWN: (search?: string) =>
      `/api/v1/enter-tests-mapping/contracts-dropdown${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    TESTS_DROPDOWN: (contractId: string) =>
      `/api/v1/enter-tests-mapping/tests-dropdown/${encodeURIComponent(contractId)}`,
    GET_MATRIX: (contractId: string) =>
      `/api/v1/enter-tests-mapping/${encodeURIComponent(contractId)}`,
    SAVE: '/api/v1/enter-tests-mapping/save',
  },

  EQUIPMENT_MASTER_CODES: {
    CODE_TYPES: '/api/v1/equipment-master-codes/code-types',
    USER_GROUPS: '/api/v1/equipment-master-codes/user-groups',
    GET_BY_CODE_TYPE: (codeType: string, searchTerm?: string, take?: number, skip?: number, sort?: string, effectiveDate?: string, terminationDate?: string, effectiveDatePeriod?: string, terminationDatePeriod?: string, userGroup?: string) => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('searchTerm', searchTerm);
      if (take != null) params.set('take', take.toString());
      if (skip != null) params.set('skip', skip.toString());
      if (sort) params.set('sort', sort);
      if (effectiveDate) params.set('effectiveDate', effectiveDate);
      if (terminationDate) params.set('terminationDate', terminationDate);
      if (effectiveDatePeriod) params.set('effectiveDatePeriod', effectiveDatePeriod);
      if (terminationDatePeriod) params.set('terminationDatePeriod', terminationDatePeriod);
      if (userGroup) params.set('userGroup', userGroup);
      const query = params.toString();
      return `/api/v1/equipment-master-codes/${encodeURIComponent(codeType)}${query ? `?${query}` : ''}`;
    },
    GET_BY_KEY: (codeType: string, code: string) => `/api/v1/equipment-master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`,
    CREATE: '/api/v1/equipment-master-codes',
    UPDATE: (codeType: string, code: string) => `/api/v1/equipment-master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`,
    DELETE: (codeType: string, code: string) => `/api/v1/equipment-master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`,
  },

  LABORATORY: {
    VALID_COLLECTION_FACILITIES: {
      BASE: '/api/v1/valid-collection-facilities',
      CONTRACTS: '/api/v1/valid-collection-facilities/contracts',
    },
    RESULTS_EXTRACT_QUERY: '/api/v1/results-extract-query',
    RESULTS_EXTRACT_QUERY_CONTRACTS: (searchTerm?: string, take?: number, skip?: number) => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('searchTerm', searchTerm);
      if (take != null) params.set('take', take.toString());
      if (skip != null) params.set('skip', skip.toString());
      const query = params.toString();
      return `/api/v1/results-extract-query/contracts${query ? `?${query}` : ''}`;
    },
    RESULTS_EXTRACT_QUERY_VALID_CONTRACTS: '/api/v1/results-extract-query/valid-contracts',
    RESULTS_EXTRACT_QUERY_BATCH_DETAIL: '/api/v1/results-extract-query/batch-detail',
    INTERIM_RESULTS_QUERY: '/api/v1/interim-results/query',
    INTERIM_RESULTS_CONTRACTS: '/api/v1/interim-results/contracts',
    INTERIM_RESULTS_TESTS: (contractId: string) =>
      `/api/v1/interim-results/tests/${encodeURIComponent(contractId)}`,
    INTERIM_RESULTS_CODES: '/api/v1/interim-results/codes',
    INTERIM_RESULTS_BATCHES: '/api/v1/interim-results/batches',
    SAMPLE_TRANSFER_QUERY: '/api/v1/sample-transfer-query/query',
    SAMPLE_TRANSFER_QUERY_CONTRACTS: '/api/v1/sample-transfer-query/contracts',
    SAMPLE_TRANSFER_QUERY_TEST_IDS: '/api/v1/sample-transfer-query/test-ids',
    SAMPLE_TRANSFER_QUERY_FACILITIES: '/api/v1/sample-transfer-query/facilities',

    // Contract Profile Test Query (RGPROFQ - MLT-13695)
    CONTRACT_PROFILE_TEST_QUERY: {
      CONTRACTS: (searchText?: string) => {
        const params = searchText ? `?searchText=${encodeURIComponent(searchText)}` : '';
        return `/api/v1/contract-profile-test-query/contracts${params}`;
      },
      PROFILE_SETS: (contractId: string) =>
        `/api/v1/contract-profile-test-query/profile-sets?contractId=${encodeURIComponent(contractId)}`,
      VALIDATE_PROFILE_SET: '/api/v1/contract-profile-test-query/validate-profile-set',
      PROFILE_TESTS: '/api/v1/contract-profile-test-query/profile-tests',
    },
    ENTER_NT_RESULTS: {
      BASE: '/api/v1/laboratory/enter-nt-results',
      CREATE_BATCH: '/api/v1/laboratory/enter-nt-results/batch',
      ADD_UNIT: (batchId: string) => `/api/v1/laboratory/enter-nt-results/batch/${encodeURIComponent(batchId)}/unit`,
      GET_BATCHES: (take: number, skip: number) => `/api/v1/laboratory/enter-nt-results/batches?take=${take}&skip=${skip}`,
      GET_BATCH: (batchId: string) => `/api/v1/laboratory/enter-nt-results/batch/${encodeURIComponent(batchId)}`,
      GET_TEST: (testId: string) => `/api/v1/laboratory/enter-nt-results/tests/${encodeURIComponent(testId)}`,
      GET_TESTS: (testGroup?: string) => testGroup
        ? `/api/v1/laboratory/enter-nt-results/tests?testGroup=${encodeURIComponent(testGroup)}`
        : '/api/v1/laboratory/enter-nt-results/tests',
      GET_TEST_GROUP_VALIDATE: (code: string) => `/api/v1/laboratory/enter-nt-results/test-groups/${encodeURIComponent(code)}/validate`,
      GET_TEST_GROUPS: '/api/v1/laboratory/enter-nt-results/test-groups',
    },
  },

  INVENTORY_MANAGEMENT: {
    UNIT_PRODUCT_HISTORY: {
      VALIDATE: (unitId: string) => `/api/v1/unit-product-history/validate/${encodeURIComponent(unitId)}`,
      PRODUCTS: (unitId: string, collectionDate: string) =>
        `/api/v1/unit-product-history/units/${encodeURIComponent(unitId)}/products?collectionDate=${encodeURIComponent(collectionDate)}`,
      HISTORY: (unitId: string, productCode: string, aliquot: string, collectionDate: string) =>
        `/api/v1/unit-product-history/units/${encodeURIComponent(unitId)}/products/${encodeURIComponent(productCode)}/${encodeURIComponent(aliquot)}/history?collectionDate=${encodeURIComponent(collectionDate)}`,
    },
  },

  RESEARCH_PRODUCT_LABELING: {
    VALIDATE_UNIT: (unitId: string) =>
      `/api/v1/research-product-labeling/validate-unit/${encodeURIComponent(unitId)}`,
    VALIDATE_PRODUCT: '/api/v1/research-product-labeling/validate-product',
    RESEARCH_TYPES: '/api/v1/research-product-labeling/research-types',
    RESEARCH_PRODUCTS: '/api/v1/research-product-labeling/research-products',
    VALIDATE_RESEARCH_PRODUCT: '/api/v1/research-product-labeling/validate-research-product',
    LABELED_PRODUCTS: (unitId: string) =>
      `/api/v1/research-product-labeling/labeled-products/${encodeURIComponent(unitId)}`,
    CATALOG_NUMBERS: '/api/v1/research-product-labeling/catalog-numbers',
    VALIDATE_CATALOG: '/api/v1/research-product-labeling/validate-catalog',
    CHECK_BIOHAZARD: '/api/v1/research-product-labeling/check-biohazard',
    CALCULATE_EXPIRY: '/api/v1/research-product-labeling/calculate-expiry',
    LABEL_PREVIEW: '/api/v1/research-product-labeling/label-preview',
    GENERATE_LABEL: '/api/v1/research-product-labeling/label',
    COMPLETE_RELABELING: '/api/v1/research-product-labeling/complete-relabeling',
    CHAPTER_CONFIG: '/api/v1/research-product-labeling/chapter-config',
  },
  
  BLOOD_CENTER_INVENTORY_LEVELS: {
    BASE: '/api/v1/blood-center-inventory-levels',
    QUERY: '/api/v1/blood-center-inventory-levels/query',
    INVENTORY_CLASSES: '/api/v1/blood-center-inventory-levels/inventory-classes',
    PRODUCT_TYPES: '/api/v1/blood-center-inventory-levels/product-types',
    BLOOD_TYPES: '/api/v1/blood-center-inventory-levels/blood-types',
    ATTRIBUTE_GROUPS: '/api/v1/blood-center-inventory-levels/attribute-groups',
    ATTRIBUTE_CODES: (attributeGroup: string) =>
      `/api/v1/blood-center-inventory-levels/attribute-codes/${encodeURIComponent(attributeGroup)}`,
  },

  RGT_RESULTS_MATRIX: {
    BASE: '/api/v1/rgt-results-matrix',
    GET_ALL: (take: number, skip: number) => `/api/v1/rgt-results-matrix/${take}/${skip}`,
    GET_BY_ID: (testId: string, resultStatus: string, contractId: string) =>
      `/api/v1/rgt-results-matrix/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`,
    CREATE: '/api/v1/rgt-results-matrix',
    UPDATE: (testId: string, resultStatus: string, contractId: string) =>
      `/api/v1/rgt-results-matrix/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`,
    DELETE: (testId: string, resultStatus: string, contractId: string) =>
      `/api/v1/rgt-results-matrix/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`,
    DROPDOWNS: {
      CONTRACTS: '/api/v1/rgt-results-matrix/dropdowns/contracts',
      TESTS: '/api/v1/rgt-results-matrix/dropdowns/tests',
      RESULT_STATUSES: '/api/v1/rgt-results-matrix/dropdowns/result-statuses',
    },
  },

  CONFIRMATORY_QC: {
    BASE: '/api/v1/confirmatory-qc-units',
    QUERY: '/api/v1/confirmatory-qc-units/query',
    UNITS: (sessionId: string) => `/api/v1/confirmatory-qc-units/${encodeURIComponent(sessionId)}/units`,
    UNIT_DETAIL: (sessionId: string, unitId: string) =>
      `/api/v1/confirmatory-qc-units/${encodeURIComponent(sessionId)}/unit/${encodeURIComponent(unitId)}`,
    RECONCILE_ALL: (sessionId: string) =>
      `/api/v1/confirmatory-qc-units/${encodeURIComponent(sessionId)}/reconcile-all`,
    SAVE: (sessionId: string) =>
      `/api/v1/confirmatory-qc-units/${encodeURIComponent(sessionId)}/save`,
    CLEAR_SESSION: (sessionId: string) =>
      `/api/v1/confirmatory-qc-units/${encodeURIComponent(sessionId)}`,
    CONTRACTS: '/api/v1/confirmatory-qc-units/contracts',
    BATCHES: (contractId?: string) => {
      const baseUrl = '/api/v1/confirmatory-qc-units/batches';
      return contractId ? `${baseUrl}?contractId=${encodeURIComponent(contractId)}` : baseUrl;
    },
    TEST_SERIES: '/api/v1/confirmatory-qc-units/test-series',
    TESTS: '/api/v1/confirmatory-qc-units/tests',
  },

  TEST_KIT_REAGENTS_QUERY: {
    GET_TEST_KITS: '/api/v1/test-kit-reagents-query',
    GET_REAGENTS: (testKitId: string) => `/api/v1/test-kit-reagents-query/${encodeURIComponent(testKitId)}/reagents`,
    GET_BATCHES: (testKitId: string) => `/api/v1/test-kit-reagents-query/${encodeURIComponent(testKitId)}/batches`,
    GET_TEST_IDS_LOV: '/api/v1/test-kit-reagents-query/test-ids-lov',
  },

  REAGENT_KIT_NO_PRE_QUAL: {
    GET_TEST_KITS: '/api/v1/test-kit-reagents-query',
    CREATE_TEST_KIT: '/api/v1/test-kit-reagents-query',
    UPDATE_TEST_KIT: (testKitId: string) => `/api/v1/test-kit-reagents-query/${encodeURIComponent(testKitId)}`,
    GET_REAGENTS: (testKitId: string) => `/api/v1/test-kit-reagents-query/${encodeURIComponent(testKitId)}/reagents`,
    GET_VALID_TESTS: '/api/v1/test-kit-reagents-query/valid-tests',
    GET_REAGENT_LOV: '/api/v1/test-kit-reagents-query/reagent-lov',
    GET_TEST_GROUP: (testId: string) => `/api/v1/test-kit-reagents-query/test-group/${encodeURIComponent(testId)}`,
  },

  REGIONAL_TESTING_CONTRACT: {
    BASE: '/api/v1/regional-testing-contract',
    QUERY: (take: number, skip: number) => `/api/v1/regional-testing-contract/${take}/${skip}`,
    GET_BY_ID: (contractId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}`,
    CREATE: '/api/v1/regional-testing-contract',
    UPDATE: (contractId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}`,
    DELETE: (contractId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}`,
    FILTER_OPTIONS: '/api/v1/regional-testing-contract/filter-options',
    AVAILABLE_CHAPTERS: '/api/v1/regional-testing-contract/available-chapters',
    GENERATE_CONTRACT_ID: (contractType: string) => `/api/v1/regional-testing-contract/generate-contract-id/${encodeURIComponent(contractType)}`,
    ADDRESS: {
      GET: (contractId: string, addressId: number) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}/address/${addressId}`,
      UPSERT: (contractId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}/address`,
    },
    TEST_GROUPS: (contractId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}/test-groups`,
    PROFILE_TEST_LOOKUP: (contractId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}/profile-test-lookup`,
    NON_PROFILE_TEST_LOOKUP: (contractId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}/non-profile-test-lookup`,
    REACTIVE_TEST_LOOKUP: '/api/v1/regional-testing-contract/reactive-test-lookup',
    REACTIVE_TEST_RESULTS: (testId: string) => `/api/v1/regional-testing-contract/reactive-test-results/${encodeURIComponent(testId)}`,
    CONFIRMATORY_TEST_LOOKUP: (reactiveTestId: string) => `/api/v1/regional-testing-contract/confirmatory-test-lookup/${encodeURIComponent(reactiveTestId)}`,
    CONTRACT_TESTS: {
      GET: (contractId: string, profileSetId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}/contract-tests/${encodeURIComponent(profileSetId)}`,
      SAVE: (contractId: string, profileSetId: string) => `/api/v1/regional-testing-contract/${encodeURIComponent(contractId)}/contract-tests/${encodeURIComponent(profileSetId)}`,
    },
    PROFILES: {
      BASE: '/api/v1/regional-testing-contract-profiles',
      QUERY: (take: number, skip: number) => `/api/v1/regional-testing-contract-profiles/${take}/${skip}`,
      GET_BY_ID: (contractId: string, profileSetId: string) =>
        `/api/v1/regional-testing-contract-profiles/${encodeURIComponent(contractId)}/${encodeURIComponent(profileSetId)}`,
      CREATE: '/api/v1/regional-testing-contract-profiles',
      UPDATE: (contractId: string, profileSetId: string) =>
        `/api/v1/regional-testing-contract-profiles/${encodeURIComponent(contractId)}/${encodeURIComponent(profileSetId)}`,
      DELETE: (contractId: string, profileSetId: string) =>
        `/api/v1/regional-testing-contract-profiles/${encodeURIComponent(contractId)}/${encodeURIComponent(profileSetId)}`,
    },
  },

  EQUIPMENT_QC_ENTRY: {
    CREATE_QC_HEADER: '/api/v1/equipment-qc/qc-header',
    QC_CONTROL_DETAILS: '/api/v1/equipment-qc/qc-control-details',
    QC_HEADER: (qcReference: string) => `/api/v1/equipment-qc/qc-header/${encodeURIComponent(qcReference)}`,
    QC_DETAILS: (qcReference: string) => `/api/v1/equipment-qc/qc-details/${encodeURIComponent(qcReference)}`,
    EQUIPMENT_TYPES: '/api/v1/equipment-qc/equipment-types',
    EQUIPMENT_IDS: '/api/v1/equipment-qc/equipment-ids',
    EQUIPMENT_REFERENCES: '/api/v1/equipment-qc/equipment-references',
    QC_EVENTS: '/api/v1/equipment-qc/qc-events',
    QC_TYPES: '/api/v1/equipment-qc/qc-types',
    USERS: '/api/v1/equipment-qc/users',
    QC_RESULTS: '/api/v1/equipment-qc/qc-results',
    REVIEW_CODE: '/api/v1/equipment-qc/review-code',
    PARSE_BARCODE: '/api/v1/equipment-qc/parse-barcode',
  },

  FINANCE_INTERFACE_DETAILS: {
    ORDERS: '/api/v1/finance-interface-details/orders',
    INSERT_DATES: (orderNo: string) =>
      `/api/v1/finance-interface-details/insert-dates/${encodeURIComponent(orderNo)}`,
    SEARCH: '/api/v1/finance-interface-details/search',
  },

  ORDER_HISTORY: {
    SEARCH: '/api/v1/order-history/search',
    GET: (orderNo: string) => `/api/v1/order-history/${encodeURIComponent(orderNo)}`,
    ITEM_NOTES: (orderNo: string, itemNo: number) =>
      `/api/v1/order-history/${encodeURIComponent(orderNo)}/items/${itemNo}/notes`,
    ITEM_ATTRIBUTES_ANTIGENS: (orderNo: string, itemNo: number) =>
      `/api/v1/order-history/${encodeURIComponent(orderNo)}/items/${itemNo}/attributes-antigens`,
    SHIPPED_PRODUCTS: (orderNo: string) =>
      `/api/v1/order-history/${encodeURIComponent(orderNo)}/shipped-products`,
    SHIPPED_ATTRIBUTES_ANTIGENS: (orderNo: string) =>
      `/api/v1/order-history/${encodeURIComponent(orderNo)}/shipped-attributes-antigens`,
  },

  STANDING_ORDER_QUERY: {
    SEARCH: '/api/v1/standing-order-query/search',
    ITEMS: (contractId: string, consigneeId: string, weekDay: string) =>
      `/api/v1/standing-order-query/${encodeURIComponent(contractId)}/${encodeURIComponent(consigneeId)}/${encodeURIComponent(weekDay)}/items`,
    LOOKUPS: {
      WEEKDAYS: '/api/v1/standing-order-query/lookups/weekdays',
      CUSTOMER_TYPES: '/api/v1/standing-order-query/lookups/customer-types',
      CUSTOMERS: '/api/v1/standing-order-query/lookups/customers',
    },
  },

  LABORATORY_FUNCTIONS: {
    SUPPLIERS_LOOKUP: '/api/v1/suppliers/lookup',
    SUPPLIER_QUERY: {
      SUPPLIERS_DROPDOWN: '/api/v1/supplier-query/suppliers-dropdown',
      SEARCH: '/api/v1/supplier-query/search',
      GET_BY_ID: (reagentId: string) => `/api/v1/supplier-query/${encodeURIComponent(reagentId)}`,
    },
    FIRST_TECH_TEST_RESULT: {
      BASE: '/api/v1/first-tech-test-result',
      FILTER_OPTIONS: '/api/v1/first-tech-test-result/filter-options',
      TB_WS_OPTIONS: '/api/v1/first-tech-test-result/tb-ws-options',
      TEST_ID_OPTIONS: '/api/v1/first-tech-test-result/test-id-options',
      TEST_KIT_OPTIONS: '/api/v1/first-tech-test-result/test-kit-options',
      RESULT_CODES: (testId: string) => `/api/v1/first-tech-test-result/result-codes/${encodeURIComponent(testId)}`,
      SAVE: '/api/v1/first-tech-test-result/save',
      VALIDATE_UNIT: (unitId: string) => `/api/v1/first-tech-test-result/validate-unit/${encodeURIComponent(unitId)}`,
      VALIDATE_BATCH: (tbId: string) => `/api/v1/first-tech-test-result/validate-batch/${encodeURIComponent(tbId)}`,
    },
    MAINTAIN_BATCH_DATA: {
      LOV: '/api/v1/maintain-batch-data/lov',
      GET_BY_ID: (batchId: string) =>
        `/api/v1/maintain-batch-data/${encodeURIComponent(batchId)}`,
      UPDATE: '/api/v1/maintain-batch-data',
    },
    CANCEL_TEST_BATCH: {
      WORKSHEETS: '/api/v1/cancel-test-batch/worksheets',
      TESTS: (tbId: string) =>
        `/api/v1/cancel-test-batch/worksheets/${encodeURIComponent(tbId)}/tests`,
      UNITS: (tbId: string) =>
        `/api/v1/cancel-test-batch/worksheets/${encodeURIComponent(tbId)}/units`,
      CANCEL: '/api/v1/cancel-test-batch/cancel',
    },
  },

  LOT_NUMBER_QUERY: {
    LOT_TYPES: '/api/v1/lot-number-query/lot-types',
    LOT_NUMBERS: (lotType: string) =>
      `/api/v1/lot-number-query/lot-numbers/${encodeURIComponent(lotType)}`,
    QUERY: '/api/v1/lot-number-query',
  },

  // Customer Orders Query (OCQ) - JIRA: MLT-14025
  CUSTOMER_ORDERS_QUERY: {
    SEARCH: '/api/v1/customer-orders-query/search',
    ITEM_DETAIL: (orderNo: string, itemNo: number) =>
      `/api/v1/customer-orders-query/${encodeURIComponent(orderNo)}/items/${itemNo}`,
    CUSTOMERS: (search: string) =>
      `/api/v1/customer-orders-query/customers?search=${encodeURIComponent(search)}`,
    LOOKUPS: (codeType: string) =>
      `/api/v1/customer-orders-query/lookups/${encodeURIComponent(codeType)}`,
  },

  // Box Details Query (BOXDTQ) - JIRA: MLT-14101
  BOX_DETAILS: {
    SEARCH: '/api/v1/box-details/search',
    SEARCH_OPEN: '/api/v1/box-details/open-boxes',
    GET_BY_ID: (boxId: string) =>
      `/api/v1/box-details/${encodeURIComponent(boxId)}`,
  },

  // Boxes Ready for Shipment (SHQBOXES) - JIRA: MLT-14102
  BOXES_READY_FOR_SHIPMENT: {
    GET_ALL: '/api/v1/boxes-ready-for-shipment',
  },

  UNIT_QUERY: {
    GET_BY_UNIT_ID: (unitId: string) =>
      `/api/v1/unit-query/${encodeURIComponent(unitId)}`,
    GET_BY_OS_UNIT_ID: (osUnitId: string) =>
      `/api/v1/unit-query/by-os-unit/${encodeURIComponent(osUnitId)}`,
    SEARCH: (take: number, skip: number) =>
      `/api/v1/unit-query/search/${take}/${skip}`,
    GET_COMPONENTS: (unitId: string) =>
      `/api/v1/unit-query/${encodeURIComponent(unitId)}/components`,
    GET_UNIT_TEST_DETAILS: (unitId: string) =>
      `/api/v1/unit-query/${encodeURIComponent(unitId)}/unit-test-details`,
    GET_UNIT_NOTES: (unitId: string) =>
      `/api/v1/unit-query/${encodeURIComponent(unitId)}/unit-notes`,
    GET_COMPONENT_NOTES: (unitId: string) =>
      `/api/v1/unit-query/${encodeURIComponent(unitId)}/component-notes`,
    GET_FREEZE_DETAILS: (unitId: string) =>
      `/api/v1/unit-query/${encodeURIComponent(unitId)}/freeze-details`,
  },

  PACK_RECOVERED_PLASMA: {
    CUSTOMERS: '/api/v1/pack-recovered-plasma/customers',
    ORDERS: '/api/v1/pack-recovered-plasma/orders',
    PICK_SLIPS_QUERY: (take: number, skip: number) => `/api/v1/pack-recovered-plasma/pick-slips/${take}/${skip}`,
    PICK_SLIP_BY_ID: (id: string) => `/api/v1/pack-recovered-plasma/pick-slips/${encodeURIComponent(id)}`,
    CREATE_PICK_SLIP: '/api/v1/pack-recovered-plasma/pick-slips',
    BOXES_BY_PICK_SLIP: (pickSlipId: string) => `/api/v1/pack-recovered-plasma/boxes/${encodeURIComponent(pickSlipId)}`,
    BOX_BY_ID: (boxId: string) => `/api/v1/pack-recovered-plasma/boxes/detail/${encodeURIComponent(boxId)}`,
    CREATE_BOX: '/api/v1/pack-recovered-plasma/boxes',
    PACK: '/api/v1/pack-recovered-plasma/pack',
    UNPACK: '/api/v1/pack-recovered-plasma/unpack',
    PRODUCT_BY_DIN: (din: string) => `/api/v1/pack-recovered-plasma/products/detail/${encodeURIComponent(din)}`,
    AVAILABLE_PRODUCTS: '/api/v1/pack-recovered-plasma/products/available',
    PACKED_PRODUCTS_BY_BOX: (boxId: string) => `/api/v1/pack-recovered-plasma/packed-products/box/${encodeURIComponent(boxId)}`,
    PACKED_PRODUCTS_BY_PICK_SLIP: (pickSlipId: string) => `/api/v1/pack-recovered-plasma/packed-products/pickslip/${encodeURIComponent(pickSlipId)}`,
  },

  // Order Charges by Order No (MLT-14018)
  // API Documentation: oeqchrg-api-documentation.md
  ORDER_CHARGES: {
    BASE: '/api/v1/order-charges',
    GET_ORDER_CHARGES: (orderNo: string) => `/api/v1/order-charges/${encodeURIComponent(orderNo)}`,
    ORDER_TYPES: '/api/v1/order-charges/order-types',
    ORDERS: '/api/v1/order-charges/orders',
    ORDERS_BY_TYPE: (orderType: string) => `/api/v1/order-charges/orders?orderType=${encodeURIComponent(orderType)}`,
    AUDIT_TRAIL: (orderNo: string) => `/api/v1/order-charges/audit-trail/${encodeURIComponent(orderNo)}`,
    ORDERED_ANTIGENS: (orderNo: string) => `/api/v1/order-charges/ordered-antigens/${encodeURIComponent(orderNo)}`,
    ORDERED_ATTRIBUTES: (orderNo: string) => `/api/v1/order-charges/ordered-attributes/${encodeURIComponent(orderNo)}`,
  },

  // Sample Test Linkage (STMAP / VTESAMAP) - Confirmatory Administration
  SAMPLE_TEST_LINKAGE: {
    SAMPLE_TYPES: '/api/v1/sample-test-linkage/sample-types',
    VALID_TESTS: '/api/v1/sample-test-linkage/valid-tests',
    TEST_LINKAGES: (sampleType: string) =>
      `/api/v1/sample-test-linkage/test-linkages/${encodeURIComponent(sampleType)}`,
    SAVE: '/api/v1/sample-test-linkage/test-linkages/save',
  },

  SHIPMENTS_IN_TRANSIT: {
    SHIPMENT_LOOKUP: '/api/v1/shipments-in-transit/shipment-lookup',
    BOX_LOOKUP: (shipmentNo: string) =>
      `/api/v1/shipments-in-transit/box-lookup/${encodeURIComponent(shipmentNo)}`,
    SEARCH: '/api/v1/shipments-in-transit/search',
  },

  // Testing Modules - Multiple Observation Testing
  TESTING_MODULES: {
    ENTER_TEST_OBSERVATIONS_TECH1: {
      BASE: '/api/v1/testing-modules/test-observations-tech1',
      // TODO: Add actual API endpoints once backend is implemented
      // Expected endpoints:
      // - GET /load-options - Load initial dropdown options
      // - GET /observation-data - Load observation data for selected filters
      // - POST /save - Save observation data
      // - GET /notes/{unitId} - Load notes for unit
      // - POST /notes - Add new note
      // - PUT /notes/{auditKey} - Update note
      // - DELETE /notes/{auditKey} - Delete note
    },
  },

  XML_ERROR_LOG: {
    PLASMA_FILE_TYPES: '/api/v1/xml-error-log/plasma-file-types',
    SEARCH: '/api/v1/xml-error-log/search',
  },

  // Special Order Allocation (MLT-14033 - SALLO)
  SPECIAL_ORDER_ALLOCATION: {
    BASE: '/api/v1/special-order-allocation',
    SEARCH: (take: number, skip: number) =>
      `/api/v1/special-order-allocation/${take}/${skip}`,
    GET_BY_ID: (pickSlipId: string, itemNo: number, unitId: string) =>
      `/api/v1/special-order-allocation/${pickSlipId}/${itemNo}/${encodeURIComponent(unitId)}`,
    ORDER_ITEMS: (orderNo: string, take: number, skip: number) =>
      `/api/v1/special-order-allocation/order-items/${orderNo}/${take}/${skip}`,
    CREATE: '/api/v1/special-order-allocation',
    UPDATE: (pickSlipId: string, itemNo: number, unitId: string) =>
      `/api/v1/special-order-allocation/${pickSlipId}/${itemNo}/${encodeURIComponent(unitId)}`,
    DELETE: (pickSlipId: string, itemNo: number, unitId: string, orderNo: string) =>
      `/api/v1/special-order-allocation/${pickSlipId}/${itemNo}/${encodeURIComponent(unitId)}/${orderNo}`,
    ORDER_HEADER: (orderNo: string) =>
      `/api/v1/special-order-allocation/order-header/${orderNo}`,
    PICK_SLIPS: (orderNo: string) =>
      `/api/v1/special-order-allocation/pick-slips/${orderNo}`,
    LOOKUP_ORDERS: (orderType: string) =>
      `/api/v1/special-order-allocation/lookups/orders/${encodeURIComponent(orderType)}`,
    ORDER_ITEM_ANTIGENS: (orderNo: string, itemNo: number) =>
      `/api/v1/special-order-allocation/order-item-antigens/${orderNo}/${itemNo}`,
    ORDER_ITEM_ATTRIBUTES: (orderNo: string, itemNo: number) =>
      `/api/v1/special-order-allocation/order-item-attributes/${orderNo}/${itemNo}`,
    ALLOCATED_UNITS: (orderNo: string, itemNo: number) =>
      `/api/v1/special-order-allocation/allocated-units/${orderNo}/${itemNo}`,
    INVENTORY_LEVELS: (productType: string, bloodType: string) =>
      `/api/v1/special-order-allocation/inventory-levels/${encodeURIComponent(productType)}/${encodeURIComponent(bloodType)}`,
    MATCHING_PRODUCTS: '/api/v1/special-order-allocation/matching-products',
    ALLOCATE_UNITS: '/api/v1/special-order-allocation/allocate-units',
    BACK_ORDER: (orderNo: string, itemNo: number) =>
      `/api/v1/special-order-allocation/back-order/${orderNo}/${itemNo}`,
    UNIT_ANTIGENS_ATTRIBUTES: (unitId: string, collDate: string, productCode: string) =>
      `/api/v1/special-order-allocation/unit-antigens-attributes/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}`,
  },

  SHIPMENTS_BY_SHIP_DATE: {
    BASE: '/api/v1/shipments-by-ship-date',
    SEARCH: (take: number, skip: number) =>
      `/api/v1/shipments-by-ship-date/${take}/${skip}`,
    GET_BY_SHIPMENT_NO: (shipmentNo: string) =>
      `/api/v1/shipments-by-ship-date/${encodeURIComponent(shipmentNo)}`,
    GET_PRODUCTS: (shipmentNo: string) =>
      `/api/v1/shipments-by-ship-date/${encodeURIComponent(shipmentNo)}/products`,
    GET_BOXES: (shipmentNo: string) =>
      `/api/v1/shipments-by-ship-date/${encodeURIComponent(shipmentNo)}/box-details`,
    GET_ORDERS: (shipmentNo: string) =>
      `/api/v1/shipments-by-ship-date/${encodeURIComponent(shipmentNo)}/order-details`,
    GET_NOTES: (noteId: number) =>
      `/api/v1/shipments-by-ship-date/${noteId}/delivery-notes`,
    FILTER_OPTIONS: '/api/v1/shipments-by-ship-date/filter-options',
  },

  DELIVERED_SHIPMENTS: {
    BASE: '/api/v1/delivered-shipments',
    GET_BY_SHIPMENT_NO: (shipmentNo: string) =>
      `/api/v1/delivered-shipments/${encodeURIComponent(shipmentNo)}`,
    GET_HEADER: (shipmentNo: string) =>
      `/api/v1/delivered-shipments/${encodeURIComponent(shipmentNo)}/header`,
    GET_BOXES: (shipmentNo: string) =>
      `/api/v1/delivered-shipments/${encodeURIComponent(shipmentNo)}/boxes`,
    SEARCH: (take: number, skip: number) =>
      `/api/v1/delivered-shipments/${take}/${skip}`,
  },

  IMPORTED_BLOOD_CONTRACT: {
    SEARCH: '/api/v1/imported-blood-contract/search',
    GET_BY_ID: (contractId: string, contractType: string) =>
      `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/${encodeURIComponent(contractType)}`,
    CREATE: '/api/v1/imported-blood-contract',
    UPDATE: (contractId: string, contractType: string) =>
      `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/${encodeURIComponent(contractType)}`,
    DELETE: (contractId: string, contractType: string) =>
      `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/${encodeURIComponent(contractType)}`,
    TESTS: {
      GET: (contractId: string) =>
        `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/tests`,
      BULK_UPSERT: (contractId: string) =>
        `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/tests/bulk`,
      DELETE: (contractId: string, testId: string, auditKey: number) =>
        `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/tests/${encodeURIComponent(testId)}/${auditKey}`,
    },
    CONTACTS: {
      GET: (contractId: string) =>
        `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/contacts`,
      BULK_SAVE: (contractId: string) =>
        `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/contacts/bulk`,
      DELETE: (contractId: string, contactId: number) =>
        `/api/v1/imported-blood-contract/${encodeURIComponent(contractId)}/contacts/${contactId}`,
    },
    LOV: {
      STATE_CODES: '/api/v1/imported-blood-contract/lov/state-codes',
      BARCODE_PROTOCOLS: '/api/v1/imported-blood-contract/lov/barcode-protocols',
      TESTS: '/api/v1/imported-blood-contract/lov/tests',
    },
  },

  // Emergency Medical Release (MLT-12584, EMGREL)
  EMERGENCY_MEDICAL_RELEASE: {
    GET_COMPONENT: (unitId: string) =>
      `/api/v1/emergency-medical-release/component/${encodeURIComponent(unitId)}`,
    GET_ABO_VALUES: '/api/v1/emergency-medical-release/abo-values',
    GET_OVERRIDE_CODES: '/api/v1/emergency-medical-release/override-codes',
    GET_PRODUCTS: (unitId: string) =>
      `/api/v1/emergency-medical-release/products/${encodeURIComponent(unitId)}`,
    GET_COMPONENT_PREFIXES: (unitId: string, productCode: string) =>
      `/api/v1/emergency-medical-release/component-prefixes/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    RELEASE: '/api/v1/emergency-medical-release/release',
    PROCESS_LABEL: '/api/v1/emergency-medical-release/process-label',
    LOG_ABANDONED: '/api/v1/emergency-medical-release/log-abandoned',
  },
  SKIP_RESULTS_FROM_EXTRACTION: {
    BASE: '/api/v1/skip-results-from-extraction',
    CONTRACTS: '/api/v1/skip-results-from-extraction/contracts',
    OPTION_CODES: '/api/v1/skip-results-from-extraction/option-codes',
    REASON_CODES: '/api/v1/skip-results-from-extraction/reason-codes',
    BATCHES: '/api/v1/skip-results-from-extraction/batches',
    BATCH_UNITS: '/api/v1/skip-results-from-extraction/batch-units',
    SKIPPED_UNITS: '/api/v1/skip-results-from-extraction/skipped-units/search-sort-filter',
    VALIDATE_UNIT: '/api/v1/skip-results-from-extraction/validate-unit',
    SKIP: '/api/v1/skip-results-from-extraction/skip',
    RESET: '/api/v1/skip-results-from-extraction/reset',
  },

  ADHOC_TUBE_CHECKIN: {
    CONTRACTS: '/api/v1/adhoc-tube-checkin/contracts',
    CONTRACT_BY_ID: (contractId: string) => `/api/v1/adhoc-tube-checkin/contracts/${contractId}`,
    BATCHES: (contractId: string) => `/api/v1/adhoc-tube-checkin/contracts/${contractId}/batches`,
    BATCH_DETAILS: (contractId: string, batchId: string) => `/api/v1/adhoc-tube-checkin/contracts/${contractId}/batches/${batchId}`,
    BATCH_UNITS: (batchId: string) => `/api/v1/adhoc-tube-checkin/batches/${batchId}/units`,
    BATCH_TESTS: (batchId: string) => `/api/v1/adhoc-tube-checkin/batches/${batchId}/tests`,
    CONTRACT_SUFFIXES: (contractId: string, batchId: string) => `/api/v1/adhoc-tube-checkin/contracts/${contractId}/batches/${batchId}/suffixes`,
    TEST_GROUPS: '/api/v1/adhoc-tube-checkin/test-groups',
    TESTS: '/api/v1/adhoc-tube-checkin/tests',
    VALIDATE_UNIT: (unitId: string) => `/api/v1/adhoc-tube-checkin/validate-unit/${unitId}`,
    CHECK_IN: '/api/v1/adhoc-tube-checkin/check-in',
  },

  CONTROL_BATCH: {
    LOOKUPS_TEST_BATCHES: '/api/v1/control-batch/lookups/test-batches',
    LOOKUPS_TESTS: (tbId: string) => `/api/v1/control-batch/lookups/tests/${encodeURIComponent(tbId)}`,
    BATCH_DETAIL: (tbId: string, testId: string) => `/api/v1/control-batch/batch-detail/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}`,
    LOOKUPS_RUNS: (testId: string, parmType: string) => `/api/v1/control-batch/lookups/runs/${encodeURIComponent(testId)}/${encodeURIComponent(parmType)}`,
    LOOKUPS_KITS: (testId: string) => `/api/v1/control-batch/lookups/kits/${encodeURIComponent(testId)}`,
    LOOKUPS_DEVICES: (relatedCode: string) => `/api/v1/control-batch/lookups/devices/${encodeURIComponent(relatedCode)}`,
    LOOKUPS_REAGENTS: (testId: string, relatedCode: string) => `/api/v1/control-batch/lookups/reagents/${encodeURIComponent(testId)}/${encodeURIComponent(relatedCode)}`,
    RETRIEVE: '/api/v1/control-batch/retrieve',
    VALIDATE_PARAMETER: '/api/v1/control-batch/validate-parameter',
    SAVE: '/api/v1/control-batch/save',
    REAGENTS: (testKitId: string, chapterId: string) => `/api/v1/control-batch/reagents/${encodeURIComponent(testKitId)}/${encodeURIComponent(chapterId)}`,
    UNITS: (tbId: string, testId: string, chapterId: string) => `/api/v1/control-batch/units/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(chapterId)}`,
  },

  MODIFY_UNIT: {
    COLLECTION_DATES: (unitId: string) =>
      `/api/v1/modify-unit/collection-dates/${encodeURIComponent(unitId)}`,
    DETAILS: (unitId: string, collDate: string) =>
      `/api/v1/modify-unit/details/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`,
    UPDATE: '/api/v1/modify-unit/update',
    DRIVES: (collDate: string) =>
      `/api/v1/modify-unit/lookups/drives/${encodeURIComponent(collDate)}`,
    GROUP_SITES: (driveId: string) =>
      `/api/v1/modify-unit/lookups/group-sites/${encodeURIComponent(driveId)}`,
    ABO_VALUES: '/api/v1/modify-unit/lookups/abo-values',
    CATALOGS: '/api/v1/modify-unit/lookups/catalogs',
    LOTS: (catalogNumber: string) =>
      `/api/v1/modify-unit/lookups/lots/${encodeURIComponent(catalogNumber)}`,
    BATCHES: '/api/v1/modify-unit/lookups/batches',
    ATTRIBUTE_GROUPS: '/api/v1/modify-unit/lookups/attribute-groups',
    ATTRIBUTE_CODES: (attribGroup: string, codeScheme?: string) =>
      `/api/v1/modify-unit/lookups/attribute-codes/${encodeURIComponent(attribGroup)}${codeScheme ? `?codeScheme=${encodeURIComponent(codeScheme)}` : ''}`,
    EQUIPMENT_TYPES: (attribGroup: string, attribCode: string) =>
      `/api/v1/modify-unit/lookups/equipment-types/${encodeURIComponent(attribGroup)}/${encodeURIComponent(attribCode)}`,
    SERIAL_NUMBERS: (equipType: string) =>
      `/api/v1/modify-unit/lookups/serial-numbers/${encodeURIComponent(equipType)}`,
    DONOR_DECISION_CODES: '/api/v1/modify-unit/lookups/donor-decision-codes',
  },

  CANCEL_UNFILLED_ORDERS: {
    SEARCH: '/api/v1/cancel-unfilled-orders/search',
    LOV: '/api/v1/cancel-unfilled-orders/lov',
    ORDER_TYPES: '/api/v1/cancel-unfilled-orders/order-types',
    ORDER_CLASSES: '/api/v1/cancel-unfilled-orders/order-classes',
    GET_DETAILS: (orderNo: string) => `/api/v1/cancel-unfilled-orders/${encodeURIComponent(orderNo)}`,
    ITEM_ATTRIBUTES: (orderNo: string, itemNo: number) => `/api/v1/cancel-unfilled-orders/${encodeURIComponent(orderNo)}/items/${encodeURIComponent(String(itemNo))}/attributes`,
    CANCEL: (orderNo: string) => `/api/v1/cancel-unfilled-orders/${encodeURIComponent(orderNo)}/cancel`,
  },

  // Test Batch/Worksheet (MLT-13356, MLT-13358)
  TEST_BATCH: {
    GET: (tbId: string) => `/api/v1/test-batch/${encodeURIComponent(tbId)}`,
    CREATE: '/api/v1/test-batch',
    UPDATE: (tbId: string) => `/api/v1/test-batch/${encodeURIComponent(tbId)}`,
    ADD_TEST: (tbId: string) => `/api/v1/test-batch/${encodeURIComponent(tbId)}/tests`,
    ADD_UNIT: (tbId: string) => `/api/v1/test-batch/${encodeURIComponent(tbId)}/units`,
    REMOVE_TEST: (tbId: string, testId: string) =>
      `/api/v1/test-batch/${encodeURIComponent(tbId)}/tests/${encodeURIComponent(testId)}`,
    REMOVE_UNIT: (tbId: string, unitId: string) =>
      `/api/v1/test-batch/${encodeURIComponent(tbId)}/units/${encodeURIComponent(unitId)}`,
    LIST: '/api/v1/test-batch/list',
    AVAILABLE_TESTS: '/api/v1/test-batch/available-tests',
    TEST_KITS: (testId: string) => `/api/v1/test-batch/test-kits/${encodeURIComponent(testId)}`,
    LAB_CODES: '/api/v1/test-batch/lab-codes',
  },

  MULTIPLE_OBSERVATION_RECONCILIATION: {
    BASE: '/api/v1/multiple-observation-reconciliation',
    WORKSHEETS_DROPDOWN: '/api/v1/multiple-observation-reconciliation/worksheets-dropdown',
    TESTS_DROPDOWN: (tbId: string) =>
      `/api/v1/multiple-observation-reconciliation/tests-dropdown?tbId=${encodeURIComponent(tbId)}`,
    PENDING_TESTS: '/api/v1/multiple-observation-reconciliation/pending-tests',
    TEST_DETAILS: (unitId: string, tbId: string, testId: string, tbSeqNo: number) =>
      `/api/v1/multiple-observation-reconciliation/test-details/${encodeURIComponent(unitId)}/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${tbSeqNo}`,
    VALID_RESULTS: (testId: string) =>
      `/api/v1/multiple-observation-reconciliation/valid-results/${encodeURIComponent(testId)}`,
    VALID_INTERPRETATIONS: (testId: string) =>
      `/api/v1/multiple-observation-reconciliation/valid-interpretations/${encodeURIComponent(testId)}`,
    VALID_TEST_BANDS: (testId: string, testType: string) =>
      `/api/v1/multiple-observation-reconciliation/valid-test-bands/${encodeURIComponent(testId)}/${encodeURIComponent(testType)}`,
    UPDATE_BAND_VALUES: (unitId: string, tbId: string, testId: string, tbSeqNo: number) =>
      `/api/v1/multiple-observation-reconciliation/update-band-values/${encodeURIComponent(unitId)}/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${tbSeqNo}`,
    VALIDATE_COMBINATION: '/api/v1/multiple-observation-reconciliation/validate-combination',
    RECONCILE: (unitId: string, tbId: string, testId: string, tbSeqNo: number) =>
      `/api/v1/multiple-observation-reconciliation/reconcile/${encodeURIComponent(unitId)}/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${tbSeqNo}`,
    COMMIT_RECONCILIATION: '/api/v1/multiple-observation-reconciliation/commit-reconciliation',
    OTHER_BANDS_GET: (unitId: string, tbId: string, testId: string, tbSeqNo: number) =>
      `/api/v1/multiple-observation-reconciliation/other-bands/${encodeURIComponent(unitId)}/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${tbSeqNo}`,
    OTHER_BANDS_SAVE: '/api/v1/multiple-observation-reconciliation/other-bands',
    OTHER_BANDS_DELETE: (unitId: string, tbId: string, testId: string, tbSeqNo: number) =>
      `/api/v1/multiple-observation-reconciliation/other-bands/${encodeURIComponent(unitId)}/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${tbSeqNo}`,
    NOTES_GET: (tbId: string, testId: string, unitId: string, tbSeqNo: number) =>
      `/api/v1/multiple-observation-reconciliation/notes/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}/${tbSeqNo}`,
    NOTES_SAVE: '/api/v1/multiple-observation-reconciliation/notes',
    NOTES_DELETE: (noteId: number) =>
      `/api/v1/multiple-observation-reconciliation/notes/${noteId}`,
  },

  ENTER_ORDER_CHARGES: {
    ORDERS: '/api/v1/enter-order-charges/lookup/active-orders',
    GET: (orderNo: string) =>
      `/api/v1/enter-order-charges/order-summary/${encodeURIComponent(orderNo)}`,
    SERVICE_CODES: '/api/v1/enter-order-charges/lookup/charge-codes',
    CRDB_INDICATORS: '/api/v1/enter-order-charges/lookup/crdb-indicators',
    ADD_CHARGE: '/api/v1/enter-order-charges',
    UPDATE_CHARGE: '/api/v1/enter-order-charges',
    DELETE_CHARGE: (rowId: string) =>
      `/api/v1/enter-order-charges/${encodeURIComponent(rowId)}`,
    ORDER_ITEMS: (orderNo: string) =>
      `/api/v1/enter-order-charges/order-items/${encodeURIComponent(orderNo)}`,
    ITEM_ATTRIBUTES_ANTIGENS: (orderNo: string) =>
      `/api/v1/enter-order-charges/${encodeURIComponent(orderNo)}/items/attributes-antigens`,
  },

  INITIATE_HOSPITAL_TRANSFER: {
    ORDERS: '/api/v1/initiate-hospital-transfer/orders',
    GET: (orderNo: string) =>
      `/api/v1/initiate-hospital-transfer/${encodeURIComponent(orderNo)}`,
    ATTRIBUTES_ANTIGENS: (orderNo: string, itemNo: number) =>
      `/api/v1/initiate-hospital-transfer/${encodeURIComponent(orderNo)}/items/${itemNo}/attributes-antigens`,
    FIND_PRODUCTS: (orderNo: string, itemNo: number) =>
      `/api/v1/initiate-hospital-transfer/${encodeURIComponent(orderNo)}/items/${itemNo}/available-products`,
    PRINT_TRANSFER_SLIP: '/api/v1/initiate-hospital-transfer/print-transfer-slip',
  },

  // Pack Inv Rejects to Discard (PACKOD) - JIRA: MLT-14013
  PACK_INV_REJECTS: {
    BASE: '/api/v1/pack-inv-rejects',
    PRODUCTS: (take: number, skip: number) =>
      `/api/v1/pack-inv-rejects/products/${take}/${skip}`,
    CONSIGNEES: '/api/v1/pack-inv-rejects/consignees',
    ORDERS: '/api/v1/pack-inv-rejects/orders',
    PRODUCT_TYPES: '/api/v1/pack-inv-rejects/product-types',
    OPEN_BOXES: '/api/v1/pack-inv-rejects/open-boxes',
    BOX_CONTENTS: (boxId: string) =>
      `/api/v1/pack-inv-rejects/box/${encodeURIComponent(boxId)}/contents`,
    ADD_PRODUCT: '/api/v1/pack-inv-rejects/box/add-product',
    CLOSE_BOX: (boxId: string) =>
      `/api/v1/pack-inv-rejects/box/${encodeURIComponent(boxId)}/close`,
    CHECK_DIGIT: (unitId: string) =>
      `/api/v1/pack-inv-rejects/check-digit/${encodeURIComponent(unitId)}`,
    PRODUCT_CODES: (unitId: string, customerId?: string, consigneeId?: string) => {
      const base = `/api/v1/pack-inv-rejects/product-codes/${encodeURIComponent(unitId)}`;
      const params = new URLSearchParams();
      if (customerId) params.set('customerId', customerId);
      if (consigneeId) params.set('consigneeId', consigneeId);
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
    BLOOD_TYPES: (unitId: string, productCode: string) =>
      `/api/v1/pack-inv-rejects/blood-types/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
    UNPACK: '/api/v1/pack-inv-rejects/unpack',
  },

  // Internal Contract (VCONTRCT)
  INTERNAL_CONTRACT: {
    // Get all contracts (GET) - query params: take, skip, filters
    GET_ALL: '/api/v1/internal-contract',

    // Get contract by ID (GET) - path params: contractId
    GET_BY_ID: (contractId: string) =>
      `/api/v1/internal-contract/${encodeURIComponent(contractId)}`,

    // Create contract (POST)
    CREATE: '/api/v1/internal-contract',

    // Update contract (PUT) - path params: contractId
    // Includes both contract fields and ADDRESSES_LAB fields (international address)
    UPDATE: (contractId: string) =>
      `/api/v1/internal-contract/${encodeURIComponent(contractId)}`,

    // Delete contract (DELETE) - path params: contractId
    DELETE: (contractId: string) =>
      `/api/v1/internal-contract/${encodeURIComponent(contractId)}`,

    // Validation endpoints
    VALIDATE_CONTRACT_EXISTS: '/api/v1/internal-contract/validate/contract-exists',
    VALIDATE_CHAPTER_EXISTS: '/api/v1/internal-contract/validate/chapter-exists',
    VALIDATE_BARCODE_EXISTS: '/api/v1/internal-contract/validate/barcode-exists',
    VALIDATE_STATE_EXISTS: '/api/v1/internal-contract/validate/state-exists',
  },

  ANTIGEN_CONFIG_RULES: {
    SEARCH: (take: number, skip: number) => `/api/v1/antigen-config-rules/search-sort-filter/${take}/${skip}`,
    CREATE: '/api/v1/antigen-config-rules',
    UPDATE: (primaryRuleId: number) => `/api/v1/antigen-config-rules/${primaryRuleId}`,
    TERMINATE: (primaryRuleId: number) => `/api/v1/antigen-config-rules/${primaryRuleId}/terminate`,
    DELETE: (primaryRuleId: number) => `/api/v1/antigen-config-rules/${primaryRuleId}`,
    FILTER_OPTIONS: '/api/v1/antigen-config-rules/filter-options',
    COUNT: '/api/v1/antigen-config-rules/count',
    LOOKUP_ANTIGEN_GROUPS: '/api/v1/antigen-config-rules/lookups/antigen-groups',
    LOOKUP_ANTIGEN_TESTS: '/api/v1/antigen-config-rules/lookups/antigen-tests',
    LOOKUP_LABELING_ANTIGENS: '/api/v1/antigen-config-rules/lookups/labeling-antigens',
    LOOKUP_TEST_IDS: (testType: 'SER' | 'MOL') => `/api/v1/antigen-config-rules/lookups/test-ids?testType=${testType}`,
  },

  // Fixed Profile Tube Check-in (LTICHKIN) - JIRA: MLT-13601
  FIXED_PROFILE_TUBE_CHECKIN: {
    CHECKIN: '/api/v1/fixed-profile-tube-checkin/checkin', // Main batch check-in endpoint
    LIST: (take: number, skip: number) => `/api/v1/fixed-profile-tube-checkin/${take}/${skip}`, // Paginated list of checked-in units
    CONTRACTS: '/api/v1/fixed-profile-tube-checkin/contracts', // Get contracts dropdown
    BATCHES: '/api/v1/fixed-profile-tube-checkin/batches', // Get batches dropdown
  },

} as const;

