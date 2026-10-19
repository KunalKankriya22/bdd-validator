import { Routes } from '@angular/router';
import { LabDonorInterfaceLogQueryComponent } from './labeling-functions/donor-functions/recruitment/recruitment-general-functions/donor-interfaces/lab-donor-interface-log-query/lab-donor-interface-log-query';
import { LabInterfaceResultsComponent } from './labeling-functions/donor-functions/recruitment/recruitment-general-functions/donor-interfaces/lab-interface-results/lab-interface-results';
import { DefineDayStatusCodesComponent } from './labeling-functions/donor-functions/recruitment/recruitment-administration/define-day-status-codes/define-day-status-codes';
import { ComponentProductManagementComponent } from './component-production/component-product-management/component-product-management';
import { SpecialProcessingMasterCodesComponent } from './component-production/special-processing-master-codes/special-processing-master-codes';
import { PrePrintedProductLabelsComponent } from './component-production/pre-printed-product-labels/pre-printed-product-labels.component';
import { PreLabelFrozenIsbtComponent } from './labeling-functions/pre-label-frozen-isbt/pre-label-frozen-isbt.component';
import { ValidPoolAboValuesComponent } from './component-production/valid-pool-abo-values/valid-pool-abo-values.component';
import { DeletePooledComponentsComponent } from './component-production/delete-pooled-components/delete-pooled-components';
import { PreparePooledComponentsComponent } from './component-production/prepare-pooled-components/prepare-pooled-components.component';
import { ComponentDeleteComponent } from '../../features/laboratory/component-delete/component-delete.component';
import { ResetUnderExtractComponent } from '../../features/laboratory/undext/reset-under-extract.component';
import { QcForLabelingComponent } from '../../features/laboratory/qc-for-labeling/qc-for-labeling.component';
import { RecheckProductsFromInventoryComponent } from './component-production/recheck-products-from-inventory/recheck-products-from-inventory';
import { ProductTypeAttributesComponent } from './component-production/component-administration/product-type-attributes/product-type-attributes.component';
import { ProductTypeDataComponent } from './component-production/component-administration/product-type-data/product-type-data.component';
import { ValidAttributesMatrixComponent } from './component-production/component-administration/valid-attributes-matrix/valid-attributes-matrix.component';
import { AttributeExpirationDateOverrideComponent } from './component-production/component-administration/attribute-expiration-date-override/attribute-expiration-date-override.component';
import { SpecialProcessingWorkflowsComponent } from './component-production/special-processing-workflows/special-processing-workflows';
import { SpecialProcessingAntigenGroupingAndRarityComponent } from './component-production/special-processing-antigen-grouping-and-rarity/special-processing-antigen-grouping-and-rarity';
import { SpAntigenGroupingAndRarityComponent } from './component-production/component-administration/sp-antigen-grouping-and-rarity/sp-antigen-grouping-and-rarity';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';
import { equipmentQcDataGuard } from './maintain-valid-equipment-qc-data/guards/equipment-qc-data.guard';
import { reagentKitNoPreQualGuard } from './testing-modules/reagent-qualification/reagent-kit-no-pre-qualification/reagent-kit-no-pre-qualification.guard';
import { testTypesByMfgGuard } from './testing-modules/multiple-observation-testing/multiple-observation-test-types-by-mfg/test-types-by-mfg.guard';
import { ValidFiltersComponent } from './component-production/valid-filters/valid-filters.component';
import { CheckInExceptionQuery } from './material-check-in/check-in-queries/check-in-exception-query/check-in-exception-query';
import { SmartManufactureAttributeConfiguratorComponent } from './component-production/smart-manufacture-attribute-configurator/smart-manufacture-attribute-configurator';
import { UnitComponentAttributesQueryComponent } from './component-production/component-queries/unit-component-attributes-query/unit-component-attributes-query.component';
import { DeleteNonUnitTubesComponent } from './material-check-in/check-in-maintenance-functions/delete-non-unit-tubes/delete-non-unit-tubes';
import { ChangeUnitCollectionDateComponent } from './material-check-in/check-in-maintenance-functions/change-unit-collection-date/change-unit-collection-date.component';
import { DeleteUnitInLabSystemComponent } from './material-check-in/check-in-maintenance-functions/delete-unit-in-lab-system/delete-unit-in-lab-system.component';
import { CryoMethodsComponent } from './component-production/component-administration/cryo-methods/cryo-methods.component';
import { AttributeCodesComponent } from './component-production/component-administration/attribute-codes/attribute-codes.component';
import { ConvertModifyComponentsComponent } from './component-production/cmci/convert-modify-components';
import { ProductConversionsComponent } from './component-production/component-administration/product-conversions/product-conversions';
import { ProcessStagesComponent } from './component-production/component-administration/process-stages/process-stages';
import { LabWarehouseCheckoutComponent } from './material-check-in/general-check-In/lab-warehouse-checkout/lab-warehouse-checkout';
import { LabWarehouseCheckInComponent } from './material-check-in/general-check-in-functions/lab-warehouse-check-in/lab-warehouse-check-in';
import { ReconcileLabWarehouseBatchComponent } from './material-check-in/general-check-in-functions/lbwhrcl/reconcile-lab-warehouse-batch';
import { ReconcileTransportBatchComponent } from './material-check-in/general-check-in-functions/imiwhrcl/reconcile-transport-batch';
import { SpikeComponent } from './component-production/spike/spike';
import { VerifyComponentSuitabilityOfflineComponent } from './component-production/verify-component-suitability-offline/verify-component-suitability-offline';
import { VerifyComponentSuitability } from './component-production/suit/verify-component-suitability';
import { BagCheckInComponent } from './material-check-in/general-check-in-functions/bag-check-in/bag-check-in';
import { EditSpikingDetailsComponent } from './component-production/special-component-processing/edit-spiking-details/edit-spiking-details';
import { CheckInDetailsComponent } from './material-check-in/general-check-in-functions/check-in-details/check-in-details';
import { TransferDonorDataToLabComponent } from './material-check-in/general-check-in-functions/transfer-donor-data-to-lab/transfer-donor-data-to-lab';
import { transferDonorDataToLabGuard } from './material-check-in/general-check-in-functions/transfer-donor-data-to-lab/transfer-donor-data-to-lab.guard';
import { TubeCheckinShipmentComponent } from './material-check-in/general-check-in-functions/tube-checkin-shipment/tube-checkin-shipment';
import { ModifySddDetailsComponent } from './component-production/component-modification/modify-sdd-details/modify-sdd-details';
import { SterileDockingDefinitionComponent } from './component-production/sterile-docking-definition/sterile-docking-definition.component';
import { ReleaseSpecialProcessingComponent } from './component-production/release-special-processing/release-special-processing.component';
import { ViewCatalogComponent } from './component-production/valid-catalog-numbers/view-catalog/view-catalog';
import { UpdateNumberOfBagsComponent } from './component-production/pheresis-processing/update-number-of-bags/update-number-of-bags';
import { EnterPheresisCountComponent } from './component-production/pheresis-processing/enter-pheresis-count/enter-pheresis-count';
import { EnterPheresisComponentsIsbtComponent } from './component-production/pheresis-processing/enter-pheresis-components-isbt/enter-pheresis-components-isbt.component';
import { PathogenReductionProcessConfigurationComponent } from './component-production/pathogen-reduction/pathogen-reduction-process-configuration/pathogen-reduction-process-configuration';
import { PathogenReductionManagerComponent } from './component-production/pathogen-reduction/pathogen-reduction-manager/pathogen-reduction-manager.component';
import { SkipResultsFromExtractionComponent } from './sample-management/skip-results-from-extraction/skip-results-from-extraction';
import { ModifyPooledComponentsComponent } from './component-production/modify-pooled-components/modify-pooled-components';
import { EntryOfflineCryoDetailsComponent } from './component-production/cryo-production/entry-offline-cryo-details/entry-offline-cryo-details';
import { ModifyCryoDetailsComponent } from './component-production/cryo-production/modify-cryo-details/modify-cryo-details.component';
import { modifyCryoDetailsGuard } from './component-production/cryo-production/modify-cryo-details/guards/modify-cryo-details.guard';
import { ResultsObservationsQueryComponent } from './testing-modules/multiple-observation-testing/results-observations-query/results-observations-query.component';

const horizontalTestFileTestMappingPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.HorizontalTestFileTestMapping].path,
  '/laboratory-functions',
);

const enterHlaResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterHlaResults].path,
  '/laboratory-functions',
);

const modifyCheckInBatchDetailsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ModifyCheckInBatchDetails].path,
  '/laboratory-functions',
);

const voidTestBatchPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VoidTestBatch].path,
  '/laboratory-functions',
);

const createTestBatchWorksheetPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CreateTestBatchWorksheet].path,
  '/laboratory-functions',
);

const voidedTestsByUnitIdQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VoidedTestsByUnitIdQuery].path,
  '/laboratory-functions',
);

const voidedTestsBatchQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VoidedTestsBatchQuery].path,
  '/laboratory-functions',
);

const checkInBatchQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CheckInBatchQueryWithUnitData].path,
  '/laboratory-functions',
);

const hospitalReturnsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.HospitalReturns].path,
  '/laboratory-functions',
);

const manageMatrixPheresisPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ManageMatrixPheresis].path,
  '/laboratory-functions',
);

const checkInBatchDataQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CheckInBatchDataQuery].path,
  '/laboratory-functions',
);

const discardEmptyBagsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.DiscardEmptyBags].path,
  '/laboratory-functions',
);

const rejectUnitComponentPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RejectUnitComponent].path,
  '/laboratory-functions',
);

const releaseProductQuarantinePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReleaseProductQuarantine].path,
  '/laboratory-functions',);
const separationTimesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SeparationTimes].path,
  '/laboratory-functions',
);

const freezeStartTimesOfflinePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.FreezeStartTimesOffline].path,
  '/laboratory-functions',
);

const separationTimesOfflinePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SeparationTimesOffline].path,
  '/laboratory-functions',
);

const rbcAntigenQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.RbcAntigenQuery].path,
  '/laboratory-functions',
);

const testBatchDetailsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.TestBatchDetailsQuery].path,
  '/laboratory-functions',
);

const validCollectionFacilitiesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ValidCollectionFacilities].path,
  '/laboratory-functions',
);
const enterInterimResultCodePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterInterimResultCode].path,
  '/laboratory-functions',
);
const releaseComponentInterdictionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReleaseComponentInterdiction].path,
    '/laboratory-functions',
);
const releaseGroupInterdictionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReleaseGroupInterdiction].path,
    '/laboratory-functions',
);

const releaseComponentSystemInterdictionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReleaseComponentSystemInterdiction].path,
  '/laboratory-functions',
);

const antqlPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.Antql].path,
  '/laboratory-functions',
);

const verifyTestObservationsTech2Path = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VerifyTestObservationsTech2].path,
  '/laboratory-functions',
);

const resultsExtractQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ResultsExtractQuery].path,
  '/laboratory-functions',
);

const addInterdictionForUnitsNotCheckedPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AddInterdictionForUnitsNotChecked].path,
  '/laboratory-functions',
);

const enterTestObservationsTech1Path = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterTestObservationsTech1].path,
  '/laboratory-functions',
);

const processStagesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ProcessStages].path,
  '/laboratory-functions/component-production/component-administration',
);

const editTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EditTestResults].path,
  '/laboratory-functions',
);

const voidProductLabelPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.VoidProductLabel].path,
  '/laboratory-functions/labeling-functions',
);

const assignReagentsToTestBatchPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AssignReagentsToTestBatch].path,
  '/laboratory-functions',
);

const skipConfirmatoryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SkipConfirmatoryResultsForExtraction].path,
  '/laboratory-functions',
);

const reExtractConfirmatoryTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReExtractConfirmatoryTestResults].path,
  '/laboratory-functions',
);

const emergencyMedicalReleasePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EmergencyMedicalRelease].path,
  '/laboratory-functions/labeling-functions',
);
const multipleObservationTestTypesByMfgPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MultipleObservationTestTypesByMfg].path,
  '/laboratory-functions/testing-modules/multiple-observation-testing',
);

const additionalTestSchedulingPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AdditionalTestScheduling].path,
  '/laboratory-functions',
);

const antigenResultEntryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AntigenResultEntry].path,
  '/laboratory-functions',
);

const sampleTransferInPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SampleTransferIn].path,
  '/laboratory-functions',
);

const skipResultsFromExtractionPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SkipResultsFromExtraction].path,
  '/laboratory-functions',
);

const allTestsForUnitQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AllTestsForUnitQuery].path,
  '/laboratory-functions',
);

const extractTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ExtractTestResults].path,
  '/laboratory-functions',
);

const reExtractTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReExtractTestResults].path,
  '/laboratory-functions',
);

const reagentKitNoPreQualificationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReagentKitNoPreQualification].path,
  '/laboratory-functions/testing-modules/reagent-qualification'
);

const eqc1Path = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.Eqc1].path,
  '/laboratory-functions',
);


const aboLabelingIsbtSuperPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AboLabelingIsbtSuper].path,
  '/laboratory-functions',
);

const aboLabelingAntigensPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AboLabelingAntigens].path,
  '/laboratory-functions',
);

const aboLabelingIsbtPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AboLabelingIsbt].path,
  '/laboratory-functions',
);

const reprintLabelsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ReprintLabels].path,
  '/laboratory-functions',
);

const correctImportedUnitDataPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.CorrectImportedUnitData].path,
  '/laboratory-functions',
);

const importedBloodProductCheckinPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ImportedBloodProductCheckin].path,
  '/laboratory-functions',
);

const importedBloodContractPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ImportedBloodContract].path,
  '/laboratory-functions',
);

const notationCodeConfigurationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.NotationCodeConfiguration].path,
  '/laboratory-functions',
);


const plateControlsQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.PlateControlsQuery].path,
  '/laboratory-functions',
);

const unscheduledTestQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.UnscheduledTestQuery].path,
  '/laboratory-functions',
);

const instrumentTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.InstrumentTestResults].path,
  '/laboratory-functions',
);

const instrumentResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.InstrumentResults].path,
  '/laboratory-functions',
);


const enterComponentAttributesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterComponentAttributes].path,
  '/laboratory-functions',
);

const enterUnitAttributesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterUnitAttributes].path,
  '/laboratory-functions',
);

const componentsMadeFromUnitIsbtPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ComponentsMadeFromUnitIsbt].path,
  '/laboratory-functions',
);

const modifyComponentWeightPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ModifyComponentWeight].path,
  '/laboratory-functions/component-production',
);

const modifyFreezeStartTimePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ModifyFreezeStartTime].path,
  '/laboratory-functions/component-production',
);

const testSeriesConfigurationPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.TestSeriesConfiguration].path,
  '/laboratory-functions',
);

const configureInterdictionPlacementPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ConfigureInterdictionPlacement].path,
  '/laboratory-functions',
);

const nonExtractedBatchesQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.NonExtractedBatchesQuery].path,
  '/laboratory-functions',
);

const maintainValidEquipmentQcDataPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.MaintainValidEquipmentQcData].path,
  '/laboratory-functions',
);

const confirmatoryReleaseTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ConfirmatoryReleaseTestResults].path,
  '/laboratory-functions',
);

const supplierQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.SupplierQuery].path,
  '/laboratory-functions',
);

const testStagingParametersPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.TestStagingParameters].path,
  '/laboratory-functions',
);

import { CheckInBatchExceptionQueryComponent } from './material-check-in/check-in-queries/check-in-batch-exception-query/check-in-batch-exception-query';
import { LabWarehouseTransferQuery } from './material-check-in/check-in-queries/lab-warehouse-transfer-query/lab-warehouse-transfer-query';

const enterNtResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterNtResults].path,
  '/laboratory-functions',
);

const enterEquipmentDowntimePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterEquipmentDowntime].path,
  '/laboratory-functions',
);

const enterEquipmentDetailsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterEquipmentDetails].path,
  '/laboratory-functions',
);

const enterEquipmentMasterCodesPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterEquipmentMasterCodes].path,
  '/laboratory-functions',
);

const enterRegionalTestingContractPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.EnterRegionalTestingContract].path,
  '/laboratory-functions',
);

const confirmatoryExtractTestResultsPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.ConfirmatoryExtractTestResults].path,
  '/laboratory-functions',
);

