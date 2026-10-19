import { RouteKey } from './route-keys';

export interface MnemonicIdentifiable {
  mnemonic: string;
}

export interface ApiMenuItem extends MnemonicIdentifiable {
  menuId: number;
  fcnId: number;
  label: string;
  menuLevel: number;
  sequence: number;
  route: string;
  expanded: boolean;
  hidden: string; // 'Y' for hidden, empty string or null for visible
  children: ApiMenuItem[];
  breadcrumbLabel?: string;
  icon?: string;
  fcnIcon?: string;
  remarks?: string;
  subtitle?: string;
  requiredAccessLevel: number;
}

// TODO: Replace these placeholder mnemonics with actual values from the API
export const MNEMONIC_ROUTE_MAP: Record<string, RouteKey> = {
  'REGIS': RouteKey.DonorRegistration, // fcnId: 1040
  'DONORHISTORY': RouteKey.DonorHistory, // fcnId: 1039
  'DRUREHLD': RouteKey.AttachDonor, // Attach Donor - Review possible donor matches
  'ATTACH': RouteKey.AttachDonor, // Attach Donor - Alternate mnemonic
  'DONAUDIT': RouteKey.AuditDonation, // Audit Donation - Release Audit Interdictions
  'HHTEMPL': RouteKey.HealthHistoryTemplate, // Health History Template - Manage HH questionnaire template
  'INST': RouteKey.ViewInstitution, // fcnId: 8241
  'SYSPARM': RouteKey.SystemParameter, // fcnId: 1042
  'CHAPTER': RouteKey.ChapterDetails, // fcnId: 8292
  'MASTER': RouteKey.DonorMasterCodes, // fcnId: 1053
  'DONORINTER': RouteKey.DonorInterdictionCodes, // TODO: Add actual fcnId
  'DONS': RouteKey.DefineDonationTypes, // TODO: Add actual fcnId
  'MAXDON': RouteKey.DefineMaxDonations, // fcnId: 1093 - Define Max Donations for Proc Groups
  'PHYRULE': RouteKey.DefinePhysicalFindingsValues, // ? Define Physical Findings Values - SEARCH NAVIGATION FIX
  'DONPP': RouteKey.ValidDonationTypeProcedureCode, // fcnId: 4526 - Donation/Procedure Mapping
  'DONPROC': RouteKey.DefineDonationProcedures, // Define Donation Procedures (Program: VDIDPCOD)
  'DPCONST': RouteKey.DonProcConsentDefinition, // Consent Mapping - TODO: Add actual fcnId
  'XCLU': RouteKey.DefineProcedureExclusions, // fcnId: 1092 - Donation/Procedure - Rules
  'UCLASS': RouteKey.UserInterdictionClass, // TODO: Add actual fcnId
  'REGHOLDS': RouteKey.RegistrationHoldsMapping, // TODO: Add actual fcnId - Registration Holds Mapping
  'REGHOLD': RouteKey.RegistrationHoldsMapping, // Alternative mnemonic
  'RHOLDS': RouteKey.RegistrationHoldsMapping, // Alternative mnemonic
  'RHOLD': RouteKey.RegistrationHoldsMapping, // Alternative mnemonic
  'CODE': RouteKey.DistributionMasterCodes, // fcnId: 5226
  'PACKLD': RouteKey.PackLabDiscards, // Pack Lab Discards to Discard (MLT-14011)
  'PACKLS': RouteKey.PackLabDiscardsToSalvage, // Pack Lab Discards to Salvage (MLT-14010)
  'CDQL': RouteKey.DebitCreditQuery, // Customer Debit/Credit Query
  'CDPROD': RouteKey.BloodProductCredit, // Blood Product Credit - Product Management Functions => Customer Debit/Credit
  'CDSVC': RouteKey.OrderServicesDebitCredit, // Order and Services Debit/Credit - Product Management Functions => Customer Debit/Credit (FMB: CSISDBCR)
  'REGTUBES': RouteKey.TubesCheckIn, // Tubes Check-In - Regional Sample Tracking
  'TSTEST': RouteKey.HospitalPatientContractProfileTests, // Hospital/Patient Contract Profile Tests
  'AHCNTR': RouteKey.HospitalPatientAdHocTestingContract, // Hospital/Patient Ad Hoc Testing Contract
  'TSCNTR': RouteKey.HospitalPatientTestingContract, // Hospital/Patient Testing Contract
  'TSTUBES': RouteKey.FixedProfileTubeCheckIn, // Fixed Profile Tube Check-In
  'LMASTER': RouteKey.LabMasterCodes, // fcnId: 8192
  'PROCSTAG': RouteKey.ProcessStages, // SP' Processes and Stages (VPROCSTA)
  'INTER': RouteKey.ViewInterdictionCodes, // fcnId: 8194
  'ICLASS': RouteKey.AssignInterdictionClass, // Assign Interdiction Class
  'ASSIGNINT': RouteKey.AssignInterdictionClass, // Alternative mnemonic - Assign Interdiction Class
  'INTUP': RouteKey.InterdictionUpgradeMatrix, // fcnId: 1156
  'ABPCOMP': RouteKey.AboProductCompatibility, // ABO/Product Compatibility
  'SUB': RouteKey.ValidProductSubstitution, // Menu Label: "Product Substitutions"
  'BOXCAP': RouteKey.BoxCapacity, // Menu Label: "Box Capacity"
  'CPPTIER': RouteKey.CustomerPreferredTier, // Menu Label: "Setup Customer Preferred Product Tiers"
  'PRODCOM': RouteKey.ProductCombinations, // Product Combinations
  'CMPINT2': RouteKey.EnterComponentInterdiction, // Enter Component Interdiction
  'CPINTER': RouteKey.EnterComponentInterdiction, // Place Component Interdiction (from Holding Area Query)
  'CPIRINT': RouteKey.ReleaseComponentInterdiction, // Release Component Interdiction (from Holding Area Query)
  'RCHOLD': RouteKey.ReleaseComponentHold, // Release Component Hold - fcnId: 8255
  'CNOTE': RouteKey.ComponentNotes, // Component Notes - fcnId: 8502
  'LINTQ': RouteKey.LabInterdictionQuery, // Lab Interdiction Query - CPQINTAL
  'REASON': RouteKey.ReturnReasons, // fcnId: TBD
  'ABOVAL': RouteKey.AboValues, // ABO Values
  'ORDCL': RouteKey.OrderClassCodes, // Order Class Codes
  'VCHARGE': RouteKey.DefineOrderCharges, // Define Order Charges
  'OCHGQ': RouteKey.OrderChargesByOrderNo, // Order Charges By Order No
  'VENATRR': RouteKey.VenipunctureAttributes, // Venipuncture Attributes
  'DRIVES': RouteKey.Drives, // Drives component
  'DEFCLIST': RouteKey.DefineDefaultDriveChecklist, // fcnId: 1339 - Define Default Drive Checklist
  'ERRORS': RouteKey.DonorErrorCodes, // fcnId: 1020
  'DERRORS': RouteKey.DistributionErrorCodes, // fcnId: 1022
  'DELQ': RouteKey.DeliveredShipments, // Delivered Shipments Query (SHQMENTS)
  'SHIPQ': RouteKey.ShipmentsByShipDate, // Shipments by Ship Date Query (SHQBYDAT)
  'LERRORS': RouteKey.LabErrorCodes, // fcnId: 1021
  'NUMBERS': RouteKey.ApplicationSequenceNumbers, // fcnId: 8797
  'GROUPS': RouteKey.DefineGroups, // fcnId: 8130
  'RMASTER': RouteKey.ReportMasterTable, // fcnId: 1032
  'RMCODE': RouteKey.ReportParameters, // fcnId: 8154
  'RMREP': RouteKey.ReportReports, // fcnId: 8152
  // 'MGRUSERS1': RouteKey.ManageUsers, // fcnId: 8712
  'USRMGMT': RouteKey.AddSystemUser, // fcnId: 1380
  'PWDCFG': RouteKey.PasswordConfiguration, // fcnId: 1639
  'ADDFCN': RouteKey.AddFunctions, // fcnId: 1382
  'WUSER': RouteKey.UserWarehouse, // fcnId: 4471
  'SITES': RouteKey.GroupSites, // Group/Sites mnemonic
  'UACCESS': RouteKey.DefineUserAccess, // fcnId: 1158 - Donor User Access
  'MENUQ': RouteKey.UserAccessMenusInterdiction, // fcnId: 1158 - User Access to Menus and Interdictions
  'LUACCESS': RouteKey.LabUserAccess, // fcnId: 4565 - Lab User Access
  'ACCESS': RouteKey.DefineAccessClass, // Donor Access Class
  'DEFLET': RouteKey.DefineNotificationLetters, // Define Notification Letters mnemonic
  'NOTLET': RouteKey.DefineNotificationLetters, // Alternative mnemonic (keeping for backward compatibility)
  'INTERLET': RouteKey.AssociateLetterToInterdiction, // Associate Letter to Interdiction
  'ABO': RouteKey.ValidAbo, // Valid ABO
  'OPER': RouteKey.DefineOperators, // Operators
  'PROC': RouteKey.DefineProcedureCodes, // Define Procedure Codes
  'PROCGRP': RouteKey.DefineProcedureGroups, // TODO: Add actual fcnId when API is ready
  'GRADMAT': RouteKey.DonorGradingMatrix, // Donor Grading Matrix
  'GRADEQ': RouteKey.GradedDonorsQuery, // Graded Donors Query
  'RESULQ': RouteKey.UnitTestResultsQuery, // Unit Test Results Query (MLT-10914)
  'ACCQ': RouteKey.AccessClassByInterCode, // Access Class by Interdiction Code Query
  'FINCD': RouteKey.ValidFacilityIdentifiers, // fcnId: 1636 - Valid Facility Identifiers
  'BARCODE': RouteKey.BarCodeTranslations, // Bar Code Translations
  'INTOVER': RouteKey.LabelingInterdictionOverride, // Labeling Interdiction Override
  'INTOVER2': RouteKey.LabInterdictionOverride, // TODO: Add actual fcnId
  'ATC': RouteKey.AdditionalConfirmatoryTestScheduled, // Additional Confirmatory Test Scheduled
  'PRELBL': RouteKey.PreLabelFrozenProduct, // Pre-Label Frozen Product
  'CATTR': RouteKey.EnterAttributeServiceCodes, // Enter Attribute Service Codes (SFIATTR form)
  'ADDIN': RouteKey.AddInterdictionForUnitsNotChecked, // Add Interdiction for Units not Checked (MLT-13315)
  'PRODTYP': RouteKey.InventoryProductTypes, // Inventory Product Types
  'ISBTQ': RouteKey.ISBTUnitCheckDigit, // fcnId: 1628 - ISBT Unit Check Digit
  'COLLID': RouteKey.ValidCollectionFacilities, // Valid Collection Facilities
  'ISBTQL': RouteKey.ISBTUnitCheckDigit, // fcnId: 4538 - ISBT Unit Check Digit (Lab)
  'NICK': RouteKey.AssociateNicknameToName,
  'DRVPRF': RouteKey.DriveEquipmentParameters, // Drive Equipment Parms,
  'RUSYSINT': RouteKey.ReleaseUnitSystemInterdiction, // fcnId: 8415 - Release Unit System Interdiction
  'PSCOMP': RouteKey.PoolMatrix, // fcnId: 5218 - Pool Matrix,
  'TESTS': RouteKey.TestConfiguration, // Test Configuration
  'VDITESTS': RouteKey.DonorTests, // Donor Test (Identify valid tests)
  'TSERIES': RouteKey.TestSeriesConfiguration, // Test Series Configuration
  'VADDTST': RouteKey.ValidAdditionalTests, // Valid Additional Tests (fcnId: 8690)
  'VTILABS': RouteKey.ValidRemoteTestingLabs, // Valid Remote Testing Labs
  'INTOVERQ': RouteKey.LabelingInterdictionOverrideQuery, // Labeling Interdiction Override Query
  'OVERDONQ': RouteKey.DonorInterdictionOverrideQuery, // fcnId: 8706 - Donor Interdiction Override Query
  'AG': RouteKey.AntigenResultEntry, // Antigen Result Entry
  'ANTGN': RouteKey.AntigenTests, // Antigen Tests
  'AGMGR': RouteKey.RbcAntigenManagerConfig, // RBC Antigen Manager Configuration (HLA/RBC > RBC Antigen Manager)
  'ANTQ': RouteKey.RbcAntigenQuery, // fcnId: 1302 - Donor RBC Ag Query (HLA/RBC > RBC Antigen Manager)
  'ANTQ2': RouteKey.DonorAntigensQuery, // Donor Antigens Query (Donor Profile > Donor Profile Queries)
  'TBQ': RouteKey.TestBatchDetailsQuery, // Test Batch Details Query
  'ANTQL': RouteKey.Antql, // Unit & Donor Tested Antigen Query (Testing Modules > Testing Queries)
  'IMCONTR': RouteKey.ImportedBloodContract, // Imported Blood Contract (Laboratory Functions)
  'REQ': RouteKey.ResultsExtractQuery, // Results Extract Query
  'RES1': RouteKey.FirstTechTestResult, // First Tech Test Result (MLT-13339)
  'RES2': RouteKey.SecondTechTestResultVerification, // Second Tech Test Result Verification (MLT-13419)
  'HLANTI': RouteKey.DefineHLAAntigens, // Define HLA Antigens
  'HLARESUL': RouteKey.EnterHlaResults, // Enter HLA Results (HLARESUL)
  'HLAXX': RouteKey.AssociateStrongReactivity, // fcnId: 1303 - Associate Strong Reactivity
  'HLAINT': RouteKey.DefineHlaInterimOutput, // fcnId: 1343 - Define HLA Interim Output
  'PREPRINT': RouteKey.PrePrintedProductLabels, // Pre-Printed Product Labels
  'POOLSLD': RouteKey.ValidPoolAboValues, // Valid Pool ABO Values
  'NOTCFG': RouteKey.NotationCodeConfiguration, // Notation Code Configuration
  'DELPOOL': RouteKey.DeletePooledComponents, // Delete Pooled Components
  'POOL': RouteKey.PreparePooledComponents, // Prepare Pooled Components
  'MODPOOL': RouteKey.ModifyPooledComponents, // Modify Pooled Components
  'DELCOMP': RouteKey.DeleteComponent, // Delete Component (Component Delete)
  'LBLQC': RouteKey.QcForLabeling, // QC for Labeling
  'DCATTR': RouteKey.DeleteComponentAttributes, // Delete Component Attributes
  'DUATTR': RouteKey.DeleteUnitAttributes, // Delete Unit Attributes
  'RECHECK': RouteKey.RecheckProductsFromInventory, // Re-Check Products from Inventory
  'CMCI': RouteKey.ConvertModifyComponents, // Convert/Modify Components (ISBT 128 Labelling)
  'PRDTYPE': RouteKey.ProductTypeData, // Product Type Data (ISBT/Codabar)
  'PRDATTR': RouteKey.ProductTypeAttributes, // Product Type Attributes (ISBT/Codabar)
  'PRDTYAT': RouteKey.DefaultProductCodeAttributes, // Default Product Code Attributes (ISBT)
  'CPROD': RouteKey.EnterProductServiceCodes, // fcnId: 5362 - Enter Product Service Codes
  'VCUSTPRD': RouteKey.CustomerConsigneeProductDetails, // Customer Consignee Product Details
  'OVR': RouteKey.AttributeExpirationDateOverride, // Attribute Expiration Date Override: ISBT
  'ATTRIB': RouteKey.AttributeCodes, // Attribute Codes (Legacy: VATTRIB)
  'SPPROC': RouteKey.SpProductsSpecialProcesses, // SP Products/Special Processes
  // 'PROCSTAG': RouteKey.SpProcessesAndStages, // SP' Processes and Stages
  'HLAEPI': RouteKey.DefineHLACrossReactiveGroups, // Define HLA Cross-Reactive Groups (HLA Epitopes)
  'HLAGRAD': RouteKey.DefineHLAMatchingGrades, // Define HLA Matching Grades
  'SETDST': RouteKey.DaylightSavings, // Config Daylight Savings Time
  'APICONV': RouteKey.ExternalBcDataTranslate, // fcnId: 8117 - Convert External Data to LT Data
  'UNITPINT': RouteKey.MaintainUnitInterdiction, // Maintain Unit Interdiction
  'LOSS': RouteKey.DefineEligibleCellPlasmaLoss, // Define Eligible Cell and Plasma Loss
  'DONBLOCK': RouteKey.FindDonorBlock, // Find Donor Block
  'ILOGQ': RouteKey.LabDonorInterfaceLogQuery, // fcnId: 1415 - Lab-Donor Interface Log Query
  'LABIN': RouteKey.LabInterfaceResults, // Lab Interface Results
  'CONVI': RouteKey.ConvertComponentIntoSpikedBag, // Convert Component into Spiked Bag (ISBT) - FRICON2
  'DAYSTAT': RouteKey.DefineDayStatusCodes, // fcnId: 1111 - Define Day Status Codes
  'DDCODES': RouteKey.DonorDecisionCodes, // Donor Decision Codes - TODO: Add actual fcnId
  'OVERDON1': RouteKey.DonorInterdictionOverride, // fcnId: 8704 - Donor Interdiction Override: Tech1
  'OVERDON2': RouteKey.DonorInterdictionOverrideTech2, // fcnId: 8705 - Donor Interdiction Override: Tech2
  'DONINT': RouteKey.ManualDonorInterface, // Manual Donor Interface (RESTRICTED) - TODO: Add actual fcnId
  'APIUPLD': RouteKey.UploadTestResultsFromOutsideSource, // fcnId: 4546 - Upload Test Results from Outside Source
  'UTDONQ': RouteKey.FindDonorRoutineLogic, // fcnId: 1132 - Find Donor Logic
  'APILOG': RouteKey.ApiLogQuery, // fcnId: 1631 - API Log Query
  'APITDQ': RouteKey.ApiTempDataQuery, // fcnId: 1630 - API Temporary DATA Query
  'APICONVL': RouteKey.ConvertExternalDataToLtData, // fcnId: 8117 - Convert External Data to LT Data
  'SCANTYP': RouteKey.ValidScanInterfaces, // Valid Scan/Scale Interface
  'IIFMGR': RouteKey.InstrumentInterfaceApiManager, // Instrument Interface API Manager
  'AIIDNDRV': RouteKey.DriveInterfaceDonorLab, // Drive Interface from Donor to Lab
  'ALLRES': RouteKey.DefineResourceMasterList, // fcnId: 1055 - Define Resource Master List
  'LBLCF': RouteKey.LabelingConfiguration, // fcnId: 4556 - Labeling Configuration
  'MOBPCLR': RouteKey.MobilePcLaptopRegister, // Mobile PC Laptop Register
  'MENUITM': RouteKey.ManageMenuItem, // Menu Item Maintenance
  'RESET': RouteKey.ResetUserPassword, // Reset Donor Password
  'DBETP': RouteKey.DefineDurationBetweenProcedures, // Define Duration Between Procedures
  'FFVAL': RouteKey.ValidFfFlag, // Valid FF Flag Values - ISBT
  // 'LINTER': RouteKey.LabInterdictionCode, // Lab Interfacing
  // 'LBLCFN': RouteKey.LabelConfiguration, // Label Configuration Functions
  'GOALMONQ': RouteKey.MonthlyCollectionGoalsQuery, // Monthly Collection Goals Query
  'HHGROUP': RouteKey.DefineHHResponseGroups, // fcnId: 8741 - Define HH Response Groups
  'HHQBANK': RouteKey.HealthHistoryManagement, // Health History Question Bank
  'WEBCFG': RouteKey.FastTrakWebConfiguration, // fcnId: 1647 - FastTrak Web Configuration (Onsite)
  'DRULE': RouteKey.DefineDriveCategoryRules, // fcnId: 1109 - Define Drive Category Rules
  'RSTATQ': RouteKey.ResourceStatusQuery, // Resource Status Query
  'PSPONQ': RouteKey.ParentSponsorQuery, // Parent Sponsors Query
  'GOALDTQ': RouteKey.CollectionGoalsByDateQuery, // Collection Goals by Date Query
  'SPMRG': RouteKey.MergeDuplicateSponsors, // fcnId: 1453 - Merge Duplicate Sponsors
  'DRPQ': RouteKey.DriveSheetPrintStatus, // fcnId: TBD - Drive Sheet Print Status
  'SPDRIVE': RouteKey.CreateOrModifySpecialDrive, // fcnId: 1119 - Create or Modify Special Drive
  'SPDRIVE2': RouteKey.CreateOrModifySpecialDriveDcm, // fcnId: 1119 - Donor Center Management > Create or Modify Special Drive
  'CANSF': RouteKey.ManageSpecialDrive, // Cancel Fixed and Special Drives
  'RESRULE': RouteKey.ResourceAvailabilityRules, // Resource Availability Rules
  'DRAWQ': RouteKey.DrawQuery, // fcnId: 1342 - Draw Query
  'TDRIVEQ': RouteKey.TemporaryDriveQuery, // fcnId: 1419 - Temporary Drives Query
  'ENTRYQ': RouteKey.RegisteredDonationsQuery, // Registered Donations Query (DRQENTRY)
  'PHYTEMP': RouteKey.PhysicalFindingsTemplate, // Physical Findings Template
  'TERINFO': RouteKey.TerritoryManagement, // Create and Maintain Territories (VDITERTR)
  'ALTID': RouteKey.AlternateIdConfiguration, // Alternate ID Configuration
  'SPONCONT': RouteKey.MaintainSponsorContacts, // Maintain Sponsor Contacts
  'IIFTST': RouteKey.ApiTestSchedulingByMachineId, // fcnId: 4560 - API Test Scheduling by Machine ID
  'VEHICLE': RouteKey.MaintainVehicleDetails, // fcnId: TBD - Maintain Vehicle Details
  'DPWDNDTL': RouteKey.DonationDetails, // fcnId: TBD - Donation Details (Donation History)
  'DPWAADDR': RouteKey.AlternateDemographics, // fcnId: TBD - Alternate Demographics
  'DPWIADDR': RouteKey.InternationalAddress, // fcnId: TBD - International Address
  'VDWNWZIP': RouteKey.NewZipCode, // New Zip Code window
  'CITYQ': RouteKey.CityStateZipQuery, // fcnId: TBD - City, State, and Zip Query (VDQCITST)
  'SPIN': RouteKey.MaintainSpecialInstructions, // fcnId: TBD - Maintain Special Instructions (VDISPINS)
  'MCMABODR': RouteKey.AboSpreadByDrive, // fcnId: 1376 - ABO Breakdown by Drive
  'MCWABOSP': RouteKey.AboSpreadBySponsor, // fcnId: 1377 - ABO Breakdown by Sponsor
  'MDRIVEQ': RouteKey.MultipleDriveSelectionQuery, // Multiple Drive Selection Query
  'DRIVEQ': RouteKey.DriveDetailsQuery, // Drive Details Query
  'ADHQ': RouteKey.AbbreviatedQuestionnaireSetup, // fcnId: 1644 - Abbreviated Questionnaire Setup
  'FROMTEMP': RouteKey.CreateDriveFromTemporaryDrive, // Create Drive from Temporary Drive - MCIMOBDR
  'SETDRV': RouteKey.SetDriveDateAndId, // Set Drive Date and ID
  'SPCONQ': RouteKey.ViewSponsorContacts, // View Sponsor Contacts Query
  'DRSPONQ': RouteKey.DrivesBySponsorQuery, // fcnId: 1078 - Drives by Sponsor Query
  'SURVEYM': RouteKey.DonorSurveyManager, // Donor Survey Mgr.
  'DRIVELOC': RouteKey.MaintainDriveLocation, // fcnId: 1114 - Maintain Drive Location
  'PRINT': RouteKey.ReportActions, // Report Actions - View/Review/Delete Reports
  'DOCLIB': RouteKey.DocumentLibrary, // Document Library
  'FINDDON': RouteKey.FindDonor, // Find Donor
  'DPWPROPR': RouteKey.FindDonor, // Find Donor - alternate mnemonic
  'VISNU': RouteKey.PerformVisualAudit, // Perform Visual Audit
  'PAUDIT': RouteKey.PaperlessNursingAudit, // Paperless Nursing Audit
  'EMFPROC': RouteKey.EmfProcesses, // EMF Process Definition
  'DONPENDQ': RouteKey.DonationsPendingAuditQuery, // Donations Pending Audit Query (DRQNOAUD)
  'DEFPENDQ': RouteKey.DeferralsPendingAuditQuery, // Deferrals Pending Audit Query (DRQNODEF)
  'MODDRV': RouteKey.ChangeDriveIdCollectionDate, // Change Drive ID or Collection Date
  'EMP': RouteKey.MaintainDonorEmployer, // Maintain Donor Employer
  'NHOLD': RouteKey.ReleaseAuditHolds, // Release Audit Holds
  'SEARCHDON': RouteKey.SearchForDonor, // Search For Donor
  'DNWDFIND': RouteKey.SearchForDonor, // Search For Donor - alternate mnemonic
  'AUROLL': RouteKey.RollbackDonationAudit, // fcnId: 1482 - Rollback Donation Audit
  'RLINT': RouteKey.ReleaseAuditInterdiction, // Release Audit Interdictions
  'DONPINT': RouteKey.MaintainDonorInterdiction, // Place Donor Interdiction
  'DONPATT': RouteKey.MaintainDonorAttributes, // Place Donor Attribute
  'LOTS': RouteKey.LotDetailsForBags, // Lot Details for Bags
  'CATALOG': RouteKey.ValidCatalogNumbers, // Valid Catalog Numbers (CATALOG)
  'MERGDON': RouteKey.MergeDuplicateDonors, // fcnId: TBD - Merge/Resolve Duplicate Donor Records (DPIMERGE)
  'DEFQ': RouteKey.RegisteredDeferralsQuery, // Registered Deferrals Query
  'DETACH': RouteKey.DetachDonorFromDonation, // Detach Donor from Donation
  'DEFDET': RouteKey.DetachDonorFromDeferral, // Detach Donor from Deferral
  'DONIQ': RouteKey.InterdictionQuery, // Interdiction Query
  'SDONQ': RouteKey.DonorDetailQuery, // Donor Detail Query
  'FRMASTER': RouteKey.SpecialProcessingMasterCodes, // Special processing master codes
  'NOTE': RouteKey.EnterNoteForSpecialProcessing, // fcnId: 3108 - Enter Note for Special Processing
  'DIFF': RouteKey.EnterComponentDifferential, // fcnId: 3106 - Enter Component Differential
  'DCWSNDLT': RouteKey.SendLetterTest, // Send Letter Test Screen
  'DRWCSTAT': RouteKey.CollectionStatistics, // Collection Statistics
  'DRWSSTAT': RouteKey.SiteCollectionStatistics, // Site Collection Statistics (MLT-10976)
  'DNWDCOMM': RouteKey.NotificationLog, // Notification Log (Donor Communication)
  'DCQDCOMM': RouteKey.DonorCommunicationQuery, // Donor Communication Query (legacy)
  'DCOMQ': RouteKey.DonorCommunicationQuery, // Donor Communication Query
  'ADDDONOR': RouteKey.AddDonor, // Add Donor
  'MODKYDAT': RouteKey.ModifyDonor, // Modify Key Donor Data
  'VCONV': RouteKey.VistaLifeTrakConversionTable, // Vista-LifeTrak Conversion Table
  'DIRESET': RouteKey.VoidDonorInterface, // Void Donor Interface - Re-set Donor Interface Status Lab
  'AIIREINT': RouteKey.ReInterfaceDonorToLab, // Re-Interface Donor to Lab
  'REINTER': RouteKey.ReInterfaceDonorToLab, // Re-Interface Donor Data
  'CHKOFF': RouteKey.ChkOff, // Offline Product Check-In
  'DEFHOLDQ': RouteKey.DeferralsOnHoldQuery, // fcnId: 1208 - Deferrals on Hold Query
  'DEFREGIS': RouteKey.RegisterDeferral, // Register Deferral
  'DEFMAINT': RouteKey.UpdateDeferral, // Update Deferral Registration (DRUREDEF)
  'DONHOLDQ': RouteKey.DonationsOnHoldQuery, // fcnId: 1207 - Donations on Hold Query
  'AGPRICE': RouteKey.AntigenPricingMatrix, // Antigen Pricing Matrix
  'RQU2': RouteKey.ReleaseReturnedProductQuarantine, // Release Returned Product Quarantine (IMIRETRL)
  'GPPUNIT': RouteKey.MaintainGroupInterdictions, // Maintain Group Interdictions
  'DONNOTE': RouteKey.PrepareDonorNotification, // Prepare Donor Notification (DNINOTFY form)
  'AUTHLET': RouteKey.AuthorizeDonorNotification, // Authorize Donor Notification (DNINOTFY)
  'REGMAINT': RouteKey.UpdateDonationRegistration, // Update Donation Registration
  'PHY': RouteKey.MaintainPhysicianList, // fcnId: 1393 - Maintain Physician List
  'FILTERS': RouteKey.ValidFilters, // Valid Filters
  'LETQ': RouteKey.ViewDonorLetters, // View Donor Letters (DNQLETTR)
  'ATRCFG': RouteKey.SmartManufactureAttributeConfigurator, // Smart Manufacture Attribute Configurator
  'PRCONFG': RouteKey.PathogenReductionProcessConfiguration, // Pathogen Reduction Process Configuration
  'MDONQ': RouteKey.MultipleDonorsQuery, // Multiple Donors Query
  'CHECKEXQ': RouteKey.CheckInExceptionQuery, // Check-In Exception Query (MCQEXCPU)
  'DPAQ': RouteKey.DonorProfileAuditQuery, // Donor Profile Audit Query (DPQAUDIT)
  'DUPQ': RouteKey.PotentialDuplicateBatchQuery, // fcnId: 1333 - Potential Duplicate Batch Query
  'ATTRQ2': RouteKey.UnitComponentAttributesQuery, // Unit and Component Attributes Query
  'OBSQ': RouteKey.ResultsObservationsQuery, // Results Observations Query (TEQBNDR - Multiple Observation Testing)
  'ANTGGRP': RouteKey.SpAntigenGroupDefinitions, // SP' Antigen Group Definitions
  'MODBATCH': RouteKey.ModifyCheckInBatchDetails, // Modify Check-In Batch Details
  'RARITY': RouteKey.SpAntigenRarities, // SP' Antigen Rarities
  'DLABEL': RouteKey.DonorLabels, // First Time and Gallon Donor Labels
  'DTUBE': RouteKey.DeleteNonUnitTubes, // Delete Non-Unit Tubes (MCITMUN)
  'SNDHCLL': RouteKey.UnitTransferToTransfusionSystem, // Unit Transfer to Transfusion System (LTIHCLL)
  'ATTR': RouteKey.EnterProductAttributes, // Enter Product Attributes (IMIATTR)
  'COMPATT': RouteKey.EnterComponentAttributes, // Enter Component Attributes (CPIATTR)
  'AUATTR': RouteKey.EnterUnitAttributes, // Enter Unit Attributes (CPIUATTR)
  'LBWHIN': RouteKey.LabWarehouseCheckIn, // Lab Warehouse Check-In (CPIWHCIN)
  'AGQ': RouteKey.DonorRbcAgQueryEntry, // Donor RBC Ag Query - Entry page for donor ID input
  'CRYOMET': RouteKey.CryoMethods, // CRYO Methods
  'DISMTBAG': RouteKey.DiscardEmptyBags, // Discard Empty Bags - Routine Component Production
  'SPCQ': RouteKey.PlateControlsQuery, // fcnId: TBD - Plate Controls Query (TSQCNTRL)
  'UTQ': RouteKey.UnscheduledTestQuery, // fcnId: 4442 - Unscheduled Test Query
  'IULQ': RouteKey.InstrumentUploadLogQuery, // fcnId: 8461 - Instrument Upload Log Query
  'HOLDQ': RouteKey.TestBatchesInHoldingAreaQuery, // fcnId: 4327 - Test Batches in Holding Area Query
  'EQWS': RouteKey.MaintainValidEquipmentQcData, // Maintain Valid Equipment QC Data
  'RQU': RouteKey.ReleaseProductQuarantine, // Release Product Quarantine
  'SEP': RouteKey.SeparationTimes, // Separation Times - Routine Component Production (CPISEP)
  'SEPO': RouteKey.SeparationTimesOffline, // Separation Times: Offline - Routine Component Production (CPISEPM)
  'COMPENTI': RouteKey.ComponentsMadeFromUnitIsbt, // Components Made from Unit (ISBT) - Routine Component Production (CPICOM2)
  'SLINK': RouteKey.LinkUnitToSpecialDonation, // Link Unit to Special Donation - fcnId: 1391
  'SPREQ': RouteKey.RegisterSpecialDonationRequest, // Register Special Donation Request (SDIPATSG)
  'COMTYPE': RouteKey.DefineCommTypes, // Define Communication Types (VDICOMTP)
  'COMLET': RouteKey.DefineCommunicationLetters, // Define Communication Letters
  'DRWENTRY': RouteKey.DonationEntryDetails, // Donation Entry Details
  'DRWDEFRL': RouteKey.DefferalEntryDetails, // Deferral Entry Details
  'DRUDFAUD': RouteKey.DonationDeferralAuditDrawer, // Audit Donation/Deferral Entry Details
  'DRIDFAUD': RouteKey.DonationDeferralAuditDrawer, // Audit Deferral FCN code variant
  'DEFAUDIT': RouteKey.DonationDeferralAuditDrawer, // Audit Deferral - actual DB MNEMONIC value
  'DRWAUDIT': RouteKey.DonationDeferralAuditDrawer, // Audit Donation/Deferral Entry Details - alternate mnemonic
  'DPWHLDRN': RouteKey.DriveStatistics, // Drive Statistics
  'DNWELIGB': RouteKey.DonorEligibility, // Donor Eligibility & Attributes
  'SPUNITQ': RouteKey.SpecialDonationStatusQuery, // Special Donation Status Query - fcnId: 1413
  'REQUESTQ': RouteKey.HlaRbcRequestQuery, // HLA/RBC Request Query - View donor and inventory matches
  'REQUEST': RouteKey.EnterHlaRbcRequest, // Enter HLA/RBC Request - Enter and manage HLA/RBC requests for recipients
  'DEQ': RouteKey.DonorsByEventsQuery, // Donors by Events Query (DCIMULTD)
  'LBWHOUT': RouteKey.LabWarehouseCheckout, // Lab Warehouse Checkout - Transfer units/components between warehouses
  'REPORTS': RouteKey.ReportSubmission, // Report Submission (Menu Label - Alternative)
  'RMSUB': RouteKey.ReportSubmission, // Report Submission (Alternative Mnemonic)
  'LBWHRCL': RouteKey.ReconcileLabWarehouseBatch, // Reconcile Lab Warehouse Batch (CPIWHRCL)
  'WHRCL': RouteKey.ReconcileTransportBatch, // Reconcile Transport Batch (IMIWHRCL)
  'VOIDTB': RouteKey.VoidTestBatch, // Void Test Batch (LTIMTBVO)
  'VTUQ': RouteKey.VoidedTestsByUnitIdQuery, // Voided Tests by Unit ID Query (TEQUNTVD)
  'BAGS': RouteKey.BagCheckIn, // Bag Check-In (MCIBAGS)
  'TUBES': RouteKey.BagCheckInTube, // Tube Check-In (MCIATUBE) — tab 2 of Bag Check-In
  'DSCE': RouteKey.CheckInDetails,  // Check-In Details (MCISRCEN)
  'DSCE2': RouteKey.CheckInDetailsExtended, // Check-In Details - Extended Day Limit (MCISRCEN, no date restriction)
  'BATCHQ': RouteKey.CheckInBatchQueryWithUnitData, // Check in Batch Query with Unit Data (MCQUNBA4)
  'BATCHDQ': RouteKey.CheckInBatchDataQuery, // Check-In Batch Data Query (MCIBATCH/BATCHDQ)
  'BATCHEXQ': RouteKey.CheckInBatchExceptionQuery, // Check-In Batch Exception Query
  'LBWHQ': RouteKey.LabWarehouseTransferQuery, // Lab Warehouse Transfer Query (CPQWHSTA)
  'WHQ': RouteKey.TransportBatchQuery, // Transport Batch Query (IMQWHSTA)
  'NEBQ': RouteKey.NonExtractedBatchesQuery, // Non-Extracted Batches Query (RGQBTINT)
  'AUTOCKIN': RouteKey.TransferDonorDataToLab, // Transfer Data from Donor to Lab (MCIAUCKN)
  'MODDSC': RouteKey.ModifyUnit, // Modify Unit Check-In Details (MCISUP4)
  'MODSCD': RouteKey.ModifySddDetails, // Modify SDD Details (CPISDCM)
  'SDD': RouteKey.SterileDockingDefinition, // Sterile Docking Definition (Menu Mnemonic)
  'SDDDFN': RouteKey.SterileDockingDefinition, // Sterile Docking Definition (CPISDDFN)
  'MODSEP': RouteKey.ModifySeparationTimes, // Modify Separation Times - CPISEPDA
  'SPTT': RouteKey.PrintSpecialInstructionsTieTags, // Print Special Instructions Tie Tags - SDIADTAG
  'ADTT': RouteKey.PrintAutoDirectedTieTag, // Print Auto/Directed Tie Tag
  'SPIKE': RouteKey.Spike, // Spike a Component - FRISPIKE
  'PQU': RouteKey.PlaceProductQuarantine, // Place Product Quarantine
  'INVREJ': RouteKey.RejectInventoryProducts, // Reject Inventory Products (MLT-14071)
  'MOVEOUT': RouteKey.MoveOutdatesToOutdateLocation, // Move Outdates to Outdate Location (MLT-14066)
  'CHKDIS': RouteKey.CheckinDiscardProducts, // Checkin Discard Products to Inventory - IMICKDAV (MLT-12801)
  'PRODQ': RouteKey.ProductCurrentStatus, // Product Current Status - IMQUNITQ (MLT-14053)
  'PINTQ': RouteKey.InterdictedActiveStock, // Interdicted Active Stock (MLT-14152)
  'SALLO': RouteKey.SpecialOrderAllocation, // Special Order Allocation - Schedule Auto/Directed Order (MLT-14033)
  'RSTORE': RouteKey.RackDefinition, // Rack Definition - VSRCKDET
  'DSTORE': RouteKey.StorageDeviceDetails, // Storage Device Details - VSSTRDEV
  'PSTORE': RouteKey.ProductStorageDefinition, // Product Storage Definition - VSPRDSTR
  'OCQ': RouteKey.CustomerOrdersQuery, // Customer Orders Query - OEQPDORD (MLT-14025)
  'VERROR': RouteKey.VistaLifeTrakErrorLog, // Vista-LifeTrak Error Log (IDPQERMG)
  'APILOGL': RouteKey.LifeTrakApiLogInformationQuery, // LifeTrak API Log Information Query
  'COLLDATE': RouteKey.ChangeUnitCollectionDate, // fcnId: 8516 - Change Unit Collection Date (MCICOLDT)
  'DELUNIT': RouteKey.DeleteUnitInLabSystem, // Delete Unit in Lab System
  'MODTSCON': RouteKey.ModifyContractBatch, // Modify Contract for Hospital/Patient Batch (TSUOCON)
  'LICPROD': RouteKey.LicensedProducts, // Licensed Products (VLICPROD)
  'PRODUCT': RouteKey.ProductCodes, // Product Codes (VPRODUCT)
  'EDITSP': RouteKey.EditSpikingDetails, // Edit Spiking Details (FRIEDIT)
  'SUIT': RouteKey.VerifyComponentSuitability, // Verify Component Suitability (SUIT)
  'SUITO': RouteKey.VerifyComponentSuitabilityOffline, // Verify Component Suitability - Offline (FRISUITO)
  'DELSCD': RouteKey.DeleteSddWorksheetUnits, // Delete Units from SDD Worksheet - CPISDCV
  'CHKIN': RouteKey.CheckInFromLab, // Check-In from Lab (IMICKIN)
  'BATCH': RouteKey.LabBatchTransfer, // Check-In from Lab - Batch Process (IMIBATCH)
  'PRODCONV': RouteKey.ProductConversions, // Product Conversions (ISBT 'SP'/Codabar)
  'IMIRETN': RouteKey.HospitalReturns, // Hospital Returns (IMIRETN)
  'RETURN': RouteKey.HospitalReturns, // Hospital Returns - alternate mnemonic
  'REAG': RouteKey.CommitReagentsForComponent, // Commit Reagents for Component (FRIREAG)
  'REAGQ': RouteKey.TestKitReagentsQuery, // Test Kit Reagents Query
  'PRODPROC': RouteKey.ManageMatrixPheresis, // Product/Procedure Matrix - Pheresis (VPROCPRD)
  'RSP': RouteKey.ReleaseSpecialProcessing, // Release from Special Processing
  'DCONVERT': RouteKey.ReleaseStandingOrdersBatch, // Release Standing Orders - Batch Program (OEBSTORD)
  'CUSTIER': RouteKey.EnterCustomerTierPricing, // Enter Customer Tier Pricing (SACUSMAT)
  'TIER': RouteKey.EnterStandardTierPricing, // Enter Standard Tier Pricing
  'CDCAN': RouteKey.CancelDebitCreditAdvice, // Cancel Debit/Credit Advice
  'TSTORE': RouteKey.TrayDefinition, // Tray Definition
  'VSTATUS': RouteKey.VistaInterfaceStatus, // Vista Interface Status (MLT-11901)
  'ATTRMAT': RouteKey.ValidAttributesMatrix, // Valid Attributes Matrix (ISBT)
  'LBLOVR': RouteKey.VoidProductLabel, // Void Product Label into Hold
  'LBLUNQC': RouteKey.UnitLevelQcForLabeling, // Unit Level QC for Labeling
  'COMPQ': RouteKey.ComponentQuery, // Component Query (COMPQ)
  'QUQ': RouteKey.ProductsInQuarantine, // Products in Quarantine (MLT-14052)
  'PAGQ': RouteKey.ProductsWithAntigens, // Products with Antigens (MLT-14150)
  'AUTOQ': RouteKey.AutoDirProducts, // Products from Auto/Dir Donations (CPQAUTOS)
  'SPQ': RouteKey.SpecialProcessingQuery, // Special Processing Query (SPQ - FRQSP)
  'FRQSP': RouteKey.SpecialProcessingQuery, // Special Processing Query (FMB: FRQSP)
  'NOTEQ': RouteKey.NotesQuery, // Notes by Date Range Query
  'CHGBAGS': RouteKey.UpdateNumberOfBags, // Update Number of Bags for Components (CPIBAGSU)
  'CTROUT': RouteKey.ConfirmatorySampleTransferOut, // Confirmatory Sample Transfer Out (RGISMSHP)
  'REAGENT': RouteKey.AssignReagentsToTestBatch, // Assign Reagents to Test Batch/Worksheet (MLT-13361)
  'FINDU': RouteKey.FindUnitsAndProducts, // Find Units and Products (GNQPRDST)
  'CRXTRACT': RouteKey.ReExtractConfirmatoryTestResults, // Re-Extract Confirmatory Test Results (MLT-14234)
  'ODTOFF': RouteKey.RemovalFromOutdateList, // Removal from Outdate List
  'SUPLABLI': RouteKey.AboLabelingIsbtSuper, // ABO Labeling - ISBT - Super (LAILABE2)
  'AGLBL': RouteKey.AboLabelingAntigens, // ABO Labeling - Antigens (LAILABE2)
  'LABELI': RouteKey.AboLabelingIsbt, // ABO Labeling ISBT (LAILABE2)
  'REPLBL': RouteKey.ReprintLabels, // Reprint Labels (LAIRPINT)
  'INTSTRS': RouteKey.InstrumentTestResults, // Instrument Tests and Results - MLT-12476
  'VINTSTRS': RouteKey.InstrumentResults, // Instrument Test Results Detail - MLT-12476
  'TIERQ': RouteKey.CustomerProductTierPricingQuery, // Customer Product Tier Pricing Query (Mnemonic: TIERQ)
  'CUSTOMER': RouteKey.CustomerProfile, // Create Customer Profile (Mnemonic: CUSTOMER)
  'OUTDATE': RouteKey.GenerateOutdatesPicklist, // Generate Outdates Picklist (Mnemonic: OUTDATE)
  'IMIOUTDT': RouteKey.GenerateOutdatesPicklist, // Generate Outdates Picklist (FMB: IMIOUTDT)
  'FCODE': RouteKey.MasterServiceCodes, // Enter Master Service Codes
  'EDIT': RouteKey.EditTestResults, // Edit Test Results (MLT-12750)
  'PACK': RouteKey.PackProduct, // Pack Products (DSIMANPK)
  'CNSKIP': RouteKey.SkipConfirmatoryResultsForExtraction, // Skip Confirmatory Results for Extraction (RGCNFSKP)
  'RGRQC': RouteKey.ReleaseTestResults, // Release Test Results (QC testing)
  'EMGREL': RouteKey.EmergencyMedicalRelease, // Emergency Medical Release (MLT-12584, FMB: LAISUPER)
  'MOTTMFG': RouteKey.MultipleObservationTestTypesByMfg, // Multiple Observation Test Types by MFG (VTSTYPES)
  'ATS': RouteKey.AdditionalTestScheduling, // Additional Test Scheduling (LTIMSAT - Immediate Test Scheduling)
  'TESTQ': RouteKey.AllTestsForUnitQuery, // All Tests for a Unit Query (MLT-13511)
  'RESKIP': RouteKey.SkipResultsFromExtraction, // Skip Results from Extraction (RGIRSSKP)
  'TPARM': RouteKey.Tparm, // Valid Test Staging Parameters (VTSTPARM)
  'EXTRACT': RouteKey.ExtractTestResults, // Extract Test Results
  'REXTRACT': RouteKey.ReExtractTestResults, // Re-Extract Test Results (MLT-13419)
  'TRR': RouteKey.TestResultReconciliation, // Test Result Reconciliation (MLT-13502)
  'EIRC': RouteKey.EnterInterimResultCode, // Enter Interim Result Code
  'UNDEXT': RouteKey.ResetUnderExtract, // Reset Under Extract flag (RGUUNDER)
  'EQC1': RouteKey.Eqc1, // Enter Equipment QC Details - First Tech
  'IMPCORR': RouteKey.CorrectImportedUnitData, // Correct Imported Unit Data (IMUUNITS) - MLT-12626
  'IMPORT': RouteKey.ImportedBloodProductCheckin, // Imported Blood Product Check-In (IMCHKIN) - MLT-12611
  'LEVELQ': RouteKey.BloodCenterInventoryLevelQuery, // Blood Center Inventory Level Query (LEVELQ)
  'EQMAINT': RouteKey.EnterEquipmentDowntime, // Enter Equipment Downtime and Service Details (MLT-12629)
  'EQUIPDET': RouteKey.EnterEquipmentDetails, // Enter Equipment Details (MLT-12601)
  'EQMASTER': RouteKey.EnterEquipmentMasterCodes, // Enter Equipment Master Codes (Mnemonic: EQMASTER)
  'HTFM': RouteKey.HorizontalTestFileTestMapping, // Horizontal Test File Test Mapping
  'LEVEL': RouteKey.SetupInventoryLevelsForBloodCenter, // Setup Inventory Levels for Blood Center - fcnId: 5225
  'SHIPO': RouteKey.OfflineProductShipment, // Offline Product Shipment - fcnId: TBD
  'IATRQ': RouteKey.IsbtAttributeLookup, // ISBT New/Old Attribute Lookup Query (CPQALOOK)
  'LOOKQ': RouteKey.LookupAndPrintDonorCard, // Lookup and Print Donor Card (ONILKREG)
  'CHCLASS': RouteKey.ChangeInventoryClass, // Change Inventory Class (IMICLASS - MLT-14170)
  'CPIWEIGH': RouteKey.ModifyComponentWeight, // Modify Component Weight (CPIWEIGH/COMPWT)
  'COMPWT': RouteKey.ModifyComponentWeight, // Modify Component Weight - Alternative mnemonic
  'CIP': RouteKey.ConfigureInterdictionPlacement, // Configure Interdiction Placement
  'LINKL': RouteKey.LinkTestResults, // Link Test Results (FRILINK)
  'INVEST': RouteKey.InvestigateDuplicateDonorRecords, // Investigate Duplicate Donor Records
  'CRYO1': RouteKey.ScanUnitsForCryoProcessing, // Scan Units for CRYO Processing (CPICRYO)
  'CRYO2': RouteKey.EntryOfflineCryoDetails, // Entry and Offline CRYO Separation/Freeze Details
  'MODCRYO': RouteKey.ModifyCryoDetails, // Modify CRYO Details (CPIMCRYO)
  'DELCRYO': RouteKey.DeleteUnitsFromCryoWorksheet, // Delete Units from CRYO Worksheet
  'PENDCRY': RouteKey.CryoResultsQuery, // Pending Cryoprecipitate Query (CPQCRYOD)
  'LBLOVRQ': RouteKey.AboLabelOverrideQuery, // ABO Label Override Query (CPQLBOVD)
  'EQCHISTQ': RouteKey.QcHistoryQuery, // QC History Details Query
  'EQSUPQC': RouteKey.EditReconcileQcDetails, // Edit or Reconcile QC Details (EQIQCSUP)
  'EQSTATQ': RouteKey.EquipmentStatusAndHistoryQuery, // Equipment Status and History Query (EQQEQSTS)
  'EQSHISTQ': RouteKey.ServiceHistoryQuery, // Service History Query (EQQSRVCE)
  'EQMAINTQ': RouteKey.DowntimeHistoryQuery, // Downtime History Query (EQQMAINT)
  'WHIN': RouteKey.WarehouseCheckIn, // Warehouse Check-In
  'WHOUT': RouteKey.WarehouseCheckOut, // Warehouse Check-Out
  'CHLBP': RouteKey.ChangeLabelPrinter, // Change Label Printer (ASGLBLPT)
  'CDISBT': RouteKey.ReLabelCodabarUnitsToIsbtSchema, // Re-Label Codabar units to ISBT Schema (LAICDISB)
  'RKNPQ': RouteKey.ReagentKitNoPreQualification, // Reagent Kit (No Pre-Qualification) (LTIREAG)
  'RGQRY': RouteKey.ReagentQuery, // Reagent Query
  'STORE': RouteKey.EnterReagentsIntoRepository, // Enter Reagents into Repository
  'VSUPPL': RouteKey.ValidReagentSupplierCodes, // Valid Reagent Supplier Codes (MLT-13093)
  'VREAG': RouteKey.ValidReagentCodes, // Valid Reagent Codes (MLT-13221)
  'EGRPINT': RouteKey.PlaceGroupInterdiction, // Place Group Interdiction or Hold (MLT-12686)
  'UNTINT2': RouteKey.PlaceReleaseMultipleUnitInterdiction, // Place/Release Multiple Unit Interdiction (MLT-13197)
  'PLPIQ': RouteKey.PooledComponentQuery, // Pooled Component Query - By Pool ID (CPQPOOLC)
  'TSHIP': RouteKey.TubeCheckinShipment, // Tube Check-In / Shipment (TSHIP)
  'FRZ': RouteKey.FreezeStartTime, // Freeze Start Time (CPIFRZA)
  'FRZO': RouteKey.FreezeStartTimesOffline, // Freeze Start Times: Offline (fcnId: 4407)
  'MODFRZ': RouteKey.ModifyFreezeStartTime, // Modify Freeze Start Time
  'OBS2': RouteKey.VerifyTestObservationsTech2, // fcnId: 8696 - Verify Test Observations: Tech 2
  'PLCOUNT': RouteKey.EnterPheresisCount, // Enter Pheresis Count - MLT-13041
  'ORDER': RouteKey.EnterRegularOrder, // Enter Regular Order (OEIENTER)
  'CUSTORD': RouteKey.EnterSpecialOrder, // Enter Special/Custom Order (OEICUSTM)
  'SPECIAL': RouteKey.EnterSpecialOrder, // Enter Special Order
  'EXPORT': RouteKey.EnterExportOrder, // Enter Export Order
  'CANCEL': RouteKey.ChangeOrCancelOrder, // Change or Cancel Order (OEIALTER)
  'IELQ': RouteKey.InstrumentErrorLogQuery, // Instrument Error Log Query (TEQSYSER)
  'CONTR': RouteKey.InternalContract, // Internal Contract (MLT-13640)
  'STIN': RouteKey.SampleTransferIn, // Sample Transfer In (RGISMTIN)
  'APQ': RouteKey.AvailableProductsQuery, // Available Products Query (APQ)
  'MUNOTES': RouteKey.PlaceNotesOnMultipleUnits, // Place Notes on Multiple Units (GEUNOTES)
  'SAMPQ': RouteKey.SamplesQuery, // Samples Query (GEQSAMP)
  'MSTUBEQ': RouteKey.MissingTubesQuery, // Missing Tubes Query (RGQMSTUB)
  'BIPQ': RouteKey.BatchInProgressQuery, // Batch In-Progress Query (RGQEXRES)
  'RGTUBEQ': RouteKey.TubesCheckinQuery, // Tubes Check-In Query (RGQTUBES)
  'TUCOLDAT': RouteKey.ChangeTestingUnitCollectionDate, // Change Testing Unit Collection Date (TCICOLDT)
  'SUPEXRST': RouteKey.ResetExtractForParmBatchSample, // Reset Extract for Parm/Batch/Sample (SMUSUPR2)
  'SUPERDEL': RouteKey.DeleteRegionalSampleCheckinBatch, // Delete Regional Sample/Check-In Batch (SMUSUPR1)
  'TMAP': RouteKey.EnterTestsMapping, // Enter Tests Mapping (RGVTEST)
  'PHISTQ': RouteKey.UnitAndProductHistory, // Unit and Product History (IMQUHIST)
  'PRMGR': RouteKey.PathogenReductionManager, // Pathogen Reduction Manager (CPIPRMGR) - MLT-13050
  'LBLRSH': RouteKey.ResearchProductLabeling, // Research Product Labeling (LAIRESCH)
  'RMAP': RouteKey.EnterResultsMapping, // fcnId: 4354 - Enter Results Mapping (Regional Sample Tracking)
  'PACKO': RouteKey.OfflineProductPacking, // Offline Product Packing
  'RESTOCK': RouteKey.RestockUnshippedProducts, // Restock Unshipped Products
  'CNRQC': RouteKey.ConfirmatoryReleaseTestResults, // Confirmatory Release Test Results (CNRQC)
  'REJECT': RouteKey.RejectUnitComponent, // Reject Unit Component - Routine Component Production
  'RGCON': RouteKey.EnterRegionalTestingContract, // Enter Regional Testing Contract
  'RGICON': RouteKey.EnterRegionalTestingContract, // Enter Regional Testing Contract (alternate)
  'IRQ': RouteKey.InterimResultsQuery, // Interim Results Query (Regional Sample Tracking Queries)
  'VTBQ': RouteKey.VoidedTestsBatchQuery, // Voided Tests by Test Batch ID Query (TEQMTBVO)
  'SAMPTQ': RouteKey.SampleTransferOutNotCheckedInQuery, // Sample Transfer Out not Checked In Query (RGQCKPND)
  'STMAP': RouteKey.SampleTestLinkage, // Sample Test Linkage (VTESAMAP) - Confirmatory Administration
  'RCINT': RouteKey.ReleaseComponentInterdiction, // Release Component Interdiction (fcnId: 8256)
  'RGRPINT': RouteKey.ReleaseGroupInterdiction, // Release Group Interdiction or Hold (fcnId: 8337)
  'RCSYSINT': RouteKey.ReleaseComponentSystemInterdiction, // Release Component System Interdiction
  'SPQRY': RouteKey.SupplierQuery, // Supplier Query (RMQSPQRY),
  'STANDQ': RouteKey.StandingOrdersQuery, // Standing Orders Query (OEQSTORD)
  'DUMPI': RouteKey.FinanceInterfaceDetails, // Finance Interface Details
  'ANYLOTQ': RouteKey.AnyLotNumberQuery, // Any Lot Number Query
  'MORM': RouteKey.MultipleObservationResultMatrix, // Multiple Observation Result Matrix (VTBNDMAT)
  'VMOR': RouteKey.ValidMultipleObservationResults, // Valid Multiple Observation Results (VBNDRES)
  'MOF': RouteKey.MultipleObservationFields, // Multiple Observation Fields (VTSTBAND)
  'UNITQ': RouteKey.UnitQuery, // Unit Query - General Query Functions (CPQUNIT4)
  'UNITI': RouteKey.UnitInformation, // Unit Information - General Query Functions (CPQUNIT4)
  'RGMODBAT': RouteKey.MaintainBatchData, // Maintain Batch Data (RGIBATCH)
  'AUTO': RouteKey.ScheduleAutoDirectedOrder, // Schedule Auto/Directed Order (SHIADORD)
  'STANDO': RouteKey.EnterStandingOrder, // Enter Standing Order (OENSTORD)
  'CANCELTB': RouteKey.CancelTestBatch, // Cancel Test Batch in Holding Area (TEICANTB)
  'OFLOW': RouteKey.OrderProcessingStatus, // Order Processing Status (OEQOFLOW)
  'RGPROFQ': RouteKey.ContractProfileTestQuery, // Contract Profile Test Query (RGQTESTS)
  'ORDQ': RouteKey.OrderHistorySingleOrder, // Order History - Single Order
  'TXQ': RouteKey.ShipmentsInTransit, // Shipments in Transit
  'OBS1': RouteKey.EnterTestObservationsTech1, // Enter Test Observations: Tech 1 - Multiple Observation Testing
  'CLBOX': RouteKey.CloseBox, // Close Box - Distribution
  'BOXDTQ': RouteKey.BoxDetails, // Box Details Query - Distribution Queries
  'XMLLOG': RouteKey.XmlErrorLogFile, // XML Error Log file
  'VOIDCA': RouteKey.VoidCancelTestResults, // Void/SUPVOID/Cancel Test Results (LTIMVOCA)
  'DELCON': RouteKey.DeliveryConfirmation, // Delivery Confirmation
  'PHERI': RouteKey.EnterPheresisComponentsIsbt, // Enter Pheresis Components (ISBT)
  'TECH1': RouteKey.EnterControlValues, // Enter Control Values for Test Batch (TSIENTPM)
  'TSIENTPM': RouteKey.VerifyControlValuesForTestBatch, // Verify Control Values for Test Batch (Enter Test Parameters)
  'TECH2': RouteKey.VerifyControlValuesForTestBatch, // Verify Control Values for Test Batch (Tech2 mode)
  'AHTUBES': RouteKey.AdHocTubeCheckIn, // Ad Hoc Tube Check-In
  'NT': RouteKey.EnterNtResults, // Enter 'NT' Results (LTIMRENT)
  'LTIMRENT': RouteKey.EnterNtResults, // Enter 'NT' Results - alternate mnemonic
  'SHIP': RouteKey.ShipProducts, // Ship Products (SHIPMENT)
  'SHIPD': RouteKey.ShipDiscardSalvage, // Ship Discard and Salvage Products
  'CUO': RouteKey.CancelUnfilledOrders, // Cancel Unfilled Orders (SASYSCAN)
  'EDITOBS': RouteKey.EditTestObservationResults, // Edit Test Observation Results (LTIMTOBS)
  'TRANS1': RouteKey.InitiateHospitalTransfer, // Initiate Hospital Transfer
  'TRANS2': RouteKey.CloseHospitalTransfer, // Close Hospital Transfer
  'CHARGE': RouteKey.EnterOrderCharges, // Enter Order Charges
  'RECOBS': RouteKey.MultipleObservationReconciliation, // Multiple Observation Reconciliation
  'GENXML': RouteKey.RegenerateElectronicPlasmaFile, // Regenerate Electronic Plasma File - Oracle Forms: REGENXML
  'WKS': RouteKey.CreateTestBatchWorksheet, // Create Test Batch/Worksheet (LTIWKSHT)
  'TSTPARM': RouteKey.TestStagingParameters, // Define Critical Controls for Test (TSTPARM)
  'PACKOD': RouteKey.PackInvRejectsToDiscard, // Pack Inv Rejects to Discard (DSIPKOD)
  'PACKOS': RouteKey.PackInvRejectsToSalvage, // Pack Inv Rejects to Salvage (MLT-13875)
  'CEXTRACT': RouteKey.ConfirmatoryExtractTestResults, // Confirmatory Extract Test Results (CFIREXTR)
  'PACKRP': RouteKey.PackRecoveredPlasma, // Pack Recovered Plasma (PKREPCL - MLT-14014)
};

export const getRouteKeyForMenuItem = (item: MnemonicIdentifiable): RouteKey | undefined => {
  const routeKey = MNEMONIC_ROUTE_MAP[item.mnemonic];

  if (!routeKey && item.mnemonic) {
    console.warn(`Missing mnemonic mapping for: "${item.mnemonic}". Please add it to MNEMONIC_ROUTE_MAP.`);
  }

  return routeKey;
};
