import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { CollectionGoalsByDateQuery } from './collection-goals-by-date-query';
import { CollectionGoalsByDateQueryService } from './services/collection-goals-by-date-query.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { CollectionGoalsSummaryItem } from './models/collection-goals-by-date-query.model';
import { provideRouter } from '@angular/router';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('CollectionGoalsByDateQuery', () => {
  let component: CollectionGoalsByDateQuery;
  let fixture: ComponentFixture<CollectionGoalsByDateQuery>;
  let mockService: jasmine.SpyObj<CollectionGoalsByDateQueryService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockGoalTypes = [
    { code: 'RECTR', description: 'Recruiter' },
    { code: 'TRGOL', description: 'Territory Goal' },
  ];

  const mockCustodians = [
    { custodianId: 'DAL001', custodianName: 'Dallas Chapter' },
    { custodianId: 'DAL002', custodianName: 'Houston Chapter' },
  ];

  const mockSummaryResponse: CollectionGoalsSummaryItem[] = [
    {
      goalType: 'RECTR',
      goalTypeDescription: 'Recruiter',
      goalCustodian: 'DAL123',
      totalGoalRecords: 18,
      totalGoalCount: 270,
      startDate: '2011-03-02T00:00:00',
      endDate: '2011-03-30T00:00:00',
      dayOfWeek: 'WEDNESDAY',
      byDonationType: [
        {
          donationType: 'AL',
          donationTypeDescription: 'Allogeneic',
          goalCount: 270,
        },
      ],
      byBloodType: [
        {
          bloodType: '62',
          bloodTypeDescription: 'A Pos',
          goalCount: 180,
        },
        {
          bloodType: 'ALL',
          bloodTypeDescription: 'All ABO',
          goalCount: 90,
        },
      ],
      byProcedureCode: [
        {
          procedureCode: 'PP',
          procedureCodeDescription: 'Plateletpheresis',
          goalCount: 180,
        },
        {
          procedureCode: 'WB',
          procedureCodeDescription: 'Whole Blood',
          goalCount: 90,
        },
      ],
    },
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('CollectionGoalsByDateQueryService', [
      'getGoalTypes',
      'getCustodians',
      'queryCollectionGoals',
    ]);
    mockSnackBar = createMockMatSnackBar();

    mockService.getGoalTypes.and.returnValue(of(mockGoalTypes));
    mockService.getCustodians.and.returnValue(of(mockCustodians));
    mockService.queryCollectionGoals.and.returnValue(of(mockSummaryResponse));



      TestBed.configureTestingModule({
      imports: [CollectionGoalsByDateQuery,
        ReactiveFormsModule,
        HttpClientTestingModule
        TranslateModule.forRoot(),
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule],
      providers: [
        provideRouter([]),
        { provide: CollectionGoalsByDateQueryService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: DateAdapter, useClass: MomentDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
      ],
    });


    


      mockService.getGoalTypes.calls.reset();


      mockService.getCustodians.calls.reset();


      mockService.queryCollectionGoals.calls.reset();


      mockService.getGoalTypes.and.returnValue(of(mockGoalTypes));


      mockService.getCustodians.and.returnValue(of(mockCustodians));


      mockService.queryCollectionGoals.and.returnValue(of(mockSummaryResponse));


    fixture = TestBed.createComponent(CollectionGoalsByDateQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should load goal types on init', () => {
    expect(mockService.getGoalTypes).toHaveBeenCalled();
    expect(component.goalTypes).toEqual(mockGoalTypes);
  });

  it('should have goalsFor field disabled initially', () => {
    expect(component.filterForm.get('goalsFor')?.disabled).toBeTrue();
  });



  it('should load custodians when goalType changes', fakeAsync(() => {
    component.filterForm.get('goalType')?.setValue('RECTR');
    tick();
    fixture.detectChanges();

    expect(component.custodians).toEqual(mockCustodians);
  }));

  it('should disable retrieve button when form is incomplete', () => {
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should enable retrieve button when form is complete', fakeAsync(() => {
    component.filterForm.get('goalType')?.setValue('RECTR');
    tick();
    component.filterForm.get('goalsFor')?.setValue('DAL001');
    component.filterForm.get('fromDate')?.setValue(new Date('2025-01-01'));
    component.filterForm.get('toDate')?.setValue(new Date('2025-12-31'));
    fixture.detectChanges();

    expect(component.isRetrieveDisabled).toBeFalse();
  }));

  it('should call queryCollectionGoals when retrieve is clicked', fakeAsync(() => {
    component.filterForm.get('goalType')?.setValue('RECTR');
    tick();
    component.filterForm.get('goalsFor')?.setValue('DAL001');
    component.filterForm.get('fromDate')?.setValue(new Date('2025-01-01'));
    component.filterForm.get('toDate')?.setValue(new Date('2025-12-31'));
    fixture.detectChanges();

    component.onRetrieve();
    tick();

    expect(mockService.queryCollectionGoals).toHaveBeenCalled();
    expect(component.dataSource.length).toBeGreaterThan(0);
    expect(component.territoryName).toBe('Dallas Chapter');
    expect(component.showEmptyState).toBeFalse();
  }));

  it('should display territory header when data is loaded', fakeAsync(() => {
    component.filterForm.get('goalType')?.setValue('RECTR');
    tick();
    component.filterForm.get('goalsFor')?.setValue('DAL001');
    component.filterForm.get('fromDate')?.setValue(new Date('2025-01-01'));
    component.filterForm.get('toDate')?.setValue(new Date('2025-12-31'));

    component.onRetrieve();
    tick();
    fixture.detectChanges();

    expect(component.territoryName).toBe('Dallas Chapter');
  }));







  it('should not show pagination', () => {
    expect(component.tableConfig.showPagination).toBeFalse();
  });



  it('should format day of week correctly', fakeAsync(() => {
    component.filterForm.get('goalType')?.setValue('RECTR');
    tick();
    component.filterForm.get('goalsFor')?.setValue('DAL001');
    component.filterForm.get('fromDate')?.setValue(new Date('2025-01-01'));
    component.filterForm.get('toDate')?.setValue(new Date('2025-12-31'));
    component.onRetrieve();
    tick();

    expect(component.dataSource[0].day).toBe('Wednesday');
  }));
});
