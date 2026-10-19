import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AdditionalBandsDialogComponent, AdditionalBandsDialogData } from './additional-bands-dialog';
import { TestBandDto, AdditionalBandDto } from '../../models/verify-test-observations-tech2.model';
import { VerifyTestObservationsTech2ApiService } from '../../services/verify-test-observations-tech2-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AdditionalBandsDialogComponent', () => {
  let component: AdditionalBandsDialogComponent;
  let fixture: ComponentFixture<AdditionalBandsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AdditionalBandsDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<VerifyTestObservationsTech2ApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockTestBands: TestBandDto[] = [
    { bandSeq: 1, bandName: 'riba1' },
    { bandSeq: 2, bandName: 'riba2' },
    { bandSeq: 3, bandName: 'riba3' }
  ];

  const mockAdditionalBands: AdditionalBandDto[] = [
    { band1: 'riba1', band2: 'riba2' }
  ];

  const mockDialogData: AdditionalBandsDialogData = {
    unitId: 'W12342402705-Q',
    testBands: mockTestBands,
    additionalBands: mockAdditionalBands,
    tbId: 'TB001',
    testId: 'TEST001',
    tbSeqNo: 1,
    testType: 'M'
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('VerifyTestObservationsTech2ApiService', [
      'saveOtherBands',
      'deleteOtherBands'
    ]);
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.saveOtherBands.and.returnValue(of({ success: true, statusCode: 200, message: 'OK' }));
    apiServiceSpy.deleteOtherBands.and.returnValue(of(undefined));

      TestBed.configureTestingModule({
      imports: [AdditionalBandsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: VerifyTestObservationsTech2ApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });

    

      dialogRefSpy.close.calls.reset();

      apiServiceSpy.saveOtherBands.calls.reset();

      apiServiceSpy.deleteOtherBands.calls.reset();

      apiServiceSpy.saveOtherBands.and.returnValue(of({ success: true, statusCode: 200, message: 'OK' }));

      apiServiceSpy.deleteOtherBands.and.returnValue(of(undefined));

    fixture = TestBed.createComponent(AdditionalBandsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  describe('Initialization', () => {

    it('should initialize with dialog data', () => {
      expect((component as any).testBands()).toEqual(mockTestBands);
      expect((component as any).unitId()).toBe('W12342402705-Q');
    });

    it('should initialize form with existing bands plus one empty row', () => {
      // initForm adds each existing band then appends one empty row
      expect(component.bandsArray.length).toBe(2);
      expect(component.bandsArray.at(0).getRawValue()).toEqual({
        band1: 'riba1',
        band2: 'riba2'
      });
    });

    it('should initialize form with one empty row if no existing bands', () => {
      // Re-invoke initForm with empty additional bands
      (component as any).initForm([]);

      expect(component.bandsArray.length).toBe(1);
      expect(component.bandsArray.at(0).getRawValue()).toEqual({
        band1: '',
        band2: ''
      });
    });
  });

  describe('Band Management', () => {
    it('should add band with provided data', () => {
      const bandData: AdditionalBandDto = {
        band1: 'riba2',
        band2: 'riba3'
      };

      component.addBand(bandData);

      const lastIndex = component.bandsArray.length - 1;
      expect(component.bandsArray.at(lastIndex).getRawValue()).toEqual(bandData);
    });
  });

  describe('Clear All', () => {
    it('should clear all bands and add one empty row', () => {
      component.addBand();
      component.addBand();

      component.onClearAll();

      expect(component.bandsArray.length).toBe(1);
      expect(component.bandsArray.at(0).getRawValue()).toEqual({
        band1: '',
        band2: ''
      });
    });

    it('should call deleteOtherBands API', () => {
      component.onClearAll();

      expect(apiServiceSpy.deleteOtherBands).toHaveBeenCalledWith(
        'TB001', 'TEST001', 'W12342402705-Q', 1
      );
    });
  });

  describe('Band2 Auto-Calculation', () => {
    it('should auto-calculate band2 when band1 changes', () => {
      const bandGroup = component.bandsArray.at(0);
      bandGroup.get('band1')?.setValue('riba2');

      // riba2 has bandSeq=2, next is riba3 (bandSeq=3)
      expect(bandGroup.getRawValue().band2).toBe('riba3');
    });

    it('should clear band2 when band1 is cleared', () => {
      const bandGroup = component.bandsArray.at(0);
      bandGroup.get('band1')?.setValue('');

      expect(bandGroup.getRawValue().band2).toBe('');
    });
  });

  describe('Add Action', () => {
    it('should close dialog with band data when bands have values', () => {
      // Bands already initialized with mockAdditionalBands
      component.onAdd();

      expect(apiServiceSpy.saveOtherBands).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalled();
      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result).toEqual([{ band1: 'riba1', band2: 'riba2' }]);
    });
  });
  describe('UI Display', () => {
    it('should display unit ID', () => {
      const unitIdElement = fixture.nativeElement.querySelector('.unit-id-value');

      expect(unitIdElement.textContent.trim()).toBe('W12342402705-Q');
    });

    it('should display select dropdowns for bands', () => {
      const selects = fixture.nativeElement.querySelectorAll('mat-select');

      expect(selects.length).toBeGreaterThan(0);
    });
  });
});
