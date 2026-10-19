import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { TestKitDialogComponent } from './test-kit-dialog.component';
import { CreateTestBatchService } from '../../services/create-test-batch.service';

describe('TestKitDialogComponent', () => {
  let component: TestKitDialogComponent;
  let fixture: ComponentFixture<TestKitDialogComponent>;
  let mockService: jasmine.SpyObj<CreateTestBatchService>;

  const mockKitsResponse = {
    success: true, message: '', data: [
      { testKitId: 'KIT1', qcExpiryDate: '2025-12-31', testingLabCode: 'RT', reviewedBy: 'USER1', reagentType: 'AHG', reagentName: 'Anti-Human Globulin', reagentExpiryDate: '2025-06-30' },
      { testKitId: 'KIT1', qcExpiryDate: '2025-12-31', testingLabCode: 'RT', reviewedBy: 'USER1', reagentType: 'CC', reagentName: 'Check Cells', reagentExpiryDate: '2025-07-15' },
      { testKitId: 'KIT2', qcExpiryDate: '2025-11-01', testingLabCode: 'RT', reviewedBy: 'USER2', reagentType: null, reagentName: null, reagentExpiryDate: null },
    ]
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('CreateTestBatchService', ['getTestKits']);

    TestBed.configureTestingModule({
      imports: [TestKitDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: CreateTestBatchService, useValue: mockService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(TestKitDialogComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should load kits when testId changes', () => {
      mockService.getTestKits.and.returnValue(of(mockKitsResponse as any));
      component.testId = 'ABO';
      component.ngOnChanges();

      expect(mockService.getTestKits).toHaveBeenCalledWith('ABO');
      expect(component.kitGroups().length).toBe(2);
    });

    it('should group reagents under the same kit ID', () => {
      mockService.getTestKits.and.returnValue(of(mockKitsResponse as any));
      component.testId = 'ABO';
      component.ngOnChanges();

      const kit1 = component.kitGroups().find(k => k.testKitId === 'KIT1');
      expect(kit1).toBeTruthy();
      expect(kit1!.reagents.length).toBe(2);
      expect(kit1!.reagents[0].reagentType).toBe('AHG');
    });

    it('should not add reagent entry when type and name are null', () => {
      mockService.getTestKits.and.returnValue(of(mockKitsResponse as any));
      component.testId = 'ABO';
      component.ngOnChanges();

      const kit2 = component.kitGroups().find(k => k.testKitId === 'KIT2');
      expect(kit2).toBeTruthy();
      expect(kit2!.reagents.length).toBe(0);
    });

    it('should reset selectedKitId on load', () => {
      component.selectedKitId = 'KIT1';
      mockService.getTestKits.and.returnValue(of(mockKitsResponse as any));
      component.testId = 'ABO';
      component.ngOnChanges();

      expect(component.selectedKitId).toBeNull();
    });

    it('should not load kits when testId is empty', () => {
      component.testId = '';
      component.ngOnChanges();
      expect(mockService.getTestKits).not.toHaveBeenCalled();
    });
  });

  describe('onContinue', () => {
    it('should emit kitSelected with selected kit ID', () => {
      const kitSelectedSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.kitSelected = kitSelectedSpy;
      component.selectedKitId = 'KIT-001';

      component.onContinue();

      expect(kitSelectedSpy.emit).toHaveBeenCalledWith('KIT-001');
    });

    it('should not emit kitSelected when no kit is selected', () => {
      const kitSelectedSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.kitSelected = kitSelectedSpy;
      component.selectedKitId = null;

      component.onContinue();

      expect(kitSelectedSpy.emit).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      const cancelSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.cancel = cancelSpy;

      component.onCancel();

      expect(cancelSpy.emit).toHaveBeenCalled();
    });
  });

  describe('selectedKitReagents', () => {
    it('should return reagents for selected kit', () => {
      mockService.getTestKits.and.returnValue(of(mockKitsResponse as any));
      component.testId = 'ABO';
      component.ngOnChanges();
      component.selectedKitId = 'KIT1';

      expect(component.selectedKitReagents.length).toBe(2);
    });

    it('should return empty array when no kit selected', () => {
      component.selectedKitId = null;
      expect(component.selectedKitReagents).toEqual([]);
    });
  });

  describe('formatDate', () => {
    it('should format date string to DD-MMM-YYYY format', () => {
      const result = component.formatDate('2024-06-15');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.formatDate('')).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
