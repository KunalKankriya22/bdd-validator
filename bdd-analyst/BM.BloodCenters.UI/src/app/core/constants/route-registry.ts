import type { Type } from '@angular/core';
import { RouteKey } from './route-keys';

export interface RouteRegistryEntry {
  path: string;
  loadComponent: () => Promise<Type<unknown>>;
  data?: Record<string, unknown>;
}

export const ROUTE_REGISTRY: Record<RouteKey, RouteRegistryEntry> = {
  [RouteKey.Home]: {
    path: '/home',
    loadComponent: () => import('../../shared/components/home/home').then((m) => m.Home),
  },
  [RouteKey.DonorRegistration]: {
    path: '/donor-functions/registration',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-functions-components/donor-registration/donor-registration').then(
        (m) => m.DonorRegistration,
      ),
  },
  [RouteKey.DonorHistory]: {
    path: '/donor-functions/history',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-functions-components/donor-history/donor-history').then(
        (m) => m.DonorHistory,
      ),
  },
  [RouteKey.AuditDonation]: {
    path: '/donor-functions/registration/audit-donation',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/audit-donation/audit-donation').then(
        (m) => m.AuditDonation,
      ),
  },
  [RouteKey.DonationDeferralAuditDrawer]: {
    path: '/donor-functions/registration/donation-deferral-audit-drawer',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/registration/audit-donation/audit-donation'
      ).then((m) => m.AuditDonation),
    data: { mode: 'deferral' },
  },
  [RouteKey.HealthHistoryTemplate]: {
    path: '/donor-functions/registration/health-history-template',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/health-history-template/health-history-template').then(
        (m) => m.HealthHistoryTemplate,
      ),
  },
  [RouteKey.ViewInstitution]: {
    path: '/application-administration/common-validation/view-institution',
    loadComponent: () =>
      import('../../modules/application-admin/institutions/view-institution/view-institution').then(
        (m) => m.ViewInstitution,
      ),
  },
  [RouteKey.SystemParameter]: {
    path: '/application-administration/common-validation/system-parameter',
    loadComponent: () =>
      import('../../modules/application-admin/system-parameter/view-system-parameter/view-system-parameter').then(
        (m) => m.ViewSystemParameter,
      ),
  },
  [RouteKey.ChapterDetails]: {
    path: '/application-administration/create-chapter',
    loadComponent: () =>
      import('../../modules/application-admin/chapter/chapter-create/chapter-create').then(
        (m) => m.ChapterCreate,
      ),
  },
  [RouteKey.DonorMasterCodes]: {
    path: '/application-administration/donor-restricted/donor-master-codes',
    loadComponent: () =>
      import('../../modules/application-admin/donor-master-codes/view-donor-master-codes/view-donor-master-codes').then(
        (m) => m.ViewDonorMasterCodes,
      ),
  },
  [RouteKey.DonorInterdictionCodes]: {
    path: '/application-administration/donor-restricted/donor-interdiction-codes',
    loadComponent: () =>
      import('../../modules/application-admin/donor-interdiction-codes/donor-interdiction-codes/donor-interdiction-codes').then(
        (m) => m.DonorInterdictionCodesComponent,
      ),
  },
  [RouteKey.DefineDonationTypes]: {
    path: '/application-administration/donor-restricted/define-donation-types',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/define-donation-types/define-donation-types').then(
        (m) => m.DefineDonationTypesComponent,
      ),
  },
  [RouteKey.DefineMaxDonations]: {
    path: '/application-administration/donor-restricted-validations/define-max-donations',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/define-max-donations/define-max-donations').then(
        (m) => m.DefineMaxDonationsComponent,
      ),
  },
  // NOTE: Commented out - using ValidDonationTypeProcedureCode (singular) instead
  // [RouteKey.ValidDonationTypeProcedureCodes]: {
  //   path: '/application-administration/lab-restricted-validation-tables/donation/procedure-mapping',
  //   loadComponent: () =>
  //     import('../../modules/application-admin/lab-restricted-validation-tables/valid-donation-type-procedure-codes/valid-donation-type-procedure-codes').then(
  //       (m) => m.ValidDonationTypeProcedureCodesComponent,
  //     ),
  // },
  [RouteKey.DefineDonationProcedures]: {
    path: '/application-administration/donor-restricted/define-donation-procedures',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/define-donation-procedures/define-donation-procedures').then(
        (m) => m.DefineDonationProceduresComponent,
      ),
  },
  [RouteKey.UserInterdictionClass]: {
    path: '/application-administration/lab-restricted/user-interdiction-class',
    loadComponent: () =>
      import('../../modules/application-admin/user-interdiction-class/assign-user-interdiction-class/assign-user-interdiction-class').then(
        (m) => m.AssignUserInterdictionClass,
      ),
  },
  [RouteKey.RegistrationHoldsMapping]: {
    path: '/application-administration/donor-restricted-validations/registration-holds-mapping',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/registration-holds-mapping/registration-holds-mapping').then(
        (m) => m.RegistrationHoldsMappingComponent,
      ),
  },
  [RouteKey.DefineProcedureCodes]: {
    path: '/application-administration/donor-restricted-validations/define-procedure-codes',
    loadComponent: () =>
      import('../../modules/application-admin/procedure-codes/define-procedure-codes/define-procedure-codes').then(
        (m) => m.DefineProcedureCodesComponent,
      ),
  },
  [RouteKey.DonProcConsentDefinition]: {
    path: '/application-administration/donor-restricted/don-proc-consent-definition',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/don-proc-consent-definition/don-proc-consent-definition').then(
        (m) => m.DonProcConsentDefinitionComponent,
      ),
  },
  [RouteKey.DistributionMasterCodes]: {
    path: '/application-administration/distribution-restricted/distribution-master-codes',
    loadComponent: () =>
      import('../../modules/application-admin/distribution-master-codes/view-distribution-master-codes/view-distribution-master-codes').then(
        (m) => m.ViewDistributionMasterCodes,
      ),
  },
  [RouteKey.LabMasterCodes]: {
    path: '/application-administration/lab-restricted/lab-master-codes',
    loadComponent: () =>
      import('../../modules/application-admin/lab-master-codes/lab-master-codes/view-lab-master-codes/view-lab-master-codes').then(
        (m) => m.ViewLabMasterCodes,
      ),
  },
  [RouteKey.ViewInterdictionCodes]: {
    path: '/application-administration/lab-restricted/lab-interdiction-codes',
    loadComponent: () =>
      import('../../modules/application-admin/lab-interdiction-codes/view-interdiction-codes/view-interdiction-codes').then(
        (m) => m.ViewInterdictionCodesComponent,
      ),
  },
  [RouteKey.AssignInterdictionClass]: {
    path: '/application-administration/lab-restricted/assign-interdiction-class',
    loadComponent: () =>
      import('../../modules/application-admin/interdiction-class/assign-interdiction-class/assign-interdiction-class').then(
        (m) => m.AssignInterdictionClass,
      ),
  },
  [RouteKey.DonorErrorCodes]: {
    path: '/application-administration/wellsky-restricted/error-codes/donor',
    loadComponent: () =>
      import('../../modules/application-admin/error-codes/donor/donor').then((m) => m.Donor),
  },
  [RouteKey.LabErrorCodes]: {
    path: '/application-administration/wellsky-restricted/error-codes/lab',
    loadComponent: () =>
      import('../../modules/application-admin/error-codes/lab/lab').then((m) => m.Lab),
  },
  [RouteKey.DistributionErrorCodes]: {
    path: '/application-administration/wellsky-restricted/error-codes/distribution',
    loadComponent: () =>
      import('../../modules/application-admin/error-codes/distribution/distribution').then(
        (m) => m.Distribution,
      ),
  },
  [RouteKey.InterdictionUpgradeMatrix]: {
    path: '/application-administration/wellsky-restricted/interdiction-upgrade-matrix',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/interdiction-upgrade-matrix/interdiction-upgrade-matrix').then(
        (m) => m.InterdictionUpgradeMatrixComponent,
      ),
  },
  [RouteKey.AboValues]: {
    path: '/application-administration/wellsky-restricted/abo-values',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/abo-values/abo-values').then(
        (m) => m.AboValuesComponent,
      ),
  },
  [RouteKey.AboProductCompatibility]: {
    path: '/application-administration/wellsky-restricted/abo-product-compatibility',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/abo-prod-compatibility/abo-prod-compatibility').then(
        (m) => m.ABOProdCompatibilityComponent,
      ),
  },
  [RouteKey.OrderClassCodes]: {
    path: '/application-administration/distribution-restricted-validation/order-class-codes',
    loadComponent: () =>
      import('../../modules/application-admin/distribution-restricted-validation/order-class-codes/order-class-codes').then(
        (m) => m.OrderClassCodesComponent,
      ),
  },
  [RouteKey.VenipunctureAttributes]: {
    path: '/application-administration/donor-restricted-validations/venipuncture-attributes',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/venipuncture-attributes/venipuncture-attributes').then(
        (m) => m.VenipunctureAttributesComponent,
      ),
  },
  [RouteKey.Drives]: {
    path: '/application-administration/lab-restricted/drives',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/drives/drives').then(
        (m) => m.DrivesComponent,
      ),
  },
  [RouteKey.BoxCapacity]: {
    path: '/application-administration/distribution-restricted/box-capacity',
    loadComponent: () =>
      import('../../modules/application-admin/distribution-restricted-validation-tables/box-capacity/box-capacity').then(
        (m) => m.BoxCapacityComponent,
      ),
  },
  [RouteKey.CustomerPreferredTier]: {
    path: '/application-administration/customer-administration/customer-preferred-tier',
    loadComponent: () =>
      import('../../modules/application-admin/customer-preferred-tier/customer-preferred-tier').then(
        (m) => m.CustomerPreferredTierComponent,
      ),
  },
  [RouteKey.ReturnReasons]: {
    path: '/application-administration/distribution-restricted/return-reasons',
    loadComponent: () =>
      import('../../modules/application-admin/distribution-restricted-validation-tables/return-reasons/return-reasons').then(
        (m) => m.ReturnReasonsComponent,
      ),
  },
  [RouteKey.ApplicationSequenceNumbers]: {
    path: '/system-administration/application-sequence-numbers',
    loadComponent: () =>
      import('../../modules/system-administration/application-sequence-numbers/application-sequence-numbers.component').then(
        (m) => m.ApplicationSequenceNumbersComponent,
      ),
  },
  [RouteKey.DefineGroups]: {
    path: '/system-administration/manage-groups',
    loadComponent: () =>
      import('../../modules/system-administration/groups/manage-group/manage-group.component').then(
        (m) => m.ManageGroupComponent,
      ),
  },
  [RouteKey.ReportMasterTable]: {
    path: '/system-administration/report-admin/master-table',
    loadComponent: () =>
      import('../../modules/system-administration/maintain-report-master-table/report-master-table/report-master-table').then(
        (m) => m.ReportMasterTable,
      ),
  },
  [RouteKey.ReportParameters]: {
    path: '/system-administration/report-admin/parameters',
    loadComponent: () =>
      import('../../modules/system-administration/maintain-report-parameters/maintain-report-parameters').then(
        (m) => m.MaintainReportParameters,
      ),
  },
  [RouteKey.ReportReports]: {
    path: '/system-administration/report-admin/reports',
    loadComponent: () =>
      import('../../modules/system-administration/report-admin/reports/report-form').then(
        (m) => m.ReportFormComponent,
      ),
  },
  [RouteKey.ManageUsers]: {
    path: '/system-administration/user-admin/manage-users',
    loadComponent: () =>
      import('../../modules/system-administration/user-list-account/list-user-account/list-user-account').then(
        (m) => m.ListUserAccountComponent,
      ),
  },
  [RouteKey.AddSystemUser]: {
    path: '/system-administration/user-admin/manage-users',
    loadComponent: () =>
      import('../../modules/system-administration/user-list-account/list-user-account/list-user-account').then(
        (m) => m.ListUserAccountComponent,
      ),
  },
  [RouteKey.PasswordConfiguration]: {
    path: '/system-administration/password-configuration',
    loadComponent: () =>
      import('../../modules/system-administration/password-configuration/password-configuration').then(
        (m) => m.PasswordConfigurationComponent,
      ),
  },
  [RouteKey.AddFunctions]: {
    path: '/system-administration/menu-admin/restricted/add-functions',
    loadComponent: () =>
      import('../../modules/system-administration/menu-admin/add-functions/add-functions').then(
        (m) => m.AddFunctionsComponent,
      ),
  },
  [RouteKey.UserWarehouse]: {
    path: '/system-administration/user-admin/user-warehouse',
    loadComponent: () =>
      import('../../modules/system-administration/warehouse/view-warehouse/view-warehouse').then(
        (m) => m.ViewWarehouseComponent,
      ),
  },
  [RouteKey.DefineUserAccess]: {
    path: '/system-administration/user-admin/donor-user-admin/define-user-access',
    loadComponent: () =>
      import('../../modules/system-administration/user-admin/donor-user-admin/define-user-access/define-user-access').then(
        (m) => m.DefineUserAccess,
      ),
  },
  [RouteKey.UserAccessMenusInterdiction]: {
    path: '/system-administration/user-admin/donor-user-admin/user-access-menus-interdiction',
    loadComponent: () =>
      import('../../modules/system-administration/user-access-menus-interdiction/user-access-menus-interdiction/user-access-menus-interdiction').then(
        (m) => m.UserAccessMenusInterdiction,
      ),
  },
  [RouteKey.LabUserAccess]: {
    path: '/system-administration/user-admin/lab-dist-user-admin/lab-user-access',
    loadComponent: () =>
      import('../../modules/system-administration/user-admin/lab-dist-user-admin/lab-user-access/lab-user-access/lab-user-access').then(
        (m) => m.LabUserAccessComponent,
      ),
  },
  [RouteKey.Unauthorized]: {
    path: '/unauthorized',
    loadComponent: () =>
      import('../../shared/components/unauthorized/unauthorized').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  [RouteKey.GroupSites]: {
    path: '/application-administration/lab-restricted/group-sites',
    loadComponent: () =>
      import('../../modules/application-admin/lab-restricted-validation-tables/group-sites/group-sites').then(
        (m) => m.GroupSitesComponent,
      ),
  },
  [RouteKey.ValidAbo]: {
    path: '/application-administration/lab-restricted/valid-abo',
    loadComponent: () =>
      import('../../modules/application-admin/valid-abo/valid-abo-table/valid-abo-table').then(
        (m) => m.ValidAboTable,
      ),
  },
  [RouteKey.DefineOperators]: {
    path: '/application-administration/wellsky-restricted/define-operators',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/define-operators/define-operators').then(
        (m) => m.DefineOperatorsComponent,
      ),
  },
  [RouteKey.DefineOrderCharges]: {
    path: '/application-administration/distribution-restricted/define-order-charges',
    loadComponent: () =>
      import('../../modules/application-admin/distribution-restricted-validation/define-order-charges/define-order-charges').then(
        (m) => m.DefineOrderChargesComponent,
      ),
  },
  [RouteKey.DefinePhysicalFindingsValues]: {
    path: '/application-administration/donor-restricted-validations/define-physical-findings-values',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/define-physical-findings-values/define-physical-findings-values').then(
        (m) => m.DefinePhysicalFindingsValuesComponent,
      ),
  },
  [RouteKey.DefineProcedureGroups]: {
    path: '/application-administration/donor-restricted-validations/define-procedure-groups',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/define-procedure-groups/define-procedure-groups').then(
        (m) => m.DefineProcedureGroupsComponent,
      ),
  },
  [RouteKey.ValidProductSubstitution]: {
    path: '/application-administration/donor-restricted-validations/product-substitution',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/valid-product-substitution/valid-product-substitution').then(
        (m) => m.ValidProductSubstitutionComponent,
      ),
  },
  [RouteKey.DonorGradingMatrix]: {
    path: '/application-administration/wellsky-restricted/donor-grading-matrix',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/donor-grading-matrix/donor-grading-matrix').then(
        (m) => m.DonorGradingMatrixComponent,
      ),
  },
  [RouteKey.AccessClassByInterCode]: {
    path: '/system-administration/user-admin/donor-user-admin/access-class-by-inter-code',
    loadComponent: () =>
      import('../../modules/system-administration/access-class-by-inter-code/access-class-by-inter-code').then(
        (m) => m.AccessClassByInterCodeComponent,
      ),
  },
  [RouteKey.DefineProcedureExclusions]: {
    path: '/application-administration/donor-restricted-validations/define-procedure-exclusions',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/define-procedure-exclusions/define-procedure-exclusions').then(
        (m) => m.DefineProcedureExclusionsComponent,
      ),
  },
  [RouteKey.AntigenTests]: {
    path: '/application-administration/dist-restricted/antigen-tests',
    loadComponent: () =>
      import('../../modules/application-admin/dist-restricted-validation-tables/antigen-tests/antigen-tests').then(
        (m) => m.AntigenTestsComponent,
      ),
  },
  [RouteKey.ValidFacilityIdentifiers]: {
    path: '/application-administration/donor-restricted-validations/valid-facility-identifiers',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/valid-facility-identifiers/valid-facility-identifiers').then(
        (m) => m.ValidFacilityIdentifiersComponent,
      ),
  },
  [RouteKey.BarCodeTranslations]: {
    path: '/application-administration/wellsky-restricted/bar-code-translations',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/bar-code-translations/bar-code-translations').then(
        (m) => m.BarCodeTranslationsComponent,
      ),
  },
  [RouteKey.DefineAccessClass]: {
    path: '/system-administration/user-admin/donor-user-admin/define-access-class',
    loadComponent: () =>
      import('../../modules/system-administration/define-access-class/define-access-class/define-access-class').then(
        (m) => m.DefineAccessClassComponent,
      ),
  },
  [RouteKey.DefineNotificationLetters]: {
    path: '/donor-functions/donor-notification/notification-administration/define-notification-letters',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-notification/notification-administration/define-notification-letters/define-notification-letters/define-notification-letters').then(
        (m) => m.DefineNotificationLetters,
      ),
  },
  [RouteKey.AssociateStrongReactivity]: {
    path: '/donor-functions/donor-notification/notification-administration/associate-strong-reactivity',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-notification/notification-administration/associate-strong-reactivity/associate-strong-reactivity.component').then(
        (m) => m.AssociateStrongReactivityComponent,
      ),
  },
  [RouteKey.DefineHlaInterimOutput]: {
    path: '/donor-functions/hla/define-hla-interim-output',
    loadComponent: () =>
      import('../../modules/donor-functions/hla/define-hla-interim-output/define-hla-interim-output').then(
        (m) => m.DefineHlaInterimOutput,
      ),
  },
  [RouteKey.AssociateLetterToInterdiction]: {
    path: '/donor-functions/donor-notification/notification-administration/associate-letter-to-interdiction',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-notification/notification-administration/associate-letter-to-interdiction/associate-letter-to-interdiction').then(
        (m) => m.AssociateLetterToInterdiction,
      ),
  },
  [RouteKey.LabelingInterdictionOverride]: {
    path: '/application-administration/lab-restricted/labeling-interdiction-override',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/labeling-interdiction-override/labeling-interdiction-override').then(
        (m) => m.LabelingInterdictionOverrideComponent,
      ),
  },
  [RouteKey.LabInterdictionOverride]: {
    path: '/application-administration/lab-restricted/lab-interdiction-override',
    loadComponent: () =>
      import('../../modules/application-admin/lab-interdiction-override/lab-interdiction-override/lab-interdiction-override').then(
        (m) => m.LabInterdictionOverride,
      ),
  },
  [RouteKey.AdditionalConfirmatoryTestScheduled]: {
    path: '/application-administration/lab-restricted/additional-confirmatory-test-scheduled',
    loadComponent: () =>
      import('../../modules/application-admin/atc/atc').then(
        (m) => m.AdditionalConfirmatoryTestScheduledComponent,
      ),
  },
  [RouteKey.InventoryProductTypes]: {
    path: '/application-administration/lab-restricted/inventory-product-types',
    loadComponent: () =>
      import('../../modules/application-admin/inventory-product-types/inventory-product-types-table/inventory-product-types-table').then(
        (m) => m.InventoryProductTypesTable,
      ),
  },
  [RouteKey.ISBTUnitCheckDigit]: {
    path: '/donor-functions/general-queries-and-functions/isbt-unit-check-digit',
    loadComponent: () =>
      import('../../shared/components/isbt-unit-check-digit/isbt-unit-check-digit-page').then(
        (m) => m.ISBTUnitCheckDigitPage,
      ),
  },

  [RouteKey.LabelingInterdictionOverrideQuery]: {
    path: '/application-administration/lab-restricted/labeling-interdiction-override-query',
    loadComponent: () =>
      import('../../modules/application-admin/lab-restricted-validation-tables/labeling-interdiction-override-query/labeling-interdiction-override-query').then(
        (m) => m.LabelingInterdictionOverrideQueryComponent,
      ),
  },
  [RouteKey.AssociateNicknameToName]: {
    path: '/application-administration/donor-restricted-validations/associate-nickname-to-name',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/associate-nickname-to-name/associate-nickname-list/associate-nickname-list').then(
        (m) => m.AssociateNicknameListComponent,
      ),
  },
  [RouteKey.PoolMatrix]: {
    path: '/application-administration/dist-restricted-validation-tables/pool-matrix',
    loadComponent: () =>
      import('../../modules/application-admin/pool-compatibility-matrix/pool-compatibility-matrix-table/pool-compatibility-matrix-table').then(
        (m) => m.PoolCompatibilityMatrixTable,
      ),
  },
  [RouteKey.ValidDonationTypeProcedureCode]: {
    path: '/application-administration/lab-restricted-validation-tables/donation/procedure-mapping',
    loadComponent: () =>
      import('../../modules/application-admin/lab-restricted-validation-tables/valid-donation-type-procedure-code/valid-donation-type-procedure-code').then(
        (m) => m.ValidDonationTypeProcedureCodeComponent,
      ),
  },
  [RouteKey.TestConfiguration]: {
    path: '/application-administration/donor-restricted-validations/test-configuration',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/test-configuration/test-configuration').then(
        (m) => m.TestConfigurationComponent,
      ),
  },
  [RouteKey.DonorTests]: {
    path: '/application-administration/donor-restricted-validations/test-configuration/donor-tests',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/test-configuration/donor-tests/donor-tests').then(
        (m) => m.DonorTestsComponent,
      ),
  },
  [RouteKey.DaylightSavings]: {
    path: '/application-administration/common-validation/daylight-savings',
    loadComponent: () =>
      import('../../modules/application-admin/common-validation-table/daylight-savings/daylight-savings').then(
        (m) => m.DaylightSavingsComponent,
      ),
  },
  [RouteKey.ExternalBcDataTranslate]: {
    path: '/apis-integration/common-api-interfaces/external-bc-data-translate',
    loadComponent: () =>
      import('../../modules/application-admin/common-validation-table/external-bc-data-translate/external-bc-data-translate').then(
        (m) => m.ExternalBcDataTranslateComponent,
      ),
  },
  [RouteKey.DefineEligibleCellPlasmaLoss]: {
    path: '/application-administration/donor-restricted-validation-tables/define-eligible-cell-plasma-loss',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/define-eligible-cell-plasma-loss/define-eligible-cell-plasma-loss/define-eligible-cell-plasma-loss').then(
        (m) => m.DefineEligibleCellPlasmaLoss,
      ),
  },
  [RouteKey.FindDonorBlock]: {
    path: '/application-administration/donor-restricted-validations/find-donor-block',
    loadComponent: () =>
      import('../../modules/application-admin/donor-restricted-validations/find-donor-block/find-donor-block').then(
        (m) => m.FindDonorBlockComponent,
      ),
  },
  [RouteKey.LabDonorInterfaceLogQuery]: {
    path: '/laboratory-functions/labeling-functions/donor-functions/recruitment/recruitment-general-functions/donor-interfaces/lab-donor-interface-log-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/labeling-functions/donor-functions/recruitment/recruitment-general-functions/donor-interfaces/lab-donor-interface-log-query/lab-donor-interface-log-query').then(
        (m) => m.LabDonorInterfaceLogQueryComponent,
      ),
  },
  [RouteKey.LabInterfaceResults]: {
    path: '/laboratory-functions/labeling-functions/donor-functions/recruitment/recruitment-general-functions/donor-interfaces/lab-interface-results',
    loadComponent: () =>
      import('../../modules/laboratory-functions/labeling-functions/donor-functions/recruitment/recruitment-general-functions/donor-interfaces/lab-interface-results/lab-interface-results').then(
        (m) => m.LabInterfaceResultsComponent,
      ),
  },
  [RouteKey.DefineDayStatusCodes]: {
    path: '/laboratory-functions/labeling-functions/donor-functions/recruitment/recruitment-administration/define-day-status-codes',
    loadComponent: () =>
      import('../../modules/laboratory-functions/labeling-functions/donor-functions/recruitment/recruitment-administration/define-day-status-codes/define-day-status-codes').then(
        (m) => m.DefineDayStatusCodesComponent,
      ),
  },
  [RouteKey.RbcAntigenQuery]: {
    path: '/laboratory-functions/hla-rbc/rbc-antigen-manager/rbc-antigen-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/donor-antigens-query/donor-antigens-query').then(
        (m) => m.DonorAntigensQuery,
      ),
  },
  [RouteKey.DonorAntigensQuery]: {
    path: '/donor-functions/donor-profile/donor-profile-queries/donor-antigens-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/donor-antigens-query/donor-antigens-query').then(
        (m) => m.DonorAntigensQuery,
      ),
  },
  [RouteKey.TestBatchDetailsQuery]: {
    path: '/laboratory-functions/test-batch-details-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/test-batch-details-query/test-batch-details-query').then(
        (m) => m.TestBatchDetailsQuery,
      ),
  },
  [RouteKey.Antql]: {
    path: '/laboratory-functions/testing-modules/testing-queries/antql-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/antql-query/antql-query').then(
        (m) => m.AntqlQuery,
      ),
  },
  [RouteKey.ImportedBloodContract]: {
    path: '/laboratory-functions/imported-blood-contract',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/imported-blood-contract/imported-blood-contract'
      ).then((m) => m.ImportedBloodContractComponent),
  },
  [RouteKey.ResultsExtractQuery]: {
    path: '/laboratory-functions/results-extract-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/results-extract-query/results-extract-query').then(
        (m) => m.ResultsExtractQuery,
      ),
  },
  [RouteKey.InterimResultsQuery]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/interim-results-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/interim-results-query/interim-results-query').then(
        (m) => m.InterimResultsQuery,
      ),
  },
  [RouteKey.EnterHlaResults]: {
    path: '/laboratory-functions/enter-hla-results',
    loadComponent: () =>
      import('../../modules/laboratory-functions/enter-hla-results/enter-hla-results').then(
        (m) => m.EnterHlaResults,
      ),
  },
  [RouteKey.InstrumentTestResults]: {
    path: '/laboratory-functions/testing-modules/testing-administration/instrument-test-results',
    loadComponent: () =>
      import('../../modules/laboratory-functions/instrument-test-results/components/instrument-test-results-list/instrument-test-results-list').then(
        (m) => m.InstrumentTestResultsListComponent,
      ),
  },
  [RouteKey.InstrumentResults]: {
    path: '/laboratory-functions/testing-modules/testing-administration/instrument-results/:machineId/:testId',
    loadComponent: () =>
      import('../../modules/laboratory-functions/instrument-test-results/components/instrument-results-list/instrument-results-list').then(
        (m) => m.InstrumentResultsListComponent,
      ),
  },
  [RouteKey.EnterResultsMapping]: {
    path: '/laboratory-functions/enter-results-mapping',
    loadComponent: () =>
      import('../../modules/laboratory-functions/enter-results-mapping/enter-results-mapping').then(
        (m) => m.EnterResultsMapping,
      ),
  },
  [RouteKey.EnterTestObservationsTech1]: {
    path: '/laboratory-functions/testing-modules/enter-test-observations-tech1',
    loadComponent: () =>
      import('../../modules/laboratory-functions/testing-modules/enter-test-observations-tech1/enter-test-observations-tech1').then(
        (m) => m.EnterTestObservationsTech1Component,
      ),
  },
  [RouteKey.DriveEquipmentParameters]: {
    path: '/application-administration/donor-restricted-validation-tables/drive-equipment-parms',
    loadComponent: () =>
      import('../../modules/application-admin/drive-equipment-parameters/drive-equipment-parameters').then(
        (m) => m.DriveEquipmentParameters,
      ),
  },
  [RouteKey.DonorDecisionCodes]: {
    path: '/application-administration/donor-restricted/donor-decision-codes',
    loadComponent: () =>
      import('../../modules/application-admin/donor-decision-codes/donor-decision-codes/donor-decision-codes').then(
        (m) => m.DonorDecisionCodes,
      ),
  },
  [RouteKey.ManualDonorInterface]: {
    path: '/apis-integration/lab-api-interfaces/manual-donor-interface',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/Lab-API-Interfaces/manual-donor-interface/manual-donor-interface').then(
        (m) => m.ManualDonorInterfaceComponent,
      ),
  },
  [RouteKey.DonorInterdictionOverride]: {
    path: '/application-administration/lab-restricted-validation-tables/donor-interdiction-override',
    loadComponent: () =>
      import('../../modules/application-admin/donor-interdiction-override/donor-interdiction-override').then(
        (m) => m.DonorInterdictionOverrideComponent,
      ),
  },
  [RouteKey.DonorInterdictionOverrideTech2]: {
    path: '/application-administration/donor-restricted/donor-interdiction-override-tech2',
    loadComponent: () =>
      import('../../modules/application-admin/donor-interdiction-override-tech2/donor-interdiction-override/donor-interdiction-override').then(
        (m) => m.DonorInterdictionOverride,
      ),
  },
  [RouteKey.UploadTestResultsFromOutsideSource]: {
    path: '/apis-integration/lab-api-interfaces/upload-test-results-from-outside-source',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/Lab-API-Interfaces/upload-test-results-from-outside-source/upload-test-results-from-outside-source').then(
        (m) => m.UploadTestResultsFromOutsideSourceComponent,
      ),
  },
  [RouteKey.FindDonorRoutineLogic]: {
    path: '/application-administration/wellsky-restricted/find-donor-logic',
    loadComponent: () =>
      import('../../modules/application-admin/find-donor-routine-logic/find-donor-routine-logic').then(
        (m) => m.FindDonorRoutineLogic,
      ),
  },
  [RouteKey.DonorInterdictionOverrideQuery]: {
    path: '/application-administration/lab-restricted-validation-tables/donor-interdiction-override-query',
    loadComponent: () =>
      import('../../modules/application-admin/lab-restricted-validation-tables/donor-interdiction-override-query/donor-interdiction-override-query.component').then(
        (m) => m.DonorInterdictionOverrideQueryComponent,
      ),
  },
  [RouteKey.ApiLogQuery]: {
    path: '/apis-integration/common-api-interfaces/api-log-query',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/api-log-query/api-log-query').then(
        (m) => m.ApiLogQuery,
      ),
  },
  [RouteKey.LabelingConfiguration]: {
    path: '/application-administration/lab-restricted-validation-tables/labeling-configuration',
    loadComponent: () =>
      import('../../modules/application-admin/lab-restricted-validation-tables/labeling-configuration/labeling-configuration').then(
        (m) => m.LabelingConfigurationComponent,
      ),
  },
  [RouteKey.ApiTempDataQuery]: {
    path: '/apis-integration/common-api-interfaces/api-temporary-data-query',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/api-temp-data-query/api-temp-data-query').then(
        (m) => m.ApiTempDataQuery,
      ),
  },
  [RouteKey.ConvertExternalDataToLtData]: {
    path: '/laboratory-functions/life-trak-api-menu/convert-external-data-to-lt-data',
    loadComponent: () =>
      import('../../modules/laboratory-functions/life-trak-api-menu/convert-external-data-to-lt-data/convert-external-data-to-lt-data').then(
        (m) => m.ConvertExternalDataToLtData,
      ),
  },
  [RouteKey.ValidScanInterfaces]: {
    path: '/application-administration/lab-restricted/valid-scan-interfaces',
    loadComponent: () =>
      import('../../modules/application-admin/valid-scan-interfaces/valid-scan-interfaces').then(
        (m) => m.ValidScanInterfaces,
      ),
  },
  [RouteKey.InstrumentInterfaceApiManager]: {
    path: '/apis-integration/lab-api-interfaces/instrument-interface-api-manager',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/Lab-API-Interfaces/instrument-interface-api-manager/instrument-interface-api-manager').then(
        (m) => m.InstrumentInterfaceApiManager,
      ),
  },
  [RouteKey.DriveInterfaceDonorLab]: {
    path: '/apis-integration/lab-api-interfaces/drive-interface-donor-lab',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/Lab-API-Interfaces/drive-interface-donor-lab/drive-interface-donor-lab').then(
        (m) => m.DriveInterfaceDonorLabComponent,
      ),
  },
  [RouteKey.DefineResourceMasterList]: {
    path: '/donor-functions/recruitment/recruitment-administration/define-resource-master-list',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-administration/define-resource-master-list/define-resource-master-list').then(
        (m) => m.DefineResourceMasterListComponent,
      ),
  },
  [RouteKey.MobilePcLaptopRegister]: {
    path: '/application-administration/mobile-pc-laptop-register',
    loadComponent: () =>
      import('../../modules/application-admin/mobile-pc-laptop-register/mobile-pc-laptop-register').then(
        (m) => m.MobilePcLaptopRegisterComponent,
      ),
  },
  [RouteKey.ManageMenuItem]: {
    path: '/system-administration/menu-admin/manage-menu-items',
    loadComponent: () =>
      import('../../modules/system-administration/manage-menu-items/manage-menu-items.component').then(
        (m) => m.ManageMenuItemsComponent,
      ),
  },
  [RouteKey.ResetUserPassword]: {
    path: '/reset-password-preview',
    loadComponent: () =>
      import('../../modules/reset-password-preview/reset-password-preview').then(
        (m) => m.ResetPasswordPreviewComponent,
      ),
  },
  [RouteKey.DefineDurationBetweenProcedures]: {
    path: '/application-administration/wellsky-restricted/define-duration-between-procedures',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/define-duration-between-procedures/define-duration-between-procedures').then(
        (m) => m.DefineDurationBetweenProceduresComponent,
      ),
  },
  [RouteKey.DefineDefaultDriveChecklist]: {
    path: '/donor-functions/recruitment/recruitment-administration/define-default-drive-checklist',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-administration/define-default-drive-checklist/define-default-drive-checklist').then(
        (m) => m.DefineDefaultDriveChecklistComponent,
      ),
  },
  [RouteKey.DefineDriveCategoryRules]: {
    path: '/donor-functions/recruitment/recruitment-administration/define-drive-category-rules',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-administration/define-drive-category-rules/define-drive-category-rules').then(
        (m) => m.DefineDriveCategoryRulesComponent,
      ),
  },
  [RouteKey.MonthlyCollectionGoalsQuery]: {
    path: '/donor-functions/monthly-collection-goals-query',
    loadComponent: () =>
      import('../../modules/donor-functions/monthly-collection-goals-query/monthly-collection-goals-query').then(
        (m) => m.MonthlyCollectionGoalsQueryComponent,
      ),
  },
  [RouteKey.DrawQuery]: {
    path: '/donor-functions/recruitment/recruitment-queries/draw-query',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-queries/draw-query/draw-query').then(
        (m) => m.DrawQuery,
      ),
  },
  [RouteKey.MultipleDriveSelectionQuery]: {
    path: '/donor-functions/recruitment/recruitment-queries/multiple-drive-selection-query',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-queries/multiple-drive-selection-query/multiple-drive-selection-query').then(
        (m) => m.MultipleDriveSelectionQueryComponent,
      ),
  },
  [RouteKey.DrivesBySponsorQuery]: {
    path: '/donor-functions/recruitment/recruitment-queries/drives-by-sponsor-query',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-queries/drives-by-sponsor-query/drives-by-sponsor-query').then(
        (m) => m.DrivesBySponsorQuery,
      ),
  },
  [RouteKey.ValidFfFlag]: {
    path: '/application-administration/lab-restricted/valid-ff-flags',
    loadComponent: () =>
      import('../../modules/application-admin/lab-restricted-validation-tables/valid-ff-flags/valid-ff-flag').then(
        (m) => m.ValidFfFlagComponent,
      ),
  },
  [RouteKey.ResourceStatusQuery]: {
    path: '/donor-functions/recruitment/recruitment-queries/resource-status-query',
    loadComponent: () =>
      import('../../modules/donor-functions/resource-status-query/resource-status-query').then(
        (m) => m.ResourceStatusQuery,
      ),
  },
  [RouteKey.ParentSponsorQuery]: {
    path: '/donor-functions/recruitment/recruitment-query/parent-sponsor-query',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-query/parent-sponsor-query/parent-sponsor-query').then(
        (m) => m.ParentSponsorQueryComponent,
      ),
  },
  [RouteKey.MergeDuplicateSponsors]: {
    path: '/donor-functions/recruitment/recruitment-maintenance/merge-duplicate-sponsors',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-maintenance/merge-duplicate-sponsors/merge-duplicate-sponsors').then(
        (m) => m.MergeDuplicateSponsorsComponent,
      ),
  },
  [RouteKey.CreateOrModifySpecialDrive]: {
    path: '/donor-functions/recruitment/recruitment-maintenance/create-or-modify-special-drive',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-maintenance/create-or-modify-special-drive/create-or-modify-special-drive').then(
        (m) => m.CreateOrModifySpecialDriveComponent,
      ),
  },
  [RouteKey.CreateOrModifySpecialDriveDcm]: {
    path: '/donor-functions/donor-center-management/donor-center-maintenance/create-or-modify-special-drive',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-center-management/donor-center-maintenance/create-or-modify-special-drive/create-or-modify-special-drive').then(
        (m) => m.CollStaffDocErrorsSpecialDriveComponent,
      ),
  },
  [RouteKey.ManageSpecialDrive]: {
    path: '/donor-functions/post-donation-drive-analysis/coll-staff-documentation-errors/manage-special-drive',
    loadComponent: () =>
      import('../../modules/donor-functions/post-donation-drive-analysis/coll-staff-documentation-errors/manage-special-drive/manage-special-drive').then(
        (m) => m.ManageSpecialDriveComponent,
      ),
  },
  [RouteKey.CancelFixedSpecialDrives]: {
    path: '/donor-functions/post-donation-drive-analysis/coll-staff-documentation-errors/cancel-fixed-special-drives',
    loadComponent: () =>
      import('../../modules/donor-functions/post-donation-drive-analysis/coll-staff-documentation-errors/manage-special-drive/cancel-fixed-special-drives/cancel-fixed-special-drives').then(
        (m) => m.CancelFixedSpecialDrivesComponent,
      ),
  },
  [RouteKey.CreateDriveFromTemporaryDrive]: {
    path: '/donor-functions/recruitment/recruitment-general-functions/create-drive-from-temporary-drive',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-general-functions/create-drive-from-temporary-drive/create-drive-from-temporary-drive').then(
        (m) => m.CreateDriveFromTemporaryDriveComponent,
      ),
  },
  [RouteKey.SetDriveDateAndId]: {
    path: '/donor-functions/recruitment/recruitment-general-functions/set-drive-date-and-id',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-general-functions/set-drive-date-and-id/set-drive-date-and-id').then(
        (m) => m.SetDriveDateAndIdComponent,
      ),
  },
  [RouteKey.ResourceAvailabilityRules]: {
    path: '/donor-functions/recruitment/recruitment-administration/resource-availability-rules',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-administration/resource-availability-rules/resource-availability-rules').then(
        (m) => m.ResourceAvailabilityRulesComponent,
      ),
  },
  [RouteKey.DriveSheetPrintStatus]: {
    path: '/donor-functions/recruitment/drive-sheet-print-status',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/drive-sheet-print-status/drive-sheet-print-status').then(
        (m) => m.DriveSheetPrintStatusComponent,
      ),
  },
  [RouteKey.CollectionGoalsByDateQuery]: {
    path: '/donor-functions/collection-goals-by-date-query',
    loadComponent: () =>
      import('../../modules/donor-functions/collection-goals-by-date-query/collection-goals-by-date-query').then(
        (m) => m.CollectionGoalsByDateQuery,
      ),
  },
  [RouteKey.AlternateDemographics]: {
    path: '/donor-functions/alternate-demographics',
    loadComponent: () =>
      import('../../modules/donor-functions/alternate-demographics/alternate-demographics').then(
        (m) => m.AlternateDemographicsComponent,
      ),
  },
  // International Address - Donor Functions => Recruitment
  // Mnemonic: DPWIADDR
  [RouteKey.InternationalAddress]: {
    path: '/donor-functions/international-address',
    loadComponent: () =>
      import('../../modules/donor-functions/international-address/international-address').then(
        (m) => m.InternationalAddressComponent,
      ),
  },
  // City, State, and Zip Query - Application Administration => Common Validation Table
  // Mnemonic: CITYQ
  [RouteKey.CityStateZipQuery]: {
    path: '/application-administration/common-validation/cityq',
    loadComponent: () =>
      import('../../modules/application-admin/common-validation-table/cityq/city-state-zip-query').then(
        (m) => m.CityStateZipQueryComponent,
      ),
  },
  [RouteKey.AboSpreadByDrive]: {
    path: '/donor-functions/abo-spread-by-drive',
    loadComponent: () =>
      import('../../modules/donor-functions/abo-spread-by-drive/abo-spread-by-drive').then(
        (m) => m.AboSpreadByDriveComponent,
      ),
  },
  [RouteKey.AboSpreadBySponsor]: {
    path: '/donor-functions/abo-spread-by-sponsor',
    loadComponent: () =>
      import('../../modules/donor-functions/abo-spread-by-sponsor/abo-spread-by-sponsor').then(
        (m) => m.AboSpreadBySponsorComponent,
      ),
  },
  [RouteKey.TemporaryDriveQuery]: {
    path: '/donor-functions/recruitment/recruitment-queries/temporary-drives-query',
    loadComponent: () =>
      import('../../modules/donor-functions/temporary-drive-query/temporary-drive-query').then(
        (m) => m.TemporaryDriveQuery,
      ),
  },
  [RouteKey.RegisteredDonationsQuery]: {
    path: '/donor-functions/registration/registered-donations-query',
    loadComponent: () =>
      import('../../modules/donor-functions/registered-donations-query/registered-donations-query').then(
        (m) => m.RegisteredDonationsQuery,
      ),
  },
  [RouteKey.ConsentHistory]: {
    path: '/donor-functions/registration/consent-history',
    loadComponent: () =>
      import('../../modules/donor-functions/registered-donations-query/consent-history/consent-history.component').then(
        (m) => m.ConsentHistoryComponent,
      ),
  },
  [RouteKey.DonorLabels]: {
    path: '/donor-functions/donor-communication/donor-labels',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-communication/donor-labels/donor-labels').then(
        (m) => m.DonorLabelsComponent,
      ),
  },
  [RouteKey.PhysicalFindingsTemplate]: {
    path: '/donor-functions/registration/registration-administration/physical-findings-template',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-administration/physical-findings-template/physical-findings-template').then(
        (m) => m.PhysicalFindingsTemplateComponent,
      ),
  },
  [RouteKey.AddPhysicalFindingsTemplate]: {
    path: '/donor-functions/registration/registration-administration/physical-findings-template/add',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-administration/physical-findings-template/add-edit-physical-findings-template/add-edit-physical-findings-template').then(
        (m) => m.AddEditPhysicalFindingsTemplateComponent,
      ),
  },
  [RouteKey.TerritoryManagement]: {
    path: '/donor-functions/recruitment/recruitment-administration/territory-management',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-administration/territory-management/territory-management').then(
        (m) => m.TerritoryManagementComponent,
      ),
  },
  [RouteKey.AlternateIdConfiguration]: {
    path: '/registration/registration-administration/alternate-id-configuration',
    loadComponent: () =>
      import('../../modules/registration/registration-administration/alternate-id-configuration/alternate-id-configuration').then(
        (m) => m.AlternateIdConfiguration,
      ),
  },
  [RouteKey.MaintainVehicleDetails]: {
    path: '/application-administration/wellsky-restricted/maintain-vehicle-details',
    loadComponent: () =>
      import('../../modules/application-admin/wellsky-restricted-validation-tables/maintain-vehicle-details/maintain-vehicle-details').then(
        (m) => m.MaintainVehicleDetailsComponent,
      ),
  },
  [RouteKey.DriveDetailsQuery]: {
    path: '/donor-functions/recruitment/recruitment-queries/drive-details-query',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-queries/drive-details-query/drive-details-query').then(
        (m) => m.DriveDetailsQueryComponent,
      ),
  },
  [RouteKey.MaintainSponsorContacts]: {
    path: '/donor-functions/recruitment/recruitment-general-functions/maintain-sponsor-contacts',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-administration/maintain-sponsor-contacts/maintain-sponsor-contacts').then(
        (m) => m.MaintainSponsorContactsComponent,
      ),
  },
  [RouteKey.ApiTestSchedulingByMachineId]: {
    path: '/apis-integration/lab-api-interfaces/api-test-scheduling-by-machine-id',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/Lab-API-Interfaces/test-by-machine-id/test-by-machine-id').then(
        (m) => m.TestByMachineIdComponent,
      ),
  },
  [RouteKey.AbbreviatedQuestionnaireSetup]: {
    path: '/donor-functions/abbreviated-questionnaire-setup',
    loadComponent: () =>
      import('../../modules/donor-functions/abbreviated-questionnaire-setup/abbreviated-questionnaire-setup').then(
        (m) => m.AbbreviatedQuestionnaireSetupComponent,
      ),
  },
  [RouteKey.ViewSponsorContacts]: {
    path: '/donor-functions/recruitment/recruitment-queries/sponsor-contacts-query',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-maintenance/view-sponsor-contacts/view-sponsor-contacts').then(
        (m) => m.ViewSponsorContactsComponent,
      ),
  },
  [RouteKey.DefineHHResponseGroups]: {
    path: '/donor-functions/registration/registration-administration/define-hh-response-groups',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-administration/define-hh-response-groups/define-hh-response-groups').then(
        (m) => m.DefineHHResponseGroups,
      )
  },
  [RouteKey.FastTrakWebConfiguration]: {
    path: '/donor-functions/registration/registration-administration/fasttrak-web-configuration',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-administration/fasttrak-web-configuration/fasttrak-web-configuration').then(
        (m) => m.FastTrakWebConfiguration,
      ),
  },
  [RouteKey.ReportActions]: {
    path: '/system-administration/user-admin/lab-dist-user-admin/user-utilities/report-actions',
    loadComponent: () =>
      import('../../modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/report-actions/report-actions-list/report-actions-list.component').then(
        (m) => m.ReportActionsListComponent,
      ),
  },
  [RouteKey.DocumentLibrary]: {
    path: '/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library',
    loadComponent: () =>
      import('../../modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library/document-library').then(
        (m) => m.DocumentLibraryComponent,
      ),
  },
  [RouteKey.DonorSurveyManager]: {
    path: '/donor-functions/donor-survey-manager',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-survey-manager/donor-survey-manager').then(
        (m) => m.DonorSurveyManagerComponent,
      ),
  },
  [RouteKey.RbcAntigenManagerConfig]: {
    path: '/donor-functions/hla-rbc/rbc-antigen-manager/rbc-antigen-manager-config',
    loadComponent: () =>
      import('../../modules/donor-functions/rbc-antigen-manager-config/rbc-antigen-manager-config').then(
        (m) => m.RbcAntigenManagerConfigComponent,
      ),
  },
  // Donor RBC Ag Query - Now supports direct access via path or query params
  [RouteKey.DonorRbcAgQueryEntry]: {
    // Deprecated: Old entry page route now redirects to main component for backward compatibility
    path: '/donor-functions/donor-rbc-ag-query',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-rbc-ag-query/donor-rbc-ag-query').then(
        (m) => m.DonorRbcAgQueryComponent,
      ),
  },
  [RouteKey.DonorRbcAgQuery]: {
    path: '/donor-functions/donor-rbc-ag-query/:donorId',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-rbc-ag-query/donor-rbc-ag-query').then(
        (m) => m.DonorRbcAgQueryComponent,
      ),
  },
  [RouteKey.DonorsByEventsQuery]: {
    path: '/donor-functions/donor-communication/donors-by-events-query',
    loadComponent: () =>
      import('../../modules/donor-functions/donors-by-events-query/donors-by-events-query').then(
        (m) => m.DonorsByEventsQuery,
      ),
  },
  [RouteKey.MaintainDriveLocation]: {
    path: '/donor-functions/recruitment/recruitment-general-functions/maintain-drive-location',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-maintenance/maintain-drive-location/maintain-drive-location').then(
        (m) => m.MaintainDriveLocationComponent,
      ),
  },
  [RouteKey.FindDonor]: {
    path: '/donor-functions/find-donor',
    loadComponent: () =>
      import('../../shared/components/find-donor/find-donor-page').then(
        (m) => m.FindDonorPage,
      ),
  },
  [RouteKey.CollectionStatistics]: {
    path: '/donor-functions/collection-statistics',
    loadComponent: () =>
      import('../../shared/components/collection-statistics-dialog/collection-statistics-page').then(
        (m) => m.CollectionStatisticsPage,
      ),
  },
  [RouteKey.SiteCollectionStatistics]: {
    path: '/donor-functions/site-collection-statistics',
    loadComponent: () =>
      import('../../shared/components/site-collection-statistics-dialog/site-collection-statistics-page').then(
        (m) => m.SiteCollectionStatisticsPage,
      ),
  },
  [RouteKey.NotificationLog]: {
    path: '/donor-functions/notification-log',
    loadComponent: () =>
      import('../../shared/components/notification-log-dialog/notification-log-dialog-page').then(
        (m) => m.NotificationLogDialogPage,
      ),
  },
  [RouteKey.DonorCommunicationQuery]: {
    path: '/donor-functions/donor-communication-query',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-communication-query/donor-communication-query').then(
        (m) => m.DonorCommunicationQuery,
      ),
  },
  [RouteKey.AuthorizeNotificationLetter]: {
    path: '/donor-functions/authorize-notification-letter',
    loadComponent: () =>
      import('../../shared/components/authorize-notification-letter-dialog/authorize-notification-letter-dialog-page').then(
        (m) => m.AuthorizeNotificationLetterDialogPage,
      ),
  },
  [RouteKey.EmfProcesses]: {
    path: '/application-administration/common-validation/emf-processes',
    loadComponent: () =>
      import('../../modules/application-admin/common-validation-table/emf-processes/emf-processes').then(
        (m) => m.DefineProcessCodesComponent,
      ),
  },
  [RouteKey.EmfDefineProcess]: {
    path: '/application-administration/common-validation/emf-processes/define-process',
    loadComponent: () =>
      import('../../modules/application-admin/common-validation-table/emf-processes/define-process/define-process-container/define-process-container').then(
        (m) => m.DefineProcessContainerComponent,
      ),
  },
  [RouteKey.ChangeDriveIdCollectionDate]: {
    path: '/donor-functions/registration/registration-maintenance-functions/change-drive-id-collection-date',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-maintenance-functions/change-drive-id-collection-date/change-drive-id-collection-date').then(
        (m) => m.ChangeDriveIdCollectionDateComponent,
      ),
  },
  [RouteKey.RollbackDonationAudit]: {
    path: '/donor-functions/registration/registration-maintenance-functions/rollback-donation-audit',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-maintenance-functions/rollback-donation-audit/rollback-donation-audit').then(
        (m) => m.RollbackDonationAuditComponent,
      ),
  },
  [RouteKey.VerifyControlValuesForTestBatch]: {
    path: '/laboratory-functions/testing-modules/test-staging-parameters/verify-control-values',
    loadComponent: () =>
      import('../../modules/laboratory-functions/testing-modules/test-staging-parameters/verify-control-values-for-test-batch/verify-control-values-for-test-batch').then(
        (m) => m.VerifyControlValuesForTestBatchComponent,
      ),
  },
  [RouteKey.ReleaseAuditInterdiction]: {
    path: '/donor-functions/registration/registration-maintenance-functions/release-audit-interdiction',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-maintenance-functions/release-audit-interdiction/release-audit-interdiction.component').then(
        (m) => m.ReleaseAuditInterdictionComponent,
      ),
  },
  [RouteKey.MaintainDonorInterdiction]: {
    path: '/donor-functions/donor-profile/donor-profile-general-functions/place-donor-interdiction',
    loadComponent: () =>
      import('../../modules/donor-functions/maintain-donor-interdiction/maintain-donor-interdiction.component').then(
        (m) => m.MaintainDonorInterdictionComponent,
      ),
  },
  [RouteKey.MaintainDonorAttributes]: {
    path: '/donor-functions/donor-profile/donor-profile-general-functions/place-donor-attribute',
    loadComponent: () =>
      import('../../modules/donor-functions/maintain-donor-attributes/maintain-donor-attributes.component').then(
        (m) => m.MaintainDonorAttributesComponent,
      ),
  },
  [RouteKey.MaintainDonorEmployer]: {
    path: '/donor-functions/registration/registration-maintenance/maintain-donor-employer',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-maintenance/maintain-donor-employer/maintain-donor-employer').then(
        (m) => m.MaintainDonorEmployerComponent,
      ),
  },
  [RouteKey.ReleaseAuditHolds]: {
    path: '/donor-functions/recruitment/registration/registration-maintenance-functions/release-audit-holds',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-maintenance-functions/release-audit-holds/release-audit-holds').then(
        (m) => m.ReleaseAuditHoldsComponent,
      ),
  },
  [RouteKey.HealthHistoryManagement]: {
    path: '/donor-functions/registration/registration-administration/health-history-management',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-administration/health-history-management/health-history-management').then(
        (m) => m.HealthHistoryManagement,
      ),
  },
  [RouteKey.AddHealthHistoryTemplate]: {
    path: '/donor-functions/registration/registration-administration/health-history-management/add-template',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-administration/health-history-management/hh-templates/add-edit-template/add-edit-template-page').then(
        (m) => m.AddEditTemplatePage,
      ),
  },
  [RouteKey.ViewHealthHistoryTemplate]: {
    path: '/donor-functions/registration/registration-administration/health-history-management/view-template',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-administration/health-history-management/hh-templates/view-template/view-template-page').then(
        (m) => m.ViewTemplatePage,
      ),
  },
  [RouteKey.SearchForDonor]: {
    path: '/donor-functions/search-for-donor',
    loadComponent: () =>
      import('../../shared/components/search-for-donor/search-for-donor-page').then(
        (m) => m.SearchForDonorPage,
      ),
  },
  [RouteKey.PerformVisualAudit]: {
    path: '/donor-functions/registration/registration-general-functions/perform-visual-audit',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-general-functions/perform-visual-audit/perform-visual-audit').then(
        (m) => m.PerformVisualAuditComponent,
      ),
  },
  [RouteKey.PaperlessNursingAudit]: {
    path: '/donor-functions/registration/registration-general-functions/paperless-nursing-audit',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-general-functions/paperless-nursing-audit/paperless-nursing-audit').then(
        (m) => m.PaperlessNursingAuditComponent,
      ),
  },
  [RouteKey.DonationsPendingAuditQuery]: {
    path: '/donor-functions/registration/donations-pending-audit-query',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-queries/donations-pending-audit-query/donations-pending-audit-query').then(
        (m) => m.DonationsPendingAuditQuery,
      ),
  },
  // Deferrals Pending Audit Query - Donor Functions => Registration => Registration Queries => Deferrals Pending Audit Query
  // Mnemonic: DEFPENDQ, .fmb: DRQNODEF
  [RouteKey.DeferralsPendingAuditQuery]: {
    path: '/donor-functions/registration/deferrals-pending-audit-query',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-queries/deferrals-pending-audit-query/deferrals-pending-audit-query').then(
        (m) => m.DeferralsPendingAuditQuery,
      ),
  },
  [RouteKey.DriveStatistics]: {
    path: '/drive-statistics',
    loadComponent: () =>
      import('../../modules/donor-functions/drive-statistics/drive-statistics').then(
        (m) => m.DriveStatisticsComponent,
      ),
  },
  [RouteKey.DonationDetails]: {
    path: '/donor-functions/donation-details',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-profile/donation-details/donation-details').then(
        (m) => m.DonationDetailsComponent,
      ),
  },
  [RouteKey.DonationEntryDetails]: {
    path: '/donation-entry-details',
    loadComponent: () =>
      import('../../modules/donor-functions/donation-entry-details/donation-entry-details').then(
        (m) => m.DonationEntryDetailsComponent,
      ),
  },
  [RouteKey.DefferalEntryDetails]: {
    path: '/defferal-entry-details',
    loadComponent: () =>
      import('../../modules/donor-functions/defferal-entry-details/defferal-entry-details').then(
        (m) => m.DefferalEntryDetailsComponent,
      ),
  },
  [RouteKey.LotDetailsForBags]: {
    path: '/laboratory-functions/component-production/lot-details-for-bags',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-product-management/component-product-management'
      ).then((m) => m.ComponentProductManagementComponent),
  },
  [RouteKey.ValidCatalogNumbers]: {
    path: '/laboratory-functions/component-production/valid-catalog-numbers',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-product-management/component-product-management'
      ).then((m) => m.ComponentProductManagementComponent),
  },
  [RouteKey.MergeDuplicateDonors]: {
    path: '/donor-functions/donor-profile/donor-profile-maintenance/merge-duplicate-donor-records',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-maintenance/merge-duplicate-donor-records/merge-duplicate-donor-records'
      ).then((m) => m.MergeDuplicateDonorRecordsComponent),
  },
  [RouteKey.RegisteredDeferralsQuery]: {
    path: '/donor-functions/registration/registration-queries/registered-deferrals-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/registration/registration-queries/registered-deferrals-query/registered-deferrals-query'
      ).then((m) => m.RegisteredDeferralsQuery),
  },
  [RouteKey.InterdictionQuery]: {
    path: '/donor-functions/donor-profile/donor-profile-queries/interdiction-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-queries/interdiction-query/interdiction-query.component'
      ).then((m) => m.InterdictionQueryComponent),
  },
  [RouteKey.MultipleDonorsQuery]: {
    path: '/donor-functions/donor-profile/donor-profile-queries/multiple-donors-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-queries/multiple-donors-query/multiple-donors-query'
      ).then((m) => m.MultipleDonorsQuery),
  },
  [RouteKey.GradedDonorsQuery]: {
    path: '/donor-functions/donor-profile/donor-profile-queries/graded-donors-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-queries/graded-donors-query/graded-donors-query'
      ).then((m) => m.GradedDonorsQueryComponent),
  },
  [RouteKey.UnitTestResultsQuery]: {
    path: '/donor-functions/donor-profile/donor-profile-queries/unit-test-results-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-queries/unit-test-results-query/unit-test-results-query'
      ).then((m) => m.UnitTestResultsQueryComponent),
  },
  [RouteKey.DonorEligibility]: {
    path: '/donor-eligibility',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-eligibility/donor-eligibility-page'
      ).then((m) => m.DonorEligibilityPage),
  },
  [RouteKey.DonorProfileAuditQuery]: {
    path: '/donor-functions/donor-profile/donor-profile-queries/donor-profile-audit-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-queries/donor-profile-audit-query/donor-profile-audit-query'
      ).then((m) => m.DonorProfileAuditQuery),
  },
  [RouteKey.SpecialProcessingMasterCodes]: {
    path: '/laboratory-functions/component-production/special-processing-master-codes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/special-processing-master-codes/special-processing-master-codes'
      ).then((m) => m.SpecialProcessingMasterCodesComponent),
  },
  [RouteKey.Spike]: {
    path: '/laboratory-functions/component-production/spike',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/spike/spike'
      ).then((m) => m.SpikeComponent),
  },
  [RouteKey.SmartManufactureAttributeConfigurator]: {
    path: '/laboratory-functions/component-production/smart-manufacture-attribute-configurator',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/smart-manufacture-attribute-configurator/smart-manufacture-attribute-configurator'
      ).then((m) => m.SmartManufactureAttributeConfiguratorComponent),
  },
  [RouteKey.ConfigureInterdictionPlacement]: {
    path: '/laboratory-functions/configure-interdiction-placement',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/configure-interdiction-placement/configure-interdiction-placement.component'
      ).then((m) => m.ConfigureInterdictionPlacementComponent),
  },
  [RouteKey.PathogenReductionProcessConfiguration]: {
    path: '/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-process-configuration',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-process-configuration/pathogen-reduction-process-configuration'
      ).then((m) => m.PathogenReductionProcessConfigurationComponent),
  },
  [RouteKey.PathogenReductionManager]: {
    path: '/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager/pathogen-reduction-manager.component'
      ).then((m) => m.PathogenReductionManagerComponent),
  },
  [RouteKey.ConfirmatoryReleaseTestResults]: {
    path: '/laboratory-functions/cnrqc',
    loadComponent: () =>
      import(
        '../../features/laboratory/cnrqc/confirmatory-release-test-results'
      ).then((m) => m.ConfirmatoryReleaseTestResultsComponent),
  },
  [RouteKey.PrePrintedProductLabels]: {
    path: '/laboratory-functions/component-production/pre-printed-product-labels',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/pre-printed-product-labels/pre-printed-product-labels.component'
      ).then((m) => m.PrePrintedProductLabelsComponent),
  },
  [RouteKey.PreLabelFrozenProduct]: {
    path: '/laboratory-functions/labeling-functions/pre-label-frozen-product',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/pre-label-frozen-isbt/pre-label-frozen-isbt.component'
      ).then((m) => m.PreLabelFrozenIsbtComponent),
  },
  [RouteKey.EnterPheresisComponentsIsbt]: {
    path: '/laboratory-functions/component-production/pheresis-processing/enter-pheresis-components-isbt',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/pheresis-processing/enter-pheresis-components-isbt/enter-pheresis-components-isbt.component'
      ).then((m) => m.EnterPheresisComponentsIsbtComponent),
  },
  [RouteKey.ValidPoolAboValues]: {
    path: '/laboratory-functions/component-production/valid-pool-abo-values',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/valid-pool-abo-values/valid-pool-abo-values.component'
      ).then((m) => m.ValidPoolAboValuesComponent),
  },
  [RouteKey.TestKitReagentsQuery]: {
    path: '/laboratory-functions/testing-modules/testing-queries/test-kit-reagents-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/test-kit-reagents-query/test-kit-reagents-query.component'
      ).then((m) => m.TestKitReagentsQueryComponent),
  },
  [RouteKey.NotationCodeConfiguration]: {
    path: '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-administration/notation-code-configuration',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/lab-administration/notation-code-configuration/notation-code-configuration'
      ).then((m) => m.NotationCodeConfigurationComponent),
  },
  [RouteKey.SampleTestLinkage]: {
    path: '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-administration/sample-test-linkage',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-administration/sample-test-linkage/sample-test-linkage'
      ).then((m) => m.SampleTestLinkageComponent),
  },
  [RouteKey.ProductCombinations]: {
    path: '/laboratory-functions/component-production/product-combinations',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/product-combinations/product-combinations.component'
      ).then((m) => m.ProductCombinationsComponent),
  },
  [RouteKey.EnterComponentInterdiction]: {
    path: '/laboratory-functions/attributes-and-interdictions/enter-component-interdiction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/enter-component-interdiction/enter-component-interdiction'
      ).then((m) => m.EnterComponentInterdictionComponent),
  },
  [RouteKey.LabInterdictionQuery]: {
    path: '/laboratory-functions/attributes-and-interdictions/interdiction-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/interdiction-query/interdiction-query'
      ).then((m) => m.InterdictionQueryComponent),
  },
  [RouteKey.ReleaseComponentHold]: {
    path: '/laboratory-functions/attributes-and-interdictions/release-component-hold',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/release-component-hold/release-component-hold'
      ).then((m) => m.ReleaseComponentHoldComponent),
  },
  [RouteKey.ComponentNotes]: {
    path: '/laboratory-functions/attributes-and-interdictions/component-notes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/component-notes/component-notes'
      ).then((m) => m.ComponentNotesComponent),
  },
  [RouteKey.MultipleObservationResultMatrix]: {
    path: '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-admin/multiple-observation-result-matrix',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/multiple-observation-testing/morm/morm'
      ).then((m) => m.MultipleObservationResultMatrixComponent),
  },
  [RouteKey.ValidMultipleObservationResults]: {
    path: '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-admin/valid-multiple-observation-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/multiple-observation-testing/vmor/valid-multiple-observation-results'
      ).then((m) => m.ValidMultipleObservationResultsComponent),
  },
  [RouteKey.MultipleObservationFields]: {
    path: '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-admin/multiple-observation-fields',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-fields/multiple-observation-fields'
      ).then((m) => m.MultipleObservationFieldsComponent),
  },
  [RouteKey.DeletePooledComponents]: {
    path: '/laboratory-functions/component-production/delete-pooled-components',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/delete-pooled-components/delete-pooled-components'
      ).then((m) => m.DeletePooledComponentsComponent),
  },
  [RouteKey.PreparePooledComponents]: {
    path: '/laboratory-functions/component-production/prepare-pooled-components',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/prepare-pooled-components/prepare-pooled-components.component'
      ).then((m) => m.PreparePooledComponentsComponent),
  },
  [RouteKey.ModifyPooledComponents]: {
    path: '/laboratory-functions/component-production/modify-pooled-components',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/modify-pooled-components/modify-pooled-components'
      ).then((m) => m.ModifyPooledComponentsComponent),
  },
  [RouteKey.DeleteComponent]: {
    path: '/laboratory-functions/component-production/component-delete',
    loadComponent: () =>
      import(
        '../../features/laboratory/component-delete/component-delete.component'
      ).then((m) => m.ComponentDeleteComponent),
  },
  [RouteKey.QcForLabeling]: {
    path: '/laboratory-functions/component-production/qc-for-labeling',
    loadComponent: () =>
      import(
        '../../features/laboratory/qc-for-labeling/qc-for-labeling.component'
      ).then((m) => m.QcForLabelingComponent),
  },
  [RouteKey.BloodProductCredit]: {
    path: '/product-management-functions/customer-debit-credit/blood-product-credit',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/customer-debit-credit/blood-product-credit/blood-product-credit'
      ).then((m) => m.BloodProductCredit),
  },

  [RouteKey.DeleteComponentAttributes]: {
    path: '/laboratory-functions/attributes-interdictions/dcattr',
    loadComponent: () =>
      import(
        '../../features/dcattr/dcattr.component'
      ).then((m) => m.DcattrComponent),
  },
  [RouteKey.DeleteUnitAttributes]: {
    path: '/laboratory-functions/attributes-and-interdictions/delete-unit-attributes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/delete-unit-attributes/delete-unit-attributes'
      ).then((m) => m.DeleteUnitAttributesComponent),
  },
  [RouteKey.RecheckProductsFromInventory]: {
    path: '/laboratory-functions/component-production/recheck-products-from-inventory',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/recheck-products-from-inventory/recheck-products-from-inventory'
      ).then((m) => m.RecheckProductsFromInventoryComponent),
  },
  [RouteKey.ConvertModifyComponents]: {
    path: '/laboratory-functions/component-production/cmci',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/cmci/convert-modify-components').then(
        (m) => m.ConvertModifyComponentsComponent,
      ),
  },
  [RouteKey.ProductTypeData]: {
    path: '/laboratory-functions/component-production/component-administration/product-type-data',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/product-type-data/product-type-data.component'
      ).then((m) => m.ProductTypeDataComponent),
  },
  [RouteKey.ProductTypeAttributes]: {
    path: '/laboratory-functions/component-production/component-administration/product-type-attributes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/product-type-attributes/product-type-attributes.component'
      ).then((m) => m.ProductTypeAttributesComponent),
  },
  [RouteKey.DefaultProductCodeAttributes]: {
    path: '/laboratory-functions/component-production/component-administration/default-product-code-attributes',
    loadComponent: () =>
      import(
        '../../features/laboratory/prdtyat/prdtyat.component'
      ).then((m) => m.PrdtyatComponent),
  },
  [RouteKey.DefineHLAAntigens]: {
    path: '/donor-functions/define-hla-antigens',
    loadComponent: () =>
      import('../../modules/donor-functions/define-hla-antigens/define-hla-antigens').then(
        (m) => m.DefineHLAAntigensComponent,
      ),
  },
  [RouteKey.DetachDonorFromDonation]: {
    path: '/donor-functions/registration/registration-maintenance-functions/detach-donor-from-donation',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/registration/registration-maintenance-functions/detach-donor-from-donation/detach-donor-from-donation'
      ).then((m) => m.DetachDonorFromDonationComponent),
  },
  [RouteKey.DetachDonorFromDeferral]: {
    path: '/donor-functions/registration/registration-maintenance-functions/detach-donor-from-deferral',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/registration/registration-maintenance-functions/detach-donor-from-deferral/detach-donor-from-deferral'
      ).then((m) => m.DetachDonorFromDeferralComponent),
  },
  [RouteKey.SendLetterTest]: {
    path: '/send-letter-test',
    loadComponent: () =>
      import('../../shared/components/send-letter-dialog/send-letter-test').then(
        (m) => m.SendLetterTestComponent,
      ),
  },
  [RouteKey.AddDonor]: {
    path: '/donor-functions/donor-profile/add-donor',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-general-functions/add-donor/add-donor'
      ).then((m) => m.AddDonorComponent),
  },
  [RouteKey.ModifyDonor]: {
    path: '/donor-functions/donor-profile/modify-donor',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-general-functions/add-donor/add-donor'
      ).then((m) => m.AddDonorComponent),
  },
  [RouteKey.AddDonorForm]: {
    path: '/donor-functions/donor-profile/donor-data',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-general-functions/add-donor/add-donor'
      ).then((m) => m.AddDonorComponent),
  },
  [RouteKey.NewZipCode]: {
    path: '/donor-functions/general-queries-and-functions/new-zip-code',
    loadComponent: () =>
      import('../../shared/components/new-zip-code/new-zip-code-page').then(
        (m) => m.NewZipCodePage,
      ),
  },
  [RouteKey.VistaLifeTrakConversionTable]: {
    path: '/donor-functions/general-queries-and-functions/vista-lifetrak-conversion-table',
    loadComponent: () =>
      import('../../modules/donor-functions/general-queries-and-functions/vista-lifetrak-conversion-table/vista-lifetrak-conversion-table').then(
        (m) => m.VistaLifeTrakConversionTableComponent,
      ),
  },
  [RouteKey.VistaLifeTrakErrorLog]: {
    path: '/donor-functions/general-queries-and-functions/vista-lifetrak-error-log',
    loadComponent: () =>
      import('../../modules/donor-functions/general-queries-and-functions/vista-lifetrak-error-log/vista-lifetrak-error-log').then(
        (m) => m.VistaLifeTrakErrorLogComponent,
      ),
  },
  [RouteKey.LifeTrakApiLogInformationQuery]: {
    path: '/laboratory-functions/life-trak-api-menu/life-trak-api-log-information-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/life-trak-api-menu/life-trak-api-log-information-query/life-trak-api-log-information-query').then(
        (m) => m.LifeTrakApiLogInformationQueryComponent,
      ),
  },
  [RouteKey.VoidDonorInterface]: {
    path: '/apis-integration/lab-api-interfaces/void-donor-interface',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/Lab-API-Interfaces/void-donor-interface/void-donor-interface.component').then(
        (m) => m.VoidDonorInterfaceComponent,
      ),
  },
  [RouteKey.ReInterfaceDonorToLab]: {
    path: '/apis-integration/lab-api-interfaces/re-interface-donor-to-lab',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/Lab-API-Interfaces/re-interface-donor-to-lab/re-interface-donor-to-lab').then(
        (m) => m.ReInterfaceDonorToLabComponent,
      ),
  },
  [RouteKey.DefineHLACrossReactiveGroups]: {
    path: '/donor-functions/recruitment/hla-cross-reactive-groups',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/hla-cross-reactive-groups/define-hla-cross-reactive-groups').then(
        (m) => m.DefineHLACrossReactiveGroups,
      ),
  },
  [RouteKey.DefineHLAMatchingGrades]: {
    path: '/donor-functions/recruitment/hla-matching-grades',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/hla-matching-grades/define-hla-matching-grades').then(
        (m) => m.DefineHlaMatchingGrades,
      ),
  },
  [RouteKey.DeferralsOnHoldQuery]: {
    path: '/donor-functions/registration/registration-queries/deferrals-on-hold-query',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-queries/deferrals-on-hold-query/deferrals-on-hold-query').then(
        (m) => m.DeferralsOnHoldQueryComponent,
      ),
  },
  [RouteKey.RegisterDeferral]: {
    path: '/donor-functions/registration/registration-general-functions/register-deferral',
    loadComponent: () =>
      import('../../modules/donor-functions/registration/registration-general-functions/register-deferral/register-deferral').then(
        (m) => m.RegisterDeferralComponent,
      ),
  },
  [RouteKey.UpdateDeferral]: {
    path: '/donor-functions/registration/registration-general-functions/update-deferral',
    loadComponent: () =>
      import('../../modules/donor-functions/update-deferral/update-deferral').then(
        (m) => m.UpdateDeferral,
      ),
  },
  [RouteKey.DonationsOnHoldQuery]: {
    path: '/donor-functions/registration/registration-queries/donations-on-hold-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/registration/registration-queries/donations-on-hold-query/donations-on-hold-query'
      ).then((m) => m.DonationsOnHoldQueryComponent),
  },
  [RouteKey.AttributeExpirationDateOverride]: {
    path: '/laboratory-functions/component-production/component-administration/attribute-expiration-date-override',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/attribute-expiration-date-override/attribute-expiration-date-override.component'
      ).then((m) => m.AttributeExpirationDateOverrideComponent),
  },
  [RouteKey.SpAntigenGroupDefinitions]: {
    path: '/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity/antigen-group',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity/sp-antigen-grouping-and-rarity'
      ).then((m) => m.SpAntigenGroupingAndRarityComponent),
  },
  [RouteKey.SpAntigenRarities]: {
    path: '/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity/antigen-rarity',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity/sp-antigen-grouping-and-rarity'
      ).then((m) => m.SpAntigenGroupingAndRarityComponent),
  },
  [RouteKey.MaintainSpecialInstructions]: {
    path: '/donor-functions/special-donations/maintain-special-instructions',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/special-instructions/maintain-special-instructions'
      ).then((m) => m.MaintainSpecialInstructionsComponent),
  },
  [RouteKey.AuthorizeDonorNotification]: {
    path: '/donor-functions/donor-notification/notification-functions/authorize-donor-notification',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/authorize-donor-notification/authorize-donor-notification'
      ).then((m) => m.AuthorizeDonorNotificationComponent),
  },
  [RouteKey.SpProductsSpecialProcesses]: {
    path: '/laboratory-functions/component-production/special-processing-workflows/products',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/special-processing-workflows/special-processing-workflows'
      ).then((m) => m.SpecialProcessingWorkflowsComponent),
  },
  [RouteKey.SpProcessesAndStages]: {
    path: '/laboratory-functions/component-production/special-processing-workflows/stages',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/special-processing-workflows/special-processing-workflows'
      ).then((m) => m.SpecialProcessingWorkflowsComponent),
  },
  [RouteKey.AntigenPricingMatrix]: {
    path: '/product-management-functions/internal-administration/antigen-pricing-matrix',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/internal-administration/antigen-pricing-matrix/antigen-pricing-matrix.component'
      ).then((m) => m.AntigenPricingMatrixComponent),
  },
  [RouteKey.EnterProductServiceCodes]: {
    path: '/product-management-functions/customer-&-internal-administration/internal-administration/enter-product-service-codes',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/internal-administration/enter-product-service-codes/enter-product-service-codes.component'
      ).then((m) => m.EnterProductServiceCodesComponent),
  },
  [RouteKey.CustomerConsigneeProductDetails]: {
    path: '/product-management-functions/customer-&-internal-administration/customer-administration/customer-consignee-product-details',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/customer-administration/customer-consignee-product-details/customer-consignee-product-details.component'
      ).then((m) => m.CustomerConsigneeProductDetailsComponent),
  },
  [RouteKey.EnterCustomerTierPricing]: {
    path: '/product-management-functions/customer-&-internal-administration/customer-administration/enter-customer-tier-pricing',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/customer-administration/enter-customer-tier-pricing/enter-customer-tier-pricing.component'
      ).then((m) => m.EnterCustomerTierPricingComponent),
  },
  [RouteKey.CancelDebitCreditAdvice]: {
    path: '/product-management-functions/customer-&-internal-administration/customer-administration/cdcan',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/customer-administration/cdcan/cdcan'
      ).then((m) => m.CdcanComponent),
  },
  [RouteKey.EnterStandardTierPricing]: {
    path: '/product-management-functions/customer-&-internal-administration/internal-administration/enter-standard-tier-pricing',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/standard-tier-pricing/enter-standard-tier-pricing.component'
      ).then((m) => m.EnterStandardTierPricingComponent),
  },
  [RouteKey.MaintainGroupInterdictions]: {
    path: '/donor-functions/donor-profile/donor-profile-maintenance/maintain-group-interdictions',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-maintenance/maintain-group-interdictions/maintain-group-interdictions.component'
      ).then((m) => m.MaintainGroupInterdictionsComponent),
  },
  [RouteKey.PrepareDonorNotification]: {
    path: '/donor-functions/donor-notification/notification-functions/prepare-donor-notification',
    loadComponent: () =>
      import('../../modules/donor-functions/prepare-donor-notification/prepare-donor-notification').then(
        (m) => m.PrepareDonorNotification
      ),
  },
  [RouteKey.MaintainUnitInterdiction]: {
    path: '/donor-functions/recruitment/maintain-unit-interdiction',
    loadComponent: () =>
      import('../../modules/donor-functions/recruitment/recruitment-maintenance/maintain-unit-interdiction/maintain-unit-interdiction').then(
        (m) => m.MaintainUnitInterdictionComponent,
      ),
  },
  [RouteKey.AddInterdictionForUnitsNotChecked]: {
    path: '/laboratory-functions/add-interdiction-for-units-not-checked',
    loadComponent: () =>
      import('../../modules/laboratory-functions/add-interdiction-for-units-not-checked/add-interdiction-for-units-not-checked').then(
        (m) => m.AddInterdictionForUnitsNotCheckedComponent,
      ),
  },
  [RouteKey.UpdateDonationRegistration]: {
    path: '/donor-functions/registration/registration-maintenance-functions/update-donation-registration',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/registration/registration-maintenance-functions/update-donation-registration/update-donation-registration'
      ).then((m) => m.UpdateDonationRegistrationComponent),
  },
  [RouteKey.DonorAttributes]: {
    path: '/donor-functions/donor-profile/donor-profile-maintenance/donor-attributes/:donorId',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-maintenance/donor-attributes/donor-attributes.component'
      ).then((m) => m.DonorAttributesComponent),
  },
  [RouteKey.ValidFilters]: {
    path: '/laboratory-functions/component-production/valid-filters',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/valid-filters/valid-filters.component'
      ).then((m) => m.ValidFiltersComponent),
  },
  [RouteKey.ValidAdditionalTests]: {
    path: '/laboratory-functions/testing/testing-administration/valid-additional-tests',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing/testing-administration/valid-additional-tests/valid-additional-tests.component'
      ).then((m) => m.ValidAdditionalTestsComponent),
  },
  [RouteKey.ValidRemoteTestingLabs]: {
    path: '/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing/testing-administration/valid-remote-testing-labs/valid-remote-testing-labs.component'
      ).then((m) => m.ValidRemoteTestingLabsComponent),
  },
  [RouteKey.CheckInExceptionQuery]: {
    path: '/laboratory-functions/material-check-in/check-in-queries/check-in-exception-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-queries/check-in-exception-query/check-in-exception-query'
      ).then((m) => m.CheckInExceptionQuery),
  },
  [RouteKey.DonorDetailQuery]: {
    path: '/donor-functions/donor-profile/donor-detail-query',
    loadComponent: () =>
      import('../../modules/donor-functions/donor-detail-query/donor-detail-query').then(
        (m) => m.DonorDetailQuery,
      ),
  },
  [RouteKey.DonorDocumentLibrary]: {
    path: '/donor-functions/donor-profile/donor-detail-query/document-library',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-detail-query/donor-document-library/donor-document-library'
      ).then((m) => m.DonorDocumentLibraryComponent),
  },
  [RouteKey.MergedDonorsPage]: {
    path: '/donor-functions/donor-profile/donor-detail-query/merged-donors',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-detail-query/merged-donors-page/merged-donors-page'
      ).then((m) => m.MergedDonorsPage),
  },
  [RouteKey.ViewDonorLetters]: {
    path: '/donor-functions/donor-notification/view-donor-letters',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-notification/view-donor-letters/view-donor-letters.component'
      ).then((m) => m.ViewDonorLettersComponent),
  },
  [RouteKey.PotentialDuplicateBatchQuery]: {
    path: '/donor-functions/donor-profile/donor-profile-queries/potential-duplicate-batch-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-queries/potential-duplicate-batch-query/potential-duplicate-batch-query'
      ).then((m) => m.PotentialDuplicateBatchQuery),
  },
  [RouteKey.UnitComponentAttributesQuery]: {
    path: '/laboratory-functions/component-production/component-queries/unit-component-attributes-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-queries/unit-component-attributes-query/unit-component-attributes-query.component'
      ).then((m) => m.UnitComponentAttributesQueryComponent),
  },
  [RouteKey.CorrectImportedUnitData]: {
    path: '/laboratory-functions/imported-blood-processing/impcorr',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/imported-blood-processing/impcorr/correct-imported-unit-data'
      ).then((m) => m.CorrectImportedUnitDataComponent),
  },
  [RouteKey.ImportedBloodProductCheckin]: {
    path: '/laboratory-functions/imported-blood-processing/imported-blood-product-check-in',
    loadComponent: () =>
      import(
        '../../features/laboratory-functions/imported-blood-processing/imported-blood-product-checkin/imported-blood-product-checkin.component'
      ).then((m) => m.ImportedBloodProductCheckinComponent),
  },
  [RouteKey.EnterComponentAttributes]: {
    path: '/laboratory-functions/attributes-and-interdictions/enter-component-attributes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/enter-component-attributes/enter-component-attributes.component'
      ).then((m) => m.EnterComponentAttributesComponent),
  },
  [RouteKey.EnterUnitAttributes]: {
    path: '/laboratory-functions/attributes-and-interdictions/enter-unit-attributes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/enter-unit-attributes/enter-unit-attributes'
      ).then((m) => m.EnterUnitAttributesComponent),
  },
  [RouteKey.AttachDonor]: {
    path: '/donor-functions/donor-profile/attach-donor',
    loadComponent: () =>
      import('../../modules/donor-functions/attach-donor/attach-donor').then(
        (m) => m.AttachDonorComponent
      ),
  },
  [RouteKey.DeleteNonUnitTubes]: {
    path: '/laboratory-functions/material-check-in/check-in-maintenance-functions/delete-non-unit-tubes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-maintenance-functions/delete-non-unit-tubes/delete-non-unit-tubes'
      ).then((m) => m.DeleteNonUnitTubesComponent),
  },
  [RouteKey.LabWarehouseCheckIn]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/lab-warehouse-check-in',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/lab-warehouse-check-in/lab-warehouse-check-in'
      ).then((m) => m.LabWarehouseCheckInComponent),
  },
  [RouteKey.TransferDonorDataToLab]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/transfer-donor-data-to-lab',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/transfer-donor-data-to-lab/transfer-donor-data-to-lab'
      ).then((m) => m.TransferDonorDataToLabComponent),
  },
  [RouteKey.TubeCheckinShipment]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/tube-checkin-shipment',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/tube-checkin-shipment/tube-checkin-shipment'
      ).then((m) => m.TubeCheckinShipmentComponent),
  },
  [RouteKey.TubesCheckIn]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in/tubes-check-in'
      ).then((m) => m.TubesCheckInComponent),
  },
  [RouteKey.HospitalPatientContractProfileTests]: {
    path: '/laboratory-functions/sample-management/hospital-patient-testing-functions/hospital-patient-contract-profile-tests',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/hospital-patient-testing-functions/hospital-patient-contract-profile-tests/hospital-patient-contract-profile-tests'
      ).then((m) => m.HospitalPatientContractProfileTestsComponent),
  },
  [RouteKey.HospitalPatientAdHocTestingContract]: {
    path: '/laboratory-functions/sample-management/hospital-patient-testing-functions/hospital-patient-ad-hoc-testing-contract',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/hospital-patient-testing-functions/hospital-patient-ad-hoc-testing-contract/hospital-patient-ad-hoc-testing-contract'
      ).then((m) => m.HospitalPatientAdHocTestingContractComponent),
  },
  [RouteKey.HospitalPatientTestingContract]: {
    path: '/laboratory-functions/sample-management/hospital-patient-testing-functions/hospital-patient-testing-contract',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/hospital-patient-testing-functions/hospital-patient-testing-contract/hospital-patient-testing-contract'
      ).then((m) => m.HospitalPatientTestingContractComponent),
  },
  [RouteKey.FixedProfileTubeCheckIn]: {
    path: '/laboratory-functions/sample-management/hospital-patient-testing-functions/fixed-profile-tube-check-in',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/hospital-patient-testing-functions/fixed-profile-tube-check-in/fixed-profile-tube-check-in'
      ).then((m) => m.FixedProfileTubeCheckInComponent),
  },
  [RouteKey.MaintainPhysicianList]: {
    path: '/donor-functions/maintain-physician-list',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/maintain-physician-list/maintain-physician-list'
      ).then((m) => m.MaintainPhysicianListComponent),
  },
  [RouteKey.CryoMethods]: {
    path: '/laboratory-functions/component-production/component-administration/cryo-methods',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/cryo-methods/cryo-methods.component'
      ).then((m) => m.CryoMethodsComponent),
  },
  [RouteKey.AttributeCodes]: {
    path: '/laboratory-functions/component-production/component-administration/attribute-codes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/attribute-codes/attribute-codes.component'
      ).then((m) => m.AttributeCodesComponent),
  },
  [RouteKey.EnterAttributeServiceCodes]: {
    path: '/product-management-functions/customer-&-internal-administration/internal-administration/ltrcnfws',
    loadComponent: () =>
      import('../../modules/product-management-functions/internal-administration/ltrcnfws/ltrcnfws.component').then(
        (m) => m.LtrcnfwsComponent
      ),
  },
  [RouteKey.ValidAttributesMatrix]: {
    path: '/laboratory-functions/component-production/component-administration/valid-attributes-matrix',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/valid-attributes-matrix/valid-attributes-matrix.component'
      ).then((m) => m.ValidAttributesMatrixComponent),
  },
  [RouteKey.ProductConversions]: {
    path: '/laboratory-functions/component-production/component-administration/product-conversions',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/product-conversions/product-conversions'
      ).then((m) => m.ProductConversionsComponent),
  },
  [RouteKey.ProcessStages]: {
    path: '/laboratory-functions/component-production/component-administration/process-stages',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/process-stages/process-stages'
      ).then((m) => m.ProcessStagesComponent),
  },
  [RouteKey.VoidProductLabel]: {
    path: '/laboratory-functions/labeling-functions/void-product-label',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/void-product-label/void-product-label'
      ).then((m) => m.VoidProductLabelComponent),
  },
  [RouteKey.HlaRbcRequestQuery]: {
    path: '/laboratory-functions/labeling-functions/donor-functions/recruitment/hla/rbc/hla/rbc-general-functions/hla/rbc-request-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/hla-rbc-request-query/hla-rbc-request-query'
      ).then((m) => m.HlaRbcRequestQueryComponent),
  },
  [RouteKey.EnterHlaRbcRequest]: {
    path: '/donor-functions/hla-rbc/hla-rbc-general-functions/enter-hla-rbc-request',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/hla-rbc/hla-rbc-general-functions/enter-hla-rbc-request/enter-hla-rbc-request'
      ).then((m) => m.EnterHlaRbcRequestComponent),
  },
  [RouteKey.LinkUnitToSpecialDonation]: {
    path: '/donor-functions/special-donations/link-unit-to-special-donation',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/special-donations/link-unit-to-special-donation/link-unit-to-special-donation'
      ).then((m) => m.LinkUnitToSpecialDonationComponent),
  },
  [RouteKey.RegisterSpecialDonationRequest]: {
    path: '/donor-functions/special-donations/register-special-donation-request',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/special-donations/register-special-donation-request/register-special-donation-request'
      ).then((m) => m.RegisterSpecialDonationRequestComponent),
  },
  [RouteKey.RegisterSpecialDonationRequestDetail]: {
    path: '/donor-functions/special-donations/register-special-donation-request/:patId',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/special-donations/register-special-donation-request/patient-detail/patient-detail'
      ).then((m) => m.PatientDetailComponent),
  },
  [RouteKey.SpecialDonationStatusQuery]: {
    path: '/donor-functions/special-donations/special-donation-status-query',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/special-donations/special-donation-status-query/special-donation-status-query'
      ).then((m) => m.SpecialDonationStatusQueryComponent),
  },
  [RouteKey.ModifyCheckInBatchDetails]: {
    path: '/laboratory-functions/modify-check-in-batch-details',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/modify-check-in-batch-details/modify-check-in-batch-details'
      ).then((m) => m.ModifyCheckInBatchDetailsComponent),
  },
  [RouteKey.VoidTestBatch]: {
    path: '/laboratory-functions/void-test-batch',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/void-test-batch/void-test-batch'
      ).then((m) => m.VoidTestBatchComponent),
  },
  [RouteKey.VoidedTestsByUnitIdQuery]: {
    path: '/laboratory-functions/voided-tests-by-unit-id-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/voided-tests-by-unit-id-query/voided-tests-by-unit-id-query'
      ).then((m) => m.VoidedTestsByUnitIdQueryComponent),
  },
  [RouteKey.LabWarehouseCheckout]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/lab-warehouse-checkout',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-In/lab-warehouse-checkout/lab-warehouse-checkout'
      ).then((m) => m.LabWarehouseCheckoutComponent),
  },
  [RouteKey.DefineCommTypes]: {
    path: '/donor-functions/donor-communication/define-communication-types',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/define-communication-types/view-communication-types/view-communication-types'
      ).then((m) => m.ViewCommunicationTypesComponent),
  },
  [RouteKey.ReportSubmission]: {
    path: '/system-administration/report-admin/report-submission',
    loadComponent: () =>
      import('../../modules/system-administration/report-admin/report-submission/report-submission').then(
        (m) => m.ReportSubmissionComponent,
      ),
  },
  [RouteKey.ModifySddDetails]: {
    path: '/laboratory-functions/component-production/component-modification/modify-sdd-details',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-modification/modify-sdd-details/modify-sdd-details'
      ).then((m) => m.ModifySddDetailsComponent),
  },
  [RouteKey.SterileDockingDefinition]: {
    path: '/laboratory-functions/component-production/component-modification/sterile-docking-definition',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/sterile-docking-definition/sterile-docking-definition.component'
      ).then((m) => m.SterileDockingDefinitionComponent),
  },
  [RouteKey.ModifySeparationTimes]: {
    path: '/laboratory-functions/component-production/component-modification/modify-separation-times',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-modification/modify-separation-times/modify-separation-times'
      ).then((m) => m.ModifySeparationTimesComponent),
  },
  [RouteKey.BagCheckIn]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/bag-check-in',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/bag-check-in/bag-check-in'
      ).then((m) => m.BagCheckInComponent),
  },
  [RouteKey.BagCheckInTube]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/bag-check-in/tube',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/bag-check-in/bag-check-in'
      ).then((m) => m.BagCheckInComponent),
  },
  [RouteKey.CheckInDetails]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/check-in-details',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/check-in-details/check-in-details'
      ).then((m) => m.CheckInDetailsComponent),
  },
  [RouteKey.CheckInDetailsExtended]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/check-in-details-extended',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/check-in-details/check-in-details'
      ).then((m) => m.CheckInDetailsComponent),
    data: { extendedDayLimit: true },
  },
  [RouteKey.CheckInBatchQueryWithUnitData]: {
    path: '/laboratory-functions/material-check-in/check-in-queries/check-in-batch-query-with-unit-data',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-queries/check-in-batch-query-with-unit-data/check-in-batch-query-with-unit-data'
      ).then((m) => m.CheckInBatchQueryWithUnitDataComponent),
  },
  [RouteKey.CheckInBatchDataQuery]: {
    path: '/laboratory-functions/material-check-in/check-in-queries/check-in-batch-data-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-queries/check-in-batch-data-query/check-in-batch-data-query'
      ).then((m) => m.CheckInBatchDataQueryComponent),
  },
  [RouteKey.CheckInBatchExceptionQuery]: {
    path: '/laboratory-functions/material-check-in/check-in-queries/check-in-batch-exception-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-queries/check-in-batch-exception-query/check-in-batch-exception-query'
      ).then((m) => m.CheckInBatchExceptionQueryComponent),
  },
  [RouteKey.LabWarehouseTransferQuery]: {
    path: '/laboratory-functions/material-check-in/check-in-queries/lab-warehouse-transfer-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-queries/lab-warehouse-transfer-query/lab-warehouse-transfer-query'
      ).then((m) => m.LabWarehouseTransferQuery),
  },
  [RouteKey.TransportBatchQuery]: {
    path: '/distribution/transport-batch-query',
    loadComponent: () =>
      import('../../modules/distribution/transport-batch-query/transport-batch-query').then(
        (m) => m.TransportBatchQuery,
      ),
  },
  [RouteKey.NonExtractedBatchesQuery]: {
    path: '/laboratory-functions/non-extracted-batches-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/non-extracted-batches-query/non-extracted-batches-query').then(
        (m) => m.NonExtractedBatchesQueryComponent,
      ),
  },
  [RouteKey.PrintSpecialInstructionsTieTags]: {
    path: '/donor-functions/special-donations/print-special-instructions-tie-tags',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/special-donations/print-special-instructions-tie-tags/print-special-instructions-tie-tags'
      ).then((m) => m.PrintSpecialInstructionsTieTagsComponent),
  },
  [RouteKey.PrintAutoDirectedTieTag]: {
    path: '/donor-functions/special-donations/print-auto-directed-tie-tag',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/special-donations/print-auto-directed-tie-tag/print-auto-directed-tie-tag'
      ).then((m) => m.PrintAutoDirectedTieTagComponent),
  },
  [RouteKey.DefineCommunicationLetters]: {
    path: '/donor-functions/donor-communication/define-communication-letters',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/define-communication-letters/define-communication-letters'
      ).then((m) => m.DefineCommunicationLetters),
  },
  [RouteKey.PackInvRejectsToSalvage]: {
    path: '/product-management-functions/inventory-management/pack-inv-rejects-to-salvage',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/pack-inv-rejects-to-salvage/pack-inv-rejects-to-salvage'
      ).then((m) => m.PackInvRejectsToSalvageComponent),
  },
  [RouteKey.SetupInventoryLevelsForBloodCenter]: {
    path: '/product-management-functions/customer-&-internal-administration/internal-administration/setup-inventory-levels-for-blood-center',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/internal-administration/setup-inventory-levels-for-blood-center/setup-inventory-levels-for-blood-center'
      ).then((m) => m.SetupInventoryLevelsForBloodCenterComponent),
  },
  [RouteKey.RejectInventoryProducts]: {
    path: '/product-management-functions/inventory-management/reject-inventory-products',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/reject-inventory-products/reject-inventory-products'
      ).then((m) => m.RejectInventoryProducts),
    },
  [RouteKey.FindUnitsAndProducts]: {
    path: '/product-management-functions/inventory-management/inventory-queries/find-units-and-products',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/inventory-queries/findu/findu.component'
      ).then((m) => m.FinduComponent),
  },
  [RouteKey.CheckinDiscardProducts]: {
    path: '/product-management-functions/inventory-management/checkin-discard-products',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/checkin-discard-products/checkin-discard-products'
      ).then((m) => m.CheckinDiscardProducts),
  },
  [RouteKey.ProductCurrentStatus]: {
    path: '/product-management-functions/inventory-management/product-current-status',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/product-current-status/product-current-status'
      ).then((m) => m.ProductCurrentStatusComponent),
  },
  [RouteKey.EnterNoteForSpecialProcessing]: {
    path: '/laboratory-functions/component-production/special-component-processing/enter-note-for-special-processing',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/enter-note-for-special-processing/enter-note-for-special-processing'
      ).then((m) => m.EnterNoteForSpecialProcessingComponent),
  },
  [RouteKey.EnterComponentDifferential]: {
    path: '/laboratory-functions/component-production/special-component-processing/enter-component-differential',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/enter-component-differential/enter-component-differential'
      ).then((m) => m.EnterComponentDifferentialComponent),
  },
  [RouteKey.VerifyComponentSuitability]: {
    path: '/laboratory-functions/component-production/suit',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/suit/verify-component-suitability'
      ).then((m) => m.VerifyComponentSuitability),
  },
  [RouteKey.VerifyComponentSuitabilityOffline]: {
    path: '/laboratory-functions/component-production/verify-component-suitability-offline',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/verify-component-suitability-offline/verify-component-suitability-offline'
      ).then((m) => m.VerifyComponentSuitabilityOfflineComponent),
  },
  [RouteKey.EditSpikingDetails]: {
    path: '/laboratory-functions/component-production/special-component-processing/edit-spiking-details',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/special-component-processing/edit-spiking-details/edit-spiking-details'
      ).then((m) => m.EditSpikingDetailsComponent),
  },
  [RouteKey.DiscardEmptyBags]: {
    path: '/laboratory-functions/component-production/routine-component-production/discard-empty-bags',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/routine-component-production/discard-empty-bags/discard-empty-bags'
      ).then((m) => m.DiscardEmptyBagsComponent),
  },
  [RouteKey.RejectUnitComponent]: {
    path: '/laboratory-functions/component-production/routine-component-production/reject-unit-component',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/routine-component-production/reject-unit-component/reject-unit-component'
      ).then((m) => m.RejectUnitComponentComponent),
  },
  [RouteKey.ReleaseProductQuarantine]: {
    path: '/laboratory-functions/component-production/release-quarantine',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/release-quarantine/release-product-quarantine'
      ).then((m) => m.ReleaseProductQuarantineComponent),
  },
  [RouteKey.SeparationTimes]: {
    path: '/laboratory-functions/component-production/routine-component-production/separation-times',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/routine-component-production/separation-times/separation-times'
      ).then((m) => m.SeparationTimesComponent),
  },
  [RouteKey.FreezeStartTimesOffline]: {
    path: '/laboratory-functions/component-production/routine-component-production/freeze-start-times',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/routine-component-production/freeze-start-times/freeze-start-times'
      ).then((m) => m.FreezeStartTimesOfflineComponent),
  },
  [RouteKey.ComponentsMadeFromUnitIsbt]: {
    path: '/laboratory-functions/component-production/routine-component-production/components-made-from-unit-isbt',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/routine-component-production/components-made-from-unit-isbt/components-made-from-unit-isbt'
      ).then((m) => m.ComponentsMadeFromUnitIsbtComponent),
  },
  [RouteKey.SeparationTimesOffline]: {
    path: '/laboratory-functions/component-production/separation-times-offline',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/separation-times-offline/separation-times-offline'
      ).then((m) => m.SeparationTimesOfflineComponent),
  },
  [RouteKey.RackDefinition]: {
    path: '/distribution/rack-definition',
    loadComponent: () =>
      import(
        '../../modules/distribution/rack-definition/rack-definition'
      ).then((m) => m.RackDefinitionComponent),
  },
  [RouteKey.DebitCreditQuery]: {
    path: '/distribution/customer-debit-credit/debit-credit-query',
    loadComponent: () =>
      import(
        '../../modules/distribution/customer-debit-credit-query/debit-credit-query'
      ).then((m) => m.DebitCreditQuery),
  },
  [RouteKey.OrderServicesDebitCredit]: {
    path: '/product-management-functions/customer-debit-credit/order-services-debit-credit',
    loadComponent: () =>
      import(
        '../../modules/distribution/order-services-debit-credit/order-services-debit-credit'
      ).then((m) => m.OrderServicesDebitCreditComponent),
  },
  [RouteKey.ChangeUnitCollectionDate]: {
    path: '/laboratory-functions/material-check-in/check-in-maintenance-functions/change-unit-collection-date',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-maintenance-functions/change-unit-collection-date/change-unit-collection-date.component'
      ).then((m) => m.ChangeUnitCollectionDateComponent),
  },
  [RouteKey.DeleteUnitInLabSystem]: {
    path: '/laboratory-functions/material-check-in/check-in-maintenance-functions/delete-unit-in-lab-system',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-maintenance-functions/delete-unit-in-lab-system/delete-unit-in-lab-system.component'
      ).then((m) => m.DeleteUnitInLabSystemComponent),
  },
  [RouteKey.ModifyContractBatch]: {
    path: '/laboratory-functions/material-check-in/check-in-maintenance-functions/modify-contract-batch',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/check-in-maintenance-functions/modify-contract-batch/modify-contract-batch.component'
      ).then((m) => m.ModifyContractBatchComponent),
  },
  [RouteKey.LicensedProducts]: {
    path: '/laboratory-functions/component-production/component-administration/licensed-products',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/licensed-products/licensed-products'
      ).then((m) => m.LicensedProductsComponent),
  },
  [RouteKey.ProductCodes]: {
    path: '/laboratory-functions/component-production/component-administration/product-codes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-administration/product-codes/product-codes'
      ).then((m) => m.ProductCodesComponent),
  },
  [RouteKey.StorageDeviceDetails]: {
    path: '/distribution/storage-device-details',
    loadComponent: () =>
      import(
        '../../modules/distribution/storage-device-details/storage-device-details'
      ).then((m) => m.StorageDeviceDetailsComponent),
  },
  [RouteKey.LabBatchTransfer]: {
    path: '/distribution/lab-batch-transfer',
    loadComponent: () =>
      import(
        '../../modules/distribution/lab-batch-transfer/lab-batch-transfer'
      ).then((m) => m.LabBatchTransferComponent),
  },
  [RouteKey.PackRecoveredPlasma]: {
    path: '/distribution/packrp',
    loadComponent: () =>
      import('../../modules/distribution/packrp/pack-recovered-plasma').then(
        (m) => m.PackRecoveredPlasmaComponent,
      ),
  },
  [RouteKey.ReconcileLabWarehouseBatch]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/lbwhrcl',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/lbwhrcl/reconcile-lab-warehouse-batch'
      ).then((m) => m.ReconcileLabWarehouseBatchComponent),
  },
  [RouteKey.ReconcileTransportBatch]: {
    path: '/laboratory-functions/material-check-in/general-check-in-functions/imiwhrcl',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/material-check-in/general-check-in-functions/imiwhrcl/reconcile-transport-batch'
      ).then((m) => m.ReconcileTransportBatchComponent),
  },
  [RouteKey.ProductStorageDefinition]: {
    path: '/distribution/product-storage-definition',
    loadComponent: () =>
      import(
        '../../modules/distribution/product-storage-definition/product-storage-definition'
      ).then((m) => m.ProductStorageDefinitionComponent),
  },
  [RouteKey.OfflineProductShipment]: {
    path: '/product-management-functions/offline-data-entry-functions/offline-product-shipment',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/offline-data-entry-functions/offline-product-shipment/offline-product-shipment'
      ).then((m) => m.OfflineProductShipment),
  },
  [RouteKey.PackLabDiscards]: {
    path: '/distribution/pack-lab-discards',
    loadComponent: () =>
      import('../../modules/distribution/pack-lab-discards/pack-lab-discards.component').then(
        (m) => m.PackLabDiscardsComponent
      ),
  },
  [RouteKey.PackLabDiscardsToSalvage]: {
    path: '/distribution/pack-lab-discards-to-salvage',
    loadComponent: () =>
      import('../../modules/distribution/pack-lab-discards/pack-lab-discards.component').then(
        (m) => m.PackLabDiscardsComponent
      ),
  },
  [RouteKey.CustomerOrdersQuery]: {
    path: '/distribution/oeqpdord',
    loadComponent: () =>
      import('../../modules/distribution/ocq/ocq').then((m) => m.OcqComponent),
  },
  [RouteKey.RegenerateElectronicPlasmaFile]: {
    path: '/distribution/regenerate-electronic-plasma-file',
    loadComponent: () =>
      import(
        '../../modules/distribution/regenerate-electronic-plasma-file/regenerate-electronic-plasma-file'
      ).then((m) => m.RegenerateElectronicPlasmaFileComponent),
  },
  [RouteKey.DeleteSddWorksheetUnits]: {
    path: '/laboratory-functions/component-production/component-modification/delete-sdd-worksheet-units',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/component-modification/delscd/delete-sdd-worksheet-units').then(
        (m) => m.DeleteSddWorksheetUnitsComponent
      ),
  },
  [RouteKey.HospitalReturns]: {
    path: '/laboratory-functions/hospital-returns',
    loadComponent: () =>
      import('../../modules/laboratory-functions/hospital-returns/hospital-returns').then(
        (m) => m.HospitalReturnsComponent),
  },
  [RouteKey.CheckInFromLab]: {
    path: '/product-management-functions/inventory-management/product-management/check-in-from-lab',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/product-management/check-in-from-lab/check-in-from-lab'
      ).then((m) => m.CheckInFromLabComponent),
  },
  [RouteKey.ReleaseStandingOrdersBatch]: {
    path: '/product-management-functions/order-module/order-maintenance/release-standing-orders-batch',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-module/release-standing-orders-batch/release-standing-orders-batch'
      ).then((m) => m.ReleaseStandingOrdersBatchComponent),
  },
  [RouteKey.MoveOutdatesToOutdateLocation]: {
    path: '/product-management-functions/inventory-management/product-management/move-outdates-to-outdate-location',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/product-management/move-outdates-to-outdate-location/move-outdates-to-outdate-location'
      ).then((m) => m.MoveOutdatesToOutdateLocationComponent),
  },
  [RouteKey.UnitTransferToTransfusionSystem]: {
    path: '/product-management-functions/inventory-management/product-management/unit-transfer-to-transfusion',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/product-management/unit-transfer-to-transfusion/unit-transfer-to-transfusion'
      ).then((m) => m.UnitTransferToTransfusionComponent),
  },
  [RouteKey.ChkOff]: {
    path: '/product-management-functions/offline-data-entry-functions/offline-product-check-in',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/offline-data-entry-functions/chkoff/chkoff-page'
      ).then((m) => m.ChkOffPage),
  },
  [RouteKey.EnterProductAttributes]: {
    path: '/product-management-functions/inventory-management/product-management/enter-product-attributes',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/product-management/enter-product-attributes/enter-product-attributes'
      ).then((m) => m.EnterProductAttributesComponent),
  },
  [RouteKey.PlaceProductQuarantine]: {
    path: '/product-management-functions/inventory-management/product-management/place-product-quarantine',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/place-product-quarantine/place-product-quarantine'
      ).then((m) => m.PlaceProductQuarantineComponent),
  },
  [RouteKey.InterdictedActiveStock]: {
    path: '/product-management-functions/inventory-management/product-management/interdicted-active-stock',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/product-management/interdicted-active-stock/interdicted-active-stock.component'
      ).then((m) => m.InterdictedActiveStockComponent),
  },
  [RouteKey.CommitReagentsForComponent]: {
    path: '/laboratory-functions/component-production/special-component-processing/commit-reagents-for-component',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/special-component-processing/commit-reagents-for-component/commit-reagents-for-component').then(
        (m) => m.CommitReagentsForComponentComponent
      ),
  },
  [RouteKey.ManageMatrixPheresis]: {
    path: '/laboratory-functions/manage-matrix-pheresis',
    loadComponent: () =>
      import('../../modules/laboratory-functions/manage-matrix-pheresis/components/manage-matrix-pheresis').then(
        (m) => m.ManageMatrixPheresisComponent
      ),
  },
  [RouteKey.ReleaseSpecialProcessing]: {
    path: '/laboratory-functions/component-production/release-special-processing',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/release-special-processing/release-special-processing.component'
      ).then((m) => m.ReleaseSpecialProcessingComponent),
  },
  [RouteKey.ReleaseComponentInterdiction]: {
    path: '/laboratory-functions/attributes-and-interdictions/release-component-interdiction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/release-component-interdiction/release-component-interdiction.component'
      ).then((m) => m.ReleaseComponentInterdictionComponent),
  },
  [RouteKey.ReleaseGroupInterdiction]: {
    path: '/laboratory-functions/attributes-and-interdictions/release-group-interdiction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/release-group-interdiction/release-group-interdiction.component'
      ).then((m) => m.ReleaseGroupInterdictionComponent),
    },
  [RouteKey.ReleaseComponentSystemInterdiction]: {
    path: '/laboratory-functions/attributes-and-interdictions/release-component-system-interdiction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/release-component-system-interdiction/release-component-system-interdiction'
      ).then((m) => m.ReleaseComponentSystemInterdictionComponent),
  },
  [RouteKey.ReleaseUnitSystemInterdiction]: {
    path: '/laboratory-functions/attributes-and-interdictions/release-unit-system-interdiction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/release-unit-system-interdiction/release-unit-system-interdiction.component'
      ).then((m) => m.ReleaseUnitSystemInterdictionComponent),
  },
  [RouteKey.UnitLevelQcForLabeling]: {
    path: '/laboratory-functions/labeling-functions/special-labeling-functions/unit-level-qc-for-labeling',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/special-labeling-functions/unit-level-qc-for-labeling/unit-level-qc-for-labeling'
      ).then((m) => m.UnitLevelQcForLabelingComponent),
  },
  [RouteKey.TrayDefinition]: {
    path: '/product-management-functions/inventory-management/product-locations/tray-definition',
    loadComponent: () =>
      import('../../modules/application-admin/product-locations/tray-definition/tray-definition').then(
        (m) => m.TrayDefinitionComponent
      ),
  },
  [RouteKey.VistaInterfaceStatus]: {
    path: '/apis-integration/vista-interface-status',
    loadComponent: () =>
      import('../../modules/APIsAndIntegration/vista-interface-status/components/vista-interface-status/vista-interface-status').then(
        (m) => m.VistaInterfaceStatusComponent,
      ),
  },
  [RouteKey.ComponentQuery]: {
    path: '/laboratory-functions/component-production/component-queries/component-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-queries/component-query/component-query'
      ).then((m) => m.ComponentQueryComponent),
  },
  [RouteKey.AllTestsForUnitQuery]: {
    path: '/laboratory-functions/testing-modules/testing-queries/testq',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/testing-queries/testq/testq'
      ).then((m) => m.TestqComponent),
  },
  [RouteKey.ProductsInQuarantine]: {
    path: '/product-management-functions/inventory-management/inventory-queries/quq',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-queries/quq/products-in-quarantine.component'
      ).then((m) => m.ProductsInQuarantineComponent),
  },
  [RouteKey.ProductsWithAntigens]: {
    path: '/product-management-functions/inventory-management/inventory-queries/products-with-antigens',
    loadComponent: () =>
      import('../../features/pagq/pagq.component').then((m) => m.PagqComponent),
  },
  [RouteKey.AutoDirProducts]: {
    path: '/laboratory-functions/component-production/component-queries/auto-dir-products',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-queries/auto-dir-products/auto-dir-products'
      ).then((m) => m.AutoDirProductsComponent),
  },
  [RouteKey.SpecialProcessingQuery]: {
    path: '/laboratory-functions/component-production/component-queries/special-processing-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-queries/special-processing-query/special-processing-query'
      ).then((m) => m.SpecialProcessingQueryComponent),
  },
  [RouteKey.IsbtAttributeLookup]: {
    path: '/laboratory-functions/component-production/component-queries/isbt-attribute-lookup',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-queries/isbt-attribute-lookup/isbt-attribute-lookup'
      ).then((m) => m.IsbtAttributeLookupComponent),
  },
  [RouteKey.PooledComponentQuery]: {
    path: '/laboratory-functions/component-production/component-queries/pooled-component-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/component-queries/pooled-component-query/pooled-component-query'
      ).then((m) => m.PooledComponentQueryComponent),
  },
  [RouteKey.NotesQuery]: {
    path: '/donor/noteq',
    loadComponent: () =>
      import('../../modules/donor/noteq/notes-query.component').then(
        (m) => m.NotesQueryComponent
      ),
  },
  [RouteKey.UpdateNumberOfBags]: {
    path: '/laboratory-functions/component-production/pheresis-processing/update-number-of-bags',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/pheresis-processing/update-number-of-bags/update-number-of-bags'
      ).then((m) => m.UpdateNumberOfBagsComponent),
  },
  [RouteKey.ConfirmatorySampleTransferOut]: {
    path: '/laboratory-functions/regional-sample-tracking/confirmatory-sample-transfer-out',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/regional-sample-tracking/confirmatory-sample-transfer-out/confirmatory-sample-transfer-out.component'
      ).then((m) => m.ConfirmatorySampleTransferOutComponent),
  },
  [RouteKey.AssignReagentsToTestBatch]: {
    path: '/laboratory-functions/testing-modules/manual-testing-functions/assign-reagents-to-test-batch',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/assign-reagents-to-test-batch/assign-reagents-to-test-batch'
      ).then((m) => m.AssignReagentsToTestBatch),
  },
  [RouteKey.ReExtractConfirmatoryTestResults]: {
    path: '/laboratory-functions/labeling-functions/special-labeling-functions/crxtract',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/special-labeling-functions/crxtract/re-extract-confirmatory-test-results'
      ).then((m) => m.ReExtractConfirmatoryTestResultsComponent),
  },
  [RouteKey.RemovalFromOutdateList]: {
    path: '/product-management-functions/inventory-management/odtoff',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/odtoff/odtoff'
      ).then((m) => m.Odtoff),
  },
  [RouteKey.ValidCollectionFacilities]: {
    path: '/laboratory-functions/lab-functions-components/collid',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/lab-functions-components/collid/valid-collection-facilities'
      ).then((m) => m.ValidCollectionFacilitiesComponent),
  },
  [RouteKey.ReagentKitNoPreQualification]: {
    path: '/laboratory-functions/testing-modules/reagent-qualification/reagent-kit-no-pre-qualification',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/reagent-qualification/reagent-kit-no-pre-qualification/reagent-kit-no-pre-qualification'
      ).then((m) => m.ReagentKitNoPreQualificationComponent),
  },
  [RouteKey.AboLabelingIsbtSuper]: {
    path: '/laboratory-functions/component-labeling/suplabli',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-labeling/suplabli/suplabli.component'
      ).then((m) => m.SuplabliComponent),
  },
  [RouteKey.AboLabelingAntigens]: {
    path: '/laboratory-functions/component-labeling/abo-labeling-antigens',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-labeling/abo-labeling-antigens/abo-labeling-antigens.component'
      ).then((m) => m.AboLabelingAntigensComponent),
  },
  [RouteKey.AboLabelingIsbt]: {
    path: '/laboratory-functions/component-labeling/abo-labeling-isbt',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-labeling/abo-labeling-isbt/abo-labeling-isbt.component'
      ).then((m) => m.AboLabelingIsbtComponent),
  },
  [RouteKey.ReprintLabels]: {
    path: '/laboratory-functions/reprint-labels',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/reprint-labels/reprint-labels.component'
      ).then((m) => m.ReprintLabelsComponent),
  },
  [RouteKey.ReleaseReturnedProductQuarantine]: {
    path: '/product-management-functions/internal-administration/rchkin',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/internal-administration/rchkin/release-returned-product-quarantine'
      ).then((m) => m.ReleaseReturnedProductQuarantine),
  },
  [RouteKey.EnterPheresisCount]: {
    path: '/laboratory-functions/component-production/pheresis-processing/enter-pheresis-count',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/pheresis-processing/enter-pheresis-count/enter-pheresis-count'
      ).then((m) => m.EnterPheresisCountComponent),
  },
  [RouteKey.InstrumentErrorLogQuery]: {
    path: '/laboratory-functions/instrument-error-log-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/instrument-error-log-query/instrument-error-log-query'
      ).then((m) => m.InstrumentErrorLogQuery),
  },
  [RouteKey.CustomerProductTierPricingQuery]: {
    path: '/product-management-functions/customer-&-internal-administration/customer-administration/customer-product-tier-pricing-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/intst/customer-product-tier-pricing-query').then(
        (m) => m.CustomerProductTierPricingQueryComponent,
      ),
  },
  [RouteKey.GenerateOutdatesPicklist]: {
    path: '/product-management-functions/inventory-management/product-management/generate-outdates-picklist',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/generate-outdates-picklist/generate-outdates-picklist'
      ).then((m) => m.GenerateOutdatesPicklist),
  },
  [RouteKey.MasterServiceCodes]: {
    path: '/application-administration/common-validation/master-service-codes',
    loadComponent: () =>
      import('../../features/fcode/fcode.component').then(
        (m) => m.FcodeComponent,
      ),
  },
  [RouteKey.EditTestResults]: {
    path: '/laboratory-functions/testing-modules/common-testing-functions/edit-test-results',
    loadComponent: () =>
      import('../../modules/laboratory-functions/edit-test-results/edit-test-results.component').then(
        (m) => m.EditTestResultsComponent,
      ),
  },
  [RouteKey.EditTestObservationResults]: {
    path: '/laboratory-functions/testing-modules/multiple-observation-testing/edit-test-observation-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/multiple-observation-testing/edit-test-observation-results/edit-test-observation-results'
      ).then((m) => m.EditTestObservationResultsComponent),
  },
  [RouteKey.PackProduct]: {
    path: '/product-management-functions/distribution-module/packing-functions/pack-products',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/distribution-module/packing-functions/pack-products/pack.component'
      ).then((m) => m.PackComponent),
  },
  [RouteKey.SkipConfirmatoryResultsForExtraction]: {
    path: '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions/skip-confirmatory-results-for-extraction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions/skip-confirmatory-results-for-extraction/skip-confirmatory-results-for-extraction'
      ).then((m) => m.SkipConfirmatoryResultsForExtractionComponent),
  },
  [RouteKey.ReleaseTestResults]: {
    path: '/laboratory-functions/release-test-results',
    loadComponent: () =>
      import('../../features/laboratory/release-test-results').then(
        (m) => m.ReleaseTestResultsComponent,
      ),
  },
  [RouteKey.EmergencyMedicalRelease]: {
    path: '/laboratory-functions/labeling-functions/common-labeling-functions/emergency-medical-release',
    loadComponent: () =>
      import('../../modules/laboratory-functions/labeling-functions/common-labeling-functions/emergency-medical-release/emergency-medical-release').then(
        (m) => m.EmergencyMedicalReleaseComponent,),
  },
  [RouteKey.MultipleObservationTestTypesByMfg]: {
    path: '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-types-by-mfg',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-types-by-mfg/multiple-observation-test-types-by-mfg.component'
      ).then((m) => m.MultipleObservationTestTypesByMfgComponent),
  },
  [RouteKey.AdditionalTestScheduling]: {
    path: '/laboratory-functions/additional-test-scheduling',
    loadComponent: () =>
      import('../../modules/laboratory-functions/additional-test-scheduling/additional-test-scheduling').then(
        (m) => m.AdditionalTestSchedulingComponent,
      ),
  },
  [RouteKey.AntigenResultEntry]: {
    path: '/laboratory-functions/antigen-result-entry',
    loadComponent: () =>
      import('../../features/ag/ag.component').then(
        (m) => m.AgComponent,
      ),
  },
  [RouteKey.SkipResultsFromExtraction]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/skip-results-from-extraction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/skip-results-from-extraction/skip-results-from-extraction'
      ).then((m) => m.SkipResultsFromExtractionComponent),
  },
  [RouteKey.Tparm]: {
    path: '/application-administration/lab-restricted/tparm',
    loadComponent: () =>
      import('../../modules/application-admin/valid-test-staging-parameters/tparm/tparm').then(
        (m) => m.TparmComponent,
      ),
  },
  [RouteKey.ExtractTestResults]: {
    path: '/laboratory-functions/regional-testing/extract-test-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/regional-testing/extract-test-results/extract-test-results'
      ).then((m) => m.ExtractTestResultsComponent),
  },
  [RouteKey.ReExtractTestResults]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/re-extract-test-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/rextract/rextract'
      ).then((m) => m.RextractComponent),
  },
  [RouteKey.TestResultReconciliation]: {
    path: '/laboratory-functions/test-result-reconciliation',
    loadComponent: () =>
      import('../../modules/laboratory-functions/test-result-reconciliation/test-result-reconciliation').then(
        (m) => m.TestResultReconciliation),
  },
  [RouteKey.EnterInterimResultCode]: {
    path: '/laboratory-functions/enter-interim-result-code',
    loadComponent: () =>
      import('../../features/laboratory/enter-interim-result-code/enter-interim-result-code.component').then(
        (m) => m.EnterInterimResultCodeComponent),
  },

  [RouteKey.ResetUnderExtract]: {
    path: '/laboratory-functions/component-production/undext',
    loadComponent: () =>
      import(
        '../../features/laboratory/undext/reset-under-extract.component'
      ).then((m) => m.ResetUnderExtractComponent),
  },

  [RouteKey.Eqc1]: {
    path: '/laboratory-functions/equipment-qc/eqc1',
    loadComponent: () =>
      import('../../modules/laboratory-functions/equipment-qc/eqc1/eqc1').then(
        (m) => m.Eqc1Component,
      ),
  },

  [RouteKey.BloodCenterInventoryLevelQuery]: {
    path: '/internal-administration/blood-center-inventory-level-query',
    loadComponent: () =>
      import(
        '../../modules/internal-administration/blood-center-inventory-level-query/blood-center-inventory-level-query'
      ).then((m) => m.BloodCenterInventoryLevelQuery),
  },
  [RouteKey.EnterEquipmentDowntime]: {
    path: '/laboratory-functions/enter-equipment-downtime',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/enter-equipment-downtime/enter-equipment-downtime'
      ).then((m) => m.EnterEquipmentDowntimeComponent),
  },
  [RouteKey.EnterEquipmentDetails]: {
    path: '/laboratory-functions/equipment-management/enter-equipment-details',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/equipment-management/enter-equipment-details/enter-equipment-details.component'
      ).then((m) => m.EnterEquipmentDetailsComponent),
  },
  [RouteKey.EnterEquipmentMasterCodes]: {
    path: '/laboratory-functions/equipment-management/enter-equipment-master-codes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/equipment-management/enter-equipment-master-codes/enter-equipment-master-codes'
      ).then((m) => m.EnterEquipmentMasterCodesComponent),
  },
  [RouteKey.LookupAndPrintDonorCard]: {
    path: '/donor-functions/general-queries-and-functions/lookup-and-print-donor-card',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/general-queries-and-functions/lookup-and-print-donor-card/lookup-and-print-donor-card'
      ).then((m) => m.LookupAndPrintDonorCardComponent),
  },
  [RouteKey.ConvertComponentIntoSpikedBag]: {
    path: '/laboratory-functions/component-production/special-component-processing/convert-component-into-spiked-bag',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/special-component-processing/convert-component-into-spiked-bag/convert-component-into-spiked-bag'
      ).then((m) => m.ConvertComponentIntoSpikedBagComponent),
  },
  [RouteKey.ChangeInventoryClass]: {
    path: '/product-management-functions/inventory-management/product-management/change-inventory-class',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/product-management/change-inventory-class/change-inventory-class'
      ).then((m) => m.ChangeInventoryClassComponent),
  },
  [RouteKey.ModifyComponentWeight]: {
    path: '/laboratory-functions/component-production/routine-component-production/modify-component-weight',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/routine-component-production/modify-component-weight/modify-component-weight'
      ).then((m) => m.ModifyComponentWeightComponent),
  },
  // Mnemonic: SPCQ, .fmb: TSQCNTRL
  [RouteKey.PlateControlsQuery]: {
    path: '/laboratory-functions/testing-modules/testing-queries/plate-controls-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/testing-queries/plate-controls-query/plate-controls-query'
      ).then((m) => m.PlateControlsQueryComponent),
  },
  // Mnemonic: UTQ, fcnId: 4442 - Unscheduled Test Query
  [RouteKey.UnscheduledTestQuery]: {
    path: '/laboratory-functions/testing-modules/testing-queries/unscheduled-test-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/testing-queries/unscheduled-test-query/unscheduled-test-query'
      ).then((m) => m.UnscheduledTestQueryComponent),
  },
  // Mnemonic: IULQ, fcnId: 8461 - Instrument Upload Log Query
  [RouteKey.InstrumentUploadLogQuery]: {
    path: '/laboratory-functions/testing-modules/testing-queries/instrument-upload-log-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/testing-queries/instrument-upload-log-query/instrument-upload-log-query'
      ).then((m) => m.InstrumentUploadLogQueryComponent),
  },
  // Mnemonic: HOLDQ, fcnId: 4327 - Test Batches in Holding Area Query
  [RouteKey.TestBatchesInHoldingAreaQuery]: {
    path: '/laboratory-functions/testing-modules/testing-queries/test-batches-in-holding-area-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/testing-queries/test-batches-in-holding-area-query/test-batches-in-holding-area-query'
      ).then((m) => m.TestBatchesInHoldingAreaQueryComponent),
  },
  [RouteKey.HorizontalTestFileTestMapping]: {
    path: '/laboratory-functions/testing/testing-administration/horizontal-test-file-test-mapping',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing/testing-administration/horizontal-test-file-test-mapping/horizontal-test-file-test-mapping'
      ).then((m) => m.HorizontalTestFileTestMappingComponent),
  },
  // Mnemonic: LBLOVRQ, .fmb: CPQLBOVD
  [RouteKey.AboLabelOverrideQuery]: {
    path: '/laboratory-functions/labeling-functions/labeling-queries/abo-label-override-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/labeling-queries/abo-label-override-query/abo-label-override-query'
      ).then((m) => m.AboLabelOverrideQueryComponent),
  },
  [RouteKey.LinkTestResults]: {
    path: '/laboratory-functions/labeling-functions/special-labeling-functions/link-test-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/link-test-results/link-test-results'
      ).then((m) => m.LinkTestResultsComponent),
  },
  [RouteKey.InvestigateDuplicateDonorRecords]: {
    path: '/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/donor-profile/donor-profile-maintenance/investigate-duplicate-donor-records/investigate-duplicate-donor-records'
      ).then((m) => m.InvestigateDuplicateDonorRecords),
  },
  [RouteKey.CustomerProfile]: {
    path: '/product-management-functions/customer-&-internal-administration/customer-administration/create-customer-profile',
    loadComponent: () =>
      import('../../modules/product-management-functions/customer-administration/customer-profile/customer-profile-list/customer-profile-list').then(
        (m) => m.CustomerProfileListComponent,
      ),
  },
  [RouteKey.CustomerProfileDetails]: {
    path: '/product-management-functions/customer-&-internal-administration/customer-administration/create-customer-profile/:customerId',
    loadComponent: () =>
      import('../../modules/product-management-functions/customer-administration/customer-profile/customer-profile-details/customer-profile-details').then(
        (m) => m.CustomerProfileDetailsComponent,
      ),
  },
  [RouteKey.AddCustomerProfile]: {
    path: '/product-management-functions/customer-&-internal-administration/customer-administration/create-customer-profile/add',
    loadComponent: () =>
      import('../../modules/product-management-functions/customer-administration/customer-profile/add-customer-wizard/add-customer-wizard').then(
        (m) => m.AddCustomerWizardComponent,
      ),
  },
  [RouteKey.EntryOfflineCryoDetails]: {
    path: '/laboratory-functions/component-production/cryo-production/entry-offline-cryo-details',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/cryo-production/entry-offline-cryo-details/entry-offline-cryo-details').then(
        (m) => m.EntryOfflineCryoDetailsComponent,
      ),
  },
  [RouteKey.TestSeriesConfiguration]: {
    path: '/laboratory-functions/test-series-configuration',
    loadComponent: () =>
      import('../../modules/laboratory-functions/test-series-configuration/test-series-configuration.component').then(
        (m) => m.TestSeriesConfigurationComponent,
      ),
  },
  [RouteKey.ModifyCryoDetails]: {
    path: '/laboratory-functions/component-production/cryo-production/modify-cryo-details',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/cryo-production/modify-cryo-details/modify-cryo-details.component').then(
        (m) => m.ModifyCryoDetailsComponent,
      ),
  },
  [RouteKey.DeleteUnitsFromCryoWorksheet]: {
    path: '/laboratory-functions/component-production/cryo-production/delete-units-from-cryo-worksheet',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/cryo-production/delete-units-from-cryo-worksheet/delete-units-from-cryo-worksheet').then(
        (m) => m.DeleteUnitsFromCryoWorksheetComponent,
      ),
  },
  [RouteKey.ScanUnitsForCryoProcessing]: {
    path: '/laboratory-functions/component-production/cryo-production/scan-units-for-cryo-processing',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/cryo-production/scan-units-for-cryo-processing/scan-units-for-cryo-processing').then(
        (m) => m.ScanUnitsForCryoProcessingComponent,
      ),
  },
  [RouteKey.CryoResultsQuery]: {
    path: '/laboratory-functions/component-production/component-queries/cryo-results',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/component-queries/cryo-results/cryo-results').then(
        (m) => m.CryoResultsComponent,
      ),
  },
  [RouteKey.MaintainValidEquipmentQcData]: {
    path: '/laboratory-functions/maintain-valid-equipment-qc-data',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/maintain-valid-equipment-qc-data/maintain-valid-equipment-qc-data.component'
      ).then((m) => m.MaintainValidEquipmentQcDataComponent),
  },
  [RouteKey.QcHistoryQuery]: {
    path: '/laboratory-functions/qc-history-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/qc-history-query/qc-history-query'
      ).then((m) => m.QcHistoryQueryComponent),
  },
  // Mnemonic: CHLBP, FMB: ASGLBLPT - Change Label Printer
  [RouteKey.ChangeLabelPrinter]: {
    path: '/laboratory-functions/labeling-functions/common-labeling-functions/change-label-printer',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/common-labeling-functions/change-label-printer/change-label-printer'
      ).then((m) => m.ChangeLabelPrinterComponent),
  },
  // Mnemonic: CDISBT, FMB: LAICDISB
  [RouteKey.ReLabelCodabarUnitsToIsbtSchema]: {
    path: '/laboratory-functions/labeling-functions/common-labeling-functions/re-label-codabar-units-to-isbt-schema',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/common-labeling-functions/re-label-codabar-isbt/re-label-codabar-isbt'
      ).then((m) => m.ReLabelCodabarIsbtComponent),
  },
  [RouteKey.ReagentQuery]: {
    path: '/laboratory-functions/testing-modules/reagent-qualification/reagent-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/reagent-qualification/reagent-query/reagent-query'
      ).then((m) => m.ReagentQueryComponent),
  },
  [RouteKey.EnterReagentsIntoRepository]: {
    path: '/laboratory-functions/testing-modules/reagent-qualification/enter-reagents-into-repository',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/reagent-qualification/enter-reagents-into-repository/enter-reagents-into-repository'
      ).then((m) => m.EnterReagentsIntoRepositoryComponent),
  },
  [RouteKey.ValidReagentSupplierCodes]: {
    path: '/laboratory-functions/testing-modules/reagent-qualification/valid-reagent-supplier-codes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/reagent-qualification/valid-reagent-supplier-codes/valid-reagent-supplier-codes'
      ).then((m) => m.ValidReagentSupplierCodesComponent),
  },
  [RouteKey.ValidReagentCodes]: {
    path: '/laboratory-functions/testing-modules/reagent-qualification/valid-reagent-codes',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/reagent-qualification/valid-reagent-codes/valid-reagent-codes'
      ).then((m) => m.ValidReagentCodesComponent),
  },
  [RouteKey.PlaceGroupInterdiction]: {
    path: '/laboratory-functions/place-group-interdiction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/place-group-interdiction/place-group-interdiction'
      ).then((m) => m.PlaceGroupInterdiction),
  },
  // Place/Release Multiple Unit Interdiction - Laboratory Functions => Attributes and Interdictions
  // Mnemonic: UNTINT2
  // JIRA: MLT-13197
  [RouteKey.PlaceReleaseMultipleUnitInterdiction]: {
    path: '/laboratory-functions/attributes-and-interdictions/place-release-multiple-unit-interdiction',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/attributes-and-interdictions/place-release-multiple-unit-interdiction/place-release-multiple-unit-interdiction'
      ).then((m) => m.PlaceReleaseMultipleUnitInterdiction),
  },
  // Edit or Reconcile QC Details - Laboratory Functions => Equipment Management => Equipment Supervisory Functions
  // Mnemonic: EQSUPQC, FMB: EQIQCSUP
  [RouteKey.EditReconcileQcDetails]: {
    path: '/laboratory-functions/equipment-management/equipment-supervisory-functions/edit-reconcile-qc-details',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/equipment-management/equipment-supervisory-functions/edit-reconcile-qc-details/edit-reconcile-qc-details'
      ).then((m) => m.EditReconcileQcDetailsComponent),
  },
  // Status and History Query - Laboratory Functions => Equipment Management => Equipment Queries
  // Mnemonic: EQSTATQ, FMB: EQQEQSTS
  [RouteKey.EquipmentStatusAndHistoryQuery]: {
    path: '/laboratory-functions/equipment-management/equipment-queries/status-and-history-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/equipment-management/equipment-queries/status-and-history-query/status-and-history-query'
      ).then((m) => m.StatusAndHistoryQueryComponent),
  },
  [RouteKey.ServiceHistoryQuery]: {
    path: '/laboratory-functions/equipment-management/equipment-queries/service-history-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/equipment-management/equipment-queries/service-history-query/service-history-query'
      ).then((m) => m.ServiceHistoryQueryComponent),
  },
  [RouteKey.DowntimeHistoryQuery]: {
    path: '/laboratory-functions/equipment-management/equipment-queries/downtime-history-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/equipment-management/equipment-queries/downtime-history-query/downtime-history-query'
      ).then((m) => m.DowntimeHistoryQueryComponent),
  },
  [RouteKey.FreezeStartTime]: {
    path: '/laboratory-functions/component-production/freeze-start-time',
    loadComponent: () =>
      import('../../modules/laboratory-functions/component-production/freeze-start-time/freeze-start-time').then(
        (m) => m.FreezeStartTimeComponent,
      ),
  },
  [RouteKey.ModifyFreezeStartTime]: {
    path: '/laboratory-functions/component-production/routine-component-production/modify-freeze-start-time',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/component-production/routine-component-production/modify-freeze-start-time/modify-freeze-start-time'
      ).then((m) => m.ModifyFreezeStartTimeComponent),
  },
  [RouteKey.ResultsObservationsQuery]: {
    path: '/laboratory-functions/testing-modules/multiple-observation-testing/results-observations-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/multiple-observation-testing/results-observations-query/results-observations-query.component'
      ).then((m) => m.ResultsObservationsQueryComponent),
  },
  [RouteKey.VerifyTestObservationsTech2]: {
    path: '/laboratory-functions/verify-test-observations-tech2',
    loadComponent: () =>
      import('../../modules/laboratory-functions/verify-test-observations-tech2/verify-test-observations-tech2').then(
        (m) => m.VerifyTestObservationsTech2Component,
      ),
  },
  [RouteKey.EnterRegularOrder]: {
    path: '/product-management-functions/order-management/enter-regular-order',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-management/enter-regular-order/enter-regular-order'
      ).then((m) => m.EnterRegularOrderComponent),
  },
  [RouteKey.EnterSpecialOrder]: {
    path: '/product-management-functions/order-management/enter-special-order',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-management/enter-special-order/enter-special-order'
      ).then((m) => m.EnterSpecialOrderComponent),
  },
  [RouteKey.EnterExportOrder]: {
    path: '/product-management-functions/order-management/enter-export-order',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-management/enter-export-order/enter-export-order'
      ).then((m) => m.EnterExportOrderComponent),
  },
  [RouteKey.ChangeOrCancelOrder]: {
    path: '/product-management-functions/order-module/order-maintenance/change-or-cancel-order',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-management/change-cancel-order/change-cancel-order'
      ).then((m) => m.ChangeCancelOrderComponent),
  },
  [RouteKey.WarehouseCheckIn]: {
    path: '/product-management-functions/inventory-management/warehouse-checkin',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/warehouse-checkin/warehouse-checkin'
      ).then((m) => m.WarehouseCheckIn),
  },
  [RouteKey.SampleTransferIn]: {
    path: '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions/sample-transfer-in',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions/sample-transfer-in/sample-transfer-in'
      ).then((m) => m.SampleTransferInComponent),
    },
  [RouteKey.WarehouseCheckOut]: {
    path: '/product-management-functions/inventory-management/warehouse-check-out',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/warehouse-check-out/warehouse-check-out'
      ).then((m) => m.WarehouseCheckOut),
  },
  [RouteKey.InternalContract]: {
    path: '/laboratory-functions/testing-modules/testing-administration/internal-contract',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing/testing-administration/internal-contract/internal-contract.component'
      ).then((m) => m.InternalContractComponent),
  },
  [RouteKey.PlaceNotesOnMultipleUnits]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/place-notes-on-multiple-units',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/place-notes-on-multiple-units/place-notes-on-multiple-units'
      ).then((m) => m.PlaceNotesOnMultipleUnitsComponent),
  },
  [RouteKey.SampleTransferOutNotCheckedInQuery]: {
    path: '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-queries/sample-transfer-out-not-checked-in-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-queries/sample-transfer-out-not-checked-in-query/sample-transfer-out-not-checked-in-query'
      ).then((m) => m.SampleTransferOutNotCheckedInQueryComponent),
  },
  [RouteKey.SamplesQuery]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/samples-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/samples-query/samples-query'
      ).then((m) => m.SamplesQueryComponent),
  },
  [RouteKey.MissingTubesQuery]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/missing-tubes-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/missing-tubes-query/missing-tubes-query'
      ).then((m) => m.MissingTubesQueryComponent),
  },
  [RouteKey.BatchInProgressQuery]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query/batch-in-progress-query'
      ).then((m) => m.BatchInProgressQueryComponent),
  },
  [RouteKey.TubesCheckinQuery]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/tubes-checkin-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/tubes-checkin-query/tubes-checkin-query'
      ).then((m) => m.TubesCheckinQueryComponent),
  },
  [RouteKey.ChangeTestingUnitCollectionDate]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/regional-sample-mgmt-supervisory/change-testing-unit-collection-date',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/regional-sample-mgmt-supervisory/change-testing-unit-collection-date/change-testing-unit-collection-date'
      ).then((m) => m.ChangeTestingUnitCollectionDateComponent),
  },
  [RouteKey.ResetExtractForParmBatchSample]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/regional-sample-mgmt-supervisory/reset-extract-for-parm-batch-sample',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/regional-sample-mgmt-supervisory/reset-extract-for-parm-batch-sample/reset-extract-for-parm-batch-sample'
      ).then((m) => m.ResetExtractForParmBatchSampleComponent),
  },
  [RouteKey.DeleteRegionalSampleCheckinBatch]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/regional-sample-mgmt-supervisory/delete-regional-sample',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-functions/regional-sample-mgmt-supervisory/delete-regional-sample/delete-regional-sample'
      ).then((m) => m.DeleteRegionalSampleComponent),
  },
  [RouteKey.EnterTestsMapping]: {
    path: '/laboratory-functions/testing/testing-administration/enter-tests-mapping',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing/testing-administration/enter-tests-mapping/enter-tests-mapping'
      ).then((m) => m.EnterTestsMappingComponent),
  },
  [RouteKey.UnitAndProductHistory]: {
    path: '/product-management-functions/inventory-management/inventory-queries/unit-and-product-history',
    loadComponent: () =>
      import('../../modules/inventory-management/unit-and-product-history/unit-and-product-history').then(
        (m) => m.UnitAndProductHistory,
      ),
  },
  // Mnemonic: LBLRSH, FMB: LAIRESCH
  [RouteKey.ResearchProductLabeling]: {
    path: '/laboratory-functions/labeling-functions/special-labeling-functions/research-product-labeling',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/labeling-functions/research-product-labeling/research-product-labeling.component'
      ).then((m) => m.ResearchProductLabelingComponent),
  },
  [RouteKey.AvailableProductsQuery]: {
    path: '/distribution/inventory-management/inventory-queries/available-products-query',
    loadComponent: () =>
      import('../../modules/distribution/inventory-management/inventory-queries/available-products-query/available-products-query').then(
        (m) => m.AvailableProductsQuery,
      ),
  },
  [RouteKey.OfflineProductPacking]: {
    path: '/distribution/offline-product-packing',
    loadComponent: () =>
      import('../../modules/distribution/offline-product-packing/offline-product-packing').then(
        (m) => m.OfflineProductPackingComponent,
      ),
  },
  [RouteKey.RestockUnshippedProducts]: {
    path: '/product-management-functions/inventory-management/restock-unshipped-products',
    loadComponent: () =>
      import('../../modules/product-management-functions/inventory-management/restock-unshipped-products/restock-unshipped-products').then(
        (m) => m.RestockUnshippedProducts,
    ),
  },
  [RouteKey.EnterRegionalTestingContract]: {
    path: '/laboratory-functions/regional-testing-contract/enter-regional-testing-contract',
    loadComponent: () =>
      import('../../modules/laboratory-functions/regional-testing-contract/rgcon/rgcon').then(
        (m) => m.EnterRegionalTestingContractComponent,
      ),
  },
  [RouteKey.SupplierQuery]: {
    path: '/laboratory-functions/testing-modules/reagent-qualification/supplier-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/testing-modules/reagent-qualification/supplier-query/supplier-query.component').then(
        (m) => m.SupplierQueryComponent,
      ),
  },
  [RouteKey.StandingOrdersQuery]: {
    path: '/product-management-functions/order-module/order-queries/standing-orders-query',
    loadComponent: () =>
      import('../../modules/product-management-functions/order-queries/standing-orders-query/standing-orders-query').then(
        (m) => m.StandingOrdersQueryComponent,
      ),
  },
  [RouteKey.FinanceInterfaceDetails]: {
    path: '/product-management-functions/order-module/order-queries/finance-interface-details',
    loadComponent: () =>
      import('../../modules/product-management-functions/order-queries/finance-interface-details/finance-interface-details').then(
        (m) => m.FinanceInterfaceDetailsComponent,
      ),
  },
  [RouteKey.OrderHistorySingleOrder]: {
    path: '/product-management-functions/order-module/order-queries/order-history---single-order',
    loadComponent: () =>
      import('../../modules/product-management-functions/order-queries/order-history-single-order/order-history-single-order').then(
        (m) => m.OrderHistorySingleOrderComponent,
      ),
  },
  [RouteKey.AnyLotNumberQuery]: {
    path: '/laboratory-functions/general-query-functions/any-lot-number-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/general-query-functions/any-lot-number-query/any-lot-number-query').then(
        (m) => m.AnyLotNumberQueryComponent,
      ),
  },
  [RouteKey.VoidedTestsBatchQuery]: {
    path: '/laboratory-functions/voided-tests-batch-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/voided-tests-batch-query/voided-tests-batch-query'
      ).then((m) => m.VoidedTestsBatchQueryComponent),
  },
  [RouteKey.FirstTechTestResult]: {
    path: '/laboratory-functions/testing-modules/manual-testing-functions/first-tech-test-result',
    loadComponent: () =>
      import('../../modules/laboratory-functions/testing-modules/manual-testing-functions/first-tech-test-result/first-tech-test-result').then(
        (m) => m.FirstTechTestResultComponent,
      ),
  },
  [RouteKey.SecondTechTestResultVerification]: {
    path: '/laboratory-functions/testing-modules/manual-testing-functions/second-tech-test-result-verification',
    loadComponent: () =>
      import('../../modules/laboratory-functions/testing-modules/manual-testing-functions/second-tech-test-result-verification/second-tech-test-result-verification').then(
        (m) => m.SecondTechTestResultVerificationComponent,
      ),
  },
  [RouteKey.UnitQuery]: {
    path: '/laboratory-functions/unit-query',
    loadComponent: () =>
      import('../../modules/laboratory-functions/unit-query/unit-query.component').then(
        (m) => m.UnitQueryComponent,
      ),
  },
  [RouteKey.UnitInformation]: {
    path: '/laboratory-functions/unit-information',
    loadComponent: () =>
      import('../../modules/laboratory-functions/unit-query/unit-query.component').then(
        (m) => m.UnitQueryComponent,
      ),
  },
  [RouteKey.MaintainBatchData]: {
    path: '/laboratory-functions/maintain-batch-data',
    loadComponent: () =>
      import('../../modules/laboratory-functions/maintain-batch-data/maintain-batch-data').then(
        (m) => m.MaintainBatchDataComponent,
      ),
  },
  [RouteKey.OrderChargesByOrderNo]: {
    path: '/distribution/order-charges-by-order-no',
    loadComponent: () =>
      import('../../modules/distribution/order-charges-by-order-no/order-charges-by-order-no').then(
        (m) => m.OrderChargesByOrderNoComponent,
      ),
  },
  [RouteKey.OrderDetails]: {
    path: '/distribution/order-charges-by-order-no/order-details/:orderNo',
    loadComponent: () =>
      import('../../modules/distribution/order-charges-by-order-no/order-details-page/order-details-page').then(
        (m) => m.OrderDetailsPageComponent,
      ),
  },
  [RouteKey.ScheduleAutoDirectedOrder]: {
    path: '/distribution/schedule-auto-directed-order',
    loadComponent: () =>
      import(
        '../../modules/distribution/schedule-auto-directed-order/schedule-auto-directed-order'
      ).then((m) => m.ScheduleAutoDirectedOrderComponent),
  },
  [RouteKey.EnterStandingOrder]: {
    path: '/distribution/enter-standing-order',
    loadComponent: () =>
      import('../../modules/distribution/enter-standing-order/components/standing-order-list/standing-order-list').then(
        (m) => m.StandingOrderListComponent,
      ),
  },
  [RouteKey.CancelTestBatch]: {
    path: '/laboratory-functions/testing-modules/common-testing-functions/cancel-test-batch-(in-holding-area)',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/common-testing-functions/cancel-test-batch/cancel-test-batch'
      ).then((m) => m.CancelTestBatchComponent),
  },
  [RouteKey.VoidCancelTestResults]: {
    path: '/laboratory-functions/testing-modules/common-testing-functions/void-cancel-test-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/common-testing-functions/void-cancel-test-results/void-cancel-test-results'
      ).then((m) => m.VoidCancelTestResultsComponent),
  },
  [RouteKey.OrderProcessingStatus]: {
    path: '/product-management-functions/order-management/order-processing-status',
    loadComponent: () =>
      import('../../modules/product-management-functions/order-management/order-processing-status/order-processing-status').then(
        (m) => m.OrderProcessingStatusComponent,
      ),
  },
  [RouteKey.ContractProfileTestQuery]: {
    path: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/contract-profile-test-query',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/contract-profile-test-query/contract-profile-test-query'
      ).then((m) => m.ContractProfileTestQuery),
  },
  [RouteKey.ShipmentsInTransit]: {
    path: '/product-management-functions/distribution-module/distribution-queries/shipments-in-transit',
    loadComponent: () =>
      import(
        '../../modules/distribution/distribution-module/distribution-queries/shipments-in-transit/shipments-in-transit'
      ).then((m) => m.ShipmentsInTransitComponent),
  },
  // Close Box (CLBOX) - Distribution
  [RouteKey.CloseBox]: {
    path: '/distribution/close-box',
    loadComponent: () =>
      import('../../modules/distribution/close-box/close-box').then(
        (m) => m.CloseBoxComponent,
      ),
  },
  // Box Details Query (BOXDTQ) - Distribution Module => Distribution Queries
  [RouteKey.BoxDetails]: {
    path: '/distribution/box-details',
    loadComponent: () =>
      import('../../modules/distribution/box-details/box-management/box-management').then(
        (m) => m.BoxManagementComponent,
      ),
    },
  [RouteKey.XmlErrorLogFile]: {
    path: '/product-management-functions/distribution-module/shipping-functions/xml-error-log-file',
    loadComponent: () =>
      import(
        '../../modules/distribution/distribution-module/shipping-functions/xml-error-log-file/xml-error-log-file'
      ).then((m) => m.XmlErrorLogFileComponent),
  },
  [RouteKey.DeliveryConfirmation]: {
    path: '/product-management-functions/distribution-module/shipping-functions/delivery-confirmation',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/internal-administration/delivery-confirmation/delivery-confirmation'
      ).then((m) => m.DeliveryConfirmation),
  },
  [RouteKey.SpecialOrderAllocation]: {
    path: '/product-management-functions/inventory-management/special-order-allocation',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/special-order-allocation/special-order-allocation'
      ).then((m) => m.SpecialOrderAllocation)
  },
  [RouteKey.MatchingProductsFound]: {
    path: '/product-management-functions/inventory-management/special-order-allocation/matching-products',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/inventory-management/special-order-allocation/matching-products/matching-products'
      ).then((m) => m.MatchingProducts)
  },
  [RouteKey.DeliveredShipments]: {
    path: '/distribution/delivered-shipments',
    loadComponent: () =>
      import(
        '../../modules/distribution/delivered-shipments/delivered-shipments'
      ).then((m) => m.DeliveredShipmentsComponent),
  },
  [RouteKey.EnterControlValues]: {
    path: '/donor-functions/enter-control-values',
    loadComponent: () =>
      import(
        '../../modules/donor-functions/enter-control-values/enter-control-values'
      ).then((m) => m.EnterControlValuesComponent),
  },
  [RouteKey.ModifyUnit]: {
    path: '/laboratory-functions/modify-unit',
    loadComponent: () =>
      import('../../modules/laboratory-functions/modify-unit/modify-unit').then(
        (m) => m.ModifyUnitComponent
      ),
  },
  [RouteKey.AdHocTubeCheckIn]: {
    path: '/laboratory-functions/sample-management/hospital-patient-testing-functions/ad-hoc-tube-check-in',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/hospital-patient-testing-functions/ad-hoc-tube-check-in/ad-hoc-tube-check-in'
      ).then((m) => m.AdHocTubeCheckInComponent),
  },
  [RouteKey.ShipmentsByShipDate]: {
    path: '/product-management-functions/distribution-module/distribution-queries/shipments-by-ship-date',
    loadComponent: () =>
      import(
        '../../modules/distribution/distribution-module/distribution-queries/shipments-by-ship-date/shipments-by-ship-date'
      ).then((m) => m.ShipmentsByShipDateComponent),
  },
  [RouteKey.EnterNtResults]: {
    path: '/laboratory-functions/testing-modules/common-testing-functions/enter-nt-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/common-testing-functions/enter-nt-results/enter-nt-results'
      ).then((m) => m.EnterNtResultsComponent),
  },
  [RouteKey.ShipProducts]: {
    path: '/distribution/ship-products',
    loadComponent: () =>
      import(
        '../../modules/distribution/ship-products/ship-products'
      ).then((m) => m.ShipProductsComponent),
  },
  [RouteKey.ShipDiscardSalvage]: {
    path: '/distribution/ship-discard-salvage',
    loadComponent: () =>
      import(
        '../../modules/distribution/ship-discard-salvage/ship-discard-salvage'
      ).then((m) => m.ShipDiscardSalvageComponent),
  },
  [RouteKey.CancelUnfilledOrders]: {
    path: '/distribution/cancel-unfilled-orders',
    loadComponent: () =>
      import('../../modules/distribution/cancel-unfilled-orders/cancel-unfilled-orders').then(
        (m) => m.CancelUnfilledOrdersComponent,
      ),
  },
  [RouteKey.EnterOrderCharges]: {
    path: '/product-management-functions/order-module/order-maintenance/enter-order-charges',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-module/order-maintenance/enter-order-charges/enter-order-charges'
      ).then((m) => m.EnterOrderChargesComponent),
  },
  [RouteKey.InitiateHospitalTransfer]: {
    path: '/product-management-functions/order-module/transfer-orders/initiate-hospital-transfer',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-module/transfer-orders/initiate-hospital-transfer/initiate-hospital-transfer'
      ).then((m) => m.InitiateHospitalTransferComponent),
  },
  [RouteKey.CloseHospitalTransfer]: {
    path: '/product-management-functions/order-module/transfer-orders/close-hospital-transfer',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/order-module/transfer-orders/close-hospital-transfer/close-hospital-transfer'
      ).then((m) => m.CloseHospitalTransferComponent),
  },
  [RouteKey.MultipleObservationReconciliation]: {
    path: '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-reconciliation',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-reconciliation/multiple-observation-reconciliation'
      ).then((m) => m.MultipleObservationReconciliationComponent),
  },
  [RouteKey.CreateTestBatchWorksheet]: {
    path: '/laboratory-functions/create-test-batch-worksheet',
    loadComponent: () =>
      import(
        '../../modules/create-test-batch/create-test-batch.component'
      ).then((m) => m.CreateTestBatchComponent),
  },
  [RouteKey.TestStagingParameters]: {
    path: '/laboratory-functions/testing-modules/test-staging-parameters',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/testing-modules/test-staging-parameters/tstparm/tstparm.component'
      ).then((m) => m.TstparmComponent),
  },
  [RouteKey.PackInvRejectsToDiscard]: {
    path: '/product-management-functions/distribution-module/packing-functions/packod',
    loadComponent: () =>
      import(
        '../../modules/product-management-functions/distribution-module/packing-functions/packod/packod'
      ).then((m) => m.PackodComponent),
  },
  [RouteKey.TestServiceCheckIn]: {
    path: '/laboratory-functions/test-service-check-in',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/test-service-check-in/test-service-check-in.component'
      ).then((m) => m.TestServiceCheckInComponent),
  },
  [RouteKey.ConfirmatoryExtractTestResults]: {
    path: '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions/confirmatory-extract-test-results',
    loadComponent: () =>
      import(
        '../../modules/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions/confirmatory-extract-test-results/confirmatory-extract-test-results.component'
      ).then((m) => m.ConfirmatoryExtractTestResultsComponent),
  },
};
