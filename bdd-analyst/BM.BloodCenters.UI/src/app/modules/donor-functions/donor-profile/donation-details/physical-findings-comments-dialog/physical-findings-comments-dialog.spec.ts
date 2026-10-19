import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { PhysicalFindingsCommentsDialogComponent } from './physical-findings-comments-dialog';
import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { PhysicalFindingsCommentsDialogData } from '../models/donation-details.model';

describe('PhysicalFindingsCommentsDialogComponent', () => {
  let component: PhysicalFindingsCommentsDialogComponent;
  let fixture: ComponentFixture<PhysicalFindingsCommentsDialogComponent>;
  let dialogRefSpy: { close: jest.Mock };
  let mockApiService: {
    getPhysicalFindingsWithDetails: jest.Mock;
  };

  const defaultPhysicalFindings = [
    { physicalCode: 'BP', physicalValue: '120/80', physicalValueRepeat: null, interCode: 'OK' },
    { physicalCode: 'TEMP', physicalValue: '98.6', physicalValueRepeat: null, interCode: null },
  ];

  const defaultDialogData: PhysicalFindingsCommentsDialogData = {
    transactionId: 'TXN001',
    chapterId: 'CH001',
    unitId: 'UNIT001',
    collDate: '2025-03-15',
    physicalFindings: defaultPhysicalFindings,
  };

  const mockApiResponse = {
    success: true,
    data: [
      {
        physicalCode: 'BP',
        codeDescription: 'Blood Pressure',
        physicalValue: '120/80',
        interCode: 'OK',
        comments: 'Normal range',
      },
      {
        physicalCode: 'TEMP',
        codeDescription: 'Temperature',
        physicalValue: '98.6',
        interCode: '',
        comments: '',
      },
    ],
  };

  function createComponent(
    dialogData?: Partial<PhysicalFindingsCommentsDialogData>,
    apiReturnValue?: any,
  ) {
    const data = { ...defaultDialogData, ...dialogData };
    dialogRefSpy = { close: jest.fn() };
    mockApiService = {
      getPhysicalFindingsWithDetails: jest.fn().mockReturnValue(apiReturnValue ?? of(mockApiResponse)),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PhysicalFindingsCommentsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: DonationDetailsApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhysicalFindingsCommentsDialogComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    createComponent();
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- ngOnInit / loadData ---

  describe('ngOnInit - loadData with unitId', () => {
    it('should call getPhysicalFindingsWithDetails with unitId and collDate', () => {
      expect(mockApiService.getPhysicalFindingsWithDetails).toHaveBeenCalledWith('UNIT001', '2025-03-15');
    });

    it('should set loading to false after API response', () => {
      expect(component.loading()).toBe(false);
    });

    it('should map API response data to mergedFindings rows', () => {
      const rows = component.mergedFindings();
      expect(rows.length).toBe(2);
      expect(rows[0]).toEqual({
        physicalCode: 'BP',
        description: 'Blood Pressure',
        physicalValue: '120/80',
        interCode: 'OK',
        comments: 'Normal range',
      });
    });

    it('should use codeDescription for description when available', () => {
      const apiData = [
        { physicalCode: 'A', codeDescription: 'Code Desc', physicalDescription: 'Phys Desc', description: 'Desc', physicalValue: 'V', interCode: 'I', comments: '' },
      ];
      createComponent(undefined, of({ data: apiData }));
      fixture.detectChanges();
      expect(component.mergedFindings()[0].description).toBe('Code Desc');
    });

    it('should fall back to physicalDescription when codeDescription is absent', () => {
      const apiData = [
        { physicalCode: 'A', physicalDescription: 'Phys Desc', description: 'Desc', physicalValue: 'V', interCode: 'I', comments: '' },
      ];
      createComponent(undefined, of({ data: apiData }));
      fixture.detectChanges();
      expect(component.mergedFindings()[0].description).toBe('Phys Desc');
    });

    it('should fall back to description when codeDescription and physicalDescription are absent', () => {
      const apiData = [
        { physicalCode: 'A', description: 'Fallback Desc', physicalValue: 'V', interCode: 'I', comments: '' },
      ];
      createComponent(undefined, of({ data: apiData }));
      fixture.detectChanges();
      expect(component.mergedFindings()[0].description).toBe('Fallback Desc');
    });

    it('should use empty string when no description fields are present', () => {
      const apiData = [
        { physicalCode: 'A', physicalValue: 'V', interCode: 'I', comments: '' },
      ];
      createComponent(undefined, of({ data: apiData }));
      fixture.detectChanges();
      expect(component.mergedFindings()[0].description).toBe('');
    });

    it('should fall back to value when physicalValue is absent', () => {
      const apiData = [
        { physicalCode: 'A', codeDescription: 'Desc', value: 'FallbackValue', interCode: 'I', comments: '' },
      ];
      createComponent(undefined, of({ data: apiData }));
      fixture.detectChanges();
      expect(component.mergedFindings()[0].physicalValue).toBe('FallbackValue');
    });

    it('should fall back to interdiction when interCode is absent', () => {
      const apiData = [
        { physicalCode: 'A', codeDescription: 'Desc', physicalValue: 'V', interdiction: 'FallbackInter', comments: '' },
      ];
      createComponent(undefined, of({ data: apiData }));
      fixture.detectChanges();
      expect(component.mergedFindings()[0].interCode).toBe('FallbackInter');
    });

    it('should use empty string defaults for null fields in API response', () => {
      const apiData = [
        { physicalCode: null, codeDescription: null, physicalValue: null, interCode: null, comments: null },
      ];
      createComponent(undefined, of({ data: apiData }));
      fixture.detectChanges();
      const row = component.mergedFindings()[0];
      expect(row.physicalCode).toBe('');
      expect(row.description).toBe('');
      expect(row.physicalValue).toBe('');
      expect(row.interCode).toBe('');
      expect(row.comments).toBe('');
    });

    it('should handle response.data being null', () => {
      createComponent(undefined, of({ data: null }));
      fixture.detectChanges();
      expect(component.mergedFindings()).toEqual([]);
      expect(component.loading()).toBe(false);
    });

    it('should handle response.data being undefined', () => {
      createComponent(undefined, of({}));
      fixture.detectChanges();
      expect(component.mergedFindings()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  // --- loadData without unitId ---

  describe('ngOnInit - loadData without unitId', () => {
    it('should not call API when unitId is null', () => {
      createComponent({ unitId: null });
      fixture.detectChanges();
      expect(mockApiService.getPhysicalFindingsWithDetails).not.toHaveBeenCalled();
    });

    it('should not call API when unitId is empty string', () => {
      createComponent({ unitId: '' });
      fixture.detectChanges();
      expect(mockApiService.getPhysicalFindingsWithDetails).not.toHaveBeenCalled();
    });

    it('should use buildFromExistingFindings when unitId is null', () => {
      createComponent({ unitId: null });
      fixture.detectChanges();
      const rows = component.mergedFindings();
      expect(rows.length).toBe(2);
      expect(rows[0].physicalCode).toBe('BP');
      expect(rows[0].physicalValue).toBe('120/80');
      expect(rows[0].interCode).toBe('OK');
      expect(rows[0].description).toBe('');
      expect(rows[0].comments).toBe('');
    });

    it('should set loading to false when unitId is null', () => {
      createComponent({ unitId: null });
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    it('should handle null physicalValue in existing findings', () => {
      createComponent({
        unitId: null,
        physicalFindings: [{ physicalCode: 'X', physicalValue: null, physicalValueRepeat: null, interCode: null }],
      });
      fixture.detectChanges();
      const rows = component.mergedFindings();
      expect(rows[0].physicalValue).toBe('');
      expect(rows[0].interCode).toBe('');
    });

    it('should handle null physicalFindings in data', () => {
      createComponent({ unitId: null, physicalFindings: null as any });
      fixture.detectChanges();
      expect(component.mergedFindings()).toEqual([]);
      expect(component.loading()).toBe(false);
    });

    it('should handle empty physicalFindings array', () => {
      createComponent({ unitId: null, physicalFindings: [] });
      fixture.detectChanges();
      expect(component.mergedFindings()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  // --- API error ---

  describe('API error fallback', () => {
    it('should fall back to buildFromExistingFindings on API error', () => {
      createComponent(undefined, throwError(() => new Error('Server error')));
      fixture.detectChanges();
      const rows = component.mergedFindings();
      expect(rows.length).toBe(2);
      expect(rows[0].physicalCode).toBe('BP');
      expect(rows[0].description).toBe('');
      expect(rows[0].comments).toBe('');
    });

    it('should set loading to false on API error', () => {
      createComponent(undefined, throwError(() => new Error('Server error')));
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });
  });

  // --- onBack ---

  describe('onBack', () => {
    it('should close the dialog without a result', () => {
      component.onBack();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  // --- onClose ---

  describe('onClose', () => {
    it('should close the dialog with "closeAll"', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    });
  });

  // --- ngOnDestroy ---

  describe('ngOnDestroy', () => {
    it('should call next on destroy$ subject', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call complete on destroy$ subject', () => {
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // --- Initial signal values ---

  describe('initial signal values', () => {
    it('should initialize loading as true before detectChanges', () => {
      createComponent();
      // Before detectChanges (ngOnInit), loading should be true
      expect(component.loading()).toBe(true);
    });

    it('should initialize mergedFindings as empty array before detectChanges', () => {
      createComponent();
      expect(component.mergedFindings()).toEqual([]);
    });
  });
});
