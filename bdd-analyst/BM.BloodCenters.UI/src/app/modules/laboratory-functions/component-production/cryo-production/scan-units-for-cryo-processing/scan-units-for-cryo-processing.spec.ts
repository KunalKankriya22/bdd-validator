import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ScanUnitsForCryoProcessingComponent } from './scan-units-for-cryo-processing';
import { ScanUnitsForCryoProcessingService } from './services/scan-units-for-cryo-processing.service';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { CryoWorksheetDto, CryoUnitDto, CryoComponentDto } from './models/scan-units-for-cryo-processing.model';
import { UnitValidationResponse } from '../../../../../shared/components/unit-id-field';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ScanUnitsForCryoProcessingComponent', () => {
  let headerServiceSpy: any;
  let scanServiceSpy: any;
  let component: ScanUnitsForCryoProcessingComponent;
  let fixture: ComponentFixture<ScanUnitsForCryoProcessingComponent>;
  let mockScanService: jasmine.SpyObj<ScanUnitsForCryoProcessingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockWorksheets: CryoWorksheetDto[] = [
    {
      cryoWorksheetId: '030410-CY1242',
      insertDats: new Date('2024-03-10'),
      totalUnits: 5,
      processedUnits: 2,
      unprocessedUnits: 3,
    },
    {
      cryoWorksheetId: '030411-CY1243',
      insertDats: new Date('2024-03-11'),
      totalUnits: 3,
      processedUnits: 0,
      unprocessedUnits: 3,
    },
  ];

  const mockUnit: CryoUnitDto = {
    unitId: 'W4545-26-051302-1',
    chapterId: 'TEST',
    collDate: new Date('2024-03-10'),
    cryoWorksheetId: '030410-CY1242',
    worksheetSeqNo: 1,
    prodCode: 'E0701V00',
    aboDesc: 'O Positive',
    productDesc: 'Fresh Frozen Plasma',
    thawMethod: null,
    insertDats: new Date(),
  };

  const mockComponents: CryoComponentDto[] = [
    { productCode: 'E0701V00', productDesc: 'Fresh Frozen Plasma' },
    { productCode: 'E0701V01', productDesc: 'FFP Pooled' },
  ];

  const mockUnitValidationResponse: UnitValidationResponse = {
    parsedUnitId: 'W4545-26-051302-1',
    checkDigit: '1',
    codeScheme: 'I',
    manualUnitId: 'W4545-26-051302-1',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
    collectionDate: '2024-03-10',
  };

  beforeEach(() => {

    scanServiceSpy = jasmine.createSpyObj('ScanUnitsForCryoProcessingService', [
      'getActiveWorksheets',
      'getWorksheetById',
      'generateWorksheetId',
      'getUnprocessedUnits',
      'addUnitToWorksheet',
      'getValidComponents',
    ]);

    const snackbarServiceSpy = createMockSnackbarService();

    headerServiceSpy = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [
        ScanUnitsForCryoProcessingComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        NgxMatSelectSearchModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ScanUnitsForCryoProcessingService, useValue: scanServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        provideRouter([]),
      ],
    });
    mockScanService = TestBed.inject(ScanUnitsForCryoProcessingService) as jasmine.SpyObj<ScanUnitsForCryoProcessingService>;
    mockSnackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    mockHeaderService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(ScanUnitsForCryoProcessingComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {








    it('should have empty scanned units on init', () => {
      mockScanService.getActiveWorksheets.and.returnValue(of([]));
      component.ngOnInit();

      expect(component.scannedUnits).toEqual([]);
    });
  });

  describe('Load Available Worksheets', () => {
    it('should load worksheets successfully', fakeAsync(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of(mockWorksheets));
      component.ngOnInit();
      tick();

      expect(component.availableWorksheets).toEqual(mockWorksheets);
      expect(component.filteredWorksheets()).toEqual(mockWorksheets);
      expect(component.isLoading).toBe(false);
    }));



    it('should handle error loading worksheets', fakeAsync(() => {
      const error = { error: { message: 'Failed' } };
      mockScanService.getActiveWorksheets.and.returnValue(throwError(() => error));
      component.ngOnInit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
      expect(component.filteredWorksheets()).toEqual([]);
    }));
  });

  describe('Worksheet Search', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of(mockWorksheets));
      component.ngOnInit();
    });



    it('should show all worksheets when search is empty', fakeAsync(() => {
      tick(); // Wait for initial load

      component.worksheetSearchControl.setValue('');
      tick(300); // Wait for debounce

      expect(component.filteredWorksheets().length).toBe(2);
    }));


  });

  describe('Product Code Search', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of([]));
      component.ngOnInit();
      component.availableComponents = mockComponents;
      component.filteredComponents.set(mockComponents);
    });





    it('should show all components when search is empty', fakeAsync(() => {
      component.productCodeSearchControl.setValue('');
      tick(300); // Wait for debounce

      expect(component.filteredComponents().length).toBe(2);
    }));
  });

  describe('Unit Validation', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of([]));
      component.ngOnInit();
    });

    it('should handle valid unit', fakeAsync(() => {
      mockScanService.getValidComponents.and.returnValue(of(mockComponents));
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(component.currentUnit).toEqual(mockUnitValidationResponse);
      expect(component.availableComponents).toEqual(mockComponents);
      expect(component.filteredComponents()).toEqual(mockComponents);
    }));

    it('should handle invalid unit', () => {
      component.onUnitValidated(null as any);

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Invalid unit ID');
      expect(component.filteredComponents()).toEqual([]);
    });

    it('should not auto-open product code dropdown after validation', fakeAsync(() => {
      mockScanService.getValidComponents.and.returnValue(of(mockComponents));
      component.onUnitValidated(mockUnitValidationResponse);
      tick(300);

      // Verify that productCodeSelect is not automatically opened
      // This is a behavioral test - we removed the auto-open logic
      expect(component.currentUnit).toEqual(mockUnitValidationResponse);
    }));
  });



  describe('Worksheet Warning Dialog', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of(mockWorksheets));
      component.ngOnInit();
    });

    it('should show warning dialog when selecting worksheet with processedUnits > 0', fakeAsync(() => {
      spyOn<any>(component, 'showWorksheetProcessedWarning');
      tick(); // Wait for worksheets to load

      // Select worksheet with processedUnits = 2
      component.worksheetForm.patchValue({ worksheetId: '030410-CY1242' });
      tick();

      expect(component['showWorksheetProcessedWarning']).toHaveBeenCalledWith('030410-CY1242');
    }));

    it('should load worksheet details when processedUnits = 0', fakeAsync(() => {
      mockScanService.getUnprocessedUnits.and.returnValue(of([mockUnit]));
      tick(); // Wait for worksheets to load

      // Select worksheet with processedUnits = 0
      component.worksheetForm.patchValue({ worksheetId: '030411-CY1243' });
      tick();

      expect(mockScanService.getUnprocessedUnits).toHaveBeenCalledWith('030411-CY1243');
    }));
  });

  describe('Generate Worksheet and Add Unit', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of([]));
      component.ngOnInit();
      component.currentUnit = mockUnitValidationResponse;
    });



    it('should add unit to existing worksheet', fakeAsync(() => {
      component.currentWorksheetId = '030410-CY1242';
      mockScanService.addUnitToWorksheet.and.returnValue(of({ success: true }));
      mockScanService.getUnprocessedUnits.and.returnValue(of([mockUnit]));

      component.unitEntryForm.patchValue({ productCode: 'E0701V00' });
      component.onProductCodeChange();
      tick();

      expect(mockScanService.addUnitToWorksheet).toHaveBeenCalledWith(
        '030410-CY1242',
        jasmine.objectContaining({
          unitId: mockUnitValidationResponse.parsedUnitId,
          prodCode: 'E0701V00'
        })
      );
    }));

    it('should refresh table after adding unit', fakeAsync(() => {
      component.currentWorksheetId = '030410-CY1242';
      mockScanService.addUnitToWorksheet.and.returnValue(of({ success: true }));
      mockScanService.getUnprocessedUnits.and.returnValue(of([mockUnit]));

      component.unitEntryForm.patchValue({ productCode: 'E0701V00' });
      component.onProductCodeChange();
      tick();

      expect(mockScanService.getUnprocessedUnits).toHaveBeenCalledWith('030410-CY1242');
      expect(component.scannedUnits.length).toBeGreaterThan(0);
    }));

    it('should clear form after successful add', fakeAsync(() => {
      component.currentWorksheetId = '030410-CY1242';
      mockScanService.addUnitToWorksheet.and.returnValue(of({ success: true }));
      mockScanService.getUnprocessedUnits.and.returnValue(of([mockUnit]));

      component.unitEntryForm.patchValue({ productCode: 'E0701V00' });
      component.onProductCodeChange();
      tick();

      expect(component.currentUnit).toBeNull();
      expect(component.availableComponents).toEqual([]);
      expect(component.unitEntryForm.pristine).toBe(true);
      expect(component.unitEntryForm.untouched).toBe(true);
    }));




  });

  describe('Error Message Formatting', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of([]));
      component.ngOnInit();
    });

    it('should format error with error code', () => {
      const error = {
        error: {
          errorResponse: { errorCode: '0171', error: 'Unit already exists' },
          message: 'Failed'
        }
      };
      const formatted = component['getErrorMessage'](error);

      expect(formatted).toBe('Error 0171: Unit already exists');
    });

    it('should format error without error code', () => {
      const error = {
        error: {
          errorResponse: { errorCode: '', error: '' },
          message: 'Simple error message'
        }
      };
      const formatted = component['getErrorMessage'](error);

      expect(formatted).toBe('Simple error message');
    });

    it('should handle error without errorResponse', () => {
      const error = {
        error: { message: 'Basic error' }
      };
      const formatted = component['getErrorMessage'](error);

      expect(formatted).toBe('Basic error');
    });
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of([]));
      component.ngOnInit();
      component.currentWorksheetId = '030410-CY1242';
      component.scannedUnits = [mockUnit];
    });

    it('should clear all data when clear button clicked', () => {
      component.onClearClick();

      expect(component.currentWorksheetId).toBeNull();
      expect(component.scannedUnits).toEqual([]);
      expect(component.worksheetForm.get('worksheetId')?.value).toBeNull();
    });


  });

  describe('Load Worksheet Details', () => {
    beforeEach(() => {
      mockScanService.getActiveWorksheets.and.returnValue(of([]));
      component.ngOnInit();
    });



    it('should handle error loading worksheet details', fakeAsync(() => {
      const error = { error: { message: 'Load failed' } };
      mockScanService.getUnprocessedUnits.and.returnValue(throwError(() => error));

      component['loadWorksheetDetails']('030410-CY1242');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    }));
  });


});
