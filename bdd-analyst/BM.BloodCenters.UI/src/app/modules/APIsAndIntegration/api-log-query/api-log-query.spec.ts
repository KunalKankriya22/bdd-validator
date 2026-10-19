import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ApiLogQuery } from './api-log-query';
import { ApiLogQueryService } from './services/api-log-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ApiLogQuery', () => {
  let pageHeaderServiceSpy: any;
  let apiLogQueryServiceSpy: any;
  let component: ApiLogQuery;
  let fixture: ComponentFixture<ApiLogQuery>;
  let apiLogQueryService: jasmine.SpyObj<ApiLogQueryService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(() => {

    apiLogQueryServiceSpy = jasmine.createSpyObj('ApiLogQueryService', [
      'getSourceIds',
      'getDataSources',
      'queryApiLogs',
      'exportApiLogs'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [
      'getTitle',
      'getSubtitle',
      'getCurrentMenuItem'
    ], {
      pageHeaderData: signal(null)
    });
    const headerServiceSpy = createMockHeaderService();
    const chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [], {
      chapterLocalDate: signal(moment())
    });



      TestBed.configureTestingModule({
      imports: [
        ApiLogQuery,
        ReactiveFormsModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ApiLogQueryService, useValue: apiLogQueryServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    });


    


      apiLogQueryServiceSpy.getSourceIds.calls.reset();


      apiLogQueryServiceSpy.getDataSources.calls.reset();


      apiLogQueryServiceSpy.queryApiLogs.calls.reset();


      apiLogQueryServiceSpy.exportApiLogs.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


    apiLogQueryService = TestBed.inject(ApiLogQueryService) as jasmine.SpyObj<ApiLogQueryService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    chapterTimezoneService = TestBed.inject(ChapterTimezoneService) as jasmine.SpyObj<ChapterTimezoneService>;

    apiLogQueryService.getSourceIds.and.returnValue(of([]));
    apiLogQueryService.getDataSources.and.returnValue(of([]));

    fixture = TestBed.createComponent(ApiLogQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  describe('initializeForm validation', () => {
    it('should require sourceId', () => {
      component.filterForm.get('sourceId')!.setValue('');
      expect(component.filterForm.get('sourceId')!.hasError('required')).toBeTrue();
    });

    it('should not require fromDate', () => {
      component.filterForm.get('fromDate')!.setValue(null);
      expect(component.filterForm.get('fromDate')!.hasError('required')).toBeFalse();
    });

    it('should not require toDate', () => {
      component.filterForm.get('toDate')!.setValue(null);
      expect(component.filterForm.get('toDate')!.hasError('required')).toBeFalse();
    });



    it('should apply future date validator to fromDate', () => {
      const futureDate = moment().add(1, 'day').toDate();
      component.filterForm.get('fromDate')!.setValue(futureDate);
      expect(component.filterForm.get('fromDate')!.hasError('futureDate')).toBeTrue();
    });

    it('should apply future date validator to toDate', () => {
      const futureDate = moment().add(1, 'day').toDate();
      component.filterForm.get('toDate')!.setValue(futureDate);
      expect(component.filterForm.get('toDate')!.hasError('futureDate')).toBeTrue();
    });

    it('should apply cross-field date range validator when toDate is before fromDate', () => {
      component.filterForm.patchValue({
        fromDate: moment().toDate(),
        toDate: moment().subtract(1, 'day').toDate()
      });
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();
    });


  });



  it('should reset form values on reset', () => {
    component.filterForm.patchValue({
      sourceId: 'SFA',
      dataSourceName: 'test',
      fromDate: new Date(),
      toDate: new Date()
    });

    component.onReset();

    expect(component.filterForm.value).toEqual({
      sourceId: '',
      dataSourceName: '',
      fromDate: null,
      toDate: null
    });
    expect(component.dataSource).toEqual([]);
    expect(component.hasSearched).toBe(false);
  });








});
