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
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { FilterLabMasterCodesComponent } from './filter-lab-master-codes';

describe('FilterLabMasterCodesComponent', () => {
  let component: FilterLabMasterCodesComponent;
  let fixture: ComponentFixture<FilterLabMasterCodesComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilterLabMasterCodesComponent>>;

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [
        FilterLabMasterCodesComponent,
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
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(FilterLabMasterCodesComponent);
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

      expect(mockDialogRef.close).toHaveBeenCalledWith(component.filterForm.value);
    });
  });
  describe('ngOnInit with data', () => {
    it('should patch form with provided data', () => {
      const mockData = {
        effectiveDatePeriod: 'BEFORE',
        effectiveDate: new Date('2025-01-11')
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          FilterLabMasterCodesComponent,
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
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockData },
          { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
          { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting()
        ]
      });

      fixture = TestBed.createComponent(FilterLabMasterCodesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('BEFORE');
    });
  });
});
