import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PrintSelectedDialog } from './print-selected-dialog';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { DPAQ_ERROR_MESSAGES } from '../../models/donor-profile-audit-query.model';

describe('PrintSelectedDialog', () => {
  let component: PrintSelectedDialog;
  let fixture: ComponentFixture<PrintSelectedDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PrintSelectedDialog>>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const mockData = {
    recordNumbers: [1, 2, 3, 4, 5]
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbar = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [PrintSelectedDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrintSelectedDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate print range', () => {
    component.printForm.patchValue({
      fromRecordNumber: 5,
      toRecordNumber: 1
    });

    component.onPrint();

    expect(mockSnackbar.showError).toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should close with print range on valid selection', () => {
    component.printForm.patchValue({
      fromRecordNumber: 1,
      toRecordNumber: 3
    });

    component.onPrint();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      fromRecordNumber: 1,
      toRecordNumber: 3
    });
  });

  it('should close without data on cancel', () => {
    component.onCancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should show error when fromRecordNumber is undefined', () => {
    component.printForm.patchValue({
      fromRecordNumber: undefined,
      toRecordNumber: 3
    });

    component.onPrint();

    expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select both from and to record numbers');
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  describe('constructor', () => {
    it('should sort record numbers and set recordNumberOptions signal', () => {
      expect(component.recordNumberOptions()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should default form values to min and max of sorted records', () => {
      expect(component.printForm.get('fromRecordNumber')!.value).toBe(1);
      expect(component.printForm.get('toRecordNumber')!.value).toBe(5);
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.printForm.controls);
    });

    it('should expose fromRecordNumber and toRecordNumber controls', () => {
      expect(component.f['fromRecordNumber']).toBeDefined();
      expect(component.f['toRecordNumber']).toBeDefined();
    });
  });

  describe('onPrint', () => {
    it('should show error when fromRecordNumber is null', () => {
      component.printForm.patchValue({
        fromRecordNumber: null,
        toRecordNumber: 3
      });

      component.onPrint();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select both from and to record numbers');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show error when toRecordNumber is null', () => {
      component.printForm.patchValue({
        fromRecordNumber: 1,
        toRecordNumber: null
      });

      component.onPrint();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select both from and to record numbers');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show error when toRecordNumber is undefined', () => {
      component.printForm.patchValue({
        fromRecordNumber: 1,
        toRecordNumber: undefined
      });

      component.onPrint();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select both from and to record numbers');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show error when both values are null', () => {
      component.printForm.patchValue({
        fromRecordNumber: null,
        toRecordNumber: null
      });

      component.onPrint();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select both from and to record numbers');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show DPAQ_ERROR_MESSAGES.PRINT_INVALID_RANGE when to < from', () => {
      component.printForm.patchValue({
        fromRecordNumber: 5,
        toRecordNumber: 1
      });

      component.onPrint();

      expect(mockSnackbar.showError).toHaveBeenCalledWith(DPAQ_ERROR_MESSAGES.PRINT_INVALID_RANGE);
    });

    it('should allow equal from and to record numbers', () => {
      component.printForm.patchValue({
        fromRecordNumber: 3,
        toRecordNumber: 3
      });

      component.onPrint();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        fromRecordNumber: 3,
        toRecordNumber: 3
      });
      expect(mockSnackbar.showError).not.toHaveBeenCalled();
    });

    it('should close dialog with correct PrintRange on valid print', () => {
      component.printForm.patchValue({
        fromRecordNumber: 2,
        toRecordNumber: 4
      });

      component.onPrint();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        fromRecordNumber: 2,
        toRecordNumber: 4
      });
    });
  });

  describe('with unsorted record numbers', () => {
    let unsortedComponent: PrintSelectedDialog;
    let unsortedFixture: ComponentFixture<PrintSelectedDialog>;

    beforeEach(async () => {
      await TestBed.resetTestingModule();

      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      mockSnackbar = createMockSnackbarService();

      await TestBed.configureTestingModule({
        imports: [PrintSelectedDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: SnackbarService, useValue: mockSnackbar },
          { provide: MAT_DIALOG_DATA, useValue: { recordNumbers: [5, 3, 1, 4, 2] } }
        ]
      }).compileComponents();

      unsortedFixture = TestBed.createComponent(PrintSelectedDialog);
      unsortedComponent = unsortedFixture.componentInstance;
      unsortedFixture.detectChanges();
    });

    it('should sort record numbers in ascending order', () => {
      expect(unsortedComponent.recordNumberOptions()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should set fromRecordNumber to lowest and toRecordNumber to highest', () => {
      expect(unsortedComponent.printForm.get('fromRecordNumber')!.value).toBe(1);
      expect(unsortedComponent.printForm.get('toRecordNumber')!.value).toBe(5);
    });
  });

  describe('with empty record numbers', () => {
    let emptyComponent: PrintSelectedDialog;
    let emptyFixture: ComponentFixture<PrintSelectedDialog>;

    beforeEach(async () => {
      await TestBed.resetTestingModule();

      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      mockSnackbar = createMockSnackbarService();

      await TestBed.configureTestingModule({
        imports: [PrintSelectedDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: SnackbarService, useValue: mockSnackbar },
          { provide: MAT_DIALOG_DATA, useValue: { recordNumbers: [] } }
        ]
      }).compileComponents();

      emptyFixture = TestBed.createComponent(PrintSelectedDialog);
      emptyComponent = emptyFixture.componentInstance;
      emptyFixture.detectChanges();
    });

    it('should set recordNumberOptions to empty array', () => {
      expect(emptyComponent.recordNumberOptions()).toEqual([]);
    });

    it('should set form defaults to null when no records', () => {
      expect(emptyComponent.printForm.get('fromRecordNumber')!.value).toBeNull();
      expect(emptyComponent.printForm.get('toRecordNumber')!.value).toBeNull();
    });

    it('should show error on print when form values are null', () => {
      emptyComponent.onPrint();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select both from and to record numbers');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('with single record number', () => {
    let singleComponent: PrintSelectedDialog;
    let singleFixture: ComponentFixture<PrintSelectedDialog>;

    beforeEach(async () => {
      await TestBed.resetTestingModule();

      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      mockSnackbar = createMockSnackbarService();

      await TestBed.configureTestingModule({
        imports: [PrintSelectedDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: SnackbarService, useValue: mockSnackbar },
          { provide: MAT_DIALOG_DATA, useValue: { recordNumbers: [42] } }
        ]
      }).compileComponents();

      singleFixture = TestBed.createComponent(PrintSelectedDialog);
      singleComponent = singleFixture.componentInstance;
      singleFixture.detectChanges();
    });

    it('should set both from and to to the single record number', () => {
      expect(singleComponent.printForm.get('fromRecordNumber')!.value).toBe(42);
      expect(singleComponent.printForm.get('toRecordNumber')!.value).toBe(42);
    });

    it('should allow printing with a single record', () => {
      singleComponent.onPrint();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        fromRecordNumber: 42,
        toRecordNumber: 42
      });
    });
  });
});
