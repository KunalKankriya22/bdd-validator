import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FilterDonorMasterCodesComponent } from '../filter-donor-master-codes/filter-donor-master-codes';

describe('FilterDonorMasterCodesComponent', () => {
  let component: FilterDonorMasterCodesComponent;
  let fixture: ComponentFixture<FilterDonorMasterCodesComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilterDonorMasterCodesComponent>>;

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [
        FilterDonorMasterCodesComponent,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(FilterDonorMasterCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('onApply', () => {
    it('should close dialog with form values', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-11'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-01-26')
      });

      component.onApply();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectiveDatePeriod: 'AFTER',
          terminationDatePeriod: 'BEFORE'
        })
      );
      const callArgs = mockDialogRef.close.calls.mostRecent().args[0];
      expect(callArgs.effectiveDate instanceof Date).toBe(true);
      expect(callArgs.terminationDate instanceof Date).toBe(true);
    });
  });
  describe('ngOnInit with data', () => {
    it('should patch form with provided data', () => {
      const mockData = {
        effectiveDatePeriod: 'BEFORE',
        effectiveDateFrom: new Date('2025-01-11')
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          FilterDonorMasterCodesComponent,
          ReactiveFormsModule,
          FormsModule,
          MatDialogModule,
          MatFormFieldModule,
          MatSelectModule,
          MatDatepickerModule,
          MatNativeDateModule,
          MatInputModule,
          MatButtonModule,
          MatIconModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockData }
        ]
      });

      fixture = TestBed.createComponent(FilterDonorMasterCodesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('BEFORE');
    });
  });
  describe('Form Validation', () => {
    it('should accept valid BEFORE period value', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('BEFORE');
      expect(component.filterForm.get('effectiveDatePeriod')?.valid).toBe(true);
    });

    it('should accept valid AFTER period value', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('AFTER');
      expect(component.filterForm.get('terminationDatePeriod')?.valid).toBe(true);
    });

    it('should allow searchKeyword to be optional', () => {
      component.filterForm.get('searchKeyword')?.setValue('');
      expect(component.filterForm.get('searchKeyword')?.valid).toBe(true);
    });


  });

  describe('Filter Application', () => {
    it('should apply complete filter values', () => {
      const testDate = new Date('2025-01-15');
      component.filterForm.patchValue({
        searchKeyword: 'APITY',
        effectiveDate: testDate,
        terminationDate: testDate,
        effectiveDatePeriod: 'BEFORE',
        terminationDatePeriod: 'AFTER'
      });

      component.onApply();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          searchKeyword: 'APITY',
          effectiveDatePeriod: 'BEFORE',
          terminationDatePeriod: 'AFTER'
        })
      );
      const callArgs = mockDialogRef.close.calls.mostRecent().args[0];
      expect(callArgs.effectiveDate instanceof Date).toBe(true);
      expect(callArgs.terminationDate instanceof Date).toBe(true);
    });



  });

  describe('Clear Functionality', () => {
    it('should clear all fields except default period values', () => {
      component.filterForm.patchValue({
        searchKeyword: 'test',
        effectiveDate: new Date(),
        terminationDate: new Date(),
        effectiveDatePeriod: 'BEFORE',
        terminationDatePeriod: 'AFTER'
      });

      component.onClear();

      expect(['', null]).toContain(component.filterForm.get('searchKeyword')?.value as any);
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });


  });
});