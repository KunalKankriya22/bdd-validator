import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FilterDistributionMasterCodesComponent } from '../filter-distribution-master-codes/filter-distribution-master-codes';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('FilterDistributionMasterCodesComponent', () => {
  let component: FilterDistributionMasterCodesComponent;
  let fixture: ComponentFixture<FilterDistributionMasterCodesComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilterDistributionMasterCodesComponent>>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        FilterDistributionMasterCodesComponent,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule],
      providers: [
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(FilterDistributionMasterCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('ngOnInit with data', () => {
    it('should patch form with provided data', () => {
      const mockData = {
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-11')
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          FilterDistributionMasterCodesComponent,
          ReactiveFormsModule,
          FormsModule,
          MatDialogModule,
          MatFormFieldModule,
          MatSelectModule,
          MatDatepickerModule,
          MatInputModule,
          MatButtonModule,
          MatIconModule],
        providers: [
          { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
          { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockData }
        ]
      });

      fixture = TestBed.createComponent(FilterDistributionMasterCodesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    });
  });

  describe('Period Validation', () => {
    it('should require effective date period when effective date is set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: null
      });

      (component as any).validateEffectiveDatePeriod();
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should not require effective date period when effective date is not set', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });

      (component as any).validateEffectiveDatePeriod();
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should not require effective date period when both date and period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER'
      });

      (component as any).validateEffectiveDatePeriod();
      fixture.detectChanges();

      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should require termination date period when termination date is set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2025-01-26'),
        terminationDatePeriod: null
      });

      (component as any).validateTerminationDatePeriod();
      fixture.detectChanges();

      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should not require termination date period when termination date is not set', () => {
      component.filterForm.patchValue({
        terminationDate: null,
        terminationDatePeriod: null
      });

      (component as any).validateTerminationDatePeriod();
      fixture.detectChanges();

      expect(component.terminationDatePeriodError).toBe('');
    });
  });
});
