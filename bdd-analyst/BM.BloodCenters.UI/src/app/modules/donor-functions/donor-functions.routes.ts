import { Routes } from '@angular/router';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';
import { performVisualAuditGuard } from './registration/registration-general-functions/perform-visual-audit/perform-visual-audit.guard';
import { registerDeferralGuard } from './registration/registration-general-functions/register-deferral/register-deferral.guard';


const maintainSpecialInstructionsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainSpecialInstructions].path,
  '/donor-functions',
);
const donorRegistrationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorRegistration].path,
  '/donor-functions',
);
const donorHistoryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorHistory].path,
  '/donor-functions',
);
const donationDetailsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonationDetails].path,
  '/donor-functions',
);
const auditDonationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AuditDonation].path,
  '/donor-functions',
);
const donationDeferralAuditDrawerPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonationDeferralAuditDrawer].path,
  '/donor-functions',
);
const healthHistoryTemplatePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.HealthHistoryTemplate].path,
  '/donor-functions',
);
const defineDefaultDriveChecklistPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineDefaultDriveChecklist].path,
  '/donor-functions',
);
const defineDriveCategoryRulesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineDriveCategoryRules].path,
  '/donor-functions',
);
const defineResourceMasterListPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineResourceMasterList].path,
  '/donor-functions',
);
const monthlyCollectionGoalsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MonthlyCollectionGoalsQuery].path,
  '/donor-functions',
);
const resourceStatusQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ResourceStatusQuery].path,
  '/donor-functions',
);
const parentSponsorQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ParentSponsorQuery].path,
  '/donor-functions',
);
const drawQueryPath = removePathPrefix(ROUTE_REGISTRY[RouteKey.DrawQuery].path, '/donor-functions');
const multipleDriveSelectionQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MultipleDriveSelectionQuery].path,
  '/donor-functions',
);
const drivesBySponsorQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DrivesBySponsorQuery].path,
  '/donor-functions',
);
const mergeDuplicateSponsorsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MergeDuplicateSponsors].path,
  '/donor-functions',
);
const mergeDuplicateDonorsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MergeDuplicateDonors].path,
  '/donor-functions',
);
const createOrModifySpecialDrivePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CreateOrModifySpecialDrive].path,
  '/donor-functions',
);
const createOrModifySpecialDriveDcmPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CreateOrModifySpecialDriveDcm].path,
  '/donor-functions',
);
const manageSpecialDrivePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ManageSpecialDrive].path,
  '/donor-functions',
);
const cancelFixedSpecialDrivesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CancelFixedSpecialDrives].path,
  '/donor-functions',
);
const createDriveFromTemporaryDrivePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CreateDriveFromTemporaryDrive].path,
  '/donor-functions',
);
const setDriveDateAndIdPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SetDriveDateAndId].path,
  '/donor-functions',
);
const resourceAvailabilityRulesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ResourceAvailabilityRules].path,
  '/donor-functions',
);
const driveSheetPrintStatusPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DriveSheetPrintStatus].path,
  '/donor-functions',
);

const collectionGoalsByDateQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CollectionGoalsByDateQuery].path,
  '/donor-functions',
);
const collectionStatisticsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CollectionStatistics].path,
  '/donor-functions',
);
const territoryManagementPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.TerritoryManagement].path,
  '/donor-functions',
);
const alternateDemographicsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AlternateDemographics].path,
  '/donor-functions',
);
const internationalAddressPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.InternationalAddress].path,
  '/donor-functions',
);
const aboSpreadByDrivePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AboSpreadByDrive].path,
  '/donor-functions',
);
const aboSpreadBySponsorPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AboSpreadBySponsor].path,
  '/donor-functions',
);
const maintainSponsorContactsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainSponsorContacts].path,
  '/donor-functions',
);
const abbreviatedQuestionnaireSetupPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AbbreviatedQuestionnaireSetup].path,
  '/donor-functions',
);

const viewSponsorContactsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ViewSponsorContacts].path,
  '/donor-functions',
);

const physicalFindingsTemplatePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PhysicalFindingsTemplate].path,
  '/donor-functions',
);

const addPhysicalFindingsTemplatePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AddPhysicalFindingsTemplate].path,
  '/donor-functions',
);

const driveDetailsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DriveDetailsQuery].path,
  '/donor-functions',
);

const donorSurveyManagerPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
  "/donor-functions",
);

const donorRbcAgQueryEntryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorRbcAgQueryEntry].path,
  "/donor-functions",
);

const donorRbcAgQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorRbcAgQuery].path,
  "/donor-functions",
);

const defineHHResponseGroupsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineHHResponseGroups].path,
  "/donor-functions",
);

const healthHistoryManagementPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.HealthHistoryManagement].path,
  "/donor-functions",
);

const addHealthHistoryTemplatePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AddHealthHistoryTemplate].path,
  "/donor-functions",
);

const viewHealthHistoryTemplatePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ViewHealthHistoryTemplate].path,
  "/donor-functions",
);

const fastTrakWebConfigurationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.FastTrakWebConfiguration].path,
  "/donor-functions",
);

const maintainDriveLocationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainDriveLocation].path,
  "/donor-functions",
);

const changeDriveIdCollectionDatePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ChangeDriveIdCollectionDate].path,
  "/donor-functions",
);
const updateDonationRegistrationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.UpdateDonationRegistration].path,
  "/donor-functions",
);

const attachDonorPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AttachDonor].path,
  "/donor-functions",
);

const registeredDeferralsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RegisteredDeferralsQuery].path,
  '/donor-functions',
);

const rollbackDonationAuditPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RollbackDonationAudit].path,
  "/donor-functions",
);

const releaseAuditInterdictionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReleaseAuditInterdiction].path,
  "/donor-functions",
);

const maintainDonorEmployerPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainDonorEmployer].path,
  "/donor-functions",
);

const defineHLAAntigensPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineHLAAntigens].path,
  "/donor-functions",
);

const enterHlaRbcRequestPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterHlaRbcRequest].path,
  '/donor-functions',
);

const rbcAntigenManagerConfigPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RbcAntigenManagerConfig].path,
  '/donor-functions',
);
const paperlessNursingAuditPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PaperlessNursingAudit].path,
  "/donor-functions",
);

const addDonorPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AddDonor].path,
  "/donor-functions",
);

const modifyDonorPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ModifyDonor].path,
  "/donor-functions",
);

const addDonorFormPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AddDonorForm].path,
  "/donor-functions",
);

const detachDonorFromDonationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DetachDonorFromDonation].path,
  "/donor-functions",
);

const detachDonorFromDeferralPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DetachDonorFromDeferral].path,
  "/donor-functions",
);

const defineHLACrossReactiveGroupsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineHLACrossReactiveGroups].path,
  "/donor-functions",
);

const defineHLAMatchingGradesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineHLAMatchingGrades].path,
  "/donor-functions",
);

const vistaLifeTrakConversionTablePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VistaLifeTrakConversionTable].path,
  "/donor-functions",
);

const lookupAndPrintDonorCardPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.LookupAndPrintDonorCard].path,
  '/donor-functions',
);
const vistaLifeTrakErrorLogPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VistaLifeTrakErrorLog].path,
  "/donor-functions",
);
const newZipCodePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.NewZipCode].path,
  "/donor-functions",
);
const releaseAuditHoldsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReleaseAuditHolds].path,
  "/donor-functions",
);

const deferralsOnHoldQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DeferralsOnHoldQuery].path,
  '/donor-functions',
);

const registerDeferralPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RegisterDeferral].path,
  '/donor-functions',
);
const updateDeferralPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.UpdateDeferral].path,
  '/donor-functions',
);
const donationsOnHoldQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonationsOnHoldQuery].path,
  '/donor-functions',
);

const maintainGroupInterdictionsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainGroupInterdictions].path,
  '/donor-functions',
);

const donorDetailQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path,
   '/donor-functions',
);
const donorDocumentLibraryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorDocumentLibrary].path,
  '/donor-functions',
);
const mergedDonorsPagePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MergedDonorsPage].path,
  '/donor-functions',
);
const viewDonorLettersPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ViewDonorLetters].path,
  '/donor-functions',
);

const donorAttributesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorAttributes].path,
  '/donor-functions',
);

const investigateDuplicateDonorRecordsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.InvestigateDuplicateDonorRecords].path,
  '/donor-functions',
);

const authorizeDonorNotificationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AuthorizeDonorNotification].path,
  '/donor-functions',
);
const maintainUnitInterdictionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainUnitInterdiction].path,
  '/donor-functions',
);

const multipleDonorsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MultipleDonorsQuery].path,
  '/donor-functions',
);

const donorProfileAuditQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorProfileAuditQuery].path,
  '/donor-functions',
);

const donorAntigensQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorAntigensQuery].path,
  '/donor-functions',
);

const maintainDonorInterdictionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainDonorInterdiction].path,
  '/donor-functions',
);

const maintainDonorAttributesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainDonorAttributes].path,
  '/donor-functions',
);

const potentialDuplicateBatchQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PotentialDuplicateBatchQuery].path,
  '/donor-functions',
);

const gradedDonorsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.GradedDonorsQuery].path,
  '/donor-functions',
);

const unitTestResultsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.UnitTestResultsQuery].path,
  '/donor-functions',
);

const maintainPhysicianListPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainPhysicianList].path,
  '/donor-functions',
);
const linkUnitToSpecialDonationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.LinkUnitToSpecialDonation].path,
  '/donor-functions',
);
const registerSpecialDonationRequestPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RegisterSpecialDonationRequest].path,
  '/donor-functions',
);
const registerSpecialDonationRequestDetailPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RegisterSpecialDonationRequestDetail].path,
  '/donor-functions',
);
const specialDonationStatusQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SpecialDonationStatusQuery].path,
  '/donor-functions',
);

const printSpecialInstructionsTieTagsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PrintSpecialInstructionsTieTags].path,
  '/donor-functions',
);
const printAutoDirectedTieTagPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PrintAutoDirectedTieTag].path,
  '/donor-functions',
);
const donationsPendingAuditQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonationsPendingAuditQuery].path,
  "/donor-functions",
);

const deferralsPendingAuditQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DeferralsPendingAuditQuery].path,
  "/donor-functions",
);

const prepareDonorNotificationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PrepareDonorNotification].path,
  '/donor-functions',
);

const defineNotificationLettersPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineNotificationLetters].path,
  '/donor-functions',
);

const associateStrongReactivityPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AssociateStrongReactivity].path,
  '/donor-functions',
);

const defineHlaInterimOutputPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineHlaInterimOutput].path,
  '/donor-functions',
);

const associateLetterToInterdictionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AssociateLetterToInterdiction].path,
  '/donor-functions',
);

const defineCommTypesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineCommTypes].path,
  '/donor-functions',
);

const donorsByEventsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorsByEventsQuery].path,
  '/donor-functions',
);

const defineCommunicationLettersPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineCommunicationLetters].path,
  '/donor-functions',
);

  /** Full path: donor-survey-manager/link-template — standalone (no DSM tabs shell). */
  const donorSurveyManagerLinkTemplatePath = `${donorSurveyManagerPath}/link-template`;
  /** Full path: donor-survey-manager/add-template — standalone (no DSM tabs shell). */
  const donorSurveyManagerAddTemplatePath = `${donorSurveyManagerPath}/add-template`;

  export const DONOR_FUNCTIONS_ROUTES: Routes = [
    { path: '', redirectTo: 'registration', pathMatch: 'full' },
    {
      path: defineHHResponseGroupsPath,
      loadComponent:
        ROUTE_REGISTRY[RouteKey.DefineHHResponseGroups].loadComponent,
    },
    {
      path: healthHistoryManagementPath,
      loadComponent:
        ROUTE_REGISTRY[RouteKey.HealthHistoryManagement].loadComponent,
    },
    {
      path: addHealthHistoryTemplatePath,
      loadComponent:
        ROUTE_REGISTRY[RouteKey.AddHealthHistoryTemplate].loadComponent,
    },
    {
      path: viewHealthHistoryTemplatePath,
      loadComponent:
        ROUTE_REGISTRY[RouteKey.ViewHealthHistoryTemplate].loadComponent,
    },
    {
      path: fastTrakWebConfigurationPath,
      loadComponent:
        ROUTE_REGISTRY[RouteKey.FastTrakWebConfiguration].loadComponent,
    },
  // Redirect old path to new path for resource availability rules
  {
    path: 'recruitment/resource-availability-rules',
    redirectTo: resourceAvailabilityRulesPath,
    pathMatch: 'full',
  },
  {
    path: donorRegistrationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorRegistration].loadComponent,
  },
  {
    path: donorHistoryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorHistory].loadComponent,
  },
  {
    path: donationDetailsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonationDetails].loadComponent,
  },
  {
    path: auditDonationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AuditDonation].loadComponent,
  },
  {
    path: donationDeferralAuditDrawerPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonationDeferralAuditDrawer].loadComponent,
    data: ROUTE_REGISTRY[RouteKey.DonationDeferralAuditDrawer].data,
  },
  {
    path: healthHistoryTemplatePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.HealthHistoryTemplate].loadComponent,
  },
  {
    path: defineDefaultDriveChecklistPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineDefaultDriveChecklist].loadComponent,
  },
  {
    path: defineDriveCategoryRulesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineDriveCategoryRules].loadComponent,
  },
  {
    path: defineResourceMasterListPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineResourceMasterList].loadComponent,
  },
  {
    path: monthlyCollectionGoalsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MonthlyCollectionGoalsQuery].loadComponent,
  },
  {
    path: resourceStatusQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ResourceStatusQuery].loadComponent,
  },
  {
    path: parentSponsorQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ParentSponsorQuery].loadComponent,
  },
  {
    path: drawQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DrawQuery].loadComponent,
  },
  {
    path: multipleDriveSelectionQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MultipleDriveSelectionQuery].loadComponent,
  },
  {
    path: drivesBySponsorQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DrivesBySponsorQuery].loadComponent,
  },
  {
    path: mergeDuplicateSponsorsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MergeDuplicateSponsors].loadComponent,
  },
  {
    path: mergeDuplicateDonorsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MergeDuplicateDonors].loadComponent,
  },
  {
    path: createOrModifySpecialDrivePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CreateOrModifySpecialDrive].loadComponent,
  },
  {
    path: createOrModifySpecialDriveDcmPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CreateOrModifySpecialDriveDcm].loadComponent,
  },
  {
    path: manageSpecialDrivePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ManageSpecialDrive].loadComponent,
  },
  {
    path: createDriveFromTemporaryDrivePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CreateDriveFromTemporaryDrive].loadComponent,
  },
  {
    path: setDriveDateAndIdPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SetDriveDateAndId].loadComponent,
  },
  {
    path: resourceAvailabilityRulesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ResourceAvailabilityRules].loadComponent,
  },
  {
    path: driveSheetPrintStatusPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DriveSheetPrintStatus].loadComponent,
  },
  {
    path: collectionGoalsByDateQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CollectionGoalsByDateQuery].loadComponent,
  },
  {
    path: collectionStatisticsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CollectionStatistics].loadComponent,
  },
  {
    path: 'site-collection-statistics',
    loadComponent: ROUTE_REGISTRY[RouteKey.SiteCollectionStatistics].loadComponent,
  },
  {
    path: alternateDemographicsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AlternateDemographics].loadComponent,
  },
  {
    path: internationalAddressPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.InternationalAddress].loadComponent,
  },
  {
    path: aboSpreadByDrivePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AboSpreadByDrive].loadComponent,
  },
  {
    path: aboSpreadBySponsorPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AboSpreadBySponsor].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.TemporaryDriveQuery].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.TemporaryDriveQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.RegisteredDonationsQuery].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.RegisteredDonationsQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.ConsentHistory].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.ConsentHistory].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DonorLabels].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorLabels].loadComponent,
  },
  {
    path: donationsPendingAuditQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonationsPendingAuditQuery].loadComponent,
  },
  {
    path: deferralsPendingAuditQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DeferralsPendingAuditQuery].loadComponent,
  },
  {
    path: physicalFindingsTemplatePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.PhysicalFindingsTemplate].loadComponent,
  },
  {
    path: addPhysicalFindingsTemplatePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AddPhysicalFindingsTemplate].loadComponent,
  },
  {
    path: territoryManagementPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.TerritoryManagement].loadComponent,
  },
  {
    path: driveDetailsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DriveDetailsQuery].loadComponent,
  },
  {
    path: maintainSponsorContactsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainSponsorContacts].loadComponent,
  },
  {
    path: abbreviatedQuestionnaireSetupPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AbbreviatedQuestionnaireSetup].loadComponent,
  },
  {
    path: viewSponsorContactsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ViewSponsorContacts].loadComponent,
  },
  {
    path: donorSurveyManagerLinkTemplatePath,
    loadComponent: () =>
      import('./donor-survey-manager/link-template/link-template').then(
        (m) => m.LinkTemplateComponent,
      ),
  },
  {
    path: donorSurveyManagerPath + '/responses/:chapterId/:templateId',
    loadComponent: () => import('./donor-survey-manager/survey-template/view-responses/view-responses')
      .then(m => m.ViewResponsesComponent)
  },
  {
    path: donorSurveyManagerAddTemplatePath,
    loadComponent: () =>
      import('./donor-survey-manager/add-edit-template/add-edit-template').then(
        (m) => m.AddEditTemplateComponent,
      ),
  },
  {
    path: donorSurveyManagerPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorSurveyManager].loadComponent,
    children: [
      {
        path: '',
        redirectTo: 'qa-library',
        pathMatch: 'full',
      },
      {
        path: 'qa-library',
        loadComponent: () =>
          import('./donor-survey-manager/qa-library/qa-library').then((m) => m.QaLibraryComponent),
      },
      {
        path: 'survey-template',
        loadComponent: () =>
          import('./donor-survey-manager/survey-template/survey-template').then(
            (m) => m.SurveyTemplateComponent,
          ),
      },
      {
        path: 'access-management',
        loadComponent: () =>
          import('./donor-survey-manager/access-management/access-management').then(
            (m) => m.AccessManagementComponent,
          ),
      },
    ],
  },
  // Donor RBC Ag Query - Direct access (supports both path param and query param)
  {
    path: donorRbcAgQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorRbcAgQuery].loadComponent,
  },
  // Legacy entry page path now redirects to main component (deprecated)
  {
    path: 'donor-rbc-ag-query',
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorRbcAgQuery].loadComponent,
  },
  {
    path: maintainDriveLocationPath,
    loadComponent:
      ROUTE_REGISTRY[RouteKey.MaintainDriveLocation].loadComponent,
  },
  {
    path: changeDriveIdCollectionDatePath,
    loadComponent:
      ROUTE_REGISTRY[RouteKey.ChangeDriveIdCollectionDate].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.FindDonor].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.FindDonor].loadComponent,
    data: { donorMode: 'modify' },
  },
  {
    path: maintainDonorEmployerPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainDonorEmployer].loadComponent,
  },
  {
    path: releaseAuditHoldsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseAuditHolds].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.NotificationLog].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.NotificationLog].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DonorCommunicationQuery].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorCommunicationQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.AuthorizeNotificationLetter].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.AuthorizeNotificationLetter].loadComponent,
  },
  {
    path: defineNotificationLettersPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineNotificationLetters].loadComponent,
  },
  {
    path: associateStrongReactivityPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AssociateStrongReactivity].loadComponent,
  },
  {
    path: defineHlaInterimOutputPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineHlaInterimOutput].loadComponent,
  },
  {
    path: associateLetterToInterdictionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AssociateLetterToInterdiction].loadComponent,
  },
  {
    path: rollbackDonationAuditPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RollbackDonationAudit].loadComponent,
  },
  {
    path: releaseAuditInterdictionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseAuditInterdiction].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.SearchForDonor].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.SearchForDonor].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.PerformVisualAudit].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.PerformVisualAudit].loadComponent,
    canDeactivate: [performVisualAuditGuard]
  },
  {
    path: paperlessNursingAuditPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.PaperlessNursingAudit].loadComponent,
  },
  {
    path: registeredDeferralsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RegisteredDeferralsQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.InterdictionQuery].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.InterdictionQuery].loadComponent,
  },
  {
    path: multipleDonorsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MultipleDonorsQuery].loadComponent,
  },
  {
    path: donorProfileAuditQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorProfileAuditQuery].loadComponent,
  },
  {
    path: donorAntigensQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorAntigensQuery].loadComponent,
  },
  {
    path: potentialDuplicateBatchQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.PotentialDuplicateBatchQuery].loadComponent,
  },
  {
    path: gradedDonorsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.GradedDonorsQuery].loadComponent,
  },
  {
    path: unitTestResultsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.UnitTestResultsQuery].loadComponent,
  },
  {
    path: defineHLAAntigensPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineHLAAntigens].loadComponent,
  },
  {
    path: enterHlaRbcRequestPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterHlaRbcRequest].loadComponent,
  },
  {
    path: rbcAntigenManagerConfigPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RbcAntigenManagerConfig].loadComponent,
  },
  {
    path: addDonorPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AddDonor].loadComponent,
    data: { donorMode: 'add' },
  },
  {
    path: modifyDonorPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ModifyDonor].loadComponent,
    data: { donorMode: 'modify' },
  },
  {
    path: addDonorFormPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AddDonorForm].loadComponent,
  },
  {
    path: detachDonorFromDonationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DetachDonorFromDonation].loadComponent,
  },
  {
    path: detachDonorFromDeferralPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DetachDonorFromDeferral].loadComponent,
  },
  {
    path: defineHLACrossReactiveGroupsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineHLACrossReactiveGroups].loadComponent,
  },
  {
    path: defineHLAMatchingGradesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineHLAMatchingGrades].loadComponent,
  },
  {
    path: deferralsOnHoldQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DeferralsOnHoldQuery].loadComponent,
  },
  {
    path: registerDeferralPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RegisterDeferral].loadComponent,
    canDeactivate: [registerDeferralGuard],
  },
  {
    path: updateDeferralPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.UpdateDeferral].loadComponent,
  },
  {
    path: donationsOnHoldQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonationsOnHoldQuery].loadComponent,
    children: [
      {
        path: 'attach-donor',
        loadComponent: ROUTE_REGISTRY[RouteKey.AttachDonor].loadComponent,
      },
      {
        path: 'entry-details',
        loadComponent: ROUTE_REGISTRY[RouteKey.DonationEntryDetails].loadComponent,
      },
      {
        path: 'update-registration',
        loadComponent: ROUTE_REGISTRY[RouteKey.UpdateDonationRegistration].loadComponent,
      },
    ],
  },
  {
    path: vistaLifeTrakConversionTablePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.VistaLifeTrakConversionTable].loadComponent,
  },
  {
    path: lookupAndPrintDonorCardPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.LookupAndPrintDonorCard].loadComponent,
  },
  {
    path: vistaLifeTrakErrorLogPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.VistaLifeTrakErrorLog].loadComponent,
  },
  {
    path: newZipCodePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.NewZipCode].loadComponent,
  },
  {
    path: maintainSpecialInstructionsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainSpecialInstructions].loadComponent,
  },
  {
    path: maintainGroupInterdictionsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainGroupInterdictions].loadComponent,
  },
  {
    path: donorDetailQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorDetailQuery].loadComponent,
  },
  {
    path: donorDocumentLibraryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorDocumentLibrary].loadComponent,
  },
  {
    path: mergedDonorsPagePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MergedDonorsPage].loadComponent,
  },
  {
    path: viewDonorLettersPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ViewDonorLetters].loadComponent,
  },
  {
    path: prepareDonorNotificationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.PrepareDonorNotification].loadComponent,
  },
  {
    path: authorizeDonorNotificationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AuthorizeDonorNotification].loadComponent,
  },
  {
    path: maintainUnitInterdictionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainUnitInterdiction].loadComponent,
  },
  {
    path: updateDonationRegistrationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.UpdateDonationRegistration].loadComponent,
  },
  {
    path: attachDonorPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AttachDonor].loadComponent,
  },
  {
    path: maintainDonorInterdictionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainDonorInterdiction].loadComponent,
  },
  {
    path: maintainDonorAttributesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainDonorAttributes].loadComponent,
  },
  {
    path: maintainPhysicianListPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainPhysicianList].loadComponent,
  },
  {
    path: linkUnitToSpecialDonationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.LinkUnitToSpecialDonation].loadComponent,
  },
  {
    path: registerSpecialDonationRequestPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RegisterSpecialDonationRequest].loadComponent,
  },
  {
    path: registerSpecialDonationRequestDetailPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RegisterSpecialDonationRequestDetail].loadComponent,
  },
  {
    path: defineCommTypesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineCommTypes].loadComponent,
  },
  {
    path: donorsByEventsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorsByEventsQuery].loadComponent,
  },
  {
    path: defineCommunicationLettersPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DefineCommunicationLetters].loadComponent,
  },
  {
    path: 'donor-communication/communication-type-codes/:codeType',
    loadComponent: () =>
      import('./define-communication-types/communication-type-codes/view-communication-type-codes/view-communication-type-codes').then(
        (m) => m.ViewCommunicationTypeCodesComponent,
      ),
  },
  {
    path: specialDonationStatusQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SpecialDonationStatusQuery].loadComponent,
  },
  {
    path: printSpecialInstructionsTieTagsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.PrintSpecialInstructionsTieTags].loadComponent,
  },
  {
    path: printAutoDirectedTieTagPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.PrintAutoDirectedTieTag].loadComponent,
  },
  {
    path: `${linkUnitToSpecialDonationPath}/:patientId/:surgId`,
    loadComponent: () =>
      import('./special-donations/link-unit-to-special-donation/components/patient-detail/patient-detail.component').then(
        (m) => m.PatientDetailComponent
      ),
  },
  {
    path: donorAttributesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DonorAttributes].loadComponent,
  },
  {
    path: investigateDuplicateDonorRecordsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.InvestigateDuplicateDonorRecords].loadComponent,
  },
  {
    path: cancelFixedSpecialDrivesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CancelFixedSpecialDrives].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.EnterControlValues].path, '/donor-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterControlValues].loadComponent,
  },
  // Test pages for component development
  {
    path: 'registration/test-view-donors-in-list',
    loadComponent: () => import('../../shared/components/view-donors-in-list/test-page.component').then(m => m.ViewDonorsTestPageComponent),
  },
  {
    path: 'registration/test-donation-notes',
    loadComponent: () => import('../../shared/components/donation-notes/test-page.component').then(m => m.DonationNotesTestPage),
  },
  {
    path: 'registration/test-view-notification-letter',
    loadComponent: () => import('../../shared/components/view-notification-letter-dialog/test-page.component').then(m => m.ViewNotificationLetterTestPage),
  },
];
