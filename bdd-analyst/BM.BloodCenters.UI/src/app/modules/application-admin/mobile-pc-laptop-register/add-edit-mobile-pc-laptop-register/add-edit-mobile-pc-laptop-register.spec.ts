import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AddEditMobilePcLaptopRegister } from './add-edit-mobile-pc-laptop-register';
import { MobilePcLaptopRegisterService } from '../services/mobile-pc-laptop-register.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { of, throwError } from 'rxjs';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditMobilePcLaptopRegister', () => {
  let component: AddEditMobilePcLaptopRegister;
  let fixture: ComponentFixture<AddEditMobilePcLaptopRegister>;
  let mockService: jasmine.SpyObj<MobilePcLaptopRegisterService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('MobilePcLaptopRegisterService', [
      'getChapters',
      'addMobilePcLaptopRegister',
      'updateMobilePcLaptopRegister'
    ]);

    mockSnackbarService = createMockSnackbarService();

    mockService.getChapters.and.returnValue(of([
      { chapterId: 'CH001', chapterName: 'Chapter 1' },
      { chapterId: 'CH002', chapterName: 'Chapter 2' }
    ]));
    mockService.addMobilePcLaptopRegister.and.returnValue(of({}));
    mockService.updateMobilePcLaptopRegister.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        AddEditMobilePcLaptopRegister,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MobilePcLaptopRegisterService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditMobilePcLaptopRegister);
    component = fixture.componentInstance;
    component.chapters = [
      { chapterId: 'CH001', chapterName: 'Chapter 1' },
      { chapterId: 'CH002', chapterName: 'Chapter 2' }
    ];
    fixture.detectChanges();
  });

  // Gap 3 fix: Audit Increment 0 is now valid (Oracle allows >= 0, not just > 0)
  it('should accept auditIncrement of 0 as valid', () => {
    component.form.patchValue({
      chapterId: 'CH001',
      newLaptopId: 'SRV01',
      temporaryId: 'A1',
      location: 'LAB1',
      auditIncrement: 0
    });

    expect(component.form.get('auditIncrement')?.hasError('min')).toBeFalsy();
  });

  it('should reject auditIncrement of -1 as invalid', () => {
    component.form.patchValue({ auditIncrement: -1 });

    expect(component.form.get('auditIncrement')?.hasError('min')).toBeTrue();
  });

  it('should require auditIncrement field', () => {
    component.form.patchValue({
      chapterId: 'CH001',
      newLaptopId: 'SRV01',
      temporaryId: 'A1',
      location: 'LAB1',
      auditIncrement: null
    });

    expect(component.form.get('auditIncrement')?.hasError('required')).toBeTrue();
  });

  // Gap 4 fix: Location field must be forced to uppercase (matches Oracle CaseRestriction=Upper on COL_1)
  it('should convert location to uppercase via toUpperCase method', () => {
    const control = component.form.get('location');
    control?.setValue('test location');
    component.toUpperCase('location');

    expect(control?.value).toBe('TEST LOCATION');
  });

  it('should handle save error and reset saving state', () => {
    mockService.addMobilePcLaptopRegister.and.returnValue(
      throwError(() => ({ error: { message: 'Test error' } }))
    );

    component.mode = 'add';
    component.form.patchValue({
      chapterId: 'CH001',
      newLaptopId: 'SRV01',
      temporaryId: 'A1',
      location: 'Lab-1'
    });

    component.onSave();

    // Service handles error display globally with MatSnackBar
    expect(component.isSaving).toBeFalse();
  });

  it('should detect unsaved changes', () => {
    expect(component.hasUnsavedChanges()).toBeFalse();

    component.form.markAsDirty();

    expect(component.hasUnsavedChanges()).toBeTrue();
  });
});
