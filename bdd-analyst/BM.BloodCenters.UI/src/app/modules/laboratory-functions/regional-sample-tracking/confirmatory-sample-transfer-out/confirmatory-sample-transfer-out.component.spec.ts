import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';

import { ConfirmatorySampleTransferOutComponent } from './confirmatory-sample-transfer-out.component';
import { ConfirmatorySampleTransferOutApiService } from './services/confirmatory-sample-transfer-out-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitsInBoxDialogComponent } from './dialogs/units-in-box-dialog/units-in-box-dialog.component';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  BoxHeaderDto,
  BoxUnitDto,
  FacilityDropdownDto,
  SampleTypeDropdownDto,
  TestIdDropdownDto,
} from './models/confirmatory-sample-transfer-out.model';

describe('ConfirmatorySampleTransferOutComponent', () => {
  let component: ConfirmatorySampleTransferOutComponent;
  let fixture: ComponentFixture<ConfirmatorySampleTransferOutComponent>;
  let apiServiceSpy: jasmine.SpyObj<ConfirmatorySampleTransferOutApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: MatDialog;
  let router: Router;
  let chapterChangedSubject: Subject<void>;

  const mockFacilities: FacilityDropdownDto[] = [
    { code: 'LAB1', description: 'External Lab 1', isExternal: 'Y' },
    { code: 'LAB2', description: 'Internal Lab 2', isExternal: 'N' },
  ];

  const mockSampleTypes: SampleTypeDropdownDto[] = [
    { code: 'SER', description: 'Serum' },
    { code: 'PLA', description: 'Plasma' },
  ];

  const mockTestIds: TestIdDropdownDto[] = [
    { testId: 'T001', testDesc: 'HIV Test', testGroup: 'VIRAL' },
    { testId: 'T002', testDesc: 'HBV Test', testGroup: 'VIRAL' },
  ];

  const mockUnits: BoxUnitDto[] = [
    {
      sampleSeqNo: 'SEQ001',
      unitId: 'U001',
      checkDigit: null,
      collDate: '2024-01-10T00:00:00Z',
      contractId: 'CTR001',
      sampleType: 'SER',
      frozenFlag: 'N',
      tests: [{ testId: 'T001', testDesc: 'HIV Test' }],
    },
    {
      sampleSeqNo: 'SEQ002',
      unitId: 'U002',
      checkDigit: null,
      collDate: '2024-01-12T00:00:00Z',
      contractId: 'CTR002',
      sampleType: 'PLA',
      frozenFlag: 'Y',
      tests: [],
    },
  ];

  const mockBoxHeader: BoxHeaderDto = {
    boxId: 'C240010001',
    shipmentNo: 'SHIP001',
    facilityCode: 'LAB1',
    facilityDesc: 'External Lab 1',
    boxStatus: 'O',
    externalFacFlag: 'Y',
    packDate: '2024-01-15T00:00:00Z',
    closedDate: null,
    closedUser: null,
    unitCount: 2,
    units: mockUnits,
  };

  const mockInternalBox: BoxHeaderDto = {
    ...mockBoxHeader,
    boxId: 'C240010002',
    facilityCode: 'LAB2',
    facilityDesc: 'Internal Lab 2',
    externalFacFlag: 'N',
  };

  const mockOpenBoxes: BoxHeaderDto[] = [mockBoxHeader, mockInternalBox];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('ConfirmatorySampleTransferOutApiService', [
      'getActiveFacilities',
      'getActiveSampleTypes',
      'getOpenBoxes',
      'getBoxDetails',
      'getActiveTestIds',
      'closeBox',
      'createBox',
      'addUnitToBox',
      'addTestToSample',
      'validateUnit',
    ]);

    snackbarServiceSpy = createMockSnackbarService();

    const headerServiceStub = {
      chapterChanged$: chapterChangedSubject.asObservable(),
    };

    const pageHeaderServiceStub = {
      pageHeaderData: signal({ title: 'Confirmatory Sample Transfer Out', subtitle: '' }),
    };

    apiServiceSpy.getActiveFacilities.and.returnValue(of(mockFacilities));
    apiServiceSpy.getActiveSampleTypes.and.returnValue(of(mockSampleTypes));
    apiServiceSpy.getOpenBoxes.and.returnValue(of(mockOpenBoxes));
    apiServiceSpy.getBoxDetails.and.returnValue(of(mockBoxHeader));
    apiServiceSpy.getActiveTestIds.and.returnValue(of(mockTestIds));
    apiServiceSpy.closeBox.and.returnValue(of(void 0));



      TestBed.configureTestingModule({
      imports: [ConfirmatorySampleTransferOutComponent, NoopAnimationsModule],
      providers: [
        { provide: ConfirmatorySampleTransferOutApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        provideRouter([]),
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: pageHeaderServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });


    


      apiServiceSpy.getActiveFacilities.calls.reset();


      apiServiceSpy.getActiveSampleTypes.calls.reset();


      apiServiceSpy.getOpenBoxes.calls.reset();


      apiServiceSpy.getBoxDetails.calls.reset();


      apiServiceSpy.getActiveTestIds.calls.reset();


      apiServiceSpy.closeBox.calls.reset();


      apiServiceSpy.createBox.calls.reset();


      apiServiceSpy.addUnitToBox.calls.reset();


      apiServiceSpy.addTestToSample.calls.reset();


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.getActiveFacilities.and.returnValue(of(mockFacilities));


      apiServiceSpy.getActiveSampleTypes.and.returnValue(of(mockSampleTypes));


      apiServiceSpy.getOpenBoxes.and.returnValue(of(mockOpenBoxes));


      apiServiceSpy.getBoxDetails.and.returnValue(of(mockBoxHeader));


      apiServiceSpy.getActiveTestIds.and.returnValue(of(mockTestIds));


      apiServiceSpy.closeBox.and.returnValue(of(void 0));


    fixture = TestBed.createComponent(ConfirmatorySampleTransferOutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    // Get the MatDialog instance from the component (same instance the component uses)
    dialogSpy = (component as any).dialog;
    spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);


    });

  // ── Initialization ──

  describe('Initialization', () => {


    it('should initialize headerForm with empty values', () => {
      fixture.detectChanges();
      expect(component.headerForm.get('boxId')?.value).toBe('');
      expect(component.headerForm.get('shipmentNo')?.value).toBe('');
      expect(component.headerForm.get('facilityCode')?.value).toBe('');
    });

    it('should initialize entryForm with empty values', () => {
      fixture.detectChanges();
      expect(component.entryForm.get('sampleType')?.value).toBe('');
      expect(component.entryForm.get('frozen')?.value).toBe('');
      expect(component.entryForm.get('testId')?.value).toBe('');
    });

    it('should load all dropdowns on init via forkJoin', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getActiveFacilities).toHaveBeenCalled();
      expect(apiServiceSpy.getActiveSampleTypes).toHaveBeenCalled();
      expect(apiServiceSpy.getOpenBoxes).toHaveBeenCalled();
    }));

    it('should populate facilities signal', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).facilities().length).toBe(2);
    }));

    it('should populate sampleTypes signal', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).sampleTypes().length).toBe(2);
    }));

    it('should populate openBoxes signal', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).openBoxes().length).toBe(2);
    }));




  });

  // ── Unique ID Generation ──

  describe('Unique ID Generation', () => {
    it('should have a component ID matching pattern', () => {
      expect((component as any).componentId).toMatch(/^ctrout-\d+$/);
    });

    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('box-id');
      expect(id).toContain('ctrout-');
      expect(id).toContain('-box-id');
    });

    it('should produce unique IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(ConfirmatorySampleTransferOutComponent);
      const component2 = fixture2.componentInstance;
      expect((component as any).componentId).not.toBe((component2 as any).componentId);
    });
  });

  // ── Search / Filter Controls ──

  describe('Search / Filter Controls', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should return all box IDs when search is empty', fakeAsync(() => {
      component.boxIdSearchCtrl.setValue('');
      tick();
      expect(component.filteredBoxIds().length).toBe(2);
    }));



    it('should filter facilities by description', fakeAsync(() => {
      component.facilitySearchCtrl.setValue('External');
      tick();
      expect(component.filteredFacilities().length).toBe(1);
    }));



    it('should filter sample types by description', fakeAsync(() => {
      component.sampleTypeSearchCtrl.setValue('Plasma');
      tick();
      expect(component.filteredSampleTypes().length).toBe(1);
    }));

    it('should filter test IDs by testId', fakeAsync(() => {
      // testIds are loaded when an external facility box is selected; populate them for this test
      (component as any).testIds.set(mockTestIds);
      component.testIdSearchCtrl.setValue('T001');
      tick();
      expect(component.filteredTestIds().length).toBe(1);
    }));

    it('should filter test IDs by description', fakeAsync(() => {
      (component as any).testIds.set(mockTestIds);
      component.testIdSearchCtrl.setValue('HBV');
      tick();
      expect(component.filteredTestIds().length).toBe(1);
    }));

    it('should be case-insensitive when filtering', fakeAsync(() => {
      component.facilitySearchCtrl.setValue('external');
      tick();
      expect(component.filteredFacilities().length).toBe(1);
    }));
  });

  // ── Box Selection (onBoxIdChange) ──

  describe('Box Selection (onBoxIdChange)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear state when boxId is empty', () => {
      component.onBoxIdChange('');
      expect((component as any).boxHeader()).toBeNull();
      expect((component as any).units().length).toBe(0);
      expect((component as any).selectedUnit()).toBeNull();
    });

    it('should load box details for valid boxId', fakeAsync(() => {
      component.onBoxIdChange('C240010001');
      tick();
      expect(apiServiceSpy.getBoxDetails).toHaveBeenCalledWith('C240010001');
      expect((component as any).boxHeader()).toEqual(mockBoxHeader);
      expect((component as any).units().length).toBe(2);
    }));

    it('should auto-select first unit when box has units', fakeAsync(() => {
      component.onBoxIdChange('C240010001');
      tick();
      expect((component as any).selectedUnit()?.unitId).toBe('U001');
    }));

    it('should set selectedUnit to null when box has no units', fakeAsync(() => {
      apiServiceSpy.getBoxDetails.and.returnValue(of({ ...mockBoxHeader, units: [] }));
      component.onBoxIdChange('C240010001');
      tick();
      expect((component as any).selectedUnit()).toBeNull();
    }));

    it('should handle null units in box response', fakeAsync(() => {
      apiServiceSpy.getBoxDetails.and.returnValue(of({ ...mockBoxHeader, units: null }));
      component.onBoxIdChange('C240010001');
      tick();
      expect((component as any).units().length).toBe(0);
      expect((component as any).selectedUnit()).toBeNull();
    }));



    it('should show test ID dropdown for external facilities', fakeAsync(() => {
      component.onBoxIdChange('C240010001');
      tick();
      expect((component as any).showTestIdDropdown()).toBeTrue();
      expect(apiServiceSpy.getActiveTestIds).toHaveBeenCalledWith('LAB1');
    }));

    it('should hide test ID dropdown for internal facilities', fakeAsync(() => {
      apiServiceSpy.getBoxDetails.and.returnValue(of(mockInternalBox));
      component.onBoxIdChange('C240010002');
      tick();
      expect((component as any).showTestIdDropdown()).toBeFalse();
      expect((component as any).testIds().length).toBe(0);
    }));



    it('should handle error when loading box details', fakeAsync(() => {
      apiServiceSpy.getBoxDetails.and.returnValue(
        throwError(() => ({ error: { message: 'Box not found' }, message: 'Box not found' }))
      );
      component.onBoxIdChange('INVALID');
      tick();
      expect((component as any).loading()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  // ── Facility Change (onFacilityChange) ──

  describe('Facility Change (onFacilityChange)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should hide test ID dropdown when facilityCode is empty', () => {
      component.onFacilityChange('');
      expect((component as any).showTestIdDropdown()).toBeFalse();
      expect((component as any).testIds().length).toBe(0);
    });

    it('should show test ID dropdown and load tests for external facility', fakeAsync(() => {
      component.onFacilityChange('LAB1');
      tick();
      expect((component as any).showTestIdDropdown()).toBeTrue();
      expect(apiServiceSpy.getActiveTestIds).toHaveBeenCalledWith('LAB1');
    }));

    it('should hide test ID dropdown for internal facility', () => {
      component.onFacilityChange('LAB2');
      expect((component as any).showTestIdDropdown()).toBeFalse();
      expect((component as any).testIds().length).toBe(0);
    });

    it('should handle unknown facility code gracefully', () => {
      component.onFacilityChange('UNKNOWN');
      expect((component as any).showTestIdDropdown()).toBeFalse();
    });
  });

  // ── Unit Selection ──

  describe('Unit Selection', () => {
    it('should set the selected unit', () => {
      component.onSelectUnit(mockUnits[1]);
      expect((component as any).selectedUnit()).toEqual(mockUnits[1]);
    });
  });

  // ── Unit Post-Validation (onUnitPostValidate) ──

  describe('Unit Post-Validation (onUnitPostValidate)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onBoxIdChange('C240010001');
      tick();
    }));

    it('should reject duplicate unit IDs', () => {
      const rejectSpy = jasmine.createSpy('reject');
      const confirmSpy = jasmine.createSpy('confirm');

      component.onUnitPostValidate({
        data: {
          parsedUnitId: 'U001',
          checkDigit: null,
          codeScheme: 'I',
          manualUnitId: 'U001',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
          collectionDate: '2024-01-10T00:00:00Z',
        },
        confirm: confirmSpy,
        reject: rejectSpy,
      });

      expect(rejectSpy).toHaveBeenCalledWith('This Unit ID has been scanned');
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('should confirm and set collection date for new unit', () => {
      const rejectSpy = jasmine.createSpy('reject');
      const confirmSpy = jasmine.createSpy('confirm');

      // Component calls validateUnit API for non-duplicate units
      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: true,
        collDate: '2024-02-15T10:30:00Z',
        contractId: null,
        errorMessage: null,
      }));

      component.onUnitPostValidate({
        data: {
          parsedUnitId: 'U999',
          checkDigit: null,
          codeScheme: 'I',
          manualUnitId: 'U999',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
          collectionDate: '2024-02-15T10:30:00Z',
        },
        confirm: confirmSpy,
        reject: rejectSpy,
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
      expect((component as any).entryCollDate()).not.toBe('-');
    });

    it('should set entryCollDate to "-" when validation returns no collDate', () => {
      const confirmSpy = jasmine.createSpy('confirm');

      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: true,
        collDate: null,
        contractId: null,
        errorMessage: null,
      }));

      component.onUnitPostValidate({
        data: {
          parsedUnitId: 'U999',
          checkDigit: null,
          codeScheme: 'I',
          manualUnitId: 'U999',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
          collectionDate: '',
        },
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject'),
      });

      // entryCollDate stays at default '-' when API returns no collDate
      expect((component as any).entryCollDate()).toBe('-');
    });

    it('should keep entryCustomerId as "--" when validation returns no contractId', () => {
      const confirmSpy = jasmine.createSpy('confirm');

      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: true,
        collDate: '2024-02-15T10:30:00Z',
        contractId: null,
        errorMessage: null,
      }));

      component.onUnitPostValidate({
        data: {
          parsedUnitId: 'U999',
          checkDigit: null,
          codeScheme: 'I',
          manualUnitId: 'U999',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
          collectionDate: '2024-02-15T10:30:00Z',
        },
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject'),
      });

      // entryCustomerId stays at default '--' when API returns no contractId
      expect((component as any).entryCustomerId()).toBe('--');
    });
  });

  // ── Unit Validated / Cleared ──

  describe('Unit Validated / Cleared', () => {
    it('should set currentParsedUnitId on unit validated', () => {
      component.onUnitValidated({
        parsedUnitId: 'U999',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U999',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });

      expect((component as any).currentParsedUnitId()).toBe('U999');
    });

    it('should reset all entry state on unit cleared', () => {
      (component as any).entryCollDate.set('15-JAN-2024 10:00');
      (component as any).entryCustomerId.set('CTR001');
      (component as any).currentParsedUnitId.set('U001');

      component.onUnitCleared();

      expect((component as any).entryCollDate()).toBe('-');
      expect((component as any).entryCustomerId()).toBe('--');
      expect((component as any).currentParsedUnitId()).toBe('');
    });
  });

  // ── Frozen / TestId Change Triggers ──
  // ── Clear All ──

  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onBoxIdChange('C240010001');
      tick();
    }));

    it('should reset headerForm', () => {
      component.clearAll();
      expect(component.headerForm.get('boxId')?.value).toBeNull();
      expect(component.headerForm.get('shipmentNo')?.value).toBeNull();
      expect(component.headerForm.get('facilityCode')?.value).toBeNull();
    });



    it('should clear box header and units', () => {
      component.clearAll();
      expect((component as any).boxHeader()).toBeNull();
      expect((component as any).units().length).toBe(0);
      expect((component as any).selectedUnit()).toBeNull();
    });

    it('should reset entry display values', () => {
      component.clearAll();
      expect((component as any).entryCollDate()).toBe('-');
      expect((component as any).entryCustomerId()).toBe('--');
      expect((component as any).currentParsedUnitId()).toBe('');
    });

    it('should hide test ID dropdown', () => {
      component.clearAll();
      expect((component as any).showTestIdDropdown()).toBeFalse();
    });
  });

  // ── Edit Units In Box ──
  // ── Units In Box Dialog ──

  describe('Units In Box Dialog', () => {




    it('should pass current units to dialog data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onBoxIdChange('C240010001');
      tick();

      component.onUnitsInBox();

      const callArgs = dialogSpy.open.calls.mostRecent().args[1] as any;
      expect(callArgs.data.units.length).toBe(2);
    }));
  });

  // ── Close Box And Print Report ──

  describe('Close Box And Print Report', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onBoxIdChange('C240010001');
      tick();
    }));



    it('should close box and show success message', fakeAsync(() => {
      component.onCloseBoxAndPrintReport();
      tick();
      expect(apiServiceSpy.closeBox).toHaveBeenCalledWith('C240010001');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box closed successfully.');
    }));

    it('should clear all and reload dropdowns after closing', fakeAsync(() => {
      const initialCallCount = apiServiceSpy.getOpenBoxes.calls.count();
      component.onCloseBoxAndPrintReport();
      tick();
      expect((component as any).boxHeader()).toBeNull();
      expect((component as any).units().length).toBe(0);
      expect(apiServiceSpy.getOpenBoxes.calls.count()).toBeGreaterThan(initialCallCount);
    }));



    it('should handle close box error', fakeAsync(() => {
      apiServiceSpy.closeBox.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot close empty box' }, message: 'Cannot close empty box' }))
      );
      component.onCloseBoxAndPrintReport();
      tick();
      expect((component as any).loading()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  // ── Chapter Changes ──

  describe('Chapter Changes', () => {
    it('should clear all and reload dropdowns on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onBoxIdChange('C240010001');
      tick();

      const callCountBefore = apiServiceSpy.getActiveFacilities.calls.count();

      chapterChangedSubject.next();
      tick();

      expect((component as any).boxHeader()).toBeNull();
      expect((component as any).units().length).toBe(0);
      expect(apiServiceSpy.getActiveFacilities.calls.count()).toBeGreaterThan(callCountBefore);
    }));
  });

  // ── Date Formatting ──

  describe('Date Formatting', () => {
    it('should format a valid ISO date string', () => {
      const result = component.formatDate('2024-01-15T10:30:00Z');
      expect(result).toMatch(/\d{1,2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
    });

    it('should return "--" for null date', () => {
      expect(component.formatDate(null)).toBe('--');
    });

    it('should handle an unparseable date without throwing', () => {
      // new Date('not-a-date') creates Invalid Date; formatDate does not throw
      expect(() => component.formatDate('not-a-date')).not.toThrow();
    });

    it('should use correct month abbreviation', () => {
      const result = component.formatDate('2024-03-25T00:00:00Z');
      expect(result).toContain('MAR');
    });
  });

  // ── Computed Signals ──

  describe('Computed Signals', () => {
    it('should compute hasBoxSelected as false when no box', () => {
      (component as any).boxHeader.set(null);
      expect((component as any).hasBoxSelected()).toBeFalse();
    });

    it('should compute hasBoxSelected as true when box exists', () => {
      (component as any).boxHeader.set(mockBoxHeader);
      expect((component as any).hasBoxSelected()).toBeTrue();
    });

    it('should compute isEmpty correctly', () => {
      (component as any).units.set([]);
      expect((component as any).isEmpty()).toBeTrue();

      (component as any).units.set(mockUnits);
      expect((component as any).isEmpty()).toBeFalse();
    });

    it('should compute showEmptyState when no box selected', () => {
      (component as any).boxHeader.set(null);
      (component as any).units.set([]);
      expect((component as any).showEmptyState()).toBeTrue();
    });

    it('should compute showEmptyState when box selected but no units', () => {
      (component as any).boxHeader.set(mockBoxHeader);
      (component as any).units.set([]);
      expect((component as any).showEmptyState()).toBeTrue();
    });

    it('should compute unitCount', () => {
      (component as any).units.set(mockUnits);
      expect((component as any).unitCount()).toBe(2);

      (component as any).units.set([]);
      expect((component as any).unitCount()).toBe(0);
    });

    it('should compute facilityDescription from facilities list', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).selectedFacilityCode.set('LAB1');
      expect((component as any).facilityDescription()).toBe('External Lab 1');
    }));

    it('should return "--" for facilityDescription when no code', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).selectedFacilityCode.set('');
      expect((component as any).facilityDescription()).toBe('--');
    }));

    it('should return "--" for facilityDescription when code not found', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).selectedFacilityCode.set('NONEXISTENT');
      expect((component as any).facilityDescription()).toBe('--');
    }));

    it('should compute showEntryBar from selectedFacilityCode or boxHeader', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).selectedFacilityCode.set('');
      (component as any).boxHeader.set(null);
      expect((component as any).showEntryBar()).toBeFalse();

      (component as any).selectedFacilityCode.set('LAB1');
      expect((component as any).showEntryBar()).toBeTrue();
    }));
  });

  // ── Facility Code Sync ──

  describe('Facility Code Sync', () => {
    it('should update selectedFacilityCode when headerForm facilityCode changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.headerForm.get('facilityCode')!.setValue('LAB1');
      tick();

      expect((component as any).selectedFacilityCode()).toBe('LAB1');
    }));

    it('should set selectedFacilityCode to empty on null facilityCode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.headerForm.get('facilityCode')!.setValue(null);
      tick();

      expect((component as any).selectedFacilityCode()).toBe('');
    }));
  });

  // ── Destroy / Cleanup ──

  describe('Destroy / Cleanup', () => {


    it('should not process chapter changes after destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.ngOnDestroy();

      chapterChangedSubject.next();
      tick();

      expect(apiServiceSpy.getActiveFacilities.calls.count()).toBe(1);
    }));
  });

  // ── handleEntryEnterKey ──
});
