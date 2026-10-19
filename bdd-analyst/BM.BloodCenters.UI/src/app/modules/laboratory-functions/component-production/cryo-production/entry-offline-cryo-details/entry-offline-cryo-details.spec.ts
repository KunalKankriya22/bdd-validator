import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { EntryOfflineCryoDetailsComponent } from './entry-offline-cryo-details';
import { CryoProductionService } from './services/cryo-production.service';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { LoginService } from '../../../../../shared/services/login.service';
import { ChapterTimezoneService } from '../../../../../shared/services/chapter-timezone.service';
import { PageHeaderWithBreadcrumb } from '../../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '../../../../../shared/components/data-table/data-table';
import { UnitIdFieldComponent } from '../../../../../shared/components/unit-id-field';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import { DataTableStub, UnitIdFieldStub, PageHeaderWithBreadcrumbStub } from '@shared/testing/component-stubs';
import {
  ThawMethodDto,
  CryoProductionDto,
  CentrifugeLookupDto,
  CryoTemperatureRangeDto,
  CryoFreezeTimeRangeDto,
  UnitValidationResultDto
} from './models/cryo-production.model';

describe('EntryOfflineCryoDetailsComponent', () => {
  let component: EntryOfflineCryoDetailsComponent;
  let fixture: ComponentFixture<EntryOfflineCryoDetailsComponent>;
  let mockCryoProductionService: jasmine.SpyObj<CryoProductionService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockThawMethods: ThawMethodDto[] = [
    { thawMethod: 'TH01', methodDesc: '37°C Water Bath', minTemp: 35, maxTemp: 39, effDate: '2024-01-01' },
    { thawMethod: 'TH02', methodDesc: 'Room Temperature Thaw', minTemp: 20, maxTemp: 25, effDate: '2024-01-01' },
    { thawMethod: 'TH03', methodDesc: 'Refrigerated Thaw', minTemp: 2, maxTemp: 8, effDate: '2024-01-01' }
  ];

  const mockCentrifuges: CentrifugeLookupDto[] = [
    { equipId: 'CENT001', serialNumber: 'SN-12345-A' },
    { equipId: 'CENT002', serialNumber: 'SN-67890-B' },
    { equipId: 'CENT003', serialNumber: null }
  ];

  const mockCryoRecord: CryoProductionDto = {
    unitId: 'UNIT12345',
    collDate: '2026-06-05T00:00:00Z',
    oldProductCode: 'WB',
    oldProductDesc: 'Whole Blood',
    newProductCode: 'CRYO',
    newProductDesc: 'Cryoprecipitate',
    thawMethod: 'TH01',
    thawMethodDesc: '37°C Water Bath',
    thawTemperature: 37.5,
    sepDateTime: '2026-06-05T10:30:00Z',
    freezeTime: null,
    cryoOkFlag: null,
    rejectReasonCode: null,
    catalogNo: 'CAT12345',
    sepInd: 1,
    insertDate: '2026-06-05T10:30:15Z',
    insertUser: 'JDOE'
  };

  beforeEach(() => {

    // Create spy objects
    mockCryoProductionService = jasmine.createSpyObj('CryoProductionService', [
      'getActiveThawMethods',
      'getActiveCentrifuges',
      'createCryoSeparation',
      'updateCryoRecord',
      'getCryoRecordByUnitId',
      'searchCryoRecords',
      'deleteCryoRecord',
      'getTemperatureRanges',
      'getFreezeTimeRanges',
      'validateUnit',
      'getOldProducts',
      'getCatalogNumbers',
      'autoSelectProduct',
      'getProductVariants',
      'getIntendedUse',
      'reprintLabel'
    ]);

    mockSnackbarService = createMockSnackbarService();

    mockHeaderService = createMockHeaderService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getUserInfo']);
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'fetchChapterTimezone',
      'convertGmtToLocal'
    ]);

    // Set default return values
    mockCryoProductionService.getActiveThawMethods.and.returnValue(of(mockThawMethods));
    mockCryoProductionService.getActiveCentrifuges.and.returnValue(of(mockCentrifuges));
    mockCryoProductionService.getTemperatureRanges.and.returnValue(of({ minTemp: 35, maxTemp: 39 }));
    mockCryoProductionService.getFreezeTimeRanges.and.returnValue(of({ minWsFreezeTime: 60, maxWsFreezeTime: 480, minSepFreezeTime: 5, maxSepFreezeTime: 60 }));
    mockCryoProductionService.getCryoRecordByUnitId.and.returnValue(of(mockCryoRecord));
    mockCryoProductionService.getProductVariants.and.returnValue(of([]));
    mockCryoProductionService.getOldProducts.and.returnValue(of([]));
    mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));
    mockCryoProductionService.getIntendedUse.and.returnValue(of({ intendedUse: 'TRANSFUSION', intendedUseDesc: 'For Transfusion' }));
    mockCryoProductionService.reprintLabel.and.returnValue(of('Label reprinted successfully'));
    mockCryoProductionService.autoSelectProduct.and.returnValue(of({
      autoSelected: true,
      newProductCode: 'CRYO',
      selectedProductCode: 'CRYO',
      productOptions: [],
      matchCount: 1,
      requiresVerification: false
    }));

    // ✅ Set default chapter local date (today) - MUST return a valid Moment
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());
    mockChapterTimezoneService.convertGmtToLocal.and.callFake((m: any) => m);
      TestBed.configureTestingModule({
      imports: [
        EntryOfflineCryoDetailsComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatSnackBarModule,
        PageHeaderWithBreadcrumb,
        DataTable,
        UnitIdFieldComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CryoProductionService, useValue: mockCryoProductionService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    })
    .overrideComponent(EntryOfflineCryoDetailsComponent, {
      remove: { imports: [DataTable, UnitIdFieldComponent, PageHeaderWithBreadcrumb] },
      add: { imports: [DataTableStub, UnitIdFieldStub, PageHeaderWithBreadcrumbStub] },
    });

      mockCryoProductionService.getActiveThawMethods.and.returnValue(of(mockThawMethods));


      mockCryoProductionService.getActiveCentrifuges.and.returnValue(of(mockCentrifuges));


      mockCryoProductionService.getTemperatureRanges.and.returnValue(of({ minTemp: 35, maxTemp: 39 }));


      mockCryoProductionService.getFreezeTimeRanges.and.returnValue(of({ minWsFreezeTime: 60, maxWsFreezeTime: 480, minSepFreezeTime: 5, maxSepFreezeTime: 60 }));


      mockCryoProductionService.getCryoRecordByUnitId.and.returnValue(of(mockCryoRecord));


      mockCryoProductionService.getProductVariants.and.returnValue(of([]));


      mockCryoProductionService.getOldProducts.and.returnValue(of([]));


      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));


      mockCryoProductionService.getIntendedUse.and.returnValue(of({ intendedUse: 'TRANSFUSION', intendedUseDesc: 'For Transfusion' }));


      mockCryoProductionService.reprintLabel.and.returnValue(of('Label reprinted successfully'));


      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());


      mockChapterTimezoneService.convertGmtToLocal.and.callFake((m: any) => m);
    fixture = TestBed.createComponent(EntryOfflineCryoDetailsComponent);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {
    it('should initialize forms on ngOnInit', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.unitForm).toBeDefined();
      expect(component.filterForm.get('thawMethod')).toBeDefined();
      expect(component.unitForm.get('destined')).toBeDefined();
    });

    it('should load thaw methods on initialization', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockCryoProductionService.getActiveThawMethods).toHaveBeenCalled();
      expect(component.thawMethodOptions().length).toBe(3);
      expect(component.thawMethodOptions()[0].thawMethod).toBe('TH01');
    }));

    it('should load centrifuges on initialization', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockCryoProductionService.getActiveCentrifuges).toHaveBeenCalled();
      expect(component.centrifugeOptions().length).toBe(3);
      expect(component.centrifugeOptions()[0].equipId).toBe('CENT001');
    }));

    it('should handle error when loading thaw methods fails', fakeAsync(() => {
      mockCryoProductionService.getActiveThawMethods.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load thaw methods');
    }));

    it('should handle error when loading centrifuges fails', fakeAsync(() => {
      mockCryoProductionService.getActiveCentrifuges.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load centrifuges');
    }));

    it('should initialize disabled fields in unit form', () => {
      fixture.detectChanges();

      expect(component.unitForm.get('destined')?.disabled).toBe(true);
      expect(component.unitForm.get('catalogNo')?.disabled).toBe(true);
      expect(component.unitForm.get('cryoProductCode')?.disabled).toBe(true);
    });


  });

  describe('Workflow Mode Detection', () => {
    beforeEach(() => {
      // Ensure chapter timezone service returns valid moment for all tests
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());
    });

    it('should set workflow to separation when filter has BOTH thaw method AND temperature', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 });
      tick();

      expect(component.workflowMode()).toBe('separation');
    }));

    it('should set workflow to separation when filter has thaw method', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      expect(component.workflowMode()).toBe('separation');
    }));

    it('should NOT set workflow to separation when filter has only temperature', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ temperature: 37.5 });
      tick();

      // Without a thaw method, workflow stays in 'none' mode
      // Freeze mode is only triggered by unit validation (onUnitValidated)
      expect(component.workflowMode()).toBe('none');
    }));

    it('should remain in none mode when no filter values are set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Trigger the workflow mode determination by patching empty values
      // This will trigger filterForm.valueChanges which calls determineWorkflowMode()
      component.filterForm.patchValue({});
      tick();

      // Without a thaw method, workflow stays in 'none' mode
      // Freeze mode is only triggered by unit validation (onUnitValidated)
      expect(component.workflowMode()).toBe('none');
    }));




  });

  describe('Unit Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Set up mocks for separation workflow
      mockCryoProductionService.getOldProducts.and.returnValue(of([]));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));
    });

    it('should handle valid unit in separation mode', fakeAsync(() => {
      const mockValidation: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'separation',
        oldProductCode: 'E0385V00',
        newProductCode: 'E51665V00',
        catalogNumber: '3TE0088994',
        collDate: '2026-06-05T00:00:00Z', // ✅ Required for auto-select
        hasFreeze: false,
        validationErrors: []
      };
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidation));
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true,
        newProductCode: 'E51665V00',
        selectedProductCode: 'E51665V00',
        productOptions: [],
        matchCount: 1,
        requiresVerification: false
      }));

      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 });
      tick();

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick(200); // Wait for setTimeout(100ms) + buffer

      expect(component.unitForm.get('destined')?.value).toBe('E0385V00');
      expect(component.unitForm.get('catalogNo')?.value).toBe('3TE0088994');
      expect(component.unitForm.get('cryoProductCode')?.value).toBe('E51665V00');
    }));

    it('should load CRYO record in freeze mode', fakeAsync(() => {
      const mockValidation: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'freeze',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        catalogNumber: 'CAT12345',
        thawMethod: 'TH01',
        thawTemperature: 37.5,
        sepTime: '2026-06-05T10:30:00Z',
        hasFreeze: false,
        validationErrors: []
      };
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidation));

      component.filterForm.reset(); // Freeze mode
      tick();

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      expect(component.unitForm.get('destined')?.value).toBe('WB');
      expect(component.unitForm.get('catalogNo')?.value).toBe('CAT12345');
      expect(component.unitForm.get('cryoProductCode')?.value).toBe('CRYO');
    }));

    it('should handle error when loading CRYO record fails', fakeAsync(() => {
      const mockValidation: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'freeze',
        hasFreeze: true, // Triggers freeze workflow in onUnitValidated
        // No sepTime or separationType → handleFreezeWorkflow shows error
        validationErrors: []
      };
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidation));

      component.filterForm.reset();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'UNIT99999',
        barcodeType: 'CODE128',
        checkDigit: '9',
        codeScheme: 'I',
        manualUnitId: 'UNIT99999',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please complete separation first before freezing this unit');
    }));
  });

  describe('Form Clearing', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Mock the ViewChild unitIdField so onClearAllUnit() can call .clear()
      (component as any).unitIdField = { clear: jasmine.createSpy('clear'), parsedUnitId: null, isValid: false };
    });

    it('should clear all filter inputs', fakeAsync(() => {
      component.filterForm.patchValue({
        thawMethod: 'TH01',
        temperature: 37.5,
        centrifugeId: 'C001',
        separationDateTime: moment()
      });
      tick();

      component.onClearAllFilters();

      expect(component.filterForm.get('thawMethod')?.value).toBeNull();
      expect(component.filterForm.get('temperature')?.value).toBeNull();
      // onClearAllFilters resets workflow mode to 'none' (no workflow selected)
      expect(component.workflowMode()).toBe('none');
    }));

    it('should clear unit entry section', () => {
      component.unitForm.patchValue({
        destined: 'WB',
        catalogNo: 'CAT123'
      });

      component.onClearAllUnit();

      expect(component.unitForm.get('destined')?.value).toBeNull();
      expect(component.unitForm.get('catalogNo')?.value).toBeNull();
    });
  });

  describe('Commit Operation - Separation Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 });
    });



    it('should show error if form is invalid', () => {
      component.unitIdField = { isValid: true, parsedUnitId: 'UNIT12345' } as any;

      // Make the form invalid by adding a validator and setting invalid value
      component.unitForm.get('verifyProductCode')?.setValidators([Validators.required]);
      component.unitForm.get('verifyProductCode')?.updateValueAndValidity();
      component.unitForm.patchValue({ verifyProductCode: null }); // Required field missing

      component.onCommit();

      // When form is invalid, the method returns early and doesn't call the service
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Please fill in all required fields')
      );
      expect(mockCryoProductionService.createCryoSeparation).not.toHaveBeenCalled();
      expect(mockCryoProductionService.updateCryoRecord).not.toHaveBeenCalled();
    });

    it('should handle API error during creation', fakeAsync(() => {
      const mockValidation: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'separation',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        catalogNumber: 'CAT123',
        hasFreeze: false,
        validationErrors: []
      };
      component.validationResult.set(mockValidation);
      mockCryoProductionService.createCryoSeparation.and.returnValue(
        throwError(() => ({ error: { message: 'Unit not in CRYO batch' } }))
      );

      component.unitIdField = {
        isValid: true,
        parsedUnitId: 'UNIT12345',
        clear: jasmine.createSpy('clear')
      } as any;

      component.unitForm.patchValue({
        destined: 'WB',
        catalogNo: 'CAT123',
        cryoProductCode: 'CRYO',
        verifyProductCode: 'CRYO'
      });

      component.onCommit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit not in CRYO batch');
    }));
  });

  describe('Commit Operation - Freeze Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.reset(); // Freeze mode
    });

    it('should update freeze details successfully', fakeAsync(() => {
      const updatedRecord = { ...mockCryoRecord, freezeTime: '2026-06-05T14:00:00Z', cryoOkFlag: 'Y' };
      mockCryoProductionService.updateCryoRecord.and.returnValue(of(updatedRecord));

      // Must explicitly set freeze workflow mode (filterForm.reset sets 'none')
      component.workflowMode.set('freeze');

      component.unitIdField = {
        isValid: true,
        parsedUnitId: 'UNIT12345',
        clear: jasmine.createSpy('clear')
      } as any;

      component.unitForm.patchValue({
        freezeTime: moment('2026-06-05T14:00:00Z'),
        cryoAcceptable: 'Y'
      });

      // Spy on the private showSuccessSnackbar (it uses MatSnackBar, not SnackbarService)
      spyOn(component as any, 'showSuccessSnackbar');

      component.onCommit();
      tick();

      expect(mockCryoProductionService.updateCryoRecord).toHaveBeenCalledWith(
        'UNIT12345',
        jasmine.objectContaining({
          cryoOkFlag: 'Y'
        })
      );
      expect((component as any).showSuccessSnackbar).toHaveBeenCalledWith('1 Entries added for freeze details');
    }));
  });



  describe('Table Updates', () => {
    it('should update table columns when row count changes', () => {
      fixture.detectChanges();

      const initialColumns = component.tableConfig.columns?.length || 0;

      component.tableData.set([
        {
          unitId: 'UNIT001',
          destined: 'WB',
          catalogNo: 'CAT001',
          cryoProductCode: 'CRYO',
          verifyProductCode: 'CRYO',
          freezeTime: '',
          cryoAcceptable: ''
        }
      ]);

      component['updateTableColumns']();

      expect(component.tableConfig.columns?.length).toBeGreaterThan(0);
    });

    it('should include unitId column in table config', () => {
      fixture.detectChanges();

      component.tableData.set([
        {
          unitId: 'UNIT001',
          destined: 'WB',
          catalogNo: 'CAT001',
          cryoProductCode: 'CRYO',
          verifyProductCode: 'CRYO',
          freezeTime: '',
          cryoAcceptable: ''
        }
      ]);

      component['updateTableColumns']();

      const unitIdColumn = component.tableConfig.columns?.find(c => c.key === 'unitId');
      expect(unitIdColumn).toBeDefined();
      expect(unitIdColumn?.header).toBe('Unit ID');
    });
  });

  describe('Temperature Range Loading', () => {
    const mockTempRange: CryoTemperatureRangeDto = {
      minTemp: 35,
      maxTemp: 39
    };

    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load temperature ranges when thaw method is selected', fakeAsync(() => {
      mockCryoProductionService.getTemperatureRanges.and.returnValue(of(mockTempRange));

      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      expect(mockCryoProductionService.getTemperatureRanges).toHaveBeenCalledWith('TH01');

      const tempRange = component.currentTempRange();
      expect(tempRange).toBeTruthy();
      expect(tempRange?.minTemp).toBe(35);
      expect(tempRange?.maxTemp).toBe(39);
    }));




  });

  describe('Freeze Time Range Loading', () => {
    const mockFreezeTimeRange: CryoFreezeTimeRangeDto = {
      minWsFreezeTime: 60,
      maxWsFreezeTime: 480,
      minSepFreezeTime: 5,
      maxSepFreezeTime: 60
    };

    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load freeze time ranges when thaw method is selected', fakeAsync(() => {
      mockCryoProductionService.getFreezeTimeRanges.and.returnValue(of(mockFreezeTimeRange));

      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      expect(mockCryoProductionService.getFreezeTimeRanges).toHaveBeenCalledWith('TH01');
    }));


  });

  describe('Unit Validation with API', () => {
    const mockValidationSuccess: UnitValidationResultDto = {
      isValid: true,
      workflowMode: 'separation',
      oldProductCode: 'WB',
      newProductCode: 'CRYO',
      catalogNumber: 'CAT123',
      collDate: '2026-06-05T00:00:00Z', // ✅ Required for auto-select
      thawMethod: 'TH01',
      thawTemperature: 37.5,
      sepTime: '2026-06-05T10:30:00Z',
      separationType: 'SECOND',
      hasFreeze: false,
      validationErrors: []
    };

    const mockValidationFailure: UnitValidationResultDto = {
      isValid: false,
      workflowMode: 'separation',
      hasFreeze: false,
      validationErrors: [
        { errorCode: 'ERR001', message: 'Unit not found in system' },
        { errorCode: 'ERR002', message: 'Invalid product type' }
      ]
    };

    beforeEach(() => {
      fixture.detectChanges();
      // Set up default mocks for separation workflow
      mockCryoProductionService.getOldProducts.and.returnValue(of([]));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true,
        newProductCode: 'CRYO',
        selectedProductCode: 'CRYO',
        productOptions: [],
        matchCount: 1,
        requiresVerification: false
      }));
    });

    it('should call validateUnit API with workflowMode in separation mode', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationSuccess));

      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 });
      tick();

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      expect(mockCryoProductionService.validateUnit).toHaveBeenCalledWith({
        unitId: 'UNIT12345',
        workflowMode: 'separation'
      });
    }));

    it('should call validateUnit API with workflowMode in freeze mode', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationSuccess));

      component.filterForm.reset();
      tick();

      // Pre-set freeze mode (normally set by a prior unit validation)
      component.workflowMode.set('freeze');

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      expect(mockCryoProductionService.validateUnit).toHaveBeenCalledWith({
        unitId: 'UNIT12345',
        workflowMode: 'freeze'
      });
    }));

    it('should show validation errors when unit validation fails', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationFailure));

      // Set up unitIdField mock with setError spy (component calls unitIdField.setError, not snackbarService)
      component.unitIdField = {
        setError: jasmine.createSpy('setError'),
        clear: jasmine.createSpy('clear'),
        isValid: false,
        parsedUnitId: null
      } as any;

      component.onUnitValidated({
        parsedUnitId: 'UNIT99999',
        barcodeType: 'CODE128',
        checkDigit: '9',
        codeScheme: 'I',
        manualUnitId: 'UNIT99999',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      // Component shows the first validation error via unitIdField.setError
      expect(component.unitIdField.setError).toHaveBeenCalledWith('Unit not found in system');
      expect(component.isLoading()).toBe(false);
      expect(component.isUnitValidated()).toBe(false);
    }));

    it('should handle API error during validation with validation errors', fakeAsync(() => {
      const errorResponse = {
        error: {
          data: {
            validationErrors: [
              { errorCode: 'ERR001', message: 'Database connection failed' }
            ]
          }
        }
      };

      mockCryoProductionService.validateUnit.and.returnValue(throwError(() => errorResponse));

      // Set up unitIdField mock with setError spy (component calls unitIdField.setError for validation errors)
      component.unitIdField = {
        setError: jasmine.createSpy('setError'),
        clear: jasmine.createSpy('clear'),
        isValid: false,
        parsedUnitId: null
      } as any;

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      // Validation errors are shown via unitIdField.setError, not snackbar
      expect(component.unitIdField.setError).toHaveBeenCalledWith('Database connection failed');
    }));

    it('should use fallback error message when API error has no validation errors', fakeAsync(() => {
      const errorResponse = {
        error: {
          message: 'Network timeout'
        }
      };

      mockCryoProductionService.validateUnit.and.returnValue(throwError(() => errorResponse));

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Network timeout');
    }));

    it('should store validation result when validation succeeds', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationSuccess));

      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 });
      tick();

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick(200); // Wait for setTimeout(100ms) + buffer

      expect(component.validationResult()).toBeTruthy();
      expect(component.validationResult()?.workflowMode).toBe('separation');
      expect(component.isUnitValidated()).toBe(true);
    }));

    it('should always load catalog numbers regardless of workflow mode', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationSuccess));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));

      // No filter values set - workflow mode will be 'none', then freeze (via sepTime in validation)
      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      // Catalog numbers are loaded for all workflows
      expect(mockCryoProductionService.getCatalogNumbers).toHaveBeenCalledWith('UNIT12345', 'CRYO');
    }));

    it('should load reference data in separation mode', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationSuccess));
      mockCryoProductionService.getOldProducts.and.returnValue(of([]));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));

      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 });
      tick();

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick(200); // Wait for setTimeout(100ms) + buffer

      expect(mockCryoProductionService.getOldProducts).toHaveBeenCalledWith('UNIT12345');
      expect(mockCryoProductionService.getCatalogNumbers).toHaveBeenCalledWith('UNIT12345', 'CRYO');
    }));

    it('should load catalog numbers in freeze mode', fakeAsync(() => {
      const mockFreezeValidation: UnitValidationResultDto = {
        isValid: true,
        workflowMode: 'freeze',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        catalogNumber: 'CAT123',
        thawMethod: 'TH01',
        thawTemperature: 37.5,
        sepTime: '2026-06-05T10:30:00Z',
        hasFreeze: false,
        validationErrors: []
      };

      mockCryoProductionService.validateUnit.and.returnValue(of(mockFreezeValidation));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));

      // Freeze mode (no filter values)
      component.filterForm.reset();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      // Catalog numbers are loaded for all workflows (old products are only loaded in separation mode)
      expect(mockCryoProductionService.getCatalogNumbers).toHaveBeenCalledWith('UNIT12345', 'CRYO');
    }));

    it('should auto-populate fields in none mode when validation has data', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationSuccess));
      mockCryoProductionService.getOldProducts.and.returnValue(of([]));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));

      // No filter values - none mode
      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      // Verify fields were populated
      expect(component.unitForm.get('destined')?.value).toBe('WB');
      expect(component.unitForm.get('catalogNo')?.value).toBe('CAT123');
      expect(component.unitForm.get('cryoProductCode')?.value).toBe('CRYO');
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Freeze Workflow Handling', () => {
    const mockValidationWithSeparation: UnitValidationResultDto = {
      isValid: true,
      workflowMode: 'freeze',
      oldProductCode: 'WB',
      newProductCode: 'CRYO',
      catalogNumber: 'CAT123',
      thawMethod: 'TH01',
      thawTemperature: 37.5,
      sepTime: '2026-06-05T10:30:00Z',
      separationType: 'SECOND',
      hasFreeze: false,
      validationErrors: []
    };

    const mockValidationWithoutSeparation: UnitValidationResultDto = {
      isValid: true,
      workflowMode: 'freeze',
      hasFreeze: true, // Triggers freeze workflow in onUnitValidated (no sepTime/separationType → error)
      validationErrors: []
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.reset(); // Set to freeze mode
    });

    it('should auto-populate fields in freeze workflow when unit has separation', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationWithSeparation));

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      expect(component.unitForm.get('destined')?.value).toBe('WB');
      expect(component.unitForm.get('catalogNo')?.value).toBe('CAT123');
      expect(component.unitForm.get('cryoProductCode')?.value).toBe('CRYO');
      expect(component.unitForm.get('freezeTime')?.value).toBeTruthy(); // Auto-populated with current time
    }));

    it('should store separation details as display data in freeze workflow', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationWithSeparation));

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      // In freeze mode, separation details are stored in displaySeparationData (read-only),
      // NOT populated into the filter form (which stays empty and disabled)
      expect(component.displaySeparationData()?.thawMethod).toBe('TH01');
      expect(component.displaySeparationData()?.temperature).toBe(37.5);
    }));

    it('should show error when unit has no separation in freeze workflow', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationWithoutSeparation));

      component.onUnitValidated({
        parsedUnitId: 'UNIT99999',
        barcodeType: 'CODE128',
        checkDigit: '9',
        codeScheme: 'I',
        manualUnitId: 'UNIT99999',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Please complete separation first before freezing this unit'
      );
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Separation Workflow Handling', () => {
    const mockValidationSuccess: UnitValidationResultDto = {
      isValid: true,
      workflowMode: 'separation',
      oldProductCode: 'WB',
      newProductCode: 'CRYO',
      catalogNumber: 'CAT123',
      collDate: '2026-06-05T00:00:00Z', // ✅ Required for auto-select product
      hasFreeze: false,
      validationErrors: []
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 }); // Separation mode
      mockCryoProductionService.getOldProducts.and.returnValue(of([]));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT123' }]));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true,
        newProductCode: 'CRYO',
        selectedProductCode: 'CRYO',
        productOptions: [],
        matchCount: 1,
        requiresVerification: false
      }));
    });

    it('should auto-populate unit fields in separation workflow', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidationSuccess));

      component.onUnitValidated({
        parsedUnitId: 'UNIT12345',
        barcodeType: 'CODE128',
        checkDigit: '5',
        codeScheme: 'I',
        manualUnitId: 'UNIT12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        chapterScheme: 'I'
      });

      tick(200); // Wait for setTimeout(100ms) + buffer

      expect(component.unitForm.get('destined')?.value).toBeTruthy();
      expect(component.unitForm.get('catalogNo')?.value).toBeTruthy();
      expect(component.unitForm.get('cryoProductCode')?.value).toBeTruthy();
    }));
  });

  describe('Unit Cleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { clear: jasmine.createSpy('clear'), parsedUnitId: null, isValid: false };
    });

    it('should reset validation state when unit is cleared', () => {
      component.isUnitValidated.set(true);
      component.validationResult.set({ isValid: true } as any);

      component.onUnitCleared();

      expect(component.isUnitValidated()).toBeFalse();
      expect(component.validationResult()).toBeNull();
    });

    it('should clear unit form fields', () => {
      component.unitForm.patchValue({ destined: 'WB', catalogNo: 'CAT123' });
      component.onUnitCleared();

      expect(component.unitForm.get('destined')?.value).toBe('');
      expect(component.unitForm.get('catalogNo')?.value).toBe('');
    });

    it('should re-enable filter form in freeze mode', fakeAsync(() => {
      component.workflowMode.set('freeze');
      component.filterForm.disable({ emitEvent: false });
      tick();

      component.onUnitCleared();

      expect(component.filterForm.enabled).toBeTrue();
    }));

    it('should reset workflow mode to none if no thaw method selected', () => {
      component.workflowMode.set('separation');
      component.filterForm.patchValue({ thawMethod: null }, { emitEvent: false });
      component.onUnitCleared();
      expect(component.workflowMode()).toBe('none');
    });
  });

  describe('Reprint Label', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when no unit selected', () => {
      (component as any).unitIdField = { parsedUnitId: null, isValid: false, clear: jasmine.createSpy('clear') };
      component.onReprintLabel();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('No unit selected for reprinting');
    });

    it('should show error when no product code selected', () => {
      (component as any).unitIdField = { parsedUnitId: 'UNIT001', isValid: true, clear: jasmine.createSpy('clear') };
      component.unitForm.patchValue({ verifyProductCode: null });
      component.onReprintLabel();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a product code before reprinting');
    });

    it('should call reprint API on success', fakeAsync(() => {
      (component as any).unitIdField = { parsedUnitId: 'UNIT001', isValid: true, clear: jasmine.createSpy('clear') };
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({ verifyProductCode: 'CRYO' });

      component.onReprintLabel();
      tick();

      expect(mockCryoProductionService.reprintLabel).toHaveBeenCalled();
    }));

    it('should handle reprint API error', fakeAsync(() => {
      (component as any).unitIdField = { parsedUnitId: 'UNIT001', isValid: true, clear: jasmine.createSpy('clear') };
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({ verifyProductCode: 'CRYO' });
      mockCryoProductionService.reprintLabel.and.returnValue(throwError(() => ({ error: { message: 'Print failed' } })));

      component.onReprintLabel();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Print failed');
    }));
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { clear: jasmine.createSpy('clear'), parsedUnitId: null, isValid: false };
    });

    it('should check hasFilterValues', fakeAsync(() => {
      expect(component.hasFilterValues()).toBeFalse();
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();
      expect(component.hasFilterValues()).toBeTrue();
    }));

    it('should check hasUnitValues', () => {
      expect(component.hasUnitValues()).toBeFalse();
    });

    it('should determine shouldShowTable', () => {
      expect(component.shouldShowTable()).toBeFalse();
    });

    it('should show table when data exists', () => {
      component.tableData.set([{
        unitId: 'U1', destined: 'WB', catalogNo: 'C1',
        cryoProductCode: 'CR', verifyProductCode: 'CR',
        freezeTime: '', cryoAcceptable: ''
      }]);
      expect(component.shouldShowTable()).toBeTrue();
    });

    it('should show table when thaw method selected', fakeAsync(() => {
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();
      expect(component.shouldShowTable()).toBeTrue();
    }));
  });

  describe('Commit Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when unit ID is not valid', () => {
      (component as any).unitIdField = { isValid: false, parsedUnitId: null, clear: jasmine.createSpy('clear') };
      component.onCommit();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please enter a valid Unit ID');
    });

    it('should return false for canCommit when no unit', () => {
      (component as any).unitIdField = { isValid: false, parsedUnitId: null };
      expect(component.canCommit()).toBeFalse();
    });
  });

  describe('Define Plasma', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to laboratory functions', () => {
      spyOn((component as any).router, 'navigate');
      component.tableData.set([]);
      component.onDefinePlasma();
      expect((component as any).router.navigate).toHaveBeenCalledWith(['/laboratory-functions']);
    });

    it('should show success snackbar with entry count', () => {
      spyOn((component as any).router, 'navigate');
      spyOn(component as any, 'showSuccessSnackbar');
      component.tableData.set([
        { unitId: 'U1', destined: 'WB', catalogNo: 'C1', cryoProductCode: 'CR', verifyProductCode: 'CR', freezeTime: '', cryoAcceptable: '' },
        { unitId: 'U2', destined: 'WB', catalogNo: 'C2', cryoProductCode: 'CR', verifyProductCode: 'CR', freezeTime: '', cryoAcceptable: '' }
      ]);
      component.onDefinePlasma();
      expect((component as any).showSuccessSnackbar).toHaveBeenCalledWith(
        '2 entries have been successfully saved. Returning to Laboratory Functions.'
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ and separationTimeUpdate$ on destroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const destroyCompleteSpy = spyOn((component as any).destroy$, 'complete');
      const sepTimeCompleteSpy = spyOn((component as any).separationTimeUpdate$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(destroyCompleteSpy).toHaveBeenCalled();
      expect(sepTimeCompleteSpy).toHaveBeenCalled();
    });
  });

  describe('showSuccessSnackbar', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should dismiss previous snackbar and show new one', () => {
      const mockSnackBarRef = { onAction: () => of(undefined), dismiss: jasmine.createSpy('dismiss') };
      const snackBarInstance = (component as any).snackBar;
      spyOn(snackBarInstance, 'dismiss');
      spyOn(snackBarInstance, 'open').and.returnValue(mockSnackBarRef);

      (component as any).showSuccessSnackbar('Test message');

      expect(snackBarInstance.dismiss).toHaveBeenCalled();
      expect(snackBarInstance.open).toHaveBeenCalledWith('Test message', 'DISMISS', jasmine.objectContaining({
        duration: 8000,
      }));
    });
  });

  describe('getCurrentChapterTime', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return moment based on chapter timezone offset', () => {
      mockHeaderService.getCurrentChapterTimezone.and.returnValue('+05:30');
      const result = (component as any).getCurrentChapterTime();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('should handle negative timezone offset', () => {
      mockHeaderService.getCurrentChapterTimezone.and.returnValue('-04:00');
      const result = (component as any).getCurrentChapterTime();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('should fallback to system time when no timezone', () => {
      mockHeaderService.getCurrentChapterTimezone.and.returnValue(null);
      const result = (component as any).getCurrentChapterTime();
      expect(moment.isMoment(result)).toBeTrue();
    });
  });

  describe('Temperature Range Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty temperature', () => {
      const validator = (component as any).temperatureRangeValidator();
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: undefined } as any)).toBeNull();
      expect(validator({ value: '' } as any)).toBeNull();
    });

    it('should validate against thaw method-specific range', () => {
      component.currentTempRange.set({ minTemp: 35, maxTemp: 39 });
      const validator = (component as any).temperatureRangeValidator();

      expect(validator({ value: 37 } as any)).toBeNull();
      expect(validator({ value: 34 } as any)).toEqual(jasmine.objectContaining({
        temperatureOutOfRange: jasmine.objectContaining({
          message: jasmine.stringContaining('35')
        })
      }));
      expect(validator({ value: 40 } as any)).toEqual(jasmine.objectContaining({
        temperatureOutOfRange: jasmine.any(Object)
      }));
    });

    it('should use fallback range when no specific range is loaded', () => {
      component.currentTempRange.set(null);
      const validator = (component as any).temperatureRangeValidator();

      expect(validator({ value: 50 } as any)).toBeNull();
      expect(validator({ value: -101 } as any)).toEqual(jasmine.objectContaining({
        temperatureOutOfRange: jasmine.objectContaining({
          message: jasmine.stringContaining('-100')
        })
      }));
      expect(validator({ value: 101 } as any)).toEqual(jasmine.objectContaining({
        temperatureOutOfRange: jasmine.any(Object)
      }));
    });
  });

  describe('DateTime Format Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty value', () => {
      const validator = (component as any).dateTimeFormatValidator();
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: undefined } as any)).toBeNull();
    });

    it('should accept Moment objects', () => {
      const validator = (component as any).dateTimeFormatValidator();
      expect(validator({ value: moment() } as any)).toBeNull();
    });

    it('should accept Date objects', () => {
      const validator = (component as any).dateTimeFormatValidator();
      expect(validator({ value: new Date() } as any)).toBeNull();
    });

    it('should accept valid DD-MMM-YYYY HH:mm format string', () => {
      const validator = (component as any).dateTimeFormatValidator();
      expect(validator({ value: '08-Jun-2026 14:30' } as any)).toBeNull();
    });

    it('should accept uppercase month abbreviation', () => {
      const validator = (component as any).dateTimeFormatValidator();
      expect(validator({ value: '30-JUN-2026 01:03' } as any)).toBeNull();
    });

    it('should reject invalid format string', () => {
      const validator = (component as any).dateTimeFormatValidator();
      const result = validator({ value: 'not-a-date' } as any);
      expect(result).toEqual(jasmine.objectContaining({
        invalidFormat: jasmine.objectContaining({
          message: jasmine.stringContaining('Invalid format')
        })
      }));
    });

    it('should return null for non-string non-date types', () => {
      const validator = (component as any).dateTimeFormatValidator();
      expect(validator({ value: 12345 } as any)).toBeNull();
    });
  });

  describe('CryoOkFlag Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty value', () => {
      const validator = (component as any).cryoOkFlagValidator();
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: '' } as any)).toBeNull();
    });

    it('should accept Y and N values', () => {
      const validator = (component as any).cryoOkFlagValidator();
      expect(validator({ value: 'Y' } as any)).toBeNull();
      expect(validator({ value: 'N' } as any)).toBeNull();
      expect(validator({ value: 'y' } as any)).toBeNull();
      expect(validator({ value: 'n' } as any)).toBeNull();
    });

    it('should reject invalid values', () => {
      const validator = (component as any).cryoOkFlagValidator();
      const result = validator({ value: 'X' } as any);
      expect(result).toEqual(jasmine.objectContaining({
        invalidValue: jasmine.objectContaining({
          message: 'CRYO Acceptable must be Y or N'
        })
      }));
    });
  });

  describe('Conditional Freeze Time Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null when not a FormGroup', () => {
      const validator = (component as any).conditionalFreezeTimeValidator();
      expect(validator({ value: 'test' } as any)).toBeNull();
    });

    it('should require freeze time when cryoAcceptable is Y', () => {
      const validator = (component as any).conditionalFreezeTimeValidator();
      component.unitForm.patchValue({ cryoAcceptable: 'Y', freezeTime: null });
      const result = validator(component.unitForm);
      expect(result).toEqual(jasmine.objectContaining({
        freezeTimeRequired: jasmine.objectContaining({
          message: 'Freeze time is required when CRYO is acceptable'
        })
      }));
    });

    it('should return null when cryoAcceptable is Y and freezeTime is set', () => {
      const validator = (component as any).conditionalFreezeTimeValidator();
      component.unitForm.get('freezeTime')?.enable();
      component.unitForm.patchValue({ cryoAcceptable: 'Y', freezeTime: '08-Jun-2026 14:30' });
      const result = validator(component.unitForm);
      expect(result).toBeNull();
    });

    it('should return null when cryoAcceptable is N', () => {
      const validator = (component as any).conditionalFreezeTimeValidator();
      component.unitForm.patchValue({ cryoAcceptable: 'N', freezeTime: null });
      const result = validator(component.unitForm);
      expect(result).toBeNull();
    });
  });

  describe('Product Code Verification Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty verify code', () => {
      const validator = (component as any).productCodeVerificationValidator();
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: '' } as any)).toBeNull();
    });

    it('should return null when no new product code set', () => {
      const validator = (component as any).productCodeVerificationValidator();
      component.unitForm.patchValue({ cryoProductCode: '' });
      expect(validator({ value: 'CRYO' } as any)).toBeNull();
    });

    it('should return null when codes match (case-insensitive)', () => {
      const validator = (component as any).productCodeVerificationValidator();
      component.unitForm.get('cryoProductCode')?.enable();
      component.unitForm.patchValue({ cryoProductCode: 'CRYO' });
      component.unitForm.get('cryoProductCode')?.disable();
      expect(validator({ value: 'cryo' } as any)).toBeNull();
    });

    it('should return error when codes do not match', () => {
      const validator = (component as any).productCodeVerificationValidator();
      component.unitForm.get('cryoProductCode')?.enable();
      component.unitForm.patchValue({ cryoProductCode: 'CRYO' });
      component.unitForm.get('cryoProductCode')?.disable();
      const result = validator({ value: 'WRONG' } as any);
      expect(result).toEqual(jasmine.objectContaining({
        productCodeMismatch: jasmine.objectContaining({
          message: jasmine.stringContaining('9728')
        })
      }));
    });
  });

  describe('enableSeparationFields', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should enable verify product code and disable freeze fields', () => {
      // First enable everything
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.get('freezeTime')?.enable();
      component.unitForm.get('cryoAcceptable')?.enable();

      (component as any).enableSeparationFields();

      expect(component.unitForm.get('verifyProductCode')?.enabled).toBeTrue();
      expect(component.unitForm.get('freezeTime')?.disabled).toBeTrue();
      expect(component.unitForm.get('cryoAcceptable')?.disabled).toBeTrue();
    });
  });

  describe('enableFreezeFields', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable verify product code and enable freeze fields', () => {
      component.unitForm.get('verifyProductCode')?.enable();

      (component as any).enableFreezeFields();

      expect(component.unitForm.get('verifyProductCode')?.disabled).toBeTrue();
      expect(component.unitForm.get('freezeTime')?.enabled).toBeTrue();
      expect(component.unitForm.get('cryoAcceptable')?.enabled).toBeTrue();
    });
  });

  describe('loadProductVariantsForDropdown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call API when catalogNumber is empty', () => {
      mockCryoProductionService.getProductVariants.calls.reset();
      (component as any).loadProductVariantsForDropdown('');
      expect(mockCryoProductionService.getProductVariants).not.toHaveBeenCalled();
    });

    it('should populate productCodeOptions on success', fakeAsync(() => {
      mockCryoProductionService.getProductVariants.and.returnValue(of([
        { productCode: 'P1', productDesc: 'Product 1', antiCode: null, volume: null },
        { productCode: 'P2', productDesc: 'Product 2', antiCode: null, volume: null }
      ]));

      (component as any).loadProductVariantsForDropdown('CAT123');
      tick();

      expect(component.productCodeOptions().length).toBe(2);
      expect(component.productCodeOptions()[0].code).toBe('P1');
    }));

    it('should show error on failure', fakeAsync(() => {
      mockCryoProductionService.getProductVariants.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      (component as any).loadProductVariantsForDropdown('CAT123');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load product codes');
    }));
  });

  describe('loadOldProducts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call API when unitId is empty', () => {
      mockCryoProductionService.getOldProducts.calls.reset();
      (component as any).loadOldProducts('');
      expect(mockCryoProductionService.getOldProducts).not.toHaveBeenCalled();
    });

    it('should auto-populate destined when exactly one product', fakeAsync(() => {
      mockCryoProductionService.getOldProducts.and.returnValue(of([
        { productCode: 'WB', productDesc: 'Whole Blood' }
      ]));

      (component as any).loadOldProducts('UNIT001');
      tick();

      expect(component.oldProductOptions().length).toBe(1);
      expect(component.unitForm.get('destined')?.value).toBe('WB');
    }));

    it('should not auto-populate destined when multiple products', fakeAsync(() => {
      component.unitForm.patchValue({ destined: '' });
      mockCryoProductionService.getOldProducts.and.returnValue(of([
        { productCode: 'WB', productDesc: 'Whole Blood' },
        { productCode: 'RBC', productDesc: 'Red Blood Cells' }
      ]));

      (component as any).loadOldProducts('UNIT001');
      tick();

      expect(component.oldProductOptions().length).toBe(2);
    }));

    it('should silently handle errors', fakeAsync(() => {
      mockCryoProductionService.getOldProducts.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      (component as any).loadOldProducts('UNIT001');
      tick();

      // Should not show error to user
      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));
  });

  describe('loadCatalogNumbers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null when unitId is empty', fakeAsync(() => {
      let result: string | null = 'initial';
      (component as any).loadCatalogNumbers('', 'CRYO').subscribe((v: any) => result = v);
      tick();
      expect(result).toBeNull();
    }));

    it('should return null when productType is empty', fakeAsync(() => {
      let result: string | null = 'initial';
      (component as any).loadCatalogNumbers('UNIT001', '').subscribe((v: any) => result = v);
      tick();
      expect(result).toBeNull();
    }));

    it('should patch catalogNo when catalogs found', fakeAsync(() => {
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([
        { catalogNumber: 'CAT999' }
      ]));

      let result: string | null = null;
      (component as any).loadCatalogNumbers('UNIT001', 'CRYO').subscribe((v: any) => result = v);
      tick();

      expect(result).toBe('CAT999');
      expect(component.unitForm.get('catalogNo')?.value).toBe('CAT999');
    }));

    it('should return null when no catalogs found', fakeAsync(() => {
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));

      let result: string | null = 'initial';
      (component as any).loadCatalogNumbers('UNIT001', 'CRYO').subscribe((v: any) => result = v);
      tick();

      expect(result).toBeNull();
    }));

    it('should return null on error', fakeAsync(() => {
      mockCryoProductionService.getCatalogNumbers.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      let result: string | null = 'initial';
      (component as any).loadCatalogNumbers('UNIT001', 'CRYO').subscribe((v: any) => result = v);
      tick();

      expect(result).toBeNull();
    }));
  });

  describe('loadIntendedUse', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call API when unitId is empty', () => {
      mockCryoProductionService.getIntendedUse.calls.reset();
      (component as any).loadIntendedUse('', 'CRYO');
      expect(mockCryoProductionService.getIntendedUse).not.toHaveBeenCalled();
    });

    it('should not call API when productCode is empty', () => {
      mockCryoProductionService.getIntendedUse.calls.reset();
      (component as any).loadIntendedUse('UNIT001', '');
      expect(mockCryoProductionService.getIntendedUse).not.toHaveBeenCalled();
    });

    it('should set intended use signals on success', fakeAsync(() => {
      mockCryoProductionService.getIntendedUse.and.returnValue(of({
        intendedUse: 'TRANSFUSION',
        intendedUseDesc: 'For Transfusion'
      }));

      (component as any).loadIntendedUse('UNIT001', 'CRYO');
      tick();

      expect(component.currentIntendedUse()).toBe('TRANSFUSION');
      expect(component.currentIntendedUseDesc()).toBe('For Transfusion');
    }));

    it('should silently handle errors', fakeAsync(() => {
      mockCryoProductionService.getIntendedUse.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      (component as any).loadIntendedUse('UNIT001', 'CRYO');
      tick();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));
  });

  describe('loadTemperatureRanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should silently handle errors (fallback to thawMethodOptions)', fakeAsync(() => {
      mockCryoProductionService.getTemperatureRanges.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      (component as any).loadTemperatureRanges('TH01');
      tick();

      // Should not show error to user
      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should update currentTempRange and re-validate temperature field', fakeAsync(() => {
      mockCryoProductionService.getTemperatureRanges.and.returnValue(of({ minTemp: 20, maxTemp: 25 }));
      const tempControl = component.filterForm.get('temperature');
      tempControl?.enable();
      spyOn(tempControl!, 'updateValueAndValidity');

      (component as any).loadTemperatureRanges('TH02');
      tick();

      expect(component.currentTempRange()).toEqual({ minTemp: 20, maxTemp: 25 });
      expect(tempControl!.updateValueAndValidity).toHaveBeenCalled();
    }));
  });

  describe('loadFreezeTimeRanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should silently handle errors', fakeAsync(() => {
      mockCryoProductionService.getFreezeTimeRanges.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      (component as any).loadFreezeTimeRanges('TH01');
      tick();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should update currentFreezeTimeRanges on success', fakeAsync(() => {
      const ranges = { minWsFreezeTime: 60, maxWsFreezeTime: 480, minSepFreezeTime: 5, maxSepFreezeTime: 60 };
      mockCryoProductionService.getFreezeTimeRanges.and.returnValue(of(ranges));

      (component as any).loadFreezeTimeRanges('TH01');
      tick();

      expect(component.currentFreezeTimeRanges()).toEqual(ranges);
    }));
  });

  describe('addEntryToTable', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add an entry and update table columns', () => {
      const response = {
        unitId: 'UNIT001',
        oldProductCode: 'WB',
        catalogNo: 'CAT001',
        newProductCode: 'CRYO',
        verifyProductCode: 'CRYO',
        freezeTime: null,
        cryoOkFlag: null
      };

      (component as any).addEntryToTable(response);

      expect(component.tableData().length).toBe(1);
      expect(component.tableData()[0].unitId).toBe('UNIT001');
      expect(component.tableData()[0].freezeTime).toBe('');
      expect(component.tableData()[0].cryoAcceptable).toBe('');
    });

    it('should format ISO string freeze time', () => {
      const response = {
        unitId: 'UNIT001',
        oldProductCode: 'WB',
        catalogNumber: 'CAT001',
        newProductCode: 'CRYO',
        verifyProductCode: '',
        freezeTime: '2026-06-05T14:00:00Z',
        cryoOkFlag: 'Y'
      };

      (component as any).addEntryToTable(response);

      expect(component.tableData()[0].freezeTime).toBeTruthy();
      expect(component.tableData()[0].cryoAcceptable).toBe('Y');
    });

    it('should use catalogNumber fallback when catalogNo is missing', () => {
      const response = {
        unitId: 'UNIT001',
        oldProductCode: 'WB',
        catalogNumber: 'CAT_FROM_NUMBER',
        newProductCode: 'CRYO',
      };

      (component as any).addEntryToTable(response);

      expect(component.tableData()[0].catalogNo).toBe('CAT_FROM_NUMBER');
    });
  });

  describe('updateTableColumns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should include verify product code column in separation mode', () => {
      component.workflowMode.set('separation');
      (component as any).updateTableColumns();
      const col = component.tableConfig.columns?.find((c: any) => c.key === 'verifyProductCode');
      expect(col).toBeDefined();
    });

    it('should include freeze time and cryo acceptable columns in freeze mode', () => {
      component.workflowMode.set('freeze');
      (component as any).updateTableColumns();
      const freezeCol = component.tableConfig.columns?.find((c: any) => c.key === 'freezeTime');
      const cryoCol = component.tableConfig.columns?.find((c: any) => c.key === 'cryoAcceptable');
      expect(freezeCol).toBeDefined();
      expect(cryoCol).toBeDefined();
    });

    it('should infer columns from data when mode is none', () => {
      component.workflowMode.set('none');
      component.tableData.set([{
        unitId: 'U1', destined: 'WB', catalogNo: 'C1',
        cryoProductCode: 'CR', verifyProductCode: 'CR',
        freezeTime: '', cryoAcceptable: ''
      }]);
      (component as any).updateTableColumns();
      const col = component.tableConfig.columns?.find((c: any) => c.key === 'verifyProductCode');
      expect(col).toBeDefined();
    });

    it('should infer freeze columns from data when mode is none and has freeze data', () => {
      component.workflowMode.set('none');
      component.tableData.set([{
        unitId: 'U1', destined: 'WB', catalogNo: 'C1',
        cryoProductCode: 'CR', verifyProductCode: '',
        freezeTime: '08-Jun-2026 14:30', cryoAcceptable: 'Y'
      }]);
      (component as any).updateTableColumns();
      const freezeCol = component.tableConfig.columns?.find((c: any) => c.key === 'freezeTime');
      expect(freezeCol).toBeDefined();
    });
  });

  describe('Thaw Method Value Change Listener', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should enable temperature, centrifuge, and separationDateTime when thaw method selected', fakeAsync(() => {
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      expect(component.filterForm.get('temperature')?.enabled).toBeTrue();
      expect(component.filterForm.get('centrifugeId')?.enabled).toBeTrue();
      expect(component.filterForm.get('separationDateTime')?.enabled).toBeTrue();
    }));

    it('should disable and reset fields when thaw method cleared', fakeAsync(() => {
      // First select a thaw method
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      // Then clear it
      component.filterForm.patchValue({ thawMethod: null });
      tick();

      expect(component.filterForm.get('temperature')?.disabled).toBeTrue();
      expect(component.filterForm.get('centrifugeId')?.disabled).toBeTrue();
      expect(component.filterForm.get('separationDateTime')?.disabled).toBeTrue();
      expect(component.currentTempRange()).toBeNull();
    }));

    it('should use fallback temp range from thawMethodOptions when API range not yet loaded', fakeAsync(() => {
      // Reset the range
      component.currentTempRange.set(null);
      // Make API return error so fallback is used
      mockCryoProductionService.getTemperatureRanges.and.returnValue(
        throwError(() => new Error('Not available'))
      );

      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      // Fallback should set range from thawMethodOptions
      const range = component.currentTempRange();
      expect(range).toBeTruthy();
      expect(range?.minTemp).toBe(35);
      expect(range?.maxTemp).toBe(39);
    }));
  });

  describe('Centrifuge Value Change Listener', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should start auto-updating separation time when centrifuge selected in separation mode', fakeAsync(() => {
      // Set thaw method first so determineWorkflowMode keeps separation mode
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      const sepTimeSpy = spyOn((component as any).separationTimeUpdate$, 'next');
      component.filterForm.get('centrifugeId')?.setValue('CENT001');
      tick();
      expect(sepTimeSpy).toHaveBeenCalledWith(true);
    }));

    it('should stop auto-updating when centrifuge cleared', fakeAsync(() => {
      const sepTimeSpy = spyOn((component as any).separationTimeUpdate$, 'next');
      component.workflowMode.set('separation');
      component.filterForm.get('centrifugeId')?.enable();
      component.filterForm.patchValue({ centrifugeId: null });
      tick();
      expect(sepTimeSpy).toHaveBeenCalledWith(false);
    }));
  });

  describe('onClearAllFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { clear: jasmine.createSpy('clear'), parsedUnitId: null, isValid: false };
    });

    it('should stop separation time auto-update', fakeAsync(() => {
      const sepTimeSpy = spyOn((component as any).separationTimeUpdate$, 'next');
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();
      sepTimeSpy.calls.reset();

      component.onClearAllFilters();

      expect(sepTimeSpy).toHaveBeenCalledWith(false);
    }));

    it('should clear display separation data', fakeAsync(() => {
      component.displaySeparationData.set({ thawMethod: 'TH01' });
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      component.onClearAllFilters();

      expect(component.displaySeparationData()).toBeNull();
    }));

    it('should call onClearAllUnit when unit is not validated', fakeAsync(() => {
      component.isUnitValidated.set(false);
      spyOn(component, 'onClearAllUnit');
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      component.onClearAllFilters();

      expect(component.onClearAllUnit).toHaveBeenCalled();
    }));

    it('should not call onClearAllUnit when unit is validated', fakeAsync(() => {
      component.isUnitValidated.set(true);
      spyOn(component, 'onClearAllUnit');
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();

      component.onClearAllFilters();

      expect(component.onClearAllUnit).not.toHaveBeenCalled();
    }));
  });

  describe('onClearAllUnit', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { clear: jasmine.createSpy('clear'), parsedUnitId: null, isValid: false };
    });

    it('should re-enable filter form and reset workflow when in freeze mode', () => {
      component.workflowMode.set('freeze');
      component.filterForm.disable({ emitEvent: false });

      component.onClearAllUnit();

      expect(component.filterForm.get('thawMethod')?.enabled).toBeTrue();
      expect(component.filterForm.get('temperature')?.disabled).toBeTrue();
      expect(component.filterForm.get('centrifugeId')?.disabled).toBeTrue();
      expect(component.workflowMode()).toBe('none');
    });

    it('should reset isFormDirty when filter form is also empty', () => {
      component.isFormDirty.set(true);
      component.filterForm.reset(undefined, { emitEvent: false });

      component.onClearAllUnit();

      expect(component.isFormDirty()).toBeFalse();
    });

    it('should keep isFormDirty true when filter form has values', fakeAsync(() => {
      component.isFormDirty.set(true);
      component.filterForm.patchValue({ thawMethod: 'TH01' }, { emitEvent: false });
      tick();

      component.onClearAllUnit();

      expect(component.isFormDirty()).toBeTrue();
    }));

    it('should clear intended use and old product signals', () => {
      component.currentIntendedUse.set('TRANSFUSION');
      component.currentIntendedUseDesc.set('For Transfusion');
      component.oldProductOptions.set([{ productCode: 'WB', productDesc: 'Whole Blood' }]);

      component.onClearAllUnit();

      expect(component.currentIntendedUse()).toBeNull();
      expect(component.currentIntendedUseDesc()).toBeNull();
      expect(component.oldProductOptions().length).toBe(0);
    });

    it('should disable readonly form fields after reset', () => {
      component.onClearAllUnit();
      expect(component.unitForm.get('destined')?.disabled).toBeTrue();
      expect(component.unitForm.get('catalogNo')?.disabled).toBeTrue();
      expect(component.unitForm.get('cryoProductCode')?.disabled).toBeTrue();
    });
  });

  describe('hasUnitValues', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when unitIdField has parsedUnitId', () => {
      (component as any).unitIdField = { parsedUnitId: 'UNIT001', isValid: true };
      expect(component.hasUnitValues()).toBeTrue();
    });

    it('should return true when form has non-empty values', () => {
      (component as any).unitIdField = { parsedUnitId: null, isValid: false };
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({ verifyProductCode: 'CRYO' });
      expect(component.hasUnitValues()).toBeTrue();
    });
  });

  describe('shouldShowTable', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show table when unit ID field has value', () => {
      (component as any).unitIdField = { parsedUnitId: 'UNIT001', isValid: true };
      expect(component.shouldShowTable()).toBeTrue();
    });
  });

  describe('canCommit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when unit is valid, form is valid, and not loading', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'UNIT001' };
      // Clear all validators to make form valid
      Object.keys(component.unitForm.controls).forEach(key => {
        component.unitForm.get(key)?.clearValidators();
        component.unitForm.get(key)?.updateValueAndValidity();
      });
      component.unitForm.clearValidators();
      component.unitForm.updateValueAndValidity();
      component.isLoading.set(false);
      expect(component.canCommit()).toBeTrue();
    });

    it('should return false when loading', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'UNIT001' };
      component.isLoading.set(true);
      expect(component.canCommit()).toBeFalse();
    });

    it('should return false when form is invalid', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'UNIT001' };
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.get('verifyProductCode')?.setValidators((c: any) => ({ required: true }));
      component.unitForm.get('verifyProductCode')?.updateValueAndValidity();
      component.isLoading.set(false);
      expect(component.canCommit()).toBeFalse();
    });
  });

  describe('Commit Operation - Separation Mode Success', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ thawMethod: 'TH01', temperature: 37.5 });
      (component as any).unitIdField = {
        isValid: true,
        parsedUnitId: 'UNIT12345',
        clear: jasmine.createSpy('clear')
      };
    });

    it('should create separation record and add to table on success', fakeAsync(() => {
      const mockResponse = {
        unitId: 'UNIT12345',
        oldProductCode: 'WB',
        catalogNo: 'CAT123',
        newProductCode: 'CRYO',
        verifyProductCode: 'CRYO',
        freezeTime: null,
        cryoOkFlag: null
      };
      mockCryoProductionService.createCryoSeparation.and.returnValue(of(mockResponse));
      component.validationResult.set({
        isValid: true,
        workflowMode: 'separation',
        separationType: 'SECOND',
        hasFreeze: false,
        validationErrors: []
      } as any);

      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({
        destined: 'WB',
        catalogNo: 'CAT123',
        cryoProductCode: 'CRYO',
        verifyProductCode: 'CRYO'
      });

      spyOn(component as any, 'showSuccessSnackbar');
      component.onCommit();
      tick();

      expect(mockCryoProductionService.createCryoSeparation).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'UNIT12345',
          workflowMode: 'separation',
          separationType: 'SECOND',
          oldProductCode: 'WB',
          newProductCode: 'CRYO',
          verifyProductCode: 'CRYO'
        })
      );
      expect((component as any).showSuccessSnackbar).toHaveBeenCalledWith('1 Entries added for separation details');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should show error with errorResponse.errorCode format', fakeAsync(() => {
      mockCryoProductionService.createCryoSeparation.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: { errorCode: '9812', error: 'Unit already processed' },
            message: 'Fallback message'
          }
        }))
      );
      component.validationResult.set({ isValid: true, workflowMode: 'separation', hasFreeze: false, validationErrors: [] } as any);
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({
        destined: 'WB', catalogNo: 'CAT123', cryoProductCode: 'CRYO', verifyProductCode: 'CRYO'
      });

      component.onCommit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error 9812: Unit already processed');
    }));

    it('should show error with errorCode format', fakeAsync(() => {
      mockCryoProductionService.createCryoSeparation.and.returnValue(
        throwError(() => ({
          error: { errorCode: '9728', message: 'Product mismatch' }
        }))
      );
      component.validationResult.set({ isValid: true, workflowMode: 'separation', hasFreeze: false, validationErrors: [] } as any);
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({
        destined: 'WB', catalogNo: 'CAT123', cryoProductCode: 'CRYO', verifyProductCode: 'CRYO'
      });

      component.onCommit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error 9728: Product mismatch');
    }));

    it('should use default separationType SECOND when not in validation result', fakeAsync(() => {
      const mockResponse = {
        unitId: 'UNIT12345', oldProductCode: 'WB', catalogNo: 'CAT123',
        newProductCode: 'CRYO', freezeTime: null, cryoOkFlag: null
      };
      mockCryoProductionService.createCryoSeparation.and.returnValue(of(mockResponse));
      component.validationResult.set(null); // No validation result

      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({
        destined: 'WB', catalogNo: 'CAT123', cryoProductCode: 'CRYO', verifyProductCode: 'CRYO'
      });

      component.onCommit();
      tick();

      expect(mockCryoProductionService.createCryoSeparation).toHaveBeenCalledWith(
        jasmine.objectContaining({ separationType: 'SECOND' })
      );
    }));
  });

  describe('Commit Operation - Freeze Mode Error', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.workflowMode.set('freeze');
      (component as any).unitIdField = {
        isValid: true,
        parsedUnitId: 'UNIT12345',
        clear: jasmine.createSpy('clear')
      };
    });

    it('should show error message on freeze update failure', fakeAsync(() => {
      mockCryoProductionService.updateCryoRecord.and.returnValue(
        throwError(() => ({ error: { message: 'Freeze time validation failed' } }))
      );

      component.unitForm.get('freezeTime')?.enable();
      component.unitForm.get('cryoAcceptable')?.enable();
      component.unitForm.patchValue({
        freezeTime: moment('2026-06-05T14:00:00Z'),
        cryoAcceptable: 'Y'
      });

      component.onCommit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Freeze time validation failed');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should use default error message when none provided', fakeAsync(() => {
      mockCryoProductionService.updateCryoRecord.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.unitForm.get('freezeTime')?.enable();
      component.unitForm.get('cryoAcceptable')?.enable();
      component.unitForm.patchValue({
        freezeTime: moment('2026-06-05T14:00:00Z'),
        cryoAcceptable: 'Y'
      });

      component.onCommit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to save freeze details');
    }));
  });

  describe('Commit with form-level errors', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'UNIT12345' };
    });

    it('should show form-level error message when field errors have messages', () => {
      // Make a control invalid with a specific message
      const control = component.unitForm.get('verifyProductCode');
      control?.enable();
      control?.setErrors({ custom: { message: 'Custom validation error' } });

      component.onCommit();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('verifyProductCode: Custom validation error');
    });

    it('should show form-level validator error message', () => {
      // Set form-level errors
      component.unitForm.setErrors({ freezeTimeRequired: { message: 'Freeze time is required when CRYO is acceptable' } });

      component.onCommit();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Freeze time is required when CRYO is acceptable');
    });
  });

  describe('autoSave', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitIdField = {
        isValid: true,
        parsedUnitId: 'UNIT12345',
        clear: jasmine.createSpy('clear')
      };
    });

    it('should not auto-save when loading', fakeAsync(() => {
      component.isLoading.set(true);
      spyOn(component, 'onCommit');

      (component as any).autoSave();
      tick();

      expect(component.onCommit).not.toHaveBeenCalled();
    }));

    it('should show warning dialog in freeze mode and commit on yes', async () => {
      component.workflowMode.set('freeze');
      component.isLoading.set(false);
      const dialogRef = { afterClosed: () => of('yes') };
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRef);
      spyOn(component, 'onCommit');

      await (component as any).autoSave();

      expect((component as any).dialog.open).toHaveBeenCalled();
      expect(component.onCommit).toHaveBeenCalled();
    });

    it('should show warning dialog in freeze mode and clear on no', async () => {
      component.workflowMode.set('freeze');
      component.isLoading.set(false);
      const dialogRef = { afterClosed: () => of('no') };
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRef);
      spyOn(component, 'onClearAllUnit');

      await (component as any).autoSave();

      expect(component.onClearAllUnit).toHaveBeenCalled();
    });

    it('should commit directly in separation mode (no dialog)', fakeAsync(() => {
      component.workflowMode.set('separation');
      component.isLoading.set(false);
      spyOn(component, 'onCommit');

      (component as any).autoSave();
      tick();

      expect(component.onCommit).toHaveBeenCalled();
    }));

    it('should use validation warnings in dialog message when available', fakeAsync(() => {
      component.workflowMode.set('freeze');
      component.isLoading.set(false);
      component.validationWarnings.set([
        { errorCode: '9789', message: 'Test warning' }
      ]);
      const dialogRef = { afterClosed: () => of('yes') };
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRef);
      spyOn(component, 'onCommit');

      (component as any).autoSave();
      tick();

      expect((component as any).dialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            message: 'Warn 9789: Test warning'
          })
        })
      );
    }));

    it('should use default warning when no validation warnings', fakeAsync(() => {
      component.workflowMode.set('freeze');
      component.isLoading.set(false);
      component.validationWarnings.set([]);
      const dialogRef = { afterClosed: () => of('yes') };
      spyOn((component as any).dialog, 'open').and.returnValue(dialogRef);
      spyOn(component, 'onCommit');

      (component as any).autoSave();
      tick();

      expect((component as any).dialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            message: jasmine.stringContaining('9789')
          })
        })
      );
    }));
  });

  describe('callAutoSelectProduct', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle error code 9732 and load product variants', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: false,
        errorCode: '9732',
        errorMessage: 'No core conditions found',
        productOptions: [],
        matchCount: 0,
        requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9732'));
      expect(mockCryoProductionService.getProductVariants).toHaveBeenCalled();
    }));

    it('should handle error code 9935 and load product variants', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: false,
        errorCode: '9935',
        errorMessage: 'Invalid intended use',
        productOptions: [],
        matchCount: 0,
        requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9935'));
    }));

    it('should handle unknown error codes and load product variants', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: false,
        errorCode: '9999',
        errorMessage: 'Unknown error',
        productOptions: [],
        matchCount: 0,
        requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9999'));
    }));

    it('should set verify product code to null and load intended use on success', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true,
        newProductCode: 'CRYO',
        productOptions: [],
        matchCount: 1,
        requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));
      mockCryoProductionService.getIntendedUse.and.returnValue(of({
        intendedUse: 'TRANSFUSION',
        intendedUseDesc: 'For Transfusion'
      }));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(component.unitForm.get('cryoProductCode')?.value).toBe('CRYO');
      expect(component.unitForm.get('verifyProductCode')?.value).toBeNull();
      expect(mockCryoProductionService.getIntendedUse).toHaveBeenCalledWith('UNIT001', 'CRYO');
    }));

    it('should use selectedProductCode as fallback when newProductCode is absent', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true,
        selectedProductCode: 'CRYO_LEGACY',
        productOptions: [],
        matchCount: 1,
        requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));
      mockCryoProductionService.getIntendedUse.and.returnValue(of({
        intendedUse: 'T', intendedUseDesc: 'Test'
      }));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(component.unitForm.get('cryoProductCode')?.value).toBe('CRYO_LEGACY');
    }));

    it('should handle API error with errorCode', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(
        throwError(() => ({ error: { errorCode: '9732', message: 'No conditions' } }))
      );
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error 9732: No conditions');
    }));

    it('should handle API error without errorCode', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should use default error message when no error info available', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).callAutoSelectProduct('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to auto-select product');
    }));
  });

  describe('proceedWithAutoSelect', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load product variants and stop loading when oldProductCode missing', () => {
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).proceedWithAutoSelect('UNIT001', {}, 'CAT123');

      expect(mockCryoProductionService.getProductVariants).toHaveBeenCalledWith('CAT123');
      expect(component.isLoading()).toBeFalse();
    });

    it('should stop loading when both oldProductCode and catalogNumber missing', () => {
      (component as any).proceedWithAutoSelect('UNIT001', {}, '');

      expect(component.isLoading()).toBeFalse();
    });

    it('should call auto-select when both oldProductCode and catalogNumber present', fakeAsync(() => {
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true, newProductCode: 'CRYO',
        productOptions: [], matchCount: 1, requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).proceedWithAutoSelect('UNIT001', { oldProductCode: 'WB', collDate: '2026-01-01' }, 'CAT123');
      tick();

      expect(mockCryoProductionService.autoSelectProduct).toHaveBeenCalled();
    }));
  });

  describe('handleSeparationWorkflow', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should stop loading early when newProductCode is already provided', () => {
      const validationResult = {
        oldProductCode: 'WB',
        catalogNumber: 'CAT123',
        newProductCode: 'CRYO'
      };

      (component as any).handleSeparationWorkflow('UNIT001', validationResult);

      expect(component.unitForm.get('destined')?.value).toBe('WB');
      expect(component.unitForm.get('cryoProductCode')?.value).toBe('CRYO');
      expect(component.isLoading()).toBeFalse();
    });

    it('should call proceedWithAutoSelect when catalogNumber present but no newProductCode', fakeAsync(() => {
      const validationResult = {
        oldProductCode: 'WB',
        catalogNumber: 'CAT123',
        collDate: '2026-01-01'
      };
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true, newProductCode: 'CRYO',
        productOptions: [], matchCount: 1, requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).handleSeparationWorkflow('UNIT001', validationResult);
      tick();

      expect(mockCryoProductionService.autoSelectProduct).toHaveBeenCalled();
    }));

    it('should load catalog numbers as fallback when no catalogNumber in result', fakeAsync(() => {
      const validationResult = { oldProductCode: 'WB' };
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT_LOADED' }]));
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true, newProductCode: 'CRYO',
        productOptions: [], matchCount: 1, requiresVerification: false
      }));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));

      (component as any).handleSeparationWorkflow('UNIT001', validationResult);
      tick();

      expect(mockCryoProductionService.getCatalogNumbers).toHaveBeenCalled();
    }));
  });

  describe('handleFreezeWorkflow', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable filter form in freeze mode', () => {
      const validationResult = {
        sepTime: '2026-06-05T10:30:00Z',
        separationType: 'SECOND',
        oldProductCode: 'WB',
        catalogNumber: 'CAT123',
        newProductCode: 'CRYO',
        thawMethod: 'TH01',
        thawMethodDesc: '37C Water Bath',
        thawTemperature: 37.5
      };

      (component as any).handleFreezeWorkflow(validationResult);

      expect(component.filterForm.disabled).toBeTrue();
    });

    it('should auto-populate freeze time with current time minus 1 minute', () => {
      const validationResult = {
        sepTime: '2026-06-05T10:30:00Z',
        separationType: 'SECOND',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        thawMethod: 'TH01'
      };

      (component as any).handleFreezeWorkflow(validationResult);

      expect(component.unitForm.get('freezeTime')?.value).toBeTruthy();
    });

    it('should disable verify product code in freeze mode', () => {
      const validationResult = {
        sepTime: '2026-06-05T10:30:00Z',
        separationType: 'SECOND',
        oldProductCode: 'WB',
        newProductCode: 'CRYO'
      };

      (component as any).handleFreezeWorkflow(validationResult);

      expect(component.unitForm.get('verifyProductCode')?.disabled).toBeTrue();
    });

    it('should store display separation data without centrifugeId', () => {
      const validationResult = {
        sepTime: '2026-06-05T10:30:00Z',
        separationType: 'SECOND',
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        thawMethod: 'TH01',
        thawMethodDesc: '37C Water Bath',
        thawTemperature: 37.5
      };

      (component as any).handleFreezeWorkflow(validationResult);

      const displayData = component.displaySeparationData();
      expect(displayData?.thawMethod).toBe('TH01');
      expect(displayData?.centrifugeId).toBe('-');
    });
  });

  describe('onUnitValidated - edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockCryoProductionService.getOldProducts.and.returnValue(of([]));
      mockCryoProductionService.getCatalogNumbers.and.returnValue(of([]));
      mockCryoProductionService.getProductVariants.and.returnValue(of([]));
    });

    it('should disable verify product code on validation failure', fakeAsync(() => {
      const mockValidation = {
        isValid: false,
        validationErrors: [{ errorCode: 'E001', message: 'Invalid' }],
        hasFreeze: false,
        workflowMode: 'separation' as const
      };
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidation));

      (component as any).unitIdField = {
        setError: jasmine.createSpy('setError'),
        parsedUnitId: 'UNIT001',
        isValid: false
      };

      component.unitForm.get('verifyProductCode')?.enable();

      component.onUnitValidated({
        parsedUnitId: 'UNIT001', barcodeType: 'CODE128', checkDigit: '1',
        codeScheme: 'I', manualUnitId: 'UNIT001', codabarUnitScheme: null,
        entryMode: 'S', chapterScheme: 'I'
      });
      tick();

      expect(component.unitForm.get('verifyProductCode')?.disabled).toBeTrue();
    }));

    it('should default to separation mode when unit not separated and no thaw method', fakeAsync(() => {
      const mockValidation = {
        isValid: true,
        workflowMode: 'separation' as const,
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        catalogNumber: 'CAT123',
        hasFreeze: false,
        validationErrors: []
      };
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidation));
      mockCryoProductionService.autoSelectProduct.and.returnValue(of({
        autoSelected: true, newProductCode: 'CRYO',
        productOptions: [], matchCount: 1, requiresVerification: false,
        selectedProductCode: 'CRYO'
      }));

      // No thaw method selected
      component.filterForm.reset(undefined, { emitEvent: false });
      component.workflowMode.set('none');

      component.onUnitValidated({
        parsedUnitId: 'UNIT001', barcodeType: 'CODE128', checkDigit: '1',
        codeScheme: 'I', manualUnitId: 'UNIT001', codabarUnitScheme: null,
        entryMode: 'S', chapterScheme: 'I'
      });
      tick();

      expect(component.workflowMode()).toBe('separation');
    }));

    it('should handle API error with no error info at all', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(
        throwError(() => ({}))
      );

      component.onUnitValidated({
        parsedUnitId: 'UNIT001', barcodeType: 'CODE128', checkDigit: '1',
        codeScheme: 'I', manualUnitId: 'UNIT001', codabarUnitScheme: null,
        entryMode: 'S', chapterScheme: 'I'
      });
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit validation failed');
    }));

    it('should re-enable verify product code on successful separation validation', fakeAsync(() => {
      const mockValidation = {
        isValid: true,
        workflowMode: 'separation' as const,
        oldProductCode: 'WB',
        newProductCode: 'CRYO',
        catalogNumber: 'CAT123',
        hasFreeze: false,
        validationErrors: []
      };
      mockCryoProductionService.validateUnit.and.returnValue(of(mockValidation));

      component.filterForm.patchValue({ thawMethod: 'TH01' }, { emitEvent: false });
      component.workflowMode.set('separation');

      component.onUnitValidated({
        parsedUnitId: 'UNIT001', barcodeType: 'CODE128', checkDigit: '1',
        codeScheme: 'I', manualUnitId: 'UNIT001', codabarUnitScheme: null,
        entryMode: 'S', chapterScheme: 'I'
      });
      tick();

      expect(component.unitForm.get('verifyProductCode')?.enabled).toBeTrue();
    }));

    it('should disable verify product code on API error with validation errors', fakeAsync(() => {
      mockCryoProductionService.validateUnit.and.returnValue(
        throwError(() => ({
          error: {
            data: {
              validationErrors: [{ errorCode: 'E001', message: 'DB Error' }]
            }
          }
        }))
      );

      (component as any).unitIdField = {
        setError: jasmine.createSpy('setError'),
        parsedUnitId: 'UNIT001',
        isValid: false
      };
      component.unitForm.get('verifyProductCode')?.enable();

      component.onUnitValidated({
        parsedUnitId: 'UNIT001', barcodeType: 'CODE128', checkDigit: '1',
        codeScheme: 'I', manualUnitId: 'UNIT001', codabarUnitScheme: null,
        entryMode: 'S', chapterScheme: 'I'
      });
      tick();

      expect(component.unitForm.get('verifyProductCode')?.disabled).toBeTrue();
    }));
  });

  describe('onUnitCleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { clear: jasmine.createSpy('clear'), parsedUnitId: null, isValid: false };
    });

    it('should clear display separation data', () => {
      component.displaySeparationData.set({ thawMethod: 'TH01', temperature: 37.5 });
      component.onUnitCleared();
      expect(component.displaySeparationData()).toBeNull();
    });

    it('should keep workflow mode when thaw method is still set', fakeAsync(() => {
      component.workflowMode.set('separation');
      component.filterForm.patchValue({ thawMethod: 'TH01' }, { emitEvent: false });
      tick();

      component.onUnitCleared();

      // Should NOT reset to none because thaw method is still selected
      expect(component.workflowMode()).not.toBe('none');
    }));
  });

  describe('requiredValidator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return error for null', () => {
      const validator = (component as any).requiredValidator();
      expect(validator({ value: null } as any)).toEqual({ required: true });
    });

    it('should return error for empty string', () => {
      const validator = (component as any).requiredValidator();
      expect(validator({ value: '' } as any)).toEqual({ required: true });
    });

    it('should return null for non-empty value', () => {
      const validator = (component as any).requiredValidator();
      expect(validator({ value: 'test' } as any)).toBeNull();
    });
  });

  describe('sepDateTimeVsCollDateValidator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null (delegates to API)', () => {
      const validator = (component as any).sepDateTimeVsCollDateValidator();
      expect(validator({ value: '08-Jun-2026 14:30' } as any)).toBeNull();
    });
  });

  describe('freezeTimeVsSepTimeValidator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null (delegates to API)', () => {
      const validator = (component as any).freezeTimeVsSepTimeValidator();
      expect(validator({ value: '08-Jun-2026 14:30' } as any)).toBeNull();
    });
  });

  describe('determineWorkflowMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not switch to separation when already in freeze mode', () => {
      component.workflowMode.set('freeze');
      (component as any).determineWorkflowMode({ thawMethod: 'TH01' });
      expect(component.workflowMode()).toBe('freeze');
    });

    it('should set to none when no thaw method and not in freeze mode', () => {
      component.workflowMode.set('none');
      (component as any).determineWorkflowMode({ thawMethod: null });
      expect(component.workflowMode()).toBe('none');
    });

    it('should set separation mode and clear display data', () => {
      component.workflowMode.set('none');
      component.displaySeparationData.set({ thawMethod: 'OLD' });
      (component as any).determineWorkflowMode({ thawMethod: 'TH01' });
      expect(component.workflowMode()).toBe('separation');
      expect(component.displaySeparationData()).toBeNull();
    });
  });

  describe('Reprint Label - success with snackbar', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show success snackbar and reset loading on successful reprint', fakeAsync(() => {
      (component as any).unitIdField = { parsedUnitId: 'UNIT001', isValid: true };
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({ verifyProductCode: 'CRYO' });
      mockCryoProductionService.reprintLabel.and.returnValue(of('Label sent to printer'));
      spyOn(component as any, 'showSuccessSnackbar');

      component.onReprintLabel();
      tick();

      expect((component as any).showSuccessSnackbar).toHaveBeenCalledWith('Label sent to printer');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should use fallback error message on reprint failure with no message', fakeAsync(() => {
      (component as any).unitIdField = { parsedUnitId: 'UNIT001', isValid: true };
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({ verifyProductCode: 'CRYO' });
      mockCryoProductionService.reprintLabel.and.returnValue(throwError(() => ({ error: {} })));

      component.onReprintLabel();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to reprint label');
    }));
  });

  describe('Form listeners - isFormDirty', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set isFormDirty on filter form changes', fakeAsync(() => {
      component.isFormDirty.set(false);
      component.filterForm.patchValue({ thawMethod: 'TH01' });
      tick();
      expect(component.isFormDirty()).toBeTrue();
    }));

    it('should set isFormDirty on unit form changes', fakeAsync(() => {
      component.isFormDirty.set(false);
      component.unitForm.get('verifyProductCode')?.enable();
      component.unitForm.patchValue({ verifyProductCode: 'TEST' });
      tick();
      expect(component.isFormDirty()).toBeTrue();
    }));
  });

  describe('Static ID generation', () => {
    it('should generate unique component IDs', () => {
      fixture.detectChanges();
      const id = (component as any).componentId;
      expect(id).toMatch(/^entry-offline-cryo-details-\d+$/);
    });

    it('should generate element IDs from name', () => {
      fixture.detectChanges();
      const elemId = (component as any).elementId('test-field');
      expect(elemId).toContain('test-field');
    });

    it('should generate error IDs from name', () => {
      fixture.detectChanges();
      const errId = (component as any).errorId('test-field');
      expect(errId).toContain('test-field');
      expect(errId).toContain('error');
    });

    it('should generate label IDs from name', () => {
      fixture.detectChanges();
      const lblId = (component as any).labelId('test-field');
      expect(lblId).toContain('test-field');
      expect(lblId).toContain('label');
    });
  });

  describe('initializeTableConfig', () => {
    it('should set table config with correct defaults', () => {
      fixture.detectChanges();
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.showPagination).toBeTrue();
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.showTableOnEmpty).toBeTrue();
      expect(component.tableConfig.emptyMessage).toBe('No Results to Display');
      expect(component.tableConfig.noDataIcon).toBe('search');
    });
  });

  describe('Table Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have default page size of 25', () => {
      expect(component.pageSize()).toBe(25);
    });

    it('should have default current page of 0', () => {
      expect(component.currentPage()).toBe(0);
    });

    it('should have correct page size options', () => {
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });
});
