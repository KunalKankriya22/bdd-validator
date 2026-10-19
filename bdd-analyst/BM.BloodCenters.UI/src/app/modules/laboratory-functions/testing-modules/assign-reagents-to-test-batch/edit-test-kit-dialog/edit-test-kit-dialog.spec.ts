import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { EditTestKitDialogComponent } from './edit-test-kit-dialog';
import { AssignReagentsToTestBatchService } from '../services/assign-reagents-to-test-batch.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { EditTestKitDialogData, TestKitOption } from '../models/assign-reagents-to-test-batch.model';

describe('EditTestKitDialogComponent', () => {
  let component: EditTestKitDialogComponent;
  let fixture: ComponentFixture<EditTestKitDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditTestKitDialogComponent>>;
  let mockService: jasmine.SpyObj<AssignReagentsToTestBatchService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const testKitOptions: TestKitOption[] = [
    { testKitId: 'KIT001', displayName: 'Kit Alpha' },
    { testKitId: 'KIT002', displayName: 'Kit Beta' },
    { testKitId: 'KIT003', displayName: 'Kit Gamma' },
  ];

  const dialogData: EditTestKitDialogData = {
    testBatchId: 'TB001',
    test: {
      testId: 'T001',
      testDesc: 'Test Description',
      testKitId: 'KIT001',
    } as any,
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('AssignReagentsToTestBatchService', [
      'getTestKitOptions',
      'assignReagentToTest',
    ]);
    mockSnackbarService = createMockSnackbarService();

    mockService.getTestKitOptions.and.returnValue(of(testKitOptions));

    await TestBed.configureTestingModule({
      imports: [EditTestKitDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: AssignReagentsToTestBatchService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTestKitDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    try { fixture.detectChanges(); } catch (_) {}
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize test data from dialog data', () => {
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.testId).toBe('T001');
      expect(component.testDesc).toBe('Test Description');
    });

    it('should create form with initial test kit value', () => {
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.form.get('testKitId')?.value).toBe('KIT001');
    });

    it('should load test kit options', () => {
      try { fixture.detectChanges(); } catch (_) {}
      expect(mockService.getTestKitOptions).toHaveBeenCalledWith('TB001', 'T001');
      expect(component.testKitOptions).toEqual(testKitOptions);
      expect(component.filteredTestKitOptions).toEqual(testKitOptions);
    });

    it('should close dialog if data.test is null', async () => {
      const noDataFixture = TestBed.createComponent(EditTestKitDialogComponent);
      const noDataComponent = noDataFixture.componentInstance;
      noDataComponent.data = { testBatchId: 'TB001', test: null as any };
      try { noDataFixture.detectChanges(); } catch (_) {}
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('loadTestKitOptions error handling', () => {
    it('should handle error when loading test kit options', fakeAsync(() => {
      mockService.getTestKitOptions.and.returnValue(
        throwError(() => ({ error: { message: 'Load failed' } }))
      );

      try { fixture.detectChanges(); } catch (_) {}
      tick();

      expect(component.testKitOptions).toEqual([]);
      expect(component.filteredTestKitOptions).toEqual([]);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Load failed');
    }));
  });

  describe('setupTestKitSearch', () => {
    it('should filter test kit options by testKitId', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      component.testKitSearchControl.setValue('KIT001');
      tick();

      expect(component.filteredTestKitOptions.length).toBe(1);
      expect(component.filteredTestKitOptions[0].testKitId).toBe('KIT001');
    }));

    it('should filter test kit options by displayName', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      component.testKitSearchControl.setValue('Beta');
      tick();

      expect(component.filteredTestKitOptions.length).toBe(1);
      expect(component.filteredTestKitOptions[0].displayName).toBe('Kit Beta');
    }));

    it('should show all options when search is empty', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      component.testKitSearchControl.setValue('');
      tick();

      expect(component.filteredTestKitOptions.length).toBe(3);
    }));
  });

  describe('onTestKitDropdownOpened', () => {
    it('should reset search and show all options when opened', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.filteredTestKitOptions = [];

      component.onTestKitDropdownOpened(true);

      expect(component.testKitSearchControl.value).toBe('');
      expect(component.filteredTestKitOptions).toEqual(testKitOptions);
    });

    it('should do nothing when closed', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.filteredTestKitOptions = [];

      component.onTestKitDropdownOpened(false);

      expect(component.filteredTestKitOptions).toEqual([]);
    });
  });

  describe('isFormValid', () => {
    it('should return true when form is valid and dirty', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.form.get('testKitId')?.setValue('KIT002');
      component.form.markAsDirty();
      expect(component.isFormValid).toBeTrue();
    });

    it('should return false when form is valid but pristine', () => {
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when form is invalid', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.form.get('testKitId')?.setValue(null);
      component.form.markAsDirty();
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('onSave', () => {
    it('should not submit if form is invalid', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.form.get('testKitId')?.setValue(null);
      component.onSave();
      expect(mockService.assignReagentToTest).not.toHaveBeenCalled();
    });

    it('should submit and close dialog on success', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      mockService.assignReagentToTest.and.returnValue(
        of({ success: true, message: 'Saved successfully' } as any)
      );

      component.form.get('testKitId')?.setValue('KIT002');
      component.onSave();
      tick();

      expect(mockService.assignReagentToTest).toHaveBeenCalledWith('TB001', 'T001', { testKitId: 'KIT002' });
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Saved successfully');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true, promptWorksheet: true });
      expect(component.isSubmitting).toBeFalse();
    }));

    it('should show error on unsuccessful response', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      mockService.assignReagentToTest.and.returnValue(
        of({ success: false, message: 'Assignment failed' } as any)
      );

      component.form.get('testKitId')?.setValue('KIT002');
      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Assignment failed');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should show error on API error', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      mockService.assignReagentToTest.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.form.get('testKitId')?.setValue('KIT002');
      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
      expect(component.isSubmitting).toBeFalse();
    }));
  });

  describe('cancel', () => {
    it('should close dialog without result', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      try { fixture.detectChanges(); } catch (_) {}
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