export const LABORATORY_FUNCTIONS_ROUTES: Routes = [
  { path: '', redirectTo: 'labeling-functions', pathMatch: 'full' },
  {
    path: 'release-test-results',
    loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseTestResults].loadComponent,
  },
  {
    path: additionalTestSchedulingPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AdditionalTestScheduling].loadComponent,
  },
  {
    path: antigenResultEntryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AntigenResultEntry].loadComponent,
  },
  {
    path: testSeriesConfigurationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.TestSeriesConfiguration].loadComponent,
  },
  {
    path: enterInterimResultCodePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterInterimResultCode].loadComponent,
  },
  {
    path: eqc1Path,
    loadComponent: ROUTE_REGISTRY[RouteKey.Eqc1].loadComponent,
  },
  {
    path: aboLabelingIsbtSuperPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AboLabelingIsbtSuper].loadComponent,
  },
  {
    path: aboLabelingAntigensPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AboLabelingAntigens].loadComponent,
  },
  {
    path: aboLabelingIsbtPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AboLabelingIsbt].loadComponent,
  },
  {
    path: reprintLabelsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReprintLabels].loadComponent,
  },
  {
    path: enterEquipmentDowntimePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterEquipmentDowntime].loadComponent,
  },
  {
    path: enterEquipmentDetailsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterEquipmentDetails].loadComponent,
  },
  {
    path: enterEquipmentMasterCodesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterEquipmentMasterCodes].loadComponent,
  },
  {
    path: plateControlsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.PlateControlsQuery].loadComponent,
  },
  {
    path: unscheduledTestQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.UnscheduledTestQuery].loadComponent,
  },
  {
    path: instrumentTestResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.InstrumentTestResults].loadComponent,
  },
  {
    path: instrumentResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.InstrumentResults].loadComponent,
  },
  {
    path: configureInterdictionPlacementPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ConfigureInterdictionPlacement].loadComponent,
  },
  {
    path: enterHlaResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterHlaResults].loadComponent,
  },
  {
    path: rbcAntigenQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RbcAntigenQuery].loadComponent,
  },
  {
    path: testBatchDetailsQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.TestBatchDetailsQuery].loadComponent,
  },
  {
    path: antqlPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.Antql].loadComponent,
  },
  {
    path: resultsExtractQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ResultsExtractQuery].loadComponent,
  },
  {
    path: 'enter-results-mapping',
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterResultsMapping].loadComponent,
  },
  {
    path: confirmatoryReleaseTestResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ConfirmatoryReleaseTestResults].loadComponent,
  },
  {
    path: addInterdictionForUnitsNotCheckedPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AddInterdictionForUnitsNotChecked].loadComponent,
  },
  {
    path: modifyCheckInBatchDetailsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ModifyCheckInBatchDetails].loadComponent,
  },
  {
    path: voidTestBatchPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.VoidTestBatch].loadComponent,
  },
  {
    path: createTestBatchWorksheetPath,
    loadComponent:
      ROUTE_REGISTRY[RouteKey.CreateTestBatchWorksheet].loadComponent,
  },
  {
    path: voidedTestsByUnitIdQueryPath,
    loadComponent:
      ROUTE_REGISTRY[RouteKey.VoidedTestsByUnitIdQuery].loadComponent,
  },
  {
    path: voidedTestsBatchQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.VoidedTestsBatchQuery].loadComponent,
  },
  {
    path: checkInBatchQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CheckInBatchQueryWithUnitData].loadComponent,
  },
  {
    path: hospitalReturnsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.HospitalReturns].loadComponent,
  },
  {
    path: manageMatrixPheresisPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ManageMatrixPheresis].loadComponent,
  },
  {
    path: checkInBatchDataQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CheckInBatchDataQuery].loadComponent,
  },
  {
    path: discardEmptyBagsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.DiscardEmptyBags].loadComponent,
  },
  {
    path: rejectUnitComponentPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.RejectUnitComponent].loadComponent,
  },
  {
    path: releaseProductQuarantinePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseProductQuarantine].loadComponent,
  },
  {
    path: separationTimesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SeparationTimes].loadComponent,
  },
  {
    path: editTestResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EditTestResults].loadComponent,
  },
  {
    path: enterNtResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterNtResults].loadComponent,
  },
  {
    path: reExtractConfirmatoryTestResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReExtractConfirmatoryTestResults].loadComponent,
  },
  {
    path: skipResultsFromExtractionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SkipResultsFromExtraction].loadComponent,
  },
  {
    path: freezeStartTimesOfflinePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.FreezeStartTimesOffline].loadComponent,
  },
  {
    path: extractTestResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ExtractTestResults].loadComponent,
  },
  {
    path: reExtractTestResultsPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReExtractTestResults].loadComponent,
  },
  {
    path: validCollectionFacilitiesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ValidCollectionFacilities].loadComponent,
  },
  {
    path: releaseComponentInterdictionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseComponentInterdiction].loadComponent,
  },
  {
    path: releaseGroupInterdictionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseGroupInterdiction].loadComponent,
   },
   {
     path: releaseComponentSystemInterdictionPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseComponentSystemInterdiction].loadComponent,
  },
  {
    path: enterComponentAttributesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterComponentAttributes].loadComponent,
  },
  {
    path: enterUnitAttributesPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterUnitAttributes].loadComponent,
  },
  {
    path: componentsMadeFromUnitIsbtPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ComponentsMadeFromUnitIsbt].loadComponent,
  },
  {
    path: verifyTestObservationsTech2Path,
    loadComponent: ROUTE_REGISTRY[RouteKey.VerifyTestObservationsTech2].loadComponent,
  },
  {
    path: separationTimesOfflinePath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SeparationTimesOffline].loadComponent,
  },
  {
    path: enterTestObservationsTech1Path,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterTestObservationsTech1].loadComponent,
  },
  {
    path: testStagingParametersPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.TestStagingParameters].loadComponent,
  },

  {
    path: 'labeling-functions',
    children: [
      {
        path: voidProductLabelPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.VoidProductLabel].loadComponent,
      },
      {
        path: emergencyMedicalReleasePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.EmergencyMedicalRelease].loadComponent,
      },
      {
        path: 'labeling-queries',
        children: [
          {
            path: 'abo-label-override-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.AboLabelOverrideQuery].loadComponent,
          },
        ],
      },
      {
        path: 'common-labeling-functions',
        children: [
          {
            path: 'change-label-printer',
            loadComponent: ROUTE_REGISTRY[RouteKey.ChangeLabelPrinter].loadComponent,
          },
          {
            path: 're-label-codabar-units-to-isbt-schema',
            loadComponent: ROUTE_REGISTRY[RouteKey.ReLabelCodabarUnitsToIsbtSchema].loadComponent,
          },
        ],
      },
      {
        path: 'special-labeling-functions',
        children: [
          {
            path: 'link-test-results',
            loadComponent: ROUTE_REGISTRY[RouteKey.LinkTestResults].loadComponent,
          },
          {
            path: 'research-product-labeling',
            loadComponent: ROUTE_REGISTRY[RouteKey.ResearchProductLabeling].loadComponent,
          },
        ],
      },
      {
        path: 'donor-functions',
        children: [
          {
            path: 'recruitment',
            children: [
              {
                path: 'recruitment-general-functions',
                children: [
                  {
                    path: 'donor-interfaces',
                    children: [
                      {
                        path: 'lab-donor-interface-log-query',
                        component: LabDonorInterfaceLogQueryComponent,
                      },
                      {
                        path: 'lab-interface-results',
                        component: LabInterfaceResultsComponent,
                      },
                    ],
                  },
                ],
              },
              {
                path: 'recruitment-administration',
                children: [
                  {
                    path: 'define-day-status-codes',
                    component: DefineDayStatusCodesComponent,
                  },
                ],
              },
              {
                path: 'hla/rbc/hla/rbc-general-functions/hla/rbc-request-query',
                loadComponent: ROUTE_REGISTRY[RouteKey.HlaRbcRequestQuery].loadComponent,
              },
            ],
          },
        ],
      },
      {
        path: 'pre-label-frozen-product',
        component: PreLabelFrozenIsbtComponent,
      },
      {
        path: 'special-labeling-functions/unit-level-qc-for-labeling',
        loadComponent: ROUTE_REGISTRY[RouteKey.UnitLevelQcForLabeling].loadComponent,
      },
    ],
  },

  {
    path: 'sample-management',
    children: [
      {
        path: 'regional-sample-tracking',
        children: [
          {
            path: 'tubes-check-in',
            loadComponent: ROUTE_REGISTRY[RouteKey.TubesCheckIn].loadComponent,
          },
          {
            path: 'regional-sample-tracking-functions/place-notes-on-multiple-units',
            loadComponent: ROUTE_REGISTRY[RouteKey.PlaceNotesOnMultipleUnits].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/batch-in-progress-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.BatchInProgressQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-functions/regional-sample-mgmt-supervisory/change-testing-unit-collection-date',
            loadComponent: ROUTE_REGISTRY[RouteKey.ChangeTestingUnitCollectionDate].loadComponent,
          },
          {
            path: 'regional-sample-tracking-functions/regional-sample-mgmt-supervisory/reset-extract-for-parm-batch-sample',
            loadComponent: ROUTE_REGISTRY[RouteKey.ResetExtractForParmBatchSample].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/samples-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.SamplesQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/interim-results-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.InterimResultsQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/missing-tubes-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.MissingTubesQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/tubes-checkin-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.TubesCheckinQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/contract-profile-test-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.ContractProfileTestQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-functions/regional-sample-mgmt-supervisory/delete-regional-sample',
            loadComponent: ROUTE_REGISTRY[RouteKey.DeleteRegionalSampleCheckinBatch].loadComponent,
          },
        ]
      },
      {
        path: 'hospital-patient-testing-functions',
        children: [
          {
            path: 'hospital-patient-contract-profile-tests',
            loadComponent: ROUTE_REGISTRY[RouteKey.HospitalPatientContractProfileTests].loadComponent,
          },
          {
            path: 'hospital-patient-ad-hoc-testing-contract',
            loadComponent: ROUTE_REGISTRY[RouteKey.HospitalPatientAdHocTestingContract].loadComponent,
          },
          {
            path: 'hospital-patient-testing-contract',
            loadComponent: ROUTE_REGISTRY[RouteKey.HospitalPatientTestingContract].loadComponent,
          },
          {
            path: 'fixed-profile-tube-check-in',
            loadComponent: ROUTE_REGISTRY[RouteKey.FixedProfileTubeCheckIn].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/interim-results-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.InterimResultsQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/samples-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.SamplesQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/missing-tubes-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.MissingTubesQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/tubes-checkin-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.TubesCheckinQuery].loadComponent,
          },
          {
            path: 'regional-sample-tracking-queries/contract-profile-test-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.ContractProfileTestQuery].loadComponent,
          },
        ],
      },
      {
        path: 'confirmatory-sample-management/confirmatory-queries',
        children: [
          {
            path: 'sample-transfer-out-not-checked-in-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.SampleTransferOutNotCheckedInQuery].loadComponent,
          },
        ],
      },
      {
        path: 'confirmatory-sample-management/confirmatory-administration',
        children: [
          {
            path: 'sample-test-linkage',
            loadComponent: ROUTE_REGISTRY[RouteKey.SampleTestLinkage].loadComponent,
          },
        ],
      },
      {
        path: 'confirmatory-sample-management',
        children: [
          {
            path: 'confirmatory-general-functions',
            children: [
              {
                path: removePathPrefix(
                  ROUTE_REGISTRY[RouteKey.SampleTransferIn].path,
                  '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions'
                ),
                loadComponent: ROUTE_REGISTRY[RouteKey.SampleTransferIn].loadComponent,
              },
              {
                path: removePathPrefix(
                  ROUTE_REGISTRY[RouteKey.ConfirmatoryExtractTestResults].path,
                  '/laboratory-functions/sample-management/confirmatory-sample-management/confirmatory-general-functions'
                ),
                loadComponent: ROUTE_REGISTRY[RouteKey.ConfirmatoryExtractTestResults].loadComponent,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    path: 'material-check-in',
    children: [
      {
        path: 'general-check-in-functions',
        children: [
          {
            path: 'lab-warehouse-check-in',
            component: LabWarehouseCheckInComponent,
          },
          {
            path: 'lab-warehouse-checkout',
            component: LabWarehouseCheckoutComponent,
          },
          {
            path: 'lbwhrcl',
            component: ReconcileLabWarehouseBatchComponent,
          },
          {
            path: 'imiwhrcl',
            component: ReconcileTransportBatchComponent,
          },
          {
            path: 'bag-check-in',
            children: [
              { path: '', component: BagCheckInComponent, pathMatch: 'full' },
              { path: 'tube', component: BagCheckInComponent },
            ],
          },
          {
            path: 'check-in-details',
            component: CheckInDetailsComponent,
          },
          {
            path: 'check-in-details-extended',
            component: CheckInDetailsComponent,
            data: { extendedDayLimit: true },
          },
          {
            path: 'transfer-donor-data-to-lab',
            component: TransferDonorDataToLabComponent,
            canDeactivate: [transferDonorDataToLabGuard],
          },
          {
            path: 'tube-checkin-shipment',
            component: TubeCheckinShipmentComponent,
          },
        ],
      },
      {
        path: 'check-in-maintenance-functions',
        children: [
          {
            path: 'delete-non-unit-tubes',
            component: DeleteNonUnitTubesComponent,
          },
          {
            path: 'change-unit-collection-date',
            component: ChangeUnitCollectionDateComponent,
          },
          {
            path: 'delete-unit-in-lab-system',
            component: DeleteUnitInLabSystemComponent,
          },
          {
            path: 'modify-contract-batch',
            loadComponent: () =>
              import(
                './material-check-in/check-in-maintenance-functions/modify-contract-batch/modify-contract-batch.component'
              ).then((m) => m.ModifyContractBatchComponent),
          },
        ],
      },
    ],
  },

  {
    path: 'material-check-in',
    children: [
      {
        path: 'check-in-queries',
        children: [
          {
            path: 'check-in-batch-exception-query',
            component: CheckInBatchExceptionQueryComponent,
          },
          {
            path: 'lab-warehouse-transfer-query',
            component: LabWarehouseTransferQuery,
          },
        ],
      },
    ],
  },

  {
    path: 'component-production',
    children: [
      {
        path: 'catalog-view/:catalogNumber/:manufacturer',
        component: ViewCatalogComponent,
      },
      {
        path: 'valid-catalog-numbers',
        component: ComponentProductManagementComponent,
        pathMatch: 'full',
      },
      {
        path: 'lot-details-for-bags',
        component: ComponentProductManagementComponent,
        pathMatch: 'full',
      },
      {
        path: 'special-processing-master-codes',
        component: SpecialProcessingMasterCodesComponent,
      },
      {
        path: 'spike',
        component: SpikeComponent,
      },
      {
        path: 'pre-printed-product-labels',
        component: PrePrintedProductLabelsComponent,
      },
      {
        path: 'valid-pool-abo-values',
        component: ValidPoolAboValuesComponent,
      },
      {
        path: 'product-combinations',
        loadComponent: ROUTE_REGISTRY[RouteKey.ProductCombinations].loadComponent,
      },
      {
        path: 'delete-pooled-components',
        component: DeletePooledComponentsComponent,
      },
      {
        path: 'prepare-pooled-components',
        component: PreparePooledComponentsComponent,
      },
      {
        path: 'modify-pooled-components',
        component: ModifyPooledComponentsComponent,
      },
      {
        path: 'cryo-production/entry-offline-cryo-details',
        component: EntryOfflineCryoDetailsComponent,
      },
      {
        path: 'cryo-production/modify-cryo-details',
        component: ModifyCryoDetailsComponent,
        canDeactivate: [modifyCryoDetailsGuard],
      },
      {
        path: 'cryo-production/delete-units-from-cryo-worksheet',
        loadComponent: ROUTE_REGISTRY[RouteKey.DeleteUnitsFromCryoWorksheet].loadComponent,
      },
      {
        path: removePathPrefix(
          ROUTE_REGISTRY[RouteKey.ScanUnitsForCryoProcessing].path,
          '/laboratory-functions/component-production/'
        ),
        loadComponent: ROUTE_REGISTRY[RouteKey.ScanUnitsForCryoProcessing].loadComponent,
      },
      {
        path: 'component-delete',
        component: ComponentDeleteComponent,
      },
      {
        path: 'undext',
        component: ResetUnderExtractComponent,
      },
      {
        path: 'qc-for-labeling',
        component: QcForLabelingComponent,
      },
      {
        path: 'recheck-products-from-inventory',
        component: RecheckProductsFromInventoryComponent,
      },
      {
        path: 'valid-filters',
        component: ValidFiltersComponent,
      },
      {
        path: 'smart-manufacture-attribute-configurator',
        component: SmartManufactureAttributeConfiguratorComponent,
      },
      {
        path: 'pathogen-reduction/pathogen-reduction-process-configuration',
        loadComponent: ROUTE_REGISTRY[RouteKey.PathogenReductionProcessConfiguration].loadComponent,
      },
      {
        path: 'component-queries',
        children: [
          {
            path: 'unit-component-attributes-query',
            component: UnitComponentAttributesQueryComponent,
          },
          {
            path: 'component-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.ComponentQuery].loadComponent,
          },
          {
            path: 'quq',
            loadComponent: ROUTE_REGISTRY[RouteKey.ProductsInQuarantine].loadComponent,
          },
          {
            path: 'auto-dir-products',
            loadComponent: ROUTE_REGISTRY[RouteKey.AutoDirProducts].loadComponent,
          },
          {
            path: 'isbt-attribute-lookup',
            loadComponent: ROUTE_REGISTRY[RouteKey.IsbtAttributeLookup].loadComponent,
          },
          {
            path: 'special-processing-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.SpecialProcessingQuery].loadComponent,
          },
          {
            path: 'pooled-component-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.PooledComponentQuery].loadComponent,
          },
          {
            path: 'cryo-results',
            loadComponent: ROUTE_REGISTRY[RouteKey.CryoResultsQuery].loadComponent,
          },
        ],
      },
      {
        path: 'special-processing-antigen-grouping-and-rarity',
        children: [
          {
            path: 'groups',
            component: SpecialProcessingAntigenGroupingAndRarityComponent,
          },
          {
            path: 'rarities',
            component: SpecialProcessingAntigenGroupingAndRarityComponent,
          },
          {
            path: '',
            redirectTo: 'groups',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'special-component-processing',
        children: [
          {
            path: 'enter-note-for-special-processing',
            loadComponent: ROUTE_REGISTRY[RouteKey.EnterNoteForSpecialProcessing].loadComponent,
          },
          {
            path: 'edit-spiking-details',
            component: EditSpikingDetailsComponent,
          },
          {
            path: 'commit-reagents-for-component',
            loadComponent: ROUTE_REGISTRY[RouteKey.CommitReagentsForComponent].loadComponent,
          },
          {
            path: 'convert-component-into-spiked-bag',
            loadComponent: ROUTE_REGISTRY[RouteKey.ConvertComponentIntoSpikedBag].loadComponent,
          },
          {
            path: 'enter-component-differential',
            loadComponent: ROUTE_REGISTRY[RouteKey.EnterComponentDifferential].loadComponent,
          },
        ],
      },
      {
        path: 'release-special-processing',
        loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseSpecialProcessing].loadComponent,
      },
      {
        path: 'component-administration',
        children: [
          {
            path: 'product-type-data',
            component: ProductTypeDataComponent,
          },
          {
            path: 'product-type-attributes',
            component: ProductTypeAttributesComponent,
          },
          {
            path: 'default-product-code-attributes',
            loadComponent: () =>
              import('../../features/laboratory/prdtyat/prdtyat.component').then(
                (m) => m.PrdtyatComponent
              ),
          },
          {
            path: 'valid-attributes-matrix',
            component: ValidAttributesMatrixComponent,
          },
          {
            path: 'attribute-expiration-date-override',
            component: AttributeExpirationDateOverrideComponent,
          },
          {
            path: 'cryo-methods',
            component: CryoMethodsComponent,
          },
          {
            path: 'attribute-codes',
            component: AttributeCodesComponent,
          },
          {
            path: 'product-conversions',
            component: ProductConversionsComponent,
          },
          {
            path: processStagesPath,
            component: ProcessStagesComponent,
          },
          {
            path: 'licensed-products',
            loadComponent: ROUTE_REGISTRY[RouteKey.LicensedProducts].loadComponent,
          },
          {
            path: 'sp-antigen-grouping-and-rarity',
            children: [
              {
                path: 'antigen-group',
                component: SpAntigenGroupingAndRarityComponent,
              },
              {
                path: 'antigen-rarity',
                component: SpAntigenGroupingAndRarityComponent,
              },
              {
                path: '',
                redirectTo: 'antigen-group',
                pathMatch: 'full',
              },
            ],
          },
          {
            path: 'product-codes',
            children: [
              {
                path: '',
                loadComponent: ROUTE_REGISTRY[RouteKey.ProductCodes].loadComponent,
              },
              {
                path: ':productCode',
                loadComponent: () => import('./component-production/component-administration/product-codes/product-code-view/product-code-view').then(m => m.ProductCodeViewComponent),
              }
            ]
          },
        ],
      },
      {
        path: 'component-modification',
        children: [
          {
            path: 'modify-sdd-details',
            component: ModifySddDetailsComponent,
          },
          {
            path: 'sterile-docking-definition',
            component: SterileDockingDefinitionComponent,
          },
          {
            path: 'delete-sdd-worksheet-units',
            loadComponent: ROUTE_REGISTRY[RouteKey.DeleteSddWorksheetUnits].loadComponent,
          },
          {
            path: 'modify-separation-times',
            loadComponent: ROUTE_REGISTRY[RouteKey.ModifySeparationTimes].loadComponent,
          },
        ],
      },
      {
        path: 'cmci',
        component: ConvertModifyComponentsComponent,
      },
      {
        path: 'special-processing-workflows',
        children: [
          {
            path: 'products',
            component: SpecialProcessingWorkflowsComponent,
          },
          {
            path: 'stages',
            component: SpecialProcessingWorkflowsComponent,
          },
          {
            path: '',
            redirectTo: 'products',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'verify-component-suitability-offline',
        component: VerifyComponentSuitabilityOfflineComponent,
      },
      {
        path: 'suit',
        component: VerifyComponentSuitability,
      },
      {
        path: 'pheresis-processing',
        children: [
          {
            path: 'update-number-of-bags',
            component: UpdateNumberOfBagsComponent,
          },
          {
            path: 'enter-pheresis-count',
            component: EnterPheresisCountComponent,
          },
        ],
      },
      {
        path: 'pathogen-reduction',
        children: [
          {
            path: 'pathogen-reduction-process-configuration',
            component: PathogenReductionProcessConfigurationComponent,
          },
          {
            path: 'pathogen-reduction-manager',
            component: PathogenReductionManagerComponent,
          },
        ],
      },
      {
        path: modifyComponentWeightPath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ModifyComponentWeight].loadComponent,
      },
      {
        path: modifyFreezeStartTimePath,
        loadComponent: ROUTE_REGISTRY[RouteKey.ModifyFreezeStartTime].loadComponent,
      },
    ],
  },
  {
    path: 'regional-sample-tracking',
    children: [
      {
        path: 'confirmatory-sample-transfer-out',
        loadComponent: ROUTE_REGISTRY[RouteKey.ConfirmatorySampleTransferOut].loadComponent,
      },
      {
        path: 'confirmatory-sample-transfer-out/edit-units-in-box',
        loadComponent: () =>
          import(
            './regional-sample-tracking/confirmatory-sample-transfer-out/edit-units-in-box/edit-units-in-box.component'
          ).then((m) => m.EditUnitsInBoxComponent),
      },
    ],
  },

  {
    path: assignReagentsToTestBatchPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AssignReagentsToTestBatch].loadComponent,
  },
  
  {
    path: sampleTransferInPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SampleTransferIn].loadComponent,
  },

  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.AdHocTubeCheckIn].path,
      '/laboratory-functions',
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.AdHocTubeCheckIn].loadComponent,
  },

  {
    path: 'component-production',
    children: [
      {
        path: 'pheresis-processing',
        children: [
          {
            path: 'enter-pheresis-components-isbt',
            component: EnterPheresisComponentsIsbtComponent,
          },
        ],
      },
    ],
  },

  {
    path: 'attributes-and-interdictions',
    children: [
      {
        path: 'enter-component-attributes',
        loadComponent: ROUTE_REGISTRY[RouteKey.EnterComponentAttributes].loadComponent,
      },
      {
        path: 'enter-component-interdiction',
        loadComponent: ROUTE_REGISTRY[RouteKey.EnterComponentInterdiction].loadComponent,
      },
      {
        path: 'interdiction-query',
        loadComponent: ROUTE_REGISTRY[RouteKey.LabInterdictionQuery].loadComponent,
      },
      {
        path: 'release-component-hold',
        loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseComponentHold].loadComponent,
      },
      {
        path: 'release-unit-system-interdiction',
        loadComponent: ROUTE_REGISTRY[RouteKey.ReleaseUnitSystemInterdiction].loadComponent,
      },
      {
        path: 'component-notes',
        loadComponent: ROUTE_REGISTRY[RouteKey.ComponentNotes].loadComponent,
      },
    ],
  },
  {
    path: horizontalTestFileTestMappingPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.HorizontalTestFileTestMapping].loadComponent,
  },

  {
    path: maintainValidEquipmentQcDataPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainValidEquipmentQcData].loadComponent,
    canDeactivate: [equipmentQcDataGuard],
  },

  {
    path: 'material-check-in',
    children: [
      {
        path: 'check-in-queries',
        children: [
          {
            path: 'check-in-exception-query',
            component: CheckInExceptionQuery,
          },
        ],
      },
    ],
  },

  {
    path: skipConfirmatoryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SkipConfirmatoryResultsForExtraction].loadComponent,
  },
  {
    path: 'testing-modules',
    children: [
      {
        path: 'multiple-observation-testing',
        children: [
          {
            path: 'edit-test-observation-results',
            loadComponent: ROUTE_REGISTRY[RouteKey.EditTestObservationResults].loadComponent,
          },
          {
            path: multipleObservationTestTypesByMfgPath,
            loadComponent: ROUTE_REGISTRY[RouteKey.MultipleObservationTestTypesByMfg].loadComponent,
            canDeactivate: [testTypesByMfgGuard],
          },
          {
            path: 'multiple-observation-reconciliation',
            loadComponent: () =>
              import(
                './testing-modules/multiple-observation-testing/multiple-observation-reconciliation/multiple-observation-reconciliation'
              ).then((m) => m.MultipleObservationReconciliationComponent),
          },
        ],
      },
    ],
  },
  {
    path: allTestsForUnitQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.AllTestsForUnitQuery].loadComponent,
  },

  // Test Result Reconciliation - added for MLT-13502
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.TestResultReconciliation].path,
      '/laboratory-functions'
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.TestResultReconciliation].loadComponent,
  },

  {
    path: 'testing-modules',
    children: [
      {
        path: 'reagent-qualification',
        children: [
          {
            path: reagentKitNoPreQualificationPath,
            loadComponent: ROUTE_REGISTRY[RouteKey.ReagentKitNoPreQualification].loadComponent,
            canDeactivate: [reagentKitNoPreQualGuard],
          },
        ],
      },
      {
        path: 'test-staging-parameters/verify-control-values',
        loadComponent: ROUTE_REGISTRY[RouteKey.VerifyControlValuesForTestBatch].loadComponent,
      },
    ],
  },

  {
    path: correctImportedUnitDataPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.CorrectImportedUnitData].loadComponent,
  },
  {
    path: importedBloodProductCheckinPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ImportedBloodProductCheckin].loadComponent,
  },

  {
    path: importedBloodContractPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.ImportedBloodContract].loadComponent,
  },

  {
    path: notationCodeConfigurationPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.NotationCodeConfiguration].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DeleteComponentAttributes].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.DeleteComponentAttributes].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DeleteUnitAttributes].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.DeleteUnitAttributes].loadComponent,
  },
  {
    path: nonExtractedBatchesQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.NonExtractedBatchesQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.QcHistoryQuery].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.QcHistoryQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.EquipmentStatusAndHistoryQuery].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.EquipmentStatusAndHistoryQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.ServiceHistoryQuery].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.ServiceHistoryQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DowntimeHistoryQuery].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.DowntimeHistoryQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.EditReconcileQcDetails].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.EditReconcileQcDetails].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.ReagentQuery].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.ReagentQuery].loadComponent,
  },
  {
    path: removePathPrefix(ROUTE_REGISTRY[RouteKey.ValidReagentSupplierCodes].path, '/laboratory-functions'),
    loadComponent: ROUTE_REGISTRY[RouteKey.ValidReagentSupplierCodes].loadComponent,
  },
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.PlaceGroupInterdiction].path,
      '/laboratory-functions'
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.PlaceGroupInterdiction].loadComponent,
  },
  {
    path: 'attributes-and-interdictions/place-release-multiple-unit-interdiction',
    loadComponent: () =>
      import(
        './attributes-and-interdictions/place-release-multiple-unit-interdiction/place-release-multiple-unit-interdiction'
      ).then((m) => m.PlaceReleaseMultipleUnitInterdiction),
  },
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.ValidAdditionalTests].path,
      '/laboratory-functions'
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.ValidAdditionalTests].loadComponent,
  },
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.EnterReagentsIntoRepository].path,
      '/laboratory-functions'
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterReagentsIntoRepository].loadComponent,
  },
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.ValidRemoteTestingLabs].path,
      '/laboratory-functions'
    ),
    children: [
      {
        path: '',
        loadComponent: ROUTE_REGISTRY[RouteKey.ValidRemoteTestingLabs].loadComponent,
      },
      {
        path: 'add',
        loadComponent: () =>
          import(
            './testing/testing-administration/valid-remote-testing-labs/add-edit-facility-panel/add-edit-facility-panel.component'
          ).then((m) => m.AddEditFacilityPanelComponent),
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import(
            './testing/testing-administration/valid-remote-testing-labs/add-edit-facility-panel/add-edit-facility-panel.component'
          ).then((m) => m.AddEditFacilityPanelComponent),
      },
    ],
  },
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.FreezeStartTime].path,
      '/laboratory-functions'
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.FreezeStartTime].loadComponent,
  },
  {
    path: 'instrument-error-log-query',
    title: 'Instrument Error Log Query',
    loadComponent: ROUTE_REGISTRY[RouteKey.InstrumentErrorLogQuery].loadComponent,
  },

  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.EnterTestsMapping].path,
      '/laboratory-functions'
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterTestsMapping].loadComponent,
  },

  // General Query Functions
  {
    path: 'general-query-functions',
    children: [
      {
        path: 'any-lot-number-query',
        loadComponent: ROUTE_REGISTRY[RouteKey.AnyLotNumberQuery].loadComponent,
      },
    ],
  },

  // Testing Modules
  {
    path: 'testing-modules',
    children: [
      {
        path: 'multiple-observation-testing',
        children: [
          {
            path: 'results-observations-query',
            component: ResultsObservationsQueryComponent,
          },
          {
            path: 'multiple-observation-test-admin',
            children: [
              {
                path: removePathPrefix(
                  ROUTE_REGISTRY[RouteKey.MultipleObservationResultMatrix].path,
                  '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-admin'
                ),
                loadComponent: ROUTE_REGISTRY[RouteKey.MultipleObservationResultMatrix].loadComponent,
              },
              {
                path: removePathPrefix(
                  ROUTE_REGISTRY[RouteKey.ValidMultipleObservationResults].path,
                  '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-admin'
                ),
                loadComponent: ROUTE_REGISTRY[RouteKey.ValidMultipleObservationResults].loadComponent,
              },
              {
                path: removePathPrefix(
                  ROUTE_REGISTRY[RouteKey.MultipleObservationFields].path,
                  '/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-admin'
                ),
                loadComponent: ROUTE_REGISTRY[RouteKey.MultipleObservationFields].loadComponent,
              },
            ],
          },
        ],
      },
      {
        path: 'manual-testing-functions',
        children: [
          {
            path: 'first-tech-test-result',
            loadComponent: ROUTE_REGISTRY[RouteKey.FirstTechTestResult].loadComponent,
          },
          {
            path: 'second-tech-test-result-verification',
            loadComponent: ROUTE_REGISTRY[RouteKey.SecondTechTestResultVerification].loadComponent,
          },
        ],
      },
      {
        path: 'reagent-qualification',
        children: [
          {
            path: removePathPrefix(
              ROUTE_REGISTRY[RouteKey.ValidReagentCodes].path,
              '/laboratory-functions/testing-modules/reagent-qualification'
            ),
            loadComponent: ROUTE_REGISTRY[RouteKey.ValidReagentCodes].loadComponent,
          },
        ],
      },
      {
        path: 'testing-queries',
        children: [
          {
            path: 'test-kit-reagents-query',
            loadComponent: ROUTE_REGISTRY[RouteKey.TestKitReagentsQuery].loadComponent,
          },
          {
            path: removePathPrefix(
              ROUTE_REGISTRY[RouteKey.InstrumentUploadLogQuery].path,
              '/laboratory-functions/testing-modules/testing-queries'
            ),
            loadComponent: ROUTE_REGISTRY[RouteKey.InstrumentUploadLogQuery].loadComponent,
          },
          {
            path: removePathPrefix(
              ROUTE_REGISTRY[RouteKey.TestBatchesInHoldingAreaQuery].path,
              '/laboratory-functions/testing-modules/testing-queries'
            ),
            loadComponent: ROUTE_REGISTRY[RouteKey.TestBatchesInHoldingAreaQuery].loadComponent,
          },
        ],
      },
      {
        path: 'common-testing-functions',
        children: [
          {
            path: 'cancel-test-batch-(in-holding-area)',
            loadComponent: ROUTE_REGISTRY[RouteKey.CancelTestBatch].loadComponent,
          },
          {
            path: 'void-cancel-test-results',
            loadComponent: ROUTE_REGISTRY[RouteKey.VoidCancelTestResults].loadComponent,
          },
        ],
      },
      {
        path: 'testing-administration',
        children: [
          {
            path: removePathPrefix(
              ROUTE_REGISTRY[RouteKey.InternalContract].path,
              '/laboratory-functions/testing-modules/testing-administration'
            ),
            loadComponent: ROUTE_REGISTRY[RouteKey.InternalContract].loadComponent,
          },
          {
            path: removePathPrefix(
              ROUTE_REGISTRY[RouteKey.InternalContract].path,
              '/laboratory-functions/testing-modules/testing-administration'
            ) + '/:contractId',
            loadComponent: ROUTE_REGISTRY[RouteKey.InternalContract].loadComponent,
          },
        ],
      },
    ],
  },

  // LifeTrak API Menu
  {
    path: 'life-trak-api-menu',
    children: [
      {
        path: removePathPrefix(
          ROUTE_REGISTRY[RouteKey.LifeTrakApiLogInformationQuery].path,
          '/laboratory-functions/life-trak-api-menu'
        ),
        loadComponent: ROUTE_REGISTRY[RouteKey.LifeTrakApiLogInformationQuery].loadComponent,
      },
      {
        path: removePathPrefix(
          ROUTE_REGISTRY[RouteKey.ConvertExternalDataToLtData].path,
          '/laboratory-functions/life-trak-api-menu'
        ),
        loadComponent: ROUTE_REGISTRY[RouteKey.ConvertExternalDataToLtData].loadComponent,
      },
    ],
  },
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.UnitQuery].path,
      '/laboratory-functions',
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.UnitQuery].loadComponent,
    data: { mode: 'REGULAR' },
    children: [
      { path: 'product-history', loadComponent: ROUTE_REGISTRY[RouteKey.UnitAndProductHistory].loadComponent },
      { path: 'antigens', loadComponent: ROUTE_REGISTRY[RouteKey.Antql].loadComponent },
      { path: 'documents', loadComponent: ROUTE_REGISTRY[RouteKey.DocumentLibrary].loadComponent },
      { path: 'component-query', loadComponent: ROUTE_REGISTRY[RouteKey.ComponentQuery].loadComponent },
    ],
  },
  {
    path: supplierQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.SupplierQuery].loadComponent,
  },
  {
    path: enterRegionalTestingContractPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.EnterRegionalTestingContract].loadComponent,
  },
  {
    path: enterRegionalTestingContractPath + '/add',
    loadComponent: () =>
      import('./regional-testing-contract/rgcon/components/contract-details/contract-details.component').then(
        (m) => m.ContractDetailsComponent
      ),
  },
  {
    path: enterRegionalTestingContractPath + '/edit/:id',
    loadComponent: () =>
      import('./regional-testing-contract/rgcon/components/contract-details/contract-details.component').then(
        (m) => m.ContractDetailsComponent
      ),
  },
  {
    path: removePathPrefix(
      ROUTE_REGISTRY[RouteKey.UnitInformation].path,
      '/laboratory-functions',
    ),
    loadComponent: ROUTE_REGISTRY[RouteKey.UnitInformation].loadComponent,
    data: { mode: 'SUPER' },
    children: [
      { path: 'product-history', loadComponent: ROUTE_REGISTRY[RouteKey.UnitAndProductHistory].loadComponent },
      { path: 'antigens', loadComponent: ROUTE_REGISTRY[RouteKey.Antql].loadComponent },
      { path: 'documents', loadComponent: ROUTE_REGISTRY[RouteKey.DocumentLibrary].loadComponent },
      { path: 'component-query', loadComponent: ROUTE_REGISTRY[RouteKey.ComponentQuery].loadComponent },
    ],
  },
  {
    path: 'maintain-batch-data',
    loadComponent: ROUTE_REGISTRY[RouteKey.MaintainBatchData].loadComponent,
  },
  {
    path: 'modify-unit',
    loadComponent: ROUTE_REGISTRY[RouteKey.ModifyUnit].loadComponent,
  },
  {
    path: 'test-service-check-in',
    loadComponent: ROUTE_REGISTRY[RouteKey.TestServiceCheckIn].loadComponent,
  },
];
