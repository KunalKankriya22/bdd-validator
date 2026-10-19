import { Routes } from '@angular/router';
import { ChapterCreate } from './chapter/chapter-create/chapter-create';
import { ErrorCodes } from './error-codes/error-codes';
import { Donor as DonorErrorCodes } from './error-codes/donor/donor';
import { Lab as LabErrorCodes } from './error-codes/lab/lab';
import { Distribution as DistributionErrorCodes } from './error-codes/distribution/distribution';
import { InstitutionPageComponent } from './institutions/create-edit-institution/institution-page/institution-page';
import { ViewCodeType } from './donor-master-codes/code-type/view-code-type/view-code-type';
import { ViewCodeType as ViewDistributionCodeType } from './distribution-master-codes/code-type/view-code-type/view-code-type';
import { ViewLabCodeType } from './lab-master-codes/lab-master-codes/code-type/view-code-type/view-code-type';
import { FieldConfigurationComponent } from './donor-restricted-validations/find-donor-block/components/field-configuration/field-configuration';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';


const viewInstitutionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ViewInstitution].path,
  '/application-administration/common-validation'
);
const systemParameterPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SystemParameter].path,
  '/application-administration/common-validation'
);
const donorMasterCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorMasterCodes].path,
  '/application-administration/donor-restricted'
);
const donorInterdictionCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorInterdictionCodes].path,
  '/application-administration/donor-restricted'
);
const donProcConsentDefinitionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonProcConsentDefinition].path,
  '/application-administration/donor-restricted'
);
const distributionMasterCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DistributionMasterCodes].path,
  '/application-administration/distribution-restricted'
);
const validProductSubstitutionsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidProductSubstitution].path,
  '/application-administration/donor-restricted-validations'
);
const boxCapacityPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.BoxCapacity].path,
  '/application-administration/distribution-restricted'
);
const labMasterCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.LabMasterCodes].path,
  '/application-administration/lab-restricted'
);
const labInterdictionCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ViewInterdictionCodes].path,
  '/application-administration/lab-restricted'
);
const assignInterdictionClassPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AssignInterdictionClass].path,
  '/application-administration/lab-restricted'
);
const defineDonationTypesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineDonationTypes].path,
  '/application-administration/donor-restricted'
);
const defineDonationProceduresPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineDonationProcedures].path,
  '/application-administration/donor-restricted'
);
const drivesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.Drives].path,
  '/application-administration/lab-restricted'
);
const interdictionUpgradeMatrixPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.InterdictionUpgradeMatrix].path,
  '/application-administration/wellsky-restricted'
);
const returnReasonsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReturnReasons].path,
  '/application-administration/distribution-restricted'
);
const defineOrderChargesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineOrderCharges].path,
  '/application-administration/distribution-restricted'
);
const defineOperatorsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineOperators].path,
  '/application-administration/wellsky-restricted'
);
const aboProductCompatibilityPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AboProductCompatibility].path,
  '/application-administration/wellsky-restricted'
);
const aboValuesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AboValues].path,
  '/application-administration/wellsky-restricted'
);
const donorGradingMatrixPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorGradingMatrix].path,
  '/application-administration/wellsky-restricted'
);
const barCodeTranslationsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.BarCodeTranslations].path,
  '/application-administration/wellsky-restricted'
);
const registrationHoldsMappingPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RegistrationHoldsMapping].path,
  '/application-administration/donor-restricted-validations'
);
const defineProcedureGroupsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineProcedureGroups].path,
  '/application-administration/donor-restricted-validations'
);
const defineProcedureExclusionsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineProcedureExclusions].path,
  '/application-administration/donor-restricted-validations'
);
const validFacilityIdentifiersPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidFacilityIdentifiers].path,
  '/application-administration/donor-restricted-validations'
);

const venipunctureAttributesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VenipunctureAttributes].path,
  '/application-administration/donor-restricted-validations'
);

const userInterdictionClassPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.UserInterdictionClass].path,
  '/application-administration/lab-restricted'
);
const labelingInterdictionOverridePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.LabelingInterdictionOverride].path,
  '/application-administration/lab-restricted'
);

const daylightSavingsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DaylightSavings].path,
  '/application-administration/common-validation'
);

const cityStateZipQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CityStateZipQuery].path,
  '/application-administration/common-validation'
);

const emfProcessesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EmfProcesses].path,
  '/application-administration/common-validation'
);

const emfDefineProcessPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EmfDefineProcess].path,
  '/application-administration/common-validation'
);

const masterServiceCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MasterServiceCodes].path,
  '/application-administration/common-validation'
);

const donorDecisionCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorDecisionCodes].path,
  '/application-administration/donor-restricted'
);

const donorInterdictionOverrideTech2Path = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorInterdictionOverrideTech2].path,
  '/application-administration/donor-restricted'
);

const findDonorRoutineLogicPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.FindDonorRoutineLogic].path,
  '/application-administration/wellsky-restricted'
);

const defineDurationBetweenProceduresPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineDurationBetweenProcedures].path,
  '/application-administration/wellsky-restricted'
);

const maintainVehicleDetailsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainVehicleDetails].path,
  '/application-administration/wellsky-restricted'
);

const mobilePcLaptopRegisterPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MobilePcLaptopRegister].path,
  '/application-administration'
);

import { DaylightSavingsComponent } from './common-validation-table/daylight-savings/daylight-savings';

const defineProcedureCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineProcedureCodes].path,
  '/application-administration/donor-restricted-validations'
);

const associateNicknameToNamePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AssociateNicknameToName].path,
  '/application-administration/donor-restricted-validations'
);

const testConfigurationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.TestConfiguration].path,
  '/application-administration/donor-restricted-validations'
);

const validAboPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidAbo].path,
  '/application-administration/lab-restricted'
);
const antigenTestsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AntigenTests].path,
  '/application-administration/dist-restricted'
);

const inventoryProductTypesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.InventoryProductTypes].path,
  '/application-administration/lab-restricted'
);

const defineMaxDonationsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineMaxDonations].path,
  '/application-administration/donor-restricted-validations'
);

const definePhysicalFindingsValuesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefinePhysicalFindingsValues].path,
  '/application-administration/donor-restricted-validations'
);

const findDonorBlockPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.FindDonorBlock].path,
  '/application-administration/donor-restricted-validations'
);

const validProductSubstitutionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidProductSubstitution].path,
  '/application-administration/donor-restricted-validations'
);

const orderClassCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.OrderClassCodes].path,
  '/application-administration/distribution-restricted-validation'
);

const labInterdictionOverridePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.LabInterdictionOverride].path,
  '/application-administration/lab-restricted'
);
const additionalConfirmatoryTestScheduledPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AdditionalConfirmatoryTestScheduled].path,
  '/application-administration/lab-restricted'
);
const groupSitesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.GroupSites].path,
  '/application-administration/lab-restricted'
);

const labelingInterdictionOverrideQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.LabelingInterdictionOverrideQuery].path,
  '/application-administration/lab-restricted'
);

const poolMatrixPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PoolMatrix].path,
  '/application-administration/dist-restricted-validation-tables'
);

const validDonationTypeProcedureCodePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidDonationTypeProcedureCode].path,
  '/application-administration/lab-restricted-validation-tables'
);

const validDonationTypeProcedureCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidDonationTypeProcedureCode].path,
  '/application-administration/lab-restricted-validation-tables');

const donorInterdictionOverridePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorInterdictionOverride].path,
  '/application-administration/lab-restricted-validation-tables'
);

const donorInterdictionOverrideQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DonorInterdictionOverrideQuery].path,
  '/application-administration/lab-restricted-validation-tables'
);

const labelingConfigurationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.LabelingConfiguration].path,
  '/application-administration/lab-restricted-validation-tables'
);

const defineEligibleCellPlasmaLossPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DefineEligibleCellPlasmaLoss].path,
  '/application-administration/donor-restricted-validation-tables'
);

const validScanInterfacesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidScanInterfaces].path,
  '/application-administration/lab-restricted'
);

const validFfFlagsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidFfFlag].path,
  '/application-administration/lab-restricted'
);

const tparmPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.Tparm].path,
  '/application-administration/lab-restricted'
);

const customerPreferredTierPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CustomerPreferredTier].path,
  '/application-administration/customer-administration'
);

export const APPLICATION_ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'common-validation', pathMatch: 'full' },

  {
    path: 'common-validation',
    children: [
      { path: '', redirectTo: 'view-institution', pathMatch: 'full' },
      {
        path: viewInstitutionPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ViewInstitution].loadComponent,
      },
      { path: 'create', component: InstitutionPageComponent },
      { path: 'edit', component: InstitutionPageComponent },
      {
        path: systemParameterPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.SystemParameter].loadComponent,
      },
      {
        path: daylightSavingsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DaylightSavings].loadComponent,
      },
      {
        path: cityStateZipQueryPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.CityStateZipQuery].loadComponent,
      },
      {
        path: emfProcessesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.EmfProcesses].loadComponent,
      },
      {
        path: 'emf-processes/mappings/:code',
        loadComponent: () => import('./common-validation-table/emf-processes/view-edit-mappings/process-code-mappings/process-code-mappings').then(m => m.ProcessCodeMappingsComponent)
      },
      {
        path: emfDefineProcessPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.EmfDefineProcess].loadComponent,
      },
      {
        path: masterServiceCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.MasterServiceCodes].loadComponent,
      }
    ]
  },

  {
    path: 'donor-restricted',
    children: [
      {
        path: donorInterdictionCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorInterdictionCodes].loadComponent,
      },
      {
        path: donorMasterCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorMasterCodes].loadComponent,
      },
      {
        path: donProcConsentDefinitionPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonProcConsentDefinition].loadComponent
      },
      {
        path: defineDonationTypesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineDonationTypes].loadComponent,
      },
      {
        path: defineDonationProceduresPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineDonationProcedures].loadComponent,
      },
      {
        path: donorDecisionCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorDecisionCodes].loadComponent,
      },
      {
        path: donorInterdictionOverrideTech2Path,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorInterdictionOverrideTech2].loadComponent,
      },
      { path: 'code-type/:code', component: ViewCodeType }
    ]
  },

  {
    path: 'lab-restricted',
    children: [
      {
        path: labMasterCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.LabMasterCodes].loadComponent,
      },
      { path: 'code/:code', component: ViewLabCodeType },
      {
        path: labInterdictionCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ViewInterdictionCodes].loadComponent,
      },
      {
        path: assignInterdictionClassPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.AssignInterdictionClass].loadComponent,
      },
      {
        path: groupSitesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.GroupSites].loadComponent,
      },
      {
        path: drivesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.Drives].loadComponent,
      },
      {
        path: userInterdictionClassPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.UserInterdictionClass].loadComponent,
      },
      {
        path: validAboPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidAbo].loadComponent,
      },
      {
        path: labelingInterdictionOverridePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.LabelingInterdictionOverride].loadComponent,
      },
      {
        path: labInterdictionOverridePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.LabInterdictionOverride].loadComponent,
      },
      {
        path: additionalConfirmatoryTestScheduledPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.AdditionalConfirmatoryTestScheduled].loadComponent,
      },
      {
        path: inventoryProductTypesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.InventoryProductTypes].loadComponent,
      },
      {
        path: labelingInterdictionOverrideQueryPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.LabelingInterdictionOverrideQuery].loadComponent,
      },
      {
        path: validScanInterfacesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidScanInterfaces].loadComponent,
      },
      {
        path: validFfFlagsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidFfFlag].loadComponent,
      },
      {
        path: tparmPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.Tparm].loadComponent,
      }
    ]
  },

  {
    path: 'distribution-restricted',
    children: [
      {
        path: distributionMasterCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DistributionMasterCodes].loadComponent,
      },
      { path: 'code-type/:code', component: ViewDistributionCodeType },
      {
        path: boxCapacityPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.BoxCapacity].loadComponent,
      },
      {
        path: returnReasonsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ReturnReasons].loadComponent,
      },
      {
        path: defineOrderChargesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineOrderCharges].loadComponent,
      }
    ]
  },

  {
    path: 'customer-administration',
    children: [
      {
        path: customerPreferredTierPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.CustomerPreferredTier].loadComponent,
      }
    ]
  },

  { path: 'create-chapter', component: ChapterCreate },
  { path: 'edit-chapter/:chapterId', component: ChapterCreate },

  {
    path: 'wellsky-restricted/error-codes',
    component: ErrorCodes,
    children: [
      { path: '', redirectTo: 'donor', pathMatch: 'full' },
      { path: 'donor', component: DonorErrorCodes },
      { path: 'lab', component: LabErrorCodes },
      { path: 'distribution', component: DistributionErrorCodes }
    ]
  },

  {
    path: 'wellsky-restricted',
    children: [
      {
        path: interdictionUpgradeMatrixPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.InterdictionUpgradeMatrix].loadComponent,
      },
      {
        path: defineOperatorsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineOperators].loadComponent,
      },
      {
        path: aboProductCompatibilityPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.AboProductCompatibility].loadComponent,
      },
      {
        path: donorGradingMatrixPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorGradingMatrix].loadComponent,
      },
      {
        path: barCodeTranslationsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.BarCodeTranslations].loadComponent,
      },
      {
        path: aboValuesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.AboValues].loadComponent,
      },
      {
        path: findDonorRoutineLogicPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.FindDonorRoutineLogic].loadComponent,
      },
      {
        path: defineDurationBetweenProceduresPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineDurationBetweenProcedures].loadComponent,
      },
      {
        path: maintainVehicleDetailsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.MaintainVehicleDetails].loadComponent,
      }
    ]
  },

  {
    path: 'dist-restricted',
    children: [
      {
        path: antigenTestsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.AntigenTests].loadComponent,
      }
    ]
  },

  {
    path: 'donor-restricted-validations',
    children: [
      {
        path: registrationHoldsMappingPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.RegistrationHoldsMapping].loadComponent,
      },
      {
        path: venipunctureAttributesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.VenipunctureAttributes].loadComponent,
      },
      {
        path: defineProcedureGroupsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineProcedureGroups].loadComponent,
      },
      {
        path: defineProcedureExclusionsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineProcedureExclusions].loadComponent,
      },
      {
        path: defineProcedureCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineProcedureCodes].loadComponent,
      },
      {
        path: validFacilityIdentifiersPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidFacilityIdentifiers].loadComponent,
      },
      {
        path: validProductSubstitutionsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidProductSubstitution].loadComponent,
      },
      {
        path: associateNicknameToNamePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.AssociateNicknameToName].loadComponent,
      },
      {
        path: validProductSubstitutionPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidProductSubstitution].loadComponent,
      },
      {
        path: testConfigurationPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.TestConfiguration].loadComponent,
        children: [
          {
            path: '',
            redirectTo: 'lab-tests',
            pathMatch: 'full'
          },
          {
            path: 'lab-tests',
            loadComponent: () => import('./donor-restricted-validations/test-configuration/lab-tests/lab-tests').then(m => m.LabTestsComponent)
          },
          {
            path: 'donor-tests',
            loadComponent: () => import('./donor-restricted-validations/test-configuration/donor-tests/donor-tests').then(m => m.DonorTestsComponent)
          },
          {
            path: 'override-rules',
            loadComponent: () => import('./donor-restricted-validations/test-configuration/override-rules/override-rules').then(m => m.OverrideRulesComponent)
          }
        ]
      },
      {
        path: defineMaxDonationsPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineMaxDonations].loadComponent,
      },
      {
        path: definePhysicalFindingsValuesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefinePhysicalFindingsValues].loadComponent,
      },
      {
        path: findDonorBlockPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.FindDonorBlock].loadComponent,
      },
      {
        path: `${findDonorBlockPath}/field-configuration/:programName`,
        component: FieldConfigurationComponent
      }
    ]
  },
  {
    path: 'distribution-restricted-validation',
    children: [
      {
        path: orderClassCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.OrderClassCodes].loadComponent,
      }
    ]
  },
  {
    path: 'dist-restricted-validation-tables',
    children: [
      {
        path: poolMatrixPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.PoolMatrix].loadComponent,
      }
    ]
  },
  {
    path: 'lab-restricted-validation-tables',
    children: [
      {
        path: validDonationTypeProcedureCodePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidDonationTypeProcedureCode].loadComponent,
      },
      {
        path: validDonationTypeProcedureCodesPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidDonationTypeProcedureCode].loadComponent,
      },
      {
        path: donorInterdictionOverridePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorInterdictionOverride].loadComponent,
      },
      {
        path: donorInterdictionOverrideQueryPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorInterdictionOverrideQuery].loadComponent,
      },
      {
        path: labelingConfigurationPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.LabelingConfiguration].loadComponent,
        children: [
          { path: '', redirectTo: 'bar-code', pathMatch: 'full' },
          {
            path: 'bar-code',
            loadComponent: () => import('./lab-restricted-validation-tables/labeling-configuration/bar-code/bar-code').then(m => m.BarCodeComponent)
          },
          {
            path: 'product-type-prioritization',
            loadComponent: () => import('./lab-restricted-validation-tables/labeling-configuration/product-type-prioritization/product-type-prioritization').then(m => m.ProductTypePrioritizationComponent)
          },
          {
            path: 'recovered-plasma-test',
            loadComponent: () => import('./lab-restricted-validation-tables/labeling-configuration/recovered-plasma-test/recovered-plasma-test').then(m => m.RecoveredPlasmaTestComponent)
          },
          {
            path: 'test-message-mapping',
            loadComponent: () => import('./lab-restricted-validation-tables/labeling-configuration/test-message-mapping/test-message-mapping').then(m => m.TestMessageMappingComponent)
          },
          {
            path: 'rbc-antigen-product-type',
            loadComponent: () => import('./lab-restricted-validation-tables/labeling-configuration/rbc-antigen-product-type/rbc-antigen-product-type').then(m => m.RbcAntigenProductTypeComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'donor-restricted-validation-tables',
    children: [
      {
        path: defineEligibleCellPlasmaLossPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.DefineEligibleCellPlasmaLoss].loadComponent,
      }
    ]
  },

  // Drive Equipment Parameters
  {
    path: 'donor-restricted-validation-tables/drive-equipment-parms',
    loadComponent: () => import('./drive-equipment-parameters/drive-equipment-parameters').then(m => m.DriveEquipmentParameters),
    children: [
      { path: '', redirectTo: 'drive-profile', pathMatch: 'full' },
      {
        path: 'drive-profile',
        loadComponent: () => import('./drive-equipment-parameters/drive-profile/drive-profile-table/drive-profile-table').then(m => m.DriveProfileTable)
      },
      {
        path: 'qc-parameters',
        loadComponent: () => import('./drive-equipment-parameters/qc-parameters/qc-parameters-table/qc-parameters-table').then(m => m.QcParametersTable)
      },
      {
        path: 'qc-dependency',
        loadComponent: () => import('./drive-equipment-parameters/qc-dependency/qc-dependency-table/qc-dependency-table').then(m => m.QcDependencyTable)
      },
      {
        path: 'physical-equipment',
        loadComponent: () => import('./drive-equipment-parameters/physical-equipment/physical-equipment-table/physical-equipment-table').then(m => m.PhysicalEquipmentTable)
      }
    ]
  },

  // Mobile PC Laptop Register
  {
    path: mobilePcLaptopRegisterPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MobilePcLaptopRegister].loadComponent,
  },
];