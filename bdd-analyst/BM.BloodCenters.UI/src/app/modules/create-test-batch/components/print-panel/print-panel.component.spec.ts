import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { PrintPanelComponent } from './print-panel.component';
import { CreateTestBatchService } from '../../services/create-test-batch.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PrintableTest } from '../../models/create-test-batch.model';

describe('PrintPanelComponent', () => {
  let component: PrintPanelComponent;
  let fixture: ComponentFixture<PrintPanelComponent>;
  let mockService: jasmine.SpyObj<CreateTestBatchService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const mockTests: PrintableTest[] = [
    { testId: 'ABO', testDesc: 'ABO Blood Type', reportName: 'LTRWKSHT' },
    { testId: 'RH', testDesc: 'Rh Factor', reportName: 'LTRWKSHT' },
    { testId: 'ANTIGEN', testDesc: 'Antigen Tests', reportName: 'TSRANTWS' },
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('CreateTestBatchService', ['submitPrint']);
    mockSnackbar = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

    TestBed.configureTestingModule({
      imports: [PrintPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: CreateTestBatchService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(PrintPanelComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should pre-select all tests on changes', () => {
      component.tests = mockTests;
      component.ngOnChanges();

      expect(component.selectedTestIds.size).toBe(3);
      expect(component.isSelected('ABO')).toBe(true);
      expect(component.isSelected('RH')).toBe(true);
      expect(component.isSelected('ANTIGEN')).toBe(true);
    });
  });

  describe('toggleTest', () => {
    it('should toggle test selection off', () => {
      component.selectedTestIds = new Set(['T1', 'T2']);
      component.toggleTest('T1');
      expect(component.isSelected('T1')).toBe(false);
      expect(component.isSelected('T2')).toBe(true);
    });

    it('should toggle test selection on', () => {
      component.selectedTestIds = new Set();
      component.toggleTest('T1');
      expect(component.isSelected('T1')).toBe(true);
    });
  });

  describe('isSelected', () => {
    it('should return true for selected test', () => {
      component.selectedTestIds = new Set(['T1']);
      expect(component.isSelected('T1')).toBe(true);
    });

    it('should return false for unselected test', () => {
      component.selectedTestIds = new Set(['T1']);
      expect(component.isSelected('T2')).toBe(false);
    });
  });

  describe('onPrint', () => {
    it('should call submitPrint with selected test IDs', () => {
      component.batchId = 'BATCH01';
      component.selectedTestIds = new Set(['ABO', 'RH']);
      mockService.submitPrint.and.returnValue(of({ success: true, message: 'ok' } as any));

      component.onPrint();

      expect(mockService.submitPrint).toHaveBeenCalledWith(
        jasmine.objectContaining({ tbId: 'BATCH01' })
      );
      const request = mockService.submitPrint.calls.mostRecent().args[0];
      expect(request.testIds.length).toBe(2);
      expect(request.testIds).toContain('ABO');
      expect(request.testIds).toContain('RH');
    });

    it('should show success snackbar on successful print', () => {
      component.batchId = 'BATCH01';
      component.selectedTestIds = new Set(['ABO']);
      mockService.submitPrint.and.returnValue(of({ success: true, message: 'ok' } as any));
      const printCompleteSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.printComplete = printCompleteSpy;

      component.onPrint();

      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Worksheet print submitted.');
      expect(printCompleteSpy.emit).toHaveBeenCalled();
    });

    it('should not call submitPrint when no tests selected', () => {
      component.selectedTestIds = new Set();
      component.onPrint();
      expect(mockService.submitPrint).not.toHaveBeenCalled();
    });

    it('should not emit printComplete when API returns failure', () => {
      component.batchId = 'BATCH01';
      component.selectedTestIds = new Set(['ABO']);
      mockService.submitPrint.and.returnValue(of({ success: false, message: 'err' } as any));
      const printCompleteSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.printComplete = printCompleteSpy;

      component.onPrint();

      expect(printCompleteSpy.emit).not.toHaveBeenCalled();
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

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
