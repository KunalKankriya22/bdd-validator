import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';

import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { DeferralsPendingAuditQuery } from './deferrals-pending-audit-query';
import { DeferralsPendingAuditQueryService } from './services/deferrals-pending-audit-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DeferralsPendingAuditQuery', () => {
  let chapterTimezoneSpy: any;
  let serviceSpy: any;
  let component: DeferralsPendingAuditQuery;
  let fixture: ComponentFixture<DeferralsPendingAuditQuery>;
  let mockService: jasmine.SpyObj<DeferralsPendingAuditQueryService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: Router;
  let chapterChanged$: Subject<void>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('DeferralsPendingAuditQueryService', [
      'searchDeferralsPendingAudit',
      'getDrivesDropdown'
    ]);
    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        title: 'Deferrals Pending Audit Query',
        subtitle: 'Search for deferrals pending audit'
      })
    });
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate'
    ], {
      chapterLocalDate: signal(moment())
    });
    const headerServiceSpy = createMockHeaderService();
    const snackBarSpy = createMockMatSnackBar();

    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());

    serviceSpy.getDrivesDropdown.and.returnValue(of({ data: [] }));



      TestBed.configureTestingModule({
      imports: [DeferralsPendingAuditQuery,
        ReactiveFormsModule,
        NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DeferralsPendingAuditQueryService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });


    


      serviceSpy.searchDeferralsPendingAudit.calls.reset();


      serviceSpy.getDrivesDropdown.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());


      serviceSpy.getDrivesDropdown.and.returnValue(of({ data: [] }));


    mockService = TestBed.inject(DeferralsPendingAuditQueryService) as jasmine.SpyObj<DeferralsPendingAuditQueryService>;
    mockPageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    mockChapterTimezoneService = TestBed.inject(ChapterTimezoneService) as jasmine.SpyObj<ChapterTimezoneService>;
    mockHeaderService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    mockRouter = TestBed.inject(Router);

    fixture = TestBed.createComponent(DeferralsPendingAuditQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should not load drives on init when dates are empty', () => {
    expect(component.filterForm.get('fromDate')?.value).toBeNull();
    expect(component.filterForm.get('toDate')?.value).toBeNull();
  });
  describe('onClearAll', () => {
    it('should reset form and data', () => {
      // Arrange
      component.dataSource = [
        {
          driveId: 'D001',
          deferralId: 'DEF001',
          transactionId: 'T001',
          driveDate: '2024-01-15',
          donorId: 'DN001',
          donationType: 'WB',
          procedureCode: 'P001',
          user: 'User1',
          insertedDate: '2024-01-15T10:00:00'
        }
      ];
      component.hasRetrievedData = true;

      // Act
      component.onClearAll();

      // Assert
      expect(component.dataSource).toEqual([]);
      expect(component.hasRetrievedData).toBe(false);
      expect(component.filterForm.get('driveId')?.value).toBeFalsy();
      expect(component.filterForm.get('status')?.value).toBe('R');
    });
  });

  describe('onSearch', () => {
    it('should update search keyword and trigger retrieve', () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: [],
          donationType: [],
          procedureCode: []
        },
        totalCount: 0
      };
      mockService.searchDeferralsPendingAudit.and.returnValue(of(mockResponse));
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31')
      });
      spyOn(component, 'onRetrieve');

      // Act
      component.onSearch('test');

      // Assert
      expect(component.searchKeyword).toBe('test');
      expect(component.onRetrieve).toHaveBeenCalled();
    });
  });

  describe('filter panel', () => {




    it('should apply filters', () => {
      // Arrange
      component.filterPanelForm.patchValue({
        donationType: 'WB',
        procedureCode: '001'
      });
      component.hasRetrievedData = true;
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: [],
          donationType: [],
          procedureCode: []
        },
        totalCount: 0
      };
      mockService.searchDeferralsPendingAudit.and.returnValue(of(mockResponse));
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31')
      });

      // Act
      component.onApplyFilters();

      // Assert
      expect(component.appliedDonationType).toBe('WB');
      expect(component.appliedProcedureCode).toBe('001');
      expect(component.showFilterPanel).toBe(false);
    });


  });
});
