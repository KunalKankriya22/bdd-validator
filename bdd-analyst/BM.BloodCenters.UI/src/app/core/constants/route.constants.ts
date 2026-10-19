export const ROUTES = {
  AUTH: {
    BASE: '',
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    SESSION_EXPIRED: '/session-expired',
    ACCESS_DENIED: '/access-denied',
    OKTA_RESTRICTION: '/okta-restriction',
  },

  HOME: '/home',
  DONOR: '/donor',
  ADMIN: '/admin',
  SYSTEM_ADMIN: {
    BASE: '/system-administration',
    MANAGE_GROUPS: '/system-administration/manage-groups',
    APPLICATION_SEQUENCE_NUMBERS: '/system-administration/application-sequence-numbers',
    MANAGE_MENU_ITEMS: '/system-administration/menu-admin/manage-menu-items',
  },
  SOLUTIONS: '/solutions',
  SUPPORT: '/support',

  // Application Administration module routes
  APPLICATION_ADMIN: {
    BASE: '/application-administration',

    COMMON_VALIDATION: {
      BASE: '/application-administration/common-validation',
      VIEW_INSTITUTION:
        '/application-administration/common-validation/view-institution',
      CREATE_INSTITUTION:
        '/application-administration/common-validation/create',
      EDIT_INSTITUTION: (addressId: string) =>
        `/application-administration/common-validation/edit/${addressId}`,
    },
  },

  // APIs and Integration module routes
  APIS_INTEGRATION: {
    BASE: '/apis-integration',
    LAB_API_INTERFACES: {
      BASE: '/apis-integration/lab-api-interfaces',
      MANUAL_DONOR_INTERFACE: '/apis-integration/lab-api-interfaces/manual-donor-interface',
      VOID_DONOR_INTERFACE: '/apis-integration/lab-api-interfaces/void-donor-interface',
    },
  },

  // Donor Functions module routes
  DONOR_FUNCTIONS: {
    BASE: '/donor-functions',
    DONOR_RBC_AG_QUERY: (donorId: string) => `/donor-functions/donor-rbc-ag-query/${donorId}`,
    HLA_RBC_REQUEST_QUERY: '/laboratory-functions/labeling-functions/donor-functions/recruitment/hla/rbc/hla/rbc-general-functions/hla/rbc-request-query',
    ENTER_HLA_RBC_REQUEST: '/donor-functions/hla-rbc/hla-rbc-general-functions/enter-hla-rbc-request',
  },

  // Laboratory Functions module routes
  LABORATORY: {
    BASE: '/laboratory-functions',
  },
} as const;
